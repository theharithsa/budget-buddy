# Budget Buddy - AI Coding Agent Instructions

## 🎯 Project Overview

**Budget Buddy** is a comprehensive personal finance management application built with modern web technologies. It provides expense tracking, budget management, AI-powered financial insights, advanced dashboard analytics, gamification system, and secure cloud synchronization with full PWA support.

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Radix UI components
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Charts**: ApexCharts for advanced data visualization
- **AI Integration**: OpenAI GPT-4 + Spark AI fallbacks
- **PWA**: Service Worker + Installation Prompts + Offline Support
- **Navigation**: Collapsible sidebar with responsive design
- **Deployment**: Azure App Service ready
- **Observability**: Dynatrace integration (configurable)
- **Version**: Currently v2.5.5 with advanced dashboard, analytics, gamification system, and historical budget analysis

## 📁 Architecture & File Structure

### Core Application Files
```
src/
├── App.tsx                 # Main application with comprehensive tab navigation
├── main.tsx               # Application entry point & error boundaries
├── components/            # React components
│   ├── ui/               # Radix UI component library
│   ├── analytics/        # Analytics & gamification components
│   │   ├── GamificationSystem.tsx    # Achievement tracking & financial scoring
│   │   ├── AdvancedCharts.tsx        # Complex chart visualizations
│   │   └── SpendingBehaviorInsights.tsx # AI-powered behavior analysis
│   ├── Dashboard.tsx     # Advanced dashboard with ApexCharts integration
│   ├── AddExpenseModal.tsx # Fixed people selection using getAllPeople()
│   ├── EditExpenseModal.tsx # Consistent people data flow
│   ├── BudgetAnalyzer.tsx # AI-powered budget analysis
│   ├── BudgetManager.tsx
│   ├── CategoryManager.tsx
│   ├── LoginPage.tsx
│   ├── PeopleManager.tsx  # Full people management with public/private sharing
│   ├── TimeframePicker.tsx # Comprehensive date range selection
│   ├── Navigation.tsx     # Collapsible sidebar navigation
│   ├── AppHeader.tsx      # Enhanced with clear cache functionality
│   ├── ExpenseCard.tsx    # Support for list/grid view modes
│   ├── PWAComponents.tsx  # PWA install/update prompts and connection status
│   └── ...
├── contexts/
│   └── AuthContext.tsx    # Firebase authentication context
├── hooks/
│   ├── useFirestoreData.tsx # Firebase data management
│   └── use-mobile.ts      # Mobile detection hook
├── lib/
│   ├── firebase.ts        # Firebase configuration & operations
│   ├── types.ts          # TypeScript interfaces & utilities (includes getAllPeople)
│   ├── utils.ts          # General utilities
│   ├── pwa.ts            # PWA management and service worker utilities
│   └── logger.ts         # Observability & logging (disabled)
└── styles/
    └── theme.css         # Custom theme variables
```

### Key Configuration Files
- `vite.config.ts` - Build configuration with path aliases
- `tailwind.config.js` - Styling configuration
- `components.json` - Radix UI component configuration
- `tsconfig.json` - TypeScript configuration
- `package.json` - Dependencies & scripts (v2.5.5)
- `manifest.json` - PWA manifest for installation
- `sw.js` - Service worker for offline functionality

## 🔧 Development Patterns

### Component Architecture
- **UI Components**: Located in `src/components/ui/` (Radix UI based)
- **Feature Components**: Direct children of `src/components/`
- **Analytics Components**: Located in `src/components/analytics/` for dashboard features
- **Props Interface**: Always define TypeScript interfaces for component props
- **Error Boundaries**: Use React Error Boundary for component-level error handling
- **View Mode Support**: Components should accept `viewMode` prop for list/grid rendering

### Dashboard & Analytics Architecture
The dashboard system uses ApexCharts with careful lifecycle management:

