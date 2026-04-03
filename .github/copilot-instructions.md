# FinBuddy - AI Coding Agent Instructions

## 🎯 Project Overview

**FinBuddy** (formerly Budget Buddy) is a comprehensive personal finance management application built with modern web technologies. It provides expense tracking, budget management, AI-powered financial insights, advanced dashboard analytics, gamification system, and secure cloud synchronization with full PWA support.

### Tech Stack
- **Frontend**: React 19 + TypeScript 5.9 + Vite 7
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite` plugin) + Radix UI / shadcn components
- **Backend**: Firebase (Auth, Firestore, Storage, Functions v2)
- **Charts**: ApexCharts, Chart.js, Recharts, D3 for data visualization
- **AI Integration**: KautilyaAI Co-Pilot with Google Gemini 2.0 Flash + Firebase Functions v2 + Arthashastra Wisdom Engine
- **Animations**: Framer Motion
- **Forms**: React Hook Form + Zod v4 validation
- **Data Fetching**: @tanstack/react-query
- **PWA**: Service Worker + Installation Prompts + Offline Support
- **Navigation**: Collapsible sidebar + mobile bottom navigation
- **Deployment**: Azure App Service ready
- **Observability**: Dynatrace integration (configurable) with custom monitoring hooks
- **Testing**: Vitest (unit, integration, e2e)
- **Version**: Currently v2.9.0

### Critical Development Commands
```bash
npm run dev              # Start dev server on port 5000
npm run build           # Production build (tsc -b --noCheck && vite build)
npm run lint            # ESLint check
npm run test:run        # Run all tests
npm run test:unit       # Run unit tests only
npm run test:integration # Run integration tests only
npm run test:e2e        # Run e2e tests only
npm run test:coverage   # Tests with coverage report
npm run test:pre-deploy # Lint + test + build pipeline
npm run version:patch   # Bump patch version + update CHANGELOG.md
npm run version:minor   # Bump minor version
npm run version:major   # Bump major version
npm run deploy          # Build + Firebase deploy
npm run deploy:preview  # Deploy to preview channel
```

## 📁 Architecture & File Structure

### Core Application Files
```
src/
├── App.tsx                 # Main application with 9-tab navigation
├── main.tsx               # Application entry point & error boundaries
├── components/            # React components
│   ├── ui/               # Radix UI / shadcn component library (47 primitives)
│   ├── analytics/        # Analytics & gamification components
│   │   ├── GamificationSystem.tsx    # Achievement tracking & financial scoring
│   │   ├── AdvancedCharts.tsx        # Complex chart visualizations
│   │   ├── FlowbiteCharts.tsx        # Flowbite-based chart variants
│   │   └── SpendingBehaviorInsights.tsx # AI-powered behavior analysis
│   ├── Dashboard.tsx     # Advanced dashboard with ApexCharts integration
│   ├── AddExpenseModal.tsx # Fixed people selection using getAllPeople()
│   ├── EditExpenseModal.tsx # Consistent people data flow
│   ├── BudgetManager.tsx  # Budget CRUD with setup wizard
│   ├── BudgetSetupWizard.tsx # Income-based budget setup with priority tiers
│   ├── MetricsExplorer.tsx # Advanced financial analytics platform (BETA)
│   ├── MetricsBuilder.tsx # Dynatrace-style query builder for custom metrics
│   ├── MetricChart.tsx    # Individual metric chart rendering
│   ├── MetricSingleValue.tsx # Single metric value display
│   ├── MetricTable.tsx    # Tabular metric display
│   ├── AIChatPage.tsx    # KautilyaAI Co-Pilot interface (single chat)
│   ├── FloatingAIButton.tsx # AI assistant navigation button with BETA badge
│   ├── RecurringTemplates.tsx # Expense templates with pre-fill support
│   ├── CategoryManager.tsx
│   ├── LoginPage.tsx
│   ├── PeopleManager.tsx  # Full people management with public/private sharing
│   ├── TimeframePicker.tsx # Comprehensive date range selection
│   ├── Navigation.tsx     # Collapsible sidebar navigation (desktop)
│   ├── BottomNavigation.tsx # Mobile bottom navigation bar
│   ├── AppHeader.tsx      # Enhanced with clear cache functionality
│   ├── ExpenseCard.tsx    # Support for list/grid view modes
│   ├── DailySpendingChart.tsx # Daily spending visualization in expenses tab
│   ├── SpendingTrends.tsx # Spending trend analysis charts
│   ├── PWAComponents.tsx  # PWA install/update prompts and connection status
│   ├── UpdateNotification.tsx # App update notifications
│   ├── CookieBanner.tsx   # GDPR cookie consent banner
│   ├── Footer.tsx         # Application footer
│   ├── ComingSoon.tsx     # Placeholder for upcoming features
│   ├── ThemeToggle.tsx    # Theme switcher component
│   ├── DynatraceMonitoringDemo.tsx # Observability demo tab
│   ├── ErrorLogger.tsx    # Error logging component
│   └── DebugBreakpoints.tsx # Debug utility for responsive breakpoints
├── contexts/
│   ├── AuthContext.tsx    # Firebase authentication context
│   └── ThemeContext.tsx   # Theme management with custom CSS variables support
├── hooks/
│   ├── useFirestoreData.tsx # Firebase data management
│   ├── use-mobile.ts      # Mobile detection hook (768px breakpoint)
│   └── useDynatraceMonitoring.ts # Dynatrace monitoring hooks suite
├── lib/
│   ├── firebase.ts        # Firebase configuration & operations
│   ├── types.ts          # TypeScript interfaces & utilities (includes getAllPeople, getAllApps)
│   ├── utils.ts          # General utilities
│   ├── pwa.ts            # PWA management and service worker utilities
│   ├── logger.ts         # Observability & logging (disabled)
│   ├── version.ts        # Version management utilities
│   ├── dynatrace-monitor.ts # Dynatrace monitoring client
│   ├── observability.ts   # Observability utilities
│   ├── tracing.ts        # Distributed tracing utilities
│   ├── slack-notifier.ts  # Slack integration for notifications
│   └── wisdom/           # KautilyaAI Wisdom Engine
│       ├── types.ts              # Wisdom type interfaces
│       ├── arthashashtraKnowledge.ts # Ancient financial principles database
│       ├── financialContextAnalyzer.ts # User financial context analysis
│       ├── wisdomEngine.ts        # Wisdom matching & ranking engine
│       └── kautilyaAIEnhancer.ts  # AI prompt enhancement with wisdom
└── styles/
    └── theme.css         # Custom theme variables + CSS variable overrides

