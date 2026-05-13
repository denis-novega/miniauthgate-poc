'use client'

import { ReactNode, useEffect, useState } from 'react'

export default function MiniAuthGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    let alive = true

    ;(async () => {
      try {
        const r = await fetch('/api/me', {
          credentials: 'include',
          cache: 'no-store',
        })
        const j = await r.json()
        if (!alive) return
        setAuthed(!!j?.ok)
      } catch {
        if (!alive) return
        setAuthed(false)
      } finally {
        if (alive) setReady(true)
      }
    })()

    return () => {
      alive = false
    }
  }, [])

  if (!ready) {
    return (
      <div className="p-4 text-sm text-zinc-400">
        Проверяем вход…
      </div>
    )
  }

  return <>{children}</>
}