```typescript
// Dashboard tab state management (CRITICAL for chart rendering)
const [activeTab, setActiveTab] = useState('overview');
const [chartKey, setChartKey] = useState(0);

const handleTabChange = (value: string) => {
  setActiveTab(value);
  // Force chart re-render when returning to overview - REQUIRED for ApexCharts
  if (value === 'overview') {
    setChartKey(prev => prev + 1);
  }
};

// Chart instance refs for proper cleanup
const areaChartInstance = useRef<ApexCharts | null>(null);
const columnChartInstance = useRef<ApexCharts | null>(null);
```

### Gamification System Patterns
```typescript
// Achievement calculation pattern
const calculateBudgetCompliance = (expenses: Expense[], budget: number) => {
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  return budget > 0 
    ? Math.max(0, Math.min(100, (1 - totalExpenses / budget) * 100))
    : 0;
};

// Weighted scoring system
const overallScore = (
  budgetCompliance * 0.4 +        // 40% weight - most important
  consistencyScore * 0.3 +        // 30% weight - spending patterns
  savingsRate * 0.2 +             // 20% weight - financial health
  (currentStreak / 30) * 100 * 0.1 // 10% weight - streak bonus
);
```

### State Management
- **Authentication**: React Context (`AuthContext.tsx`)
- **Data Management**: Custom hook (`useFirestoreData.tsx`)
- **Local State**: React hooks (`useState`, `useEffect`)
- **Form Handling**: React Hook Form with Zod validation
- **User Preferences**: localStorage persistence for view modes, filters, and settings

## 📊 ApexCharts Integration Critical Patterns

### Chart Lifecycle Management (ESSENTIAL)
ApexCharts in React requires careful DOM lifecycle management, especially with tab switching:

```typescript
// CRITICAL: Tab switching pattern for charts
useEffect(() => {
  // Clean up existing chart instances
  if (areaChartInstance.current) {
    areaChartInstance.current.destroy();
    areaChartInstance.current = null;
  }
  
  // Re-initialize charts when tab changes to overview
  if (activeTab === 'overview' && areaChartRef.current) {
    // Chart initialization logic
  }
}, [activeTab, chartKey, expenses, budgets]);

// CRITICAL: Force re-render for chart visibility
const handleTabChange = (value: string) => {
  setActiveTab(value);
  if (value === 'overview') {
    setChartKey(prev => prev + 1); // Forces useEffect re-run
  }
};
```

### Chart Container Pattern
```typescript
// Chart containers MUST have unique keys for re-rendering
<div 
  key={`area-chart-${chartKey}`} 
  ref={areaChartRef} 
  className="w-full h-64"
/>
```

**WARNING**: Never skip the chartKey increment - charts will disappear on tab switches!
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
  people?: string[]; // Array of person IDs
}

// People Management Pattern - Use getAllPeople() for consistent data
const allPeople = getAllPeople([...customPeople, ...publicPeople]);
const selectedPeopleData = selectedPeople.map(id => 
  allPeople.find(person => person.id === id)
).filter(Boolean);

// Firebase Operations Pattern
const addExpense = async (expense: Omit<Expense, 'id'>) => {
  // Validate user authentication
  // Add to Firestore with proper error handling
  // Update local state
  // Show user feedback via toast
};
```

### View Mode Implementation Pattern
```typescript
// Component with view mode support
interface ComponentProps {
  viewMode: 'list' | 'grid';
  // ... other props
}

// In main App component
const [viewMode, setViewMode] = useState<'list' | 'grid'>(() => {
  const saved = localStorage.getItem('budget-buddy-view-mode');
  return (saved as 'list' | 'grid') || 'grid';
});

// Persist view mode changes
useEffect(() => {
  localStorage.setItem('budget-buddy-view-mode', viewMode);
}, [viewMode]);

// Conditional rendering based on view mode
<div className={
  viewMode === 'grid' 
    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" 
    : "space-y-4"
}>
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
- **View Modes**: Support both list and grid views with user preference persistence

### Grid Layout Patterns
```typescript
// Responsive grid implementation
<div className={
  viewMode === 'grid' 
    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" 
    : "space-y-4"
}>
  {items.map(item => (
    <ComponentCard 
      key={item.id}
      item={item}
      viewMode={viewMode}
    />
  ))}
</div>
```

