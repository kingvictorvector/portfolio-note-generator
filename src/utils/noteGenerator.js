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

// Generates the final note from the structured, verified data.
function generateFinalNote(data) {
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

module.exports = { parseValue, parseAssets, generateFinalNote, parseTimePeriod, parsePerformanceByPosition }; 