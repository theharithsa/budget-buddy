# 📊 Dynatrace Pipeline Tracking - Complete Guide

## 🎯 Overview
FinBuddy uses a comprehensive **single-event pipeline tracking** system that captures both build and deployment information in one Dynatrace event. No separate workflows or multiple API calls - just one complete pipeline event per run.

## 🔧 Environment Variables Configuration

### Required Variables:
```bash
# Primary token variable (recommended)
DYNATRACE_TOKEN=dt0c01.KTMO6B4MFMUMLL2UKM57LOEV.DDKJLHV2GPH7NJ7NJIPLVUQOREVONZ3CRNXK2LZ6V3NXI2TEAOCRSBJD6YCD6PYQ

# Alternative token variable name (fallback)
DYNATRACE_API_TOKEN=dt0c01.YOUR_TOKEN_HERE

# Custom events endpoint (optional - has sensible default)
DYNATRACE_ENDPOINT=https://bos01241.live.dynatrace.com/platform/ingest/custom/events/finbuddy

# Azure deployment configuration (optional)
AZURE_WEBAPP_NAME=your-webapp-name
AZURE_RESOURCE_GROUP=your-resource-group
```

### Local Setup:
```bash
# Set for current session
export DYNATRACE_TOKEN="dt0c01.YOUR_TOKEN_HERE"
export AZURE_WEBAPP_NAME="your-webapp-name"
export AZURE_RESOURCE_GROUP="your-resource-group"

# Or use .env file (already configured)
# Tokens are already in your .env file
```

## 📦 Comprehensive Pipeline Event (25+ Fields)

