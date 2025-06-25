# Update script for portfolio-note-generator with PM2
$ErrorActionPreference = "Stop"

Write-Host "Starting portfolio-note-generator update..." -ForegroundColor Green

# Check if Node.js and npm are available
try {
    $nodeVersion = node --version 2>$null
    $npmVersion = npm --version 2>$null
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Cyan
    Write-Host "npm version: $npmVersion" -ForegroundColor Cyan
} catch {
    Write-Host "Error: Node.js or npm not found in PATH!" -ForegroundColor Red
    Write-Host "Please ensure Node.js is properly installed and in your PATH." -ForegroundColor Red
    exit 1
}

# Try to install PM2 globally, but don't fail if it doesn't work
Write-Host "Checking for PM2 installation..." -ForegroundColor Yellow
$pm2Installed = $false

try {
    $pm2Check = pm2 --version 2>$null
    if ($pm2Check) {
        Write-Host "PM2 is already installed: $pm2Check" -ForegroundColor Green
        $pm2Installed = $true
    }
} catch {
    Write-Host "PM2 not found, attempting to install..." -ForegroundColor Yellow
}

if (-not $pm2Installed) {
    try {
        Write-Host "Installing PM2 globally..." -ForegroundColor Yellow
        npm install -g pm2
        $pm2Installed = $true
        Write-Host "PM2 installed successfully!" -ForegroundColor Green
    } catch {
        Write-Host "Warning: Failed to install PM2 globally. Continuing without PM2..." -ForegroundColor Yellow
        Write-Host "You may need to run: npm install -g pm2 (as administrator)" -ForegroundColor Yellow
    }
}

# Stop the app in PM2 if running and PM2 is available
if ($pm2Installed) {
    try {
        pm2 stop note-generator 2>$null
        pm2 delete note-generator 2>$null
        Write-Host "Stopped existing PM2 process" -ForegroundColor Yellow
    } catch {
        Write-Host "No existing PM2 process to stop" -ForegroundColor Yellow
    }
} else {
    # Fallback: stop any existing Node.js processes on port 3002
    Write-Host "Stopping any existing Node.js processes on port 3002..." -ForegroundColor Yellow
    $port3002Processes = netstat -ano | findstr ":3002" | findstr "LISTENING"
    if ($port3002Processes) {
        $port3002Processes | ForEach-Object {
            $parts = $_ -split '\s+'
            $pid = $parts[-1]
            if ($pid -and $pid -ne "0") {
                $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
                if ($process -and $process.ProcessName -eq "node") {
                    Write-Host "Stopping Node.js process on port 3002 (PID: $pid)..." -ForegroundColor Yellow
                    Stop-Process -Id $pid -Force
                    Start-Sleep -Seconds 1
                }
            }
        }
    }
}

# Pull latest code
Write-Host "Pulling latest changes from Git..." -ForegroundColor Yellow
git pull

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install

# Start the app
if ($pm2Installed) {
    Write-Host "Starting app with PM2..." -ForegroundColor Yellow
    pm2 start src/app.js --name note-generator --env production
    
    # Save the PM2 process list
    pm2 save
    
    # Set up PM2 to auto-start on boot (Windows-specific handling)
    Write-Host "Configuring PM2 startup..." -ForegroundColor Yellow
    try {
        $startupOutput = pm2 startup 2>&1
        if ($startupOutput -and $startupOutput.Trim() -ne "") {
            Write-Host "PM2 startup command output:" -ForegroundColor Cyan
            Write-Host $startupOutput -ForegroundColor White
            
            # Check if the output contains a command to run
            if ($startupOutput -match "Run this command to set up startup script") {
                Write-Host "`nIMPORTANT: You need to run the command above as Administrator to enable auto-start!" -ForegroundColor Yellow
            }
        } else {
            Write-Host "PM2 startup configured successfully!" -ForegroundColor Green
        }
    } catch {
        Write-Host "Note: PM2 startup configuration may need to be run manually" -ForegroundColor Yellow
        Write-Host "Try running: pm2 startup (as Administrator)" -ForegroundColor Yellow
    }
    
    Write-Host "`nUpdate complete! App is running under PM2." -ForegroundColor Green
    Write-Host "To enable auto-start on boot, run 'pm2 startup' as Administrator" -ForegroundColor Cyan
} else {
    Write-Host "Starting app without PM2 (manual mode)..." -ForegroundColor Yellow
    Start-Process "node" "src/app.js" -WorkingDirectory (Get-Location)
    Write-Host "`nUpdate complete! App started manually. Consider installing PM2 for auto-restart." -ForegroundColor Green
}

Write-Host "You can access the app at: http://kfg_server:3002" -ForegroundColor Cyan

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