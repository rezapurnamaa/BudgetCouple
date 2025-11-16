# Overview

CoupleFinance is a full-stack expense tracking application built for couples to manage their shared finances. The application provides a modern web interface for tracking expenses, categorizing spending, managing budgets, and analyzing financial patterns. It features a responsive design that works seamlessly on both desktop and mobile devices.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript for type safety and modern development
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Library**: shadcn/ui components built on Radix UI primitives for accessible, customizable components
- **Styling**: Tailwind CSS with CSS variables for theming and responsive design
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation for type-safe form handling
- **Charts**: Recharts for data visualization

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript for end-to-end type safety
- **API Pattern**: RESTful API with JSON responses
- **Validation**: Zod schemas for request/response validation
- **Error Handling**: Centralized error handling middleware
- **Development**: Hot module replacement via Vite integration

## Data Storage
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Fallback Storage**: In-memory storage implementation for development/testing

## Database Schema
- **Categories**: Expense categories with emoji, color, and budget tracking
  - Updated categories (August 2025): Groceries, Eating out, Entertainment, Subscription, Gifts, Potluck, Charity, Additional transport, Vacation, Emergency spending, Babysitting, Housekeeping, Supplement/medicine
- **Partners**: User/partner management with color coding
- **Expenses**: Transaction records with amount, description, category, partner, and date
  - **Statement Processing**: Automated CSV upload with AI categorization and European format support
  - **AMEX Integration**: Auto-tags partners based on cardholder names in AMEX statements
  - **Amount Parsing**: European decimal format support (comma as decimal separator: "47,40" = €47.40)
  - **Date Parsing**: European date format support (DD-MM-YYYY priority over MM-DD-YYYY)
- **Relationships**: Foreign key relationships between expenses, categories, and partners

## Development Environment
- **Monorepo Structure**: Shared TypeScript types and schemas between client and server
- **Path Aliases**: Configured for clean imports (@/, @shared/, @assets/)
- **Hot Reloading**: Vite dev server with automatic reload on changes
- **Type Checking**: Strict TypeScript configuration across the entire codebase

## Mobile Responsiveness
- **Responsive Design**: Mobile-first approach with Tailwind CSS breakpoints
- **Mobile Navigation**: Bottom navigation bar for mobile devices
- **Touch Interactions**: Optimized for touch interfaces and mobile usage patterns

# External Dependencies

## Database
- **Neon Database**: Serverless PostgreSQL database for production
- **Drizzle ORM**: Type-safe database toolkit with PostgreSQL dialect

## UI Components
- **Radix UI**: Headless component primitives for accessibility
- **shadcn/ui**: Pre-built component library with consistent styling
- **Lucide React**: Icon library for consistent iconography

## Data Visualization
- **Recharts**: React charting library for spending analytics and budget visualization

## Offline-First Architecture (November 2025)
- **Local Storage Persistence**: All data cached in localStorage for offline access using TanStack Query Persist Client
- **Network Mode**: `offlineFirst` strategy allows app to work without internet connection
- **Automatic Sync**: Mutations queued when offline and automatically synced when connection restored
- **Smart Caching**: 24-hour cache duration (gcTime) with 5-minute stale time for all queries
- **Mutation Defaults**: Pre-configured mutation functions for all CRUD operations to enable resumable offline mutations
- **Network Status Indicator**: Three distinct visual states (offline, syncing, synced) with test IDs for QA automation
  - Shows queued mutation count while offline
  - Displays sync progress when reconnecting
  - Shows success message after sync completes
- **SSR-Safe Implementation**: All browser APIs (window, navigator, localStorage) properly guarded for SSR/test compatibility
- **Persister Strategy**: useMemo-based persister initialization ensures proper hydration in SSR contexts
- **Mutation Tracking**: Tracks both paused (offline) and pending (syncing) mutations for accurate UI feedback

## Development Tools
- **Replit Integration**: Vite plugins for Replit development environment
- **PostCSS**: CSS processing with Tailwind CSS and Autoprefixer
- **ESBuild**: Fast JavaScript bundler for production builds

## Form Handling
- **React Hook Form**: Performant form library with minimal re-renders
- **Hookform Resolvers**: Zod integration for form validation

## Utilities
- **date-fns**: Date manipulation and formatting
- **clsx & tailwind-merge**: Conditional CSS class handling
- **class-variance-authority**: Component variant management

# Recent Changes

## November 2025
- **Offline-First Capabilities**: Implemented full offline support with local storage persistence
  - App works without internet connection
  - All data cached locally and synced automatically when reconnected
  - Visual indicators for offline status and pending sync operations
  - Mutation queue system ensures no data loss when offline
- **Interactive Month Selection**: Added month selector on analytics page
  - Click monthly summary dropdown to filter charts and expenses by specific month
  - Collapsible expense list shows all transactions for selected month
  - Charts automatically update to show selected month's data
- **Source/Type Filtering**: Added payment source filter on history page for AMEX, DKB, PayPal, Cash, etc.
- **Tablet Optimization**: Improved date range picker for iPad and tablets
  - Better positioning and scrolling behavior
  - Single calendar month display for screens < 1024px

## September 2025
- **Bulk Expense Addition**: Created dedicated bulk-add page for adding multiple expenses at once with table interface, defaults, validation, individual saves, and retry functionality for weekly expense catch-ups
- **Interactive Analytics**: Added category expense drill-down feature - users can click on budget alerts to view detailed expenses for specific categories
- **Date Picker Improvements**: Fixed mobile responsiveness and selection behavior in date range pickers