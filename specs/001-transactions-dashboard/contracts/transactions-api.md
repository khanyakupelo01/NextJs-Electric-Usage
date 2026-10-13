# Frontend Transactions API Contract

This is the expected contract consumed by the frontend dashboard. The
authenticated backend must align with or implement it; this repository does not
currently contain that API. The backend must authorize the current user and
select only that user's SIMcloud credential. Never expose the SIMcloud API
credential to the browser.

## Request

`GET https://e-tarrif-be.onrender.com/api/transactions`

The frontend uses this endpoint by default. `NEXT_PUBLIC_API_BASE_URL` may
override the base URL for another deployment; it should end in `/api` for this
route. The frontend uses the application's established authenticated session;
the auth mechanism is owned by the backend integration.

| Query parameter | Required | Description |
|---|---:|---|
| `date_from` | Yes | Inclusive `YYYY-MM-DD` start date, interpreted in `Africa/Johannesburg`. |
| `date_to` | Yes | Inclusive `YYYY-MM-DD` end date; the inclusive range is at most 90 calendar days. |
| `type` | No | Comma-separated `airtime`, `data`, `electricity`, `vas`, and/or `sms`; omit for all services. |
| `limit` | No | Page size from 1 to 100; default 50. |
| `cursor` | No | Opaque cursor from the preceding response; use only with unchanged dates and service filters. |

The client must encode query parameters and pass a cancellation signal to the
native `fetch` request.

## Success response

```json
{
  "status": "success",
  "date_from": "2026-07-01",
  "date_to": "2026-07-31",
  "type": ["airtime", "data"],
  "transactions": [
    {
      "id": "airtime:1395227",
      "service": "airtime",
      "status": "success",
      "reason": null,
      "reference": "INV-10045",
      "created_at": "2026-07-29 09:31:20",
      "updated_at": "2026-07-29 09:31:48"
    }
  ],
  "pagination": {
    "limit": 50,
    "next_cursor": "opaque-cursor"
  }
}
```

The response shape follows the documented SIMcloud transaction history payload.
Results are newest-first. `reason`, `reference`, and `next_cursor` may be null
or absent where the source provides no value. The backend must not add pricing,
wallet values, recipients, SMS content, electricity tokens, or voucher codes
to the response.

## Errors

The backend must return a safe, consistent JSON error shape:

```json
{
  "error": {
    "code": "SIMCLOUD_ACCESS_DENIED",
    "message": "The connected transaction account could not be verified."
  }
}
```

| HTTP status | Meaning | Frontend behavior |
|---:|---|---|
| `400` | Invalid dates, service filter, limit, or cursor. | Show a filter/query validation message; do not show the response as empty results. |
| `401` | The application session is missing or no longer authenticated. | Show a distinct sign-in/access state and no transactions. |
| `403` | The user's connected SIMcloud account cannot be authorized. | Show a distinct account-access state and no transactions. |
| `5xx` or network failure | Upstream service or application is temporarily unavailable. | Show a retryable service-error state. |

The backend must translate the upstream provider's `401` into a safe account
access error without returning its credential or raw secret-bearing response.
