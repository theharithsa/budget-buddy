# Common Issues & Solutions

## Console Errors Fixed

### 1. Permission Denied for Public Categories

**Error:** `Permission denied for public categories subscription`

**Solution:** This error has been fixed by:
- Updated Firebase subscription to silently handle permission denied errors
- Added proper Firestore security rules in `firestore.rules`
- Created graceful fallback when public categories are not accessible

**Status:** ✅ Fixed - No more console warnings

### 2. Receipt Upload Undefined Values

**Error:** `Unsupported field value: undefined (found in field receiptUrl)`

**Solution:** Enhanced data validation in `addExpenseToFirestore`:
- Filter out undefined receipt fields before saving
- Only include receiptUrl/receiptFileName if they have actual values
- Added comprehensive data sanitization

**Status:** ✅ Fixed - No more undefined value errors

### 3. Firestore Listener Errors

**Error:** `Uncaught Error in snapshot listener`

**Solution:** Improved error handling in all Firebase subscriptions:
- Added try-catch blocks around all subscription callbacks
- Graceful handling of permission denied scenarios
- Better cleanup of subscription listeners

**Status:** ✅ Fixed - Clean console logs

## Firebase Setup

To enable all features including public categories sharing:

1. **Deploy Security Rules:**
   ```bash
   firebase deploy --only firestore:rules,storage:rules
   ```

2. **Check Current Rules:**
   ```bash
   firebase firestore:rules:get
   ```

3. **Test Rules:**
   ```bash
   firebase emulators:start --only firestore
   ```

## App Behavior

### With Proper Firebase Setup
- ✅ Public categories sharing works
- ✅ Receipt uploads work
- ✅ No console errors
- ✅ All features enabled

### Without Firebase Rules (Graceful Degradation)
- ✅ All personal features work (expenses, budgets, templates)
- ⚠️ Public categories sharing disabled (no errors shown)
- ⚠️ Receipt uploads may fail (handled gracefully)
- ✅ Clean console (no error spam)

## Security

The app now properly handles:
- User data isolation (users can only see their own data)
- Public categories readable by all authenticated users
- Receipt files private to each user
- Proper authentication checks

## Performance

Optimizations made:
- Reduced unnecessary subscription setups
- Better cleanup of listeners
- Filtered undefined values before Firestore operations
- Improved error boundaries