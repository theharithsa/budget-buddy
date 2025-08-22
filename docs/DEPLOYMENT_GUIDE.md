# 🚀 Deployment Guide - Budget Buddy

**Application**: Budget Buddy v2.2.1  
**Last Updated**: August 2025  
**Deployment Status**: Production Ready

## 📋 Overview

This comprehensive deployment guide covers all aspects of deploying Budget Buddy to various platforms, with a focus on Firebase Hosting for production and development environments.

## 🏗️ Architecture Overview

### **Technology Stack**

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Frontend** | React 18 + TypeScript + Vite | Progressive Web Application |
| **UI Framework** | Tailwind CSS + Radix UI + Flowbite | Responsive design system |
| **Charts** | ApexCharts | Professional data visualizations |
| **Backend** | Firebase (Auth + Firestore + Storage) | Serverless backend services |
| **Hosting** | Firebase Hosting | Global CDN with SSL |
| **PWA** | Service Worker + Manifest | Offline-first capabilities |
| **Build Tool** | Vite | Fast development and production builds |

### **Deployment Targets**

| Environment | URL | Purpose | Branch |
|-------------|-----|---------|---------|
| **Production** | `finbuddy-2025.web.app` | Live user environment | `main` |
| **Staging** | `finbuddy-2025-staging.web.app` | Testing environment | `develop` |
| **Development** | `localhost:5000` | Local development | Any branch |

## 🔧 Prerequisites

### **Required Tools**

```bash
# Node.js 18+ with npm
node --version  # Should be 18.0.0 or higher
npm --version   # Should be 8.0.0 or higher

# Firebase CLI
npm install -g firebase-tools
firebase --version  # Should be 11.0.0 or higher

# Git for version control
git --version
```

### **Environment Setup**

```bash
# Clone repository
git clone https://github.com/your-org/budget-buddy.git
cd budget-buddy

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local
```

### **Environment Variables**

```bash
# .env.local (required for local development)
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef

# Optional AI features
VITE_OPENAI_API_KEY=sk-your-openai-key

# Optional observability
VITE_DYNATRACE_URL=https://your-tenant.live.dynatrace.com
VITE_DYNATRACE_TOKEN=your-dynatrace-token
VITE_ENVIRONMENT=production
```

## 🔥 Firebase Setup

### **1. Project Creation**

```bash
# Login to Firebase
firebase login

# Create new project (or use existing)
firebase projects:create finbuddy-2025

# Initialize Firebase in project
firebase init
```

### **2. Firebase Configuration**

#### **Select Services**
```bash
# During firebase init, select:
✅ Hosting: Configure files for Firebase Hosting
✅ Firestore: Deploy rules and create indexes
✅ Storage: Deploy Cloud Storage security rules
✅ Authentication: Configure authentication settings
```

#### **Hosting Configuration**
```json
// firebase.json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      },
      {
        "source": "sw.js",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "no-cache"
          }
        ]
      }
    ]
  }
}
```

### **3. Security Rules**

#### **Firestore Rules**
```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User data access
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      match /expenses/{expenseId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      match /budgets/{budgetId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
    
    // Public categories (read-only for authenticated users)
    match /publicCategories/{categoryId} {
      allow read: if request.auth != null;
      allow write: if false; // Only admins can write
    }
    
    // Public people (read-only for authenticated users)
    match /publicPeople/{personId} {
      allow read: if request.auth != null;
      allow write: if false; // Only admins can write
    }
  }
}
```

#### **Storage Rules**
```javascript
// storage.rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /receipts/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 🚀 Deployment Process

### **Local Development**

```bash
# Start development server
npm run dev

# Development server runs at:
# http://localhost:5000

# Build for testing
npm run build
npm run preview
```

### **Production Deployment**

#### **1. Pre-Deployment Checklist**

```bash
# ✅ All tests passing
npm run test

# ✅ Build successful
npm run build

# ✅ No linting errors
npm run lint

# ✅ Environment variables configured
# ✅ Firebase project selected
# ✅ Security rules updated
```

#### **2. Automated Deployment**

```bash
# One-command deployment
npm run deploy

