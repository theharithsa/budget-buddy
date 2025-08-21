#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync, existsSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Enhanced console logging with emojis
const log = {
    info: (msg) => console.log(`ℹ️  ${msg}`),
    success: (msg) => console.log(`✅ ${msg}`),
    error: (msg) => console.log(`❌ ${msg}`),
    warning: (msg) => console.log(`⚠️  ${msg}`),
    build: (msg) => console.log(`🔨 ${msg}`),
    deploy: (msg) => console.log(`🚀 ${msg}`),
    data: (msg) => console.log(`📊 ${msg}`)
};

// Get environment variables with fallbacks
const getDynatraceConfig = () => {
    const token = process.env.DYNATRACE_TOKEN || process.env.DYNATRACE_API_TOKEN;
    const endpoint = process.env.DYNATRACE_ENDPOINT || 
        'https://bos01241.live.dynatrace.com/platform/ingest/custom/events/finbuddy';
    
    if (!token) {
        throw new Error('Dynatrace token not found. Set DYNATRACE_TOKEN or DYNATRACE_API_TOKEN environment variable.');
    }
    
    return { token, endpoint };
};

// Get git information
const getGitInfo = () => {
    try {
        return {
            commit: execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim().substring(0, 8),
            branch: execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim(),
            author: execSync('git log -1 --pretty=format:"%an"', { encoding: 'utf8' }).trim(),
            message: execSync('git log -1 --pretty=format:"%s"', { encoding: 'utf8' }).trim()
        };
    } catch (error) {
        log.warning('Could not get git info, using defaults');
        return {
            commit: 'unknown',
            branch: 'unknown',
            author: 'unknown',
            message: 'No git info available'
        };
    }
};

// Get project information from package.json
const getProjectInfo = () => {
    try {
        const packagePath = join(projectRoot, 'package.json');
        const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
        return {
            name: packageJson.name || 'finbuddy',
            version: packageJson.version || '1.0.0'
        };
    } catch (error) {
        log.warning('Could not read package.json, using defaults');
        return { name: 'finbuddy', version: '1.0.0' };
    }
};

// Analyze build artifacts
const getArtifactInfo = () => {
    try {
        const distPath = join(projectRoot, 'dist');
        if (!existsSync(distPath)) {
            return { count: 0, total_size: 0, artifacts: [] };
        }

        const files = execSync('find dist -type f', { encoding: 'utf8', cwd: projectRoot })
            .trim().split('\n').filter(f => f);
        
        let totalSize = 0;
        const artifacts = files.map(file => {
            const fullPath = join(projectRoot, file);
            const size = statSync(fullPath).size;
            totalSize += size;
            return { file, size };
        });

        return {
            count: files.length,
            total_size: totalSize,
            artifacts: artifacts.slice(0, 10) // Limit to first 10 files
        };
    } catch (error) {
        log.warning('Could not analyze artifacts');
        return { count: 0, total_size: 0, artifacts: [] };
    }
};

// Run build process
const runBuild = async () => {
    const startTime = Date.now();
    let buildStatus = 'success';
    let buildError = null;
    let buildOutput = '';

    try {
        log.build('Starting build process...');
        buildOutput = execSync('npm run build', { 
            encoding: 'utf8', 
            cwd: projectRoot,
            maxBuffer: 1024 * 1024 // 1MB buffer
        });
        log.success('Build completed successfully');
    } catch (error) {
        buildStatus = 'failed';
        buildError = error.message;
        buildOutput = error.stdout || error.stderr || error.message;
        log.error(`Build failed: ${buildError}`);
    }

    return {
        status: buildStatus,
        duration: Date.now() - startTime,
        output: buildOutput.substring(0, 1000), // First 1000 chars
        error: buildError
    };
};

// Run Azure deployment
const runDeployment = async () => {
    // In GitHub Actions, deployment is handled by the main workflow
    // This is only for local testing with manual Azure deployment
    const webappName = process.env.AZURE_WEBAPP_NAME;
    const resourceGroup = process.env.AZURE_RESOURCE_GROUP;
    
    if (!webappName || !resourceGroup) {
        log.warning('Local Azure deployment skipped - use GitHub Actions for production deployment');
        return {
            status: 'skipped',
            duration: 0,
            url: `https://${webappName || 'finbuddy'}.azurewebsites.net`,
            error: 'Local deployment not configured - use GitHub Actions'
        };
    }

    const startTime = Date.now();
    let deployStatus = 'success';
    let deployError = null;
    let deployUrl = null;

    try {
        log.deploy(`Starting local deployment to ${webappName}...`);
        log.warning('Note: Production deployments should use GitHub Actions workflow');
        
        // For local development, just simulate deployment
        // Real deployment happens in GitHub Actions
        deployUrl = `https://${webappName}.azurewebsites.net`;
        
        log.success(`Local deployment simulation completed: ${deployUrl}`);
    } catch (error) {
        deployStatus = 'failed';
        deployError = error.message;
        log.error(`Local deployment failed: ${deployError}`);
    }

    return {
        status: deployStatus,
        duration: Date.now() - startTime,
        url: deployUrl,
        error: deployError
    };
};

// Get Azure subscription info
const getAzureInfo = () => {
    // In production, this info comes from the main workflow
    // For local development, return defaults
    return {
        subscription: process.env.AZURE_SUBSCRIPTION_ID || 'local-development',
        location: process.env.AZURE_LOCATION || 'East US'
    };
};

