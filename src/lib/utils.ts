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

/**
 * Convert number to words in Indian format
 * Example: 49800 -> "Forty-Nine Thousand Eight Hundred Only"
 */
export function numberToWords(num: number): string {
  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];

  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  const scales = ["", "Thousand", "Lakh", "Crore"];

  if (num === 0) return "Zero";

  function convertHundreds(n: number): string {
    let result = "";
    if (n >= 100) {
      result += ones[Math.floor(n / 100)] + " Hundred ";
      n %= 100;
    }
    if (n >= 20) {
      result += tens[Math.floor(n / 10)] + " ";
      n %= 10;
    }
    if (n > 0) {
      result += ones[n] + " ";
    }
    return result.trim();
  }

  function convert(n: number, scaleIndex: number): string {
    if (n === 0) return "";
    if (scaleIndex === 0) {
      return convertHundreds(n);
    }
    const scaleValue = scaleIndex === 1 ? 1000 : scaleIndex === 2 ? 100000 : 10000000;
    const current = Math.floor(n / scaleValue);
    const remainder = n % scaleValue;
    let result = "";
    if (current > 0) {
      if (scaleIndex === 1) {
        result += convertHundreds(current) + " " + scales[scaleIndex] + " ";
      } else {
        result += convert(current, scaleIndex - 1) + " " + scales[scaleIndex] + " ";
      }
    }
    if (remainder > 0) {
      result += convert(remainder, scaleIndex - 1);
    }
    return result.trim();
  }

  const integerPart = Math.floor(num);
  const decimalPart = Math.round((num - integerPart) * 100);

  let words = "";
  if (integerPart >= 10000000) {
    words = convert(integerPart, 3);
  } else if (integerPart >= 100000) {
    words = convert(integerPart, 2);
  } else if (integerPart >= 1000) {
    words = convert(integerPart, 1);
  } else {
    words = convertHundreds(integerPart);
  }

  // Capitalize first letter
  words = words.charAt(0).toUpperCase() + words.slice(1);

  // Add "Only" at the end
  return words + " Only";
}
