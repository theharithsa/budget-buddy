# Version Management Guide

This document outlines the version management strategy for Budget Buddy and provides guidelines for maintaining the changelog.

## 📋 Overview

Budget Buddy follows [Semantic Versioning](https://semver.org/) with automated version bumping and changelog management.

**Current Version**: `1.2.0` (People Management System)

## 🔢 Version Numbering

### Format: `MAJOR.MINOR.PATCH`

- **MAJOR** (X.0.0): Breaking changes, complete rewrites, API changes
- **MINOR** (X.Y.0): New features, enhancements, backwards-compatible changes
- **PATCH** (X.Y.Z): Bug fixes, security updates, minor improvements

## 🚀 Version Bump Commands

### Quick Commands
```bash
# For new features (most common)
npm run version:minor "Added new feature description"

# For bug fixes
npm run version:patch "Fixed specific bug description"

# For breaking changes
npm run version:major "Major rewrite or breaking change"
```

### Manual Command
```bash
npm run version:bump <type> "Description of changes"
```

### Examples
```bash
# Adding a new feature
npm run version:minor "Added People Management System"

# Fixing a bug
npm run version:patch "Fixed expense deletion not updating totals"

# Breaking change
npm run version:major "Redesigned authentication system"
```

## 📝 What the Scripts Do

1. **Updates package.json**: Bumps version number automatically
2. **Updates CHANGELOG.md**: Adds new entry with date and description
3. **Provides next steps**: Shows git commands for committing and tagging

## 📋 When to Bump Versions

### Minor Version (X.Y.0) - New Features
- ✅ New major components (PeopleManager, BudgetAnalyzer)
- ✅ New tabs or navigation sections
- ✅ New integrations (AI, external APIs)
- ✅ Significant UI/UX enhancements
- ✅ New data models or entities
- ✅ PWA features

### Patch Version (X.Y.Z) - Bug Fixes & Minor Improvements
- ✅ Bug fixes
- ✅ Security patches
- ✅ Performance optimizations
- ✅ Minor UI tweaks
- ✅ Documentation updates
- ✅ Dependency updates

### Major Version (X.0.0) - Breaking Changes
- ✅ Complete UI redesign
- ✅ Database schema changes
- ✅ API breaking changes
- ✅ Framework upgrades (React 18 → 19)
- ✅ Authentication system changes

## 📋 Release Process

### 1. Develop Feature
```bash
# Create feature branch
git checkout -b feature/new-feature

# Develop and test
# ...

# Commit changes
git add .
git commit -m "feat: implement new feature"
```

### 2. Bump Version
```bash
# For new features
npm run version:minor "Added new feature description"

# Review changes
git diff
```

### 3. Test & Verify
```bash
# Test the application
npm run dev

# Run linting
npm run lint

# Build for production
npm run build
```

### 4. Commit & Tag
```bash
# Commit version bump
git add .
git commit -m "chore: release v1.X.0"

# Tag the release
git tag v1.X.0

# Push to repository
git push origin main
git push --tags
```

### 5. Deploy
```bash
# Deploy to production
npm run build
# Deploy build to hosting service
```

## 📋 Changelog Guidelines

### Structure
```markdown
## [1.X.0] - YYYY-MM-DD

### ✨ Added
- New features and enhancements

### 🔧 Changed
- Changes to existing functionality

### 🐛 Fixed
- Bug fixes

### 🗑️ Removed
- Removed features

### 🔒 Security
- Security improvements
```

### Writing Good Changelog Entries
- ✅ **Be specific**: "Added People Management System" not "Added new feature"
- ✅ **Use action verbs**: "Added", "Fixed", "Updated", "Removed"
- ✅ **Include component names**: "Enhanced AddExpenseModal with people selection"
- ✅ **Mention user impact**: "Users can now track expenses by person"

## 🎯 Examples from Recent Releases

### v1.2.0 - People Management System (Minor)
```bash
npm run version:minor "Added comprehensive People Management System with CRUD operations, multi-person expense tracking, and public people sharing"
```

**Why Minor?**: New major feature that doesn't break existing functionality

### v1.1.1 - PWA Bug Fix (Patch)
```bash
npm run version:patch "Fixed PWA installation prompt not appearing on mobile devices"
```

**Why Patch?**: Bug fix that doesn't add new features

### v2.0.0 - New Authentication (Major)
```bash
npm run version:major "Redesigned authentication system with multi-provider support and breaking API changes"
```

**Why Major?**: Breaking changes that require user action

## 🔍 Version History Quick Reference

| Version | Date | Type | Description |
|---------|------|------|-------------|
| 1.2.0 | 2025-08-21 | Minor | People Management System |
| 1.1.0 | Previous | Minor | PWA Support & Category Management |
| 1.0.0 | Initial | Major | Initial Release |

## 🛠️ Troubleshooting

### Script Not Found
```bash
# Make sure scripts directory exists
mkdir -p scripts

# Check if version-bump.js exists
ls scripts/version-bump.js
```

### Permission Issues
```bash
# Make script executable (Linux/Mac)
chmod +x scripts/version-bump.js
```

### Manual Version Update
If scripts fail, manually update:
1. `package.json` - version field
2. `CHANGELOG.md` - add new entry
3. Commit and tag manually

## 🔗 Related Files
- `package.json` - Version and scripts
- `CHANGELOG.md` - Release history
- `scripts/version-bump.js` - Automation script
- `README.md` - Project documentation
