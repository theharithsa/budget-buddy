# 🔥 Firebase Setup Guide - Budget Buddy v2.2.2

This comprehensive guide will help you configure Firebase backend services for Budget Buddy, including Authentication, Firestore Database, and Cloud Storage with proper security rules.

## 🚀 Quick Setup (5 Minutes)

### Prerequisites
- [Firebase CLI](https://firebase.google.com/docs/cli) installed
- Node.js 18+ and npm
- Google account for Firebase Console access

### 1. Create Firebase Project

1. **Visit Firebase Console**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Create a project" or use existing project
   - Project name: `budget-buddy-[your-name]` (or your preferred name)

2. **Enable Required Services**
   ```bash
   # Enable services via CLI (after project setup)
   firebase projects:list
   firebase use your-project-id
   
   # Or enable manually in console:
   # - Authentication > Sign-in method > Google (Enable)
   # - Firestore Database > Create database > Start in test mode
   # - Storage > Get started > Start in test mode
   ```

### 2. Configure Authentication

1. **Enable Google Sign-In**
   - Go to Authentication > Sign-in method
   - Click on "Google" provider
   - Enable and configure:
     - **Project support email**: Your email
     - **Project public-facing name**: "Budget Buddy"
   - Save configuration

2. **Add Authorized Domains**
   ```
   localhost (for development)
   your-domain.com (for production)
   finbuddy-2025.web.app (if using Firebase Hosting)
   ```

### 3. Deploy Security Rules

1. **Initialize Firebase in your project**
   ```bash
   # Navigate to your Budget Buddy project directory
   cd budget-buddy
   
   # Initialize Firebase (if not already done)
   firebase init
   
   # Select:
   # ✅ Firestore: Deploy rules and create indexes
   # ✅ Storage: Deploy rules
   # ✅ Hosting: Configure files for Firebase Hosting
   ```

2. **Deploy Rules**
   ```bash
   # Deploy all rules at once
   firebase deploy --only firestore:rules,storage:rules
   
   # Or deploy individually
   firebase deploy --only firestore:rules
   firebase deploy --only storage:rules
   ```

### 4. Configure Environment

1. **Get Firebase Configuration**
   - Go to Project Settings > General > Your apps
   - Click on Web app or create new one
   - Copy the `firebaseConfig` object

2. **Update Firebase Configuration**
   ```typescript
   // src/lib/firebase.ts
   const firebaseConfig = {
     apiKey: "your-api-key",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "your-app-id"
   };
   ```

## 🔒 Security Rules Configuration

### Firestore Database Rules

Create or update `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User-specific data (expenses, budgets, templates)
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Public categories - readable by all authenticated users
    match /publicCategories/{document} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && (
        resource == null || // Allow creating new documents
        resource.data.createdBy == request.auth.uid // Allow updates only by creator
      );
    }
    
    // Custom categories - user-specific
    match /customCategories/{document} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && (
        resource == null || // Allow creating new documents
        resource.data.userId == request.auth.uid // Allow updates only by creator
      );
    }
    
    // Budget templates - user-specific
    match /budgetTemplates/{document} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && (
        resource == null || // Allow creating new documents
        resource.data.userId == request.auth.uid // Allow updates only by creator
      );
    }
    
    // Public people - readable by all authenticated users
    match /publicPeople/{document} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && (
        resource == null || // Allow creating new documents
        resource.data.createdBy == request.auth.uid // Allow updates only by creator
      );
    }
  }
}
```

### Firebase Storage Rules

Create or update `storage.rules`:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // User's private receipts - only accessible by the user themselves
    match /receipts/{userId}/{receiptId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == userId &&
        // Limit file size to 10MB
        request.resource.size < 10 * 1024 * 1024 &&
        // Only allow image files
        request.resource.contentType.matches('image/.*');
    }
    
    // General user files
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && 
        request.auth.uid == userId &&
        // Limit file size to 10MB
        request.resource.size < 10 * 1024 * 1024;
    }
    
    // Public profile images (if needed in future)
    match /public/{allPaths=**} {
      allow read: if true; // Publicly readable
      allow write: if request.auth != null &&
        request.resource.size < 5 * 1024 * 1024;
    }
  }
}
```

## 🔧 Advanced Configuration

### Database Indexes

For optimal performance, create these Firestore indexes:

1. **Via Firebase Console**:
   - Go to Firestore Database > Indexes
   - Add these composite indexes:

   ```
   Collection: users/{userId}/expenses
   Fields: date (Descending), amount (Descending)
   
   Collection: users/{userId}/expenses  
   Fields: category (Ascending), date (Descending)
   
   Collection: users/{userId}/expenses
   Fields: people (Array), date (Descending)
   ```

2. **Via CLI** (recommended):
   ```bash
   # Create firestore.indexes.json
   firebase firestore:indexes
   
   # Deploy indexes
   firebase deploy --only firestore:indexes
   ```

### Environment Variables

For enhanced security and monitoring:

```bash
# .env.local (for local development)
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your-app-id

