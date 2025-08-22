import '@testing-library/jest-dom'
import { vi, beforeEach, afterEach } from 'vitest'

// Make beforeEach and afterEach globally available
global.beforeEach = beforeEach
global.afterEach = afterEach

// Mock Firebase
vi.mock('@/lib/firebase', () => ({
  auth: {
    currentUser: null,
    onAuthStateChanged: vi.fn(),
    signOut: vi.fn(),
  },
  logOut: vi.fn(),
  debugFirebaseConfig: vi.fn(),
  addExpenseToFirestore: vi.fn(),
  checkFirebaseReady: vi.fn(),
}))

// Mock Vite environment variables
Object.defineProperty(globalThis, '__APP_VERSION__', {
  value: '2.3.0',
  writable: false,
})

Object.defineProperty(globalThis, '__APP_NAME__', {
  value: 'finbuddy',
  writable: false,
})

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})