### Filter UI Organization
```typescript
// Primary and secondary filter layout
<div className="bg-muted/50 p-4 rounded-lg">
  {/* Primary Filters Row */}
  <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
    <div className="flex flex-col sm:flex-row gap-3 flex-1 min-w-0">
      <SearchInput />
      <TimeframePicker />
    </div>
    <ViewModeToggle />
  </div>
  
  {/* Secondary Filters Row */}
  <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-border/50">
    <CategoryFilter />
    <PeopleFilter />
    <SortFilter />
  </div>
</div>
```

### Accessibility
- **Keyboard Navigation**: All interactive elements accessible
- **Screen Readers**: Proper ARIA labels and semantic HTML
- **Color Contrast**: WCAG compliant color schemes

## 📱 PWA Implementation

### PWA Architecture
- **Service Worker**: `public/sw.js` handles caching and offline functionality
- **PWA Manager**: `src/lib/pwa.ts` provides PWA utilities and management
- **PWA Components**: `src/components/PWAComponents.tsx` handles install/update UI
- **Manifest**: `public/manifest.json` defines PWA metadata

### PWA Patterns
```typescript
// PWA event handling
useEffect(() => {
  const handleInstallAvailable = () => {
    setCanInstall(true);
    setShowPrompt(true);
  };

  const handleInstallCompleted = () => {
    setCanInstall(false);
    setIsInstalled(true);
    setShowPrompt(false);
  };

  window.addEventListener('pwa-install-available', handleInstallAvailable);
  window.addEventListener('pwa-install-completed', handleInstallCompleted);

  return () => {
    // Cleanup listeners
  };
}, []);

// PWA installation
const handleInstall = async () => {
  setIsInstalling(true);
  try {
    const success = await pwaManager.promptInstall();
    if (!success) {
      // Show manual installation guide
    }
  } finally {
    setIsInstalling(false);
  }
};
```

### Cache Management
```typescript
// Clear all caches pattern (AppHeader.tsx)
const handleClearCache = async () => {
  try {
    // Clear localStorage
    localStorage.clear();
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    // Clear service worker caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    }
    
    toast.success("Cache cleared successfully");
    setTimeout(() => window.location.reload(), 1000);
  } catch (error) {
    toast.error("Failed to clear cache");
  }
};
```

## 🔒 Security Considerations

### Firebase Security
- **Authentication**: Always verify user authentication
- **Firestore Rules**: Implement proper read/write permissions
- **API Keys**: Use environment variables, never commit to repository
- **Data Validation**: Validate all user inputs on client and server
- **People Data**: Distinguish between public and private people data

### Environment Variables
```bash
# Required for AI features
VITE_OPENAI_API_KEY=your-openai-api-key

# Optional for enhanced observability
VITE_ENVIRONMENT=development|staging|production
VITE_DYNATRACE_URL=your-dynatrace-url
VITE_DYNATRACE_TOKEN=your-dynatrace-token
```

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

## 📋 Recent Developments (v2.5.1-2.5.5)

### Major Feature Additions

#### **Advanced Dashboard System (v2.5.0-2.5.2)**
- **ApexCharts Integration**: Professional data visualization with multiple chart types
- **Tab-based Navigation**: Overview, Advanced, Behavior, Achievements, Budgets tabs
- **Critical Fix (v2.5.2)**: Resolved chart disappearing issue when switching tabs
- **Chart Lifecycle Management**: Proper DOM connection handling for React integration
- **Responsive Design**: Mobile-optimized dashboard with adaptive layouts

#### **Gamification System (v2.5.3)**
- **Achievement Tracking**: Financial milestones with progress visualization
- **Scoring Algorithms**: Budget compliance, consistency, savings rate calculations
- **Visual Design**: Subtle gradient styling for completed achievements
- **Real-time Updates**: Dynamic score updates as expenses are added
- **Progress Indicators**: Ring effects, progress bars, and completion badges

