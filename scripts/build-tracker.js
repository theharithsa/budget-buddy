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

// Get build information
function getBuildInfo() {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const buildTimestamp = new Date().toISOString();
  const buildId = Date.now();
  
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
    buildId,
    buildTimestamp,
    projectName: packageJson.name,
    version: packageJson.version,
    gitInfo,
    environment: process.env.NODE_ENV || 'development',
    platform: process.platform,
    nodeVersion: process.version
  };
}

// Get build artifacts information
function getBuildArtifacts() {
  const distPath = path.join(process.cwd(), 'dist');
  let artifacts = [];
  
  if (fs.existsSync(distPath)) {
    try {
      const files = fs.readdirSync(distPath);
      artifacts = files.map(file => {
        const filePath = path.join(distPath, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          size: stats.size,
          type: path.extname(file),
          created: stats.birthtime.toISOString()
        };
      });
    } catch (error) {
      console.warn('Could not read build artifacts:', error.message);
    }
  }
  
  return artifacts;
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
      console.log('✅ Build event sent to Dynatrace successfully');
      const responseText = await response.text();
      if (responseText) {
        console.log('Response:', responseText);
      }
    } else {
      console.error('❌ Failed to send build event to Dynatrace:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText);
    }
  } catch (error) {
    console.error('❌ Error sending build event to Dynatrace:', error);
  }
}

// Execute build and capture results
async function executeBuildWithTracking() {
  const buildInfo = getBuildInfo();
  const startTime = Date.now();
  
  console.log(`🚀 Starting build for ${buildInfo.projectName} v${buildInfo.version}`);
  console.log(`📋 Build ID: ${buildInfo.buildId}`);
  console.log(`🌿 Branch: ${buildInfo.gitInfo.branch}`);
  console.log(`📝 Commit: ${buildInfo.gitInfo.commit.substring(0, 8)}`);
  
  let buildSuccess = false;
  let buildError = null;
  let buildOutput = '';
  
  try {
    // Execute the build command
    buildOutput = execSync('npm run build', { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    buildSuccess = true;
    console.log('✅ Build completed successfully');
  } catch (error) {
    buildSuccess = false;
    buildError = error.message;
    buildOutput = error.stdout || error.stderr || error.message;
    console.error('❌ Build failed:', error.message);
  }
  
  const endTime = Date.now();
  const buildDuration = endTime - startTime;
  const buildArtifacts = getBuildArtifacts();
  
  // Prepare event data for Dynatrace
  const eventData = {
    source: "finbuddy",
    "event.id": buildInfo.buildId,
    "event.type": "build",
    "build.status": buildSuccess ? "success" : "failed",
    "build.duration": buildDuration,
    "build.timestamp": buildInfo.buildTimestamp,
    "project.name": buildInfo.projectName,
    "project.version": buildInfo.version,
    "git.commit": buildInfo.gitInfo.commit,
    "git.branch": buildInfo.gitInfo.branch,
    "git.author": buildInfo.gitInfo.author,
    "git.message": buildInfo.gitInfo.message,
    "environment": buildInfo.environment,
    "platform": buildInfo.platform,
    "node.version": buildInfo.nodeVersion,
    "artifacts.count": buildArtifacts.length,
    "artifacts.total_size": buildArtifacts.reduce((sum, artifact) => sum + artifact.size, 0),
    "build.output": buildOutput.substring(0, 1000), // Limit output to prevent too large payload
    ...(buildError && { "build.error": buildError.substring(0, 500) }),
    "artifacts": buildArtifacts
  };
  
  // Send to Dynatrace
  await sendToDynatrace(eventData);
  
  // Print summary
  console.log('\n📊 Build Summary:');
  console.log(`   Status: ${buildSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`   Duration: ${buildDuration}ms`);
  console.log(`   Artifacts: ${buildArtifacts.length} files`);
  console.log(`   Total Size: ${(buildArtifacts.reduce((sum, artifact) => sum + artifact.size, 0) / 1024).toFixed(2)} KB`);
  
  // Exit with appropriate code
  process.exit(buildSuccess ? 0 : 1);
}

// Execute build tracking immediately
executeBuildWithTracking().catch(error => {
  console.error('❌ Build tracking script failed:', error);
  process.exit(1);
});
