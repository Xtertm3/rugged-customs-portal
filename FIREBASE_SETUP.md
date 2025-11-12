# Firebase Setup Guide

## Overview
This application has been migrated from IndexedDB (local-only storage) to Firebase Firestore (cloud database with real-time sync). This enables team members added on one device to automatically appear on all other devices.

## Prerequisites
- A Google account
- Access to [Firebase Console](https://console.firebase.google.com)

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **"Add project"** or **"Create a project"**
3. Enter project name: `rugged-customs-portal` (or your preferred name)
4. Click **Continue**
5. Disable Google Analytics (optional, not needed for this app)
6. Click **Create project**
7. Wait for setup to complete, then click **Continue**

## Step 2: Register Web App

1. In Firebase Console, click the **web icon** (`</>`) to add a web app
2. Enter app nickname: `Rugged Customs Web App`
3. **Check** "Also set up Firebase Hosting" (optional)
4. Click **Register app**
5. You'll see Firebase configuration object - **COPY THESE VALUES**:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef"
   };
   ```
6. Click **Continue to console**

## Step 3: Enable Firestore Database

1. In left sidebar, click **Build** → **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (we'll secure it later)
4. Select Firestore location (closest to your users):
   - **asia-south1** (Mumbai, India) - recommended for Indian users
   - Or choose your preferred region
5. Click **Enable**
6. Wait for database to provision

## Step 4: Configure Security Rules (Important!)

1. In Firestore Database, click **Rules** tab
2. Replace default rules with production rules:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Allow read/write for all authenticated users
       // In production, add proper authentication
       match /{document=**} {
         allow read, write: if true; // TEMPORARY - secure this later!
       }
     }
   }
   ```
3. Click **Publish**

**⚠️ WARNING**: These rules allow anyone to read/write your database. For production, implement proper authentication or restrict to specific domains.

## Step 5: Update Local Environment

1. Open `.env.local` in your project root
2. Replace placeholder values with your Firebase config:
   ```env
   VITE_API_KEY=your_gemini_api_key_here
   
   VITE_FIREBASE_API_KEY=AIza...
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
   ```
3. Save the file

## Step 6: Deploy to Vercel with Firebase

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add each Firebase variable:
   - Name: `VITE_FIREBASE_API_KEY` → Value: `AIza...`
   - Name: `VITE_FIREBASE_AUTH_DOMAIN` → Value: `your-project.firebaseapp.com`
   - Name: `VITE_FIREBASE_PROJECT_ID` → Value: `your-project-id`
   - Name: `VITE_FIREBASE_STORAGE_BUCKET` → Value: `your-project.appspot.com`
   - Name: `VITE_FIREBASE_MESSAGING_SENDER_ID` → Value: `123456789`
   - Name: `VITE_FIREBASE_APP_ID` → Value: `1:123456789:web:abcdef`
   - (Optional) Name: `VITE_API_KEY` → Value: `your_gemini_api_key`
5. For each variable, select scope: **Production**, **Preview**, **Development**
6. Click **Save**

## Step 7: Redeploy

1. Push changes to GitHub:
   ```bash
   git add .
   git commit -m "Configure Firebase for production"
   git push origin main
   ```
2. Vercel will automatically redeploy with new environment variables
3. Wait for deployment to complete (~2-3 minutes)

## Step 8: Test Multi-Device Sync

### Test 1: Team Members Sync
1. Open app on **Desktop A**
2. Login as Admin
3. Add a team member (e.g., "John Doe")
4. Open app on **Desktop B** (or different browser)
5. Login as Admin
6. **✓ Verify**: "John Doe" appears automatically (no refresh needed)

### Test 2: Real-Time Updates
1. Keep both browsers open side-by-side
2. On Desktop A: Edit the team member's phone number
3. On Desktop B: Watch it update in real-time
4. **✓ Verify**: Changes appear within 1-2 seconds

### Test 3: Sites Sync
1. On Desktop A: Create a new site
2. On Desktop B: Check Projects page
3. **✓ Verify**: New site appears automatically

### Test 4: Payment Requests Sync
1. On Mobile: Submit a payment request
2. On Desktop: Check dashboard
3. **✓ Verify**: Request appears with status history

## Troubleshooting

### Issue: "Firebase config not found"
**Solution**: Ensure all `VITE_FIREBASE_*` variables are set in `.env.local` (local) and Vercel environment variables (production).

### Issue: "Permission denied" errors
**Solution**: Check Firestore Security Rules - ensure they allow read/write. In test mode, rules should be:
```javascript
allow read, write: if true;
```

### Issue: Data not syncing
**Solution**: 
1. Open browser console (F12)
2. Check for Firebase errors
3. Verify Firestore Database is created and enabled
4. Check network tab for failed requests

### Issue: Old local data still showing
**Solution**: 
1. Open DevTools → Application → IndexedDB
2. Delete `RuggedCustomsDB` database
3. Refresh page - data will now come from Firebase

## Data Migration

### Automatic Migration
- Default admin account is automatically created on first load
- No manual data migration needed for fresh deployments

### Manual Data Migration (if needed)
If you have existing data in IndexedDB that needs to be migrated:
1. Export data from IndexedDB using browser DevTools
2. Format as JSON
3. Use Firebase Console → Firestore Database → Import data
4. Or use Firebase Admin SDK to batch import

## Database Structure

### Collections Created:
- `teamMembers` - Team roster with roles and credentials
- `sites` - Project sites with materials and managers
- `paymentRequests` - Payment submissions with status history
- `inventory` - Inventory items per team member
- `materialUsageLogs` - Material usage tracking
- `transporters` - Transporter contacts
- `jobCards` - Job assignments with status

### Real-Time Listeners Active:
All collections have real-time listeners that automatically update the UI when data changes in Firestore.

## Cost Estimation

### Firebase Spark Plan (Free)
- **Firestore**: 50,000 reads/day, 20,000 writes/day, 1GB storage
- **Hosting**: 10GB storage, 360MB/day bandwidth
- **Estimated usage**: ~5,000 operations/day for 10-20 users
- **Cost**: $0/month ✅

### If you exceed free tier:
- Firestore pay-as-you-go: ~$0.06 per 100k reads
- Typical cost for 50 users: $5-10/month

## Security Recommendations (Production)

1. **Enable Firebase Authentication**:
   - Add Email/Password authentication
   - Require login before Firestore access
   
2. **Update Security Rules**:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

3. **Restrict API Key**:
   - Firebase Console → Project Settings → API Keys
   - Restrict to your Vercel domain

4. **Enable App Check**:
   - Prevents unauthorized access to your backend
   - Firebase Console → Build → App Check

## Support

For issues or questions:
1. Check Firebase Console → Firestore Database → Usage tab
2. Review browser console for error messages
3. Verify all environment variables are set correctly
4. Test with Firebase Emulator Suite (optional) for local development

## Next Steps

✅ Firebase setup complete
✅ Multi-device sync enabled
✅ Real-time updates active
🔜 Add Firebase Authentication (optional)
🔜 Implement proper security rules (recommended)
🔜 Set up Firebase Analytics (optional)
