export function toMinorUnits(amountMajor: number, minorFactor = 100): number {
  return Math.round(amountMajor * minorFactor);
}

export function fromMinorUnits(amountMinor: number, minorFactor = 100): number {
  return amountMinor / minorFactor;
}