#### **Enhanced Analytics (v2.5.0+)**
- **Spending Behavior Insights**: AI-powered spending pattern analysis
- **Advanced Charts**: Multiple visualization types for financial data
- **Financial Scoring**: Comprehensive scoring system with weighted components
- **Achievement System**: Gamified financial goal tracking

#### **Historical Budget Analysis (v2.5.5)**
- **Month Selector**: Dropdown to view budget performance for any past month
- **Dynamic Calculations**: Real-time spending calculations based on selected month
- **Historical Insights**: Compare budget utilization across different time periods
- **Temporal Analysis**: Enhanced budget tracking with time-based filtering
- **User Experience**: Seamless month navigation with current month as default

### Critical Bug Fixes

#### **Dashboard Chart Rendering (v2.5.2)**
- **Problem**: Charts disappeared when switching between dashboard tabs
- **Root Cause**: ApexCharts DOM connection loss during React tab switching
- **Solution**: Implemented controlled tab state with forced re-rendering
- **Implementation**: Enhanced useEffect dependencies and chart instance management

#### **Achievement Card Styling (v2.5.3)**
- **Problem**: Excessive green highlighting on achievement cards
- **Solution**: Replaced harsh styling with subtle gradient backgrounds
- **Scoring Fixes**: Corrected budget compliance and achievement calculations
- **Visual Polish**: Added ring effects and improved visual hierarchy

### Key Component Updates

#### **TimeframePicker**
- **Preset Options**: Quick presets (current month, last 30 days, etc.)
- **Custom Ranges**: Full date picker with validation
- **Visual Feedback**: Day count and formatted date display
- **Reset Functionality**: Quick reset to current month
- **Integration**: Used throughout app for date filtering

#### **PeopleManager** 
- **Public/Private Sharing**: People can be shared publicly or kept private
- **Icon & Color Selection**: Full customization with predefined options
- **Relationship Types**: Categorize people by relationship
- **Adoption System**: Users can adopt public people to their collection
- **CRUD Operations**: Full create, read, update, delete functionality

#### **PWAComponents**
- **Install Prompts**: Automatic and manual installation prompts
- **Update Management**: Service worker update handling
- **Connection Status**: Online/offline status indicators
- **Manual Instructions**: Browser-specific installation guides
- **Event-Driven**: Custom events for PWA lifecycle management

### Data Flow Improvements

#### **People Data Consistency**
```typescript
// Consistent people data pattern
const allPeople = getAllPeople([...customPeople, ...publicPeople]);
const selectedPeopleData = selectedPeople.map(id => 
  allPeople.find(person => person.id === id)
).filter(Boolean);
```

#### **View Mode State Pattern**
```typescript
// Persistent view mode implementation
const [viewMode, setViewMode] = useState<'list' | 'grid'>(() => {
  const saved = localStorage.getItem('budget-buddy-view-mode');
  return (saved as 'list' | 'grid') || 'grid';
});

useEffect(() => {
  localStorage.setItem('budget-buddy-view-mode', viewMode);
}, [viewMode]);
```

#### **Filter State Organization**
```typescript
// Centralized filter state in App.tsx
const [searchTerm, setSearchTerm] = useState('');
const [categoryFilter, setCategoryFilter] = useState('all');
const [peopleFilter, setPeopleFilter] = useState('all');
const [sortBy, setSortBy] = useState<'date' | 'amount' | 'category'>('date');
```

### Key Component Updates

#### **TimeframePicker**
- **Preset Options**: Quick presets (current month, last 30 days, etc.)
- **Custom Ranges**: Full date picker with validation
- **Visual Feedback**: Day count and formatted date display
- **Reset Functionality**: Quick reset to current month
- **Integration**: Used throughout app for date filtering

#### **PeopleManager** 
- **Public/Private Sharing**: People can be shared publicly or kept private
- **Icon & Color Selection**: Full customization with predefined options
- **Relationship Types**: Categorize people by relationship
- **Adoption System**: Users can adopt public people to their collection
- **CRUD Operations**: Full create, read, update, delete functionality

