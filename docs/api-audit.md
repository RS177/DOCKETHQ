# DocketHQ API Audit

This document covers the current API layer under `app/api`. The automated suite in `scripts/api-test.mjs` tests the same endpoints against a running local or deployed app.

Run the suite:

```bash
npm run test:api
```

Optional live-test environment variables:

```bash
API_TEST_BASE_URL=https://your-vercel-domain.vercel.app
API_TEST_AUTH_TOKEN=ey...
API_TEST_CNR=YOUR16CHARCNR
API_TEST_INVITE_ID=uuid
API_TEST_INVITE_EMAIL=test@example.com
API_TEST_CRON_SECRET=your-cron-secret
API_TEST_ENABLE_INVITE_MUTATION=1
npm run test:api
```

## Summary

| Endpoint | Methods | Auth | External dependency | Risk |
| --- | --- | --- | --- | --- |
| `/api/fetch-case` | `POST` | Supabase bearer token | Supabase Admin, eCourts partner API | Medium |
| `/api/waitlist` | `POST` | None | Supabase Admin | Low |
| `/api/auth/session-marker` | `POST`, `DELETE` | `POST` requires Supabase bearer token | Supabase Admin | Low |
| `/api/invites` | `POST` | Supabase bearer token, owner/admin firm role | Supabase Admin, Resend | Medium |
| `/api/invites/:id` | `GET`, `POST` | `GET` public masked, `POST` bearer token | Supabase Admin | Medium |
| `/api/reminders/send-due` | `GET` | Cron bearer token in production | Supabase Admin, Resend/Twilio | High |

## Endpoint Contracts

### `POST /api/fetch-case`

Fetches normalized court status for a CNR.

Required headers:

- `Authorization: Bearer <supabase-access-token>`
- `Content-Type: application/json`

Request body:

```json
{
  "cnr": "ABCDEF1234567890"
}
```

Success response `200`:

```json
{
  "success": true,
  "data": {
    "cnrNumber": "ABCDEF1234567890",
    "caseTitle": "string | null",
    "status": "pending | disposed | dismissed | stayed | unknown",
    "statusLabel": "string",
    "isDisposed": false,
    "isDismissed": false,
    "nextHearingDate": "YYYY-MM-DD | null",
    "currentStage": "string | null",
    "courtName": "string | null",
    "judgeName": "string | null",
    "latestUpdate": "string",
    "source": "ecourtsindia_api",
    "sourceUrl": "string",
    "fetchedAt": "ISO datetime"
  },
  "rawPayload": {},
  "payloadHash": "sha256"
}
```

Expected errors:

- `401` missing/invalid bearer token
- `400` invalid CNR, provider not configured, provider failure, or case not found
- `500` unhandled server/provider failure

Notes:

- The endpoint correctly sets `Cache-Control: no-store` and `X-Robots-Tag`.
- Malformed JSON currently falls into the generic `500` catch. Prefer returning `400`.
- `fetchCourtCase` validates CNR after auth, so invalid-input testing needs a real test token.

### `POST /api/waitlist`

Creates or updates a waitlist lead.

Required headers:

- `Content-Type: application/json`

Request body:

```json
{
  "name": "Rudransh",
  "email": "lawyer@example.com",
  "city": "Bengaluru",
  "practice_type": "solo",
  "source": "landing",
  "website": ""
}
```

Success response `200`:

```json
{
  "ok": true
}
```

Expected errors:

- `400` missing/invalid name or email
- `500` missing table or Supabase write failure

Notes:

- `website` is a honeypot field. If present, the endpoint returns `200` without writing.
- Response shape differs from other endpoints because it returns `{ ok: true }` or `{ error }`.

### `POST /api/auth/session-marker`

Sets an HTTP-only cookie after Supabase token verification.

Required headers:

- `Authorization: Bearer <supabase-access-token>`

Request body: none.

Success response:

- `204 No Content`
- `Set-Cookie: dockethq_session=active; HttpOnly; SameSite=Strict`
- `Cache-Control: no-store`

Expected errors:

- `401` missing/invalid bearer token

### `DELETE /api/auth/session-marker`

Clears the HTTP-only dashboard session marker cookie.

Required headers: none.

Request body: none.

Success response:

- `204 No Content`
- `Set-Cookie: dockethq_session=; Max-Age=0`
- `Cache-Control: no-store`

### `POST /api/invites`

Creates a firm invite and attempts to email it.

Required headers:

- `Authorization: Bearer <supabase-access-token>`
- `Content-Type: application/json`

Request body:

```json
{
  "email": "member@example.com",
  "role": "lawyer"
}
```

Allowed roles:

- `lawyer`
- `associate`
- `admin`

Success response `200`:

