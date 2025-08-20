# Deployment Guide - Moving Away from GitHub Spark

This guide explains how to deploy your Budget Buddy app to other platforms by removing Spark dependencies.

## Current Spark Dependencies

- `@github/spark` - For AI/LLM functionality
- Spark icon proxy system
- Spark build plugins

## Deployment Options

### Option 1: Vercel (Recommended)
1. **Remove Spark Dependencies**
2. **Add OpenAI Integration**
3. **Deploy to Vercel**

### Option 2: Firebase Hosting

1. **Remove Spark Dependencies**
2. **Add OpenAI Integration**
3. **Deploy to Firebase Hosting**

### Option 3: Netlify

1. **Remove Spark Dependencies**
2. **Add OpenAI Integration**
3. **Deploy to Netlify**

## Step-by-Step Migration

### 1. Remove Spark Dependencies

**Update `package.json`:**

```json
{
  "dependencies": {
    // Remove this line:
    // "@github/spark": "^0.39.0",
    
    // Add OpenAI:
    "openai": "^4.20.0"
  }
}
```

**Update `vite.config.ts`:**

```typescript
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import { resolve } from 'path'

const projectRoot = process.env.PROJECT_ROOT || import.meta.dirname

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Remove Spark plugins
  ],
  resolve: {
    alias: {
      '@': resolve(projectRoot, 'src')
    }
  },
});
```

**Update `src/main.tsx`:**

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
// Remove this line:
// import "@github/spark/spark"

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

### 2. Replace AI Functionality

**Create `src/lib/openai.ts`:**

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Only for client-side usage
});

export async function analyzeWithGPT(prompt: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to analyze with AI');
  }
}
```

**Update `src/components/BudgetAnalyzer.tsx`:**

```typescript
// Replace this import:
// import { spark } from '@github/spark';

// With:
import { analyzeWithGPT } from '@/lib/openai';

// Replace this line:
// const response = await spark.llm(prompt, 'gpt-4o', true);

// With:
const response = await analyzeWithGPT(prompt);
```

### 3. Fix Icon Issues

**Install Lucide React (better icon library):**

```bash
npm install lucide-react
```

**Replace problematic icons in components:**

```typescript
// Instead of @phosphor-icons/react, use lucide-react:
import { 
  Receipt, 
  Wallet, 
  TrendingUp, 
  Search, 
  Plus,
  Calendar,
  Tag,
  Eye,
  Trash2,
  // ... other icons
} from 'lucide-react';
```

### 4. Environment Variables

**Create `.env` file:**

```env
VITE_OPENAI_API_KEY=your_openai_api_key_here
VITE_FIREBASE_API_KEY=AIzaSyDrZD1uiFf6BCTBvMi0WDoAr0VJrEwXWL8
VITE_FIREBASE_AUTH_DOMAIN=finbuddy-2025.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=finbuddy-2025
VITE_FIREBASE_STORAGE_BUCKET=finbuddy-2025.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=1080442347255
VITE_FIREBASE_APP_ID=1:1080442347255:web:62813824efd5a9b12cfdf2
VITE_FIREBASE_MEASUREMENT_ID=G-ESNPQSYLCB
```

**Update `src/lib/firebase.ts`:**

```typescript
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};
```

## Deployment Instructions

### For Vercel:

1. Push code to GitHub repository
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### For Firebase Hosting:

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

### For Netlify:

1. Push code to GitHub repository
2. Connect repository to Netlify
3. Set build command: `npm run build`
4. Set publish directory: `dist`
5. Add environment variables in Netlify dashboard

## Important Notes

1. **OpenAI API Key**: Get from https://platform.openai.com/api-keys
2. **Firebase**: Your Firebase config is already set up
3. **Environment Variables**: Never commit API keys to version control
4. **CORS**: OpenAI API calls from browser may have CORS issues - consider adding a backend API

## Cost Considerations

- **OpenAI API**: Pay per token usage
- **Firebase**: Free tier available, pay for usage beyond limits
- **Hosting**: Vercel/Netlify have generous free tiers

## Security Recommendations

1. **API Key Security**: Use server-side API calls for production
2. **Rate Limiting**: Implement rate limiting for AI features
3. **Firebase Rules**: Keep your existing Firebase security rules
