# Data Model: Transactions Dashboard

The dashboard consumes read-only transaction data and query state. It does not
persist transaction records locally or calculate monetary values.

## Transaction

Represents one completed, failed, or pending service operation belonging to the
authenticated user's connected SIMcloud account.

| Field | Type | Rules |
|---|---|---|
| `id` | string | Required stable identifier, unique within the account; upstream format is service-prefixed. |
| `service` | enum | Required: `airtime`, `data`, `electricity`, `vas`, or `sms`. |
| `status` | enum | Required: `success`, `failed`, or `pending`. |
| `reason` | string or null | Optional failure detail; display an explicit unavailable indicator when absent. |
| `reference` | string or null | Optional external reference; display an explicit unavailable indicator when absent. |
| `created_at` | timestamp string | Required; upstream shape `YYYY-MM-DD HH:mm:ss`, interpreted and displayed in `Africa/Johannesburg`. |
| `updated_at` | timestamp string | Required; upstream shape `YYYY-MM-DD HH:mm:ss`, interpreted and displayed in `Africa/Johannesburg`. |

The dashboard must not receive or display prices, wallet values, recipient
details, SMS content, electricity tokens, or voucher codes. For SMS, `pending`
means delivery confirmation is still outstanding; it is not by itself evidence
of failure.

## Transaction Query

Represents one user-submitted filter set.

| Field | Type | Rules |
|---|---|---|
| `date_from` | date string | Required inclusive start date in `YYYY-MM-DD`. |
| `date_to` | date string | Required inclusive end date in `YYYY-MM-DD`; not earlier than `date_from`; no more than 90 inclusive calendar days in the `Africa/Johannesburg` date context. |
| `type` | list of service enums | Optional; each value must be supported. Omit to request all services. |
| `limit` | integer | Defaults to 50; valid range 1–100. |
| `cursor` | opaque string or absent | Pass the exact `next_cursor` from the preceding page with the same dates and service set. |

Changing the applied date range or normalized service set creates a new query
and starts pagination from the first page.

## Result Page

Represents one response for a Transaction Query.

| Field | Type | Rules |
|---|---|---|
| `transactions` | Transaction[] | Newest-first results for this page. |
| `pagination.limit` | integer | The effective page size, 1–100. |
| `pagination.next_cursor` | opaque string or null | Present when another page is available; null/absent ends pagination. |

The authenticated response may also echo `date_from`, `date_to`, and normalized
`type` values. The client must treat the cursor as opaque.

## Request / UI state

The dashboard has draft filter input, active filter input, query status, loaded
result pages, and the next-page cursor. Draft inputs do not trigger requests
until the user applies a valid date range. Query state is keyed by active
dates/services and, where available, the authenticated user's stable
non-secret identity. Credentials are not part of this model or query key. Clear
transaction cache when the authenticated user changes or signs out.

## Error state

The UI consumes normalized API errors without storing raw credentials or
provider responses:

- `400`: invalid date range, service filter, limit, or cursor.
- `401`: application user session is not authenticated.
- `403`: the user's connected SIMcloud account cannot be authorized.
- `5xx` or network failure: transaction service is temporarily unavailable.

The API must not include secrets or another user's transaction data in errors.
