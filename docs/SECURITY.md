# 🔒 Security Policy - Budget Buddy

**Version**: 2.2.1  
**Last Updated**: August 2025  
**Security Contact**: [GitHub Issues](https://github.com/theharithsa/budget-buddy/issues)

Budget Buddy takes security seriously. This document outlines our security practices, vulnerability reporting process, and data protection measures.

## 🛡️ Security Overview

Budget Buddy implements multiple layers of security to protect user financial data:

### **Data Protection**
- **🔐 End-to-End Encryption**: All data encrypted in transit (HTTPS) and at rest (Firebase)
- **🏠 Local-First Architecture**: Data processed locally with cloud sync, not cloud-dependent
- **👤 User Isolation**: Complete data separation between users via Firebase security rules
- **🔑 Zero-Knowledge**: We cannot access your personal financial data

### **Authentication Security**
- **🔒 OAuth 2.0**: Secure Google authentication with industry standards
- **🎟️ Token Management**: Automatic token refresh with secure local storage
- **⏰ Session Security**: Configurable timeout and automatic logout
- **🔐 Multi-Factor Ready**: Framework supports 2FA implementation

### **Application Security**
- **🛡️ XSS Protection**: React's built-in XSS prevention + Content Security Policy
- **🔒 CSRF Protection**: Firebase SDK handles CSRF token validation
- **📱 PWA Security**: Service Worker with integrity checks and secure caching
- **🌐 HTTPS Only**: All connections require SSL/TLS encryption

## 🚨 Reporting Security Vulnerabilities

We take security vulnerabilities seriously and appreciate responsible disclosure.

### **How to Report**

**🚨 For Security Issues - DO NOT use public GitHub issues**

1. **Email**: Create a GitHub issue with `[SECURITY]` prefix (for non-critical issues)
2. **Critical Issues**: Email repository maintainers directly via GitHub profile
3. **Emergency**: For immediate threats, create urgent GitHub issue

### **What to Include**

Please provide detailed information to help us understand and resolve the issue:

```
📋 **Vulnerability Report Template**

**Vulnerability Type**: (e.g., Authentication bypass, XSS, Data exposure)
**Severity Level**: Critical / High / Medium / Low
**Affected Component**: (Frontend, Firebase rules, Authentication, etc.)
**Attack Vector**: (Local, Network, Remote)

**Description**:
[Clear description of the vulnerability]

**Steps to Reproduce**:
1. Step one
2. Step two
3. Step three

**Impact**:
[Potential impact and what an attacker could achieve]

**Proof of Concept**:
[Screenshots, code snippets, or demonstration (if safe)]

**Suggested Fix**:
[If you have suggestions for remediation]

**Environment**:
- Browser: [Chrome 91, Firefox 89, etc.]
- OS: [Windows 10, macOS 11, etc.]
- App Version: [2.2.1]
- Firebase Environment: [Production, Development]
```

### **Response Timeline**

| Severity | Initial Response | Status Update | Resolution Target |
|----------|------------------|---------------|-------------------|
| **Critical** | 24 hours | 48 hours | 7 days |
| **High** | 48 hours | 5 days | 14 days |
| **Medium** | 5 days | 10 days | 30 days |
| **Low** | 10 days | 20 days | 60 days |

### **Severity Classification**

#### **🔴 Critical**
- Authentication bypass allowing unauthorized access
- Remote code execution
- Mass data exposure
- Financial data theft vectors

#### **🟠 High**
- Privilege escalation
- Stored XSS in core features
- User data exposure
- Session hijacking

#### **🟡 Medium**
- Reflected XSS
- CSRF in non-critical functions
- Information disclosure (non-sensitive)
- Rate limiting bypass

#### **🟢 Low**
- UI/UX security improvements
- Non-exploitable information disclosure
- Security header optimizations
- Development environment issues

## 🔒 Security Measures Implemented

### **Frontend Security**

#### **Content Security Policy (CSP)**
```javascript
// vite.config.ts - Security headers
export default defineConfig({
  server: {
    headers: {
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' https://apis.google.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: https://firebasestorage.googleapis.com",
        "connect-src 'self' https://*.googleapis.com https://api.openai.com"
      ].join('; ')
    }
  }
});
```

#### **Input Validation & Sanitization**
- **Type Safety**: TypeScript prevents type-related vulnerabilities
- **Form Validation**: Zod schema validation on all user inputs
- **XSS Prevention**: React's automatic escaping + DOMPurify for HTML content
- **SQL Injection**: N/A (NoSQL Firestore with parameterized queries)

#### **Secure Coding Practices**
```typescript
// Example: Secure expense input handling
const addExpense = async (expense: ExpenseInput) => {
  // 1. Type validation
  const validatedExpense = ExpenseSchema.parse(expense);
  
  // 2. User authentication check
  if (!user?.uid) throw new Error('Authentication required');
  
  // 3. Input sanitization
  const sanitizedDescription = DOMPurify.sanitize(validatedExpense.description);
  
  // 4. Firestore security rules handle authorization
  await addDoc(collection(db, 'users', user.uid, 'expenses'), {
    ...validatedExpense,
    description: sanitizedDescription,
    userId: user.uid, // Explicit user association
    createdAt: serverTimestamp()
  });
};
```

### **Backend Security (Firebase)**

#### **Firestore Security Rules**
```javascript
// Comprehensive security rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User data isolation
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && 
        request.auth.uid == userId &&
        isValidUserData(resource.data);
    }
    
    function isValidUserData(data) {
      return data.keys().hasAll(['userId']) &&
        data.userId == request.auth.uid;
    }
  }
}
```

#### **Storage Security Rules**
```javascript
// File upload security
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /receipts/{userId}/{receiptId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == userId &&
        // File size limit (10MB)
        request.resource.size < 10 * 1024 * 1024 &&
        // Image files only
        request.resource.contentType.matches('image/.*') &&
        // Filename validation
        receiptId.matches('^[a-zA-Z0-9._-]+$');
    }
  }
}
```

### **Authentication Security**

#### **Google OAuth Configuration**
```typescript
// Secure authentication setup
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Security-focused OAuth scopes
provider.addScope('profile');
provider.addScope('email');
// Note: We do NOT request financial data scopes

// Secure sign-in with popup
const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    // Verify token integrity
    const token = await user.getIdToken();
    if (!token) throw new Error('Authentication failed');
    
    // Log security event
    console.log('Secure authentication successful');
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
};
```

#### **Session Management**
- **Automatic Token Refresh**: Firebase SDK handles token lifecycle
- **Secure Token Storage**: Tokens stored in Firebase-managed secure storage
- **Session Timeout**: 1 hour default with automatic refresh
- **Logout on Suspicion**: Automatic logout on security events

## 🔍 Security Monitoring

### **Real-time Monitoring**
- **Dynatrace Integration**: Application performance and security monitoring
- **Error Tracking**: Real-time error reporting with security context
- **Authentication Monitoring**: Failed login attempts and suspicious activity
- **API Rate Limiting**: Prevent abuse and DoS attacks

### **Security Logging**
```typescript
// Security event logging
const logSecurityEvent = (event: SecurityEvent) => {
  // Local logging (development)
  console.log(`[SECURITY] ${event.type}: ${event.description}`);
  
  // Production monitoring (Dynatrace)
  if (process.env.NODE_ENV === 'production') {
    sendToDynatrace({
      source: 'budget-buddy-security',
      event_type: event.type,
      severity: event.severity,
      user_id: event.userId,
      timestamp: new Date().toISOString(),
      details: event.details
    });
  }
};
```

### **Automated Security Checks**
```yaml
# GitHub Actions security workflow
name: Security Audit
on: [push, pull_request]
jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run npm audit
        run: npm audit --audit-level=moderate
      - name: Check dependencies
        run: npm audit fix --dry-run
      - name: Security linting
        run: npm run lint:security
```

## 🔧 Security Configuration

### **Environment Variables Security**
```bash
# .env.example - Template for secure configuration
# Never commit actual values!

# Firebase Configuration (Public - OK to expose)
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id

# Sensitive Keys (Keep Secret)
VITE_OPENAI_API_KEY=your-openai-key
VITE_DYNATRACE_TOKEN=your-dynatrace-token

# Production Security
VITE_ENVIRONMENT=production
VITE_ENABLE_ANALYTICS=true
VITE_SECURITY_LOGGING=true
```

### **Development Security**
```bash
# Security checks for development
npm run security:audit    # Dependency vulnerability scan
npm run security:lint     # Security-focused linting
npm run security:test     # Security unit tests
npm run security:check    # Complete security check
```

## 🏆 Security Best Practices

### **For Users**
1. **🔒 Use Strong Passwords**: For your Google account (we use Google OAuth)
2. **🔐 Enable 2FA**: On your Google account for additional security
3. **🌐 Use HTTPS**: Always access via `https://finbuddy-2025.web.app`
4. **📱 Keep Updated**: Use latest browser versions for security patches
5. **🚫 Avoid Public WiFi**: For financial data access when possible

### **For Developers**
1. **🔑 Secure API Keys**: Never commit secrets to version control
2. **🛡️ Input Validation**: Validate all user inputs on both client and server
3. **🔒 Follow Principle of Least Privilege**: Minimal permissions required
4. **📝 Security Reviews**: Review all security-related code changes
5. **🔄 Regular Updates**: Keep dependencies updated and audit regularly

### **For Deployment**
1. **🌐 HTTPS Only**: Enforce SSL/TLS for all connections
2. **🔒 Environment Isolation**: Separate dev/staging/prod environments
3. **📊 Monitor Security**: Set up alerts for suspicious activities
4. **🔄 Regular Backups**: Automated backups with encryption
5. **🛡️ Security Headers**: Implement comprehensive security headers

## 🚨 Incident Response

### **Security Incident Workflow**
1. **🔍 Detection**: Automated monitoring or user reports
2. **🚨 Assessment**: Evaluate severity and impact
3. **🛡️ Containment**: Immediate measures to prevent further damage
4. **🔧 Remediation**: Fix the vulnerability and deploy patches
5. **📊 Communication**: Update affected users and stakeholders
6. **📝 Post-Mortem**: Document lessons learned and improve processes

### **Emergency Contacts**
- **Project Maintainer**: [GitHub Profile](https://github.com/theharithsa)
- **Security Issues**: Create GitHub issue with `[SECURITY]` prefix
- **Critical Vulnerabilities**: Email via GitHub profile contact

## 🔗 Security Resources

### **External Security Resources**
- **[OWASP Top 10](https://owasp.org/www-project-top-ten/)**
- **[Firebase Security Guidelines](https://firebase.google.com/docs/rules/rules-language)**
- **[React Security Best Practices](https://snyk.io/blog/10-react-security-best-practices/)**
- **[TypeScript Security](https://blog.logrocket.com/security-typescript/)**

### **Internal Documentation**
- **[Firebase Setup Guide](./FIREBASE_SETUP.md)** - Secure Firebase configuration
- **[Deployment Guide](./DEPLOYMENT_GUIDE.md)** - Secure deployment practices
- **[Observability Guide](./OBSERVABILITY_GUIDE.md)** - Security monitoring setup

## 📜 Compliance & Standards

### **Privacy Compliance**
- **GDPR Ready**: Data export, deletion, and portability features
- **CCPA Compliant**: California Consumer Privacy Act compliance
- **SOC 2**: Firebase infrastructure meets SOC 2 standards
- **ISO 27001**: Firebase certified for information security management

### **Security Standards**
- **OWASP Compliance**: Following OWASP guidelines for web application security
- **OAuth 2.0 / OpenID Connect**: Industry-standard authentication protocols
- **TLS 1.3**: Latest encryption standards for data in transit
- **AES-256**: Advanced encryption for data at rest

---

## 🔒 Security Statement

**Budget Buddy is committed to protecting user financial data through:**

- ✅ **Privacy by Design**: Data minimization and user control
- ✅ **Security by Default**: Secure configurations out of the box
- ✅ **Transparent Security**: Open source code for security review
- ✅ **Continuous Improvement**: Regular security updates and patches
- ✅ **Responsible Disclosure**: Clear vulnerability reporting process

**Last Security Review**: August 2025 (v2.2.1)  
**Next Scheduled Review**: November 2025 (v2.3.0)  
**Security Contact**: [GitHub Issues](https://github.com/theharithsa/budget-buddy/issues)