# This runs:
# 1. npm run build
# 2. firebase deploy --only hosting
# 3. Version tagging
# 4. Cache invalidation
```

#### **3. Manual Deployment Steps**

```bash
# Step 1: Build application
npm run build

# Step 2: Deploy to Firebase
firebase deploy --only hosting

# Step 3: Deploy Firestore rules (if changed)
firebase deploy --only firestore:rules

# Step 4: Deploy Storage rules (if changed)
firebase deploy --only storage

# Step 5: Verify deployment
curl -I https://finbuddy-2025.web.app
```

### **Staging Deployment**

```bash
# Deploy to staging environment
firebase use staging
npm run build:staging
firebase deploy --only hosting

# Switch back to production
firebase use production
```

## 🔧 Build Configuration

### **Vite Configuration**

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu']
        }
      }
    }
  },
  server: {
    port: 5000,
    host: true
  }
})
```

### **Build Scripts**

```json
// package.json scripts
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "build:staging": "tsc && vite build --mode staging",
    "preview": "vite preview",
    "deploy": "npm run build && firebase deploy --only hosting",
    "deploy:staging": "npm run build:staging && firebase use staging && firebase deploy --only hosting && firebase use production"
  }
}
```

## 🌐 Domain & SSL Configuration

### **Custom Domain Setup**

```bash
# Add custom domain to Firebase Hosting
firebase hosting:sites:create finbuddy-app

# Configure domain
firebase target:apply hosting finbuddy finbuddy-app
firebase hosting:sites:get finbuddy-app
```

#### **DNS Configuration**
```
# DNS Records (at your domain provider)
Type: A
Name: @
Value: 151.101.1.195

Type: A  
Name: @
Value: 151.101.65.195

Type: CNAME
Name: www
Value: finbuddy-2025.web.app
```

### **SSL Certificate**

Firebase Hosting automatically provides SSL certificates for:
- Default Firebase domains (`.web.app`, `.firebaseapp.com`)
- Custom domains (automatically provisioned)

## 📊 Performance Optimization

### **Build Optimization**

```typescript
// Bundle analysis
npm run build:analyze

// Performance optimizations implemented:
// ✅ Code splitting by route and vendor
// ✅ Tree shaking for unused code
// ✅ Asset optimization (images, fonts)
// ✅ Service worker caching
// ✅ Gzip compression
// ✅ CDN delivery via Firebase Hosting
```

### **Cache Strategy**

```javascript
// Service Worker Cache Strategy
const CACHE_NAME = 'budget-buddy-v2.2.1';
const STATIC_CACHE = [
  '/',
  '/static/js/main.js',
  '/static/css/main.css',
  '/manifest.json'
];

// Cache first, then network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
```

### **Performance Metrics**

| Metric | Target | Current |
|--------|--------|---------|
| **First Contentful Paint** | < 1.5s | 1.2s |
| **Largest Contentful Paint** | < 2.5s | 2.1s |
| **Time to Interactive** | < 3.5s | 2.8s |
| **Bundle Size** | < 500KB | 420KB |

## 🔍 Monitoring & Observability

### **Deployment Monitoring**

```bash
# Check deployment status
firebase hosting:sites:list

# View deployment history
firebase hosting:releases:list

# Monitor application health
curl -f https://finbuddy-2025.web.app/health || echo "Health check failed"
```

### **Error Monitoring**

```typescript
// Error boundary configuration
if (process.env.NODE_ENV === 'production') {
  window.addEventListener('error', (event) => {
    console.error('Production error:', event.error);
    // Send to monitoring service
  });
}
```

### **Dynatrace Integration**

```typescript
// Optional Dynatrace monitoring
if (process.env.VITE_DYNATRACE_URL) {
  import('./lib/dynatrace').then(({ initDynatrace }) => {
    initDynatrace({
      url: process.env.VITE_DYNATRACE_URL,
      token: process.env.VITE_DYNATRACE_TOKEN,
      environment: process.env.VITE_ENVIRONMENT || 'production'
    });
  });
}
```

