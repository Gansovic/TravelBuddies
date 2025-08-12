export type Expense = {
    payerUserId: string;
    amountMinor: number;
    currency: string;
    ts: string;
    splits: Array<{
        userId: string;
        shareRatio: number;
    }>;
};
export type FxRate = {
    baseCcy: string;
    quoteCcy: string;
    rate: number;
    asOf: string;
};
export type Balance = {
    userId: string;
    amountMinor: number;
};
export type Transfer = {
    from: string;
    to: string;
    amountMinor: number;
};
export declare function findFxRate(rates: FxRate[], fromCcy: string, toCcy: string, asOfDate: string): number;
export declare function computeBalances(expenses: Expense[], settlementCurrency: string, rates: FxRate[]): Balance[];
export declare function minimalTransfers(balances: Balance[]): Transfer[];
