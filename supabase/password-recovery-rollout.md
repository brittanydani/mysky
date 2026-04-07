# Password Recovery Rollout

This project now uses the `password-recovery` edge function plus SQL-backed one-time recovery codes.

## Required Supabase Secrets

- `RESEND_API_KEY`
- `RECOVERY_EMAIL_FROM`
- `PASSWORD_RECOVERY_CODE_PEPPER`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Deploy Commands

From the repository root:

```bash
supabase db push
supabase functions deploy password-recovery --no-verify-jwt
```

## Smoke Tests

Validation failure without sending email:

```bash
set -a
source .env.local
curl -sS \
  -X POST "$EXPO_PUBLIC_SUPABASE_URL/functions/v1/password-recovery" \
  -H "Content-Type: application/json" \
  -H "apikey: $EXPO_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $EXPO_PUBLIC_SUPABASE_ANON_KEY" \
  -d '{"action":"request","email":"not-an-email"}'
```

Expected result: JSON error containing `Enter a valid email address.`

End-to-end recovery test:

1. Open the app and trigger `Forgot password`.
2. Request a code for a real test account.
3. Confirm the email arrives from the configured sender.
4. Submit the code and a new password.
5. Confirm the app signs in successfully after reset.
6. Confirm the same code cannot be reused.

## Security Notes

- Recovery verification is atomic in SQL via `consume_password_recovery_code(...)`.
- Codes are invalidated if email delivery fails.
- Auth UI surfaces generic sign-up/sign-in failures to avoid leaking account existence details.