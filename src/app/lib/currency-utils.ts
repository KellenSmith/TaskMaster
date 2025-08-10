/**
 * Currency utilities for converting between smallest denomination (cents) and whole currency (dollars/SEK)
 * 
 * Database storage: prices stored as integers in smallest denomination (e.g. cents, öre)
 * User interface: prices displayed and input as whole currency (e.g. dollars, SEK)
 */

/**
 * Convert from smallest denomination (e.g. cents) to whole currency (e.g. dollars)
 * Used for displaying prices to users
 * @param amountInCents - Amount in smallest denomination (e.g. 299 cents)
 * @returns Amount in whole currency (e.g. 2.99 dollars)
 */
export const centsToWholeCurrency = (amountInCents: number): number => {
    return amountInCents / 100;
};

/**
 * Convert from whole currency (e.g. dollars) to smallest denomination (e.g. cents)
 * Used for storing prices in database
 * @param amountInWholeCurrency - Amount in whole currency (e.g. 2.99 dollars)
 * @returns Amount in smallest denomination (e.g. 299 cents)
 */
export const wholeCurrencyToCents = (amountInWholeCurrency: number): number => {
    return Math.round(amountInWholeCurrency * 100);
};

/**
 * Format currency amount for display with proper formatting
 * @param amountInCents - Amount in smallest denomination
 * @param currencyCode - Currency code (default: SEK)
 * @returns Formatted currency string (e.g. "299 SEK" or "2.99 SEK")
 */
export const formatCurrency = (amountInCents: number, currencyCode: string = 'SEK'): string => {
    const wholeCurrencyAmount = centsToWholeCurrency(amountInCents);
    
    // For SEK, typically display without decimals if it's a whole number
    if (wholeCurrencyAmount % 1 === 0) {
        return `${Math.round(wholeCurrencyAmount)} ${currencyCode}`;
    } else {
        return `${wholeCurrencyAmount.toFixed(2)} ${currencyCode}`;
    }
};

/**
 * Parse user input currency amount to smallest denomination
 * Handles various input formats and converts to cents for storage
 * @param input - User input string or number
 * @returns Amount in smallest denomination, or null if invalid
 */
export const parseUserCurrencyInput = (input: string | number): number | null => {
    if (typeof input === 'number') {
        return isNaN(input) ? null : wholeCurrencyToCents(input);
    }
    
    if (typeof input !== 'string') {
        return null;
    }
    
    // Remove currency symbols and spaces
    const cleanInput = input.replace(/[^\d.,]/g, '');
    
    // Handle empty or invalid input
    if (!cleanInput) {
        return null;
    }
    
    // Parse as float and convert to cents
    const parsed = parseFloat(cleanInput.replace(',', '.'));
    return isNaN(parsed) ? null : wholeCurrencyToCents(parsed);
};