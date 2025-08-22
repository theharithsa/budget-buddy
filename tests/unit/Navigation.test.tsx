import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Navigation } from '@/components/Navigation'

// Mock the version utility
vi.mock('@/lib/version', () => ({
  getNavigationVersion: () => ({
    title: 'FinBuddy',
    version: 'v2.3.0',
    subtitle: 'v2.3.0 • Navigate to any section'
  })
}))

describe('Navigation Component', () => {
  const mockProps = {
    activeTab: 'dashboard',
    onTabChange: vi.fn(),
    onSidebarToggle: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render navigation with correct title and version', () => {
    render(<Navigation {...mockProps} />)
    
    expect(screen.getByText('FinBuddy')).toBeInTheDocument()
    expect(screen.getByText('v2.3.0')).toBeInTheDocument()
  })

  it('should highlight active tab', () => {
    render(<Navigation {...mockProps} activeTab="expenses" />)
    
    const expensesTab = screen.getByRole('button', { name: /expenses/i })
    expect(expensesTab).toHaveClass('bg-primary')
  })

  it('should call onTabChange when tab is clicked', () => {
    render(<Navigation {...mockProps} />)
    
    const expensesTab = screen.getByRole('button', { name: /expenses/i })
    fireEvent.click(expensesTab)
    
    expect(mockProps.onTabChange).toHaveBeenCalledWith('expenses')
  })

  it('should toggle sidebar collapse', () => {
    render(<Navigation {...mockProps} />)
    
    const toggleButton = screen.getByRole('button', { name: /toggle sidebar/i })
    fireEvent.click(toggleButton)
    
    expect(mockProps.onSidebarToggle).toHaveBeenCalledWith(true)
  })

  it('should show all navigation items', () => {
    render(<Navigation {...mockProps} />)
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Expenses')).toBeInTheDocument()
    expect(screen.getByText('Budgets')).toBeInTheDocument()
    expect(screen.getByText('People')).toBeInTheDocument()
    expect(screen.getByText('Templates')).toBeInTheDocument()
    expect(screen.getByText('Categories')).toBeInTheDocument()
  })

  it('should render mobile navigation on small screens', () => {
    // Mock window.innerWidth for mobile
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500,
    })

    render(<Navigation {...mockProps} />)
    
    // Should show mobile menu button
    expect(screen.getByRole('button', { name: /menu/i })).toBeInTheDocument()
  })

  it('should collapse sidebar when in collapsed state', () => {
    render(<Navigation {...mockProps} />)
    
    const toggleButton = screen.getByRole('button', { name: /toggle sidebar/i })
    fireEvent.click(toggleButton)
    
    // Title should be hidden when collapsed
    expect(screen.queryByText('FinBuddy')).not.toBeInTheDocument()
  })
})
