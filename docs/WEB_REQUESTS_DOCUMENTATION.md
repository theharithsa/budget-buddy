# FinBuddy Web Requests Documentation

## Overview

This document outlines all incoming and outgoing web requests in the FinBuddy application, including their endpoints, payloads, headers, and response structures.

## Table of Contents

1. [Firebase Authentication API](#firebase-authentication-api)
2. [Firebase Firestore API](#firebase-firestore-api)
3. [Firebase Storage API](#firebase-storage-api)
4. [OpenAI API](#openai-api)
5. [Spark AI API](#spark-ai-api)
6. [Browser APIs](#browser-apis)

---

## Firebase Authentication API

### 1. Google OAuth Sign-In (Popup)

**Endpoint**: `https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp`
**Method**: `POST`
**Description**: Authenticate user via Google OAuth popup

**Request Headers**:
```json
{
  "Content-Type": "application/json",
  "X-Client-Version": "Firebase/9.x.x"
}
```

**Request Payload**:
```json
{
  "requestUri": "https://finbuddy-2025.firebaseapp.com",
  "returnSecureToken": true,
  "postBody": "access_token={access_token}&providerId=google.com",
  "returnIdpCredential": true
}
```

**Response Structure**:
```json
{
  "kind": "identitytoolkit#VerifyAssertionResponse",
  "localId": "user_uid_string",
  "email": "user@example.com",
  "displayName": "User Name",
  "idToken": "jwt_token_string",
  "refreshToken": "refresh_token_string",
  "expiresIn": "3600",
  "oauthAccessToken": "google_access_token",
  "photoUrl": "https://profile-photo-url.com"
}
```

### 2. Google OAuth Sign-In (Redirect)

**Endpoint**: `https://accounts.google.com/o/oauth2/v2/auth`
**Method**: `GET` (Browser redirect)
**Description**: Redirect user to Google OAuth consent screen

**Request Parameters**:
```
https://accounts.google.com/o/oauth2/v2/auth?
client_id=1080442347255-xxx.apps.googleusercontent.com&
redirect_uri=https://finbuddy-2025.firebaseapp.com/__/auth/handler&
response_type=code&
scope=openid%20email%20profile&
state=firebase_auth_state
```

### 3. Token Refresh

**Endpoint**: `https://securetoken.googleapis.com/v1/token`
**Method**: `POST`
**Description**: Refresh expired ID token

**Request Payload**:
```json
{
  "grant_type": "refresh_token",
  "refresh_token": "user_refresh_token"
}
```

**Response Structure**:
```json
{
  "access_token": "new_jwt_token",
  "expires_in": "3600",
  "token_type": "Bearer",
  "refresh_token": "new_refresh_token",
  "id_token": "new_id_token",
  "user_id": "user_uid",
  "project_id": "finbuddy-2025"
}
```

### 4. Sign Out

**Endpoint**: Local Firebase SDK call (no HTTP request)
**Method**: SDK Method
**Description**: Clear local authentication state

---

## Firebase Firestore API

### 1. Add Expense

**Endpoint**: `https://firestore.googleapis.com/v1/projects/finbuddy-2025/databases/(default)/documents/users/{userId}/expenses`
**Method**: `POST`
**Description**: Create a new expense document

**Request Headers**:
```json
{
  "Authorization": "Bearer {id_token}",
  "Content-Type": "application/json"
}
```

**Request Payload**:
```json
{
  "fields": {
    "amount": {
      "doubleValue": 1500.50
    },
    "category": {
      "stringValue": "Food & Dining"
    },
    "description": {
      "stringValue": "Lunch at restaurant"
    },
    "date": {
      "stringValue": "2025-08-20"
    },
    "createdAt": {
      "timestampValue": "2025-08-20T10:30:00.000Z"
    },
    "receiptUrl": {
      "stringValue": "https://firebasestorage.googleapis.com/..."
    },
    "receiptFileName": {
      "stringValue": "receipt_20250820_123456.jpg"
    }
  }
}
```

**Response Structure**:
```json
{
  "name": "projects/finbuddy-2025/databases/(default)/documents/users/{userId}/expenses/{documentId}",
  "fields": {
    "amount": { "doubleValue": 1500.50 },
    "category": { "stringValue": "Food & Dining" },
    "description": { "stringValue": "Lunch at restaurant" },
    "date": { "stringValue": "2025-08-20" },
    "createdAt": { "timestampValue": "2025-08-20T10:30:00.000Z" },
    "receiptUrl": { "stringValue": "https://firebasestorage.googleapis.com/..." },
    "receiptFileName": { "stringValue": "receipt_20250820_123456.jpg" }
  },
  "createTime": "2025-08-20T10:30:00.000Z",
  "updateTime": "2025-08-20T10:30:00.000Z"
}
```

### 2. Get Expenses

**Endpoint**: `https://firestore.googleapis.com/v1/projects/finbuddy-2025/databases/(default)/documents/users/{userId}/expenses`
**Method**: `GET`
**Description**: Retrieve all user expenses with ordering

**Request Headers**:
```json
{
  "Authorization": "Bearer {id_token}"
}
```

**Query Parameters**:
```
?orderBy=date desc&pageSize=100
```

**Response Structure**:
```json
{
  "documents": [
    {
      "name": "projects/finbuddy-2025/databases/(default)/documents/users/{userId}/expenses/{expenseId}",
      "fields": {
        "amount": { "doubleValue": 1500.50 },
        "category": { "stringValue": "Food & Dining" },
        "description": { "stringValue": "Lunch at restaurant" },
        "date": { "stringValue": "2025-08-20" },
        "createdAt": { "timestampValue": "2025-08-20T10:30:00.000Z" }
      },
      "createTime": "2025-08-20T10:30:00.000Z",
      "updateTime": "2025-08-20T10:30:00.000Z"
    }
  ]
}
```

### 3. Update Expense

**Endpoint**: `https://firestore.googleapis.com/v1/projects/finbuddy-2025/databases/(default)/documents/users/{userId}/expenses/{expenseId}`
**Method**: `PATCH`
**Description**: Update existing expense document

**Request Headers**:
```json
{
  "Authorization": "Bearer {id_token}",
  "Content-Type": "application/json"
}
```

**Request Payload**:
```json
{
  "fields": {
    "amount": {
      "doubleValue": 1750.75
    },
    "description": {
      "stringValue": "Updated description"
    }
  }
}
```

### 4. Delete Expense

**Endpoint**: `https://firestore.googleapis.com/v1/projects/finbuddy-2025/databases/(default)/documents/users/{userId}/expenses/{expenseId}`
**Method**: `DELETE`
**Description**: Delete expense document

**Request Headers**:
```json
{
  "Authorization": "Bearer {id_token}"
}
```

**Response**: `200 OK` (Empty body)

### 5. Add Budget

**Endpoint**: `https://firestore.googleapis.com/v1/projects/finbuddy-2025/databases/(default)/documents/users/{userId}/budgets`
**Method**: `POST`
**Description**: Create a new budget document

**Request Payload**:
```json
{
  "fields": {
    "category": {
      "stringValue": "Food & Dining"
    },
    "limit": {
      "doubleValue": 10000.00
    },
    "spent": {
      "doubleValue": 0.00
    }
  }
}
```

### 6. Update Budget

**Endpoint**: `https://firestore.googleapis.com/v1/projects/finbuddy-2025/databases/(default)/documents/users/{userId}/budgets/{budgetId}`
**Method**: `PATCH`
**Description**: Update budget limits and spent amounts

**Request Payload**:
```json
{
  "fields": {
    "limit": {
      "doubleValue": 12000.00
    },
    "spent": {
      "doubleValue": 8500.50
    }
  }
}
```

### 7. Add Recurring Template

**Endpoint**: `https://firestore.googleapis.com/v1/projects/finbuddy-2025/databases/(default)/documents/users/{userId}/templates`
**Method**: `POST`
**Description**: Create recurring expense template

**Request Payload**:
```json
{
  "fields": {
    "name": {
      "stringValue": "Monthly Rent"
    },
    "amount": {
      "doubleValue": 25000.00
    },
    "category": {
      "stringValue": "Housing"
    },
    "description": {
      "stringValue": "Monthly apartment rent"
    },
    "frequency": {
      "stringValue": "monthly"
    },
    "isDefault": {
      "booleanValue": false
    },
    "createdAt": {
      "timestampValue": "2025-08-20T10:30:00.000Z"
    }
  }
}
```

### 8. Add Custom Category

**Endpoint**: `https://firestore.googleapis.com/v1/projects/finbuddy-2025/databases/(default)/documents/customCategories`
**Method**: `POST`
**Description**: Create custom expense category

**Request Payload**:
```json
{
  "fields": {
    "name": {
      "stringValue": "Pet Care"
    },
    "color": {
      "stringValue": "#FF6B6B"
    },
    "icon": {
      "stringValue": "🐕"
    },
    "userId": {
      "stringValue": "user_uid_string"
    },
    "isPublic": {
      "booleanValue": false
    },
    "createdAt": {
      "timestampValue": "2025-08-20T10:30:00.000Z"
    },
    "createdBy": {
      "stringValue": "User Display Name"
    }
  }
}
```

### 9. Real-time Subscriptions

**Endpoint**: WebSocket connection to Firestore
**Protocol**: WebSocket
**Description**: Real-time updates for expenses and budgets

**Initial WebSocket Message**:
```json
{
  "listen": {
    "target": {
      "query": {
        "parent": "projects/finbuddy-2025/databases/(default)/documents/users/{userId}",
        "structuredQuery": {
          "from": [{"collectionId": "expenses"}],
          "orderBy": [{"field": {"fieldPath": "date"}, "direction": "DESCENDING"}]
        }
      },
      "targetId": 1
    }
  }
}
```

**Real-time Update Message**:
```json
{
  "targetChange": {
    "targetChangeType": "ADD",
    "targetIds": [1]
  }
}
```

---

## Firebase Storage API

### 1. Upload Receipt File

**Endpoint**: `https://firebasestorage.googleapis.com/v0/b/finbuddy-2025.appspot.com/o`
**Method**: `POST`
**Description**: Upload receipt image/PDF file

**Request Headers**:
```json
{
  "Authorization": "Bearer {id_token}",
  "Content-Type": "multipart/form-data"
}
```

**Form Data**:
```
name: receipts/{expenseId}_{timestamp}.{extension}
file: [Binary file data]
```

**Query Parameters**:
```
?uploadType=multipart&name=receipts/expense123_1692531000000.jpg
```

**Response Structure**:
```json
{
  "name": "receipts/expense123_1692531000000.jpg",
  "bucket": "finbuddy-2025.appspot.com",
  "generation": "1692531000000000",
  "metageneration": "1",
  "contentType": "image/jpeg",
  "timeCreated": "2025-08-20T10:30:00.000Z",
  "updated": "2025-08-20T10:30:00.000Z",
  "size": "245760",
  "md5Hash": "hash_string",
  "downloadTokens": "download_token_string"
}
```

### 2. Get Download URL

**Endpoint**: `https://firebasestorage.googleapis.com/v0/b/finbuddy-2025.appspot.com/o/{encodedFileName}`
**Method**: `GET`
**Description**: Get public download URL for uploaded file

**Query Parameters**:
```
?alt=media&token={download_token}
```

**Response**: Direct file download or redirect to signed URL

### 3. Delete Receipt File

**Endpoint**: `https://firebasestorage.googleapis.com/v0/b/finbuddy-2025.appspot.com/o/{encodedFileName}`
**Method**: `DELETE`
**Description**: Delete uploaded receipt file

**Request Headers**:
```json
{
  "Authorization": "Bearer {id_token}"
}
```

**Response**: `200 OK` (Empty body)

---

## OpenAI API

### 1. Budget Analysis Request

**Endpoint**: `https://api.openai.com/v1/chat/completions`
**Method**: `POST`
**Description**: Generate AI-powered budget analysis and recommendations

**Request Headers**:
```json
{
  "Authorization": "Bearer {openai_api_key}",
  "Content-Type": "application/json"
}
```

**Request Payload**:
```json
{
  "model": "gpt-4o",
  "messages": [
    {
      "role": "system",
      "content": "You are a professional financial advisor specialized in Indian market conditions. Provide detailed, actionable financial insights. Always respond with valid JSON only."
    },
    {
      "role": "user",
      "content": "Based on the following financial data, provide comprehensive budget analysis...\n\nExpenses:\n[{\"amount\":1500,\"category\":\"Food & Dining\",\"date\":\"2025-08-20\"}]\n\nBudgets:\n[{\"category\":\"Food & Dining\",\"limit\":10000,\"spent\":1500}]\n\nPlease analyze spending patterns, budget adherence, and provide actionable recommendations."
    }
  ],
  "response_format": { "type": "json_object" },
  "temperature": 0.7,
  "max_tokens": 2000
}
```

**Response Structure**:
```json
{
  "id": "chatcmpl-xxx",
  "object": "chat.completion",
  "created": 1692531000,
  "model": "gpt-4o",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "{\"overallScore\":75,\"insights\":[\"Your spending is well within budget limits\",\"Food expenses are reasonable for the month\"],\"recommendations\":[\"Consider setting aside more for savings\",\"Track daily food expenses more closely\"],\"categoryAnalysis\":[{\"category\":\"Food & Dining\",\"status\":\"healthy\",\"message\":\"15% of budget used\",\"percentage\":15}],\"monthlyTrend\":[{\"month\":\"August 2025\",\"spent\":1500,\"budget\":10000,\"difference\":8500}],\"topCategories\":[{\"category\":\"Food & Dining\",\"amount\":1500,\"percentage\":100}],\"savingsOpportunities\":[{\"category\":\"Food & Dining\",\"potentialSavings\":200,\"suggestion\":\"Cook more meals at home\"}],\"spendingPattern\":[{\"day\":\"Monday\",\"amount\":1500}]}"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 150,
    "completion_tokens": 200,
    "total_tokens": 350
  }
}
```

### 2. API Key Validation

**Endpoint**: `https://api.openai.com/v1/models`
**Method**: `GET`
**Description**: Validate OpenAI API key by listing available models

**Request Headers**:
```json
{
  "Authorization": "Bearer {openai_api_key}"
}
```

**Response Structure**:
```json
{
  "object": "list",
  "data": [
    {
      "id": "gpt-4o",
      "object": "model",
      "created": 1692531000,
      "owned_by": "openai"
    }
  ]
}
```

---

## Spark AI API

### 1. Budget Analysis via Spark LLM

**Endpoint**: Internal Spark AI API (GitHub Spark environment)
**Method**: Function call
**Description**: Use Spark's built-in LLM for budget analysis

**Function Call**:
```javascript
window.spark.llmPrompt(prompt, {
  model: 'gpt-4',
  temperature: 0.7,
  max_tokens: 2000
})
```

**Input Prompt**:
```text
Based on the following financial data, provide comprehensive budget analysis...

Expenses:
[{"amount":1500,"category":"Food & Dining","date":"2025-08-20"}]

Budgets:
[{"category":"Food & Dining","limit":10000,"spent":1500}]

Please analyze spending patterns, budget adherence, and provide actionable recommendations in JSON format.
```

**Response Structure**:
```json
{
  "overallScore": 75,
  "insights": ["Your spending is well within budget limits"],
  "recommendations": ["Consider setting aside more for savings"],
  "categoryAnalysis": [
    {
      "category": "Food & Dining",
      "status": "healthy",
      "message": "15% of budget used",
      "percentage": 15
    }
  ]
}
```

---

## Browser APIs

### 1. Local Storage

**Operations**: `localStorage.setItem()`, `localStorage.getItem()`
**Description**: Store user preferences and temporary data

**Stored Data**:
```json
{
  "finbuddy_theme": "dark",
  "finbuddy_last_analysis": "2025-08-20T10:30:00.000Z",
  "finbuddy_preferences": {
    "currency": "INR",
    "defaultCategory": "Food & Dining"
  }
}
```

### 2. IndexedDB

**Operations**: Browser database for offline data
**Description**: Cache expenses and budgets for offline access

**Database Schema**:
```javascript
// Object stores
expenses: {
  keyPath: "id",
  indexes: ["date", "category", "amount"]
}

budgets: {
  keyPath: "id", 
  indexes: ["category"]
}
```

### 3. File API

**Operations**: `FileReader`, file input handling
**Description**: Read receipt files before upload

**File Object Structure**:
```javascript
{
  name: "receipt.jpg",
  size: 245760,
  type: "image/jpeg",
  lastModified: 1692531000000
}
```

---

## Error Response Structures

### Firebase Errors

```json
{
  "error": {
    "code": 403,
    "message": "PERMISSION_DENIED: Missing or insufficient permissions.",
    "status": "PERMISSION_DENIED"
  }
}
```

### OpenAI Errors

```json
{
  "error": {
    "message": "You exceeded your current quota, please check your plan and billing details.",
    "type": "insufficient_quota",
    "param": null,
    "code": "insufficient_quota"
  }
}
```

### Network Errors

```json
{
  "error": {
    "message": "Network request failed",
    "code": "network_error",
    "details": "Failed to fetch"
  }
}
```

---

## Request Flow Diagrams

### Authentication Flow
1. User clicks "Sign in with Google"
2. App initiates popup/redirect to Google OAuth
3. User consents on Google's servers
4. Google redirects back with authorization code
5. Firebase exchanges code for tokens
6. App receives ID token and user info
7. All subsequent requests include ID token in Authorization header

### Expense Creation Flow
1. User fills expense form
2. If receipt attached: Upload file to Firebase Storage
3. Get download URL from Storage API
4. Create expense document in Firestore with receipt URL
5. Real-time listener updates UI immediately
6. Background sync ensures data consistency

### Budget Analysis Flow
1. User clicks "Analyze Budget"
2. App collects current expenses and budgets data
3. Format data into analysis prompt
4. Try OpenAI API first (if key available)
5. Fallback to Spark AI (if in Spark environment)
6. Final fallback to statistical analysis
7. Display results with charts and recommendations

This documentation covers all major web requests and data flows in the FinBuddy application, providing comprehensive payload structures for monitoring and debugging purposes.
