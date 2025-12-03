# GitHub Copilot Edit Issues - Troubleshooting Guide

## Quick Diagnostics (Run on Client's Laptop)

### 1. Verify VS Code & Extensions
Open VS Code and check:
- **Help → About** - Ensure VS Code version is 1.85+ (older versions have limited Chat edit support)
- **Extensions** - Must have BOTH installed and enabled:
  - `GitHub Copilot` (GitHub.copilot)
  - `GitHub Copilot Chat` (GitHub.copilot-chat)
- **Sign In** - Bottom left account icon → verify signed in with GitHub account that has Copilot license

### 2. Check Workspace Trust
⚠️ **MOST COMMON ISSUE** - VS Code won't allow edits in untrusted workspaces
- Look for "Restricted Mode" in status bar (bottom)
- If present: Click it → Select "Trust Folder and Enable All Features"
- Or: `Ctrl+Shift+P` → "Manage Workspace Trust" → Trust

### 3. Verify Copilot Settings
`Ctrl+,` (Settings) → Search for these and enable:
- `github.copilot.enable` - ✅ Checked
- `github.copilot.chat.enable` - ✅ Checked
- `Chat: Allow File Edits` or similar - ✅ Checked
- `Editor: Inline Suggest` → Enabled - ✅ Checked

### 4. Test Basic Functionality

**Test A - Inline Chat (Most Reliable)**
1. Open `src/App.tsx`
2. Click inside any function
3. Press `Ctrl+I` (or `Cmd+I` on Mac)
4. Type: "add a comment explaining this function"
5. Press Enter → Should show diff → Click Accept
   - ✅ Works? Copilot core is functional
   - ❌ Fails? See "Core Issues" section below

**Test B - Chat Panel**
1. Open Chat panel (Ctrl+Alt+I or click Chat icon)
2. Type: "in src/App.tsx, add a comment to the top of the file"
3. Should show a diff preview with Apply button
   - ✅ Works? All good
   - ❌ No Apply button? See "Chat Panel Issues" section

### 5. Check File Permissions
```powershell
# Run in PowerShell from project root
Get-Acl . | Format-List
# Ensure you have Modify/Write permissions
```

**If on Windows:**
- Right-click project folder → Properties → Uncheck "Read-only"
- If using OneDrive sync, disable "Files On-Demand" for this folder
- Windows Defender: Check if Controlled Folder Access is blocking VS Code
  - Settings → Update & Security → Windows Security → Virus & threat protection → Manage ransomware protection → Allow an app through Controlled folder access → Add VS Code

### 6. Check Network/Proxy
Corporate networks often block Copilot API calls.

**Required domains to allowlist:**
- `api.github.com`
- `api.githubcopilot.com`
- `*.githubusercontent.com`
- `github.com`

**Test connectivity:**
```powershell
# Run in PowerShell
Invoke-WebRequest -Uri https://api.githubcopilot.com/healthz -Method GET
# Should return 200 OK
```

**If behind proxy:**
- `Ctrl+,` → Search "Proxy" → Set `Http: Proxy` to your corporate proxy
- Or set system environment variables: `HTTP_PROXY`, `HTTPS_PROXY`

### 7. Check Copilot Logs
**View → Output → Select "GitHub Copilot Chat" from dropdown**

Look for errors like:
- `401 Unauthorized` → License/auth issue
- `403 Forbidden` → Org policy blocking
- `407 Proxy Authentication Required` → Proxy issue
- `Network error` → Firewall/connectivity
- `Feature disabled` → Org admin disabled Chat edits

### 8. Organization Policy Check
Some GitHub orgs disable Copilot Chat or specific features.

1. Go to https://github.com/settings/copilot
2. Check if "GitHub Copilot Chat" is enabled
3. If using GitHub Enterprise, ask admin if:
   - Copilot Chat is enabled for the org
   - Code suggestions and edits are allowed
   - Any content exclusions are blocking your repo

---

## Common Issues & Fixes

### Issue: "Apply" Button Missing in Chat
**Cause:** Old VS Code version or Chat not recognizing editable request

