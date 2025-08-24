import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Currency formatting utilities
 * Future-proof design to support multiple locales
 */

// Default currency settings (can be made configurable later)
const DEFAULT_CURRENCY = 'INR';
const DEFAULT_LOCALE = 'en-IN';

export interface CurrencyConfig {
  currency: string;
  locale: string;
  symbol: string;
}

// Currency configurations for different regions
export const CURRENCY_CONFIGS: { [key: string]: CurrencyConfig } = {
  'INR': { currency: 'INR', locale: 'en-IN', symbol: '₹' },
  'USD': { currency: 'USD', locale: 'en-US', symbol: '$' },
  'EUR': { currency: 'EUR', locale: 'en-GB', symbol: '€' },
  'GBP': { currency: 'GBP', locale: 'en-GB', symbol: '£' },
};

/**
 * Format currency amount with proper locale formatting
 * @param amount - The numeric amount
 * @param currencyCode - Currency code (default: INR)
 * @param showSymbol - Whether to show currency symbol (default: true)
 */
export function formatCurrency(
  amount: number, 
  currencyCode: string = DEFAULT_CURRENCY,
  showSymbol: boolean = true
): string {
  const config = CURRENCY_CONFIGS[currencyCode] || CURRENCY_CONFIGS['INR'];
  
  // For Indian Rupees, use Indian number formatting (lakhs/crores system)
  if (currencyCode === 'INR') {
    return formatIndianCurrency(amount, showSymbol);
  }
  
  // For other currencies, use standard Intl formatting
  const formatter = new Intl.NumberFormat(config.locale, {
    style: showSymbol ? 'currency' : 'decimal',
    currency: config.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  return formatter.format(amount);
}

/**
 * Format currency specifically for Indian locale
 * Uses the Indian numbering system (lakhs/crores)
 */
export function formatIndianCurrency(amount: number, showSymbol: boolean = true): string {
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  const formattedNumber = formatter.format(amount);
  return showSymbol ? `₹${formattedNumber}` : formattedNumber;
}

/**
 * Get currency symbol for a given currency code
 */
export function getCurrencySymbol(currencyCode: string = DEFAULT_CURRENCY): string {
  return CURRENCY_CONFIGS[currencyCode]?.symbol || '₹';
}

/**
 * Format large numbers for display (compact format)
 * e.g., 150000 -> "1.5L", 1500000 -> "15L", 10000000 -> "1Cr"
 */
export function formatCompactCurrency(amount: number, currencyCode: string = DEFAULT_CURRENCY): string {
  const symbol = getCurrencySymbol(currencyCode);
  
  if (currencyCode === 'INR') {
    // Indian format: Lakhs and Crores
    if (amount >= 10000000) { // 1 Crore
      return `${symbol}${(amount / 10000000).toFixed(1)}Cr`;
    } else if (amount >= 100000) { // 1 Lakh
      return `${symbol}${(amount / 100000).toFixed(1)}L`;
    } else if (amount >= 1000) { // 1 Thousand
      return `${symbol}${(amount / 1000).toFixed(1)}K`;
    }
  } else {
    // International format: Thousands, Millions, Billions
    if (amount >= 1000000000) { // 1 Billion
      return `${symbol}${(amount / 1000000000).toFixed(1)}B`;
    } else if (amount >= 1000000) { // 1 Million
      return `${symbol}${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) { // 1 Thousand
      return `${symbol}${(amount / 1000).toFixed(1)}K`;
    }
  }
  
  return formatCurrency(amount, currencyCode);
}
