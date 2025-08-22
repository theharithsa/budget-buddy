import { describe, it, expect } from 'vitest'
import { 
  APP_VERSION, 
  APP_VERSION_DISPLAY, 
  APP_NAME, 
  APP_DISPLAY_NAME,
  getVersionInfo,
  getVersionSubtitle,
  getNavigationVersion
} from '@/lib/version'

describe('Version Management System', () => {
  it('should have correct app version from build-time injection', () => {
    expect(APP_VERSION).toBe('2.3.0')
    expect(APP_VERSION_DISPLAY).toBe('v2.3.0')
  })

  it('should have correct app name from build-time injection', () => {
    expect(APP_NAME).toBe('finbuddy')
    expect(APP_DISPLAY_NAME).toBe('FinBuddy')
  })

  it('should generate correct version info object', () => {
    const versionInfo = getVersionInfo()
    
    expect(versionInfo).toEqual({
      version: '2.3.0',
      versionDisplay: 'v2.3.0',
      name: 'finbuddy',
      displayName: 'FinBuddy',
      fullName: 'FinBuddy v2.3.0'
    })
  })

  it('should generate correct dashboard subtitle', () => {
    const dashboardSubtitle = getVersionSubtitle('dashboard')
    expect(dashboardSubtitle).toBe('Track your expenses, manage budgets • v2.3.0')
  })

  it('should generate correct other pages subtitle', () => {
    const otherSubtitle = getVersionSubtitle('other')
    expect(otherSubtitle).toBe('FinBuddy • v2.3.0')
    
    // Test default parameter
    const defaultSubtitle = getVersionSubtitle()
    expect(defaultSubtitle).toBe('FinBuddy • v2.3.0')
  })

  it('should generate correct navigation version info', () => {
    const navVersion = getNavigationVersion()
    
    expect(navVersion).toEqual({
      title: 'FinBuddy',
      version: 'v2.3.0',
      subtitle: 'v2.3.0 • Navigate to any section'
    })
  })

  it('should maintain consistency across all version utilities', () => {
    const versionInfo = getVersionInfo()
    const navVersion = getNavigationVersion()
    const dashboardSubtitle = getVersionSubtitle('dashboard')
    const otherSubtitle = getVersionSubtitle('other')

    // All should reference the same version
    expect(versionInfo.versionDisplay).toBe(navVersion.version)
    expect(dashboardSubtitle).toContain(versionInfo.versionDisplay)
    expect(otherSubtitle).toContain(versionInfo.versionDisplay)
    expect(navVersion.subtitle).toContain(versionInfo.versionDisplay)
  })
})