functions/               # Firebase Functions v2 backend
├── src/
│   ├── index.ts         # Main entry: chatWithGemini callable function
│   ├── chatWithGeminiML.ts # ML-enhanced chat variant
│   └── lib/             # Backend libraries (ML, wisdom)
├── package.json
└── tsconfig.json

mcp-server/              # MCP server for Copilot/AI agent integration
├── src/
│   ├── index.ts         # Main entry: 15 tool registrations, stdio transport
│   ├── firebase.ts      # Firebase Admin SDK initialization & collection helpers
│   └── tools/
│       ├── expenses.ts  # 5 CRUD tools (list, get, add, update, delete)
│       ├── budgets.ts   # 4 tools (list, set, delete, status)
│       └── analytics.ts # 6 tools (summary, category, trends, app, daily, health)
├── package.json         # @modelcontextprotocol/sdk, firebase-admin, zod
├── tsconfig.json
└── README.md

tests/                   # Test suite
├── unit/               # 7 unit test files
├── integration/        # 1 integration test
└── e2e/                # 1 e2e test

scripts/                 # Build & deploy scripts
├── version-bump.js      # Semantic version bumping
├── build-tracker.js     # Build metrics tracking
├── deploy-to-azure.ps1  # Azure App Service deployment
├── setup-oneagent.ps1   # Dynatrace OneAgent setup
└── test-dynatrace.js    # Dynatrace integration testing
```

### Key Configuration Files
- `vite.config.ts` - Build config with path aliases, react-swc, Tailwind v4 plugin, manual chunking
- `tailwind.config.js` - Custom color system with CSS variables, custom screens
- `components.json` - shadcn/ui "new-york" style configuration
- `tsconfig.json` - ES2020 target, bundler mode, `@/*` path alias
- `package.json` - Dependencies & scripts (v2.9.0)
- `vitest.config.ts` - Vitest test configuration
- `firebase.json` - Firebase project configuration
- `firestore.rules` / `storage.rules` - Security rules
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

### Critical Data Flow Pattern
```typescript
// ALWAYS use getAllPeople() for consistent people data across components
const allPeople = getAllPeople([...customPeople, ...publicPeople]);
const selectedPeopleData = selectedPeople.map(id => 
  allPeople.find(person => person.id === id)
).filter(Boolean);
```

### Firebase Authentication Check (Required Pattern)
```typescript
// EVERY Firebase operation must start with this check
if (!user) {
  toast.error("Please sign in to continue");
  return;
}
```

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

### Firebase Operations Pattern (CRITICAL)
```typescript
// Expense Management Example
interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  createdAt: string;
  receiptUrl?: string;
  receiptFileName?: string;
  peopleIds?: string[]; // Array of person IDs (Note: peopleIds not people)
  app?: string;         // Application name (Swiggy, Zomato, etc.) - added in v2.8.0
}

// Firebase Operations Pattern
const addExpense = async (expense: Omit<Expense, 'id'>) => {
  if (!user) throw new Error('User not authenticated');
  // Add to Firestore with proper error handling
  // Update local state
  // Show user feedback via toast
};
```

### useFirestoreData Hook Pattern
```typescript
// ALWAYS destructure what you need from the hook
const {
  expenses,
  customPeople,
  publicPeople,
  addExpense,
  updateExpense,
  deleteExpense
} = useFirestoreData();
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
  const saved = localStorage.getItem('finbuddy-view-mode');
  return (saved as 'list' | 'grid') || 'grid';
});

// Persist view mode changes
useEffect(() => {
  localStorage.setItem('finbuddy-view-mode', viewMode);
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

## 🤖 KautilyaAI Co-Pilot Integration

### Architecture Overview
**KautilyaAI Co-Pilot** is the revolutionary AI system that provides conversational CRUD operations powered by Google Gemini 2.0 Flash and Firebase Functions v2.

#### Core Components
- **AIChatPage.tsx**: Single chat interface with session management
- **FloatingAIButton.tsx**: Navigation button with BETA badge  
- **Firebase Functions v2**: Backend processing with natural language understanding
- **Context Memory**: Conversation history with smart references

### Chat Interface Implementation
```typescript
// AIChatPage session management pattern
const [messages, setMessages] = useState<ChatMessage[]>([]);
const [currentSessionId, setCurrentSessionId] = useState<string>('');
const [sessions, setSessions] = useState<ChatSession[]>([]);

// Firebase Functions integration
const chatWithGemini = httpsCallable(functions, 'chatWithGemini');
const result = await chatWithGemini({
  userId: user.uid,
  message: message.trim(),
  context: {
    recentExpenses: expenses.slice(0, 20),
    activeBudgets: budgets.filter(b => (b as any).isActive !== false),
    customPeople: customPeople.slice(0, 50),
    publicPeople: publicPeople.slice(0, 20)
  }
});
```

### Key Features
- **Conversational CRUD**: Natural language expense/budget operations
- **Context Awareness**: AI remembers conversation history and recent operations
- **Real-time UI Sync**: Immediate frontend updates after backend operations
- **Session Management**: Persistent chat history with organized sessions
- **Error Recovery**: Graceful handling with user-friendly error messages

### Integration Pattern
```typescript
// Chat message processing with UI synchronization
if (data.executedActions && data.executedActions.length > 0) {
  for (const action of data.executedActions) {
    if (action.success) {
      toast.success(`✅ ${action.summary}`);
      // UI automatically updates via useFirestoreData hook
    } else {
      toast.error(`❌ Failed: ${action.error}`);
    }
  }
}
```

### Navigation Integration
```typescript
// FloatingAIButton navigates to AI chat tab (simplified architecture)
<FloatingAIButton onClick={() => setActiveTab('ai-chat')} />
```

## 🎨 Theme System & CSS Variables

### ThemeContext Architecture
```typescript
// Theme management with localStorage persistence
const [theme, setTheme] = useState<Theme>(
  () => (localStorage.getItem('finbuddy-ui-theme') as Theme) || defaultTheme
);

// CSS class-based theme switching
useEffect(() => {
  const root = window.document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(theme);
}, [theme]);
```

### Custom CSS Variables Pattern
```css
/* src/styles/theme.css - Theme-specific variables */
:root {
  --disclaimer-bg: #f1f5f9;
  --disclaimer-border: #cbd5e1;
  --disclaimer-title: #0f172a;
}

