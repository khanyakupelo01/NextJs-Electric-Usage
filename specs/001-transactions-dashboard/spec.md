# Feature Specification: Transactions Dashboard

**Feature Branch**: `001-transactions-dashboard`

**Created**: 2026-10-04

**Status**: Draft

**Input**: User description: "Let build the ui dashboard, you use https://simcloud.co.za/api/transactions.html"

## Clarifications

### Session 2026-10-04

- Q: Should the transaction dashboard be for internal operations staff using one organization-wide SIMcloud account, or for authenticated end users viewing their own SIMcloud transaction history? → A: Authenticated end users viewing their own SIMcloud account.
- Q: How should a user's SIMcloud account be connected so the dashboard can retrieve only that user's transactions? → A: The authenticated backend already securely maps each user to their SIMcloud credential.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View recent transaction history (Priority: P1)

An authenticated end user opens the dashboard and sees the most recent airtime, data,
electricity, VAS, and SMS transactions processed on their own connected SIMcloud
account, without having to request a report from anyone else.

**Why this priority**: This is the core value of the dashboard — a single place to see
what has happened on the account. Without this, nothing else in the feature matters.

**Independent Test**: Can be fully tested by opening the dashboard with a valid date
range and confirming transactions for that period are listed newest-first with their
service, status, reference, and timestamps.

**Acceptance Scenarios**:

1. **Given** the dashboard is opened with no prior filters set, **When** the user selects
   a start date and an end date within the last 90 days, **Then** the dashboard shows all
   matching transactions for that range, ordered from most recent to oldest.
2. **Given** a selected date range, **When** the user narrows the view to one or more
   specific services (airtime, data, electricity, VAS, or SMS), **Then** only
   transactions for the selected services are shown.
3. **Given** a date range with no matching transactions, **When** the results are
   displayed, **Then** the dashboard clearly states that no transactions were found for
   that range and filter selection.
4. **Given** an authenticated user with a connected SIMcloud account, **When** the user
   views transaction history, **Then** only transactions for that user's account are
   shown and the account credential is never disclosed.

---

### User Story 2 - Browse beyond the first page of results (Priority: P2)

An authenticated end user reviewing a busy period needs to see every transaction in the
selected date range, not just the first batch, so that no record is missed during a
reconciliation review.

**Why this priority**: Date ranges can include far more transactions than fit on one
screen. Without paging, users cannot trust that they have seen the complete picture.

**Independent Test**: Can be fully tested by selecting a date range known to contain
more results than the current page size, loading the next page, and confirming
additional transactions appear without duplicating or skipping any already-shown record.

**Acceptance Scenarios**:

1. **Given** more transactions exist for the current filters than are shown on the page,
   **When** the user requests more results, **Then** the next set of transactions loads
   and is appended in the same newest-first order.
2. **Given** the user has loaded several pages of results, **When** the user changes the
   date range or service filter, **Then** the dashboard discards the old page sequence
   and starts a fresh first page for the new filters.
3. **Given** all available transactions for the current filters have been loaded,
   **When** the user reaches the end, **Then** the dashboard indicates there are no more
   results to load.

---

### User Story 3 - Investigate failed transactions (Priority: P3)

An authenticated end user needs to quickly spot transactions that failed, understand why they
failed where that detail is available, and find the related reference so they can
follow up with the correct party.

**Why this priority**: Failures are a key reason users consult transaction history.
Making failures stand out and explaining why they happened helps users decide what
follow-up is needed.

**Independent Test**: Can be fully tested by loading a date range containing failed
transactions and confirming each failed transaction is visually distinguished from
successful and pending ones and shows its failure reason when one is recorded.

**Acceptance Scenarios**:

1. **Given** a loaded list of transactions, **When** the user scans the list,
   **Then** success, failed, and pending transactions are visually distinguishable from
   one another at a glance.
2. **Given** a failed transaction with a recorded failure reason, **When** the user views
   that transaction, **Then** the reason is displayed alongside it.
3. **Given** a failed transaction with no recorded failure reason, **When** the user
   views that transaction, **Then** the dashboard clearly indicates that no reason is
   available rather than showing a blank or misleading value.
4. **Given** a pending SMS transaction, **When** the user views it, **Then** the
   dashboard indicates that SMS remains pending until a delivery confirmation is
   received, so users do not mistake it for a stuck transaction.

---

### Edge Cases

- What happens when the user selects a date range longer than the allowed 90 days? The
  dashboard MUST prevent the request and explain the limit before contacting the API.
- What happens when the end date is earlier than the start date? The dashboard MUST
  block the request and prompt the user to correct the range.
- What happens when the connected account's access token is missing, invalid, or has
  expired? The dashboard MUST show that access could not be verified and MUST NOT
  display any transaction data or a confusing empty state.
- What happens when the transactions service is temporarily unavailable or times out?
  The dashboard MUST show a clear error state with the option to try again, and MUST
  not silently show stale or partial data as if it were current.
- What happens when a transaction has no reference or no failure reason recorded? The
  dashboard MUST show an explicit "not provided" indicator rather than leaving the
  field blank or omitting it.
