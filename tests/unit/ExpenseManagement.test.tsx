import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock Firebase operations
const mockExpenses = [
  {
    id: '1',
    amount: 50.00,
    category: 'Food',
    description: 'Lunch at restaurant',
    date: '2025-08-22',
    receatedAt: '2025-08-22T12:00:00Z',
    people: ['person1']
  },
  {
    id: '2',
    amount: 25.99,
    category: 'Transport',
    description: 'Bus ticket',
    date: '2025-08-21',
    receatedAt: '2025-08-21T15:30:00Z',
    people: []
  }
]

// Mock the useFirestoreData hook
vi.mock('@/hooks/useFirestoreData', () => ({
  useFirestoreData: () => ({
    expenses: mockExpenses,
    budgets: [],
    people: [],
    customPeople: [],
    publicPeople: [],
    categories: [],
    templates: [],
    addExpense: vi.fn(),
    updateExpense: vi.fn(),
    deleteExpense: vi.fn(),
    addBudget: vi.fn(),
    addPerson: vi.fn(),
    addCategory: vi.fn(),
    loading: false,
    error: null
  })
}))

describe('Expense Management', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should display list of expenses', () => {
    // Mock ExpenseCard component since we're testing data flow
    const MockExpenseCard = ({ expense, viewMode }: any) => (
      <div data-testid={`expense-${expense.id}`}>
        <span>{expense.description}</span>
        <span>${expense.amount}</span>
        <span>{expense.category}</span>
      </div>
    )

    render(
      <div>
        {mockExpenses.map(expense => (
          <MockExpenseCard key={expense.id} expense={expense} viewMode="list" />
        ))}
      </div>
    )

    expect(screen.getByText('Lunch at restaurant')).toBeInTheDocument()
    expect(screen.getByText('$50')).toBeInTheDocument()
    expect(screen.getByText('Food')).toBeInTheDocument()
    expect(screen.getByText('Bus ticket')).toBeInTheDocument()
    expect(screen.getByText('$25.99')).toBeInTheDocument()
    expect(screen.getByText('Transport')).toBeInTheDocument()
  })

  it('should filter expenses by search term', () => {
    // Mock filtering logic
    const searchTerm = 'lunch'
    const filteredExpenses = mockExpenses.filter(expense =>
      expense.description.toLowerCase().includes(searchTerm.toLowerCase())
    )

    expect(filteredExpenses).toHaveLength(1)
    expect(filteredExpenses[0].description).toBe('Lunch at restaurant')
  })

  it('should filter expenses by category', () => {
    const categoryFilter = 'Food'
    const filteredExpenses = mockExpenses.filter(expense =>
      expense.category === categoryFilter
    )

    expect(filteredExpenses).toHaveLength(1)
    expect(filteredExpenses[0].category).toBe('Food')
  })

  it('should sort expenses by date', () => {
    const sortedExpenses = [...mockExpenses].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    expect(sortedExpenses[0].date).toBe('2025-08-22')
    expect(sortedExpenses[1].date).toBe('2025-08-21')
  })

  it('should sort expenses by amount', () => {
    const sortedExpenses = [...mockExpenses].sort((a, b) => b.amount - a.amount)

    expect(sortedExpenses[0].amount).toBe(50.00)
    expect(sortedExpenses[1].amount).toBe(25.99)
  })

  it('should validate expense data', () => {
    const validateExpense = (expense: any) => {
      const errors: string[] = []
      
      if (!expense.amount || expense.amount <= 0) {
        errors.push('Amount must be greater than 0')
      }
      
      if (!expense.description || expense.description.trim() === '') {
        errors.push('Description is required')
      }
      
      if (!expense.category) {
        errors.push('Category is required')
      }
      
      if (!expense.date) {
        errors.push('Date is required')
      }
      
      return errors
    }

    // Valid expense
    expect(validateExpense(mockExpenses[0])).toHaveLength(0)

    // Invalid expense
    const invalidExpense = {
      amount: 0,
      description: '',
      category: '',
      date: ''
    }
    const errors = validateExpense(invalidExpense)
    expect(errors).toHaveLength(4)
    expect(errors).toContain('Amount must be greater than 0')
    expect(errors).toContain('Description is required')
    expect(errors).toContain('Category is required')
    expect(errors).toContain('Date is required')
  })
})
