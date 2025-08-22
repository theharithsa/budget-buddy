import { describe, it, expect, beforeEach } from 'vitest'

describe('Dashboard Analytics', () => {
  const mockExpenses = [
    { amount: 100, category: 'Food', date: '2025-08-01' },
    { amount: 200, category: 'Food', date: '2025-08-15' },
    { amount: 50, category: 'Transport', date: '2025-08-10' },
    { amount: 150, category: 'Entertainment', date: '2025-08-20' },
    { amount: 75, category: 'Transport', date: '2025-08-25' }
  ]

  const mockBudgets = [
    { category: 'Food', amount: 400, period: 'monthly' },
    { category: 'Transport', amount: 200, period: 'monthly' },
    { category: 'Entertainment', amount: 100, period: 'monthly' }
  ]

  it('should calculate total expenses', () => {
    const calculateTotalExpenses = (expenses: any[]) => {
      return expenses.reduce((sum, expense) => sum + expense.amount, 0)
    }

    expect(calculateTotalExpenses(mockExpenses)).toBe(575)
    expect(calculateTotalExpenses([])).toBe(0)
  })

  it('should calculate expenses by category', () => {
    const getExpensesByCategory = (expenses: any[]) => {
      return expenses.reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount
        return acc
      }, {})
    }

    const result = getExpensesByCategory(mockExpenses)
    
    expect(result.Food).toBe(300)
    expect(result.Transport).toBe(125)
    expect(result.Entertainment).toBe(150)
  })

  it('should calculate monthly spending trends', () => {
    const getMonthlyTrends = (expenses: any[]) => {
      return expenses.reduce((acc, expense) => {
        const month = expense.date.substring(0, 7) // YYYY-MM format
        acc[month] = (acc[month] || 0) + expense.amount
        return acc
      }, {})
    }

    const result = getMonthlyTrends(mockExpenses)
    expect(result['2025-08']).toBe(575)
  })

  it('should calculate budget utilization', () => {
    const getBudgetUtilization = (budgets: any[], expenses: any[]) => {
      const expensesByCategory = expenses.reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount
        return acc
      }, {})

      return budgets.map(budget => {
        const spent = expensesByCategory[budget.category] || 0
        const percentage = (spent / budget.amount) * 100
        
        return {
          category: budget.category,
          budget: budget.amount,
          spent,
          percentage: Math.round(percentage),
          remaining: budget.amount - spent,
          status: percentage >= 100 ? 'over' : percentage >= 80 ? 'warning' : 'good'
        }
      })
    }

    const result = getBudgetUtilization(mockBudgets, mockExpenses)
    
    expect(result[0]).toEqual({
      category: 'Food',
      budget: 400,
      spent: 300,
      percentage: 75,
      remaining: 100,
      status: 'good'
    })

    expect(result[1]).toEqual({
      category: 'Transport',
      budget: 200,
      spent: 125,
      percentage: 63,
      remaining: 75,
      status: 'good'
    })

    expect(result[2]).toEqual({
      category: 'Entertainment',
      budget: 100,
      spent: 150,
      percentage: 150,
      remaining: -50,
      status: 'over'
    })
  })

  it('should calculate daily average spending', () => {
    const getDailyAverage = (expenses: any[], days: number) => {
      const total = expenses.reduce((sum, expense) => sum + expense.amount, 0)
      return days > 0 ? total / days : 0
    }

    expect(getDailyAverage(mockExpenses, 30)).toBeCloseTo(19.17, 2)
    expect(getDailyAverage(mockExpenses, 0)).toBe(0)
    expect(getDailyAverage([], 30)).toBe(0)
  })

  it('should find top spending categories', () => {
    const getTopCategories = (expenses: any[], limit: number = 3) => {
      const categoryTotals = expenses.reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount
        return acc
      }, {})

      return Object.entries(categoryTotals)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, limit)
        .map(([category, amount]) => ({ category, amount }))
    }

    const result = getTopCategories(mockExpenses, 2)
    
    expect(result).toEqual([
      { category: 'Food', amount: 300 },
      { category: 'Entertainment', amount: 150 }
    ])
  })

  it('should calculate expense frequency by category', () => {
    const getCategoryFrequency = (expenses: any[]) => {
      return expenses.reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + 1
        return acc
      }, {})
    }

    const result = getCategoryFrequency(mockExpenses)
    
    expect(result.Food).toBe(2)
    expect(result.Transport).toBe(2)
    expect(result.Entertainment).toBe(1)
  })

  it('should generate spending insights', () => {
    const generateInsights = (expenses: any[], budgets: any[]): string[] => {
      const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0)
      const totalBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0)
      
      const expensesByCategory = expenses.reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount
        return acc
      }, {} as Record<string, number>)

      const overBudgetCategories = budgets.filter(budget => {
        const spent = expensesByCategory[budget.category] || 0
        return spent > budget.amount
      })

      const insights: string[] = []
      
      if (totalSpent > totalBudget) {
        insights.push(`You're over budget by $${totalSpent - totalBudget}`)
      }
      
      if (overBudgetCategories.length > 0) {
        insights.push(`Over budget in ${overBudgetCategories.length} categories`)
      }
      
      const highestCategory = Object.entries(expensesByCategory)
        .sort(([,a], [,b]) => (b as number) - (a as number))[0]
      
      if (highestCategory) {
        insights.push(`Highest spending: ${highestCategory[0]} ($${highestCategory[1]})`)
      }

      return insights
    }

    const result = generateInsights(mockExpenses, mockBudgets)
    
    expect(result).toContain('Over budget in 1 categories')
    expect(result).toContain('Highest spending: Food ($300)')
  })
})
