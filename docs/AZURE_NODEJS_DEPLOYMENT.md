# Azure App Service Node.js Deployment Guide

## ✅ Current Status
Your FinBuddy application is now properly configured as a Node.js application with Express server for Azure App Service deployment.

## 🎯 Quick Deployment Steps

### Option 1: Manual Upload via Kudu (Recommended)
1. **Build the application locally:**
   ```bash
   npm run build
   ```

2. **Create deployment package:**
   - Zip the following files/folders:
     - `dist/` folder (created by build)
     - `node_modules/` folder 
     - `server.js`
     - `package.json`
     - `package-lock.json`

3. **Upload via Kudu:**
   - Go to: `https://your-app-name.scm.azurewebsites.net`
   - Navigate to: Debug Console > CMD
   - Go to: `/site/wwwroot`
   - Drag and drop your zip file
   - Azure will automatically extract and start the Node.js application

### Option 2: Azure CLI Deployment
```bash
# Login to Azure
az login

# Build the application
npm run build

# Deploy to Azure App Service (replace with your app name and resource group)
az webapp up --sku F1 --name your-app-name --resource-group your-resource-group
```

### Option 3: GitHub Actions (Automated)
Create `.github/workflows/azure-deploy.yml`:

```yaml
name: Build and deploy Node.js app to Azure Web App

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Set up Node.js version
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: npm install and build
        run: |
          npm ci
          npm run build --if-present

      - name: Zip artifact for deployment
        run: zip release.zip ./* -r

      - name: Upload artifact for deployment job
        uses: actions/upload-artifact@v3
        with:
          name: node-app
          path: release.zip

  deploy:
    runs-on: ubuntu-latest
    needs: build
    environment:
      name: 'Production'
      url: ${{ steps.deploy-to-webapp.outputs.webapp-url }}

    steps:
      - name: Download artifact from build job
        uses: actions/download-artifact@v3
        with:
          name: node-app

      - name: Unzip artifact for deployment
        run: unzip release.zip

      - name: 'Deploy to Azure Web App'
        id: deploy-to-webapp
        uses: azure/webapps-deploy@v2
        with:
          app-name: 'your-app-name'
          slot-name: 'Production'
          publish-profile: ${{ secrets.AZUREAPPSERVICE_PUBLISHPROFILE }}
          package: .
```

## ⚙️ Azure Configuration

### App Service Settings
In Azure Portal → Your App Service → Configuration → Application settings:

```
NODE_ENV=production
PORT=8080
WEBSITE_NODE_DEFAULT_VERSION=18
SCM_DO_BUILD_DURING_DEPLOYMENT=false
VITE_OPENAI_API_KEY=your-openai-api-key
```

### Startup Command (if needed)
In Azure Portal → Configuration → General Settings → Startup Command:
```
node server.js
```

## 🔧 Key Features

### Health Check Endpoint
Your application includes a health check at `/health`:
- URL: `https://your-app-name.azurewebsites.net/health`
- Response: `{"status":"OK","timestamp":"...","app":"FinBuddy","version":"1.0.0"}`

### React Router Support
- All client-side routes are properly handled
- Users can refresh any page or navigate directly to routes
- 404 errors are handled by React Router

### Security Headers
The server includes basic security headers for production deployment.

## 🚀 Deployment Verification

After deployment, test these URLs:
1. **Main App**: `https://your-app-name.azurewebsites.net`
2. **Health Check**: `https://your-app-name.azurewebsites.net/health`
3. **Any Route**: `https://your-app-name.azurewebsites.net/any-path` (should load the React app)

## 🔍 Troubleshooting

### Common Issues:

1. **"Application Error" on Azure**
   - Check Application Logs in Azure Portal
   - Verify `package.json` has correct start script
   - Ensure all dependencies are in `dependencies` (not `devDependencies`)

2. **Static Files Not Loading**
   - Verify `dist/` folder was included in deployment
   - Check that `npm run build` completed successfully before deployment

3. **Environment Variables**
   - Set `VITE_OPENAI_API_KEY` in Azure App Service configuration
   - Remember that Vite environment variables are build-time, not runtime

4. **Port Issues**
   - Azure automatically sets `PORT` environment variable
   - Server.js uses `process.env.PORT || 8080` for compatibility

### Debugging Commands:
```bash
# Local testing
npm run serve

# Check build output
npm run build
ls -la dist/

# Test server locally
node server.js
```

## 📝 File Structure After Deployment
```
/site/wwwroot/
├── dist/                 # Built React application
├── node_modules/         # Dependencies
├── server.js            # Express server
├── package.json         # Project configuration
└── package-lock.json    # Dependency lock file
```

## ✅ Deployment Checklist
- [ ] Application builds successfully (`npm run build`)
- [ ] Server starts locally (`npm start`)
- [ ] Health check responds (`http://localhost:8080/health`)
- [ ] React app loads (`http://localhost:8080`)
- [ ] All routes work (test navigation)
- [ ] Environment variables configured in Azure
- [ ] Deployment package created
- [ ] Uploaded to Azure App Service
- [ ] Application accessible at Azure URL

## 🔗 Next Steps
After successful deployment:
1. Configure custom domain (if needed)
2. Set up SSL certificate
3. Configure monitoring and logging
4. Set up staging slots for blue-green deployments
5. Configure auto-scaling rules

Your FinBuddy application is now ready for Azure App Service deployment as a Node.js application!
