/**
 * Format a number as currency
 */
export function formatCurrency(amount: number, symbol = 'ج.م'): string {
  return `${amount.toFixed(2)} ${symbol}`;
}

/**
 * Format a date string to a readable format
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format an order number
 */
export function formatOrderNumber(num: number): string {
  return `INV-${String(num).padStart(6, '0')}`;
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generate a short order number based on timestamp
 */
export function generateOrderNumber(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const seq = String(Math.floor(Math.random() * 9999)).padStart(4, '0');
  return `INV-${day}${month}-${seq}`;
}
