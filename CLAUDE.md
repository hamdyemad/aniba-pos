# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React Point of Sale (POS) cashier system built with TypeScript, Vite, and Tailwind CSS. The application provides a modern interface for cashiers to manage sales, track inventory, and handle customer transactions with support for both online and offline modes.

## Architecture

### Core Providers and State Management
- **POSProvider** (`src/hooks/usePOS.tsx`): Central state management for cart, orders, sessions, and user authentication
- **RegionProvider** (`src/hooks/useRegion.tsx`): Manages country/currency selection and formatting
- **LanguageProvider** (`src/hooks/useTranslation.tsx`): Handles internationalization (Arabic/English)
- **ThemeProvider** (`src/hooks/useTheme.tsx`): Manages dark/light mode themes

### Key Components
- **LoginPage** (`src/pages/LoginPage/`): Cashier authentication with PIN
- **SessionOpenPage** (`src/pages/SessionOpenPage/`): Opening balance management for cashier sessions
- **POSPage** (`src/pages/POSPage/`): Main point-of-sale interface
- **ProductGrid** (`src/components/organisms/ProductGrid/`): Product catalog with search and filters
- **CartPanel** (`src/components/organisms/CartPanel/`): Shopping cart management
- **CheckoutPanel** (`src/components/organisms/CheckoutPanel/`): Payment processing

### Data Layer
- **IndexedDB** (`src/db/index.ts`): Offline data storage for products, orders, and sync queue
- **API Service** (`src/services/api.ts`): Axios instance with interceptors for auth, country code, and language headers
- **POS Service** (`src/services/posService.ts`): Handles order creation, refunds, and API synchronization

### Hardware Integration
- **Barcode Scanner** (`src/hooks/useHardware.ts`): Detects barcode input via keyboard events
- **Online Status Detection**: Monitors network connectivity

## Development Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Type checking
npx tsc -b

# Linting
npm run lint

# Preview production build
npm run preview
```

## Environment Configuration

Required environment variables in `.env`:
- `VITE_API_BASE_URL`: Backend API endpoint (e.g., http://127.0.0.1:8000/api/v1)
- `VITE_VENDOR_KEY`: Vendor identifier for API requests

## API Integration

The app uses REST API with specific endpoints:
- `/pos/auth/login` - Cashier authentication
- `/pos/sessions/current` - Check/open cashier sessions
- `/pos/checkout` - Process orders
- `/pos/orders` - Fetch order history
- `/area/countries` - Get country/currency list

## Offline Support

- Uses IndexedDB for local storage
- Sync queue for pending API calls
- Graceful fallback when offline
- Automatic retry on network recovery

## Currency and Region

- Dynamic currency formatting based on selected country
- Automatic locale detection for RTL/LTR layout
- Country code stored in localStorage and sent in API headers

## Code Style

- TypeScript strict mode enabled
- ESLint with React and TypeScript rules
- Tailwind CSS for styling
- Lucide React for icons

## Database Schema

### Products Store
- Key: product id
- Indexes: barcode, name, category

### Orders Store
- Key: order id
- Indexes: date, status

### Sync Queue Store
- Key: sync item id
- Indexes: date

## Important Patterns

1. **State Updates**: Always use the dispatched actions from usePOS for cart and order state
2. **API Calls**: Use the api service instance which handles auth tokens and headers
3. **Currency Formatting**: Always use the formatPrice function from useRegion
4. **Barcode Scanning**: Use useBarcodeScanner hook for input detection
5. **Offline Data**: Check for online status before making API calls