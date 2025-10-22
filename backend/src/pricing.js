// backend/src/pricing.js

const FIXED_MUSD_RATE_INR = process.env.FIXED_MUSD_RATE_INR
  ? parseFloat(process.env.FIXED_MUSD_RATE_INR)
  : 88;

export function convertFiatToMUSD(amountFiat, currency = 'INR') {
  if (currency !== 'INR') {
    // TODO: Integrate price oracle for other currencies
  }
  const musd = amountFiat / FIXED_MUSD_RATE_INR;
  return parseFloat(musd.toFixed(6));
}
