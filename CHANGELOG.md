# Changelog

All notable changes to Budget Buddy will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.6.0] - 2025-08-24

### 🚀 Major Features Added

- **🤖 AI Chat Integration**: Revolutionary conversational AI assistant powered by Google Gemini 2.5 Flash
  - Dedicated AI Chat page with persistent conversation history
  - Natural language financial queries and insights
  - Real-time expense analysis and budget recommendations
  - Markdown-formatted responses with rich text and lists
  - Context-aware financial advice tailored to user spending patterns

- **💬 Conversational Finance Management**:
  - Ask questions like "How much did I spend on food last month?"
  - Get personalized savings recommendations
  - Receive budget alerts and spending analysis through chat
  - Quick action buttons for common financial queries

- **🔥 Firebase Functions v2 Backend**: Complete serverless architecture
  - Cloud Functions with CORS support for cross-origin requests
  - Secure API key management and environment variable handling
  - Error handling and logging for production reliability
  - Scalable architecture ready for high-traffic usage

### 🌍 Localization & Regional Support

- **🇮🇳 Indian Currency Support**: Complete INR (₹) localization
  - Proper comma formatting (₹1,23,456.78) following Indian numbering system
  - Currency symbols and formatting throughout AI responses
  - Optimized for Indian financial contexts and spending patterns

### 🔐 Enhanced Authentication System

- **📧 Email/Password Authentication**: Complete traditional auth system
  - User registration with email and password
  - Password reset functionality via email
  - Profile management with display name updates

- **🔗 Magic Link Authentication**: Passwordless sign-in system
  - Send secure sign-in links to email
  - One-click authentication without remembering passwords
  - Enhanced security with email verification

- **🌐 Google OAuth Integration**: Seamless social login
  - One-click Google sign-in with popup and redirect options
  - Profile synchronization with Google account details

### 📱 Progressive Web App Enhancements

- **🚀 Smart Install Banner**: Improved PWA installation experience
  - Session-based dismissal tracking prevents repetitive prompts
  - Platform-specific installation instructions
  - Enhanced user onboarding for mobile app experience

- **🔄 Service Worker Optimization**: Better offline functionality
  - Improved caching strategies for faster load times
  - Background sync for offline expense entry
  - Automatic updates with user notifications

### 🛠️ Technical Improvements

- **⚡ Performance Optimization**:
  - React-markdown integration for rich text rendering
  - Optimized bundle sizes and code splitting
  - Enhanced component lifecycle management

- **🔧 Developer Experience**:
  - Complete TypeScript coverage for AI chat features
  - Enhanced error boundaries and fallback components
  - Comprehensive logging and debugging tools

- **🎨 UI/UX Enhancements**:
  - Fixed chat container overflow handling
  - Improved responsive design for conversation interface
  - Enhanced accessibility with proper ARIA labels
  - Cookie consent banner with user preference management

### 📚 Documentation Overhaul

- **📖 User Documentation**: Complete user-facing guides
  - AI Chat usage guide with examples and tips
  - Getting started tutorials for new users
  - Feature explanations with screenshots and examples

- **🔧 Developer Documentation**: Technical implementation guides
  - Firebase setup and configuration instructions
  - API reference for Firebase Functions
  - Component architecture and integration patterns

### 🐛 Bug Fixes

- **🔧 Navigation Improvements**: Enhanced sidebar navigation
  - Fixed collapsible sidebar state persistence
  - Improved mobile navigation responsiveness
  - Better tab management and active state handling

- **💾 Data Persistence**: Enhanced data management
  - Fixed conversation history storage in Firestore
  - Improved expense data synchronization
  - Better error handling for failed API calls

### 🔄 Migration & Compatibility

- **📦 Dependency Updates**: Latest package versions
  - Updated Firebase SDK to latest stable version
  - Enhanced React and TypeScript compatibility
  - Improved build tools and development server

- **🔀 Architecture Migration**: Modernized codebase structure
  - Migrated to Firebase Functions v2 for better performance
  - Enhanced project structure for better maintainability
  - Improved component organization and reusability

## [2.3.0] - 2025-01-27

### Added

- **Typography Enhancement**: Integrated Titillium Web as the primary font family throughout the application
  - Added Google Fonts import for Titillium Web and Saira fonts
  - Updated CSS font-family variables and comprehensive font weight classes
  - Enhanced visual hierarchy and readability across all components

- **Copyright Footer**: Added professional Footer component with InspiLabs copyright
  - Displays "Copyright 2023-2025 InspiLabs" across all pages
  - Responsive design with proper theme integration
  - Seamless integration with existing layout system

