# Run as Administrator!
Write-Host "Starting NOIZY HP-OMEN25L Setup..."

# 1. Install Chocolatey
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.WebClient]::new().DownloadString('https://chocolatey.org/install.ps1') | iex

# 2. Install Core Packages
choco install -y git python3 nodejs curl wget 7zip vscode nssm

# 3. Install Ollama and Tailscale
winget install Ollama.Ollama
winget install tailscale.tailscale
winget install Valve.Steam

# 4. Connect to Tailscale (using provided auth key)
Write-Host "Connecting to Tailscale mesh..."
tailscale up --auth-key=tskey-auth-k2rukGCJZ811CNTRL-Wog4vKdbBYUPSxaiqJ39YUaDmKsSbFjUe

# 5. Create NOIZY directory
New-Item -ItemType Directory -Force -Path C:\NOIZY
Copy-Item .\shirl.modelfile C:\NOIZY\
Copy-Item .\shirl_service.py C:\NOIZY\
Copy-Item .\alex.modelfile C:\NOIZY\
Copy-Item .\alex_service.py C:\NOIZY\

# 6. Build SHIRL Model
Write-Host "Pulling gemma2:9b and building SHIRL and ALEX WARD..."
ollama pull gemma2:9b
cd C:\NOIZY
ollama create noizy-family-keeper -f shirl.modelfile
ollama create noizy-alex-ward -f alex.modelfile

# 7. Install SHIRL as a Windows Service via NSSM
Write-Host "Installing SHIRL and ALEX Windows Services..."
nssm install SHIRL python C:\NOIZY\shirl_service.py
nssm set SHIRL AppDirectory C:\NOIZY
nssm set SHIRL Start SERVICE_AUTO_START
nssm start SHIRL

nssm install ALEX python C:\NOIZY\alex_service.py
nssm set ALEX AppDirectory C:\NOIZY
nssm set ALEX Start SERVICE_AUTO_START
nssm start ALEX

# 8. Setup Steam Auto-Start for SteamLink
# Add Steam to startup registry
$SteamPath = "C:\Program Files (x86)\Steam\steam.exe"
Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run" -Name "Steam" -Value "`"$SteamPath`" -silent"

Write-Host "Setup Complete. SHIRL is running on :9790. ALEX WARD is running on :9791."
Write-Host "Steam is installed. Please log in to Steam to enable Remote Play for SteamLink."
