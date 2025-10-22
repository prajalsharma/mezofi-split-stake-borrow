/**
 * Pricing utilities for fiat ↔ MUSD conversion
 * All MUSD amounts use 6 decimal places
 */

export interface FiatCurrency {
  code: string; // 'USD', 'INR', 'EUR', etc.
  symbol: string; // '$', '₹', '€', etc.
  decimals: number; // Usually 2 for most fiat currencies
}

export interface ConversionRate {
  from: string;
  to: string;
  rate: number;
  timestamp: number;
  source: 'oracle' | 'fixed' | 'fallback';
}

export interface ConversionResult {
  amountMUSD: number;
  amountFiat: number;
  rate: number;
  currency: FiatCurrency;
  timestamp: number;
}

// Supported fiat currencies
export const SUPPORTED_CURRENCIES: Record<string, FiatCurrency> = {
  USD: { code: 'USD', symbol: '$', decimals: 2 },
  INR: { code: 'INR', symbol: '₹', decimals: 2 },
  EUR: { code: 'EUR', symbol: '€', decimals: 2 },
  GBP: { code: 'GBP', symbol: '£', decimals: 2 },
};

// Fixed fallback rates (MUSD = USD)
const FALLBACK_RATES: Record<string, number> = {
  USD: 1.0, // 1 MUSD = 1 USD
  INR: 83.50, // 1 MUSD = 83.50 INR
  EUR: 0.92, // 1 MUSD = 0.92 EUR
  GBP: 0.79, // 1 MUSD = 0.79 GBP
};

class PricingService {
  private rateCache: Map<string, ConversionRate> = new Map();
  private cacheExpiry: number = 5 * 60 * 1000; // 5 minutes

  /**
   * Convert fiat amount to MUSD
   */
  async convertFiatToMUSD(
    amountFiat: number,
    fiatCurrency: string = 'USD'
  ): Promise<ConversionResult> {
    const currency = SUPPORTED_CURRENCIES[fiatCurrency.toUpperCase()];
    if (!currency) {
      throw new Error(`Unsupported currency: ${fiatCurrency}`);
    }

    const rate = await this.getExchangeRate(fiatCurrency, 'MUSD');
    const amountMUSD = amountFiat / rate.rate;

    return {
      amountMUSD: Math.round(amountMUSD * 1000000) / 1000000, // 6 decimal places
      amountFiat: amountFiat,
      rate: rate.rate,
      currency,
      timestamp: Date.now()
    };
  }

  /**
   * Convert MUSD amount to fiat
   */
  async convertMUSDToFiat(
    amountMUSD: number,
    fiatCurrency: string = 'USD'
  ): Promise<ConversionResult> {
    const currency = SUPPORTED_CURRENCIES[fiatCurrency.toUpperCase()];
    if (!currency) {
      throw new Error(`Unsupported currency: ${fiatCurrency}`);
    }

    const rate = await this.getExchangeRate(fiatCurrency, 'MUSD');
    const amountFiat = amountMUSD * rate.rate;

    return {
      amountMUSD: amountMUSD,
      amountFiat: Math.round(amountFiat * Math.pow(10, currency.decimals)) / Math.pow(10, currency.decimals),
      rate: rate.rate,
      currency,
      timestamp: Date.now()
    };
  }

  /**
   * Get exchange rate from cache or oracle
   */
  private async getExchangeRate(fiatCurrency: string, toCurrency: string): Promise<ConversionRate> {
    const cacheKey = `${fiatCurrency}_${toCurrency}`;
    const cached = this.rateCache.get(cacheKey);

    // Return cached rate if still valid
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached;
    }

