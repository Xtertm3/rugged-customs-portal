# Firebase Database Connection Error - Troubleshooting Guide

## Current Error
"Could not connect to cloud database. Please check your internet connection."

## Root Causes

### 1. Firestore Security Rules (Most Likely)
Firebase Firestore requires security rules to be configured. By default, they are in **test mode** which expires after 30 days.

**Fix:**
1. Go to: https://console.firebase.google.com/project/rugged-customs-portal/firestore/rules
2. Copy the contents from `firestore.rules` in this project
3. Paste and click **Publish**

**Quick Fix (Allow All Access):**
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### 2. Missing Environment Variables on Vercel
Vercel needs the Firebase configuration environment variables.

**Check:**
1. Go to: https://vercel.com/ankits-projects-be2fc772/rugged-customs-portal/settings/environment-variables
2. Verify these variables exist:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`

### 3. Firebase Project Configuration
The Firebase project might have been modified or deleted.

**Verify:**
1. Go to: https://console.firebase.google.com/
2. Check that `rugged-customs-portal` project exists
3. Verify Firestore Database is enabled
4. Check that Firebase Storage is enabled

## Debugging Steps

### Step 1: Check Browser Console
Open browser DevTools (F12) and look for:
- `=== FIREBASE INITIALIZATION START ===`
- Check if `Firebase config check:` shows all `true` values
- Look for specific error messages after `=== FIREBASE INITIALIZATION FAILED ===`

### Step 2: Common Error Messages

| Error Message | Solution |
|---------------|----------|
| `Missing or insufficient permissions` | Update Firestore security rules |
| `PERMISSION_DENIED` | Update Firestore security rules |
| `Network error` | Check internet connection or Firebase project status |
| `Project not found` | Verify VITE_FIREBASE_PROJECT_ID is correct |
| `Invalid API key` | Verify VITE_FIREBASE_API_KEY is correct |

### Step 3: Test Locally
1. Open project folder in terminal
2. Run: `npm run dev`
3. Check if error occurs locally or only on Vercel
4. If works locally but not on Vercel → Environment variables issue
5. If fails locally → Firestore rules or Firebase config issue

## Quick Fixes

### Fix 1: Update Firestore Rules (FASTEST)
```powershell
# Go to Firebase Console manually
Start-Process "https://console.firebase.google.com/project/rugged-customs-portal/firestore/rules"
```
Then paste the rules from `firestore.rules` file.

### Fix 2: Verify Environment Variables
```powershell
# Check local env file
Get-Content .env.local
```

All variables should have values (not empty).

### Fix 3: Redeploy with Logs
```powershell
# Deploy and watch for errors
vercel --prod --debug
```

## Expected Console Output (Success)

When working correctly, you should see:
```
=== FIREBASE INITIALIZATION START ===
Firebase config check: { hasApiKey: true, hasAuthDomain: true, ... }
Initializing default admin...
Default admin initialized successfully
```

## Expected Console Output (Failure)

When failing, you'll see:
```
=== FIREBASE INITIALIZATION FAILED ===
Error details: [Error Object]
Error message: [Specific Error]
```

The specific error message will tell you exactly what's wrong.

## Still Not Working?

1. Share the console error messages from browser DevTools
2. Verify Firebase project exists and is active
3. Check Firebase billing status (free tier limits might be exceeded)
4. Try creating a new Firebase project and updating environment variables
