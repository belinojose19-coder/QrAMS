<#
scripts/gh-login.ps1

Helper script to ensure GitHub CLI is installed, install the VS Code GitHub extension
and launch the browser auth flow. Run locally and follow the browser prompts.

Usage:
  powershell -ExecutionPolicy Bypass -File .\scripts\gh-login.ps1

This script does NOT collect or store credentials.
#>

Write-Output "=== QrAMS GitHub sign-in helper ==="

# Check gh
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  Write-Output "GitHub CLI (gh) not found."
  if (Get-Command winget -ErrorAction SilentlyContinue) {
    Write-Output "Installing GitHub CLI via winget (may require admin)..."
    try {
      winget install --id GitHub.cli -e --accept-package-agreements --accept-source-agreements
    } catch {
      Write-Output "winget install failed or was cancelled. Please install GitHub CLI manually: https://cli.github.com/"
    }
  } else {
    Write-Output "winget not found. Please install GitHub CLI manually: https://cli.github.com/"
  }
} else {
  try { Write-Output "GitHub CLI found: $(gh --version | Select-Object -First 1)" } catch { Write-Output "gh found" }
}

# Try to install VS Code GitHub extension if code CLI is available
if (Get-Command code -ErrorAction SilentlyContinue) {
  Write-Output "Installing 'GitHub Pull Requests and Issues' extension into VS Code..."
  try {
    code --install-extension GitHub.vscode-pull-request-github --force
  } catch {
    Write-Output "Failed to install extension via 'code' CLI. You can install 'GitHub Pull Requests and Issues' from the Extensions view in VS Code."
  }
} else {
  Write-Output "VS Code 'code' CLI not found. To enable, in VS Code open Command Palette and run 'Shell Command: Install 'code' command in PATH' or add VS Code to PATH."
}

# Launch web login
if (Get-Command gh -ErrorAction SilentlyContinue) {
  Write-Output "Launching 'gh auth login --web' to authenticate. A browser window/tab will open; follow prompts."
  gh auth login --web
  Write-Output "Checking authentication status..."
  gh auth status || Write-Output "Run 'gh auth status' manually to verify."
} else {
  Write-Output "GitHub CLI not available. After installing it, run 'gh auth login --web' manually to authenticate."
}

Write-Output "\nAfter browser auth completes, open VS Code -> Accounts (bottom-left) -> 'Sign in to GitHub' to link VS Code."
Write-Output "Verify identity with: 'gh auth status' and 'git config --get user.email'"
Write-Output "=== Done ==="
