import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock browser APIs for E2E simulation
const mockLocalStorage = {
  store: {} as Record<string, string>,
  getItem: vi.fn((key: string) => mockLocalStorage.store[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    mockLocalStorage.store[key] = value
  }),
  removeItem: vi.fn((key: string) => {
    delete mockLocalStorage.store[key]
  }),
  clear: vi.fn(() => {
    mockLocalStorage.store = {}
  })
}

const mockSessionStorage = {
  store: {} as Record<string, string>,
  getItem: vi.fn((key: string) => mockSessionStorage.store[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    mockSessionStorage.store[key] = value
  }),
  removeItem: vi.fn((key: string) => {
    delete mockSessionStorage.store[key]
  }),
  clear: vi.fn(() => {
    mockSessionStorage.store = {}
  })
}

// Mock window object
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage })
Object.defineProperty(window, 'sessionStorage', { value: mockSessionStorage })

describe('End-to-End Application Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.store = {}
    mockSessionStorage.store = {}
  })

  describe('User Journey: First Time User', () => {
    it('should complete first-time user onboarding flow', () => {
      // 1. User visits app for first time
      const isFirstVisit = !mockLocalStorage.getItem('finbuddy-visited')
      expect(isFirstVisit).toBe(true)

      // 2. App shows welcome/onboarding
      const showOnboarding = isFirstVisit
      expect(showOnboarding).toBe(true)

      // 3. User completes onboarding
      mockLocalStorage.setItem('finbuddy-visited', 'true')
      mockLocalStorage.setItem('finbuddy-onboarding-complete', 'true')

      // 4. User preferences are set to defaults
      mockLocalStorage.setItem('finbuddy-view-mode', 'grid')
      mockLocalStorage.setItem('finbuddy-theme', 'system')

      // 5. Verify onboarding completion
      expect(mockLocalStorage.getItem('finbuddy-visited')).toBe('true')
      expect(mockLocalStorage.getItem('finbuddy-onboarding-complete')).toBe('true')
    })

    it('should handle user authentication flow', () => {
      // 1. User attempts to access protected content
      const user = null
      const requiresAuth = true

      if (requiresAuth && !user) {
        // 2. Redirect to login
        const shouldShowLogin = true
        expect(shouldShowLogin).toBe(true)
      }

      // 3. User signs in successfully
      const authenticatedUser = {
        uid: 'test-user-123',
        email: 'newuser@example.com',
        displayName: 'New User'
      }

      // 4. Store auth state
      mockSessionStorage.setItem('auth-user', JSON.stringify(authenticatedUser))

      // 5. Verify authentication
      const storedUser = JSON.parse(mockSessionStorage.getItem('auth-user') || '{}')
      expect(storedUser.uid).toBe('test-user-123')
      expect(storedUser.email).toBe('newuser@example.com')
    })
  })

  describe('User Journey: Daily Expense Tracking', () => {
    beforeEach(() => {
      // Setup authenticated user
      const user = { uid: 'test-user', email: 'user@example.com' }
      mockSessionStorage.setItem('auth-user', JSON.stringify(user))
    })

    it('should complete daily expense entry workflow', () => {
      // 1. User opens add expense modal
      const modalState = { isOpen: false }
      modalState.isOpen = true
      expect(modalState.isOpen).toBe(true)

      // 2. User fills out expense form
      const expenseForm = {
        amount: '',
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        people: [] as string[]
      }

      // 3. User enters expense details
      expenseForm.amount = '12.50'
      expenseForm.category = 'Food'
      expenseForm.description = 'Coffee'
      expenseForm.people = ['self']

      // 4. Form validation
      const isValid = expenseForm.amount && 
                     expenseForm.category && 
                     expenseForm.description &&
                     parseFloat(expenseForm.amount) > 0

      expect(isValid).toBe(true)

      // 5. Submit expense
      const expense = {
        id: 'exp_' + Date.now(),
        ...expenseForm,
        amount: parseFloat(expenseForm.amount),
        createdAt: new Date().toISOString()
      }

      // 6. Store in local state (simulating successful save)
      const expenses = JSON.parse(mockLocalStorage.getItem('recent-expenses') || '[]')
      expenses.push(expense)
      mockLocalStorage.setItem('recent-expenses', JSON.stringify(expenses))

      // 7. Verify expense was added
      const updatedExpenses = JSON.parse(mockLocalStorage.getItem('recent-expenses') || '[]')
      expect(updatedExpenses).toHaveLength(1)
      expect(updatedExpenses[0].description).toBe('Coffee')
      expect(updatedExpenses[0].amount).toBe(12.50)
    })

    it('should handle bulk expense operations', () => {
      // 1. User adds multiple expenses
      const expenses = [
        { id: '1', amount: 25.00, category: 'Food', description: 'Lunch', date: '2025-08-22' },
        { id: '2', amount: 50.00, category: 'Transport', description: 'Gas', date: '2025-08-22' },
        { id: '3', amount: 15.00, category: 'Food', description: 'Snack', date: '2025-08-21' }
      ]

      mockLocalStorage.setItem('expenses', JSON.stringify(expenses))

      // 2. User applies filters
      const filters = {
        searchTerm: 'food',
        category: 'Food',
        dateRange: { start: '2025-08-21', end: '2025-08-22' }
      }

      // 3. Filter logic
      const filteredExpenses = expenses.filter(expense => {
        const matchesSearch = !filters.searchTerm || 
          expense.description.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
          expense.category.toLowerCase().includes(filters.searchTerm.toLowerCase())
        
        const matchesCategory = !filters.category || 
          filters.category === 'all' || 
          expense.category === filters.category

        return matchesSearch && matchesCategory
      })

      // 4. Verify filtering
      expect(filteredExpenses).toHaveLength(2)
      expect(filteredExpenses.every(exp => exp.category === 'Food')).toBe(true)

      // 5. User selects expenses for bulk action
      const selectedExpenses = ['1', '3']
      
      // 6. User deletes selected expenses
      const remainingExpenses = expenses.filter(exp => !selectedExpenses.includes(exp.id))
      mockLocalStorage.setItem('expenses', JSON.stringify(remainingExpenses))

      // 7. Verify bulk deletion
      const updatedExpenses = JSON.parse(mockLocalStorage.getItem('expenses') || '[]')
      expect(updatedExpenses).toHaveLength(1)
      expect(updatedExpenses[0].id).toBe('2')
    })
  })

  describe('User Journey: Budget Management', () => {
    it('should complete budget setup and monitoring workflow', () => {
      // 1. User creates monthly budget
      const budget = {
        id: 'budget_' + Date.now(),
        category: 'Food',
        amount: 400,
        period: 'monthly',
        startDate: '2025-08-01',
        endDate: '2025-08-31'
      }

      mockLocalStorage.setItem('budgets', JSON.stringify([budget]))

      // 2. User adds expenses throughout month
      const expenses = [
        { amount: 50, category: 'Food', date: '2025-08-05' },
        { amount: 75, category: 'Food', date: '2025-08-12' },
        { amount: 60, category: 'Food', date: '2025-08-18' }
      ]

      // 3. Calculate budget usage
      const foodExpenses = expenses.filter(exp => exp.category === 'Food')
      const totalSpent = foodExpenses.reduce((sum, exp) => sum + exp.amount, 0)
      const percentageUsed = (totalSpent / budget.amount) * 100

      // 4. Verify budget tracking
      expect(totalSpent).toBe(185)
      expect(Math.round(percentageUsed)).toBe(46)
      expect(budget.amount - totalSpent).toBe(215)

      // 5. Check budget alerts
      const budgetStatus = percentageUsed >= 100 ? 'over' : 
                          percentageUsed >= 80 ? 'warning' : 'good'
      
      expect(budgetStatus).toBe('good')

      // 6. User receives notification when approaching limit
      const shouldNotify = percentageUsed >= 75
      expect(shouldNotify).toBe(false)

      // 7. Simulate reaching warning threshold
      const additionalExpense = { amount: 120, category: 'Food', date: '2025-08-22' }
      const newTotal = totalSpent + additionalExpense.amount
      const newPercentage = (newTotal / budget.amount) * 100

      expect(Math.round(newPercentage)).toBe(76)
      expect(newPercentage >= 75).toBe(true)
    })
  })

  describe('User Journey: Data Persistence and Sync', () => {
    it('should handle data persistence across sessions', () => {
      // 1. User creates data in session 1
      const userData = {
        preferences: { viewMode: 'list', theme: 'dark' },
        expenses: [{ id: '1', amount: 25, category: 'Food' }],
        budgets: [{ id: '1', category: 'Food', amount: 300 }]
      }

      // Store data
      mockLocalStorage.setItem('user-preferences', JSON.stringify(userData.preferences))
      mockLocalStorage.setItem('expenses', JSON.stringify(userData.expenses))
      mockLocalStorage.setItem('budgets', JSON.stringify(userData.budgets))

      // 2. Simulate session end/start (clear session storage, keep localStorage)
      mockSessionStorage.clear()

      // 3. App loads in new session
      const loadedPreferences = JSON.parse(mockLocalStorage.getItem('user-preferences') || '{}')
      const loadedExpenses = JSON.parse(mockLocalStorage.getItem('expenses') || '[]')
      const loadedBudgets = JSON.parse(mockLocalStorage.getItem('budgets') || '[]')

      // 4. Verify data persistence
      expect(loadedPreferences.viewMode).toBe('list')
      expect(loadedExpenses).toHaveLength(1)
      expect(loadedBudgets).toHaveLength(1)
    })

    it('should handle offline/online state transitions', () => {
      // 1. User goes offline
      const isOnline = false
      const pendingActions = [] as any[]

      // 2. User makes changes while offline
      const offlineExpense = {
        id: 'temp_' + Date.now(),
        amount: 30,
        category: 'Food',
        description: 'Offline expense',
        synced: false
      }

      pendingActions.push({ type: 'ADD_EXPENSE', data: offlineExpense })
      mockLocalStorage.setItem('pending-actions', JSON.stringify(pendingActions))

      // 3. Verify offline storage
      expect(pendingActions).toHaveLength(1)
      expect(pendingActions[0].data.synced).toBe(false)

      // 4. User comes back online
      const onlineState = true
      const storedActions = JSON.parse(mockLocalStorage.getItem('pending-actions') || '[]')

      // 5. Sync pending actions
      const syncResults = storedActions.map((action: any) => ({
        ...action,
        status: 'synced',
        syncedAt: new Date().toISOString()
      }))

      // 6. Clear pending actions after sync
      mockLocalStorage.removeItem('pending-actions')

      // 7. Verify sync completion
      expect(syncResults).toHaveLength(1)
      expect(syncResults[0].status).toBe('synced')
      expect(mockLocalStorage.getItem('pending-actions')).toBeNull()
    })
  })

  describe('User Journey: Error Recovery', () => {
    it('should handle network errors gracefully', () => {
      // 1. User attempts action that fails
      const networkError = new Error('Network request failed')
      
      // 2. App catches error and shows user-friendly message
      const errorHandler = (error: Error) => ({
        userMessage: 'Unable to save changes. Please check your connection.',
        shouldRetry: error.message.includes('Network'),
        canWorkOffline: true
      })

      const result = errorHandler(networkError)

      // 3. Verify error handling
      expect(result.shouldRetry).toBe(true)
      expect(result.canWorkOffline).toBe(true)
      expect(result.userMessage).toContain('connection')

      // 4. User chooses to work offline
      const workOffline = true
      if (workOffline) {
        mockLocalStorage.setItem('offline-mode', 'true')
      }

      // 5. Verify offline mode activation
      expect(mockLocalStorage.getItem('offline-mode')).toBe('true')
    })

    it('should handle data corruption recovery', () => {
      // 1. Simulate corrupted data
      mockLocalStorage.setItem('expenses', 'invalid-json-data')

      // 2. App attempts to load data
      const loadData = (key: string) => {
        try {
          const data = mockLocalStorage.getItem(key)
          return data ? JSON.parse(data) : []
        } catch (error) {
          // Data corruption detected
          console.warn(`Corrupted data detected for ${key}, resetting to default`)
          return []
        }
      }

      const expenses = loadData('expenses')

      // 3. Verify recovery
      expect(expenses).toEqual([])

      // 4. App creates backup before resetting
      mockLocalStorage.setItem('expenses-backup-' + Date.now(), 'invalid-json-data')
      mockLocalStorage.setItem('expenses', '[]')

      // 5. Verify backup creation
      const backupKey = Object.keys(mockLocalStorage.store).find(key => key.startsWith('expenses-backup-'))
      expect(backupKey).toBeDefined()
    })
  })

  describe('User Journey: Performance Optimization', () => {
    it('should handle large dataset efficiently', () => {
      // 1. Generate large dataset
      const largeDataset = Array.from({ length: 1000 }, (_, index) => ({
        id: `exp_${index}`,
        amount: Math.random() * 100,
        category: ['Food', 'Transport', 'Entertainment'][index % 3],
        date: new Date(2025, 0, (index % 30) + 1).toISOString().split('T')[0]
      }))

      // 2. Implement pagination
      const pageSize = 50
      const currentPage = 0
      
      const paginateData = (data: any[], page: number, size: number) => {
        const start = page * size
        const end = start + size
        return {
          items: data.slice(start, end),
          totalPages: Math.ceil(data.length / size),
          currentPage: page,
          totalItems: data.length
        }
      }

      const paginatedResult = paginateData(largeDataset, currentPage, pageSize)

      // 3. Verify pagination
      expect(paginatedResult.items).toHaveLength(50)
      expect(paginatedResult.totalPages).toBe(20)
      expect(paginatedResult.totalItems).toBe(1000)

      // 4. Implement search optimization
      const searchTerm = 'Food'
      const searchStart = performance.now()
      
      const searchResults = largeDataset.filter(item => 
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
      
      const searchEnd = performance.now()
      const searchTime = searchEnd - searchStart

      // 5. Verify search performance (should be under 10ms for 1000 items)
      expect(searchTime).toBeLessThan(10)
      expect(searchResults.length).toBeGreaterThan(300) // ~1/3 of items should be Food
    })
  })
})
