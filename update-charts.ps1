# PowerShell script to update all chart components to use ApexCharts with Flowbite design
Write-Host "🚀 Starting site-wide chart update to Flowbite design v2.2.0" -ForegroundColor Green

# Create backup of original files
Write-Host "📦 Creating backup of original chart components..." -ForegroundColor Yellow
$backupDir = "src\components\backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
New-Item -ItemType Directory -Path $backupDir -Force

Copy-Item "src\components\SpendingTrends.tsx" "$backupDir\SpendingTrends.tsx.bak" -Force
Copy-Item "src\components\BudgetAnalyzer.tsx" "$backupDir\BudgetAnalyzer.tsx.bak" -Force
Copy-Item "src\components\analytics\AdvancedCharts.tsx" "$backupDir\AdvancedCharts.tsx.bak" -Force

Write-Host "✅ Backup completed in $backupDir" -ForegroundColor Green

# Update package.json to ensure ApexCharts is available
Write-Host "📋 Checking ApexCharts dependencies..." -ForegroundColor Yellow
$packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json

if (-not $packageJson.dependencies."apexcharts") {
    Write-Host "⚠️  ApexCharts not found in dependencies. Installing..." -ForegroundColor Yellow
    npm install apexcharts react-apexcharts --save
} else {
    Write-Host "✅ ApexCharts already installed" -ForegroundColor Green
}

Write-Host "🎯 All chart components will now use ApexCharts with Flowbite design patterns" -ForegroundColor Cyan
Write-Host "📊 Charts updated: SpendingTrends, BudgetAnalyzer, AdvancedCharts" -ForegroundColor Cyan
Write-Host "✨ Features: Professional styling, gradient fills, responsive layouts" -ForegroundColor Cyan

Write-Host "🎉 Chart update preparation completed!" -ForegroundColor Green
Write-Host "💡 The AI will now complete the component updates..." -ForegroundColor Yellow
