---
description: "Implementation tasks for the transactions dashboard"
---

# Tasks: Transactions Dashboard

**Input**: Design documents from `/specs/001-transactions-dashboard/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/transactions-api.md](./contracts/transactions-api.md), [quickstart.md](./quickstart.md)

**Organization**: Tasks are grouped by user story to support incremental implementation and validation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: The task can run in parallel with other marked tasks because it uses separate files and has no incomplete prerequisite.
- **[Story]**: User story identifier from `spec.md`.
- Tests are included because the project constitution requires automated validation of changed input, access, and client behavior.

## External Integration Prerequisite

The inspected frontend repository contains no authenticated session provider or backend transactions endpoint. The authenticated backend must expose or align with `GET /api/v1/transactions` and resolve the current user's SIMcloud credential as defined in [contracts/transactions-api.md](./contracts/transactions-api.md). The frontend must also integrate with the application's authenticated session lifecycle for account-scoped caching; do not invent or expose SIMcloud credentials. Mocked UI and contract tests can proceed independently; live-data acceptance requires this backend/session integration.

---

## Phase 1: Setup

**Purpose**: Install requested libraries and configure styling and test tooling.

- [X] T001 Install `tailwindcss`, `@tailwindcss/postcss`, `@tanstack/react-query`, Jest, jsdom, and React Testing Library dependencies and add the test script in `package.json` and `yarn.lock`.
- [X] T002 [P] Configure Tailwind CSS v4 in `postcss.config.mjs` and create the Tailwind entry stylesheet in `src/styles/globals.css`.
- [X] T003 [P] Configure the Next.js Jest environment and matcher setup in `jest.config.js` and `jest.setup.js`.

## Phase 2: Foundational

**Purpose**: Establish shared query state and the authenticated native-fetch service layer required by all stories.

- [X] T004 [P] Initialize a request-safe `QueryClient` provider and import `src/styles/globals.css` in `src/pages/_app.js`; do not create a module-level shared client.
- [X] T005 [P] Implement the shared native-fetch wrapper in `src/services/api.js`, centralizing `NEXT_PUBLIC_API_BASE_URL`, authenticated-session forwarding, JSON parsing, normalized errors, and `AbortSignal` support; never include a SIMcloud credential.

**Checkpoint**: Shared dependencies, styling, test runner, query provider, and API wrapper are ready.

---

## Phase 3: User Story 1 - View recent transaction history (Priority: P1) 🎯 MVP

**Goal**: Let an authenticated user apply a valid date range and optional service filters and see only their own newest-first transaction results, including clear empty and access/error states.

**Independent Test**: With mocked authenticated API responses, apply a valid date range and confirm results show the returned service, status, reference, and timestamps in newest-first order; confirm service filters are sent, empty results are distinct from errors, and no result request occurs for invalid or incomplete dates.

### Tests for User Story 1

- [X] T006 [P] [US1] Test required dates, reversed dates, the inclusive 90-day limit in `Africa/Johannesburg`, and supported service values in `__tests__/transactions-filters.test.js`.
- [X] T007 [P] [US1] Test API query serialization, response parsing, and normalized `400`/`401`/`403`/`5xx` errors against `specs/001-transactions-dashboard/contracts/transactions-api.md` in `__tests__/transactions-api.test.js`.
- [X] T008 [P] [US1] Test initial loading, valid newest-first results, empty results, access failures, and retryable service failures in `__tests__/transactions-dashboard.test.js`.

### Implementation for User Story 1

- [X] T009 [US1] Implement date-range and service-filter validation and normalization in `src/features/transactions/filters.js`; require both dates and reject reversed or over-90-inclusive-day ranges before requests.
- [X] T010 [US1] Implement the transaction endpoint service in `src/services/transactions.js`; call the authenticated versioned API through `src/services/api.js` with `date_from`, `date_to`, optional comma-separated `type`, and a default `limit` of 50.
- [X] T011 [US1] Implement the filter-keyed transaction query in `src/features/transactions/hooks/useTransactions.js`; use the authenticated user's stable non-secret identity when available, consume the wrapper's abort signal, and pass the opaque cursor unchanged.
- [X] T012 [US1] Build the dashboard, filter form, and initial transaction list in `src/features/transactions/components/TransactionsDashboard.js`, `src/features/transactions/components/TransactionFilters.js`, `src/features/transactions/components/TransactionList.js`, and `src/features/transactions/components/TransactionRow.js`; include loading, validation, empty, access-error, service-error, and retry states.
- [X] T013 [US1] Replace the placeholder home page with the transactions dashboard in `src/pages/index.js`.

**Checkpoint**: User Story 1 works independently with mocked responses and obeys the documented authenticated API boundary.

---

## Phase 4: User Story 2 - Browse beyond the first page (Priority: P2)

**Goal**: Let users append every cursor page for the active filters without losing, duplicating, or reordering results.

**Independent Test**: Return multiple mocked pages and verify the next request passes the previous opaque cursor with identical date/service filters, appended rows remain newest-first without duplicates, changing applied filters restarts at the first page, and the UI indicates when no further page exists.

### Tests for User Story 2

- [X] T014 [P] [US2] Test cursor progression, retained filter parameters, cancellation on filter change, non-duplicating page append, and end-of-results behavior in `__tests__/use-transactions.test.js`.

### Implementation for User Story 2

- [X] T015 [US2] Complete cursor-page selection and next-page loading/error state in `src/features/transactions/hooks/useTransactions.js`; retain the same active date/service filters and use the returned opaque cursor unchanged.
- [X] T016 [P] [US2] Add a guarded “Load more” action, appended page rendering, and explicit end-of-results state in `src/features/transactions/components/TransactionList.js`.

**Checkpoint**: User Story 2 passes the multi-page independent test without changing User Story 1 behavior.

---

## Phase 5: User Story 3 - Investigate failed transactions (Priority: P3)

**Goal**: Make success, failure, and pending states easy to distinguish and show available failure details, explicit missing-value indicators, and the SMS delivery-pending explanation.

**Independent Test**: Render success, failed-with-reason, failed-without-reason, pending SMS, and missing-reference transactions; verify their states are identifiable without color alone and that no value is blank or misleading.

### Tests for User Story 3

- [X] T017 [P] [US3] Test all transaction status variants, failure reason fallback, missing reference fallback, and pending SMS explanation in `__tests__/transaction-status.test.js`.

### Implementation for User Story 3

- [X] T018 [P] [US3] Implement accessible status labels and distinct status styling in `src/features/transactions/components/TransactionStatus.js`.
- [X] T019 [P] [US3] Render failure reasons or an explicit unavailable label, missing references, and the pending-SMS delivery explanation in `src/features/transactions/components/TransactionRow.js`.

**Checkpoint**: User Story 3 adds failure investigation details while retaining all behavior from User Stories 1 and 2.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Close account-cache isolation, responsive/accessibility checks, and the release validation loop.

- [X] T020 Add regression tests proving transaction results are not reused across account changes or sign-out in `__tests__/use-transactions.test.js` and `__tests__/app-session-cache.test.js`.
- [X] T021 Integrate the dashboard query cache with the authenticated session identity in `src/pages/_app.js`, `src/features/transactions/hooks/useTransactions.js`, and `src/features/transactions/userIdentity.js`; scope queries by stable non-secret user identity and clear previous-account transaction data on logout or account switch.
- [ ] T022 Verify keyboard, screen-reader labels, narrow-screen layout, and status distinction without color alone in `src/features/transactions/components/TransactionsDashboard.js`, `src/features/transactions/components/TransactionFilters.js`, `src/features/transactions/components/TransactionList.js`, and `src/features/transactions/components/TransactionStatus.js`; then run [quickstart.md](./quickstart.md), the focused Jest suite, and `yarn build`.

**T022 release prerequisite**: Keyboard/screen-reader inspection, a narrow viewport check, the automated test suite, and production build have passed. End-to-end live-data validation remains blocked until the authenticated session supplies `currentUser.id` and the backend implements the documented transactions contract.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No prerequisites. T002 and T003 can run in parallel after T001.
- **Foundational (Phase 2)**: Depends on Setup. T004 and T005 can run in parallel after T001–T003.
- **User Story 1 (Phase 3)**: Depends on the foundational phase; this is the MVP.
- **User Story 2 (Phase 4)**: Depends on User Story 1's transaction query and list.
- **User Story 3 (Phase 5)**: Depends on User Story 1's transaction row and list. It can be developed in parallel with User Story 2 after User Story 1 is complete, provided changes remain in the separate pagination and status files.
- **Polish (Phase 6)**: Depends on the selected story implementations; T020 regression coverage precedes T021 cache lifecycle handling, and T022 runs after the selected changes.

### User Story Dependencies

- **US1 (P1)**: Starts after foundational tasks. No dependency on another story.
- **US2 (P2)**: Extends the US1 query and list to expose pagination.
- **US3 (P3)**: Extends the US1 transaction row with status and failure detail presentation. Independent of US2 after US1 is complete.

### Parallel Opportunities

- After T001, Tailwind setup (T002) and Jest setup (T003) touch separate configuration files and can proceed in parallel.
- After setup, the QueryClient provider (T004) and shared fetch wrapper (T005) are independent.
- The three US1 test files (T006–T008) are independent and can be authored in parallel; filter validation (T009) and API service work (T010) can also proceed in parallel after foundational work.
- After US1 is complete, US2 pagination work and US3 status-detail work can proceed in parallel because they focus on different UI/test files.
- Account-cache regression coverage (T020) precedes cache integration (T021); they are intentionally sequential.

### Parallel Example: User Story 1

```text
Task: T006 — date-range and service-filter tests in __tests__/transactions-filters.test.js
Task: T007 — API serialization/error tests in __tests__/transactions-api.test.js
Task: T008 — initial dashboard-state tests in __tests__/transactions-dashboard.test.js
```

### Parallel Example: User Stories 2 and 3

```text
Task: T014 — cursor paging tests in __tests__/use-transactions.test.js

# With the cursor API established by US1, these files can be completed in parallel:
Task: T015 — cursor-page state in src/features/transactions/hooks/useTransactions.js
Task: T016 — pagination controls in src/features/transactions/components/TransactionList.js
```

### Parallel Example: User Story 3

```text
Task: T017 — status/detail tests in __tests__/transaction-status.test.js

# Once the US1 row/status components exist, these separate files can be updated in parallel:
Task: T018 — status presentation in src/features/transactions/components/TransactionStatus.js
Task: T019 — failure details in src/features/transactions/components/TransactionRow.js
```

## Implementation Strategy

### MVP First (User Story 1)

1. Complete Setup and Foundational phases.
2. Implement and test User Story 1 only.
3. Validate its independent test using the mocked API; verify no request is made with invalid dates and credentials never reach the browser.
4. Verify the authenticated backend contract is available before live-data acceptance.

### Incremental Delivery

1. Add User Story 2 cursor pagination and verify the full date range can be traversed without duplicate client rendering.
2. Add User Story 3 failure/status details and verify missing-value and pending-SMS behavior.
3. Complete session-cache isolation, responsive/accessibility checks, quickstart scenarios, and production build.
