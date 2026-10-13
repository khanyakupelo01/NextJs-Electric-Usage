# Implementation Plan: Transactions Dashboard

**Branch**: `001-transactions-dashboard` | **Date**: 2026-10-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-transactions-dashboard/spec.md`

## Summary

Build a responsive, authenticated transaction dashboard in the existing Next.js
Pages Router frontend. Users choose an inclusive date range and optional service
filters, review transaction status and failure details, and page through results
using the SIMcloud cursor. Use Tailwind CSS for styling, TanStack Query for
server-state and cursor pagination, and the native `fetch` API through a shared
client wrapper. The browser calls the authenticated, versioned E-Tariff API, which
uses the authenticated user's associated SIMcloud credential server-side; SIMcloud
credentials are never sent to the browser.

## Technical Context

**Language/Version**: JavaScript (ES modules); Node.js version constrained by the existing `.node-version`.

**Primary Dependencies**: Existing Next.js 16 / React 19; add Tailwind CSS v4 and
`@tanstack/react-query`. Use native `fetch`; do not add another HTTP client.

**Storage**: None in the frontend. Transaction data remains server state in
TanStack Query memory and is not persisted to browser storage.

**Testing**: Add Jest using Next.js `next/jest`, React Testing Library, and
`jest-environment-jsdom`. Test input validation, query behavior/pagination,
transaction rendering, and authentication/error/empty states with mocked
responses; run the Next.js production build.

**Target Platform**: Existing Next.js web application on Render, for desktop and
mobile browsers.

**Project Type**: Frontend web application (Next.js Pages Router).

**Performance Goals**: Meet the spec's user-visible outcome: valid first-page
results appear within 5 seconds under normal conditions. Fetch pages of 50 by
default, within the upstream limit of 1–100.

**Constraints**:
- Require both dates before fetching; reject reversed or over-90-day inclusive
  ranges before any request.
- Interpret range dates in `Africa/Johannesburg`; preserve the opaque cursor and
  the same date and service filters when requesting subsequent pages.
- Use only the authenticated E-Tariff API. Never call the SIMcloud endpoint from
  the browser or expose a SIMcloud credential through environment variables,
  client code, page props, or API responses.
- Centralize API base URL, JSON handling, and error normalization in the shared
  `fetch` wrapper. Components consume server state only through TanStack Query.
- The repository currently has no authentication UI, API service, styling setup,
  or test runner. Reuse the existing authenticated session/backend integration
  when available; coordinate any missing backend contract support before release.

**Scale/Scope**: One dashboard page and its transaction filtering, status display,
error/empty/loading states, and cursor-based pagination. At most 90 inclusive
calendar days per query; no transaction export or local persistence.

## Constitution Check

**Pre-design gate**

- **Backend owns business rules**: Pass. The frontend only validates request
  filters and displays backend results; it does not calculate tariffs, billing,
  or transaction outcomes.
- **Accurate calculations**: Pass. No monetary or kWh calculations are in scope.
- **Configurable tariffs**: Pass. Tariff configuration is not part of this feature.
- **Security and authorization**: Pass with an integration prerequisite. The
  authenticated backend must authorize the current user and resolve that user's
  SIMcloud credential. The frontend neither accepts nor exposes the SIMcloud
  credential and must not show transaction data when access is unverified. Clear
  transaction query cache on logout or authenticated-user change to prevent
  previously cached records from appearing across accounts in the same browser.
- **Stable, versioned API contracts**: Pass. Document the expected frontend
  contract for `GET /api/v1/transactions`; align or implement it in the
  authenticated backend before integration ships.
- **Automated tests**: Pass by plan. Add focused validation, access-state,
  pagination, and rendering tests; no affected business-rule calculations are
  introduced.
- **Client service layer**: Pass. Use native `fetch`, a shared error-normalizing
  wrapper, and TanStack Query hooks; do not introduce Axios or component-level
  direct `fetch` calls.

**Post-design gate**: Pass. The artifacts preserve all gates: the UI consumes a
versioned authenticated API contract, cursor state is scoped to active filters,
user-specific data is not persisted or globally cached, and cached transaction
data is cleared when the authenticated user changes. Test coverage is planned.
No constitution exception is required.

## Project Structure

### Documentation (this feature)

```text
specs/001-transactions-dashboard/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
    └── transactions-api.md
```

### Source Code (repository root)

```text
src/
├── pages/
│   ├── _app.js                         # QueryClient provider and global CSS
│   └── index.js                        # Dashboard route
├── styles/
│   └── globals.css                     # Tailwind import and global base styles
├── services/
│   ├── api.js                          # Shared native-fetch wrapper
│   └── transactions.js                 # Transaction endpoint/query construction
└── features/
    └── transactions/
        ├── hooks/
        │   └── useTransactions.js      # Filter-keyed infinite query
        └── components/
            ├── TransactionsDashboard.js
            ├── TransactionFilters.js
            ├── TransactionList.js
            ├── TransactionRow.js
            └── TransactionStatus.js

__tests__/
├── transactions-api.test.js
├── use-transactions.test.js
└── transactions-dashboard.test.js
```

**Structure Decision**: Keep the feature in the existing single Next.js project
and Pages Router. Replace the current placeholder home page with the dashboard;
place its focused UI under `src/features/transactions`, shared fetch services
under `src/services`, and Tailwind's global stylesheet under `src/styles`.
Testing remains in a root `__tests__` directory because the project has no
existing test layout.

## Integration Prerequisite

The inspected repository is a frontend-only starter and does not contain the
authenticated account service or a transaction endpoint. The backend must expose
or align with the frontend contract in
[contracts/transactions-api.md](./contracts/transactions-api.md), including
current-user authorization and server-side SIMcloud credential selection. The
contract and any corresponding backend changes must be coordinated with the
backend repository as required by the constitution.

## Complexity Tracking

No constitution violations or extra project boundaries are introduced.
