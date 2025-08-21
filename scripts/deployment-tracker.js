#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Dynatrace configuration from environment variables
const DYNATRACE_ENDPOINT = process.env.DYNATRACE_ENDPOINT || 'https://bos01241.live.dynatrace.com/platform/ingest/custom/events/finbuddy';
const DYNATRACE_TOKEN = process.env.DYNATRACE_TOKEN || process.env.DYNATRACE_API_TOKEN;

// Validate required environment variables
if (!DYNATRACE_TOKEN) {
  console.error('❌ DYNATRACE_TOKEN environment variable is required');
  console.error('   Set DYNATRACE_TOKEN or DYNATRACE_API_TOKEN environment variable');
  console.error('   Example: export DYNATRACE_TOKEN="dt0c01.YOUR_TOKEN_HERE"');
  process.exit(1);
}

// Get deployment information
function getDeploymentInfo() {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const deploymentTimestamp = new Date().toISOString();
  const deploymentId = Date.now();
  
  let gitInfo = {};
  try {
    gitInfo = {
      commit: execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim(),
      branch: execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim(),
      author: execSync('git log -1 --pretty=format:"%an"', { encoding: 'utf8' }).trim(),
      message: execSync('git log -1 --pretty=format:"%s"', { encoding: 'utf8' }).trim(),
    };
  } catch (error) {
    console.warn('Git information not available:', error.message);
    gitInfo = {
      commit: 'unknown',
      branch: 'unknown',
      author: 'unknown',
      message: 'unknown'
    };
  }

  return {
    deploymentId,
    deploymentTimestamp,
    projectName: packageJson.name,
    version: packageJson.version,
    gitInfo,
    environment: process.env.NODE_ENV || process.env.AZURE_ENV || 'production',
    platform: process.platform,
    nodeVersion: process.version,
    azureAppName: process.env.AZURE_APP_NAME || 'finbuddy-app',
    azureResourceGroup: process.env.AZURE_RESOURCE_GROUP || 'finbuddy-rg'
  };
}

// Send event to Dynatrace
async function sendToDynatrace(eventData) {
  try {
    const response = await fetch(DYNATRACE_ENDPOINT, {
      method: 'POST',
      headers: {
        'accept': '*/*',
        'Authorization': `Api-Token ${DYNATRACE_TOKEN}`,
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify([eventData])
    });

    if (response.ok) {
      console.log('✅ Deployment event sent to Dynatrace successfully');
      const responseText = await response.text();
      if (responseText) {
        console.log('Response:', responseText);
      }
    } else {
      console.error('❌ Failed to send deployment event to Dynatrace:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText);
    }
  } catch (error) {
    console.error('❌ Error sending deployment event to Dynatrace:', error);
  }
}

// Execute Azure deployment and track results
async function executeDeploymentWithTracking() {
  const deploymentInfo = getDeploymentInfo();
  const startTime = Date.now();
  
  console.log(`🚀 Starting Azure deployment for ${deploymentInfo.projectName} v${deploymentInfo.version}`);
  console.log(`📋 Deployment ID: ${deploymentInfo.deploymentId}`);
  console.log(`🌿 Branch: ${deploymentInfo.gitInfo.branch}`);
  console.log(`📝 Commit: ${deploymentInfo.gitInfo.commit.substring(0, 8)}`);
  console.log(`☁️ Azure App: ${deploymentInfo.azureAppName}`);
  
  let deploymentSuccess = false;
  let deploymentError = null;
  let deploymentOutput = '';
  let deploymentUrl = '';
  
  try {
    // Check if Azure CLI is available
    try {
      execSync('az --version', { encoding: 'utf8', stdio: 'pipe' });
    } catch (error) {
      throw new Error('Azure CLI not found. Please install Azure CLI and login with "az login"');
    }

    // Get Azure app info
    const appName = deploymentInfo.azureAppName;
    const resourceGroup = deploymentInfo.azureResourceGroup;
    
    console.log('📦 Building application...');
    execSync('npm run build', { encoding: 'utf8', stdio: 'inherit' });
    
    console.log('☁️ Deploying to Azure App Service...');
    
    // Deploy using Azure CLI
    const deployCommand = process.env.AZURE_DEPLOY_COMMAND || 
      `az webapp deploy --resource-group ${resourceGroup} --name ${appName} --src-path . --type zip --async false`;
    
    console.log(`Executing: ${deployCommand}`);
    deploymentOutput = execSync(deployCommand, { 
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 600000 // 10 minutes timeout
    });
    
    // Get the deployment URL
    try {
      const appInfo = execSync(`az webapp show --resource-group ${resourceGroup} --name ${appName} --query "defaultHostName" --output tsv`, {
        encoding: 'utf8',
        stdio: 'pipe'
      }).trim();
      deploymentUrl = `https://${appInfo}`;
    } catch (error) {
      deploymentUrl = `https://${appName}.azurewebsites.net`;
    }
    
    deploymentSuccess = true;
    console.log('✅ Azure deployment completed successfully');
    console.log(`🌐 App URL: ${deploymentUrl}`);
    
  } catch (error) {
    deploymentSuccess = false;
    deploymentError = error.message;
    deploymentOutput = error.stdout || error.stderr || error.message;
    console.error('❌ Azure deployment failed:', error.message);
  }
  
  const endTime = Date.now();
  const deploymentDuration = endTime - startTime;
  
  // Prepare event data for Dynatrace
  const eventData = {
    source: "finbuddy",
    "event.id": deploymentInfo.deploymentId,
    "event.type": "deployment",
    "deployment.status": deploymentSuccess ? "success" : "failed",
    "deployment.duration": deploymentDuration,
    "deployment.timestamp": deploymentInfo.deploymentTimestamp,
    "deployment.target": "azure-app-service",
    "deployment.url": deploymentUrl,
    "azure.app_name": deploymentInfo.azureAppName,
    "azure.resource_group": deploymentInfo.azureResourceGroup,
    "project.name": deploymentInfo.projectName,
    "project.version": deploymentInfo.version,
    "git.commit": deploymentInfo.gitInfo.commit,
    "git.branch": deploymentInfo.gitInfo.branch,
    "git.author": deploymentInfo.gitInfo.author,
    "git.message": deploymentInfo.gitInfo.message,
    "environment": deploymentInfo.environment,
    "platform": deploymentInfo.platform,
    "node.version": deploymentInfo.nodeVersion,
    "deployment.output": deploymentOutput.substring(0, 1000), // Limit output to prevent too large payload
    ...(deploymentError && { "deployment.error": deploymentError.substring(0, 500) })
  };
  
  // Send to Dynatrace
  await sendToDynatrace(eventData);
  
  // Print summary
  console.log('\n📊 Deployment Summary:');
  console.log(`   Status: ${deploymentSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`   Duration: ${Math.round(deploymentDuration / 1000)}s (${deploymentDuration}ms)`);
  console.log(`   Target: Azure App Service`);
  console.log(`   App: ${deploymentInfo.azureAppName}`);
  if (deploymentUrl) {
    console.log(`   URL: ${deploymentUrl}`);
  }
  
  // Exit with appropriate code
  process.exit(deploymentSuccess ? 0 : 1);
}

// Execute deployment tracking immediately
executeDeploymentWithTracking().catch(error => {
  console.error('❌ Deployment tracking script failed:', error);
  process.exit(1);
});
