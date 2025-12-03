#!/usr/bin/env pwsh
# Copilot Diagnostics Script
# Run this on the client's laptop to diagnose Copilot edit issues
# Usage: .\copilot-diagnostics.ps1

Write-Host "`n=== GitHub Copilot Diagnostics ===" -ForegroundColor Cyan
Write-Host "Collecting information...`n" -ForegroundColor Cyan

# 1. VS Code Version
Write-Host "[1/10] Checking VS Code..." -ForegroundColor Yellow
try {
    $vscodeVersion = & code --version 2>&1
    Write-Host "✓ VS Code installed" -ForegroundColor Green
    Write-Host "  Version: $($vscodeVersion[0])" -ForegroundColor Gray
} catch {
    Write-Host "✗ VS Code not found in PATH" -ForegroundColor Red
    Write-Host "  Install: https://code.visualstudio.com/" -ForegroundColor Gray
}

# 2. Extensions
Write-Host "`n[2/10] Checking Copilot Extensions..." -ForegroundColor Yellow
try {
    $extensions = & code --list-extensions 2>&1
    $hasCopilot = $extensions -match "GitHub.copilot$"
    $hasCopilotChat = $extensions -match "GitHub.copilot-chat"
    
    if ($hasCopilot) {
        Write-Host "✓ GitHub Copilot extension installed" -ForegroundColor Green
    } else {
        Write-Host "✗ GitHub Copilot extension NOT installed" -ForegroundColor Red
        Write-Host "  Install: code --install-extension GitHub.copilot" -ForegroundColor Gray
    }
    
    if ($hasCopilotChat) {
        Write-Host "✓ GitHub Copilot Chat extension installed" -ForegroundColor Green
    } else {
        Write-Host "✗ GitHub Copilot Chat extension NOT installed" -ForegroundColor Red
        Write-Host "  Install: code --install-extension GitHub.copilot-chat" -ForegroundColor Gray
    }
} catch {
    Write-Host "✗ Could not list extensions" -ForegroundColor Red
}

# 3. Workspace Trust
Write-Host "`n[3/10] Checking Workspace Trust..." -ForegroundColor Yellow
$workspacePath = Get-Location
Write-Host "  Current workspace: $workspacePath" -ForegroundColor Gray
Write-Host "  ⚠ Verify in VS Code: Look for 'Restricted Mode' in status bar" -ForegroundColor Yellow
Write-Host "  If restricted, click it and select 'Trust Folder'" -ForegroundColor Gray

# 4. File Permissions
Write-Host "`n[4/10] Checking File Permissions..." -ForegroundColor Yellow
try {
    $testFile = "src\App.tsx"
    if (Test-Path $testFile) {
        $acl = Get-Acl $testFile
        $isReadOnly = (Get-Item $testFile).IsReadOnly
        if ($isReadOnly) {
            Write-Host "✗ File is READ-ONLY" -ForegroundColor Red
            Write-Host "  Fix: Set-ItemProperty $testFile -Name IsReadOnly -Value `$false" -ForegroundColor Gray
        } else {
            Write-Host "✓ File is writable" -ForegroundColor Green
        }
    } else {
        Write-Host "⚠ Test file not found: $testFile" -ForegroundColor Yellow
    }
} catch {
    Write-Host "✗ Could not check permissions" -ForegroundColor Red
}

# 5. Network Connectivity
Write-Host "`n[5/10] Checking GitHub Copilot API..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://api.github.com" -Method GET -TimeoutSec 5 -UseBasicParsing
    Write-Host "✓ Can reach api.github.com (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "✗ Cannot reach api.github.com" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Gray
    Write-Host "  Check firewall/proxy settings" -ForegroundColor Gray
}

try {
    $response = Invoke-WebRequest -Uri "https://api.githubcopilot.com" -Method GET -TimeoutSec 5 -UseBasicParsing
    Write-Host "✓ Can reach api.githubcopilot.com (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "✗ Cannot reach api.githubcopilot.com" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Gray
    Write-Host "  THIS IS CRITICAL - Copilot won't work without this" -ForegroundColor Red
}

