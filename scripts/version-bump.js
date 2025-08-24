#!/usr/bin/env node

/**
 * Version Bump Script for FinBuddy
 * 
 * This script helps automate version bumping and changelog management
 * Usage: npm run version:bump <type> [description]
 * 
 * Types:
 * - major: For breaking changes (1.0.0 -> 2.0.0)
 * - minor: For new features (1.0.0 -> 1.1.0)
 * - patch: For bug fixes (1.0.0 -> 1.0.1)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get command line arguments
const args = process.argv.slice(2);
const bumpType = args[0]; // major, minor, patch
const description = args.slice(1).join(' ') || 'Release update';

if (!bumpType || !['major', 'minor', 'patch'].includes(bumpType)) {
  console.error('❌ Please specify version bump type: major, minor, or patch');
  console.log('Usage: npm run version:bump <type> [description]');
  console.log('Example: npm run version:bump minor "Added People Management System"');
  process.exit(1);
}

// Read package.json
const packagePath = path.join(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const currentVersion = packageJson.version;

// Parse current version
const [major, minor, patch] = currentVersion.split('.').map(Number);

// Calculate new version
let newVersion;
switch (bumpType) {
  case 'major':
    newVersion = `${major + 1}.0.0`;
    break;
  case 'minor':
    newVersion = `${major}.${minor + 1}.0`;
    break;
  case 'patch':
    newVersion = `${major}.${minor}.${patch + 1}`;
    break;
}

// Update package.json
packageJson.version = newVersion;
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 4));

// Get current date
const now = new Date();
const dateString = now.toISOString().split('T')[0]; // YYYY-MM-DD format

// Update CHANGELOG.md
const changelogPath = path.join(__dirname, '../CHANGELOG.md');
let changelog = fs.readFileSync(changelogPath, 'utf8');

// Prepare new changelog entry
const newEntry = `## [${newVersion}] - ${dateString}

### ${bumpType === 'major' ? '💥 Breaking Changes' : bumpType === 'minor' ? '✨ Added' : '🐛 Fixed'}

- ${description}

`;

// Insert new entry after "## [Unreleased]"
const unreleasedIndex = changelog.indexOf('## [Unreleased]');
if (unreleasedIndex !== -1) {
  const insertPosition = changelog.indexOf('\n', unreleasedIndex) + 1;
  changelog = changelog.slice(0, insertPosition) + '\n' + newEntry + changelog.slice(insertPosition);
} else {
  // If no unreleased section, add after the first heading
  const firstHeadingIndex = changelog.indexOf('## ');
  if (firstHeadingIndex !== -1) {
    changelog = changelog.slice(0, firstHeadingIndex) + newEntry + changelog.slice(firstHeadingIndex);
  }
}

fs.writeFileSync(changelogPath, changelog);

// Success message
console.log(`✅ Version bumped from ${currentVersion} to ${newVersion}`);
console.log(`📝 Updated CHANGELOG.md with new ${bumpType} release`);
console.log(`📦 Package.json updated`);
console.log('');
console.log('🎉 Release preparation complete!');
console.log('');
console.log('Next steps:');
console.log('1. Review changes: git diff');
console.log('2. Test the application: npm run dev');
console.log('3. Commit changes: git add . && git commit -m "chore: release v' + newVersion + '"');
console.log('4. Tag release: git tag v' + newVersion);
console.log('5. Push to repository: git push && git push --tags');