### Complete Pipeline JSON Payload Example:
```json
{
  "source": "finbuddy",
  "event.id": 1755751470416,
  "event.type": "pipeline",
  "pipeline.timestamp": "2025-08-21T04:44:30.416Z",
  "pipeline.status": "success",
  "project.name": "finbuddy",
  "project.version": "1.0.0",
  "environment": "development",
  "git.commit": "03295bd9",
  "git.branch": "main",
  "git.author": "Harithsa, Vishruth",
  "git.message": "Add Azure deployment tracking with Dynatrace integration",
  "build.status": "success",
  "build.duration": 17310,
  "build.output": "✓ Build completed successfully",
  "artifacts.count": 15,
  "artifacts.total_size": 2048576,
  "deployment.status": "success",
  "deployment.duration": 45230,
  "deployment.url": "https://finbuddy-app.azurewebsites.net",
  "azure.webapp_name": "finbuddy-app",
  "azure.resource_group": "finbuddy-rg",
  "azure.subscription": "12345678-1234-1234-1234-123456789abc",
  "azure.location": "East US",
  "platform": "win32",
  "node.version": "v22.14.0",
  "ci.pipeline": "github-actions"
}
```
  "build.output": "vite v6.3.5 building for production...\n✓ 2362 modules transformed...",
  "artifacts": [
    {
      "name": "index.html",
      "size": 831,
      "type": ".html",
      "created": "2025-08-21T04:14:34.555Z"
    },
    {
      "name": "assets/index-BX26_LHl.css",
      "size": 362640,
      "type": ".css",
      "created": "2025-08-21T04:14:34.555Z"
    }
  ]
}
```

### Failed Build Payload Example:
```json
{
  "source": "finbuddy",
  "event.id": 1755749066088,
  "event.type": "build",
  "build.status": "failed",
  "build.duration": 5432,
  "build.timestamp": "2025-08-21T04:15:34.555Z",
  "project.name": "finbuddy",
  "project.version": "1.0.0",
  "git.commit": "fea314e4a1b2c3d4e5f6789abcdef",
  "git.branch": "feature/new-component",
  "git.author": "Jane Developer",
  "git.message": "WIP: Adding new component",
  "environment": "development",
  "platform": "win32",
  "node.version": "v18.17.0",
  "artifacts.count": 0,
  "artifacts.total_size": 0,
  "build.output": "vite v6.3.5 building for production...\nError: Failed to parse...",
  "build.error": "TypeError: Cannot read property 'length' of undefined\n    at Component.jsx:42:15",
  "artifacts": []
}
```

### Field Breakdown:

### Core Event Fields:
- `source` - Application identifier ("finbuddy")
- `event.id` - Unique build ID (timestamp-based)
- `event.type` - Event category ("build")

### Build Information:
- `build.status` - "success" or "failed"
- `build.duration` - Time in milliseconds
- `build.timestamp` - ISO datetime when build started
- `build.output` - First 1000 characters of build output
- `build.error` - Error message if build failed

### Project & Git Data:
- `project.name`, `project.version` - From package.json
- `environment` - Build environment
- `git.commit`, `git.branch`, `git.author`, `git.message` - Git information

### Artifacts & System:
- `artifacts.count`, `artifacts.total_size`, `artifacts` - Build output analysis
- `platform`, `node.version` - System information

## 🚀 Deployment Event Payload Fields (19 Total)

### Complete Deployment JSON Payload Example:
```json
{
  "source": "finbuddy",
  "event.id": 1755749088432,
  "event.type": "deployment",
  "deployment.status": "success",
  "deployment.duration": 45230,
  "deployment.timestamp": "2025-08-21T04:15:12.332Z",
  "deployment.target": "azure",
  "deployment.url": "https://finbuddy-app.azurewebsites.net",
  "deployment.environment": "production",
  "project.name": "finbuddy",
  "project.version": "1.0.0",
  "git.commit": "fea314e4a1b2c3d4e5f6789abcdef",
  "git.branch": "main",
  "azure.webapp_name": "finbuddy-app",
  "azure.resource_group": "finbuddy-rg",
  "azure.subscription": "12345678-1234-1234-1234-123456789abc",
  "azure.location": "East US",
  "platform": "linux",
  "ci.pipeline": "github-actions"
}
```

### Failed Deployment Payload Example:
```json
{
  "source": "finbuddy",
  "event.id": 1755749123567,
  "event.type": "deployment",
  "deployment.status": "failed",
  "deployment.duration": 12450,
  "deployment.timestamp": "2025-08-21T04:16:05.123Z",
  "deployment.error": "Authentication failed: Invalid Azure credentials",
  "deployment.target": "azure",
  "deployment.environment": "production",
  "project.name": "finbuddy",
  "project.version": "1.0.0",
  "git.commit": "fea314e4a1b2c3d4e5f6789abcdef",
  "git.branch": "main",
  "azure.webapp_name": "finbuddy-app",
  "azure.resource_group": "finbuddy-rg",
  "platform": "linux",
  "ci.pipeline": "github-actions"
}
```

## 🚀 Usage

### Single Command Pipeline:
```bash
# Test connection
npm run test:dynatrace

# Complete pipeline (build + deploy + tracking) - ONE EVENT
npm run pipeline

# Legacy separate build tracking (still available)
npm run build:tracked

# Build and serve locally
npm run serve:tracked
```

### Example Pipeline Output:
```
🚀 Pipeline script loaded, starting main...
🔄 Pipeline tracker starting...
🚀 Starting pipeline for finbuddy v1.0.0
📋 Pipeline ID: 1755751452257
📦 Starting build phase...
🔨 Starting build process...
✅ Build completed successfully
🌿 Current branch: main
🚀 Starting deployment phase...
✅ Deployment completed successfully
🌐 App URL: https://finbuddy-app.azurewebsites.net
📡 Sending event to Dynatrace...
✅ Pipeline event sent to Dynatrace successfully!

📊 Pipeline Summary:
   Build Status: ✅ SUCCESS
   Build Duration: 17310ms
   Deployment Status: ✅ SUCCESS
   Deployment Duration: 45230ms
   Total Duration: 62540ms
   Dynatrace Event: ✅ SENT
   🌐 App URL: https://finbuddy-app.azurewebsites.net
