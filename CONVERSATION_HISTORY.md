# Portfolio Note Generator - Development Session History

## Session Date: January 2025
## Topic: HTTPS Implementation and Deployment Setup

### Key Decisions Made

1. **HTTPS Implementation Approach**
   - Chose direct HTTPS in Node.js over reverse proxy for simplicity
   - Self-signed certificates for internal network use
   - Automatic fallback to HTTP if certificates not found

2. **Deployment Strategy**
   - Git-based deployment workflow
   - PowerShell update script (`update.ps1`)
   - Selective Git commits (not adding all files)

3. **Server Configuration**
   - Windows 11 Pro server (KFG_Server)
   - Port 3002 for Portfolio Note Generator
   - Shared .env file format with CRM Pop project

### Files Modified/Created

#### Core Application
- `src/app.js` - Added HTTPS support with certificate detection
- `readme.md` - Updated with deployment workflow and HTTPS info

#### Deployment & Setup
- `update.ps1` - PowerShell deployment script
- `SERVER_SETUP.md` - Detailed server setup instructions
- `.gitignore` - Added certificate file exclusions

### Key Commands Used

```bash
# Git workflow
git add src/app.js update.ps1 .gitignore SERVER_SETUP.md
git commit -m "Add HTTPS support and deployment scripts"
git push origin main

git add readme.md
git commit -m "Update README with HTTPS support and deployment workflow"
git push origin main
```

### Server Setup Commands (To Run Later)

```powershell
# On KFG_Server (PowerShell as Administrator)
New-Item -ItemType Directory -Path "C:\certs" -Force
New-SelfSignedCertificate -DnsName "kfg_server" -CertStoreLocation "cert:\LocalMachine\My" -NotAfter (Get-Date).AddYears(1) -FriendlyName "KFG Server HTTPS"
$cert = Get-ChildItem -Path "cert:\LocalMachine\My" | Where-Object {$_.Subject -eq "CN=kfg_server"}
$cert | Export-Certificate -FilePath "C:\certs\server.crt"
$cert | Export-PfxCertificate -FilePath "C:\certs\server.pfx" -Password (ConvertTo-SecureString -String "YourPassword123!" -Force -AsPlainText)

# Clone and setup
cd C:\
git clone https://github.com/kingvictorvector/portfolio-note-generator.git PortfolioNoteGenerator
cd PortfolioNoteGenerator
npm install
```

### Environment Variables Needed

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

### Access URLs

- **Development:** `http://localhost:3002/upload`
- **Production:** `https://kfg_server:3002/upload`

### Next Steps

1. **Server Setup** (When at office):
   - Follow `SERVER_SETUP.md` instructions
   - Generate certificates
   - Clone repository
   - Test HTTPS access

2. **CRM Pop Updates** (Future):
   - Apply similar HTTPS changes to CRM Pop project
   - Update its deployment script

3. **Certificate Management**:
   - Install certificates on client machines to avoid browser warnings
   - Plan for certificate renewal (1 year expiration)

### Notes

- Self-signed certificates will show browser warnings initially
- Certificate password is hardcoded in app.js (consider environment variable)
- Both projects can share the same certificate
- Update script handles Git pulls and service restarts automatically 