#### **PWAComponents**
- **Install Prompts**: Automatic and manual installation prompts
- **Update Management**: Service worker update handling
- **Connection Status**: Online/offline status indicators
- **Manual Instructions**: Browser-specific installation guides
- **Event-Driven**: Custom events for PWA lifecycle management

### Data Flow Improvements

#### **People Data Consistency**
```typescript
// Consistent people data pattern
const allPeople = getAllPeople([...customPeople, ...publicPeople]);
const selectedPeopleData = selectedPeople.map(id => 
  allPeople.find(person => person.id === id)
).filter(Boolean);
```

#### **View Mode State Pattern**
```typescript
// Persistent view mode implementation
const [viewMode, setViewMode] = useState<'list' | 'grid'>(() => {
  const saved = localStorage.getItem('budget-buddy-view-mode');
  return (saved as 'list' | 'grid') || 'grid';
});

useEffect(() => {
  localStorage.setItem('budget-buddy-view-mode', viewMode);
}, [viewMode]);
```

#### **Filter State Organization**
```typescript
// Centralized filter state in App.tsx
const [searchTerm, setSearchTerm] = useState('');
const [categoryFilter, setCategoryFilter] = useState('all');
const [peopleFilter, setPeopleFilter] = useState('all');
const [sortBy, setSortBy] = useState<'date' | 'amount' | 'category'>('date');
```

### Version Management
- **Synchronized Versioning**: package.json and CHANGELOG.md kept in sync
- **Semantic Versioning**: Following semver for feature releases
- **Documentation**: Comprehensive changelog with feature descriptions
- **Release Process**: Structured release notes with categorized changes

---

## 💡 Quick Reference

### Key File Locations
- Firebase config: `src/lib/firebase.ts`
- Type definitions: `src/lib/types.ts` (includes getAllPeople)
- Main app: `src/App.tsx` (includes viewMode and filter state)
- Authentication: `src/contexts/AuthContext.tsx`
- Data management: `src/hooks/useFirestoreData.tsx`
- AI analysis: `src/components/BudgetAnalyzer.tsx`
- PWA management: `src/lib/pwa.ts`
- Navigation: `src/components/Navigation.tsx`
- People management: `src/components/PeopleManager.tsx`
- Timeframe picker: `src/components/TimeframePicker.tsx`
- PWA components: `src/components/PWAComponents.tsx`
- Dashboard: `src/components/Dashboard.tsx`
- Analytics components: `src/components/analytics/`
- Gamification system: `src/components/analytics/GamificationSystem.tsx`
- Advanced charts: `src/components/analytics/AdvancedCharts.tsx`

### Useful Commands
```bash
npm run dev          # Start development server
npm run build        # Production build
npm run lint         # Check code quality
npm run preview      # Preview production build
npm run version:patch # Bump patch version
npm run version:minor # Bump minor version
npm run version:major # Bump major version
```

### Environment Setup Checklist
- [ ] Firebase project configured
- [ ] OpenAI API key set (optional)
- [ ] Authentication domains configured
- [ ] Firestore rules deployed
- [ ] Storage bucket configured
- [ ] PWA manifest configured
- [ ] Service worker tested

### Current Feature Status (v2.5.5)
- ✅ Grid/List view toggle with persistence
- ✅ Enhanced filtering system with people filter
- ✅ Clear cache functionality
- ✅ Collapsible navigation
- ✅ Comprehensive PWA support
- ✅ People management with public/private sharing
- ✅ Advanced timeframe selection
- ✅ Synchronized version management
- ✅ Advanced dashboard with ApexCharts integration
- ✅ Gamification system with achievement tracking
- ✅ Financial scoring and analytics
- ✅ Chart lifecycle management for tab switching
- ✅ Real-time score updates and visual polish
- ✅ Historical budget analysis with month selector

This guide should help AI coding agents understand the Budget Buddy codebase structure, implementation patterns, and development workflows to be immediately productive when working on the project.
