import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency based on company currency setting
 * @param amount - The amount to format
 * @param currency - The currency code (e.g., 'INR', 'USD')
 * @param options - Additional formatting options
 */
export function formatCurrency(
  amount: number,
  currency: string = "INR",
  options?: {
    compact?: boolean;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string {
  const locale = currency === "INR" ? "en-IN" : "en-US";
  
  if (options?.compact) {
    // Handle negative values
    const isNegative = amount < 0;
    const absAmount = Math.abs(amount);
      const symbol = getCurrencySymbol(currency);
    const sign = isNegative ? "-" : "";
    
    // Compact format for large numbers (e.g., ₹10.0M, ₹29.3K, -₹5.0K)
    if (absAmount >= 1000000) {
      return `${sign}${symbol}${(absAmount / 1000000).toFixed(1)}M`;
    }
    if (absAmount >= 1000) {
      return `${sign}${symbol}${(absAmount / 1000).toFixed(1)}K`;
    }
    return `${sign}${symbol}${absAmount.toLocaleString(locale)}`;
  }

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: options?.minimumFractionDigits ?? 0,
    maximumFractionDigits: options?.maximumFractionDigits ?? 2,
  }).format(amount);
}

/**
 * Get currency symbol for display
 */
export function getCurrencySymbol(currency: string = "INR"): string {
  const symbols: Record<string, string> = {
    INR: "₹",
    USD: "$",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
    AUD: "A$",
    CAD: "C$",
    SGD: "S$",
    AED: "د.إ",
    SAR: "﷼",
  };
  return symbols[currency] || currency;
}
