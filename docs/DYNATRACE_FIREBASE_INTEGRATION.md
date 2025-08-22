# Dynatrace Integration for Firebase Workflows - Implementation Summary

## Overview

This document summarizes the Dynatrace event tracking integration added to the Firebase deployment workflows. This ensures that all deployment activities (success and failure) are tracked in Dynatrace for monitoring and observability.

## Files Modified

### 1. Firebase Hosting Merge Workflow
**File**: `.github/workflows/firebase-hosting-merge.yml`

**Changes Made**:
- Added Dynatrace success event step (runs on successful deployment)
- Added Dynatrace failure event step (runs on deployment failure)
- Events include production deployment metadata

**Event Details**:
- **Environment**: `production`
- **Platform**: `firebase`
- **URL**: `https://finbuddy-2025.web.app`
- **Status**: `success` or `failed`

### 2. Firebase Hosting Pull Request Workflow  
**File**: `.github/workflows/firebase-hosting-pull-request.yml`

**Changes Made**:
- Added Dynatrace success event step (runs on successful preview deployment)
- Added Dynatrace failure event step (runs on preview deployment failure)
- Events include preview deployment metadata and PR information

**Event Details**:
- **Environment**: `preview`
- **Platform**: `firebase`
- **Status**: `success` or `failed`
- **PR Number**: Included for tracking

## Event Data Structure

Both workflows send structured JSON events to Dynatrace with the following information:

### Common Fields
```json
{
  "source": "finbuddy",
  "event.id": "unique-github-run-id",
  "event.type": "deployment",
  "deployment.status": "success|failed",
  "deployment.platform": "firebase",
  "deployment.timestamp": "ISO-8601-timestamp",
  "project.name": "budget-buddy",
  "git.commit": "commit-sha",
  "git.branch": "branch-name",
  "git.author": "github-username",
  "workflow.run_id": "github-workflow-run-id",
  "workflow.run_number": "run-number"
}
```

### Environment-Specific Fields

**Production Deployments**:
- `deployment.environment`: `"production"`
- `deployment.url`: `"https://finbuddy-2025.web.app"`

**Preview Deployments**:
- `deployment.environment`: `"preview"`
- `pull_request.number`: Pull request number

**Failed Deployments**:
- `deployment.error`: Error description

## Required Configuration

### GitHub Secrets
You must configure these secrets in your GitHub repository:

1. **DYNATRACE_ENDPOINT**
   - Dynatrace event ingestion endpoint
   - Format: `https://your-environment.live.dynatrace.com/platform/ingest/custom/events/finbuddy`

2. **DYNATRACE_TOKEN**
   - Dynatrace API token with `events.ingest` permission
   - Format: `dt0c01.XXXX...`

### How to Configure
1. Go to GitHub repository → Settings → Secrets and variables → Actions
2. Add both secrets with exact names: `DYNATRACE_ENDPOINT` and `DYNATRACE_TOKEN`
3. See `docs/DYNATRACE_GITHUB_SETUP.md` for detailed instructions

## Workflow Execution Flow

### Production Deployment (main branch push)
```
1. Checkout code
2. Install dependencies (npm ci)
3. Build application (npm run build)  
4. Deploy to Firebase Hosting (live channel)
5a. [SUCCESS] Send success event to Dynatrace
5b. [FAILURE] Send failure event to Dynatrace
```

### Preview Deployment (pull request)
```
1. Checkout code
2. Install dependencies (npm ci)
3. Build application (npm run build)
4. Deploy to Firebase Hosting (preview channel)
5a. [SUCCESS] Send success event to Dynatrace
5b. [FAILURE] Send failure event to Dynatrace
```

## Benefits

### 1. **Deployment Tracking**
- Complete visibility into all deployment activities
- Success/failure rates and trends
- Deployment duration monitoring

### 2. **Issue Detection**
- Immediate notification of deployment failures
- Correlation with application performance issues
- Historical deployment success patterns

### 3. **Release Management**
- Track which commits/branches are deployed
- Monitor deployment frequency
- Correlate releases with application behavior

### 4. **DevOps Metrics**
- Deployment frequency
- Lead time for changes  
- Mean time to recovery
- Change failure rate

## Event Querying in Dynatrace

### Basic Queries
```dql
# All FinBuddy deployment events
fetch logs
| filter source == "finbuddy" and event.type == "deployment"

# Production deployment failures
fetch logs  
| filter source == "finbuddy" 
| filter deployment.environment == "production"
| filter deployment.status == "failed"

# Deployment success rate by environment
fetch logs
| filter source == "finbuddy" and event.type == "deployment"
| summarize count(), by: {deployment.environment, deployment.status}
```

### Advanced Analytics
```dql
# Deployment frequency by day
fetch logs
| filter source == "finbuddy" and event.type == "deployment"
| filter deployment.environment == "production"
| summarize deployments = count(), by: {bin(timestamp, 1d)}

# Author deployment activity
fetch logs
| filter source == "finbuddy" and event.type == "deployment"
| summarize deployments = count(), by: {git.author}
| sort deployments desc
```

## Testing the Integration

### 1. **Manual Testing**
- Push a commit to `main` branch
- Create/update a pull request
- Check GitHub Actions logs for Dynatrace curl commands
- Verify events appear in Dynatrace

### 2. **Verification in Dynatrace**
- Navigate to Logs or Events section
- Search for `source:"finbuddy"`
- Verify event structure and data accuracy

### 3. **Error Testing**
- Intentionally break the build/deployment
- Verify failure events are sent with error details

## Troubleshooting

### Common Issues
1. **Missing Secrets**: Verify both `DYNATRACE_ENDPOINT` and `DYNATRACE_TOKEN` are configured
2. **Invalid Token**: Ensure token has `events.ingest` permission
3. **Wrong Endpoint**: Verify endpoint URL format matches your Dynatrace environment
4. **Network Issues**: Check GitHub Actions can reach Dynatrace endpoint

### Debug Steps
1. Check GitHub Actions workflow logs
2. Look for curl command output and HTTP response codes
3. Test endpoint/token manually using provided curl commands
4. Verify events in Dynatrace logs/events section

## Migration Notes

### From Azure Workflows
- Previous Azure deployment tracking has been removed
- All deployment tracking now goes through Firebase workflows
- Dynatrace event structure maintained for consistency
- Build tracking (via `scripts/build-tracker.js`) remains unchanged

### Backward Compatibility
- Event structure matches previous Azure deployment events
- Same Dynatrace endpoint and token can be used
- No changes needed in Dynatrace dashboards or alerts

## Next Steps

### 1. **Set Up GitHub Secrets**
- Configure `DYNATRACE_ENDPOINT` and `DYNATRACE_TOKEN`
- Test with a deployment to verify integration

### 2. **Create Dynatrace Dashboards**
- Build dashboards showing deployment metrics
- Set up alerts for deployment failures
- Create SLI/SLO tracking for deployment success rates

### 3. **Extend Monitoring**
- Consider adding build event tracking to workflows
- Add deployment duration tracking
- Include application health checks post-deployment

## Documentation References

- **Setup Guide**: `docs/DYNATRACE_GITHUB_SETUP.md`
- **Build Tracking**: `scripts/build-tracker.js`
- **Workflow Files**: 
  - `.github/workflows/firebase-hosting-merge.yml`
  - `.github/workflows/firebase-hosting-pull-request.yml`