// Send comprehensive event to Dynatrace
const sendToDynatrace = async (buildInfo, deploymentInfo) => {
    const { token, endpoint } = getDynatraceConfig();
    const gitInfo = getGitInfo();
    const projectInfo = getProjectInfo();
    const artifactInfo = getArtifactInfo();
    const azureInfo = getAzureInfo();
    
    const eventId = Date.now();
    const timestamp = new Date().toISOString();
    
    // Create comprehensive pipeline event
    const event = {
        // Core event info
        source: 'finbuddy',
        'event.id': eventId,
        'event.type': 'pipeline',
        'pipeline.timestamp': timestamp,
        'pipeline.status': deploymentInfo.status === 'skipped' ? buildInfo.status : 
                          (buildInfo.status === 'failed' || deploymentInfo.status === 'failed') ? 'failed' : 'success',
        
        // Project info
        'project.name': projectInfo.name,
        'project.version': projectInfo.version,
        'environment': process.env.NODE_ENV || process.env.ENVIRONMENT || 'development',
        
        // Git info
        'git.commit': gitInfo.commit,
        'git.branch': gitInfo.branch,
        'git.author': gitInfo.author,
        'git.message': gitInfo.message,
        
        // Build phase
        'build.status': buildInfo.status,
        'build.duration': buildInfo.duration,
        'build.output': buildInfo.output,
        ...(buildInfo.error && { 'build.error': buildInfo.error }),
        
        // Artifacts
        'artifacts.count': artifactInfo.count,
        'artifacts.total_size': artifactInfo.total_size,
        
        // Deployment phase
        'deployment.status': deploymentInfo.status,
        'deployment.duration': deploymentInfo.duration,
        ...(deploymentInfo.url && { 'deployment.url': deploymentInfo.url }),
        ...(deploymentInfo.error && { 'deployment.error': deploymentInfo.error }),
        
        // Azure info (if deployment attempted)
        ...(process.env.AZURE_WEBAPP_NAME && {
            'azure.webapp_name': process.env.AZURE_WEBAPP_NAME,
            'azure.resource_group': process.env.AZURE_RESOURCE_GROUP,
            'azure.subscription': azureInfo.subscription,
            'azure.location': azureInfo.location
        }),
        
        // System info
        'platform': process.platform,
        'node.version': process.version,
        'ci.pipeline': process.env.GITHUB_ACTIONS ? 'github-actions' : 'local'
    };

    log.data('Pipeline event payload:');
    console.log(JSON.stringify(event, null, 2));

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Api-Token ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(event)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        log.success('Pipeline event sent to Dynatrace successfully!');
        return true;
    } catch (error) {
        log.error(`Failed to send event to Dynatrace: ${error.message}`);
        return false;
    }
};

// Main execution
const main = async () => {
    console.log('🔄 Pipeline tracker starting...');
    
    const startTime = Date.now();
    const projectInfo = getProjectInfo();
    
    console.log(`🚀 Starting pipeline for ${projectInfo.name} v${projectInfo.version}`);
    console.log(`📋 Pipeline ID: ${Date.now()}`);
    
    try {
        // Run build
        console.log('📦 Starting build phase...');
        const buildInfo = await runBuild();
        
        // Run deployment (only if build succeeded and on main branch)
        let deploymentInfo = { status: 'skipped', duration: 0, url: null, error: 'Build failed or not main branch' };
        
        const gitInfo = getGitInfo();
        console.log(`🌿 Current branch: ${gitInfo.branch}`);
        
        if (buildInfo.status === 'success' && (gitInfo.branch === 'main' || process.env.FORCE_DEPLOY === 'true')) {
            console.log('🚀 Starting deployment phase...');
            deploymentInfo = await runDeployment();
        } else {
            console.log('⏭️  Skipping deployment phase');
        }
        
        // Send comprehensive event to Dynatrace
        console.log('📡 Sending event to Dynatrace...');
        const dynatraceSuccess = await sendToDynatrace(buildInfo, deploymentInfo);
        
        // Summary
        const totalDuration = Date.now() - startTime;
        console.log('\n📊 Pipeline Summary:');
        console.log(`   Build Status: ${buildInfo.status === 'success' ? '✅ SUCCESS' : '❌ FAILED'}`);
        console.log(`   Build Duration: ${buildInfo.duration}ms`);
        console.log(`   Deployment Status: ${deploymentInfo.status === 'success' ? '✅ SUCCESS' : 
                    deploymentInfo.status === 'skipped' ? '⏭️  SKIPPED' : '❌ FAILED'}`);
        console.log(`   Deployment Duration: ${deploymentInfo.duration}ms`);
        console.log(`   Total Duration: ${totalDuration}ms`);
        console.log(`   Dynatrace Event: ${dynatraceSuccess ? '✅ SENT' : '❌ FAILED'}`);
        
        if (deploymentInfo.url) {
            console.log(`   🌐 App URL: ${deploymentInfo.url}`);
        }
        
        // Exit with proper code
        if (buildInfo.status === 'failed' || (deploymentInfo.status === 'failed' && deploymentInfo.status !== 'skipped')) {
            process.exit(1);
        }
        
    } catch (error) {
        log.error(`Pipeline failed: ${error.message}`);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
};

// Run if called directly
console.log('🚀 Pipeline script loaded, starting main...');
main().catch(error => {
    log.error(`Unexpected error: ${error.message}`);
    console.error('Stack trace:', error.stack);
    process.exit(1);
});

export { main, sendToDynatrace, runBuild, runDeployment };
