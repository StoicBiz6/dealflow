# DealFlow iOS App

Native SwiftUI iOS app for the DealFlow investment pipeline management platform.

## Requirements

- Xcode 15+
- iOS 17+ deployment target
- macOS Sonoma or later (for development)

## Setup

### 1. Open the Project

```bash
open ios/DealFlow.xcodeproj
```

### 2. Configure Environment

In `DealFlow/Utils/Constants.swift`, update the configuration values:

```swift
static let supabaseURL = "https://YOUR_PROJECT.supabase.co"
static let supabaseAnonKey = "YOUR_SUPABASE_ANON_KEY"
static let vercelBaseURL = "https://dealflow-zeta.vercel.app"
static let clerkPublishableKey = "YOUR_CLERK_PUBLISHABLE_KEY"
```

These values come from your web app's `.env` file:
- `VITE_SUPABASE_URL` → `supabaseURL`
- `VITE_SUPABASE_ANON_KEY` → `supabaseAnonKey`
- `VITE_CLERK_PUBLISHABLE_KEY` → `clerkPublishableKey`

### 3. Set Bundle Identifier

In Xcode:
- Select the `DealFlow` target → General → Bundle Identifier
- Change from `com.dealflow.app` to your own bundle ID

### 4. Sign In

Use the same email + password as your DealFlow web app account (powered by Clerk).

---

## Features

| Feature | Description |
|---------|-------------|
| **Dashboard** | KPI cards, stale deal alerts, recent deals |
| **Pipeline** | Horizontal Kanban with stage columns + quick stage changes |
| **Deal List** | Searchable, filterable list with swipe-to-delete |
| **Deal Detail** | Full deal profile — metrics, contacts, score, tasks, buyers |
| **Add Deal** | Form + AI quick-add + voice capture |
| **Tasks** | Per-deal or all-deals task checklist |
| **Market Intelligence** | AI-powered comparable deals and investor info |
| **Settings** | Profile, app info, sign out |

## Architecture

```
ios/DealFlow/
├── DealFlowApp.swift          # App entry point
├── MainTabView.swift          # Tab navigation
├── Models/
│   ├── Deal.swift             # Deal + supporting models
│   ├── DealTask.swift         # Task model
│   └── Workspace.swift        # Workspace + profile models
├── Services/
│   ├── AuthService.swift      # Clerk authentication
│   ├── SupabaseService.swift  # Database via Supabase REST API
│   └── AIService.swift        # Vercel AI endpoints
├── ViewModels/
│   └── AppViewModel.swift     # Shared app state
├── Views/
│   ├── Authentication/        # Sign in screen
│   ├── Dashboard/             # KPI overview
│   ├── Pipeline/              # Kanban board
│   ├── Deals/                 # List + detail + add deal
│   ├── Tasks/                 # Task management
│   ├── News/                  # Market intelligence
│   └── Settings/              # App settings
└── Utils/
    ├── Constants.swift        # Config + env vars
    ├── Extensions.swift       # SwiftUI + Foundation helpers
    └── KeychainManager.swift  # Secure token storage
```

## Tech Stack

- **UI**: SwiftUI
- **Auth**: Clerk Frontend API (same credentials as web app)
- **Database**: Supabase REST API (direct to your existing database)
- **AI**: Vercel serverless functions (same backend as web app)
- **Storage**: Keychain for secure token persistence
- **Voice**: SFSpeechRecognizer for voice-to-deal capture

## Notes

- **No new backend needed** — connects directly to your existing Supabase + Vercel infrastructure
- **Same data** — reads and writes to the same database as the web app
- **Sign in** uses Clerk; requires email/password auth to be enabled in your Clerk dashboard