## 🔒 Security Considerations

### **Environment Security**

```bash
# Never commit these files:
.env
.env.local
.env.production
firebase-debug.log
.firebase/
```

### **Runtime Security**

```typescript
// Content Security Policy headers
{
  "key": "Content-Security-Policy",
  "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://apis.google.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.firebaseio.com https://*.googleapis.com"
}
```

### **Firebase Security**

```javascript
// Authentication check in app
if (!user) {
  // Redirect to login
  router.push('/login');
  return;
}

// Validate user permissions
if (user.uid !== documentOwnerId) {
  throw new Error('Unauthorized access');
}
```

## 🚨 Troubleshooting

### **Common Deployment Issues**

#### **Build Failures**
```bash
# Problem: TypeScript errors
# Solution: Fix type errors
npm run type-check

# Problem: Missing dependencies
# Solution: Install missing packages
npm install

# Problem: Environment variables missing
# Solution: Copy and configure .env.local
cp .env.example .env.local
```

#### **Firebase Deployment Issues**
```bash
# Problem: Authentication failed
# Solution: Re-login to Firebase
firebase logout
firebase login

# Problem: Wrong project selected
# Solution: Select correct project
firebase projects:list
firebase use finbuddy-2025

# Problem: Quota exceeded
# Solution: Check Firebase usage dashboard
firebase projects:info
```

#### **Runtime Issues**
```bash
# Problem: 404 errors on routes
# Solution: Check Firebase hosting rewrites in firebase.json

# Problem: CORS errors
# Solution: Configure Firebase Storage CORS
gsutil cors set cors.json gs://your-bucket.appspot.com
```

### **Performance Issues**

```bash
# Analyze bundle size
npm run build:analyze

# Check lighthouse scores
npx lighthouse https://finbuddy-2025.web.app --view

# Monitor Firebase performance
firebase performance:measure
```

## 📅 Maintenance & Updates

### **Regular Maintenance Tasks**

| Task | Frequency | Command |
|------|-----------|---------|
| **Security Updates** | Weekly | `npm audit && npm update` |
| **Dependency Updates** | Monthly | `npm outdated && npm update` |
| **Performance Review** | Monthly | `npm run build:analyze` |
| **Backup Verification** | Monthly | Check Firebase exports |
| **SSL Certificate** | Automatic | Firebase managed |

### **Update Process**

```bash
# 1. Update dependencies
npm update

# 2. Test locally
npm run dev
npm run build

# 3. Deploy to staging
npm run deploy:staging

# 4. Run tests
npm run test:e2e

# 5. Deploy to production
npm run deploy
```

## 📞 Support & Resources

### **Documentation Links**
- [Firebase Hosting Docs](https://firebase.google.com/docs/hosting)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [React Production Build](https://reactjs.org/docs/optimizing-performance.html)

### **Emergency Contacts**
- **Firebase Support**: Firebase Console → Support
- **Domain Issues**: Contact domain registrar
- **CDN Issues**: Firebase Status Page

### **Rollback Procedure**
```bash
# View deployment history
firebase hosting:releases:list

# Rollback to previous version
firebase hosting:releases:rollback <release-id>

# Verify rollback
curl -I https://finbuddy-2025.web.app
```

---

## 🎯 Deployment Checklist

### **Pre-Deployment**
- [ ] All tests passing
- [ ] Build successful without warnings
- [ ] Environment variables configured
- [ ] Firebase project selected
- [ ] Security rules updated
- [ ] Performance metrics within targets

### **Post-Deployment**
- [ ] Application loads correctly
- [ ] Authentication working
- [ ] Database operations functional
- [ ] File uploads working
- [ ] PWA installation available
- [ ] Mobile responsiveness verified
- [ ] Performance metrics recorded

### **Production Verification**
- [ ] Health check endpoint responding
- [ ] Error monitoring active
- [ ] Analytics tracking working
- [ ] SSL certificate valid
- [ ] CDN caching configured
- [ ] Service worker updating

**Deployment Guide**: v2.2.1  
**Last Updated**: August 2025  
**Next Review**: November 2025