- **Professional Shadow Design System**: Implemented elegant card styling across all components
  - Added shadow-lg hover:shadow-xl effects to all cards (Expenses, People, Budgets, Templates, Categories)
  - Enhanced visual depth with smooth transition animations
  - Consistent shadow implementation for professional appearance

- **Responsive Grid Layouts**: Enhanced space utilization across People and Budget management
  - Implemented 3-column responsive grids (md:grid-cols-2 lg:grid-cols-3) for People pages
  - Added responsive grid layouts for Budget management cards
  - Optimized card spacing and eliminated wasted vertical space

- **Sticky Header with Glass Morphism**: Enhanced navigation accessibility
  - Header now stays fixed at top during page scrolling (sticky top-0 z-50)
  - Added glass morphism effect with backdrop blur (bg-card/95 backdrop-blur)
  - Improved user experience with constant navigation access

- **Enhanced Modal Dialog System**: Improved form interaction experience
  - All dialog forms (Expenses, People, Templates) now open as proper centered modals
  - Added backdrop blur effects (backdrop-blur-sm) for better focus
  - Implemented max-w-2xl sizing with proper overflow handling (max-h-[90vh] overflow-y-auto)

### Fixed

- **Dashboard Layout**: Improved summary cards responsive grid layout
  - Fixed vertical card stacking issues on mobile devices
  - Implemented proper responsive grid: 1 column (mobile), 2 columns (tablet), 4 columns (desktop)
  - Replaced inline CSS with Tailwind CSS classes for better maintainability
  - Enhanced mobile user experience with optimal card arrangement

- **Dark Mode Theme Context**: Complete theme compatibility fixes
  - Fixed People cards and all components for proper dark mode rendering
  - Enhanced theme-aware backgrounds (bg-card, bg-muted/50) throughout the application
  - Resolved theme switching issues across all components

- **Border Design System**: Removed black borders for cleaner aesthetic
  - Eliminated border class from base Card component (src/components/ui/card.tsx)
  - Universal border removal across entire application
  - Improved visual clarity with shadow-based card separation

- **Mobile Tab Navigation**: Optimized dashboard navigation for mobile screens
  - Hidden tab text on mobile devices, showing only icons for cleaner interface
  - Implemented responsive text display (hidden sm:inline) for better mobile UX
  - Enhanced thumb-friendly navigation experience

### Changed

- **Design System**: Updated font hierarchy to use Titillium Web as primary typeface
- **Layout Improvements**: Better responsive behavior for dashboard components
- **User Experience**: Enhanced visual consistency across all application screens

## [2.2.2] - 2025-08-22

### Added

#### **📱 Enhanced Mobile Navigation Experience**

- **Bottom Navigation Bar**: Implemented thumb-friendly bottom navigation for mobile devices
  - 4 primary navigation items: Home (Dashboard), Expenses, Budgets, AI Analyzer
  - Fixed positioning with backdrop blur effect and elevated styling
  - Active state animations with scale effects and color transitions
  - Auto-hide on desktop screens using responsive design patterns

- **Smart Navigation Context Logic**: 
  - **Dashboard Page**: Shows mobile menu button for full navigation drawer access
  - **Other Pages**: Shows back button + bottom navigation bar for quick section switching
  - Dynamic page titles in header reflecting current section
  - Contextual content spacing accounting for bottom navigation bar

- **Enhanced Mobile UX**:
  - One-hand operation optimization for mobile device usage
  - Native mobile app feel with proper touch targets and spacing
  - Faster navigation between core application sections
  - Reduced cognitive load with contextual navigation patterns

### Technical Improvements

- **New Component**: `BottomNavigation.tsx` with responsive visibility logic
- **Enhanced AppHeader**: Added back button and dynamic title logic for mobile
- **Improved Content Spacing**: Dynamic bottom padding for mobile navigation compatibility
- **Mobile Detection**: Leveraged existing `useIsMobile` hook for responsive behavior

### Version Updates

- **Application Version**: Updated to v2.2.2 across all UI components and documentation

## [2.2.1] - 2025-08-22

### Fixed

#### **🐛 Critical Bug Fixes for Chart Redesign**

- **Dashboard Grid Layout**: Fixed Summary Cards not displaying in 4-column grid layout on desktop screens
  - Resolved CSS Grid responsive breakpoint issues
  - Fixed container width constraints that prevented proper grid expansion
  - Used CSS Grid `auto-fit` with `minmax(250px, 1fr)` for reliable responsive layout
  - Cards now properly display horizontally on desktop (1024px+) and adapt responsively

