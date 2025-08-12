export function toMinorUnits(amountMajor, minorFactor = 100) {
    return Math.round(amountMajor * minorFactor);
}
export function fromMinorUnits(amountMinor, minorFactor = 100) {
    return amountMinor / minorFactor;
}
