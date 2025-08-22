# Dynatrace Integration Setup for GitHub Workflows

This document explains how to configure GitHub secrets for Dynatrace event tracking in the Firebase deployment workflows.

## Required GitHub Secrets

You need to add the following secrets to your GitHub repository:

### 1. DYNATRACE_ENDPOINT
- **Description**: The Dynatrace endpoint URL for sending custom events
- **Value**: `https://your-environment.live.dynatrace.com/platform/ingest/custom/events/finbuddy`
- **Example**: `https://bos01241.live.dynatrace.com/platform/ingest/custom/events/finbuddy`

### 2. DYNATRACE_TOKEN
- **Description**: Dynatrace API token with event ingestion permissions
- **Value**: Your Dynatrace API token (format: `dt0c01.XXXX...`)

## How to Add GitHub Secrets

1. **Navigate to Repository Settings**:
   - Go to your GitHub repository
   - Click on "Settings" tab
   - Click on "Secrets and variables" > "Actions"

2. **Add New Repository Secret**:
   - Click "New repository secret"
   - Add name: `DYNATRACE_ENDPOINT`
   - Add value: Your Dynatrace endpoint URL
   - Click "Add secret"

3. **Repeat for DYNATRACE_TOKEN**:
   - Click "New repository secret"
   - Add name: `DYNATRACE_TOKEN`  
   - Add value: Your Dynatrace API token
   - Click "Add secret"

## Creating Dynatrace API Token

1. **Login to Dynatrace**:
   - Go to your Dynatrace environment
   - Navigate to "Settings" > "Integration" > "Dynatrace API"

2. **Generate Token**:
   - Click "Generate token"
   - Give it a name: "GitHub Deployment Events"
   - Select scopes:
     - `events.ingest` (Required for sending custom events)
     - `logs.ingest` (Optional, for build logs)

3. **Copy Token**:
   - Copy the generated token
   - Use this as the value for `DYNATRACE_TOKEN` secret

## Event Data Structure

The workflows will send the following event data to Dynatrace:

### Production Deployment Events (firebase-hosting-merge.yml)
```json
{
  "source": "finbuddy",
  "event.id": "github-run-id",
  "event.type": "deployment",
  "deployment.status": "success|failed",
  "deployment.environment": "production",
  "deployment.platform": "firebase",
  "deployment.timestamp": "2025-08-22T10:30:00.000Z",
  "deployment.url": "https://finbuddy-2025.web.app",
  "project.name": "budget-buddy",
  "git.commit": "commit-sha",
  "git.branch": "main",
  "git.author": "username",
  "workflow.run_id": "run-id",
  "workflow.run_number": "run-number"
}
```

### Preview Deployment Events (firebase-hosting-pull-request.yml)
```json
{
  "source": "finbuddy",
  "event.id": "github-run-id",
  "event.type": "deployment",
  "deployment.status": "success|failed",
  "deployment.environment": "preview",
  "deployment.platform": "firebase",
  "deployment.timestamp": "2025-08-22T10:30:00.000Z",
  "project.name": "budget-buddy",
  "git.commit": "commit-sha",
  "git.branch": "feature-branch",
  "git.author": "username",
  "workflow.run_id": "run-id",
  "workflow.run_number": "run-number",
  "pull_request.number": "123"
}
```

## Workflow Integration

### Firebase Hosting Merge Workflow
- **Triggers**: On push to `main` branch
- **Events Sent**: 
  - Success: Production deployment success
  - Failure: Production deployment failure

### Firebase Hosting Pull Request Workflow  
- **Triggers**: On pull request creation/update
- **Events Sent**:
  - Success: Preview deployment success
  - Failure: Preview deployment failure

## Verification

After setting up the secrets:

1. **Test Deployment**: 
   - Push to main branch or create a pull request
   - Check GitHub Actions logs for Dynatrace event sending

2. **Check Dynatrace**:
   - Go to Dynatrace > Logs or Events
   - Search for `source:"finbuddy"` 
   - Verify deployment events are being received

## Troubleshooting

### Common Issues:

1. **Secret Not Found Error**:
   - Verify secret names are exactly: `DYNATRACE_ENDPOINT` and `DYNATRACE_TOKEN`
   - Check that secrets are added at repository level, not environment level

2. **Dynatrace API Error**:
   - Verify token has correct permissions (`events.ingest`)
   - Check endpoint URL format is correct
   - Ensure token is not expired

3. **Workflow Fails**:
   - Check GitHub Actions logs for curl error details
   - Verify network connectivity to Dynatrace endpoint

### Debug Commands:

Test your Dynatrace integration locally:
```bash
# Test endpoint connectivity
curl -X POST "https://your-environment.live.dynatrace.com/platform/ingest/custom/events/finbuddy" \
  -H "Authorization: Api-Token your-token" \
  -H "Content-Type: application/json" \
  -d '[{"source": "test", "event.type": "test", "message": "test"}]'
```

## Security Notes

- ✅ **Secrets are encrypted** in GitHub and only accessible during workflow execution
- ✅ **Tokens are masked** in workflow logs for security
- ✅ **Limited scope** - tokens only have event ingestion permissions
- ⚠️ **Token rotation** - Consider rotating tokens periodically for security

## Support

- **GitHub Secrets**: [GitHub Docs - Encrypted Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- **Dynatrace API**: [Dynatrace API Documentation](https://www.dynatrace.com/support/help/dynatrace-api/)
- **Firebase Actions**: [Firebase GitHub Actions](https://github.com/FirebaseExtended/action-hosting-deploy)
