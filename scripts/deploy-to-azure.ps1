#!/usr/bin/env powershell

# FinBuddy Azure Deployment Script
param(
    [Parameter(Mandatory=$true)]
    [string]$ResourceGroupName,
    
    [Parameter(Mandatory=$true)]
    [string]$AppServiceName
)

Write-Host "Starting FinBuddy deployment to Azure App Service..." -ForegroundColor Green
Write-Host "Resource Group: $ResourceGroupName" -ForegroundColor Cyan
Write-Host "App Service: $AppServiceName" -ForegroundColor Cyan

try {
    # Build the application
    Write-Host "Building the application..." -ForegroundColor Yellow
    npm run build
    
    if ($LASTEXITCODE -ne 0) {
        throw "Build failed"
    }
    
    # Copy web.config to dist folder
    Write-Host "Copying web.config to dist folder..." -ForegroundColor Yellow
    Copy-Item "web.config" "dist\web.config" -Force
    
    # Deploy to Azure
    Write-Host "Deploying to Azure App Service..." -ForegroundColor Yellow
    az webapp deploy --resource-group $ResourceGroupName --name $AppServiceName --src-path "./dist" --type static
    
    if ($LASTEXITCODE -ne 0) {
        throw "Deployment failed"
    }
    
    # Restart the app service
    Write-Host "Restarting App Service..." -ForegroundColor Yellow
    az webapp restart --resource-group $ResourceGroupName --name $AppServiceName
    
    if ($LASTEXITCODE -ne 0) {
        throw "App service restart failed"
    }
    
    # Get the app URL
    $appUrl = az webapp show --resource-group $ResourceGroupName --name $AppServiceName --query "defaultHostName" --output tsv
    
    Write-Host ""
    Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Your FinBuddy app is available at:" -ForegroundColor Yellow
    Write-Host "   https://$appUrl" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Visit the URL above to verify the deployment" -ForegroundColor White
    Write-Host "2. Add the URL to Firebase authorized domains if authentication fails" -ForegroundColor White
    Write-Host "3. Set environment variables in Azure Portal if needed" -ForegroundColor White
    
} catch {
    Write-Host ""
    Write-Host "❌ Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting steps:" -ForegroundColor Yellow
    Write-Host "1. Ensure you're logged into Azure CLI: az login" -ForegroundColor White
    Write-Host "2. Verify resource group and app service names" -ForegroundColor White
    Write-Host "3. Check that you have deployment permissions" -ForegroundColor White
    Write-Host "4. Try manual deployment via Azure Portal" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "🚀 Happy budgeting with FinBuddy!" -ForegroundColor Green
