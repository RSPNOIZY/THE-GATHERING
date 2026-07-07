# GABRIEL Cloudflare Tunnel Setup
# Run as Administrator in PowerShell

Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "  GABRIEL - Cloudflare Tunnel Setup" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host ""

# Check admin
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "ERROR: Run as Administrator!" -ForegroundColor Red
    exit 1
}

# Download cloudflared
Write-Host "[1/5] Downloading cloudflared..." -ForegroundColor Cyan
$msiPath = "$env:TEMP\cloudflared.msi"
Invoke-WebRequest -Uri "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.msi" -OutFile $msiPath

# Install
Write-Host "[2/5] Installing cloudflared..." -ForegroundColor Cyan
Start-Process msiexec.exe -ArgumentList "/i $msiPath /quiet" -Wait

# Verify
Write-Host "[3/5] Verifying installation..." -ForegroundColor Cyan
$cf = Get-Command cloudflared -ErrorAction SilentlyContinue
if (-not $cf) {
    Write-Host "ERROR: cloudflared not found. Add to PATH or reinstall." -ForegroundColor Red
    exit 1
}
cloudflared --version

# Create config directory
Write-Host "[4/5] Creating config directory..." -ForegroundColor Cyan
$configDir = "$env:USERPROFILE\.cloudflared"
if (-not (Test-Path $configDir)) {
    New-Item -ItemType Directory -Path $configDir | Out-Null
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  cloudflared installed!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Login to Cloudflare:" -ForegroundColor Cyan
Write-Host "   cloudflared tunnel login"
Write-Host ""
Write-Host "2. Create tunnel:" -ForegroundColor Cyan
Write-Host "   cloudflared tunnel create gabriel-tunnel"
Write-Host ""
Write-Host "3. Copy config.yml to $configDir" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Install as service:" -ForegroundColor Cyan
Write-Host "   cloudflared service install"
Write-Host "   net start cloudflared"
Write-Host ""