- What happens when the user changes filters while a page of results is still loading?
  The dashboard MUST ensure the in-flight request's results are not shown if they no
  longer match the current filters.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The dashboard MUST require the user to choose an inclusive start date and
  an inclusive end date before any transactions are requested or displayed.
- **FR-002**: The dashboard MUST reject or auto-correct a selected date range that spans
  more than 90 days, with a clear explanation, before any request is made.
- **FR-003**: The dashboard MUST allow the user to narrow results to one or more
  transaction services: airtime, data, electricity, VAS, and SMS. When no service is
  selected, all services MUST be included.
- **FR-004**: The dashboard MUST display, for each transaction, its service type,
  normalized status, reference, and the created and last-updated timestamps.
- **FR-005**: The dashboard MUST display transactions in newest-first order, matching
  the order returned for the selected filters.
- **FR-006**: The dashboard MUST visually distinguish the three possible statuses
  (success, failed, pending) so a user can tell them apart without reading each row in
  detail.
- **FR-007**: When a transaction has failed and a failure reason is available, the
  dashboard MUST display that reason next to the transaction.
- **FR-008**: The dashboard MUST let the user load additional pages of results for the
  current filters and MUST preserve the newest-first order across pages without
  duplicating or omitting transactions.
- **FR-009**: The dashboard MUST discard any in-progress or completed pagination state
  and start over from the first page whenever the date range or service filter changes.
- **FR-010**: The dashboard MUST tell the user when there are no more results to load
  for the current filters.
- **FR-011**: The dashboard MUST inform the user when access cannot be verified (for
  example, an expired or missing credential) in a way that is distinct from "no
  transactions found," without displaying any transaction data in that state.
- **FR-012**: The dashboard MUST inform the user, in plain language, when the selected
  filters are invalid (for example, an out-of-range date span) before or instead of
  showing a generic failure.
- **FR-013**: The dashboard MUST inform the user when the transaction history cannot be
  retrieved due to a temporary service problem and MUST offer a way to retry the
  request.
- **FR-014**: The dashboard MUST NOT display pricing, wallet balances, recipient
  details, SMS message content, electricity tokens, or voucher codes, since this
  information is intentionally not part of transaction history.
- **FR-015**: The dashboard MUST indicate, for a pending SMS transaction, that pending
  status reflects awaiting delivery confirmation rather than an error.
- **FR-016**: The dashboard MUST be available only to authenticated end users and MUST
  show each user transactions from that user's own connected SIMcloud account.
- **FR-017**: The dashboard MUST prevent a user from viewing transactions belonging to
  another user's SIMcloud account.
- **FR-018**: The dashboard's initial release MUST NOT include exporting or downloading
  the transaction list; reviewing and filtering results on-screen is the only supported
  method of consuming this data in this release.
- **FR-019**: For each authenticated user, the system MUST retrieve transaction history
  using the SIMcloud credential securely associated with that user, without disclosing
  the credential to the user.

### Key Entities

- **Transaction**: A single processed action on one user's connected account (airtime,
  data, electricity, VAS, or SMS). Each transaction belongs to only that account. Key
  attributes: identifier, service type, normalized
  status (success, failed, pending), failure reason (when applicable and available),
  reference, created timestamp, and last-updated timestamp. Excludes pricing, wallet,
  recipient, message content, token, and voucher information by design.
- **Transaction Query**: The combination of filters a user applies to retrieve a set of
  transactions: inclusive start date, inclusive end date (span no greater than 90
  days), optional set of selected services, and page size.
- **Result Page**: One batch of transactions returned for a Transaction Query, including
  whether a further page is available to load.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can view transaction history for a chosen date range and see
  results on screen within 5 seconds under normal conditions.
- **SC-002**: A user can narrow a transaction list down to a single service type in two
  actions or fewer.
- **SC-003**: 100% of failed transactions shown on the dashboard display either a
  failure reason or an explicit "no reason provided" indicator, so users never see a
  blank or ambiguous failure.
- **SC-004**: A user can review every transaction in a valid date range, regardless of
  volume, by repeatedly loading more results, with zero duplicated or missing
  transactions across pages.
- **SC-005**: 100% of invalid date-range selections (spans over 90 days, or an end date
  before a start date) are caught and explained to the user before any data request is
  attempted.
- **SC-006**: When account access cannot be verified, 100% of affected users see a
  distinct access-problem message rather than an empty or misleading transaction list.

## Assumptions

- The dashboard is a customer-facing feature for authenticated end users, and each
  user has a connected SIMcloud account whose transaction history must remain private
  to that user.
- The authenticated account service already securely associates each user with their
  own SIMcloud credential; this feature does not add a credential-entry or account-linking
  flow.
- Exporting or downloading transaction data (for example, to a spreadsheet) is useful
  but out of scope for this release; it may be considered as a future enhancement.
- "Normalized status" refers to the three values the transaction history source
  provides (success, failed, pending); the dashboard does not invent additional status
  values.
- Default page size follows the transaction history source's default when the user has
  not chosen otherwise, and the user is not required to understand pagination mechanics
  beyond "load more."
- Users have standard business-hours access to the dashboard from a desktop browser;
  no offline or low-connectivity mode is required for this release.
