/**
 * Version Management Utility
 * Automatically reads version from package.json via Vite's define plugin at build time
 */

// Global variables defined by Vite's define plugin
declare const __APP_VERSION__: string;
declare const __APP_NAME__: string;

/**
 * Current application version from package.json
 */
export const APP_VERSION = __APP_VERSION__;

/**
 * Formatted version string with 'v' prefix
 */
export const APP_VERSION_DISPLAY = `v${APP_VERSION}`;

/**
 * Application name from package.json
 */
export const APP_NAME = __APP_NAME__;

/**
 * Application display name (capitalized)
 */
export const APP_DISPLAY_NAME = 'FinBuddy';

/**
 * Get version info for different contexts
 */
export const getVersionInfo = () => ({
  version: APP_VERSION,
  versionDisplay: APP_VERSION_DISPLAY,
  name: APP_NAME,
  displayName: APP_DISPLAY_NAME,
  fullName: `${APP_DISPLAY_NAME} ${APP_VERSION_DISPLAY}`,
});

/**
 * Get formatted subtitle for different pages
 */
export const getVersionSubtitle = (context: 'dashboard' | 'other' = 'other') => {
  if (context === 'dashboard') {
    return `Track your expenses, manage budgets • ${APP_VERSION_DISPLAY}`;
  }
  return `${APP_DISPLAY_NAME} • ${APP_VERSION_DISPLAY}`;
};

/**
 * Get navigation version info
 */
export const getNavigationVersion = () => ({
  title: APP_DISPLAY_NAME,
  version: APP_VERSION_DISPLAY,
  subtitle: `${APP_VERSION_DISPLAY} • Navigate to any section`,
});
