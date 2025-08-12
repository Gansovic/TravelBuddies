import { describe, it, expect } from 'vitest';
import { computeBalances, minimalTransfers } from './settlements';
describe('settlements', () => {
    it('computes balances for equal split same currency', () => {
        const expenses = [
            {
                payerUserId: 'alice',
                amountMinor: 10000,
                currency: 'USD',
                ts: '2025-08-10T12:00:00Z',
                splits: [
                    { userId: 'alice', shareRatio: 0.5 },
                    { userId: 'bob', shareRatio: 0.5 },
                ],
            },
        ];
        const rates = [];
        const balances = computeBalances(expenses, 'USD', rates);
        const toMap = Object.fromEntries(balances.map(b => [b.userId, b.amountMinor]));
        expect(toMap['alice']).toBe(10000 - 5000);
        expect(toMap['bob']).toBe(-5000);
        const transfers = minimalTransfers(balances);
        expect(transfers).toEqual([{ from: 'bob', to: 'alice', amountMinor: 5000 }]);
    });
    it('converts currency using FX rate', () => {
        const expenses = [
            {
                payerUserId: 'alice',
                amountMinor: 10000, // 100 EUR
                currency: 'EUR',
                ts: '2025-08-10T12:00:00Z',
                splits: [
                    { userId: 'alice', shareRatio: 0.0 },
                    { userId: 'bob', shareRatio: 1.0 },
                ],
            },
        ];
        const rates = [
            { baseCcy: 'EUR', quoteCcy: 'USD', rate: 1.1, asOf: '2025-08-10' },
        ];
        const balances = computeBalances(expenses, 'USD', rates);
        const toMap = Object.fromEntries(balances.map(b => [b.userId, b.amountMinor]));
        expect(toMap['alice']).toBeCloseTo(11000, 0);
        expect(toMap['bob']).toBeCloseTo(-11000, 0);
    });
    it('validates share ratios sum to 1', () => {
        const expenses = [
            {
                payerUserId: 'alice',
                amountMinor: 10000,
                currency: 'USD',
                ts: '2025-08-10T12:00:00Z',
                splits: [
                    { userId: 'alice', shareRatio: 0.8 },
                    { userId: 'bob', shareRatio: 0.1 },
                ],
            },
        ];
        expect(() => computeBalances(expenses, 'USD', [])).toThrow(/share ratios/);
    });
});
