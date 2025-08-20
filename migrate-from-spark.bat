@echo off
REM Migration Script: Remove GitHub Spark Dependencies (Windows)
REM Run this script to migrate from Spark to standalone deployment

echo 🚀 Starting migration from GitHub Spark...

REM 1. Backup current package.json
echo 📦 Backing up package.json...
copy package.json package.json.spark-backup

REM 2. Install new dependencies
echo 📥 Installing OpenAI and Lucide React...
npm install openai@^4.20.0 lucide-react@^0.263.1

REM 3. Remove Spark dependency
echo 🗑️ Removing @github/spark dependency...
npm uninstall @github/spark

REM 4. Create environment file template
echo 🔧 Creating .env template...
(
echo # OpenAI Configuration
echo VITE_OPENAI_API_KEY=your_openai_api_key_here
echo.
echo # Firebase Configuration ^(already set but can be moved to env^)
echo VITE_FIREBASE_API_KEY=AIzaSyDrZD1uiFf6BCTBvMi0WDoAr0VJrEwXWL8
echo VITE_FIREBASE_AUTH_DOMAIN=finbuddy-2025.firebaseapp.com
echo VITE_FIREBASE_PROJECT_ID=finbuddy-2025
echo VITE_FIREBASE_STORAGE_BUCKET=finbuddy-2025.firebasestorage.app
echo VITE_FIREBASE_MESSAGING_SENDER_ID=1080442347255
echo VITE_FIREBASE_APP_ID=1:1080442347255:web:62813824efd5a9b12cfdf2
echo VITE_FIREBASE_MEASUREMENT_ID=G-ESNPQSYLCB
) > .env.example

echo ✅ Migration preparation complete!
echo.
echo 📋 Next steps:
echo 1. Copy .env.example to .env and add your OpenAI API key
echo 2. Update vite.config.ts ^(remove Spark plugins^)
echo 3. Update src/main.tsx ^(remove Spark import^)
echo 4. Update BudgetAnalyzer.tsx ^(replace spark.llm with OpenAI^)
echo 5. Replace @phosphor-icons with lucide-react icons
echo.
echo 📖 See DEPLOYMENT_GUIDE.md for detailed instructions

pause
