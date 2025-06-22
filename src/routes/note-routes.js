const express = require('express');
const router = express.Router();
const { parseAssets, generateFinalNote, parseTimePeriod, parsePerformanceByPosition, loadTemplate, saveTemplate, getAvailableVariables, loadQuickTemplates, saveQuickTemplates } = require('../utils/noteGenerator');

// This new route handles the "Parse and Verify" step.
router.post('/parse-data', (req, res) => {
    const { clientName, trailingYearData, ytdData, assetAllocationData, pdfFilename } = req.body;

    // Use the new, position-based parser for the performance tables.
    const trailingYearPerf = parsePerformanceByPosition(trailingYearData);
    const ytdPerf = parsePerformanceByPosition(ytdData);

    const trailingYear = {
        'Time Period': parseTimePeriod(trailingYearData),
        'Time Weighted Return %': trailingYearPerf['Time Weighted Return %'],
        'Benchmark Return %': trailingYearPerf['Benchmark Return %']
    };

    const ytd = {
        'Time Weighted Return %': ytdPerf['Time Weighted Return %'],
        'Benchmark Return %': ytdPerf['Benchmark Return %']
    };
    
    const assetAllocation = parseAssets(assetAllocationData);

    // Re-render the manual entry page, now with the parsed data for verification.
    res.render('manual-entry', {
        pdfFilename,
        parsedData: {
            clientName,
            trailingYear,
            ytd,
            assetAllocation
        }
    });
});


// This route now receives the final, verified data.
router.post('/generate-note', (req, res) => {
    const finalData = req.body; 
    const noteContent = generateFinalNote(finalData);
    res.render('results', { noteContent });
});

// Template editor routes
router.get('/templates', (req, res) => {
    const currentTemplate = loadTemplate();
    const availableVariables = getAvailableVariables();
    const quickTemplates = loadQuickTemplates();
    
    res.render('templates', {
        currentTemplate,
        availableVariables,
        quickTemplates
    });
});

// API route to save template
router.post('/api/template', (req, res) => {
    try {
        const { templateContent } = req.body;
        
        if (!templateContent || templateContent.trim() === '') {
            return res.json({ success: false, error: 'Template content cannot be empty' });
        }
        
        const success = saveTemplate(templateContent);
        
        if (success) {
            res.json({ success: true });
        } else {
            res.json({ success: false, error: 'Failed to save template' });
        }
    } catch (error) {
        console.error('Error saving template:', error);
        res.json({ success: false, error: 'Internal server error' });
    }
});

// API route to save as quick template
router.post('/api/quick-template', (req, res) => {
    try {
        const { templateName, templateContent, templateKey } = req.body;
        
        if (!templateName || !templateContent || templateContent.trim() === '') {
            return res.json({ success: false, error: 'Template name and content are required' });
        }
        
        const quickTemplates = loadQuickTemplates();
        const key = templateKey || `custom_${Date.now()}`;
        
        quickTemplates[key] = {
            name: templateName,
            content: templateContent
        };
        
        const success = saveQuickTemplates(quickTemplates);
        
        if (success) {
            res.json({ success: true, key });
        } else {
            res.json({ success: false, error: 'Failed to save quick template' });
        }
    } catch (error) {
        console.error('Error saving quick template:', error);
        res.json({ success: false, error: 'Internal server error' });
    }
});

// API route to get quick template
router.get('/api/quick-template/:key', (req, res) => {
    try {
        const { key } = req.params;
        const quickTemplates = loadQuickTemplates();
        const template = quickTemplates[key];
        
        if (template) {
            res.json({ success: true, template });
        } else {
            res.json({ success: false, error: 'Template not found' });
        }
    } catch (error) {
        console.error('Error loading quick template:', error);
        res.json({ success: false, error: 'Internal server error' });
    }
});

module.exports = router; 