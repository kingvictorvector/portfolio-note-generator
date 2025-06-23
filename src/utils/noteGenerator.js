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
        'Total Portfolio Value': numbers[numbers.length - 1]
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
const QUICK_TEMPLATES_FILE = path.join(__dirname, '../data/quick-templates.json');

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
            'otherPercentage': 'Other %',
            'totalEquityPercentage': 'Total Equity % (US + Non-US Stock)',
            'totalFixedIncomePercentage': 'Total Fixed Income % (Cash + Bond)',
            'totalBondCashDollars': 'Total Bond + Cash ($, rounded to nearest $1000)'
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
    
    // Calculate derived values
    const usStock = parseFloat(data.assetAllocation['US Stock']) || 0;
    const nonUsStock = parseFloat(data.assetAllocation['Non US Stock']) || 0;
    const cash = parseFloat(data.assetAllocation['Cash']) || 0;
    const bond = parseFloat(data.assetAllocation['Bond']) || 0;
    
    const totalEquity = (usStock + nonUsStock).toFixed(1);
    const totalFixedIncome = (cash + bond).toFixed(1);
    
    // Calculate total bond + cash dollar amount using the actual portfolio value
    const totalPortfolioValue = parseFloat((data.totalPortfolioValue || '').toString().replace(/,/g, '')) || 1000000; // Remove commas before parsing
    const totalBondCashPercent = cash + bond;
    const totalBondCashDollars = Math.round((totalBondCashPercent / 100) * totalPortfolioValue / 1000) * 1000;
    console.log(`[DEBUG] Bond: ${bond}, Cash: ${cash}, Total %: ${totalBondCashPercent}, Portfolio: ${totalPortfolioValue}, $: ${totalBondCashDollars}`);
    
    // Replace variables with actual data
    const replacements = {
        '{{clientName}}': data.clientName || '',
        '{{timePeriod}}': data.trailingYear['Time Period'] || '',
        '{{usStockPercentage}}': data.assetAllocation['US Stock'] || '',
        '{{nonUsStockPercentage}}': data.assetAllocation['Non US Stock'] || '',
        '{{cashPercentage}}': data.assetAllocation['Cash'] || '',
        '{{bondPercentage}}': data.assetAllocation['Bond'] || '',
        '{{otherPercentage}}': data.assetAllocation['Other'] || '',
        '{{totalEquityPercentage}}': totalEquity,
        '{{totalFixedIncomePercentage}}': totalFixedIncome,
        '{{totalBondCashDollars}}': totalBondCashDollars.toLocaleString(),
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
function generateFinalNote(data, templateId = null) {
    // If a specific template is requested, use it
    if (templateId) {
        const quickTemplates = loadQuickTemplates();
        const template = quickTemplates[templateId];
        if (template) {
            return processTemplate(template.content, data);
        }
    }
    
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

// Load quick templates
function loadQuickTemplates() {
    ensureDataDir();
    if (!fs.existsSync(QUICK_TEMPLATES_FILE)) {
        // Return default quick templates if file doesn't exist
        return {
            'simple': {
                name: 'Simple Summary',
                content: `Portfolio review for {{clientName}} covering {{timePeriod}}.

Asset Allocation:
- US Stock: {{usStockPercentage}}%
- Non US Stock: {{nonUsStockPercentage}}%
- Cash: {{cashPercentage}}%
- Bond: {{bondPercentage}}%
- Other: {{otherPercentage}}%

Performance Summary:
- Trailing Year Return: {{trailingYearReturn}}%
- YTD Return: {{ytdReturn}}%`
            },
            'detailed': {
                name: 'Detailed Analysis',
                content: `COMPREHENSIVE PORTFOLIO REVIEW
Client: {{clientName}}
Period: {{timePeriod}}

ASSET ALLOCATION BREAKDOWN:
• US Equities: {{usStockPercentage}}% of portfolio
• International Equities: {{nonUsStockPercentage}}% of portfolio  
• Fixed Income: {{bondPercentage}}% of portfolio
• Cash & Equivalents: {{cashPercentage}}% of portfolio
• Alternative Investments: {{otherPercentage}}% of portfolio

PERFORMANCE ANALYSIS:
Trailing Year Performance:
• Portfolio Return: {{trailingYearReturn}}%
• Benchmark Return: {{trailingYearBenchmark}}%

Year-to-Date Performance:
• Portfolio Return: {{ytdReturn}}%
• Benchmark Return: {{ytdBenchmark}}%`
            },
            'performance': {
                name: 'Performance Focus',
                content: `PERFORMANCE SUMMARY - {{clientName}}
Reporting Period: {{timePeriod}}

KEY METRICS:
Trailing Year:
• Portfolio: {{trailingYearReturn}}%
• Benchmark: {{trailingYearBenchmark}}%

YTD:
• Portfolio: {{ytdReturn}}%
• Benchmark: {{ytdBenchmark}}%

ASSET MIX:
Equity: {{usStockPercentage}}% US + {{nonUsStockPercentage}}% International
Fixed Income: {{bondPercentage}}%
Cash: {{cashPercentage}}%
Other: {{otherPercentage}}%`
            }
        };
    }
    try {
        const data = fs.readFileSync(QUICK_TEMPLATES_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading quick templates:', error);
        return {};
    }
}

// Save quick templates
function saveQuickTemplates(templates) {
    ensureDataDir();
    try {
        fs.writeFileSync(QUICK_TEMPLATES_FILE, JSON.stringify(templates, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving quick templates:', error);
        return false;
    }
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
    processTemplate,
    loadQuickTemplates,
    saveQuickTemplates
}; 