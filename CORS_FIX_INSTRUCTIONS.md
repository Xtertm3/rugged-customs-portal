# Firebase Storage CORS Configuration Fix

## Problem
Firebase Storage is blocking file uploads from your Vercel domain due to CORS policy restrictions.

## Solution

### Option 1: Using Google Cloud CLI (Recommended)

1. **Install Google Cloud CLI** (if not already installed):
   - Download from: https://cloud.google.com/sdk/docs/install
   - Or use PowerShell: `(New-Object Net.WebClient).DownloadFile("https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe", "$env:Temp\GoogleCloudSDKInstaller.exe"); & $env:Temp\GoogleCloudSDKInstaller.exe`

2. **Login to Google Cloud**:
   ```powershell
   gcloud auth login
   ```

3. **Set your project**:
   ```powershell
   gcloud config set project rugged-customs-portal
   ```

4. **Apply the CORS configuration**:
   ```powershell
   gcloud storage buckets update gs://rugged-customs-portal.firebasestorage.app --cors-file=firebase-storage-cors.json
   ```

   Or if using gsutil:
   ```powershell
   gsutil cors set firebase-storage-cors.json gs://rugged-customs-portal.firebasestorage.app
   ```

### Option 2: Using Firebase Console

1. Go to: https://console.firebase.google.com/project/rugged-customs-portal/storage
2. Click on the "Rules" tab
3. Update the Storage Rules to allow public read/write (or authenticated users only)

### Option 3: Check Storage Security Rules

Your Firebase Storage security rules might also be blocking uploads. Go to Firebase Console > Storage > Rules and update:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null; // Allow authenticated users
    }
  }
}
```

## Current CORS Configuration

The `firebase-storage-cors.json` file allows:
- **Origins**: All domains (*)
- **Methods**: GET, POST, PUT, DELETE, OPTIONS
- **Max Age**: 3600 seconds (1 hour)

## After Applying

1. Wait 1-2 minutes for changes to propagate
2. Clear browser cache or use incognito mode
3. Test file upload on production site

## Verification

After applying CORS config, you should see successful uploads with URLs like:
```
https://firebasestorage.googleapis.com/v0/b/rugged-customs-portal.firebasestorage.app/o/sites%2F...
```

## Need More Restrictive CORS?

If you want to restrict to only your Vercel domain, update `firebase-storage-cors.json`:

```json
[
  {
    "origin": ["https://rugged-customs-portal.vercel.app"],
    "method": ["GET", "POST", "PUT", "DELETE"],
    "maxAgeSeconds": 3600,
    "responseHeader": ["Content-Type"]
  }
]
```

Then reapply the configuration.
