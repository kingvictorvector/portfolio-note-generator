const express = require('express');
const router = express.Router();
const { parseAssets, generateFinalNote, parseTimePeriod, parsePerformanceByPosition, loadTemplate, saveTemplate, getAvailableVariables, loadQuickTemplates, saveQuickTemplates } = require('../utils/noteGenerator');

// This new route handles the "Parse and Verify" step.
router.post('/parse-data', (req, res) => {
    const { clientName, totalPortfolioValue, trailingYearData, ytdData, assetAllocationData, pdfFilename } = req.body;

    // Use the new, position-based parser for the performance tables.
    const trailingYearPerf = parsePerformanceByPosition(trailingYearData);
    const ytdPerf = parsePerformanceByPosition(ytdData);

    // Debug logs for troubleshooting
    console.log('[DEBUG] trailingYearPerf:', trailingYearPerf);
    console.log('[DEBUG] totalPortfolioValue (input):', totalPortfolioValue);
    
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

    // Extract total portfolio value from the trailing year data (last number in the table)
    const extractedPortfolioValue = trailingYearPerf['Total Portfolio Value'] || totalPortfolioValue;
    console.log('[DEBUG] extractedPortfolioValue:', extractedPortfolioValue);

    // Re-render the manual entry page, now with the parsed data for verification.
    res.render('manual-entry', {
        pdfFilename,
        parsedData: {
            clientName,
            totalPortfolioValue: extractedPortfolioValue,
            trailingYear,
            ytd,
            assetAllocation
        },
        quickTemplates: loadQuickTemplates()
    });
});


// This route now receives the final, verified data.
router.post('/generate-note', (req, res) => {
    const finalData = req.body; 
    const templateId = finalData.templateId || null;
    const noteContent = generateFinalNote(finalData, templateId);
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

// Route to go back to Step 1 with the same PDF
router.get('/manual-entry/:pdfFilename', (req, res) => {
    const { pdfFilename } = req.params;
    res.render('manual-entry', { pdfFilename });
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

// API route to delete quick template
router.delete('/api/quick-template/:key', (req, res) => {
    try {
        const { key } = req.params;
        const quickTemplates = loadQuickTemplates();
        
        if (!quickTemplates[key]) {
            return res.json({ success: false, error: 'Template not found' });
        }
        
        delete quickTemplates[key];
        const success = saveQuickTemplates(quickTemplates);
        
        if (success) {
            res.json({ success: true });
        } else {
            res.json({ success: false, error: 'Failed to delete template' });
        }
    } catch (error) {
        console.error('Error deleting quick template:', error);
        res.json({ success: false, error: 'Internal server error' });
    }
});

module.exports = router; 