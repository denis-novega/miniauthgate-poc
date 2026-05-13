// app/api/tg-auth/route.ts — Telegram Mini App auth через initData (без пароля)
import { NextResponse } from 'next/server'
import { validate, parse } from '@telegram-apps/init-data-node'
import { admin } from '@/lib/supabase-admin'
import { signTelegramSession } from '@/lib/tg-session' // ✅ НОВОЕ

export const runtime = 'nodejs'

const COOKIE_PID = 'tg_pid'
const COOKIE_SESSION = 'tg_session'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 дней

type Body = {
  initData?: string
}

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

function ensureUsername(
  current: string | null | undefined,
  tgUsername?: string,
  telegram_id?: string
) {
  if (current && current.length >= 3) return current
  if (tgUsername && tgUsername.length >= 3) return tgUsername
  return telegram_id
    ? `tg_${telegram_id}`
    : `tg_${Math.random().toString(36).slice(2, 8)}`
}

export async function POST(req: Request) {
  try {
    if (!BOT_TOKEN) {
      return NextResponse.json({ ok: false, error: 'SERVER_MISCONFIG' }, { status: 500 })
    }

    if (!(req.headers.get('content-type') || '').includes('application/json')) {
      return NextResponse.json({ ok: false, error: 'BAD_CONTENT_TYPE' }, { status: 415 })
    }

    const { initData } = (await req.json()) as Body

    if (!initData || typeof initData !== 'string' || initData.length < 10) {
      return NextResponse.json({ ok: false, error: 'BAD_INIT_DATA' }, { status: 400 })
    }

    // 1) validate initData
    try {
      validate(initData, BOT_TOKEN, { expiresIn: 300 })
    } catch {
      return NextResponse.json({ ok: false, error: 'INIT_DATA_INVALID' }, { status: 401 })
    }

    // 2) parse initData
    const parsed = parse(initData)
    const user = parsed.user
    if (!user?.id) {
      return NextResponse.json({ ok: false, error: 'NO_USER_IN_INIT_DATA' }, { status: 400 })
    }

    const telegram_id = String(user.id)
    const tg_username = (user.username as string | undefined) ?? null
    const first_name = (user.firstName as string | undefined) ?? null
    const last_name = (user.lastName as string | undefined) ?? null
    const photo_url = (user.photoUrl as string | undefined) ?? null

    const fullName = [first_name, last_name].filter(Boolean).join(' ').trim() || null

    // 3) find / create profile
    const { data: existingProfile } = await admin
      .from('profiles')
      .select('id, username')
      .eq('telegram_id', telegram_id)
      .maybeSingle()

    let profile_id = existingProfile?.id
    const usernameToSet = ensureUsername(existingProfile?.username, tg_username ?? undefined, telegram_id)

    if (!profile_id) {
      const { data, error } = await admin
        .from('profiles')
        .insert({
          username: usernameToSet,
          name: fullName || usernameToSet,
          telegram_id,
          telegram_username: tg_username,
          telegram_first_name: first_name,
          telegram_last_name: last_name,
          telegram_photo_url: photo_url,
        })
        .select('id')
        .single()

      if (error || !data) {
        return NextResponse.json({ ok: false, error: 'DB_PROFILE_INSERT' }, { status: 500 })
      }

      profile_id = data.id
    }

    if (!profile_id) {
      return NextResponse.json({ ok: false, error: 'PROFILE_ID_MISSING' }, { status: 500 })
    }

    // ✅ 4) СОЗДАЁМ ПОДПИСАННУЮ СЕССИЮ
    const session = signTelegramSession(profile_id)

    const res = NextResponse.json({ ok: true, profile_id })

    // 🔐 tg_pid — якорь
    res.headers.append(
      'Set-Cookie',
      `${COOKIE_PID}=${encodeURIComponent(profile_id)}; Path=/; HttpOnly; SameSite=None; Secure; Max-Age=${COOKIE_MAX_AGE}`
    )

    // 🔐 tg_session — ключ доверия
    res.headers.append(
      'Set-Cookie',
      `${COOKIE_SESSION}=${session}; Path=/; HttpOnly; SameSite=None; Secure; Max-Age=${COOKIE_MAX_AGE}`
    )

    return res
  } catch (e) {
    console.error('tg-auth error', e)
    return NextResponse.json({ ok: false, error: 'SERVER_ERROR' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ ok: true })
}
