# Code Challenge — Frontend

An Angular 21 dashboard application with JWT authentication, a live stock market view, interactive price charts, and full multilingual support (English, Arabic, German, Spanish).

## Features

- **Authentication** — login and register forms with reactive validation and JWT storage
- **Dashboard layout** — collapsible sidebar, top navbar with language selector and user menu
- **Stock market** — live stock cards with sparkline graphs, market filter (ALL / USA / EGX), search, and auto-refresh every 5 minutes
- **Stock detail modal** — real price history charts (via Yahoo Finance) for 7 periods (1D / 5D / 1M / YTD / 1Y / 5Y / Max), stats grid, prev-close reference line
- **i18n** — 4 languages (EN / AR / DE / ES), persisted to `localStorage`, RTL layout for Arabic (direction applied to page, body, and CDK overlay so dialogs flip correctly)
- **Route guard** — unauthenticated users are redirected to `/login`

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Angular 21 (standalone components, signals) |
| UI | Angular Material 21 (MDC), Tailwind CSS 4 |
| i18n | Custom `TranslatePipe` + `LanguageService` (JSON files in `/assets/i18n/`) |
| HTTP | `HttpClient` with auth interceptor (Bearer token) |
| Charts | Hand-crafted SVG (sparklines + detail chart) |
| E2E tests | Playwright |

## Getting Started

### Prerequisites

- Node.js 20+
- Angular CLI 21: `npm install -g @angular/cli`
- Backend running on port **3000** (see [code-challenge-be](../code-challenge-be))

### Install & run

```bash
npm install
ng serve
```

Open `http://localhost:4200`. The app proxies API requests to `http://localhost:3000`.

### Build for production

```bash
ng build
```

Output goes to `dist/code-challenge-fe/browser/`.

## Running E2E Tests

Tests use Playwright against the running dev server and a live backend.

```bash
# Run all tests (headless)
npx playwright test

# Run with UI explorer
npm run e2e:ui

# Run a single spec
npx playwright test e2e/login.spec.ts
```

Test files:

| File | What it covers |
|---|---|
| `e2e/login.spec.ts` | Login form validation and success flow |
| `e2e/register.spec.ts` | Register form and redirect to login |
| `e2e/dashboard-layout.spec.ts` | Sidebar, navbar, language selector, user menu, logout |
| `e2e/home.spec.ts` | Stock cards, search, market filter, detail modal |
| `e2e/language.spec.ts` | Language switching on auth and dashboard pages, RTL, persistence |

## Project Structure

```
src/
├── app/
│   ├── core/
│   │   ├── guards/          # AuthGuard — redirects to /login if no token
│   │   ├── interceptors/    # AuthInterceptor (adds Bearer), ErrorInterceptor
│   │   ├── pipes/           # TranslatePipe (impure, reacts to langChange$)
│   │   └── services/
│   │       ├── auth.service.ts       # Login, register, token storage
│   │       ├── language.service.ts   # Loads JSON, sets dir/lang on <html> + <body>
│   │       ├── stock.service.ts      # GET /api/stocks, GET /api/stocks/{symbol}/history
│   │       └── dashboard.service.ts  # GET /api/dashboard/stats|activity
│   ├── features/
│   │   ├── auth/
│   │   │   ├── login/        # Login page
│   │   │   └── register/     # Register page
│   │   ├── dashboard/
│   │   │   └── layout/       # Sidebar + navbar shell with router-outlet
│   │   └── home/
│   │       ├── home.*        # Stock grid, stats, activity feed
│   │       └── stock-detail-modal/  # Price history chart + stats modal
│   └── store/               # App state (signals)
├── assets/
│   └── i18n/
│       ├── en.json
│       ├── ar.json
│       ├── de.json
│       └── es.json
└── styles.scss              # Global Angular Material overrides (menus, dialog)
```

## i18n Keys Reference

Translation files are in `public/assets/i18n/{lang}.json` with the following top-level namespaces:

| Namespace | Content |
|---|---|
| `AUTH` | Login / register form labels, placeholders, errors |
| `NAV` | App name, sidebar links, logout, signed-in label |
| `HEADER` | Page titles |
| `HOME` | Greeting, subtitle, recent activity |
| `STOCKS` | Stock section labels, filters, stat grid labels (Open, High, Volume, etc.) |
| `LANGUAGE` | Language picker label |
