import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('Budget Management', () => {
  const mockBudgets = [
    {
      id: '1',
      category: 'Food',
      amount: 500,
      spent: 250,
      period: 'monthly',
      startDate: '2025-08-01',
      endDate: '2025-08-31'
    },
    {
      id: '2',
      category: 'Transport',
      amount: 200,
      spent: 150,
      period: 'monthly',
      startDate: '2025-08-01',
      endDate: '2025-08-31'
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should calculate budget progress correctly', () => {
    const calculateProgress = (spent: number, budget: number) => {
      return Math.min((spent / budget) * 100, 100)
    }

    expect(calculateProgress(250, 500)).toBe(50)
    expect(calculateProgress(150, 200)).toBe(75)
    expect(calculateProgress(600, 500)).toBe(100) // Over budget
  })

  it('should determine budget status', () => {
    const getBudgetStatus = (spent: number, budget: number) => {
      const percentage = (spent / budget) * 100
      if (percentage >= 100) return 'over'
      if (percentage >= 80) return 'warning'
      return 'good'
    }

    expect(getBudgetStatus(250, 500)).toBe('good') // 50%
    expect(getBudgetStatus(160, 200)).toBe('warning') // 80%
    expect(getBudgetStatus(450, 500)).toBe('warning') // 90%
    expect(getBudgetStatus(600, 500)).toBe('over') // 120%
  })

  it('should calculate remaining budget', () => {
    const getRemainingBudget = (budget: number, spent: number) => {
      return Math.max(budget - spent, 0)
    }

    expect(getRemainingBudget(500, 250)).toBe(250)
    expect(getRemainingBudget(200, 150)).toBe(50)
    expect(getRemainingBudget(500, 600)).toBe(0) // Over budget
  })

  it('should validate budget data', () => {
    const validateBudget = (budget: any) => {
      const errors: string[] = []
      
      if (!budget.category) {
        errors.push('Category is required')
      }
      
      if (!budget.amount || budget.amount <= 0) {
        errors.push('Budget amount must be greater than 0')
      }
      
      if (!budget.period) {
        errors.push('Budget period is required')
      }
      
      if (!budget.startDate) {
        errors.push('Start date is required')
      }
      
      if (!budget.endDate) {
        errors.push('End date is required')
      }
      
      if (budget.startDate && budget.endDate && new Date(budget.startDate) >= new Date(budget.endDate)) {
        errors.push('End date must be after start date')
      }
      
      return errors
    }

    // Valid budget
    expect(validateBudget(mockBudgets[0])).toHaveLength(0)

    // Invalid budget
    const invalidBudget = {
      category: '',
      amount: 0,
      period: '',
      startDate: '2025-08-31',
      endDate: '2025-08-01'
    }
    const errors = validateBudget(invalidBudget)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors).toContain('Category is required')
    expect(errors).toContain('Budget amount must be greater than 0')
    expect(errors).toContain('Budget period is required')
    expect(errors).toContain('End date must be after start date')
  })

  it('should handle budget period calculations', () => {
    const isCurrentPeriod = (startDate: string, endDate: string) => {
      const now = new Date('2025-08-22') // Mock current date
      const start = new Date(startDate)
      const end = new Date(endDate)
      return now >= start && now <= end
    }

    expect(isCurrentPeriod('2025-08-01', '2025-08-31')).toBe(true)
    expect(isCurrentPeriod('2025-07-01', '2025-07-31')).toBe(false)
    expect(isCurrentPeriod('2025-09-01', '2025-09-30')).toBe(false)
  })

  it('should calculate budget vs actual spending', () => {
    const getBudgetComparison = (budgets: any[], expenses: any[]) => {
      return budgets.map(budget => {
        const categoryExpenses = expenses.filter(expense => 
          expense.category === budget.category &&
          expense.date >= budget.startDate &&
          expense.date <= budget.endDate
        )
        
        const actualSpent = categoryExpenses.reduce((sum, expense) => sum + expense.amount, 0)
        
        return {
          ...budget,
          actualSpent,
          variance: budget.amount - actualSpent,
          percentageUsed: (actualSpent / budget.amount) * 100
        }
      })
    }

    const mockExpenses = [
      { category: 'Food', amount: 100, date: '2025-08-15' },
      { category: 'Food', amount: 150, date: '2025-08-20' },
      { category: 'Transport', amount: 50, date: '2025-08-10' }
    ]

    const comparison = getBudgetComparison(mockBudgets, mockExpenses)
    
    expect(comparison[0].actualSpent).toBe(250) // Food category
    expect(comparison[0].variance).toBe(250) // 500 - 250
    expect(comparison[0].percentageUsed).toBe(50)
    
    expect(comparison[1].actualSpent).toBe(50) // Transport category
    expect(comparison[1].variance).toBe(150) // 200 - 50
    expect(comparison[1].percentageUsed).toBe(25)
  })
})
