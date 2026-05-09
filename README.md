# Billify (BILLIQ)

Billify is an intelligent, hardware-free POS and digital billing platform. It sends instant receipts via WhatsApp, manages kitchen workflows with a real-time KDS, and uses transaction data for automated customer marketing.

## Key Features

- **Digital WhatsApp Receipts**: Instant receipt delivery without app installs.
- **Hardware-Free POS**: Runs on any phone or desktop browser.
- **Kitchen Display System (KDS)**: Real-time order tracking for chefs.
- **Automated Marketing**: Transaction-driven loyalty and offers.
- **Real-time Analytics**: Insights into revenue, peak hours, and top items.

## Getting Started

### Prerequisites

- Node.js 18+ 
- SQLite (standard)

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Fill in your database and WhatsApp API credentials
   ```

3. Initialize the database:
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Prisma ORM with SQLite
- **Real-time**: Server-Sent Events (SSE)
- **Auth**: NextAuth.js