# Optional: AI and Monitoring
VITE_OPENAI_API_KEY=your-openai-key
VITE_DYNATRACE_URL=your-dynatrace-url
VITE_DYNATRACE_TOKEN=your-dynatrace-token
```

### Production Hosting Setup

```bash
# Build and deploy to Firebase Hosting
npm run build
firebase deploy --only hosting

# Or deploy everything
firebase deploy
```

## ✅ Features Enabled

With proper configuration, users can:

### 🔐 **Authentication & Security**
- ✅ **Google Sign-In**: Secure OAuth authentication
- ✅ **User Isolation**: Complete data privacy between users
- ✅ **Session Management**: Automatic token refresh and logout
- ✅ **Authorized Domains**: Secure domain restrictions

### 💾 **Data Management**
- ✅ **Private Expenses**: Secure expense tracking and categorization
- ✅ **Budget Management**: Personal budget limits and progress tracking
- ✅ **Public Categories**: Shared category system with community contributions
- ✅ **People Management**: Public and private people tracking for shared expenses
- ✅ **Templates**: Recurring transaction templates

### 📁 **File Storage**
- ✅ **Receipt Uploads**: Secure image storage with size and type validation
- ✅ **File Organization**: User-specific folder structure
- ✅ **Image Optimization**: Automatic compression and format conversion
- ✅ **Backup & Sync**: Cross-device file synchronization

### 📊 **Real-time Features**
- ✅ **Live Updates**: Real-time expense and budget synchronization
- ✅ **Offline Support**: Local caching with automatic sync when online
- ✅ **Multi-device**: Seamless experience across all devices
- ✅ **Collaboration**: Shared categories and people for team expenses

## 🚨 Troubleshooting

### Common Issues

#### **Permission Denied Errors**
```bash
# Check if user is authenticated
firebase auth:export users.json

# Verify rules deployment
firebase firestore:rules:get
firebase storage:rules:get

# Test rules locally
firebase emulators:start --only firestore,storage
```

**Solution**: Ensure user is signed in and rules are properly deployed.

#### **Public Categories Not Loading**
This is normal behavior when Firestore rules aren't configured for public access. The app gracefully handles this by:
- Showing only user's custom categories
- Displaying helpful message about Firebase setup
- Maintaining full functionality for personal features

#### **Receipt Upload Failures**
- ✅ Check Storage rules are deployed
- ✅ Verify file size (must be < 10MB)
- ✅ Ensure file type is image/*
- ✅ Confirm user authentication

#### **Slow Query Performance**
- ✅ Check Firestore indexes are created
- ✅ Optimize query patterns in code
- ✅ Use Firebase Performance Monitoring
- ✅ Enable offline persistence

### Debug Commands

```bash
# Check Firebase project status
firebase projects:list
firebase use --add

# Test authentication
firebase auth:export users.json --format=json

