#!/bin/bash

# Fix icon imports across all components
echo "Fixing icon imports..."

# List of files to fix and their icon mappings
files=(
  "src/components/AppHeader.tsx"
  "src/components/BudgetAnalyzer.tsx"
  "src/components/CategoryManager.tsx"
  "src/components/SpendingTrends.tsx"
  "src/components/LoginPage.tsx"
  "src/components/BudgetSetupWizard.tsx"
  "src/components/BudgetCommunity.tsx"
  "src/components/ApiKeyManager.tsx"
  "src/components/AddExpenseModal.tsx"
)

echo "Files to fix: ${#files[@]}"

# Manual replacements for each file since automated replacement is complex
echo "Please manually replace the @phosphor-icons/react imports with lucide-react equivalents"
echo "Common mappings:"
echo "- @phosphor-icons/react -> lucide-react"
echo "- SignOut -> LogOut"
echo "- Warning -> AlertTriangle"
echo "- Trash -> Trash2"
echo "- Pencil -> Edit3"
echo "- ArrowsClockwise -> RotateCcw"
echo "- MagnifyingGlass -> Search"
echo "- TrendUp -> TrendingUp"
echo "- Swatches -> Palette"
echo "- GoogleLogo -> (use Chrome or external icon)"
echo "- ArrowSquareOut -> ExternalLink"
echo "- Remove weight prop from all icons"
