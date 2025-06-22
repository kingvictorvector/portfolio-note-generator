# Server Setup Guide for Portfolio Note Generator

## Prerequisites
- Windows 11 Pro server (KFG_Server)
- Node.js installed
- Git installed
- PowerShell (run as Administrator)

## Step 1: Generate Self-Signed Certificate

Run these commands **on KFG_Server** in PowerShell as Administrator:

```powershell
# Create certificates directory
New-Item -ItemType Directory -Path "C:\certs" -Force

# Generate self-signed certificate
New-SelfSignedCertificate -DnsName "kfg_server" -CertStoreLocation "cert:\LocalMachine\My" -NotAfter (Get-Date).AddYears(1) -FriendlyName "KFG Server HTTPS"

# Export certificate to files
$cert = Get-ChildItem -Path "cert:\LocalMachine\My" | Where-Object {$_.Subject -eq "CN=kfg_server"}
$cert | Export-Certificate -FilePath "C:\certs\server.crt"
$cert | Export-PfxCertificate -FilePath "C:\certs\server.pfx" -Password (ConvertTo-SecureString -String "YourPassword123!" -Force -AsPlainText)
```

## Step 2: Clone Repository

```powershell
# Navigate to C: drive
cd C:\

# Clone the repository
git clone https://github.com/kingvictorvector/portfolio-note-generator.git PortfolioNoteGenerator

# Navigate to project
cd PortfolioNoteGenerator

# Install dependencies
npm install
```

## Step 3: Create Environment File

Create `C:\PortfolioNoteGenerator\.env`:

```env
DB_HOST=KFG_Server
DB_INSTANCE=SQLEXPRESS
DB_NAME=KingVVApp
DB_USER=KingVictorVector
DB_PASSWORD=your_server_password
PORT=3002
NODE_ENV=production
CERT_PATH=C:\certs\server.pfx
CERT_PASSWORD=YourPassword123!
```

## Step 4: Test the Application

```powershell
# Start the application
node src/app.js
```

You should see:
```
HTTPS Server is running on port 3002
Access at: https://kfg_server:3002
```

## Step 5: Create Windows Service (Optional)

If you want to run as a Windows service:

```powershell
# Install node-windows globally
npm install -g node-windows

# Create service script
node-windows install --name "PortfolioNoteGeneratorService" --description "Portfolio Note Generator" --script "C:\PortfolioNoteGenerator\src\app.js" --nodeOptions "--max-old-space-size=4096"
```

## Step 6: Update Workflow

### On Development Machine:
1. Make changes to code
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin main
   ```

### On Server:
1. Run the update script:
   ```powershell
   cd C:\PortfolioNoteGenerator
   .\update.ps1
   ```

## Access URLs

- **Portfolio Note Generator**: `https://kfg_server:3002/upload`
- **CRM Pop Tool**: `https://kfg_server:3001` (after updating that project too)

## Troubleshooting

### Certificate Issues
- If browsers show certificate warnings, install the certificate on client machines:
  ```powershell
  # Export certificate for client installation
  $cert | Export-Certificate -FilePath "C:\certs\client.cer"
  ```
- Copy `client.cer` to client machines and double-click to install

### Port Issues
- Ensure Windows Firewall allows traffic on ports 3001 and 3002
- Check that no other services are using these ports

### Service Issues
- Check service status: `Get-Service PortfolioNoteGeneratorService`
- View logs: Event Viewer > Windows Logs > Application

## Security Notes

- Self-signed certificates will show browser warnings
- For production, consider using a proper CA certificate
- Keep certificate passwords secure
- Regularly update certificates before expiration 