- **Theme Context Issues**: Fixed theme switching problems across all components
  - Resolved dark mode theme not applying to charts and UI elements
  - Fixed PWA install banner showing light theme colors in dark mode
  - Updated all hardcoded colors to use CSS variables for proper theme responsiveness
  - Fixed icon visibility issues with theme-aware color classes

- **PWA Component Theme Integration**:
  - Fixed Install FinBuddy banner theme switching
  - Updated Update Available banner to use theme-aware colors
  - Fixed Connection Status banner for proper dark/light mode support
  - Replaced all hardcoded `text-blue-600`, `text-gray-600` with `text-primary`, `text-muted-foreground`

### Technical Improvements

- **App Container Structure**: Optimized main content container to use `max-w-7xl mx-auto w-full` instead of restrictive `container` class
- **CSS Grid Implementation**: Enhanced grid layout with auto-responsive column distribution
- **Theme System**: Strengthened CSS variable integration across all PWA and dashboard components

## [2.2.0] - 2025-08-22

### Added

#### **🎨 Complete Flowbite Charts Redesign**

- **ApexCharts Integration**: Complete migration from Chart.js to ApexCharts library for professional grade data visualization
- **Authentic Flowbite Design**: Implemented exact design patterns from Flowbite documentation with pixel-perfect accuracy
- **Four Professional Chart Types**:
  - **Area Chart**: Monthly spending trends with gradient fills and hover interactions
  - **Column Chart**: Weekly spending breakdown with rounded columns and daily metrics
  - **Pie Chart**: Category distribution with Flowbite color palette and interactive tooltips
  - **Donut Chart**: Budget performance tracking with status indicators and progress metrics
- **Advanced Visual Features**:
  - Gradient backgrounds and smooth animations
  - Interactive hover states and tooltips
  - Professional color scheme matching Flowbite design system
  - Responsive chart sizing for all screen sizes
  - Dark mode support with proper contrast ratios

#### **📊 Enhanced Data Visualization**

- **Smart KPI Displays**: Large bold numbers with percentage growth indicators
- **Status Badges**: Color-coded budget performance indicators (Under Budget, On Track, Over Budget)
- **Action Buttons**: Professional navigation with dropdown menus and report links
- **Grid Layout**: Responsive 2x2 grid layout optimizing space utilization
- **Real-time Updates**: Charts automatically update with new expense data

#### **🔧 Technical Improvements**

- **ApexCharts Library**: Leveraging industry-standard charting library for better performance
- **Memory Management**: Proper chart cleanup on component unmount to prevent memory leaks
- **TypeScript Support**: Full type safety with ApexCharts TypeScript definitions
- **Optimized Rendering**: Efficient chart rendering with minimal re-renders

### Changed

- **Chart Library Migration**: Replaced Chart.js with ApexCharts for superior visualization capabilities
- **Design Language**: Adopted authentic Flowbite design patterns throughout chart components
- **Data Processing**: Enhanced data calculation logic for better chart representation
- **Component Architecture**: Simplified component structure using useRef hooks for chart instances

### Fixed

- **Chart Performance**: Eliminated lag and improved rendering speed
- **Memory Leaks**: Proper cleanup of chart instances on component unmount
- **Responsive Issues**: Fixed chart scaling and layout problems on mobile devices
- **Dark Mode**: Consistent theming across all chart components

### Technical Details

- **Dependencies**: Added ApexCharts 5.3.3 for advanced charting capabilities
- **Architecture**: Modern React hooks pattern with useRef for DOM manipulation
- **Styling**: CSS-in-JS approach using ApexCharts configuration objects
- **Performance**: Optimized re-rendering using useMemo for data processing

## [2.1.1] - 2025-08-22

### Added

#### **📊 Flowbite Charts Integration**

- **Professional Chart Components**: Integrated Flowbite design system for enhanced data visualization
- **New Dashboard Tab**: Added dedicated "Flowbite" tab with 4 distinct chart types
- **Chart Variety**: 
  - Flowbite Pie Charts for category spending breakdown with percentages
  - Horizontal Bar Charts for monthly trends with growth indicators
  - Progress Charts for budget performance with status badges
  - Doughnut Charts for category distribution with center statistics
- **Design System Benefits**:
  - Consistent styling with Flowbite design tokens
  - Seamless light/dark mode support
  - Responsive layouts optimized for all devices
  - Smooth CSS animations and transitions
  - Professional enterprise-grade appearance

#### **🔧 Technical Enhancements**

