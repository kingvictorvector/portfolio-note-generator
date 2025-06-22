// This is the new parser for the text pasted from the manual entry form.
// It is much simpler because the pasted text is more structured than OCR output.

// A highly robust function to find a value associated with a label, even across multiple lines.
function parseValue(text, label) {
    // This regex looks for the label, and then captures the first number it finds after that label.
    // The 's' flag allows '.' to match newlines, searching across line breaks.
    const regex = new RegExp(`${label}[^\\d]*(-?[\\d,.]+)`, 'is');
    const match = text.match(regex);
    return match ? match[1].trim() : null;
}

// A new function to find the time period using a dedicated date regex.
function parseTimePeriod(text) {
    const regex = /(\d{1,2}\/\d{1,2}\/\d{4}\s*to\s*\d{1,2}\/\d{1,2}\/\d{4})/i;
    const match = text.match(regex);
    return match ? match[1].trim() : null;
}

// A new function to parse performance tables by number position.
function parsePerformanceByPosition(text) {
    // Find all numbers in the text block.
    const numbers = text.match(/-?[\d,.]+/g);
    if (!numbers || numbers.length < 3) return {};

    return {
        'Time Weighted Return %': numbers[numbers.length - 3],
        'Benchmark Return %': numbers[numbers.length - 2],
    };
}

// Parses the asset allocation text to get percentages.
function parseAssets(text) {
    const assets = {};
    const assetLabels = ['US Stock', 'Non US Stock', 'Cash', 'Bond', 'Other'];
    for (const label of assetLabels) {
        // Find the asset label and capture the first number that follows it.
        const regex = new RegExp(`${label}[^\\d]*([\\d.]+)`, 'i');
        const match = text.match(regex);
        if (match) {
            assets[label] = match[1].trim();
        }
    }
    return assets;
}

// Template management functions
const fs = require('fs');
const path = require('path');

const TEMPLATE_FILE = path.join(__dirname, '../data/template.txt');

// Ensure data directory exists
function ensureDataDir() {
    const dataDir = path.dirname(TEMPLATE_FILE);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
}

// Load the current template
function loadTemplate() {
    ensureDataDir();
    if (!fs.existsSync(TEMPLATE_FILE)) {
        // Return default template if file doesn't exist
        return `Portfolio review for {{clientName}} covering the period {{timePeriod}}.

Asset Allocation:
- US Stock: {{usStockPercentage}}%
- Non US Stock: {{nonUsStockPercentage}}%
- Cash: {{cashPercentage}}%
- Bond: {{bondPercentage}}%
- Other: {{otherPercentage}}%

Performance Summary (Trailing Year):
- Time Weighted Return: {{trailingYearReturn}}%
- Benchmark Return: {{trailingYearBenchmark}}%

Performance Summary (YTD):
- Time Weighted Return: {{ytdReturn}}%
- Benchmark Return: {{ytdBenchmark}}%`;
    }
    try {
        return fs.readFileSync(TEMPLATE_FILE, 'utf8');
    } catch (error) {
        console.error('Error loading template:', error);
        return '';
    }
}

// Save the template
function saveTemplate(content) {
    ensureDataDir();
    try {
        fs.writeFileSync(TEMPLATE_FILE, content);
        return true;
    } catch (error) {
        console.error('Error saving template:', error);
        return false;
    }
}

// Get available variables for templates
function getAvailableVariables() {
    return {
        'Client Information': {
            'clientName': 'Client Name',
            'timePeriod': 'Time Period (Trailing Year)'
        },
        'Asset Allocation': {
            'usStockPercentage': 'US Stock %',
            'nonUsStockPercentage': 'Non US Stock %',
            'cashPercentage': 'Cash %',
            'bondPercentage': 'Bond %',
            'otherPercentage': 'Other %'
        },
        'Trailing Year Performance': {
            'trailingYearReturn': 'Time Weighted Return %',
            'trailingYearBenchmark': 'Benchmark Return %'
        },
        'YTD Performance': {
            'ytdReturn': 'YTD Time Weighted Return %',
            'ytdBenchmark': 'YTD Benchmark Return %'
        }
    };
}

// Process template with variable substitution
function processTemplate(templateText, data) {
    let processedText = templateText;
    
    // Replace variables with actual data
    const replacements = {
        '{{clientName}}': data.clientName || '',
        '{{timePeriod}}': data.trailingYear['Time Period'] || '',
        '{{usStockPercentage}}': data.assetAllocation['US Stock'] || '',
        '{{nonUsStockPercentage}}': data.assetAllocation['Non US Stock'] || '',
        '{{cashPercentage}}': data.assetAllocation['Cash'] || '',
        '{{bondPercentage}}': data.assetAllocation['Bond'] || '',
        '{{otherPercentage}}': data.assetAllocation['Other'] || '',
        '{{trailingYearReturn}}': data.trailingYear['Time Weighted Return %'] || '',
        '{{trailingYearBenchmark}}': data.trailingYear['Benchmark Return %'] || '',
        '{{ytdReturn}}': data.ytd['Time Weighted Return %'] || '',
        '{{ytdBenchmark}}': data.ytd['Benchmark Return %'] || ''
    };
    
    for (const [variable, value] of Object.entries(replacements)) {
        processedText = processedText.replace(new RegExp(variable, 'g'), value);
    }
    
    return processedText;
}

// Generates the final note from the structured, verified data.
function generateFinalNote(data) {
    // Load the current template
    const template = loadTemplate();
    
    // If template is empty, use default
    if (!template.trim()) {
        let note = `Portfolio review for **${data.clientName}** covering the period **${data.trailingYear['Time Period']}**.`;
        note += `\\n\\n**Asset Allocation:**`;
        for (const [name, percentage] of Object.entries(data.assetAllocation)) {
            note += `\\n- ${name}: ${percentage}%`;
        }
        note += `\\n\\n**Performance Summary (Trailing Year):**`;
        note += `\\n- Time Weighted Return: ${data.trailingYear['Time Weighted Return %']}%`;
        note += `\\n- Benchmark Return: ${data.trailingYear['Benchmark Return %']}%`;
        
        note += `\\n\\n**Performance Summary (YTD):**`;
        note += `\\n- Time Weighted Return: ${data.ytd['Time Weighted Return %']}%`;
        note += `\\n- Benchmark Return: ${data.ytd['Benchmark Return %']}%`;

        return note;
    }
    
    // Use custom template
    return processTemplate(template, data);
}

module.exports = { 
    parseValue, 
    parseAssets, 
    generateFinalNote, 
    parseTimePeriod, 
    parsePerformanceByPosition,
    loadTemplate,
    saveTemplate,
    getAvailableVariables,
    processTemplate
}; 