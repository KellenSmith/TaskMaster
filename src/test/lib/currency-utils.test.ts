import { describe, it, expect } from 'vitest';
import {
    centsToWholeCurrency,
    wholeCurrencyToCents,
    formatCurrency,
    parseUserCurrencyInput
} from '../../app/lib/currency-utils';

describe('Currency Utils', () => {
    describe('centsToWholeCurrency', () => {
        it('should convert cents to whole currency correctly', () => {
            expect(centsToWholeCurrency(299)).toBe(2.99);
            expect(centsToWholeCurrency(1000)).toBe(10);
            expect(centsToWholeCurrency(0)).toBe(0);
            expect(centsToWholeCurrency(50)).toBe(0.5);
        });
    });

    describe('wholeCurrencyToCents', () => {
        it('should convert whole currency to cents correctly', () => {
            expect(wholeCurrencyToCents(2.99)).toBe(299);
            expect(wholeCurrencyToCents(10)).toBe(1000);
            expect(wholeCurrencyToCents(0)).toBe(0);
            expect(wholeCurrencyToCents(0.5)).toBe(50);
        });

        it('should handle rounding correctly', () => {
            // JavaScript floating point precision issues
            expect(wholeCurrencyToCents(2.995)).toBe(300); // rounds up
            expect(wholeCurrencyToCents(2.994)).toBe(299); // rounds down
        });
    });

    describe('formatCurrency', () => {
        it('should format whole amounts without decimals', () => {
            expect(formatCurrency(1000)).toBe('10 SEK');
            expect(formatCurrency(500)).toBe('5 SEK');
            expect(formatCurrency(0)).toBe('0 SEK');
        });

        it('should format amounts with decimals when needed', () => {
            expect(formatCurrency(299)).toBe('2.99 SEK');
            expect(formatCurrency(150)).toBe('1.50 SEK');
            expect(formatCurrency(5)).toBe('0.05 SEK');
        });

        it('should use custom currency code', () => {
            expect(formatCurrency(1000, 'USD')).toBe('10 USD');
            expect(formatCurrency(299, 'EUR')).toBe('2.99 EUR');
        });
    });

    describe('parseUserCurrencyInput', () => {
        it('should parse numeric input correctly', () => {
            expect(parseUserCurrencyInput(10)).toBe(1000);
            expect(parseUserCurrencyInput(2.99)).toBe(299);
            expect(parseUserCurrencyInput(0)).toBe(0);
        });

        it('should parse string input correctly', () => {
            expect(parseUserCurrencyInput('10')).toBe(1000);
            expect(parseUserCurrencyInput('2.99')).toBe(299);
            expect(parseUserCurrencyInput('0')).toBe(0);
        });

        it('should handle currency symbols and formatting', () => {
            expect(parseUserCurrencyInput('10 SEK')).toBe(1000);
            expect(parseUserCurrencyInput('SEK 10')).toBe(1000);
            expect(parseUserCurrencyInput('2,99')).toBe(299); // European decimal separator
        });

        it('should return null for invalid input', () => {
            expect(parseUserCurrencyInput('')).toBe(null);
            expect(parseUserCurrencyInput('abc')).toBe(null);
            expect(parseUserCurrencyInput(NaN)).toBe(null);
            expect(parseUserCurrencyInput(null)).toBe(null);
        });
    });
});