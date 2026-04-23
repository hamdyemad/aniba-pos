/**
 * POS Design System - Color Tokens
 * Dark-first design optimized for long cashier shifts
 */
export const colors = {
  primary: {
    50: '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1', // Main
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
  },
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    400: '#4ade80',
    500: '#22c55e', // Main
    600: '#16a34a',
    700: '#15803d',
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    400: '#fbbf24',
    500: '#f59e0b', // Main
    600: '#d97706',
  },
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    400: '#f87171',
    500: '#ef4444', // Main
    600: '#dc2626',
    700: '#b91c1c',
  },
  surface: {
    base: '#0f172a',      // Slate 900
    elevated: '#1e293b',  // Slate 800
    overlay: '#334155',   // Slate 700
    card: '#1e293b',
    input: '#0f172a',
    hover: '#334155',
  },
  text: {
    primary: '#f8fafc',   // Slate 50
    secondary: '#94a3b8', // Slate 400
    tertiary: '#64748b',  // Slate 500
    inverse: '#0f172a',
  },
  border: {
    default: '#334155',   // Slate 700
    strong: '#475569',    // Slate 600
    focus: '#6366f1',     // Primary
  },
} as const;