- **Package Integration**: Added `flowbite` and `flowbite-react` dependencies
- **Build Configuration**: Updated Tailwind config with Flowbite plugin and content paths
- **Component Architecture**: Created reusable FlowbiteCharts component with modular chart types
- **Performance**: Optimized chart rendering with efficient data processing and memoization

### Fixed

#### **🎨 Navigation & Dashboard UI Improvements**

- **Navigation System Overhaul**:
  - Fixed missing desktop navigation visibility issues
  - Improved mobile hamburger menu alignment and positioning
  - Enhanced responsive behavior with JavaScript-based screen detection
  - Implemented proper light/dark mode theming using CSS variables
  - Resolved authentication-related navigation hiding problems

- **Dashboard Grid Layout Enhancement**:
  - Implemented responsive CSS Grid for key metrics cards
  - Fixed single-column layout issues on desktop screens
  - Added 4-column desktop layout with adaptive tablet/mobile breakpoints
  - Used inline CSS Grid styles for reliable cross-browser compatibility
  - Improved card spacing and visual hierarchy

- **Icon Visibility & Contrast**:
  - Resolved light mode icon contrast and visibility problems
  - Implemented explicit RGB color values for reliable theming
  - Added high-contrast color scheme: Purple, Blue, Green, Orange
  - Bypassed Tailwind CSS compilation issues with inline styles
  - Enhanced accessibility with better color contrast ratios

#### **Technical Improvements**

- **CSS Architecture**: Migrated from unreliable Tailwind responsive classes to JavaScript detection
- **Color Management**: Replaced Tailwind color utilities with explicit RGB values for consistency
- **Layout Stability**: Used CSS Grid with auto-fit minmax for responsive card layouts
- **Theme Reliability**: Implemented CSS custom properties for consistent light/dark mode support

### Changed

- Enhanced dashboard card layout from single-column to responsive multi-column grid
- Improved navigation component architecture with better responsive handling
- Updated icon styling approach from Tailwind classes to inline CSS for reliability

## [2.0.0] - 2025-08-22

### Added

#### **🌟 Advanced Financial Analytics Dashboard**

- **Comprehensive Chart Library**: 12+ different chart types providing complete financial insights
- **Tabbed Analytics Interface**: Organized into Overview, Patterns, Breakdown, and Insights tabs
- **Interactive Financial Visualizations**:
  - **Category Donut Chart**: Spending breakdown with percentage distribution
  - **Monthly Trend Line**: 6-month spending pattern analysis
  - **Budget vs Actual Comparison**: Visual budget performance tracking
  - **Weekly Heatmap**: Day-of-week spending intensity visualization
  - **Cashflow Waterfall**: Daily money flow analysis
  - **Top Categories Bar Chart**: Highest spending categories ranking
  - **Payment Method Pie Chart**: Distribution across UPI, cards, cash
  - **Merchant Analysis**: Top spending destinations
  - **Recurring vs One-off Breakdown**: Spending pattern classification
  - **People-based Analytics**: Spending associated with individuals
  - **Forecast Projection**: Predictive month-end spending estimation

#### **🎨 Dark Mode & Theme System**

- **Complete Dark Mode Support**: Beautiful dark theme with proper contrast and accessibility
- **Theme Toggle**: Easy switching between light, dark, and system themes
- **Persistent Theme Selection**: User preferences saved across sessions
- **Adaptive Chart Colors**: Charts automatically adapt to selected theme
- **System Theme Detection**: Respects user's OS theme preference

#### **📊 Enhanced Data Processing**

- **Advanced Analytics Engine**: Complex data aggregations and calculations
- **Weekly Spending Patterns**: Heatmap showing spending intensity by day
- **Merchant Intelligence**: Automatic merchant extraction from descriptions
- **Payment Method Analysis**: Mock payment method distribution (ready for real data)
- **Recurring Expense Detection**: Smart identification of recurring transactions
- **Monthly Forecasting**: Predictive spending based on current patterns

#### **🎯 Improved User Experience**

- **Tabbed Navigation**: Organized analytics into logical sections
- **Enhanced Quick Stats**: More relevant and actionable metrics
- **Interactive Charts**: Hover tooltips and detailed information
- **Responsive Design**: All charts work perfectly on mobile and desktop
- **Performance Optimized**: Efficient data processing with useMemo hooks

### Technical

#### **🔧 Architecture Improvements**

- **Theme Provider System**: Complete theme management with React Context
- **Advanced Chart Integration**: Enhanced Recharts implementation with multiple chart types
- **Data Processing Pipeline**: Sophisticated analytics calculations
- **Component Modularity**: Clean separation of chart components and logic
- **Type Safety**: Full TypeScript support for all new features

