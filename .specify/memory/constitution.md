<!--
Sync Impact Report
Version change: 1.0.0 → 1.1.0
Modified principles: none
Added sections: none (Additional Constraints expanded with fetch + TanStack Query service rules)
Removed sections: none
Follow-up TODOs: Confirm the original ratification date.
-->

# E-Tariff API Constitution

## Purpose

Provide a secure Express API for the E-Tariff electricity dashboard. The API manages
authenticated users' tariff settings, electricity purchases, meter readings, dashboard
calculations, and in-app alerts.

## Core Principles

### I. Backend Owns Business Rules

The backend MUST be the source of truth for tariff-band calculations, monthly billing-period
calculations, kWh and spending totals, projected usage, threshold-alert decisions, and monthly
purchase reminders. The frontend MAY display these results but MUST NOT be the authoritative
source for these calculations. This keeps results consistent across clients and prevents
client-side changes from becoming trusted business data.

### II. Accurate Calculations

Electricity measurements MUST be stored in kWh. Currency MUST use decimal-safe database types
and application logic; JavaScript floating-point arithmetic MUST NOT be the final authority for
money. Actual measurements and purchases MUST be distinguished from estimates and projections
in API responses and dashboard calculations. The API MUST NOT create tariff alerts when tariff
information is missing or invalid.

### III. Configurable Tariffs

Because tariffs differ by municipality and electricity provider, each user MUST be able to
configure a billing-month start day, timezone, tariff bands and kWh thresholds, optional price
per kWh, and alert thresholds. The API MUST NOT assume that any tariff schedule applies
universally.

### IV. Security and Authorization

Every endpoint that handles personal electricity data MUST require authentication. Every read,
update, and delete operation MUST authorize access using the owning user's identity. The API
MUST validate every request and MUST NOT return passwords, secrets, payment data, or another
user's records. Database URLs, secrets, CORS origins, and credentials MUST be supplied through
environment variables. The API MUST NOT automatically purchase electricity or store payment-card
details.

### V. Stable, Versioned API Contracts

HTTP routes MUST be versioned (for example, `/api/v1/...`). Responses MUST use consistent JSON
shapes and meaningful error messages, and request and response contracts MUST be documented.
Changes to API contracts consumed by the frontend MUST be coordinated with corresponding
integration updates in `khanyakupelo01/e-tarrif-ui`. This prevents undocumented contract drift
between the API and its client.

### VI. Automated Business-Rule and Access Tests

Automated tests MUST cover tariff-band selection, tariff-threshold progress, spending and kWh
totals, monthly billing-period boundaries, first-of-month reminders in the user's timezone,
input validation, authentication, and user authorization. Each feature MUST add or update tests
for the rules and access paths it changes; untested business-rule changes are incomplete.

## Additional Constraints

- Runtime: Node.js.
- HTTP framework: Express.
- Database: PostgreSQL.
- Deployment platform: Render.
- Frontend client: the Next.js application in `khanyakupelo01/e-tarrif-ui`.
- Client service layer: services that call the API MUST use the native `fetch` API, and
  server state (queries, mutations, caching, and invalidation) MUST be managed with TanStack
  Query. Other HTTP client libraries (for example, Axios) MUST NOT be introduced.
- Services MUST centralise the base URL (from environment variables), JSON handling, and error
  normalisation in a shared `fetch` wrapper, and components MUST consume data through TanStack
  Query hooks rather than calling `fetch` directly.

These technologies define the supported integration and deployment context. A change to this
stack requires an amendment to this constitution.

## Development Workflow

A backend feature is complete only when:

- Its API contract is documented.
- Request validation and ownership-based authorization are implemented.
- Required database migrations are included.
- The affected business rules and access controls are covered by automated tests.
- Errors are handled safely without disclosing secrets or another user's data.
- Corresponding frontend integration requirements are identified, including any coordinated
  client changes.

Reviews MUST check the Definition of Done and the Core Principles. Changes that cannot satisfy a
requirement MUST explain the exception and its mitigation in the change proposal.

## Governance

This constitution is the governing standard for E-Tariff API design, implementation, and review.
Amendments MUST update this document, state the rationale and impact, and receive review before
they are adopted. Changes to API contracts used by the frontend MUST identify the required
coordination with the frontend repository.

Constitution versions use semantic versioning (`MAJOR.MINOR.PATCH`). A MAJOR increment is
required for backward-incompatible removal or redefinition of a principle. A MINOR increment is
required for a new principle or a material expansion of governance requirements. A PATCH
increment is used for clarifications and non-semantic refinements. The version and last-amended
date MUST be updated with every adopted amendment.

Contributors and reviewers MUST assess compliance with this constitution during feature and
change review. Any exception MUST be explicit, justified, and paired with a mitigation; silent
deviations are not permitted.

**Version**: 1.1.0 | **Ratified**: TODO(RATIFICATION_DATE): original adoption date is unknown | **Last Amended**: 2026-10-04
