# Research: Transactions Dashboard

## Existing project context

- The repository is a Next.js 16 / React 19 frontend using the Pages Router under
  `src/pages/`; its home page is currently a placeholder.
- It has no Tailwind setup, TanStack Query dependency, transaction service,
  authentication UI, or test runner.
- The package manifest has pre-existing local edits. Implementation should
  preserve them while adding the dependencies and scripts required by this plan.
- The specification's clarification establishes that the authenticated backend
  already maps each user to their own SIMcloud credential. This frontend
  repository does not contain that backend.

## Decisions

### Keep the existing Pages Router

**Decision**: Implement the dashboard in the existing Pages Router and avoid a
router migration.

**Rationale**: The project already uses `src/pages` and the feature does not
require a new routing architecture. TanStack Query can be initialized in
`_app.js` for this router.

**Alternatives considered**: Migrating to the App Router would add unrelated
scope and make the feature harder to review independently.

### Use Tailwind CSS v4 with the Pages Router global stylesheet

**Decision**: Add Tailwind CSS v4 with the Next.js-supported PostCSS plugin,
import its CSS entry point from `src/pages/_app.js`, and keep any small global
base styles in `src/styles/globals.css`.

**Rationale**: The official Next.js CSS guide documents this setup and importing
global CSS from `_app.js` for the Pages Router. Tailwind is explicitly requested.

**Alternatives considered**: Tailwind v3 configuration or a separate component
styling library are unnecessary for this new feature and would add setup or
dependency overhead.

**Source**: [Next.js Pages Router CSS and Tailwind guide](https://nextjs.org/docs/pages/getting-started/css).

### Manage server state with TanStack Query and cursor pagination

**Decision**: Initialize a `QueryClient` in the `_app.js` component (not as a
module-level singleton) and use `useInfiniteQuery` for the transaction list.
Query keys include the active inclusive date range and normalized selected
service set. Pass TanStack Query's `AbortSignal` through the shared `fetch`
wrapper. Use the returned opaque cursor unchanged as the next page parameter.
Scope transaction cache to the active user (including that user's stable
non-secret identity when available) and clear it on logout or account switch.

**Rationale**: Query-key scoping resets the page sequence when active filters
change; using the supplied abort signal prevents results from obsolete in-flight
requests from being applied. The cursor is opaque and must be used with the same
range and service filter. Including user identity and clearing transaction cache
on authentication changes prevents a prior user's cached pages from appearing
after an account switch. Each test gets a fresh QueryClient and query retries
are disabled for deterministic failure-state tests.

**Alternatives considered**: Offset pagination can skip or duplicate results as
new transactions arrive. A module-global QueryClient risks sharing user-specific
cache state across server-rendered requests.

**Sources**:
- [TanStack Query server rendering and Pages Router setup](https://tanstack.com/query/latest/docs/framework/react/guides/ssr)
- [TanStack Query keys](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys)
- [TanStack infinite queries](https://tanstack.com/query/latest/docs/framework/react/guides/infinite-queries)
- [TanStack query cancellation](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation)
- [TanStack Query testing](https://tanstack.com/query/latest/docs/framework/react/guides/testing)

### Keep credentials behind the authenticated backend

**Decision**: The browser requests the application's authenticated, versioned
transactions endpoint using the existing user session. The shared client reads
only the public API base URL from frontend configuration. The backend resolves
the current user's SIMcloud credential and calls SIMcloud; no SIMcloud API
credential is used in browser code, public environment variables, serialized
page props, or UI state.

**Rationale**: The SIMcloud endpoint requires a credential. Exposing it to the
browser would violate the clarified account-privacy requirement. The local
repository contains no backend endpoint or auth integration, so the endpoint
contract must be coordinated with the authenticated backend before release.

**Alternatives considered**: Calling SIMcloud directly from the browser is
rejected because it exposes the provider credential and bypasses the user's
backend authorization boundary.

**Sources**:
- [Next.js Pages Router environment variables](https://nextjs.org/docs/pages/guides/environment-variables)
- [SIMcloud Transaction History API documentation](https://simcloud.co.za/api/transactions.html)

### Centralize fetch behavior and present request errors in the dashboard

**Decision**: The shared native-`fetch` wrapper centralizes the configured API
base URL, JSON parsing, session inclusion as provided by the application's
existing auth mechanism, and a typed normalized error. The transactions service
builds the query string. The dashboard renders input-validation, unauthenticated
or account-access, temporary-service-error, empty, initial-loading, and
load-more states distinctly.

**Rationale**: This follows the constitution's frontend service requirements and
the specification's separate failure and empty-state expectations. Expected
HTTP failures belong to the query/UI flow rather than a generic page-level
render-error fallback.

**Alternatives considered**: Component-level `fetch` calls duplicate URL/error
handling and bypass TanStack Query. A single generic error screen would conflate
invalid filters, account access, and temporary service failures.

**Sources**:
- [Next.js API routes in the Pages Router](https://nextjs.org/docs/pages/building-your-application/routing/api-routes)
- [Next.js custom error pages](https://nextjs.org/docs/pages/building-your-application/routing/custom-error)

### Add focused test tooling using the Next.js Jest integration

**Decision**: Add Jest through the `next/jest` integration and use React Testing
Library with jsdom. Cover the date-range validator, service query serialization,
error normalization, cursor transitions/cancellation, and key dashboard states.

**Rationale**: The repository has no test runner. The official Pages Router
testing guide documents Jest integration for Next.js, and TanStack Query's
testing guide recommends an isolated QueryClient and disabling retries in tests.

**Alternatives considered**: Vitest is a reasonable option but has no project
precedent here; use the first-party Next.js integration to minimize configuration
for this Pages Router app.

**Sources**:
- [Next.js Pages Router Jest testing guide](https://nextjs.org/docs/pages/guides/testing/jest)
- [TanStack Query testing guide](https://tanstack.com/query/latest/docs/framework/react/guides/testing)

## API facts from SIMcloud documentation

- The upstream endpoint is `GET https://simcloud.co.za/api/transactions.php`.
- `date_from` and `date_to` are inclusive `YYYY-MM-DD` dates; dates are
  interpreted in `Africa/Johannesburg`; the range may not exceed 90 days.
- Optional service types are airtime, data, electricity, VAS, and SMS.
- The upstream limit is 1–100 (default 50); pagination uses an opaque
  `cursor`/`next_cursor`.
- Upstream results are newest-first and contain transaction ID, service, status,
  optional reason, reference, and created/updated timestamps.
- The upstream API deliberately omits pricing, wallet values, recipients, SMS
  content, electricity tokens, and voucher codes. SMS can remain pending until
  a delivery receipt is received.
- Upstream documents 400 for invalid query values and 401 for a missing or
  invalid provider credential. The authenticated backend must translate these
  into the frontend API's safe, user-appropriate error contract.

## Known integration dependency

The exact authenticated backend route and authentication/session mechanism are
not present in the inspected frontend repository. The plan uses the
constitution-required versioned route `GET /api/v1/transactions` and records its
expected request and response in the contract artifact. This is a contract to
align or implement in the backend, not a claim that this route already exists.
