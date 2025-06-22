const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

const upload = multer({ dest: 'uploads/' });

router.post('/', upload.single('pdfFile'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const pdfPath = req.file.path;
    const previewFilename = `${Date.now()}-${req.file.originalname}`;
    const previewPath = path.join(__dirname, '..', '..', 'previews', previewFilename);

    try {
        // Move the uploaded file to the previews directory to be displayed.
        fs.renameSync(pdfPath, previewPath);

        // Immediately render the manual entry page for the user.
        res.render('manual-entry', {
            pdfFilename: previewFilename,
            // We pass an empty data object as all data will now be entered by the user.
            data: { assetAllocation: {} } 
        });

    } catch (error) {
        console.error('Error handling file upload:', error);
        res.status(500).send('Error preparing the file for manual entry.');
        // Clean up if the original upload still exists
        if (fs.existsSync(pdfPath)) {
            fs.unlinkSync(pdfPath);
        }
    }
});

router.get('/', (req, res) => {
    res.render('upload');
});

module.exports = router; 