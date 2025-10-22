import fetch from 'node-fetch';

const FIXED_MUSD_RATES = {
  INR: parseFloat(process.env.FIXED_MUSD_RATE_INR || '88'),
  USD: parseFloat(process.env.FIXED_MUSD_RATE_USD || '1'),
  EUR: parseFloat(process.env.FIXED_MUSD_RATE_EUR || '0.9'),
};

const SLIPPAGE_BUFFER_PERCENT = 0.5;

const COINGECKO_API_URL =
  'https://api.coingecko.com/api/v3/simple/price?ids=magic-internet-money&vs_currencies=inr,usd,eur';

let cache = null;
let cacheTimestamp = 0;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 min cache

async function fetchRates() {
  const now = Date.now();
  if (cache && now - cacheTimestamp < CACHE_DURATION_MS) return cache;
  try {
    const res = await fetch(COINGECKO_API_URL);
    const data = await res.json();
    cache = data['magic-internet-money'];
    cacheTimestamp = now;
    return cache;
  } catch {
    return null;
  }
}

export async function convertFiatToMUSD(amountFiat, currency = 'INR') {
  let rate = FIXED_MUSD_RATES[currency] || null;
  if (!rate) {
    const rates = await fetchRates();
    rate = rates?.[currency.toLowerCase()] || FIXED_MUSD_RATES['INR'];
  }
  const baseAmount = amountFiat / rate;
  const amountWithSlippage = baseAmount * (1 + SLIPPAGE_BUFFER_PERCENT / 100);
  return parseFloat(amountWithSlippage.toFixed(6));
}

export async function convertMUSDToFiat(amountMUSD, currency = 'INR') {
  let rate = FIXED_MUSD_RATES[currency] || null;
  if (!rate) {
    const rates = await fetchRates();
    rate = rates?.[currency.toLowerCase()] || FIXED_MUSD_RATES['INR'];
  }
  const fiatAmount = amountMUSD * rate;
  return parseFloat(fiatAmount.toFixed(2));
}