# 6. Proxy Settings
Write-Host "`n[6/10] Checking Proxy Configuration..." -ForegroundColor Yellow
$httpProxy = [System.Environment]::GetEnvironmentVariable("HTTP_PROXY")
$httpsProxy = [System.Environment]::GetEnvironmentVariable("HTTPS_PROXY")
if ($httpProxy -or $httpsProxy) {
    Write-Host "⚠ Proxy detected:" -ForegroundColor Yellow
    if ($httpProxy) { Write-Host "  HTTP_PROXY: $httpProxy" -ForegroundColor Gray }
    if ($httpsProxy) { Write-Host "  HTTPS_PROXY: $httpsProxy" -ForegroundColor Gray }
    Write-Host "  Ensure VS Code proxy settings match (Ctrl+, → search 'proxy')" -ForegroundColor Gray
} else {
    Write-Host "✓ No proxy environment variables set" -ForegroundColor Green
}

# 7. Windows Defender / Controlled Folder Access
Write-Host "`n[7/10] Checking Windows Security..." -ForegroundColor Yellow
try {
    $defender = Get-MpPreference -ErrorAction SilentlyContinue
    if ($defender.EnableControlledFolderAccess -eq 1) {
        Write-Host "⚠ Controlled Folder Access is ENABLED" -ForegroundColor Yellow
        Write-Host "  This may block VS Code from writing files" -ForegroundColor Gray
        Write-Host "  Fix: Windows Security → Virus & threat protection → Manage ransomware protection" -ForegroundColor Gray
        Write-Host "       → Allow an app → Add VS Code (Code.exe)" -ForegroundColor Gray
    } else {
        Write-Host "✓ Controlled Folder Access is disabled" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠ Could not check Windows Defender settings" -ForegroundColor Yellow
}

# 8. OneDrive/Cloud Sync
Write-Host "`n[8/10] Checking Cloud Sync..." -ForegroundColor Yellow
$currentPath = (Get-Location).Path
if ($currentPath -match "OneDrive" -or $currentPath -match "Dropbox" -or $currentPath -match "Google Drive") {
    Write-Host "⚠ Project is in a cloud-synced folder: $currentPath" -ForegroundColor Yellow
    Write-Host "  This can cause file write delays or conflicts" -ForegroundColor Gray
    Write-Host "  Recommendation: Move project to a local folder (e.g., C:\Dev\rugged-updated_ui)" -ForegroundColor Gray
} else {
    Write-Host "✓ Project is in a local folder" -ForegroundColor Green
}

# 9. Git Status
Write-Host "`n[9/10] Checking Git..." -ForegroundColor Yellow
try {
    $gitVersion = & git --version 2>&1
    Write-Host "✓ Git installed: $gitVersion" -ForegroundColor Green
    
    $gitStatus = & git status --short 2>&1
    if ($gitStatus -match "fatal") {
        Write-Host "⚠ Not a git repository" -ForegroundColor Yellow
    } else {
        Write-Host "✓ Git repository detected" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ Git not found" -ForegroundColor Red
}

# 10. Node/npm
Write-Host "`n[10/10] Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = & node -v 2>&1
    $npmVersion = & npm -v 2>&1
    Write-Host "✓ Node.js: $nodeVersion" -ForegroundColor Green
    Write-Host "✓ npm: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not found" -ForegroundColor Red
}

# Summary & Next Steps
Write-Host "`n=== Summary ===" -ForegroundColor Cyan
Write-Host @"

If any items above show ✗ or ⚠, address them first.

Most Common Fixes (in order):
1. Trust workspace in VS Code (click 'Restricted Mode' in status bar)
2. Install both Copilot extensions (Copilot + Copilot Chat)
3. Sign in to GitHub in VS Code (bottom left account icon)
4. Verify Copilot license is active: https://github.com/settings/copilot
5. Check network/firewall allows api.githubcopilot.com
6. Update VS Code to latest version

Quick Test:
1. Open src/App.tsx in VS Code
2. Press Ctrl+I (Inline Chat)
3. Type: 'add a comment'
4. Press Enter and click Accept
   - If this works, Copilot is functional
   - If not, share the output of this script

For detailed troubleshooting, see: COPILOT_TROUBLESHOOTING.md

"@ -ForegroundColor Gray

Write-Host "`nDiagnostics complete!" -ForegroundColor Cyan
Write-Host "Share this output with support if issues persist.`n" -ForegroundColor Gray