.dark {
  --disclaimer-bg: #1e293b;
  --disclaimer-border: #475569;
  --disclaimer-title: #f1f5f9;
}
```

```typescript
// Component usage with CSS variables
<div style={{
  backgroundColor: 'var(--disclaimer-bg)',
  borderColor: 'var(--disclaimer-border)',
}}>
  <p style={{ color: 'var(--disclaimer-title)' }}>Content</p>
</div>
```

### Developer Documentation Styling (CRITICAL)
Developer documentation uses modern GitHub Dark theme for code blocks:

```css
/* Modern code block styling - GitHub Dark theme */
.code-block {
  background: #0d1117;
  color: #e6edf3;
  padding: 1.5rem;
  border-radius: 8px;
  margin: 1rem 0;
  font-family: 'Fira Code', 'JetBrains Mono', 'Monaco', 'Cascadia Code', 'Roboto Mono', monospace;
  overflow-x: auto;
  border: 1px solid #30363d;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  position: relative;
}

.code-block::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #58a6ff 0%, #7c3aed 50%, #f85149 100%);
  border-radius: 8px 8px 0 0;
}
```

**Pattern**: All developer documentation code blocks use GitHub Dark theme with gradient accent, Fira Code font, and enhanced shadows. Never use plain black/white "notepad" styling.

### Legacy AI Integration

The legacy BudgetAnalyzer component (now removed) previously provided traditional AI analysis with multiple fallback modes. The current AI system is the KautilyaAI Co-Pilot powered by Google Gemini 2.0 Flash with the Arthashastra Wisdom Engine.

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
1. **Prompt Engineering**: Update prompts in KautilyaAI or wisdom engine files
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

##  Important Implementation Notes

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

## � MCP Server

### Overview
The `mcp-server/` directory contains a Model Context Protocol server that exposes 15 tools for AI agents (VS Code Copilot, Claude, etc.) to interact with FinBuddy's Firestore data directly.

### Setup
```bash
cd mcp-server
npm install
npm run build
```
Requires a Firebase service account JSON at `mcp-server/service-account.json` (gitignored). Generate one from Firebase Console → Project Settings → Service Accounts.

### Tool Inventory (15 tools)

#### Expenses (5)
- `finbuddy_list_expenses` — filter by month/category/app, pagination, sorting
- `finbuddy_get_expense` — single expense by ID
- `finbuddy_add_expense` — create expense (amount, category, description, date + optional peopleIds, app)
- `finbuddy_update_expense` — partial update by ID
- `finbuddy_delete_expense` — delete by ID (irreversible)

#### Budgets (4)
- `finbuddy_list_budgets` — all budget limits for a user
- `finbuddy_set_budget` — create or update category budget limit
- `finbuddy_delete_budget` — delete by ID
- `finbuddy_budget_status` — budget vs actual with per-category compliance and over-budget warnings

#### Analytics (6)
- `finbuddy_spending_summary` — monthly totals, averages, top expenses
- `finbuddy_category_breakdown` — per-category amounts with percentages
- `finbuddy_spending_trends` — N-month trends with MoM changes
- `finbuddy_app_spending` — spending by app/platform
- `finbuddy_daily_spending` — day-by-day totals with peak day detection
- `finbuddy_financial_health` — weighted 0-100 score (budget compliance + consistency + over-budget analysis)

### VS Code Integration
Configured in `.vscode/mcp.json` — build the server and restart VS Code to use tools in Copilot Chat.

### Tech Stack
- **SDK**: @modelcontextprotocol/sdk 1.12.1
- **Firebase**: firebase-admin 13.4.0
- **Validation**: Zod 3.25.x
- **Transport**: stdio (local development)

### All tools require `userId`
Every tool takes `userId` as an optional parameter mapping to the Firebase Auth UID (`/users/{userId}/...`). When `FINBUDDY_USER_ID` env var is set, userId can be omitted.

## 📋 Recent Developments (v2.5.1-2.9.0)

### Major Feature Additions

#### **MCP Server — AI Agent Integration (v2.9.0)**
- **15 MCP Tools**: Expense CRUD (5), Budget Management (4), Financial Analytics (6)
- **Default User Auth**: FINBUDDY_USER_ID env var eliminates passing userId on every call
- **VS Code Integration**: Pre-configured in .vscode/mcp.json
- **Codebase Cleanup**: Removed 27 dead backup/duplicate files

#### **Editable Expense Templates (v2.8.1)**
- **Pre-fill AddExpenseModal**: Click a template to open expense form with pre-filled values
- **Template Search**: Filter templates by name or description
- **Redesigned Template List**: Table-style layout with emoji avatars and color-coded frequency badges
- **Customizable Default Amounts**: Per-template custom amounts with localStorage persistence

#### **Application-based Expense Tracking (v2.8.0)**
- **Indian Digital Ecosystem**: 50+ supported apps (Swiggy, Zomato, Amazon, Flipkart, Ola, Uber, Netflix, etc.)
- **New `app` Field**: Optional `app` property on Expense interface
- **Smart Category Intelligence**: Auto-suggests category based on selected app
- **App Selection UI**: Icons, filtering, and categorized app browser
- **Platform Analytics**: Spending breakdown by application
- **Types**: `AppOption` interface, `DEFAULT_INDIAN_APPS` constant, `getAllApps()` and `getAppsByCategory()` helpers

#### **Metrics Explorer BETA (v2.7.0)**
- **Advanced Analytics Platform**: Dynatrace-style interface for financial data analysis
- **Dual Interface Design**: Simple metrics for quick insights, Advanced query builder for custom analytics
- **Professional Visualizations**: ApexCharts integration with bar, line, donut, and table charts
- **Dynamic Filtering**: Real-time filtering by category, people, date ranges, and custom dimensions
- **Responsive Architecture**: JavaScript-based mobile detection for optimal layouts across devices
- **BETA Release**: Marked with professional blue badge for user awareness of experimental features

#### **Responsive Layout Engine (v2.7.0)**
- **Mobile Hook Integration**: useIsMobile hook for precise screen size detection at 768px breakpoint
- **Conditional Grid Layouts**: JavaScript-based responsive design replacing Tailwind classes
- **Desktop Optimization**: 3-column layout for MetricsBuilder, 4-column filter layout for MetricsExplorer
- **Cross-Platform Compatibility**: Consistent horizontal layouts on desktop, vertical stacking on mobile

#### **KautilyaAI Co-Pilot Revolution (v2.6.0)**
- **Conversational CRUD**: Complete natural language interface for all financial operations
- **Google Gemini 2.0 Flash**: Advanced AI backend with Firebase Functions v2
- **Arthashastra Wisdom Engine**: Ancient Chanakya financial principles mapped to modern advice with Sanskrit terminology
- **Session Management**: Persistent chat history with organized conversation sessions
- **Real-time Synchronization**: Immediate UI updates after AI-driven operations
- **Context Awareness**: AI remembers conversation history and recent operations
- **Simplified Architecture**: Single AIChatPage component, FloatingAIButton navigation

#### **Advanced Dashboard System (v2.5.0-2.5.2)**
- **ApexCharts Integration**: Professional data visualization with multiple chart types
- **Tab-based Navigation**: Overview, Advanced, Behavior, Achievements, Budgets tabs
- **Critical Fix (v2.5.2)**: Resolved chart disappearing issue when switching tabs
- **Chart Lifecycle Management**: Proper DOM connection handling for React integration

#### **Gamification System (v2.5.3)**
- **Achievement Tracking**: Financial milestones with progress visualization
- **Scoring Algorithms**: Budget compliance, consistency, savings rate calculations
- **Visual Design**: Subtle gradient styling for completed achievements
- **Real-time Updates**: Dynamic score updates as expenses are added

#### **Historical Budget Analysis (v2.5.5)**
- **Month Selector**: Dropdown to view budget performance for any past month
- **Dynamic Calculations**: Real-time spending calculations based on selected month

### Version Management
- **Synchronized Versioning**: package.json and CHANGELOG.md kept in sync
- **Semantic Versioning**: Following semver for feature releases
- **Documentation**: Comprehensive changelog with feature descriptions
- **Release Process**: Structured release notes with categorized changes

---

## 💡 Quick Reference

### Key File Locations
- Firebase config: `src/lib/firebase.ts`
- Type definitions: `src/lib/types.ts` (includes getAllPeople, getAllApps)
- Main app: `src/App.tsx` (includes viewMode and filter state)
- Authentication: `src/contexts/AuthContext.tsx`
- Theme management: `src/contexts/ThemeContext.tsx` (finbuddy-ui-theme)
- Data management: `src/hooks/useFirestoreData.tsx`
- Metrics Explorer: `src/components/MetricsExplorer.tsx` (BETA)
- Metrics Builder: `src/components/MetricsBuilder.tsx`
- KautilyaAI Co-Pilot: `src/components/AIChatPage.tsx`
- AI navigation: `src/components/FloatingAIButton.tsx`
- PWA management: `src/lib/pwa.ts`
- Navigation: `src/components/Navigation.tsx`
- People management: `src/components/PeopleManager.tsx`
- Timeframe picker: `src/components/TimeframePicker.tsx`
- PWA components: `src/components/PWAComponents.tsx`
- Dashboard: `src/components/Dashboard.tsx`
- Analytics components: `src/components/analytics/`
- Gamification system: `src/components/analytics/GamificationSystem.tsx`
- Advanced charts: `src/components/analytics/AdvancedCharts.tsx`
- Theme styling: `src/styles/theme.css` (custom CSS variables)
- Developer documentation: `public/developer/` (GitHub Dark theme styling)
- Wisdom Engine: `src/lib/wisdom/` (Arthashastra knowledge base)
- Dynatrace monitoring: `src/hooks/useDynatraceMonitoring.ts`
- Recurring templates: `src/components/RecurringTemplates.tsx`
- Budget wizard: `src/components/BudgetSetupWizard.tsx`
- MCP server entry: `mcp-server/src/index.ts` (15 tool registrations)
- MCP Firebase client: `mcp-server/src/firebase.ts`
- MCP tools: `mcp-server/src/tools/` (expenses, budgets, analytics)
- MCP VS Code config: `.vscode/mcp.json`

### Essential Commands
```bash
npm run dev          # Start development server (port 5000)
npm run build        # Production build
npm run lint         # Check code quality
npm run preview      # Preview production build
npm run test:run     # Run all tests
npm run test:unit    # Run unit tests
npm run version:patch # Bump patch version
npm run version:minor # Bump minor version
npm run version:major # Bump major version
npm run deploy       # Build + Firebase deploy
```

### Critical Debugging Tips
```bash
# Clear all caches when charts/PWA acting up
# Use AppHeader "Clear Cache" button OR:
# 1. Clear localStorage/sessionStorage
# 2. Clear service worker caches
# 3. Hard refresh (Ctrl+Shift+R)

