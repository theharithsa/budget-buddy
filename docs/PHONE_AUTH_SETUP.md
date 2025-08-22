# Firebase Phone Authentication Setup Guide

## 🚨 **IMPORTANT**: Phone Authentication Configuration Required

The `auth/invalid-app-credential` error indicates that phone authentication is not properly configured in your Firebase project. Follow these steps to enable phone authentication:

## 📋 **Step-by-Step Setup**

### 1. **Enable Phone Authentication in Firebase Console**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `finbuddy-2025`
3. Navigate to **Authentication** → **Sign-in method**
4. Click on **Phone** in the Sign-in providers list
5. Toggle **Enable** to turn on phone authentication
6. Click **Save**

### 2. **Configure reCAPTCHA for Phone Authentication**

#### **Option A: Use Firebase App Check (Recommended)**

1. In Firebase Console, go to **App Check**
2. Click **Get started**
3. Register your web app with reCAPTCHA v3
4. Add your domain: `localhost` (for development)
5. Copy the site key to your environment variables

#### **Option B: Manual reCAPTCHA Setup**

1. Go to [Google reCAPTCHA](https://www.google.com/recaptcha/admin)
2. Click **+ Create** to add a new site
3. Choose **reCAPTCHA v2** → **"I'm not a robot" Checkbox**
4. Add domains:
   - `localhost` (for development)
   - `127.0.0.1` (for development)
   - Your production domain
5. Copy the **Site Key**

### 3. **Update Firebase Configuration**

Add the reCAPTCHA site key to your Firebase configuration:

```typescript
// In src/lib/firebase.ts
const firebaseConfig = {
  apiKey: "AIzaSyDrZD1uiFf6BCTBvMi0WDoAr0VJrEwXWL8",
  authDomain: "finbuddy-2025.firebaseapp.com",
  projectId: "finbuddy-2025",
  storageBucket: "finbuddy-2025.firebasestorage.app",
  messagingSenderId: "1080442347255",
  appId: "1:1080442347255:web:62813824efd5a9b12cfdf2",
  measurementId: "G-ESNPQSYLCB",
  // Add this line with your reCAPTCHA site key:
  recaptchaSiteKey: "6Lc6Aa8rAAAAAOrkGN8jSlU26FnviDre8WZ9dk29"
};
```

### 4. **Authorize Domains**

1. In Firebase Console, go to **Authentication** → **Settings** → **Authorized domains**
2. Add these domains:
   - `localhost`
   - `127.0.0.1`
   - Your production domain

### 5. **Set up SMS Provider (Optional)**

For production use, you may want to configure a custom SMS provider:

1. In Firebase Console, go to **Authentication** → **Templates**
2. Click on **SMS verification**
3. Configure your SMS template
4. For high volume, consider upgrading to Blaze plan

## 🔧 **Environment Variables**

Create a `.env.local` file in your project root:

```env
# reCAPTCHA Site Key (if using manual setup)
VITE_RECAPTCHA_SITE_KEY=your_recaptcha_site_key_here

# Firebase Configuration (already configured)
VITE_FIREBASE_API_KEY=AIzaSyDrZD1uiFf6BCTBvMi0WDoAr0VJrEwXWL8
VITE_FIREBASE_AUTH_DOMAIN=finbuddy-2025.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=finbuddy-2025
```

## 🧪 **Testing Phone Authentication**

### **Quick Test Checklist**

1. ✅ Phone authentication enabled in Firebase Console
2. ✅ reCAPTCHA configured and site key added
3. ✅ Domain authorized in Firebase settings
4. ✅ Phone number format: `+[country_code][phone_number]`
5. ✅ Test with a real phone number you control

### **Test Phone Numbers (Firebase Provides)**

For testing, you can use Firebase's test phone numbers:

- Phone: `+1 555-555-5555`
- Code: `123456`

To add test numbers:
1. Firebase Console → Authentication → Settings

2. Scroll to **Phone numbers for testing**
3. Add phone number and verification code

## 🚨 **Common Issues & Solutions**

### **Error: `auth/invalid-app-credential`**

- **Cause**: Phone authentication not enabled
- **Solution**: Follow steps 1-2 above

### **Error: `auth/captcha-check-failed`**

- **Cause**: reCAPTCHA not properly configured
- **Solution**: Check reCAPTCHA site key and domain settings

### **Error: `auth/invalid-phone-number`**

- **Cause**: Phone number format incorrect
- **Solution**: Use format `+1234567890` (with country code)

### **Error: `auth/quota-exceeded`**

- **Cause**: SMS quota exceeded (free tier limit)
- **Solution**: Upgrade to Blaze plan or wait for quota reset

## 💡 **Alternative Authentication Methods**

While setting up phone authentication, users can still use:

- 🔵 **Google OAuth** (already working)
- ⚡ **Magic Link** (passwordless email)
- 📧 **Email/Password** (traditional)

## 📞 **Support**

If you continue to have issues:

1. Check the browser console for detailed error messages
2. Verify all domains are authorized in Firebase
3. Test with different phone numbers
4. Check Firebase billing/quota limits

## 🔗 **Useful Links**

- [Firebase Phone Auth Documentation](https://firebase.google.com/docs/auth/web/phone-auth)
- [reCAPTCHA Setup Guide](https://developers.google.com/recaptcha/docs/v3)
- [Firebase Console](https://console.firebase.google.com/)
- [Google reCAPTCHA Console](https://www.google.com/recaptcha/admin)

---

**Note**: Phone authentication requires a paid Firebase plan (Blaze) for production use beyond the free tier limits.