```

## 🔐 GitHub Actions Production Setup

### 1. Create Production Environment:
1. Go to: `https://github.com/theharithsa/budget-buddy/settings/environments`
2. Click **New environment** → Name: `production`
3. Add these secrets:
   - `DYNATRACE_TOKEN`: `dt0c01.KTMO6B4MFMUMLL2UKM57LOEV.DDKJLHV2GPH7NJ7NJIPLVUQOREVONZ3CRNXK2LZ6V3NXI2TEAOCRSBJD6YCD6PYQ`
   - `DYNATRACE_ENDPOINT`: `https://bos01241.live.dynatrace.com/platform/ingest/custom/events/finbuddy`
   - `AZURE_CREDENTIALS`: Azure service principal JSON (for deployment)
   - `AZURE_WEBAPP_NAME`: Your Azure App Service name
   - `AZURE_RESOURCE_GROUP`: Your Azure resource group name

### 2. Workflow Configuration:
The GitHub Actions workflow is configured to:
- Use production environment secrets
- Test Dynatrace connection before building
- Track all build events with comprehensive metadata
- Deploy to Azure App Service with duration tracking
- Send deployment events to Dynatrace
- Handle errors gracefully for both build and deployment

### 3. Trigger a Test:
```bash
git add .
git commit -m "Test production build and deployment"
git push origin main
```

## 🎯 Dynatrace Monitoring

### View Events:
- Go to **Data Explorer** → **Custom Events**
- Filter by **source: "finbuddy"**

### Useful Queries:
```dql
// All pipeline events
fetch events | filter source == "finbuddy" and event.type == "pipeline"

// Failed pipelines (build or deployment failures)
fetch events | filter source == "finbuddy" and pipeline.status == "failed"

// Successful deployments only
fetch events | filter source == "finbuddy" and deployment.status == "success"

// Build duration trends
fetch events | filter source == "finbuddy" and build.status == "success"
| summarize avg(build.duration) by bin(timestamp, 1h)

// Deployment duration trends
fetch events | filter source == "finbuddy" and deployment.status == "success"
| summarize avg(deployment.duration) by bin(timestamp, 1h)

// Pipeline success rate
fetch events | filter source == "finbuddy"
| summarize success_rate = countIf(pipeline.status == "success") * 100.0 / count() by bin(timestamp, 1d)
```

## 🛠️ Scripts Created

### Package.json Scripts:
- `test:dynatrace` - Test Dynatrace connection
- `pipeline` - **Complete build + deploy + tracking in ONE event**
- `build:tracked` - Legacy separate build tracking
- `serve:tracked` - Build and serve locally

### Files:
- `scripts/pipeline-tracker.js` - **Single comprehensive pipeline tracking**
- `scripts/build-tracker.js` - Legacy build-only tracking
- `scripts/test-dynatrace.js` - Connection test
- `.github/workflows/build-with-dynatrace.yml` - Simplified CI/CD workflow

## ✅ Key Benefits

- ✅ **Single Event** - No separate API calls, one comprehensive event
- ✅ **Complete Pipeline View** - Build + deployment in single payload
- ✅ **Simplified Workflow** - One script, one job, one event
- ✅ **Rich Context** - 25+ fields covering entire pipeline
- ✅ **Smart Skipping** - Deployment skipped if build fails or not main branch
- ✅ **Error Handling** - Captures both build and deployment failures
- ✅ **Environment Variables** - Secure token management

## 🎉 Status: Production Ready

Your **single-event pipeline tracking** is now:
- ✅ One comprehensive event per pipeline run
- ✅ Complete build and deployment coverage in single payload
- ✅ Simplified GitHub Actions workflow
- ✅ 25+ data fields capturing entire pipeline context
- ✅ Smart conditional deployment based on build success and branch
- ✅ Ready for production with full observability

Every pipeline run sends **exactly ONE event** to Dynatrace with complete build and deployment information! 🎯
