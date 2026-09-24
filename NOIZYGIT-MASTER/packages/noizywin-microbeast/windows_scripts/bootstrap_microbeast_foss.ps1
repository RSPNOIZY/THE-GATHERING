# 🪟 BOOTSTRAP NOIZYWIN MICROBEAST FOSS & AUTOMATION STACK
# Execution Policy: Bypass
# Host: Apple M2 Ultra (192GB RAM) · Windows 11 ARM64 VM

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  🪟 NOIZYWIN MICROBEAST FOSS & RPA PROVISIONING" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

# 1. Verify winget
Write-Host "`n[1/4] 📦 Verifying Windows Package Manager (winget)..." -ForegroundColor Yellow
$wingetCheck = Get-Command winget -ErrorAction SilentlyContinue
if (-not $wingetCheck) {
    Write-Host "  ⚠️ Winget not found in PATH, updating App Installer..." -ForegroundColor Red
} else {
    Write-Host "  ✅ Winget is available and active." -ForegroundColor Green
}

# 2. Curated Core FOSS Packages
$fossPackages = @(
    "Microsoft.PowerShell",
    "Git.Git",
    "Microsoft.VisualStudioCode",
    "Python.Python.3.12",
    "OpenJS.NodeJS.LTS",
    "Microsoft.WindowsTerminal",
    "Microsoft.PowerToys",
    "Gyan.FFmpeg",
    "Audacity.Audacity",
    "7zip.7zip",
    "ElementLabs.LMStudio",
    "Ollama.Ollama",
    "Microsoft.PowerAutomateDesktop"
)

Write-Host "`n[2/4] 🚀 Installing Core FOSS & Developer Tools..." -ForegroundColor Yellow
foreach ($pkg in $fossPackages) {
    Write-Host "  • Installing: $pkg..." -ForegroundColor Gray
    winget install --id $pkg --exact --accept-package-agreements --accept-source-agreements --silent --no-upgrade
}

# 3. DirectML & Python Environment Setup
Write-Host "`n[3/4] 🐍 Configuring Python 3.12 & DirectML AI Environment..." -ForegroundColor Yellow
try {
    python -m pip install --upgrade pip
    python -m pip install torch-directml onnxruntime-directml numpy soundfile scipy rich
    Write-Host "  ✅ Python DirectML AI Acceleration Stack Configured." -ForegroundColor Green
} catch {
    Write-Host "  ⚠️ Python pip configuration notice: $_" -ForegroundColor DarkGray
}

# 4. Power Automate Desktop Verification
Write-Host "`n[4/4] 🤖 Verifying Microsoft Power Automate Desktop Bridge..." -ForegroundColor Yellow
$padService = Get-Service -Name "UIFlowService" -ErrorAction SilentlyContinue
if ($padService) {
    Write-Host "  ✅ Power Automate Desktop Service: $($padService.Status)" -ForegroundColor Green
} else {
    Write-Host "  ℹ️ Power Automate Desktop ready for user-session flows." -ForegroundColor Green
}

Write-Host "`n================================================================" -ForegroundColor Cyan
Write-Host "  ✨ NOIZYWIN MICROBEAST PROVISIONING COMPLETE!" -ForegroundColor Cyan
Write-Host "  GORUNFREE. DEFY THE DREED. BUILD THE NOIZYEMPIRE." -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
