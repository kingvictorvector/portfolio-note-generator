function extractData(text, regex, group = 1) {
    const match = text.match(regex);
    return match && match[group] ? match[group].trim() : null;
}

// This function takes a number string from OCR (e.g., "6540", "114", "08")
// and correctly re-inserts the decimal point.
function parseOcrPercentage(numStr) {
    if (!numStr || typeof numStr !== 'string') return null;
    const cleaned = numStr.replace(/,/g, '');
    if (cleaned.includes('.')) return parseFloat(cleaned);
    if (cleaned.length > 2) {
        return parseFloat(cleaned.slice(0, -2) + '.' + cleaned.slice(-2));
    }
    if (cleaned.length > 1) {
        return parseFloat(cleaned.slice(0, -1) + '.' + cleaned.slice(-1));
    }
    return parseFloat(cleaned);
}

function findNextNumber(text, startIndex) {
    const match = text.substring(startIndex).match(/(\d[\d,.]*)/);
    return match ? match[1] : null;
}

// This function finds all the asset allocations in the OCR text.
function extractAssetAllocation(text) {
    const assets = {};
    const assetConfigs = [
        { name: 'US Stock', pattern: /(US|U S|OU\S*)\s*St\w*k/i },
        { name: 'Non US Stock', pattern: /(Non|on)\s*US\s*St\w*k/i },
        { name: 'Cash', pattern: /(Cash|Sch)/i },
        { name: 'Bond', pattern: /Bond/i },
        { name: 'Other', pattern: /Othe\w*/i }
    ];

    // Pre-scan the text to create a map of all found asset percentages.
    const percentageMap = new Map();
    const assetScanRegex = /(US\s*Stock|Non\s*US\s*Stock|Cash|Bond|Other|Sch|Othe\w*)\s*([\d,.]+)/gi;
    let scanMatch;
    while ((scanMatch = assetScanRegex.exec(text)) !== null) {
        const name = scanMatch[1];
        const value = scanMatch[2];
        // Normalize asset names (e.g., "Sch" becomes "Cash")
        const matchedConfig = assetConfigs.find(c => c.pattern.test(name));
        if (matchedConfig) {
            percentageMap.set(matchedConfig.name, value);
        }
    }

    // Use the pre-scanned map to populate the assets object.
    for (const config of assetConfigs) {
        if (percentageMap.has(config.name)) {
             assets[config.name] = { 
                percentage: parseOcrPercentage(percentageMap.get(config.name)),
                marketValue: null // Market values remain too unreliable
            };
        }
    }
    
    return assets;
}

function parsePortfolioText(text) {
    const clientNameRegex = /Prepared for:\s*([A-Z,&\s]+?)(?:\s\d)?\n/i;
    // This regex handles "to", "t0", and merged dates like "69/2025"
    const timePeriodRegex = /Time Period:.*?(\d{1,2}\/\d{1,2}\/\d{4}.*?t[o0]\s*\d{1,2}\/?\d{1,2}\/\d{4})/i;

    const extracted = {
        clientName: extractData(text, clientNameRegex),
        timePeriod: extractData(text, timePeriodRegex),
        assetAllocation: extractAssetAllocation(text)
    };
    
    return extracted;
}

module.exports = { parsePortfolioText }; 