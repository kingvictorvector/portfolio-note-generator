# Update script for Portfolio Note Generator service
$ErrorActionPreference = "Stop"

Write-Host "Starting Portfolio Note Generator service update..."

# Define paths
$serverPath = "C:\PortfolioNoteGenerator"

# Verify we're in a Git repository
if (-not (Test-Path .git)) {
    Write-Host "Error: Not in a Git repository!" -ForegroundColor Red
    exit 1
}

# Pull latest changes
Write-Host "Pulling latest changes from Git..."
git fetch
git reset --hard origin/main

# Stop the service if it's running
$service = Get-Service -Name "PortfolioNoteGeneratorService" -ErrorAction SilentlyContinue
if ($service -and $service.Status -eq "Running") {
    Write-Host "Stopping PortfolioNoteGeneratorService..."
    Stop-Service -Name "PortfolioNoteGeneratorService" -Force
    Start-Sleep -Seconds 2
}

# Install dependencies
Write-Host "Installing dependencies..."
try {
    Push-Location $serverPath
    npm install --no-audit --no-fund
    Pop-Location
} catch {
    Write-Host "Warning: npm install failed - $_"
    Pop-Location
}

# Stop any existing node processes on port 3002
$existing = Get-Process node -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*node.exe" }
if ($existing) {
    $existing | Stop-Process -Force
}

# Start the Node.js server in the background
Start-Process "node" "src/app.js" -WorkingDirectory "C:\PortfolioNoteGenerator"
Write-Host "Node.js server started."

# Start the service
if ($service) {
    Write-Host "Starting PortfolioNoteGeneratorService..."
    Start-Service -Name "PortfolioNoteGeneratorService"
    Start-Sleep -Seconds 2
    
    # Verify service status
    $service = Get-Service -Name "PortfolioNoteGeneratorService"
    Write-Host "Service Status: $($service.Status)"
}

Write-Host "`nUpdate complete!"
Write-Host "You can access the service at:"
Write-Host "https://KFG_Server:3002/upload"
Write-Host "Note: HTTPS requires certificates to be installed on the server." 