```json
{
  "invite": {
    "id": "uuid",
    "email": "member@example.com",
    "role": "lawyer",
    "status": "pending",
    "created_at": "ISO datetime"
  },
  "invite_link": "https://app/invite/uuid",
  "email_sent": true,
  "email_error": null
}
```

Expected errors:

- `401` missing/invalid bearer token
- `400` invalid email or role
- `402` firm is not on Custom Workflow plan
- `403` user has no firm or is not owner/admin
- `404` firm not found
- `409` plan member limit reached
- `500` invite insert failure

Notes:

- If `RESEND_API_KEY` is missing, the invite still succeeds with `email_sent: false`.
- This is useful for demo safety, but the UI must show the invite link clearly.

### `GET /api/invites/:id`

Returns masked invite details for the public invite page.

Required headers: none.

Request body: none.

Success response `200`:

```json
{
  "id": "uuid",
  "email": "ru******@example.com",
  "role": "lawyer",
  "status": "pending",
  "created_at": "ISO datetime",
  "firm_name": "Firm workspace"
}
```

Expected errors:

- `404` invite not found
- `500` if Supabase admin credentials are missing or unavailable

Notes:

- The email is masked, which is good.
- This route has no `try/catch`; missing Supabase admin env can surface as a generic server error.

### `POST /api/invites/:id`

Accepts a pending firm invite for the currently logged-in Supabase user.

Required headers:

- `Authorization: Bearer <supabase-access-token>`

Request body: none.

Success response `200`:

```json
{
  "ok": true,
  "firm_id": "uuid",
  "firm_name": "Firm workspace"
}
```

Expected errors:

- `401` missing/invalid bearer token
- `403` logged-in email does not match invite email
- `404` invite not found
- `409` invite is no longer pending
- `500` membership insert failure

Notes:

- The route updates Supabase auth user metadata after accepting.
- `firm_invites` status update is not checked for errors.

### `GET /api/reminders/send-due`

Cron endpoint that sends due email/SMS reminders and marks reminders sent or failed.

Required headers:

- Production: `Authorization: Bearer <CRON_SECRET>`
- Local development: no auth is allowed if `CRON_SECRET` is not configured

Request body: none.

Success response `200`:

```json
{
  "checked_at": "ISO datetime",
  "processed": 0,
  "results": [
    {
      "id": "uuid",
      "status": "sent"
    }
  ]
}
```

Expected errors:

- `401` missing/invalid cron bearer token in production
- `500` missing Supabase admin credentials, query failure, or provider failure not handled inside delivery

Notes:

- This endpoint is intentionally state-changing despite using `GET` because Vercel cron jobs call GET routes.
- Keep `CRON_SECRET` configured in production.
- The query only sends `email` and `sms`; `in_app` and `whatsapp` are ignored.

## Findings

### Broken or fragile endpoints

- `GET /api/invites/:id` does not catch missing Supabase admin configuration. The user-facing result is a generic 500 rather than a controlled JSON error.
- `POST /api/fetch-case` returns a generic 500 for malformed JSON instead of a validation 400.
- `GET /api/reminders/send-due` is safe in production only if `CRON_SECRET` is configured. Without it, production still rejects because `NODE_ENV=production`, but the local dev behavior can accidentally process reminders.

### Missing validation

- `POST /api/waitlist` only checks `email.includes("@")`; a stricter email check would reduce bad leads.
- `POST /api/invites` also only checks `email.includes("@")`.
- `POST /api/fetch-case` does not catch malformed JSON separately.

### Security notes

- Service-role Supabase access is isolated server-side, which is correct.
- Waitlist writes go through a server endpoint while RLS blocks direct client writes, which is correct.
- Public invite lookup masks email, which is correct.
- Reminder cron must keep `CRON_SECRET` set in Vercel.
- Avoid logging caught errors containing provider payloads if they may include sensitive case data.

### Response consistency

The API currently mixes these shapes:

- `{ success, error, code, data }`
- `{ ok: true }`
- `{ error }`
- `204 No Content`

For MVP this is acceptable, but before more frontend complexity, consider standardizing JSON errors to:

```json
{
  "ok": false,
  "error": {
    "code": "STRING_CODE",
    "message": "Human readable message"
  }
}
```

## Test Coverage

The automated test suite covers:

- Endpoint reachability
- Authentication required checks
- Invalid/missing input checks
- Honeypot waitlist behavior
- Session cookie set/clear behavior when token is supplied
- Optional live CNR lookup when `API_TEST_AUTH_TOKEN` and `API_TEST_CNR` are supplied
- Optional invite creation when `API_TEST_ENABLE_INVITE_MUTATION=1`
- Optional invite lookup/acceptance checks when `API_TEST_INVITE_ID` and `API_TEST_AUTH_TOKEN` are supplied
- Cron unauthorized/authorized behavior with `API_TEST_CRON_SECRET`

Tests that need real external state are skipped unless the required environment variable is supplied.
