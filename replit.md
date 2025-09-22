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

## September 2025
- **Interactive Analytics**: Added category expense drill-down feature - users can click on budget alerts to view detailed expenses for specific categories
- **Date Picker Improvements**: Fixed mobile responsiveness and selection behavior in date range pickers