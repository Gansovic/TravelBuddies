function isoDate(isoTs) {
    return isoTs.slice(0, 10);
}
export function findFxRate(rates, fromCcy, toCcy, asOfDate) {
    if (fromCcy === toCcy)
        return 1;
    const direct = rates.find((r) => r.baseCcy === fromCcy && r.quoteCcy === toCcy && r.asOf === asOfDate);
    if (direct)
        return direct.rate;
    const inverse = rates.find((r) => r.baseCcy === toCcy && r.quoteCcy === fromCcy && r.asOf === asOfDate);
    if (inverse)
        return 1 / inverse.rate;
    throw new Error(`Missing FX rate ${fromCcy}/${toCcy} @ ${asOfDate}`);
}
export function computeBalances(expenses, settlementCurrency, rates) {
    const balances = new Map();
    const get = (u) => balances.get(u) ?? 0;
    const set = (u, v) => balances.set(u, v);
    for (const exp of expenses) {
        const asOf = isoDate(exp.ts);
        const rate = findFxRate(rates, exp.currency, settlementCurrency, asOf);
        const amountSettle = Math.round(exp.amountMinor * rate);
        set(exp.payerUserId, get(exp.payerUserId) + amountSettle);
        const totalShare = exp.splits.reduce((s, x) => s + x.shareRatio, 0);
        if (Math.abs(totalShare - 1) > 1e-6) {
            throw new Error("share ratios must sum to 1.0");
        }
        for (const s of exp.splits) {
            const shareMinor = Math.round(amountSettle * s.shareRatio);
            set(s.userId, get(s.userId) - shareMinor);
        }
    }
    return Array.from(balances.entries()).map(([userId, amountMinor]) => ({
        userId,
        amountMinor,
    }));
}
export function minimalTransfers(balances) {
    const debtors = [];
    const creditors = [];
    for (const b of balances) {
        if (b.amountMinor < -1)
            debtors.push({ ...b, amountMinor: -b.amountMinor });
        else if (b.amountMinor > 1)
            creditors.push({ ...b });
    }
    debtors.sort((a, b) => b.amountMinor - a.amountMinor);
    creditors.sort((a, b) => b.amountMinor - a.amountMinor);
    const transfers = [];
    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
        const d = debtors[i];
        const c = creditors[j];
        const amt = Math.min(d.amountMinor, c.amountMinor);
        if (amt > 0)
            transfers.push({ from: d.userId, to: c.userId, amountMinor: amt });
        d.amountMinor -= amt;
        c.amountMinor -= amt;
        if (d.amountMinor <= 1)
            i++;
        if (c.amountMinor <= 1)
            j++;
    }
    return transfers;
}
