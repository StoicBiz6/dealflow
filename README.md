# DealFlow

An AI-powered investment pipeline management platform for tracking deals, running diligence, and coordinating investor outreach.

## Features

- Kanban pipeline with deal stages
- AI-powered deal analysis (Claude)
- Document parsing (CIM upload & Q&A)
- Email generation and sending
- Market intelligence & comparable valuations
- Task management
- Multi-workspace support
- Native iOS app

## Tech Stack

- **Frontend**: React 19 + Vite + Tailwind CSS 4
- **Auth**: Clerk
- **Database**: Supabase (Postgres)
- **AI**: Anthropic Claude
- **Email**: Resend
- **Deployment**: Vercel

---

## Setup

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Clerk](https://clerk.com) application
- An [Anthropic](https://console.anthropic.com) API key

### 1. Clone and install dependencies

```bash
git clone <your-repo-url>
cd dealflow
npm install
```

### 2. Configure environment variables

Create a `.env.local` file in the project root:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Clerk
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your-clerk-publishable-key

# Anthropic (used in API functions)
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key

# Resend (for email sending)
RESEND_API_KEY=re_your-resend-key
```

### 3. Set up Supabase

1. Go to your [Supabase project](https://supabase.com/dashboard)
2. Open the **SQL Editor**
3. Run the contents of `supabase/migration.sql` to create the `deals` table, enable RLS, and load seed data

### 4. Run the development server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Deployment (Vercel)

### First-time setup

1. Install the [Vercel CLI](https://vercel.com/docs/cli): `npm i -g vercel`
2. Run `vercel` in the project root and follow the prompts
3. Add all environment variables from `.env.local` in the Vercel project settings under **Settings > Environment Variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_CLERK_PUBLISHABLE_KEY`
   - `ANTHROPIC_API_KEY`
   - `RESEND_API_KEY`

### Deploy

```bash
vercel --prod
```

Or connect your GitHub repo to Vercel for automatic deployments on push.

> The `vercel.json` at the project root is already configured to handle client-side routing (SPA rewrites).

---

## iOS App

See [`ios/README.md`](ios/README.md) for instructions on building and running the native iOS app.

---

## Project Structure

```
src/
  components/     # Reusable UI components
  views/          # Page-level views (Kanban, Dashboard, List, etc.)
  hooks/          # Custom React hooks (useDeals, useWorkspace)
  lib/            # Supabase client, constants
api/              # Vercel serverless API functions
ios/              # Native SwiftUI iOS app
supabase/         # Database migration SQL
```
