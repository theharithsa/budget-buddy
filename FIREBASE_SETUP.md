# Firebase Setup Guide

This finance tracker app uses Firebase for authentication, database, and file storage. To enable all features, you'll need to configure Firebase with the proper security rules.

## Quick Setup

1. **Create a Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project or use an existing one
   - Enable Authentication, Firestore Database, and Storage

2. **Deploy Security Rules**
   ```bash
   # Install Firebase CLI if you haven't already
   npm install -g firebase-tools
   
   # Login to Firebase
   firebase login
   
   # Initialize Firebase in your project directory
   firebase init
   
   # Select Firestore Database and Storage
   # Choose existing project
   # Use the provided firestore.rules and storage.rules files
   
   # Deploy rules
   firebase deploy --only firestore:rules,storage:rules
   ```

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