# Project page copy

## Title

MiniAuthGate: Serverless Auth PoC for Telegram Mini Apps

## Summary

MiniAuthGate is a proof-of-concept authentication flow for Telegram Mini Apps. It validates Telegram `initData` on the backend, binds verified Telegram users to internal profiles, issues signed `HttpOnly` session cookies, and supports one-time nonce launch links through a Telegram bot.

## Abstract

MiniAuthGate demonstrates a lightweight authentication architecture for Telegram Mini Apps. The PoC uses Telegram as the initial trust provider: the Mini App sends Telegram `initData` to the backend, the backend validates it with the bot token, and the verified Telegram identity is mapped to an internal user profile. After validation, the backend issues signed `HttpOnly` cookies that represent the application's own session layer.

The second part of the flow uses a Telegram bot webhook. When a user sends `/start`, the webhook requests a one-time nonce and returns a Telegram `web_app` button that opens the Mini App with the nonce as a launch parameter. This creates a compact trust chain between Telegram launch, backend validation, profile binding, and application session management.

The PoC was created as a lightweight alternative to paid external security/API gateway services for small Telegram-based businesses.

## Tags

Telegram Mini Apps, Authentication, Web Security, Serverless, Next.js, TypeScript, HttpOnly Cookies, Signed Sessions, Nonce, Supabase

## Project blocks

### Heading

Serverless authentication for Telegram Mini Apps

### Text

MiniAuthGate is a proof-of-concept authentication gateway for Telegram Mini Apps. It validates Telegram `initData` on the backend, binds the verified Telegram identity to an internal profile, and issues signed `HttpOnly` sessions for application access.

### Text

The project explores a lightweight alternative to external security/API gateway services. Instead of using a separate OAuth provider or commercial access layer, the application uses Telegram-signed launch data as the first trust anchor and then manages its own signed session.

### Heading

Core flow

### List

- Telegram bot receives `/start`.
- Backend issues a one-time nonce.
- Bot sends a Telegram `web_app` button with the nonce launch parameter.
- Mini App sends Telegram `initData` to the backend.
- Backend validates `initData` using the Telegram bot token.
- Backend creates or retrieves an internal user profile.
- Backend issues signed `HttpOnly` session cookies.
- Frontend checks the active session through `/api/me`.

### Heading

Repository scope

### Text

This repository is a PoC snapshot, not a full production starter kit. It contains the core authentication and webhook files from the original implementation, plus documentation explaining the architecture, limitations, and next steps required for a complete reusable package.
