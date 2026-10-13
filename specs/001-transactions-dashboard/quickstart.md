# Quickstart: Transactions Dashboard

This guide validates the planned dashboard end-to-end after implementation.
The current repository is a frontend starter; authenticated backend support for
the contract in [transactions-api.md](./contracts/transactions-api.md) is a
prerequisite for a live-data check.

## Prerequisites

- Node.js matching the repository's `.node-version`.
- Yarn and the repository dependencies installed.
- An available authenticated E-Tariff API implementing the transactions
  contract. The API must resolve SIMcloud credentials server-side for the
  current user.
- A valid user session. The frontend uses
  `https://e-tarrif-be.onrender.com/api` by default. Do not put a SIMcloud token
  or other secret in a `NEXT_PUBLIC_` variable.

## Configure and run

1. Install dependencies:

   ```sh
   yarn install
   ```

2. Optionally override the frontend API base URL in an ignored local
   environment file when testing against another deployment:

   ```dotenv
   NEXT_PUBLIC_API_BASE_URL=https://your-api.example/api
   ```

   Configure the user's existing login/session by the application's established
   authentication flow; do not add the SIMcloud credential to frontend config.
   The authenticated session integration must provide the stable, non-secret
   `currentUser.id` page prop so transaction requests can be scoped to that user.

3. Run focused tests:

   ```sh
   yarn test --runInBand --watchman=false
   ```

4. Start the frontend:

   ```sh
   yarn dev
   ```

5. Open the local site, choose a valid inclusive date range (90 days maximum),
   optionally select service types, and apply the filters.

## Validation scenarios

1. **Valid results**: A connected user sees their own newest-first transactions
   with service, status, reference, and created/updated times.
2. **Service filters and pagination**: Select one or more service types, load
   another page, and confirm the next request keeps the dates and service types
   and uses the returned cursor. Apply different filters and confirm the list
   starts from page one.
3. **Date validation**: Try a reversed range and a range over 90 inclusive
   calendar days. Confirm a clear validation message appears and no request is
   issued.
4. **Empty and failed results**: Confirm no results yields an empty state;
   failed rows show their reason or an explicit unavailable marker.
5. **Access and service errors**: Return `401` or `403` and verify transaction
   data is not shown. Simulate a network or `5xx` failure and verify a retry
   action is available.
6. **Credential privacy**: Inspect browser requests, page props, environment
   configuration, and rendered UI to confirm no SIMcloud credential or
   prohibited transaction fields are present.

## Production build

Build for production:

   ```sh
   yarn build
   ```

Expected outcome: focused tests and production build pass; the dashboard makes
requests only to the authenticated configured API and meets each listed
scenario.