# Monitor real-time database activity
firebase firestore:databases:list

# Check security rules
firebase firestore:rules:get
firebase storage:rules:get

# Local testing with emulators
firebase emulators:start
```

## 🔄 Without Firebase Configuration

Budget Buddy gracefully handles incomplete Firebase setup:

### ✅ **Works Without Configuration**
- Local expense tracking and categorization
- Budget management and progress tracking
- Chart visualization and analytics
- AI-powered insights (with OpenAI key)
- PWA functionality and offline mode

### ⚠️ **Limited Functionality**
- Public categories sharing disabled
- Receipt uploads not available
- No cross-device synchronization
- No collaborative features

### 🚫 **Console Warnings**
Normal behavior includes permission denied warnings for:
- Public categories access attempts
- Cross-user data queries
- Storage upload attempts

These warnings don't affect core functionality and indicate proper security rule enforcement.

## 📈 Monitoring & Analytics

### Firebase Analytics
```bash
# Enable Google Analytics (optional)
firebase init analytics

# Track user engagement
# Custom events automatically logged by Budget Buddy
```

### Performance Monitoring
```bash
# Enable Performance Monitoring
firebase init perf

# Monitor in Firebase Console > Performance
```

### Crashlytics (Optional)
```bash
# Enable Crashlytics
firebase init crashlytics

# Automatic error reporting
```

## 🔗 Additional Resources

- **[Firebase Documentation](https://firebase.google.com/docs)**
- **[Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)**
- **[Firebase Storage Rules](https://firebase.google.com/docs/storage/security)**
- **[Firebase CLI Reference](https://firebase.google.com/docs/cli)**
- **[Performance Best Practices](https://firebase.google.com/docs/firestore/best-practices)**

## 🆘 Support

- **Issues**: Report in [GitHub Issues](https://github.com/theharithsa/budget-buddy/issues)
- **Discussions**: [GitHub Discussions](https://github.com/theharithsa/budget-buddy/discussions)
- **Documentation**: [docs/ folder](./README.md)
- **Firebase Support**: [Firebase Support](https://firebase.google.com/support)

---

**Setup Status**: ✅ Complete Firebase configuration  
**Last Updated**: v2.2.1 (August 2025)  
**Estimated Setup Time**: 5-10 minutes for experienced developers

3. **Update Firebase Configuration**
   - Get your Firebase config from Project Settings → General → Your apps
   - Update the configuration in `src/lib/firebase.ts`

## Security Rules Explanation

### Firestore Rules (`firestore.rules`)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User's private data - only accessible by the user themselves
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Public categories - readable by all authenticated users
    match /publicCategories/{categoryId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && (
        resource == null || // Allow creating new documents
        resource.data.userId == request.auth.uid // Allow updates only by creator
      );
    }
  }
}
```

### Storage Rules (`storage.rules`)

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // User's private receipts - only accessible by the user themselves
    match /receipts/{userId}/{receiptId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // General user files
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Features Enabled

With these rules configured, users can:

- ✅ **Private Data**: Store expenses, budgets, and templates privately
- ✅ **Public Categories**: Share custom categories with other users
- ✅ **Receipt Storage**: Upload and store receipt images securely
- ✅ **Authentication**: Google Sign-in for user management

## Without Configuration

If Firebase rules are not configured:

- ✅ All personal features work (expenses, budgets, templates)
- ⚠️ Public categories sharing is disabled (gracefully handled)
- ⚠️ Receipt uploads may not work
- 🚫 Console warnings about permission denied (normal behavior)

## Troubleshooting

**Permission Denied Errors**: If you see permission denied errors, make sure:
1. Firebase Authentication is enabled
2. Security rules are deployed
3. Users are properly signed in

**Public Categories Not Showing**: This is normal if Firestore rules aren't configured for public access. The app handles this gracefully.

**Receipt Upload Fails**: Check Storage rules and ensure the bucket is configured correctly.