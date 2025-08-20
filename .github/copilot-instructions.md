# Budget Buddy - AI Coding Agent Instructions

## 🎯 Project Overview

**Budget Buddy** is a comprehensive personal finance management application built with modern web technologies. It provides expense tracking, budget management, AI-powered financial insights, and secure cloud synchronization.

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Radix UI components
- **Backend**: Firebase (Auth, Firestore, Storage)
- **AI Integration**: OpenAI GPT-4 + Spark AI fallbacks
- **Deployment**: Azure App Service ready
- **Observability**: Dynatrace integration (configurable)

## 📁 Architecture & File Structure

### Core Application Files
```
src/
├── App.tsx                 # Main application component with tab navigation
├── main.tsx               # Application entry point & error boundaries
├── components/            # React components
│   ├── ui/               # Radix UI component library
│   ├── AddExpenseModal.tsx
│   ├── BudgetAnalyzer.tsx # AI-powered budget analysis
│   ├── BudgetManager.tsx
│   ├── CategoryManager.tsx
│   ├── LoginPage.tsx
│   └── ...
├── contexts/
│   └── AuthContext.tsx    # Firebase authentication context
├── hooks/
│   └── useFirestoreData.tsx # Firebase data management
├── lib/
│   ├── firebase.ts        # Firebase configuration & operations
│   ├── types.ts          # TypeScript interfaces & utilities
│   ├── utils.ts          # General utilities
│   └── logger.ts         # Observability & logging (disabled)
└── styles/
    └── theme.css         # Custom theme variables
```

### Key Configuration Files
- `vite.config.ts` - Build configuration with path aliases
- `tailwind.config.js` - Styling configuration
- `components.json` - Radix UI component configuration
- `tsconfig.json` - TypeScript configuration
- `package.json` - Dependencies & scripts

## 🔧 Development Patterns

### Component Architecture
- **UI Components**: Located in `src/components/ui/` (Radix UI based)
- **Feature Components**: Direct children of `src/components/`
- **Props Interface**: Always define TypeScript interfaces for component props
- **Error Boundaries**: Use React Error Boundary for component-level error handling

### State Management
- **Authentication**: React Context (`AuthContext.tsx`)
- **Data Management**: Custom hook (`useFirestoreData.tsx`)
- **Local State**: React hooks (`useState`, `useEffect`)
- **Form Handling**: React Hook Form with Zod validation

### Data Flow Patterns
```typescript
// Expense Management Example
interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  receatedAt: string;
  receiptUrl?: string;
}

// Firebase Operations Pattern
const addExpense = async (expense: Omit<Expense, 'id'>) => {
  // Validate user authentication
  // Add to Firestore with proper error handling
  // Update local state
  // Show user feedback via toast
};
```

## 🔥 Firebase Integration

### Authentication Flow
- **Provider**: Google OAuth via Firebase Auth
- **Context**: `AuthContext.tsx` manages user state
- **Protection**: Components check `user` state before rendering
- **Error Handling**: Redirect authentication errors handled gracefully

### Firestore Database Structure
```
/users/{userId}/expenses        # User expenses
/users/{userId}/budgets         # User budgets  
/users/{userId}/templates       # Recurring templates
/customCategories              # User-created categories
/publicCategories             # Shared categories
/budgetTemplates              # Budget templates
```

### Storage Operations
- **Receipts**: Uploaded to Firebase Storage
- **File Naming**: `receipts/{userId}/{timestamp}_{originalName}`
- **Cleanup**: Deleted files removed from Storage when expense deleted

## 🤖 AI Integration

### BudgetAnalyzer Component
The AI system has multiple fallback modes:

1. **OpenAI Direct**: GPT-4 API calls with environment variables
2. **Spark AI**: GitHub Spark AI integration
3. **Statistical**: Local calculation fallback
4. **Demo Mode**: Static demo data

### AI Implementation Pattern
```typescript
const analyzeSpending = async () => {
  setLoading(true);
  try {
    // Try OpenAI first
    const analysis = await callOpenAIDirectly(prompt);
    setAnalysis(JSON.parse(analysis));
  } catch (openAIError) {
    try {
      // Fallback to Spark AI
      const analysis = await callSparkAI(prompt);
      setAnalysis(analysis);
    } catch (sparkError) {
      // Fallback to statistical analysis
      const analysis = generateStatisticalAnalysis();
      setAnalysis(analysis);
    }
  } finally {
    setLoading(false);
  }
};
```

## 🔍 Observability & Logging

### Current State
- **Logger**: Comprehensive logging system in `src/lib/logger.ts` (currently disabled)
- **Performance**: Logging system caused application hangs, requires optimization
- **Dynatrace**: Integration available but disabled pending performance fixes

### Service Identification Patterns
When implementing observability:
- **Service Name**: "budget-buddy-frontend"
- **Environment**: Use `VITE_ENVIRONMENT` or `NODE_ENV`
- **Endpoints**: Track Firebase operations, AI API calls, user actions
- **Performance**: Monitor component render times, API response times

### Error Handling Patterns
```typescript
// Component Error Handling
try {
  await apiOperation();
  toast.success("Operation completed");
} catch (error) {
  console.error('Component: Operation failed', error);
  toast.error("Operation failed");
  // Future: log.error('Component', 'Operation failed', { error });
}
```

## 🛠️ Development Workflow

### Environment Setup
1. **Clone Repository**: Use provided GitHub repository
2. **Install Dependencies**: `npm install`
3. **Firebase Setup**: Configure `src/lib/firebase.ts` with your project
4. **Environment Variables**: Set `VITE_OPENAI_API_KEY` for AI features
5. **Development Server**: `npm run dev` (runs on port 5000)

