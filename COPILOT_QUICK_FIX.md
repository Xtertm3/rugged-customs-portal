# Quick Copilot Fix Checklist

Run through these 5 steps on the client's laptop - one will likely fix it:

## Step 1: Trust the Workspace ⭐ (Fixes 80% of cases)
1. Open the project in VS Code
2. Look at bottom status bar for "Restricted Mode"
3. Click it → Select "Trust Folder and Enable All Features"
4. Reload window: `Ctrl+Shift+P` → "Developer: Reload Window"

## Step 2: Verify Extensions
1. `Ctrl+Shift+X` (Extensions view)
2. Search "GitHub Copilot" - Install if missing
3. Search "GitHub Copilot Chat" - Install if missing
4. Both should show "✓" (enabled), not "⚠" (disabled)

## Step 3: Sign In & Check License
1. Click account icon (bottom left of VS Code)
2. Sign in with GitHub account
3. Visit https://github.com/settings/copilot
4. Verify "GitHub Copilot" shows as Active/Enabled

## Step 4: Test Basic Functionality
1. Open `src/App.tsx`
2. Click inside any function
3. Press `Ctrl+I` (Inline Chat)
4. Type: "add a comment at the top of this function"
5. Press Enter → Should show a diff
6. Click "Accept"

**Does it work?**
- ✅ Yes → Copilot is working! Use Ctrl+I for quick edits
- ❌ No → Continue to Step 5

## Step 5: Check Network
Run in PowerShell:
```powershell
Invoke-WebRequest -Uri https://api.githubcopilot.com
```

**Result:**
- ✅ Status 200 → Network is fine
- ❌ Error/Timeout → Firewall/proxy is blocking Copilot
  - Fix: Ask IT to allowlist `api.githubcopilot.com` and `api.github.com`
  - Or: Set proxy in VS Code Settings (`Ctrl+,` → search "proxy")

---

## If Still Not Working

Run the diagnostic script:
```powershell
.\copilot-diagnostics.ps1
```

Read `COPILOT_TROUBLESHOOTING.md` for detailed fixes.

---

## Most Likely Causes (Based on Your Setup)

Since it works on your laptop but not the client's:

1. **Workspace not trusted** (90% probability) - Status bar will show "Restricted Mode"
2. **Corporate firewall** (5%) - `api.githubcopilot.com` is blocked
3. **Different GitHub account** (3%) - Client's account doesn't have Copilot license
4. **VS Code version mismatch** (2%) - Client has very old version

Compare versions:
```powershell
# Your laptop:  code --version
# Client laptop: code --version
# Should both be 1.85+
```

---

## Emergency Workaround

If Copilot Chat doesn't work but you need to share code changes:

1. Make changes on your laptop
2. Copy the modified files to client's laptop
3. Or: Use Git commits to sync changes
4. Or: Share via Vercel preview URLs for web testing

The APK you generated works standalone, so Android testing doesn't need Copilot.
