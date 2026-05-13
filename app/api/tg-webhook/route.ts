// app/api/tg-webhook/route.ts
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ====== ENV ======
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!
const BOT_ISSUE_SECRET = process.env.BOT_ISSUE_SECRET!
const TG_WEBHOOK_SECRET = process.env.TG_WEBHOOK_SECRET || ''
const BASE = process.env.NEXT_PUBLIC_BASE_URL || 'https://эхомаркет.рф'

// ====== helpers ======
type JSONish = Record<string, any>
const jlog = (lvl: 'info'|'warn'|'error'|'debug', msg: string, extra?: JSONish) =>
  console.log(JSON.stringify({ ts: new Date().toISOString(), level: lvl, msg, ...(extra||{}) }))

async function issueNonce(telegram_id: string) {
  const r = await fetch(`${BASE}/api/nonce/issue`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-bot-secret': BOT_ISSUE_SECRET,
    },
    cache: 'no-store',
    body: JSON.stringify({ telegram_id }),
  })
  const j = await r.json().catch(() => null) as any
  if (!j?.ok) throw new Error('issueNonce_failed')
  return j as { ok: true, nonce: string, deep_link: string, miniapp_link: string }
}

async function sendMessage(chat_id: number, text: string, reply_markup?: any) {
  const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify({ chat_id, text, reply_markup, parse_mode: 'HTML' }),
  })
  const j = await r.json().catch(() => null)
  if (!j?.ok) jlog('warn', 'tg:sendMessage_fail', { chat_id, err: j })
}

// ====== handler ======
export async function POST(req: Request) {
  // проверка секрета Telegram → Next (должен совпадать с setWebhook secret_token)
  const sec = req.headers.get('x-telegram-bot-api-secret-token') || ''
  if (TG_WEBHOOK_SECRET && sec !== TG_WEBHOOK_SECRET) {
    jlog('warn', 'tg-webhook:bad-secret')
    // отвечаем 200, чтобы TG не копил ошибки (можно вернуть 403, если хочешь строгий режим)
    return new NextResponse('Forbidden', { status: 403 })
  }

  const upd = await req.json().catch(() => null) as any
  if (!upd) return NextResponse.json({ ok: true })

  const msg = upd.message || upd.edited_message
  const fromId: number | undefined = msg?.from?.id
  const chatId: number | undefined = msg?.chat?.id
  const text: string | undefined = msg?.text

  // Обработка /start
  if (fromId && chatId && typeof text === 'string' && text.startsWith('/start')) {
    try {
      const data = await issueNonce(String(fromId))

      // web_app кнопка открывает мини-апп прямо внутри Telegram (mobile+desktop)
      // Передаём tgWebAppStartParam=nonce, чтобы он попал в URL
      const webappUrl = `${BASE}/mini?tgWebAppStartParam=${encodeURIComponent(data.nonce)}`

      // Одну кнопку оставляем — модерация не будет ругаться на пустую ссылку
      const kb = {
        inline_keyboard: [
          [{ text: 'Открыть EchoMarket', web_app: { url: webappUrl } }],
        ],
      }

      await sendMessage(chatId, 'Жми, чтобы войти в мини-приложение:', kb)
      jlog('info', 'tg-webhook:/start_sent', { chatId, fromId })
    } catch (e:any) {
      jlog('error', 'tg-webhook:/start_fail', { chatId, fromId, err: String(e?.message || e) })
      await sendMessage(chatId, 'Не удалось выдать одноразовый код. Попробуйте ещё раз.')
    }
  }

  return NextResponse.json({ ok: true })
}

export async function GET() {
  return NextResponse.json({ ok: true })
}