#### **🎨 Design System Enhancement**

- **Dark Mode Variables**: Complete CSS custom property system
- **Chart Color Palettes**: Separate color schemes for light and dark themes
- **Consistent Spacing**: Improved layout and spacing throughout
- **Accessibility**: Proper contrast ratios and keyboard navigation

### Breaking Changes

#### **⚠️ Major Version Changes**

- **Dashboard Structure**: Complete redesign of dashboard layout and functionality
- **Chart System**: Replaced basic charts with comprehensive analytics suite
- **Theme Integration**: New theme system requires React Context setup
- **Data Requirements**: Enhanced analytics may require additional data fields

## [1.6.1] - 2025-08-22

### Fixed

#### **Currency Display & Timeframe Issues**

- **INR Currency Symbol**: Fixed charts displaying USD ($) instead of INR (₹) symbols
- **Timeframe Selection**: Enhanced timeframe picker functionality for proper date range filtering
- **Chart Tooltips**: Corrected currency formatting throughout all chart components

### Added

#### **Enhanced Financial Analysis Charts**

- **Monthly Trends Chart**: Bar chart showing spending patterns over the last 6 months
- **Top Categories Ranking**: Visual ranking of highest spending categories with percentages
- **Top People Analysis**: Ranking of people associated with highest spending amounts
- **Comprehensive Analytics**: Three-column layout with detailed spending breakdowns

#### **Improved Navigation**

- **Streamlined Experience**: Removed redundant "Trends" page since analytics are now in Dashboard
- **Focused Navigation**: Cleaner navigation menu with essential sections only
- **Better User Flow**: Dashboard now provides all trending and analytical insights

### Technical

- **Enhanced Data Processing**: Added monthly aggregation and people-based spending analysis
- **Chart Performance**: Optimized chart rendering with proper data filtering
- **Component Cleanup**: Removed unused SpendingTrends component and related imports
- **Responsive Design**: All new charts work seamlessly across device sizes

## [1.6.0] - 2025-08-22

### Added

#### **Charts-Based Dashboard Homepage**

- **New Dashboard Component**: Complete financial overview with interactive charts and analytics
- **Homepage Redesign**: Dashboard now serves as the default landing page instead of expenses
- **Daily Spending Trends**: Area chart showing spending patterns over selected date range
- **Category Breakdown**: Interactive pie chart showing spending distribution by categories
- **Budget Progress Visualization**: Visual progress bars for all active budgets with status indicators
- **Quick Stats Cards**: Key metrics including total spent, budget progress, weekly changes, and remaining budget
- **Weekly Comparison**: Automatic comparison with previous week's spending with trend indicators
- **Quick Actions Panel**: Easy navigation buttons to common tasks (expenses, budgets, AI analysis, trends)
- **Interactive Charts**: Built with Recharts library for responsive, interactive data visualization
- **Responsive Design**: Charts and layout adapt perfectly to all screen sizes

#### **Enhanced Navigation Structure**

- **Dashboard First**: Added Dashboard as the first navigation item with Home icon
- **Updated Navigation Order**: Reorganized menu items with Dashboard at the top for better UX
- **Contextual Navigation**: Dashboard provides direct links to relevant sections based on data

#### **Improved Data Visualization**

- **Multiple Chart Types**: Area charts for trends, pie charts for categories, progress bars for budgets
- **Color-Coded Status**: Budget status indicators (good/warning/over) with appropriate colors
- **Empty State Handling**: Helpful empty states with action buttons when no data is available
- **Date Range Integration**: Full TimeframePicker integration for filtering all dashboard data
- **Real-time Updates**: Dashboard reflects changes immediately when data is modified

### Improved

#### **User Experience**

- **Landing Page**: Users now see a comprehensive overview immediately upon login
- **Data-Driven Insights**: Visual representation makes spending patterns more apparent
- **Quick Access**: Direct navigation to any section from the dashboard
- **Mobile Optimized**: All charts and components work seamlessly on mobile devices

### Technical

- **Chart Library Integration**: Added Recharts for professional data visualization
- **Performance Optimized**: Efficient data processing with useMemo for expensive calculations
- **TypeScript Support**: Full type safety for all chart components and data structures
- **Responsive Components**: All dashboard elements adapt to different screen sizes

## [1.5.3] - 2025-08-22

### Added

#### **Clear Cache & Session Management**

- **Clear Cache Functionality**: Added comprehensive cache clearing option in user dropdown menu
- **Cache Clearing Scope**: 
  - Clears localStorage (including app preferences and data)
  - Clears sessionStorage (temporary session data)
  - Clears service worker caches (PWA cached resources)
  - Automatically refreshes page after cleanup
