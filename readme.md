# Portfolio Report Note Generator

## Overview

This project enables employees to quickly generate standardized notes from client portfolio reports in PDF format. By uploading a report, the user can copy-paste key data tables into a form, verify the parsed information, and generate a templated note for use in client communications or record-keeping. This manual verification workflow ensures 100% accuracy for every note.

---

## Features

- **PDF Preview:** A simple web interface for uploading portfolio reports and viewing them in a high-fidelity preview pane.
- **Manual Data Entry:** A two-stage data entry form for copy-pasting report data.
- **Data Verification:** After pasting data, the tool parses it and presents the extracted values in individual fields for final user verification and correction.
- **Standardized Note Generation:** Automatically generates a note using the verified data points in a pre-defined template.
- **Copy to Clipboard:** Allows users to easily copy the generated note for use elsewhere.
- **HTTPS Support:** Secure access with automatic certificate detection and fallback to HTTP.

---

## Example Workflow

1.  **User uploads a PDF report.**
2.  The application displays the PDF in a preview pane next to a data entry form.
3.  **User copies data** from the `Portfolio Performance Trailing Year`, `Portfolio Performance YTD`, and `Portfolio Asset Allocation` tables from the PDF and pastes them into the corresponding text boxes.
4.  User clicks **"Parse and Verify"**.
5.  The page reloads, showing the parsed data in individual, editable fields. The user can correct any value.
6.  User clicks **"Generate Final Note"**.
7.  The final, formatted note is displayed with a "Copy to Clipboard" button.

---

## Technical Stack & Libraries

- **Backend:** Node.js, Express
- **Frontend:** EJS (Embedded JavaScript templates), Bootstrap
- **File Uploads:** Multer
- **Security:** HTTPS with self-signed certificates
- **Development Utility:** Nodemon (for automatic server restarts)

---

## Getting Started

### Local Development

1.  **Clone the repository.**
2.  **Install dependencies:**
    ```sh
    npm install
    ```
3.  **Configure the `.env` file** for your environment (see `SERVER_SETUP.md` for database connection details, though the database is not currently used in the manual workflow).
4.  **Run the app locally** with the development server:
    ```sh
    npm start
    ```
5.  Access the application at `http://localhost:3002/upload`.

### Production Deployment

For production deployment on Windows Server, see `SERVER_SETUP.md` for detailed instructions.

**Quick Setup:**
1. Generate SSL certificates on the server
2. Clone repository to `C:\PortfolioNoteGenerator`
3. Create `.env` file with production settings
4. Run `.\update.ps1` to deploy updates

**Access URLs:**
- **Development:** `http://localhost:3002/upload`
- **Production:** `https://kfg_server:3002/upload`

---

## Project Structure
```
/
|-- previews/           (Stores PDFs for the preview pane)
|-- src/
|   |-- config/
|   |-- public/
|   |-- routes/
|   |   |-- note-routes.js (Handles parsing and note generation)
|   |   |-- upload.js      (Handles file upload and manual entry page)
|   |-- utils/
|   |   |-- noteGenerator.js (Core parsing and note templating logic)
|   |-- views/
|   |   |-- manual-entry.ejs (Two-stage data entry and verification form)
|   |   |-- results.ejs      (Final note display page)
|   |   |-- upload.ejs       (Initial file upload page)
|   |-- app.js              (Main application file with HTTPS support)
|-- uploads/            (Temporary storage for uploads)
|-- update.ps1          (PowerShell deployment script)
|-- SERVER_SETUP.md     (Detailed server setup instructions)
|-- .env                (Environment variables - NOT committed to git)
|-- package.json
|-- readme.md
```

---

## Deployment Workflow

### Development
1. Make changes to code
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin main
   ```

### Production Server
1. Run the update script:
   ```powershell
   cd C:\PortfolioNoteGenerator
   .\update.ps1
   ```

The update script will:
- Pull latest changes from Git
- Install dependencies
- Restart the service
- Display access URLs

---

## Environment Variables

Create a `.env` file with the following variables:

```env
# Database (optional - not used in manual workflow)
DB_HOST=localhost
DB_PORT=1433
DB_NAME=KingVVApp
DB_USER=KingVictorVector
DB_PASSWORD=your_password

# Server Configuration
PORT=3002
NODE_ENV=development

# HTTPS Certificates (production only)
CERT_PATH=C:\certs\server.pfx
CERT_PASSWORD=YourPassword123!
```

---

## Future Enhancements

- **Customizable Note Templates:** Allow users to define and save their own note templates, including calculations based on the extracted data (e.g., Equity % = US Stock % + Non US Stock %).
- **Database Integration:** Save generated notes, link them to client records, and track usage.
- **Improved PDF Parsing:** Revisit automated OCR or text-layer extraction as a potential "first-pass" to pre-fill the paste boxes, while always defaulting to the manual verification flow.
- **Proper SSL Certificates:** Replace self-signed certificates with proper CA-signed certificates for production use.

---

## Contributing

Pull requests and suggestions are welcome!
