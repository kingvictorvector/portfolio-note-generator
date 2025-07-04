const express = require('express');
const path = require('path');
const https = require('https');
const fs = require('fs');
require('dotenv').config();
const { connectDB } = require('./config/database');
const uploadRouter = require('./routes/upload');
const noteRouter = require('./routes/note-routes');

const app = express();

// Connect to database
connectDB().catch(console.error);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/previews', express.static(path.join(__dirname, '..', 'previews')));

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Routes
app.get('/', (req, res) => {
    res.render('index');
});

// Test DB connection route
app.get('/db-test', async (req, res) => {
    const { sql } = require('./config/database');
    try {
        const result = await sql.query`SELECT GETDATE() as currentTime`;
        res.json({ success: true, currentTime: result.recordset[0].currentTime });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Upload routes
app.use('/upload', uploadRouter);
app.use('/', noteRouter);

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 3002;

// Check if HTTPS certificates exist
const certPath = process.env.CERT_PATH || 'C:\\certs\\server.pfx';
const certPassword = process.env.CERT_PASSWORD || 'YourPassword123!';

if (fs.existsSync(certPath)) {
    // HTTPS server
    const httpsOptions = {
        pfx: fs.readFileSync(certPath),
        passphrase: certPassword
    };
    
    https.createServer(httpsOptions, app).listen(PORT, () => {
        console.log(`HTTPS Server is running on port ${PORT}`);
        console.log(`Access at: https://kfg_server:${PORT}`);
    });
} else {
    // HTTP server (fallback)
    app.listen(PORT, () => {
        console.log(`HTTP Server is running on port ${PORT}`);
        console.log(`Access at: http://kfg_server:${PORT}`);
        console.log('Note: HTTPS certificates not found. Install certificates for secure access.');
    });
} 