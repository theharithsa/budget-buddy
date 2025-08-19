# Firebase Setup Instructions

## Overview
This finance tracker now includes receipt upload functionality using Firebase Storage. To enable this feature, you'll need to set up a Firebase project.

## Setup Steps

### 1. Create a Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter a project name (e.g., "finance-tracker")
4. Follow the setup wizard

### 2. Enable Firebase Storage
1. In your Firebase project console, go to "Storage" in the sidebar
2. Click "Get started"
3. Choose "Start in test mode" for now (you can configure security rules later)
4. Select a storage location closest to your users

### 3. Get Firebase Configuration
1. Go to Project Settings (gear icon) → General tab
2. Scroll down to "Your apps" section
3. Click on "Web" icon to add a web app
4. Enter an app nickname (e.g., "finance-tracker-web")
5. Copy the configuration object

### 4. Update Firebase Configuration
Replace the demo configuration in `src/lib/firebase.ts` with your actual Firebase config:

```typescript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com", 
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

### 5. Security Rules (Optional but Recommended)
In Firebase Console → Storage → Rules, you can set up security rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /receipts/{allPaths=**} {
      allow read, write: if request.auth != null; // Only authenticated users
      // OR for public access (less secure):
      // allow read, write: if true;
    }
  }
}
```

## Features Added

### Receipt Upload
- Upload images (JPEG, PNG, WebP) or PDF files
- Maximum file size: 5MB
- Files are stored in Firebase Storage under `/receipts/` path
- Automatic file validation

### Receipt Viewing
- View uploaded receipts directly in the app
- Support for both images and PDF files
- Full-screen viewing with "Open in New Tab" option

### Data Storage
- Receipt URLs are stored with expense data
- Original filename is preserved
- Receipts persist between sessions

## Current Configuration
The app is currently using demo Firebase configuration. Receipt upload will work once you:
1. Set up your Firebase project
2. Update the configuration in `src/lib/firebase.ts`
3. Enable Firebase Storage in your project

## Troubleshooting
- If uploads fail, check Firebase Storage rules
- Ensure your Firebase project has Storage enabled
- Verify the configuration matches your Firebase project settings
- Check browser console for detailed error messages