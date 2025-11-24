# Rugged Customs Portal - Convert to APK Guide

## Quick Summary
Your web app is now mobile-ready! Follow these steps to create an Android APK.

---

## METHOD 1: Using Capacitor (Recommended)

### Prerequisites
- Node.js installed ✓ (you already have this)
- Android Studio (download if needed from: https://developer.android.com/studio)

### Step-by-Step Instructions

#### 1. Install Capacitor
Open PowerShell in your project folder:

```powershell
cd "c:\Users\ANKIT TIWARI\Downloads\rugged-updated_ui"

# Install Capacitor packages
npm install @capacitor/core @capacitor/cli @capacitor/android
```

#### 2. Initialize Capacitor
```powershell
npx cap init "Rugged Customs Portal" com.ruggedcustoms.portal
```

When it asks for web asset directory, type: `dist`

#### 3. Add Android Platform
```powershell
npx cap add android
```

This creates an `android/` folder.

#### 4. Build Your Web App
```powershell
npm run build
```

#### 5. Copy Built Files to Android
```powershell
npx cap sync
```

#### 6. Open in Android Studio
```powershell
npx cap open android
```

**First time using Android Studio?**
- It will take 5-10 minutes to download SDK and dependencies
- Just wait for the sync to complete (check bottom status bar)

#### 7. Build APK
In Android Studio:
1. Wait for "Gradle sync" to finish (bottom status bar)
2. Click menu: **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
3. Wait 3-5 minutes
4. Click **locate** when build finishes
5. Your APK is in: `android/app/build/outputs/apk/debug/app-debug.apk`

#### 8. Install on Phone
- Copy the APK file to your phone
- Tap to install (enable "Install from Unknown Sources" if asked)
- Done! 🎉

---

## METHOD 2: Without Android Studio (Command Line)

If you can't/don't want to install Android Studio:

### Prerequisites
- Java JDK 17 (download from: https://www.oracle.com/java/technologies/downloads/)
- Android Command Line Tools

### Steps
After completing steps 1-5 from Method 1:

```powershell
cd android
.\gradlew assembleDebug
```

APK will be at: `android\app\build\outputs\apk\debug\app-debug.apk`

---

## METHOD 3: Online APK Builder (Easiest but Limited)

### Using PWABuilder (No installation needed!)

1. Make sure your app is deployed (it already is on Vercel)
2. Go to: https://www.pwabuilder.com/
3. Enter: `https://rugged-customs-portal.vercel.app`
4. Click "Start"
5. Wait for analysis
6. Click "Package For Stores"
7. Click "Android"
8. Click "Generate Package"
9. Download your APK

**Note:** This method wraps your website in an app shell. It works but has limitations.

---

## Making Updates After Creating APK

Whenever you change your code:

```powershell
# 1. Build web app
npm run build

# 2. Sync to Android
npx cap sync

# 3. Rebuild APK (in Android Studio or command line)
```

For PWABuilder method: Just redeploy to Vercel, no need to rebuild APK!

---

## Important Notes

### Your App Works With Internet
✅ Your app uses Firebase (cloud database)
✅ Users need internet connection to use it
✅ All data is stored in Firebase Firestore
✅ Multiple users can use the same app simultaneously
✅ Web and mobile apps share the same database

### Distribution

**Debug APK (for testing):**
- Can install on any Android phone
- Must enable "Install from Unknown Sources"
- Share via WhatsApp/Email/Google Drive

**Release APK (for Play Store):**
- Need to sign with a keystore
- Required for Google Play Store
- Better security

---

## Testing Checklist

After installing APK, test these:

- [ ] Login works
- [ ] Dashboard loads
- [ ] Can view sites
- [ ] Can take photos (camera permission)
- [ ] Can access location (GPS permission)
- [ ] Can submit payment requests
- [ ] Data syncs with web version
- [ ] Works on different screen sizes

---

## Troubleshooting

**Build Failed?**
- Make sure Java JDK is installed
- Run `npx cap doctor` to check setup

**APK Won't Install?**
- Enable "Install from Unknown Sources" in phone settings
- Make sure phone has enough space

**App Crashes?**
- Check Firebase keys are correct
- Make sure internet is connected
- Check browser console for errors

**Permissions Not Working?**
- Edit `android/app/src/main/AndroidManifest.xml`
- Add required permissions

---

## Next Steps

1. **Add App Icon:** Replace default Capacitor icon
2. **Add Splash Screen:** Customize loading screen
3. **Optimize Performance:** Enable offline caching
4. **Sign APK:** For production release
5. **Publish to Play Store:** For public distribution

---

## App Icon (Optional)

To add your custom icon:

1. Create icons in these sizes:
   - 192x192 px
   - 512x512 px

2. Place them in `public/` folder as:
   - `icon-192.png`
   - `icon-512.png`

3. Rebuild and sync

---

## Support

If you get stuck:
- Check Capacitor docs: https://capacitorjs.com/
- Check Android Studio logs
- Google the error message

---

## Summary

**Fastest:** PWABuilder (5 mins, limited features)
**Recommended:** Capacitor + Android Studio (30 mins, full control)
**Advanced:** Command line build (15 mins, requires Java)

All methods create a working APK that connects to your Firebase database!

---

Generated: November 21, 2025
Project: Rugged Customs Payment Portal
Version: 1.0.0