- **User Access**: Available via user avatar dropdown menu with RefreshCw icon
- **Use Cases**: Resolves conflicts between old and new app changes, clears stored preferences, fresh app state
- **User Feedback**: Toast notifications during the clearing process

#### **Enhanced Expense Filtering System**

- **People Filter**: New filter to show expenses associated with specific people
- **Consolidated Filter UI**: Reorganized filter interface for better usability
- **Filter Organization**:
  - **Primary Filters** (top row): Search box and timeframe picker for most common actions
  - **Secondary Filters** (bottom row): Category, People, and Sort options
  - **Background Panel**: All filters contained in a subtle background panel for visual grouping
- **People Filter Features**:
  - Dropdown shows all available people (default + custom + public)
  - Visual indicators with person icons and colors
  - Integrates with existing expense-people associations
- **Improved Layout**: Reduced visual clutter while maintaining all functionality

### 🎨 Improved

#### **Filter User Experience**

- **Organized Layout**: Filters grouped logically with clear visual hierarchy
- **Responsive Design**: Filter layout adapts properly to different screen sizes  
- **Visual Enhancement**: Background panels and borders improve readability
- **Compact Design**: More functionality in less visual space

## [1.5.2] - 2025-08-22

### ✨ Added

#### **List/Grid Toggle View for Expenses**

- **Flexible Viewing Options**: Users can now toggle between list and grid views for expenses
- **Toggle Controls**: 
  - Clean toggle button interface with List and Grid icons
  - Located next to the Add Expense button for easy access
  - Active state clearly indicates current view mode
- **List View**:
  - Horizontal compact layout with all expense information in single rows
  - Displays amount, description, category, date, people, and receipt info inline
  - Optimized for quick scanning of many expenses
  - Edit and delete buttons positioned on the right
- **Grid View**: 
  - Existing responsive card-based layout (1-4 columns based on screen size)
  - Vertical card design with comprehensive information display
  - Better for detailed viewing and visual browsing
- **User Preference Persistence**: 
  - View mode choice saved to localStorage
  - Preference maintained across browser sessions
  - Defaults to grid view for new users
- **Responsive Design**: Both views adapt properly to different screen sizes
- **Files Modified**: `src/App.tsx`, `src/components/ExpenseCard.tsx`
- **Benefits**: Users can choose the viewing experience that best suits their workflow and screen space preferences

## [1.5.1] - 2025-08-22

### 🎨 Improved

#### **Expense Page Grid Layout**

- **Responsive Grid Layout for Expenses**
  - **Problem**: Single-column layout (one expense per line) became impractical with many expenses, causing excessive scrolling
  - **Solution**: Implemented responsive multi-column grid layout with breakpoint-based columns
  - **Responsive Breakpoints**:
    - Mobile (default): 1 column
    - Medium (768px+): 2 columns
    - Large (1024px+): 3 columns
    - Extra Large (1280px+): 4 columns
  - **Enhanced Card Layout**: ExpenseCard components now use full height with flexible content distribution
  - **Files Modified**: `src/App.tsx`, `src/components/ExpenseCard.tsx`
  - **Benefits**: Better screen space utilization, reduced scrolling, improved browsing experience for users with many expenses

## [1.5.0] - 2025-08-22

### 🐛 Fixed

#### **Critical Bug Fixes**

- **[CRITICAL] Add Expense Button Dual System Issue**
  - **Problem**: Clicking "Add Expense" button showed a circular blue button with "+" icon instead of directly opening the modal, requiring a second click
  - **Root Cause**: AddExpenseModal component had internal DialogTrigger button conflicting with external state management in App.tsx
  - **Solution**: Refactored AddExpenseModal to be fully controlled with `isOpen` and `onClose` props, removed internal trigger button
  - **Files Modified**: `src/components/AddExpenseModal.tsx`, `src/App.tsx`
  - **Impact**: Direct modal opening on first click, eliminated user confusion
  - **Technical Details**: 
    - Added `isOpen` and `onClose` props to AddExpenseModalProps interface
    - Implemented state synchronization with useEffect
    - Removed DialogTrigger and internal button from modal component
    - Updated parent component to pass modal state directly

