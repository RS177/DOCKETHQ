# DocketHQ API Test Report

Generated: 2026-06-19T14:35:00.672Z
Base URL: http://127.0.0.1:3000

## Summary

- Passed: 9
- Failed: 0
- Warnings: 3
- Skipped: 9

## Results

| Status | Test | Duration | Details |
| --- | --- | ---: | --- |
| PASSED | API server is reachable | 106ms |  |
| PASSED | POST /api/waitlist accepts honeypot silently | 37ms |  |
| PASSED | POST /api/waitlist rejects missing required fields | 24ms |  |
| WARNING | POST /api/waitlist accepts a valid lead | 27ms | Expected status 200, received 500. Body: {"error":"Supabase admin credentials are not configured."} |
| PASSED | POST /api/fetch-case rejects missing auth | 26ms |  |
| SKIPPED | POST /api/fetch-case rejects invalid CNR | 0ms | Set API_TEST_AUTH_TOKEN to test authenticated validation. |
| SKIPPED | POST /api/fetch-case handles malformed JSON without crashing | 0ms | Set API_TEST_AUTH_TOKEN to test malformed JSON past auth. |
| SKIPPED | POST /api/fetch-case returns live court data | 0ms | Set API_TEST_AUTH_TOKEN and API_TEST_CNR to run live court lookup. |
| PASSED | POST /api/auth/session-marker rejects missing auth | 28ms |  |
| SKIPPED | POST /api/auth/session-marker sets cookie for valid token | 0ms | Set API_TEST_AUTH_TOKEN to test session cookie creation. |
| PASSED | DELETE /api/auth/session-marker clears cookie | 19ms |  |
| PASSED | POST /api/invites rejects missing auth | 25ms |  |
| SKIPPED | POST /api/invites rejects invalid email for authenticated user | 0ms | Set API_TEST_AUTH_TOKEN to test authenticated invite validation. |
| SKIPPED | POST /api/invites rejects invalid role for authenticated user | 0ms | Set API_TEST_AUTH_TOKEN to test authenticated role validation. |
| SKIPPED | POST /api/invites creates an invite when enabled | 0ms | Set API_TEST_AUTH_TOKEN and API_TEST_ENABLE_INVITE_MUTATION=1 to create a live invite. |
| WARNING | GET /api/invites/:id returns 404 for unknown invite | 71ms | Expected status 404, received 500. Body: {"error":"Supabase admin credentials are not configured."} |
| PASSED | POST /api/invites/:id rejects missing auth | 35ms |  |
| SKIPPED | POST /api/invites/:id handles authenticated missing invite | 0ms | Set API_TEST_AUTH_TOKEN to test authenticated invite acceptance errors. |
| WARNING | GET /api/reminders/send-due local auth note | 0ms | Local development allows reminder cron without CRON_SECRET. Keep CRON_SECRET configured in production. |
| PASSED | GET /api/reminders/send-due rejects missing cron auth on deployed apps | 34ms |  |
| SKIPPED | GET /api/reminders/send-due runs with cron secret | 0ms | Set API_TEST_CRON_SECRET to run the due-reminder cron endpoint. |

## Recommendations

- Provide `API_TEST_AUTH_TOKEN` from a dedicated test user before running authenticated checks.
- Provide `API_TEST_CNR` only for a CNR you are authorized to test.
- Keep `API_TEST_ENABLE_INVITE_MUTATION` off unless you intentionally want to create a live invite.
- Run against local first, then against the Vercel deployment using `API_TEST_BASE_URL`.
