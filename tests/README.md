# Test Documentation

## Test Structure

This project includes comprehensive testing coverage organized into three levels:

### 1. Unit Tests (`tests/unit/`)

- **version.test.ts**: Tests automated version management system
- **Navigation.test.tsx**: Component rendering and interaction tests
- **ExpenseManagement.test.tsx**: CRUD operations and validation
- **BudgetManagement.test.ts**: Budget calculations and tracking
- **FirebaseIntegration.test.ts**: Database operations and authentication
- **DashboardAnalytics.test.ts**: Analytics and insights generation
- **ResponsiveDesign.test.ts**: Mobile/desktop responsive behavior

### 2. Integration Tests (`tests/integration/`)

- **AppWorkflow.test.tsx**: End-to-end application workflows and data flow

### 3. E2E Tests (`tests/e2e/`)

- **UserJourneys.test.ts**: Complete user experience scenarios

## Test Commands

```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests once (CI mode)
npm run test:run

# Run with coverage report
npm run test:coverage

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e

# Watch mode for development
npm run test:watch

# CI mode with verbose output and coverage
npm run test:ci

# Full pre-deployment check
npm run test:pre-deploy
```

## Test Coverage Goals

- **Unit Tests**: 90%+ code coverage
- **Integration Tests**: Core workflow validation
- **E2E Tests**: Critical user journey validation

## Testing Philosophy

1. **Fast Feedback**: Unit tests for quick iteration
2. **Confidence**: Integration tests for workflow validation
3. **User Focus**: E2E tests for real-world scenarios
4. **Automation**: CI/CD integration for quality gates

## Pre-Deployment Checklist

Before pushing to main branch:

1. ✅ All unit tests pass
2. ✅ Integration tests validate workflows
3. ✅ E2E tests cover user journeys
4. ✅ Linting passes without errors
5. ✅ Build completes successfully
6. ✅ Coverage meets minimum thresholds

Run: `npm run test:pre-deploy` to verify all checks pass.
