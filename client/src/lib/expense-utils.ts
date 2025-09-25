/**
 * Shared utilities for expense handling across components
 */

/**
 * Normalizes amount string by replacing comma with dot for API consumption
 * Preserves negative sign for refunds
 * Strips thousands separators and handles European format
 */
export function normalizeAmount(amount: string): string {
  // Remove spaces and handle European format (1.234,56 -> 1234.56)
  // First remove spaces, then if there's both dot and comma, treat dot as thousands separator
  let normalized = amount.replace(/\s/g, '');
  
  // European format: dot as thousands separator, comma as decimal
  if (normalized.includes('.') && normalized.includes(',')) {
    normalized = normalized.replace(/\./g, '').replace(',', '.');
  } else {
    // Simple case: just replace comma with dot
    normalized = normalized.replace(',', '.');
  }
  
  return normalized;
}

/**
 * Converts a Date object to YYYY-MM-DD date string for API consumption
 */
export function toISODate(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Formats amount for display, using European format with comma as decimal separator
 */
export function formatAmountDisplay(amount: number): string {
  return amount.toFixed(2).replace(".", ",");
}

/**
 * Validates amount string format (supports European decimal format and negative values)
 */
export function isValidAmountFormat(amount: string): boolean {
  const regex = /^-?[0-9]+([.,][0-9]{1,2})?$/;
  return regex.test(amount);
}