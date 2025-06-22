const express = require('express');
const router = express.Router();
const { parseAssets, generateFinalNote, parseTimePeriod, parsePerformanceByPosition } = require('../utils/noteGenerator');

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

module.exports = router; 