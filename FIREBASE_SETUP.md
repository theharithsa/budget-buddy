# Finance Tracker - Firebase Setup Guide

This Finance Tracker application uses Firebase for authentication, database, and file storage. Follow this guide to set up your own Firebase project.

## Prerequisites

- A Google account
- Basic understanding of Firebase console

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter a project name (e.g., "my-finance-tracker")
4. Choose whether to enable Google Analytics (optional)
5. Click "Create project"

## Step 2: Set Up Authentication

1. In your Firebase project, go to **Authentication** > **Sign-in method**
2. Enable **Google** as a sign-in provider:
   - Click on Google
   - Toggle "Enable"
   - Set your project support email
   - Click "Save"

## Step 3: Set Up Firestore Database

1. Go to **Firestore Database**
2. Click "Create database"
3. Choose "Start in test mode" (you can secure it later)
4. Select a location close to your users
5. Click "Done"

### Firestore Security Rules (Optional - for production)

Replace the default rules with these for better security:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Step 4: Set Up Storage

1. Go to **Storage**
2. Click "Get started"
3. Start in test mode
4. Choose the same location as your Firestore database
5. Click "Done"

### Storage Security Rules (Optional - for production)

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Users can only access their own receipts
    match /receipts/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Step 5: Get Your Firebase Configuration

1. Go to **Project Settings** (gear icon)
2. Scroll down to "Your apps"
3. Click "Add app" and choose "Web" (</> icon)
4. Register your app with a nickname
5. Copy the Firebase configuration object

## Step 6: Update Your Application

1. Open `src/lib/firebase.ts` in your project
2. Replace the `firebaseConfig` object with your configuration:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com", 
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
};
```

## Step 7: Set Up Domain Authorization (Optional)

For production deployment:

1. Go to **Authentication** > **Settings** > **Authorized domains**
2. Add your production domain (e.g., yourdomain.com)

## Data Structure

The application creates the following Firestore structure:

```
users/
  {userId}/
    expenses/
      {expenseId}/
        - amount: number
        - category: string
        - description: string
        - date: string
        - createdAt: string
        - receiptUrl?: string
        - receiptFileName?: string
    
    budgets/
      {budgetId}/
        - category: string
        - limit: number
        - spent: number
    
    templates/
      {templateId}/
        - name: string
        - amount: number
        - category: string
        - description: string
        - frequency: string
        - isDefault: boolean
        - createdAt: string
```

## Storage Structure

Receipts are stored in Firebase Storage:

```
receipts/
  {expenseId}_{timestamp}.{extension}
```

## Troubleshooting

### Authentication Issues
- Make sure Google sign-in is enabled in Authentication > Sign-in method
- Check that your domain is authorized
- Verify your Firebase config is correct

### Database Permission Issues
- Check Firestore security rules
- Make sure users are properly authenticated
- Verify the user ID matches in rules

### Storage Upload Issues
- Check Storage security rules
- Verify file size (max 5MB)
- Ensure file type is supported (JPEG, PNG, WebP, PDF)

## Security Best Practices

1. **Use Security Rules**: Always implement proper Firestore and Storage security rules for production
2. **Environment Variables**: Store Firebase config in environment variables for production
3. **HTTPS Only**: Always use HTTPS in production
4. **Regular Monitoring**: Monitor usage and costs in Firebase console

## Cost Considerations

Firebase offers generous free tiers:
- **Authentication**: 50,000 monthly active users (free)
- **Firestore**: 50,000 reads, 20,000 writes, 20,000 deletes per day (free)
- **Storage**: 5GB storage, 1GB/day downloads (free)

Monitor your usage in the Firebase console to avoid unexpected charges.