    // Try to fetch from oracle
    try {
      const oracleRate = await this.fetchOracleRate(fiatCurrency, toCurrency);
      this.rateCache.set(cacheKey, oracleRate);
      return oracleRate;
    } catch (error) {
      console.warn(`[PRICING] Oracle fetch failed for ${cacheKey}, using fallback:`, error);
      
      // Fall back to fixed rates
      const fallbackRate = FALLBACK_RATES[fiatCurrency.toUpperCase()];
      if (!fallbackRate) {
        throw new Error(`No fallback rate available for ${fiatCurrency}`);
      }

      const rate: ConversionRate = {
        from: fiatCurrency,
        to: toCurrency,
        rate: fallbackRate,
        timestamp: Date.now(),
        source: 'fallback'
      };

      this.rateCache.set(cacheKey, rate);
      return rate;
    }
  }

  /**
   * Fetch exchange rate from oracle (CoinGecko, etc.)
   */
  private async fetchOracleRate(fiatCurrency: string, toCurrency: string): Promise<ConversionRate> {
    // TODO: Replace with actual oracle API call
    /*
    // Example: CoinGecko API
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=mezo-usd&vs_currencies=${fiatCurrency.toLowerCase()}`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'MezoFi/1.0'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Oracle API error: ${response.status}`);
    }

    const data = await response.json();
    const rate = data['mezo-usd']?.[fiatCurrency.toLowerCase()];
    
    if (!rate) {
      throw new Error(`Rate not found for ${fiatCurrency}`);
    }

    return {
      from: fiatCurrency,
      to: toCurrency,
      rate: rate,
      timestamp: Date.now(),
      source: 'oracle'
    };
    */

    // Mock oracle response for development
    console.log(`[PRICING] Fetching ${fiatCurrency}/${toCurrency} rate from oracle`);
    
    const mockRate = FALLBACK_RATES[fiatCurrency.toUpperCase()] || 1.0;
    // Add small random variation to simulate real oracle
    const variation = (Math.random() - 0.5) * 0.02; // ±1% variation
    const adjustedRate = mockRate * (1 + variation);

    return {
      from: fiatCurrency,
      to: toCurrency,
      rate: Math.round(adjustedRate * 100) / 100, // 2 decimal places for rates
      timestamp: Date.now(),
      source: 'oracle'
    };
  }

  /**
   * Format fiat amount for display
   */
  formatFiatAmount(amount: number, currency: string): string {
    const currencyInfo = SUPPORTED_CURRENCIES[currency.toUpperCase()];
    if (!currencyInfo) {
      return `${amount}`;
    }

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyInfo.code,
      minimumFractionDigits: currencyInfo.decimals,
      maximumFractionDigits: currencyInfo.decimals
    }).format(amount);
  }

  /**
   * Format MUSD amount for display
   */
  formatMUSDAmount(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(amount) + ' MUSD';
  }

  /**
   * Get all supported currencies
   */
  getSupportedCurrencies(): FiatCurrency[] {
    return Object.values(SUPPORTED_CURRENCIES);
  }

  /**
   * Clear rate cache (useful for testing)
   */
  clearCache(): void {
    this.rateCache.clear();
  }

  /**
   * Validate fiat amount
   */
  validateFiatAmount(amount: number, currency: string): { valid: boolean; error?: string } {
    if (!amount || amount <= 0) {
      return { valid: false, error: 'Amount must be greater than 0' };
    }

    if (!SUPPORTED_CURRENCIES[currency.toUpperCase()]) {
      return { valid: false, error: `Unsupported currency: ${currency}` };
    }

    // Check reasonable limits
    if (amount > 1000000) {
      return { valid: false, error: 'Amount too large' };
    }

    return { valid: true };
  }

  /**
   * Validate MUSD amount
   */
  validateMUSDAmount(amount: number): { valid: boolean; error?: string } {
    if (!amount || amount <= 0) {
      return { valid: false, error: 'MUSD amount must be greater than 0' };
    }

    // Check precision (max 6 decimals)
    const decimals = (amount.toString().split('.')[1] || '').length;
    if (decimals > 6) {
      return { valid: false, error: 'MUSD amount cannot have more than 6 decimal places' };
    }

    return { valid: true };
  }
}

// Export singleton instance
export const pricingService = new PricingService();

// Export convenience functions
export const convertFiatToMUSD = (amountFiat: number, currency: string = 'USD') => 
  pricingService.convertFiatToMUSD(amountFiat, currency);

export const convertMUSDToFiat = (amountMUSD: number, currency: string = 'USD') => 
  pricingService.convertMUSDToFiat(amountMUSD, currency);

export default pricingService;