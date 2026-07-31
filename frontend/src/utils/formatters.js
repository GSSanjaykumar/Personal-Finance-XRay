/**
 * Formats a number into Indian currency (₹) with standard locale string (e.g. ₹1,25,000.00)
 * Uses strict 2 decimal places to prevent floating-point anomalies.
 */
export const formatCurrency = (value) => {
    if (value === null || value === undefined || isNaN(value)) return "₹0.00";
    return `₹${Number(value).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Formats a number into Indian numeric shorthands (Cr, L, K).
 * Examples: 12500000 -> ₹1.25Cr, 643036 -> ₹6.43L, 2500 -> ₹2.5K
 */
export const formatCompact = (value) => {
    if (value === null || value === undefined || isNaN(value)) return "₹0";
    
    const absValue = Math.abs(value);
    let formatted = "";

    if (absValue >= 10000000) {
        formatted = (absValue / 10000000).toFixed(2).replace(/\.00$/, '') + "Cr";
    } else if (absValue >= 100000) {
        formatted = (absValue / 100000).toFixed(2).replace(/\.00$/, '') + "L";
    } else if (absValue >= 1000) {
        formatted = (absValue / 1000).toFixed(1).replace(/\.0$/, '') + "K";
    } else {
        formatted = Number(absValue).toFixed(0);
    }

    return value < 0 ? `-₹${formatted}` : `₹${formatted}`;
};

export const formatChartValue = (value) => {
    return formatCompact(value);
};

export const formatTooltipValue = (value) => {
    return formatCurrency(value);
};

/**
 * Formats a percentage cleanly without trailing zeros.
 */
export const formatPercentage = (value) => {
    if (value === null || value === undefined || isNaN(value)) return "0%";
    return `${Number(value).toFixed(0)}%`;
};

/**
 * Formats a date string into standard 'DD MMM YYYY' format.
 */
export const formatDate = (dateString) => {
    if (!dateString) return "Unknown Date";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
};

/**
 * Formats confidence into a percentage string.
 */
export const formatConfidence = (confidence) => {
    if (confidence === null || confidence === undefined || isNaN(confidence)) return "0%";
    return `${Math.round(confidence * 100)}%`;
};

/**
 * Normalizes and capitalizes frequency strings.
 */
export const formatFrequency = (freq) => {
    if (!freq) return "Unknown";
    return freq.charAt(0).toUpperCase() + freq.slice(1).toLowerCase();
};

/**
 * Normalizes category strings (e.g. "Food Dining" -> "Food & Dining").
 */
export const formatCategory = (category) => {
    if (!category) return "Unknown";
    const lower = category.toLowerCase().trim();
    if (lower === "food" || lower === "food dining" || lower === "food&dining" || lower === "food & dining") {
        return "Food & Dining";
    }
    if (lower === "other" || lower === "others") {
        return "Others";
    }
    // Capitalize first letter of each word
    return category.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
};

/**
 * Attempts to extract a readable merchant name from a raw description
 * if the main merchant name is "Unknown Merchant" or missing.
 * Also normalizes specific known patterns.
 */
export const getDisplayMerchant = (merchantName, rawDescription, description) => {
    const raw = (rawDescription || description || "").trim();
    
    // Normalization rules for known cases even if merchantName is populated
    if (merchantName) {
        const lowerName = merchantName.toLowerCase().replace(/\s+/g, '');
        if (lowerName === "amazonpay") return "Amazon Pay";
        if (lowerName === "swiggyinstamart") return "Swiggy";
        if (lowerName === "bigbasket") return "BigBasket";
    }

    if (!merchantName || merchantName.toLowerCase() === "unknown merchant") {
        if (!raw) return "Unknown Merchant";
        
        // Custom fallbacks based on raw description patterns
        const lowerRaw = raw.toLowerCase();
        if (lowerRaw.includes("amazonpay") || lowerRaw.includes("amazon pay")) return "Amazon Pay";
        if (lowerRaw.includes("netflix")) return "Netflix";
        if (lowerRaw.includes("spotify")) return "Spotify";
        if (lowerRaw.includes("swiggy")) return "Swiggy";
        if (lowerRaw.includes("zomato")) return "Zomato";
        if (lowerRaw.includes("bigbasket")) return "BigBasket";

        // Extract the first meaningful token (at least 3 characters, alphabetic)
        const tokens = raw.split(/[^a-zA-Z0-9]/).filter(Boolean);
        const meaningfulToken = tokens.find(t => t.length > 2 && /[a-zA-Z]/.test(t));
        
        if (meaningfulToken) {
            // Capitalize first letter
            return meaningfulToken.charAt(0).toUpperCase() + meaningfulToken.slice(1).toLowerCase();
        }
        return "Unknown Merchant";
    }
    
    return merchantName;
};