- **Budget Templates "Not Configured for Session" Error**
  - **Problem**: Budget templates functionality showing "Budget templates functionality is not configured for this session" message
  - **Root Cause**: Missing `updateBudgetTemplate` function from BudgetManager component props validation
  - **Solution**: Added missing function import and prop passing from useFirestoreData hook
  - **Files Modified**: `src/App.tsx`
  - **Impact**: Budget templates fully functional in Budgets section, users can now create and manage budget templates
  - **Technical Details**:
    - Added `updateBudgetTemplate` to destructuring in App.tsx
    - Passed `onUpdateBudgetTemplate={updateBudgetTemplate}` prop to BudgetManager
    - All four required template functions now properly provided (add, update, delete, adopt)

### ✨ Added

#### **Date Range Filtering System**

- **Comprehensive Timeframe Selector for Expenses**
  - **Default Behavior**: Application now defaults to showing current month expenses
  - **Preset Options**: Quick selection for Current month, Last month, Last 30 days, Last 90 days, Current year, All time
  - **Custom Date Range**: Manual from/to date selection with validation
  - **Real-time Filtering**: Expenses filter immediately when date range changes
  - **Smart Labels**: Dynamic spending summary labels that reflect selected timeframe
  - **Files Added**: `src/components/TimeframePicker.tsx`
  - **Files Modified**: `src/App.tsx`, `src/lib/types.ts`
  - **Impact**: Users can now query expenses month-on-month basis as requested
  - **Technical Implementation**:
    - Created TimeframePicker component with Popover UI and preset options
    - Added `getExpensesByDateRange` utility function to types.ts
    - Implemented DateRange interface with string-based dates
    - Updated expense filtering logic to include date range validation
    - Enhanced total spending calculation to reflect selected period

#### **Enhanced Layout and Responsiveness**

- **Improved Expense Filter Layout**
  - **Better Responsive Breakpoints**: Changed from `sm:flex-row` to `lg:flex-row` for better mobile experience
  - **Button Container Isolation**: Wrapped Add Expense button in separate container to prevent layout conflicts
  - **Overflow Prevention**: Added `min-w-0` class to filter container to prevent flex overflow issues
  - **Enhanced Event Handling**: Added preventDefault and stopPropagation to button clicks
  - **Files Modified**: `src/App.tsx`
  - **Impact**: Better mobile experience and elimination of layout conflicts

### 🔧 Technical Improvements

- **Modal State Management Enhancement**
  - Improved controlled component pattern for modals
  - Better separation of concerns between parent and child components
  - Enhanced event handling to prevent interference

- **Date Handling Utilities**
  - Added comprehensive date range filtering functionality
  - Proper date string formatting and validation
  - Cross-browser compatible date calculations

### 📱 Mobile Experience Improvements

- **Responsive Filter Layout**: Better handling of multiple filter components on mobile screens
- **Touch-friendly Interactions**: Improved button sizing and touch targets
- **Layout Stability**: Prevented filter components from causing layout shifts

### 🎯 User Experience Enhancements

- **Immediate Visual Feedback**: All interactions now provide instant feedback
- **Intuitive Date Selection**: User-friendly timeframe picker with clear presets
- **Simplified Workflows**: Reduced clicks required for common actions
- **Dynamic Content**: Labels and summaries update based on user selections

## [1.4.0] - 2025-08-21

### ✨ Added

- Added expense editing functionality with comprehensive EditExpenseModal component allowing users to modify expense details, categories, people associations, and view current receipts


## [1.3.1] - 2025-08-21

### 🐛 Fixed

- Fixed Budget Analyzer, Templates, and People sections showing 'Coming Soon' - replaced placeholders with fully functional components


## [1.3.0] - 2025-08-21

### ✨ Added

- Implemented modern sidebar navigation system with collapsible desktop sidebar and mobile sheet overlay to replace cramped 7-tab bottom navigation


## [1.2.0] - 2025-08-21

### 🎉 Added - Major Feature Release

#### **People Management System**

- **New People Tab**: Complete people management interface in main navigation
- **Person Entity**: New data structure with id, name, color, icon, relationship, and sharing options
- **People Manager Component**: Full CRUD operations for managing people
  - Add/edit/delete custom people
  - 20 person emoji icons and 10 color options
  - Relationship categorization (Self, Family, Friend, Colleague, Partner, etc.)
  - Public/private sharing functionality
  - Real-time Firebase synchronization
- **Default People**: Pre-populated with common relationships for immediate use
- **Public People Library**: Share and adopt people across the community

#### **Enhanced Expense Management**
- **People Selection in Add Expense**: Multi-select interface to associate people with expenses
- **Expense-Person Linking**: Track who expenses are spent for via `peopleIds` field
- **Enhanced Expense Cards**: Visual display of associated people with badges
- **Person-based Analytics**: Foundation for tracking spending by person/relationship

