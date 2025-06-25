# Update script for Portfolio Note Generator service
$ErrorActionPreference = "Stop"

Write-Host "Updating portfolio-note-generator..." -ForegroundColor Green

# Define paths
$serverPath = "C:\PortfolioNoteGenerator"

# Verify we're in a Git repository
if (-not (Test-Path .git)) {
    Write-Host "Error: Not in a Git repository!" -ForegroundColor Red
    exit 1
}

# Ensure PM2 is installed globally
npm list -g pm2 > $null 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "PM2 not found, installing globally..." -ForegroundColor Yellow
    npm install -g pm2
}

# Stop the app in PM2 if running
pm2 stop note-generator
pm2 delete note-generator

# Pull latest code
git pull

# Install dependencies
npm install

# Start (or restart) the app with PM2
pm2 start src/app.js --name note-generator --env production

# Save the PM2 process list
pm2 save

# Set up PM2 to auto-start on boot (only needs to be run once, but is safe to include)
pm2 startup | Out-String | Invoke-Expression

Write-Host "Update complete. App is running under PM2 and will auto-restart on reboot." -ForegroundColor Green

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

# Stop any existing node processes on port 3002 only
Write-Host "Checking for existing processes on port 3002..."
$port3002Processes = netstat -ano | findstr ":3002" | findstr "LISTENING"
if ($port3002Processes) {
    $port3002Processes | ForEach-Object {
        $parts = $_ -split '\s+'
        $pid = $parts[-1]
        if ($pid -and $pid -ne "0") {
            $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
            if ($process -and $process.ProcessName -eq "node") {
                Write-Host "Stopping Node.js process on port 3002 (PID: $pid)..."
                Stop-Process -Id $pid -Force
                Start-Sleep -Seconds 1
            }
        }
    }
}

# Start the Node.js server in the background
Write-Host "Starting Node.js server on port 3002..."
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