**Fix:**
1. Update VS Code to latest stable
2. Reload window: `Ctrl+Shift+P` → "Developer: Reload Window"
3. Rephrase prompt to be explicit:
   - ❌ "update the function"
   - ✅ "in src/App.tsx, replace the handleSubmit function with this code: [paste code]"

### Issue: Inline Chat Works, Chat Panel Doesn't
**Cause:** Settings difference or Chat panel permissions

**Fix:**
1. `Ctrl+,` → Search "Chat"
2. Enable all "Chat" related settings
3. Check "Files: Exclude" patterns aren't hiding your files
4. Try: `Ctrl+Shift+P` → "GitHub Copilot: Reset Chat"

### Issue: "This workspace is not trusted"
**Cause:** Security feature blocks code execution/edits

**Fix:**
- Click "Restricted Mode" badge in status bar
- Select "Trust Folder and Enable All Features"
- Reload window

### Issue: Changes Show but Don't Apply
**Cause:** File locked, read-only, or Git conflict

**Fix:**
```powershell
# Check if file is locked
Get-Item src\App.tsx | Select-Object IsReadOnly
# If True:
Set-ItemProperty src\App.tsx -Name IsReadOnly -Value $false
```

### Issue: "Copilot is not available"
**Cause:** License expired, not signed in, or org disabled

**Fix:**
1. Sign out and back in: Accounts → GitHub → Sign Out → Sign In
2. Check license: https://github.com/settings/copilot
3. If trial expired, purchase or ask org admin for license
4. Verify in Chat panel: Should show "GitHub Copilot is active"

### Issue: Works on Your Laptop, Not Client's
**Likely causes (in order):**
1. ✅ Workspace not trusted on client's machine
2. ✅ Different VS Code version (update to match yours)
3. ✅ Corporate proxy/firewall blocking API calls
4. ✅ Different GitHub account (no Copilot license)
5. ✅ Antivirus/security software blocking file writes
6. ✅ VS Code installed in restricted location (Program Files)

---

## Nuclear Option: Complete Reset

If nothing works, do this on client's laptop:

1. **Uninstall Copilot Extensions**
   - Extensions → GitHub Copilot → Uninstall
   - Extensions → GitHub Copilot Chat → Uninstall

2. **Clear VS Code Cache**
   ```powershell
   # Close VS Code first
   Remove-Item -Recurse -Force "$env:APPDATA\Code\User\globalStorage\github.copilot*"
   Remove-Item -Recurse -Force "$env:APPDATA\Code\Cache"
   ```

3. **Restart VS Code**
   - Open folder: File → Open Folder → Select project
   - Trust workspace when prompted

4. **Reinstall Extensions**
   - Install GitHub Copilot
   - Install GitHub Copilot Chat
   - Sign in with GitHub account

5. **Test Again**
   - `Ctrl+I` in any file → Type simple prompt
   - Should work now

---

## Automated Diagnostic Script

Run this on client's laptop to collect all diagnostic info:

Save as `copilot-diagnostics.ps1` and run: `.\copilot-diagnostics.ps1`

```powershell
# See copilot-diagnostics.ps1 file in project root
```

---

## Contact Points

If still not working after all steps:
1. Check VS Code Copilot GitHub issues: https://github.com/microsoft/vscode-copilot-release/issues
2. GitHub Support (if license issue): https://support.github.com
3. Share Copilot Chat logs (View → Output → GitHub Copilot Chat → Copy all)

---

## Environment Checklist

Compare your working setup vs client's:

| Item | Your Laptop | Client's Laptop |
|------|-------------|-----------------|
| VS Code Version | _______ | _______ |
| Copilot Extension | _______ | _______ |
| Copilot Chat Extension | _______ | _______ |
| Workspace Trusted? | Yes | _______ |
| GitHub Account | _______ | _______ |
| Copilot License Active? | Yes | _______ |
| Network/Proxy | _______ | _______ |
| Windows Version | _______ | _______ |
| Antivirus Software | _______ | _______ |

Fill this out to identify differences.
