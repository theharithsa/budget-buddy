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

### Local Development:
```bash
# Test connection
npm run test:dynatrace

# Build with tracking (local only)
npm run build:tracked

# Build and serve locally
npm run serve:tracked
```

### Production Deployment:
```bash
# Push to main branch - triggers main workflow with automatic tracking
git push origin main
```

### Example Local Build Output:
```
🚀 Starting build for finbuddy v1.0.0
📋 Build ID: 1755749066087
🌿 Branch: main
� Commit: fea314e4
✅ Build completed successfully
✅ Build event sent to Dynatrace successfully
```

### Example GitHub Actions Output:
```
✅ Deploy to Azure Web App completed
� Creating pipeline event...
✅ Pipeline event sent to Dynatrace successfully!
```

## 🔐 GitHub Actions Integration

### 1. Create Production Environment:
1. Go to: `https://github.com/theharithsa/budget-buddy/settings/environments`
2. Click **New environment** → Name: `production`
3. Add these secrets:
   - `DYNATRACE_TOKEN`: <DT-Token>
   - `DYNATRACE_ENDPOINT`: `https://tenant.live.dynatrace.com/platform/ingest/custom/event/<custom_event_type>`

### 2. Main Workflow Integration:
Your existing `main_finbuddy.yml` workflow now includes:
- ✅ Build and deployment (existing Azure setup)
- ✅ Dynatrace event tracking after deployment
- ✅ Single pipeline event with complete context
- ✅ Runs on every push to main branch
- ✅ Uses your existing Azure publish profile

### 3. No Separate Workflows:
- ❌ No separate Dynatrace workflow
- ❌ No Azure CLI setup in Dynatrace events
- ✅ Everything integrated into your main deployment workflow
- ✅ Single job flow: Build → Deploy → Track

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

## 🛠️ Files & Scripts

### Package.json Scripts:
- `test:dynatrace` - Test Dynatrace connection
- `build:tracked` - Build with local tracking
- `serve:tracked` - Build and serve locally with tracking

### Files Created:
- `scripts/build-tracker.js` - Local build tracking only
- `scripts/test-dynatrace.js` - Connection testing
- `main_finbuddy.yml` - **Main workflow with integrated Dynatrace tracking**

### Removed Files:
- ❌ `pipeline-tracker.js` - Removed (redundant)
- ❌ `deployment-tracker.js` - Removed (redundant) 
- ❌ `build-with-dynatrace.yml` - Removed (separate workflow not needed)

## ✅ Key Benefits

- ✅ **Maximum Simplicity** - No separate scripts for production
- ✅ **Single Workflow** - Everything in your existing main workflow
- ✅ **Inline Tracking** - Dynatrace event created directly in workflow
- ✅ **No Dependencies** - Just bash/curl, no Node.js scripts needed
- ✅ **Clear & Visible** - All logic visible in workflow file
- ✅ **Local Testing** - build-tracker.js for development only

## 🎉 Final Status: Ultra-Clean Solution

Your Dynatrace tracking is now **maximally simplified**:
- ✅ **One workflow file** - your existing `main_finbuddy.yml`
- ✅ **One additional step** - inline Dynatrace event creation
- ✅ **No extra files** - no separate scripts or workflows
- ✅ **Complete tracking** - full pipeline visibility in Dynatrace
- ✅ **Zero complexity** - straightforward bash commands

**Perfect integration** with your existing workflow! 🎯
