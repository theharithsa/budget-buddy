# Changelog

All notable changes to Budget Buddy will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
