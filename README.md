# MiniAuthGate PoC

**MiniAuthGate PoC** is a proof-of-concept authentication flow for Telegram Mini Apps.

It demonstrates how a Telegram Mini App can use Telegram as the initial trust provider, validate `initData` on the backend, bind the Telegram identity to an internal user profile, issue signed `HttpOnly` session cookies, and launch the Mini App through one-time nonce links issued by a Telegram bot.

This repository is intentionally published as a **PoC snapshot**, not as a polished npm package or a complete starter kit.

## What this PoC contains

The repository contains the core files from the original implementation:

```txt
app/api/tg-auth/route.ts       # validates Telegram initData and issues signed session cookies
app/api/tg-webhook/route.ts    # handles Telegram /start and issues a nonce launch link
components/MiniAuthGate.tsx    # frontend auth gate that calls /api/me
```

## What the flow does

1. A user opens the Telegram bot and sends `/start`.
2. The bot webhook receives the update in `app/api/tg-webhook/route.ts`.
3. The webhook checks Telegram's webhook secret header.
4. The backend requests a one-time nonce from `/api/nonce/issue`.
5. The bot sends a Telegram `web_app` button with a Mini App URL containing `tgWebAppStartParam`.
6. The Mini App sends Telegram `initData` to `/api/tg-auth`.
7. The backend validates `initData` with `@telegram-apps/init-data-node` and the bot token.
8. The backend finds or creates a profile in Supabase.
9. The backend signs an application-level session and stores it in `HttpOnly` cookies.
10. The frontend can later check the session through `/api/me`.

## Architecture

```txt
Telegram Bot /start
        |
        v
app/api/tg-webhook/route.ts
        |
        | requests nonce
        v
/api/nonce/issue
        |
        | returns one-time nonce
        v
Telegram web_app button
        |
        v
Telegram Mini App
        |
        | sends initData
        v
app/api/tg-auth/route.ts
        |
        | validates initData, binds profile, signs session
        v
HttpOnly cookies: tg_pid + tg_session
        |
        v
/api/me + MiniAuthGate
```

## Security idea

The goal is not to replace Telegram's authentication model. The goal is to build a small application-level trust layer on top of it:

- Telegram signs the Mini App `initData`.
- The backend validates that signature before trusting the Telegram user object.
- The application binds the Telegram user to an internal profile.
- The application creates its own signed session cookie for subsequent requests.
- The bot launch flow can include a one-time nonce to reduce unauthorized/replayed launches.

## Why this exists

Small Telegram-based businesses often do not need a heavy OAuth provider, a full external access gateway, or a paid API security layer for simple Mini App authentication.

This PoC shows a lightweight alternative:

```txt
Telegram initData validation + signed session + nonce launch flow
```

The expected business impact is reduced dependence on external security/API gateway services. Depending on the hosting provider, traffic, and security stack, this may save approximately **$100–200/month** in infrastructure costs.

## What this repository is not

This repository is **not** a drop-in production package.

It does not include every dependency from the original application. In particular, the following parts are referenced by the code but intentionally not included in this PoC snapshot:

```txt
@/lib/supabase-admin
@/lib/tg-session
/api/nonce/issue
/api/me
Supabase schema/migrations
full Mini App page
production deployment config
```

Those files belong to the host application and should be reviewed, sanitized, and published separately if this PoC is expanded into a complete starter kit.

## Required environment variables

The core files reference these environment variables:

```env
TELEGRAM_BOT_TOKEN=
BOT_ISSUE_SECRET=
TG_WEBHOOK_SECRET=
NEXT_PUBLIC_BASE_URL=
```

Do not commit real secrets.

## Current implementation notes

`MiniAuthGate.tsx` currently fetches `/api/me` and stores the result in `authed`, but the component does not yet block children when `authed === false`. This was kept unchanged from the original code snapshot. For a stricter gate, add an unauthenticated branch before rendering `children`.

## Suggested next steps

To turn this PoC into a complete open-source starter kit, add:

- `lib/tg-session.ts` with signed session creation and verification.
- `lib/supabase-admin.ts` with a sanitized Supabase admin client.
- `app/api/me/route.ts` for session verification.
- `app/api/nonce/issue/route.ts` for nonce creation.
- SQL migrations for `profiles` and nonce storage.
- A minimal Mini App page that sends Telegram `initData` to `/api/tg-auth`.
- Tests for invalid `initData`, expired `initData`, invalid cookies, and replayed nonce.

## Positioning

A careful public claim for this project:

> A proof-of-concept serverless authentication gateway for Telegram Mini Apps, combining Telegram `initData` validation, signed `HttpOnly` sessions, and one-time nonce launch links.

Avoid claiming “first in Russia” unless there is a stronger public evidence trail comparing this implementation with other Russian-language or Russia-based open-source projects.
