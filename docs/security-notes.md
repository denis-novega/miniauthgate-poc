# Security notes

This PoC focuses on a narrow Telegram Mini App authentication flow.

## Implemented in the provided files

- Telegram `initData` validation with `@telegram-apps/init-data-node`.
- Short `initData` expiration window using `expiresIn: 300`.
- Telegram webhook secret header check.
- `HttpOnly`, `Secure`, `SameSite=None` cookies for application session state.
- Profile binding through Telegram ID.
- Bot-issued Mini App launch link with `tgWebAppStartParam`.

## Referenced but not included in this PoC

- Signed session implementation in `@/lib/tg-session`.
- Supabase admin client in `@/lib/supabase-admin`.
- Nonce creation, storage, expiration, and consumption logic.
- `/api/me` session verification endpoint.
- Full database schema and RLS policy design.

## Before production use

- Verify the signed session format and rotation strategy.
- Add session expiration to the signed payload.
- Add nonce storage with single-use consumption and short TTL.
- Ensure `/api/me` verifies both `tg_pid` and `tg_session`.
- Avoid logging personal Telegram data in production.
- Review cookie attributes for the deployment domain.
- Add rate limiting to auth and webhook endpoints.
- Add tests for replay, expired `initData`, invalid signature, and invalid cookies.