# Firebase debug commands
# Check Firebase Auth status in DevTools Console:
firebase.auth().currentUser

# Check Firestore rules in Firebase Console
# Enable/disable Firebase Debug mode
```

### Environment Setup Checklist
- [ ] Firebase project configured with web app
- [ ] OpenAI API key set in environment (optional for AI features)
- [ ] Authentication domains configured in Firebase Console
- [ ] Firestore rules deployed (`npm run deploy` or Firebase Console)
- [ ] Storage bucket configured with proper CORS
- [ ] PWA manifest configured for target domain
- [ ] Service worker tested and registering properly

### Common Gotchas & Solutions
1. **Charts Disappearing**: Always increment `chartKey` when switching to overview tab
2. **People Data Missing**: Use `getAllPeople()` helper, not direct array access
3. **App Data Missing**: Use `getAllApps()` helper from types.ts
4. **Firebase Auth Errors**: Check user exists before any Firestore operations
5. **PWA Not Installing**: Check manifest.json and service worker registration
6. **Build Failures**: Clear node_modules and reinstall if TypeScript errors persist
7. **ApexCharts Errors**: Ensure DOM refs are current before chart initialization

### Current Feature Status (v2.9.0)
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
- ✅ KautilyaAI Co-Pilot with conversational CRUD operations
- ✅ Firebase Functions v2 backend with Google Gemini 2.0 Flash
- ✅ Arthashastra Wisdom Engine with Sanskrit financial principles
- ✅ Custom CSS variables for theme-specific styling
- ✅ Session-based AI chat with persistent history
- ✅ Metrics Explorer BETA with advanced analytics platform
- ✅ Responsive layout engine with mobile detection hooks
- ✅ JavaScript-based conditional grid layouts
- ✅ Application-based expense tracking (50+ Indian apps)
- ✅ Editable expense templates with pre-fill support
- ✅ Template search and customizable default amounts
- ✅ Budget Setup Wizard with income-based priority tiers
- ✅ GDPR cookie consent banner
- ✅ Mobile bottom navigation
- ✅ Dynatrace monitoring hooks suite
- ✅ Daily spending chart in expenses tab
- ✅ Spending trend analysis charts
- ✅ MCP server with 15 tools (expenses, budgets, analytics)
- ✅ Default user authentication via FINBUDDY_USER_ID env var
- ✅ VS Code Copilot MCP integration (.vscode/mcp.json)

This guide should help AI coding agents understand the FinBuddy codebase structure, implementation patterns, and development workflows to be immediately productive when working on the project.
