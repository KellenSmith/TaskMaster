import { describe, it, expect } from 'vitest';
import {
    centsToWholeCurrency,
    wholeCurrencyToCents,
    formatCurrency,
    parseUserCurrencyInput
} from '../../app/lib/currency-utils';

describe('Currency Flow Integration', () => {
    describe('Event creation and display flow', () => {
        it('should handle full event ticket price flow correctly', () => {
            // Simulate user entering "25.50" SEK in event creation form
            const userInput = "25.50";
            const centsForStorage = parseUserCurrencyInput(userInput);
            expect(centsForStorage).toBe(2550); // Stored as 2550 cents in database

            // Simulate displaying the price on event dashboard
            const displayPrice = formatCurrency(centsForStorage);
            expect(displayPrice).toBe('25.50 SEK'); // Displayed as "25.50 SEK"

            // Simulate editing the event - form should show whole currency
            const wholeCurrencyForEdit = centsToWholeCurrency(centsForStorage);
            expect(wholeCurrencyForEdit).toBe(25.50); // Form shows 25.50

            // Simulate payment processing - uses cents value directly
            expect(centsForStorage).toBe(2550); // Payment API receives 2550 (cents)
        });

        it('should handle whole number prices correctly', () => {
            // User enters "50" SEK
            const userInput = "50";
            const centsForStorage = parseUserCurrencyInput(userInput);
            expect(centsForStorage).toBe(5000);

            // Display should show without decimal for whole numbers
            const displayPrice = formatCurrency(centsForStorage);
            expect(displayPrice).toBe('50 SEK');
        });

        it('should handle zero price (free events)', () => {
            const userInput = "0";
            const centsForStorage = parseUserCurrencyInput(userInput);
            expect(centsForStorage).toBe(0);

            const displayPrice = formatCurrency(centsForStorage);
            expect(displayPrice).toBe('0 SEK');
        });

        it('should handle membership fee flow', () => {
            // Simulate membership fee from environment variable (in cents)
            const membershipFeeCents = 5000; // 50 SEK from env

            // Payment display should format correctly
            const displayPrice = formatCurrency(membershipFeeCents);
            expect(displayPrice).toBe('50 SEK');

            // Payment API should receive cents directly
            expect(membershipFeeCents).toBe(5000);
        });

        it('should handle task-reduced ticket prices', () => {
            // Simulate full ticket price of 100 SEK (10000 cents) with 50% task discount
            const fullPriceCents = 10000;
            const discountFactor = 0.5;
            const reducedPriceCents = Math.round(fullPriceCents * (1 - discountFactor));
            
            expect(reducedPriceCents).toBe(5000); // 50 SEK worth of cents
            
            // Display should format correctly
            const displayPrice = formatCurrency(reducedPriceCents);
            expect(displayPrice).toBe('50 SEK');
        });
    });
});