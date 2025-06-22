const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({ dest: uploadsDir });

router.post('/', upload.single('pdfFile'), async (req, res) => {
    console.log('Upload request received');
    
    if (!req.file) {
        console.log('No file uploaded');
        return res.status(400).send('No file uploaded.');
    }

    console.log('File uploaded:', req.file.originalname);
    const pdfPath = req.file.path;
    const previewFilename = `${Date.now()}-${req.file.originalname}`;
    const previewPath = path.join(__dirname, '..', '..', 'previews', previewFilename);

    console.log('PDF Path:', pdfPath);
    console.log('Preview Path:', previewPath);

    try {
        // Ensure previews directory exists
        const previewsDir = path.dirname(previewPath);
        if (!fs.existsSync(previewsDir)) {
            console.log('Creating previews directory:', previewsDir);
            fs.mkdirSync(previewsDir, { recursive: true });
        }

        // Check if source file exists
        if (!fs.existsSync(pdfPath)) {
            throw new Error(`Source file not found: ${pdfPath}`);
        }

        // Move the uploaded file to the previews directory to be displayed.
        console.log('Moving file from', pdfPath, 'to', previewPath);
        fs.renameSync(pdfPath, previewPath);

        console.log('File moved successfully, rendering manual-entry page');
        // Immediately render the manual entry page for the user.
        res.render('manual-entry', {
            pdfFilename: previewFilename
        });

    } catch (error) {
        console.error('Error handling file upload:', error);
        console.error('Error stack:', error.stack);
        res.status(500).send('Error preparing the file for manual entry.');
        // Clean up if the original upload still exists
        if (fs.existsSync(pdfPath)) {
            try {
                fs.unlinkSync(pdfPath);
                console.log('Cleaned up uploaded file');
            } catch (cleanupError) {
                console.error('Error cleaning up file:', cleanupError);
            }
        }
    }
});

router.get('/', (req, res) => {
    res.render('upload');
});

module.exports = router; 