### Build & Deployment
- **Development**: `npm run dev`
- **Production Build**: `npm run build`
- **Preview**: `npm run preview`
- **Linting**: `npm run lint`

### Firebase Configuration
Replace the config object in `src/lib/firebase.ts`:
```typescript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  // ... other config
};
```

## 🎨 UI/UX Patterns

### Design System
- **Components**: Radix UI primitives with Tailwind CSS
- **Theme**: Custom CSS variables in `src/styles/theme.css`
- **Icons**: Lucide React for consistent iconography
- **Toast Notifications**: Sonner for user feedback
- **Loading States**: Skeleton components for better UX

### Responsive Design
- **Mobile First**: Tailwind CSS responsive utilities
- **Breakpoints**: Standard Tailwind breakpoints (sm, md, lg, xl)
- **Touch Friendly**: Large tap targets for mobile devices

### Accessibility
- **Keyboard Navigation**: All interactive elements accessible
- **Screen Readers**: Proper ARIA labels and semantic HTML
- **Color Contrast**: WCAG compliant color schemes

## 🧪 Testing & Quality

### Error Boundaries
- **App Level**: Error boundary in `main.tsx`
- **Component Level**: Use `ErrorFallback.tsx` for component errors
- **Firebase Errors**: Proper error handling for network issues

### Common Issues & Solutions

1. **Firebase Authentication**
   ```typescript
   // Check user exists before operations
   if (!user) {
     toast.error("Please sign in to continue");
     return;
   }
   ```

2. **API Rate Limiting**
   ```typescript
   // Implement retry logic with exponential backoff
   const retryWithBackoff = async (fn, maxRetries = 3) => {
     // Implementation pattern
   };
   ```

3. **Performance Optimization**
   ```typescript
   // Use React.memo for expensive components
   export const ExpensiveComponent = React.memo(({ data }) => {
     // Component implementation
   });
   ```

## 🚀 Feature Implementation Guidelines

### Adding New Features
1. **Plan Data Model**: Define TypeScript interfaces in `src/lib/types.ts`
2. **Create Components**: Follow existing component patterns
3. **Firebase Integration**: Add database operations to appropriate hooks
4. **Error Handling**: Implement proper error boundaries and user feedback
5. **Testing**: Test authentication flows and data persistence

### AI Feature Enhancement
1. **Prompt Engineering**: Update prompts in `BudgetAnalyzer.tsx`
2. **Fallback Modes**: Ensure statistical analysis works without AI
3. **Response Parsing**: Handle malformed AI responses gracefully
4. **Performance**: Cache analysis results, avoid excessive API calls

### UI Component Creation
1. **Base Components**: Use Radix UI primitives in `src/components/ui/`
2. **Feature Components**: Build feature-specific components
3. **TypeScript**: Always define proper prop interfaces
4. **Styling**: Use Tailwind CSS with custom CSS variables

## 📋 Common Tasks

### Adding a New Expense Category
1. Update `DEFAULT_CATEGORIES` in `src/lib/types.ts`
2. Add category validation to forms
3. Update category selection components
4. Test with existing expense data

### Implementing New AI Analysis
1. Add analysis type to `BudgetAnalysis` interface
2. Update AI prompts to include new analysis
3. Add UI components to display results
4. Implement statistical fallback calculation

### Firebase Schema Changes
1. Update TypeScript interfaces
2. Add database migration logic if needed
3. Test with existing user data
4. Update security rules if required

## 🔒 Security Considerations

### Firebase Security
- **Authentication**: Always verify user authentication
- **Firestore Rules**: Implement proper read/write permissions
- **API Keys**: Use environment variables, never commit to repository
- **Data Validation**: Validate all user inputs on client and server

### Environment Variables
```bash
# Required for AI features
VITE_OPENAI_API_KEY=your-openai-api-key

# Optional for enhanced observability
VITE_ENVIRONMENT=development|staging|production
VITE_DYNATRACE_URL=your-dynatrace-url
VITE_DYNATRACE_TOKEN=your-dynatrace-token
```

## 📚 Important Implementation Notes

### Performance Considerations
- **Logging System**: Currently disabled due to performance issues
- **Real-time Updates**: Use Firebase onSnapshot sparingly
- **Image Uploads**: Compress images before Firebase Storage upload
- **AI API Calls**: Implement caching and rate limiting

### Browser Compatibility
- **Modern Browsers**: Targets ES2020+ features
- **Mobile Safari**: Test touch interactions thoroughly
- **PWA Ready**: Service worker configuration available

### Deployment Readiness
- **Azure App Service**: Configuration ready in `vite.config.ts`
- **Environment Variables**: Configure in deployment platform
- **Build Optimization**: Production builds are optimized for performance

---

## 💡 Quick Reference

### Key File Locations
- Firebase config: `src/lib/firebase.ts`
- Type definitions: `src/lib/types.ts`
- Main app: `src/App.tsx`
- Authentication: `src/contexts/AuthContext.tsx`
- Data management: `src/hooks/useFirestoreData.tsx`
- AI analysis: `src/components/BudgetAnalyzer.tsx`

### Useful Commands
```bash
npm run dev          # Start development server
npm run build        # Production build
npm run lint         # Check code quality
npm run preview      # Preview production build
```

### Environment Setup Checklist
- [ ] Firebase project configured
- [ ] OpenAI API key set (optional)
- [ ] Authentication domains configured
- [ ] Firestore rules deployed
- [ ] Storage bucket configured

This guide should help AI coding agents understand the Budget Buddy codebase structure, implementation patterns, and development workflows to be immediately productive when working on the project.
