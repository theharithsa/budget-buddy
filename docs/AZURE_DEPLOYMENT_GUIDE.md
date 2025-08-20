# Azure App Service Deployment Guide for FinBuddy

## Issue Resolution

The Azure App Service is showing the default "waiting for content" page because the application files weren't properly deployed. Here's how to fix it:

## Method 1: Direct File Upload (Quickest Fix)

### Step 1: Compress Build Files
1. Navigate to your `dist` folder: `c:\Users\user\OneDrive\Documents\Azure DevOps\budget-buddy\dist`
2. Select all files and folders inside `dist` (not the dist folder itself)
3. Create a ZIP file containing:
   - `index.html`
   - `assets/` folder with all its contents

### Step 2: Deploy via Azure Portal
1. Go to Azure Portal → Your App Service
2. Navigate to **Development Tools** → **Advanced Tools** → **Go**
3. This opens Kudu (SCM site)
4. Go to **Debug Console** → **CMD**
5. Navigate to `site/wwwroot`
6. Delete any existing files
7. Drag and drop your ZIP file
8. Extract the ZIP file contents directly into wwwroot
9. Restart your App Service

## Method 2: Using Azure CLI (Recommended)

### Prerequisites
```bash
# Install Azure CLI if not already installed
# Download from: https://learn.microsoft.com/en-us/cli/azure/install-azure-cli

# Login to Azure
az login
```

### Deploy the Application
```bash
# Navigate to your project directory
cd "c:\Users\user\OneDrive\Documents\Azure DevOps\budget-buddy"

# Build the application
npm run build

# Deploy using Azure CLI (replace with your actual resource group and app name)
az webapp deploy --resource-group <your-resource-group> --name <your-app-name> --src-path ./dist --type static
```

## Method 3: GitHub Actions (Automated Deployment)

Create `.github/workflows/azure-deploy.yml`:

```yaml
name: Deploy to Azure App Service

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build application
      run: npm run build
      env:
        VITE_OPENAI_API_KEY: ${{ secrets.VITE_OPENAI_API_KEY }}
    
    - name: Deploy to Azure App Service
      uses: azure/webapps-deploy@v2
      with:
        app-name: '<your-app-name>'
        publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
        package: './dist'
```

## Required Azure Configuration

### 1. Application Settings (Environment Variables)

In Azure Portal → Your App Service → Settings → Configuration → Application settings:

```
VITE_OPENAI_API_KEY = 
WEBSITE_NODE_DEFAULT_VERSION = 18-lts
SCM_DO_BUILD_DURING_DEPLOYMENT = false
```

### 2. Startup Command

In Azure Portal → Your App Service → Settings → Configuration → General settings:

- **Startup Command**: Leave empty for static sites

### 3. Build Configuration

Since this is a static React app, ensure:

- **Runtime stack**: Node.js (but we're serving static files)
- **Platform**: 64 Bit
- **Always On**: On (if not using free tier)

## Web.config for SPA Routing

The application needs proper URL rewriting for React Router. This should already be handled by the web.config file in your project.

## Troubleshooting

### Issue: Still seeing default page after deployment

**Solution**: 
1. Check if files are in the correct location (`site/wwwroot` in Kudu)
2. Verify that `index.html` is in the root of wwwroot
3. Restart the App Service

### Issue: Blank page or JavaScript errors

**Solution**:
1. Check browser console for errors
2. Verify that environment variables are set correctly
3. Check if Firebase configuration is correct for the domain

### Issue: Firebase authentication not working
**Solution**:
1. Add your Azure App Service URL to Firebase authorized domains:
   - Go to Firebase Console → Authentication → Settings → Authorized domains
   - Add: `https://<your-app-name>.azurewebsites.net`

### Issue: CORS errors with Firebase
**Solution**:
1. Ensure your Azure domain is added to Firebase authorized domains
2. Check that Firebase API keys and configuration are correct

## Quick Fix Command Sequence

```bash
# 1. Ensure you're in the right directory
cd "c:\Users\user\OneDrive\Documents\Azure DevOps\budget-buddy"

# 2. Build the app
npm run build

# 3. Login to Azure
az login

# 4. Deploy (replace placeholders with actual values)
az webapp deploy --resource-group <resource-group-name> --name <app-service-name> --src-path ./dist --type static

# 5. Restart the app service
az webapp restart --resource-group <resource-group-name> --name <app-service-name>
```

## Verification Steps

After deployment:
1. Visit your App Service URL
2. You should see the FinBuddy login page instead of the default Azure page
3. Check browser console for any errors
4. Test the Google authentication flow
5. Verify that Firebase operations work correctly

## Important Notes

- The build output is in the `dist` folder and contains static files
- Azure App Service expects the files to be in `site/wwwroot`
- Make sure to set environment variables in Azure portal, not just locally
- Firebase domain authorization is required for authentication to work

Follow Method 1 (Direct File Upload) for the quickest fix to get your site running immediately.