#### **Technical Infrastructure**
- **Firebase Operations**: Complete CRUD functions for people management
  - `addPersonToFirestore()`, `updatePersonInFirestore()`, `deletePersonFromFirestore()`
  - `subscribeToCustomPeople()`, `subscribeToPublicPeople()`, `adoptPublicPerson()`
- **State Management**: Updated useFirestoreData hook with people operations
- **TypeScript Interfaces**: Complete Person interface with proper typing
- **Mobile Optimization**: 7-column navigation layout for enhanced mobile experience

### 🔧 Technical Changes
- **Updated Components**:
  - `AddExpenseModal.tsx` - Added people selection functionality
  - `ExpenseCard.tsx` - Display associated people with visual badges
  - `App.tsx` - New People tab integration and navigation updates
- **New Components**:
  - `PeopleManager.tsx` - Complete people management interface
- **Backend Updates**:
  - `firebase.ts` - People CRUD operations and subscriptions
  - `types.ts` - Person interface and helper functions
  - `useFirestoreData.tsx` - People state management integration

### 🎨 UI/UX Improvements
- **Responsive Design**: Enhanced mobile navigation with 7-tab layout
- **Visual People Representation**: Color-coded people with emoji icons
- **Intuitive Selection**: Checkbox-based people selection in expense creation
- **Real-time Updates**: Immediate synchronization across all components
- **Professional Styling**: Consistent design language with existing components

### 📱 Mobile Enhancements
- **Bottom Navigation**: Updated to accommodate People tab
- **Touch-friendly**: Optimized people selection interface for mobile
- **Responsive Layouts**: Adaptive design for various screen sizes

## [1.1.0] - Previous Release

### Added
- **Progressive Web App (PWA) Support**
  - PWA manifest configuration
  - Service worker implementation
  - Install prompts and update notifications
  - Offline functionality support
  - App icons and splash screens

### Enhanced
- **Category Management System**
  - Custom categories with CRUD operations
  - Public category sharing and adoption
  - Color and icon customization
  - Real-time synchronization

### Technical
- **Firebase Integration**
  - Complete authentication system
  - Firestore database operations
  - Cloud Storage for receipts
  - Real-time data subscriptions

## [1.0.0] - Initial Release

### Added
- **Core Expense Management**
  - Add, edit, delete expenses
  - Category-based organization
  - Receipt upload and storage
  - Date-based expense tracking

- **Budget Management**
  - Create and manage budgets
  - Budget vs actual spending tracking
  - Category-wise budget allocation
  - Budget analysis and insights

- **Recurring Templates**
  - Save frequently used expenses as templates
  - Quick expense creation from templates
  - Template management interface

- **Analytics and Insights**
  - AI-powered budget analysis
  - Spending trends visualization
  - Category-wise spending breakdown
  - Monthly expense summaries

- **User Authentication**
  - Google OAuth integration
  - Secure user data isolation
  - Profile management

### Technical Foundation
- **React 18 + TypeScript**: Modern frontend development
- **Firebase Backend**: Authentication, Firestore, Storage
- **Tailwind CSS + Radix UI**: Professional styling system
- **Vite Build System**: Fast development and production builds
- **AI Integration**: OpenAI GPT-4 for financial insights

---

## Version Numbering Guidelines

This project follows [Semantic Versioning](https://semver.org/):

- **Major Version (X.0.0)**: Breaking changes, major feature overhauls
- **Minor Version (X.Y.0)**: New features, significant enhancements
- **Patch Version (X.Y.Z)**: Bug fixes, minor improvements, security updates

### When to Bump Versions:

- **Major (1.0.0 → 2.0.0)**: 
  - Complete UI redesign
  - Breaking API changes
  - Major architecture changes
  - Removal of core features

- **Minor (1.1.0 → 1.2.0)**:
  - New features (like People Management)
  - New major components
  - Significant enhancements to existing features
  - New integrations or platforms

- **Patch (1.1.0 → 1.1.1)**:
  - Bug fixes
  - Security patches
  - Minor UI improvements
  - Performance optimizations
  - Documentation updates

### Release Process:

1. **Feature Development**: Work on feature branch
2. **Version Bump**: Update version in `package.json`
3. **Changelog Update**: Document changes in this file
4. **Testing**: Verify all functionality works
5. **Merge to Main**: Deploy to production
6. **Tag Release**: Create git tag with version number

---

## Links

- [Project Repository](https://github.com/theharithsa/budget-buddy)
- [Live Application](https://your-app-url.com)
- [Documentation](./README.md)
- [Issues](https://github.com/theharithsa/budget-buddy/issues)
