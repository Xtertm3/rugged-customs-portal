# Vercel Environment Variables

Copy these to your Vercel project: Settings → Environment Variables

## Required Firebase Variables

```
VITE_FIREBASE_API_KEY=AIzaSyAK8iF7YLuoW6bJcyCge3-kznkqy2ZXzHA
VITE_FIREBASE_AUTH_DOMAIN=rugged-customs-portal.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=rugged-customs-portal
VITE_FIREBASE_STORAGE_BUCKET=rugged-customs-portal.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=664458948467
VITE_FIREBASE_APP_ID=1:664458948467:web:3f085dd0f493661a569f06
```

## Optional Variables

```
VITE_API_KEY=your_gemini_api_key_here
```

## How to Add in Vercel:

1. Go to https://vercel.com/dashboard
2. Select your project: `rugged-customs-portal`
3. Click **Settings** → **Environment Variables**
4. For each variable above:
   - Click **Add New**
   - Name: (e.g., `VITE_FIREBASE_API_KEY`)
   - Value: (paste the value)
   - Environment: Select **Production**, **Preview**, **Development**
   - Click **Save**
5. After adding all variables, redeploy:
   - Go to **Deployments** tab
   - Click ⋯ on latest deployment → **Redeploy**
   - Or push any change to GitHub for auto-deploy

## Verification:

After deployment, open browser console (F12) and check for:
- ✅ No Firebase config errors
- ✅ Firestore connection established
- ✅ Real-time listeners active

## Security Note:

These API keys are safe to expose in client-side code. Firebase security is handled by Firestore Security Rules, not by hiding the config.
