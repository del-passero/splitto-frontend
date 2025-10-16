// src/hooks/useAcceptInviteOnBoot.ts
// На старте выцепляем инвайт из Telegram start_param / URL, определяем тип (если есть префикс),
// и переводим на /invite?token=...&type=friend|group. Без сетевых запросов здесь.

import { useEffect, useRef } from "react"
import { useLocation, useNavigate } from "react-router-dom"

// NB: оставляю импорт твоих утилит — они уже есть у тебя.
// getStartParam: достаёт start_param из Telegram и/или ?startapp= из URL
// normalizeInviteToken: триммит, убирает мусор, вытаскивает чистый токен
import { getStartParam, normalizeInviteToken } from "../api/groupInvitesApi"

function detectKindByPrefix(raw: string | null): "friend" | "group" | null {
  if (!raw) return null
  const s = String(raw).trim()
  if (/^F-/i.test(s)) return "friend"
  if (/^G-/i.test(s)) return "group"
  return null
}

export function useAcceptInviteOnBoot() {
  const onceRef = useRef(false)
  const nav = useNavigate()
  const loc = useLocation()

  useEffect(() => {
    // защищаемся от StrictMode (двойной mount в dev)
    if (onceRef.current) return
    onceRef.current = true

    // если уже на /invite с токеном — ничего не делаем
    if (loc.pathname === "/invite") {
      const qs = new URLSearchParams(loc.search)
      if (qs.get("token")) return
    }

    // 1) берём сырое значение из Telegram/URL
    const raw = getStartParam() /* может вернуть строку или null */

    if (!raw) return

    // 2) пытаемся определить тип по префиксу (если его используем в ссылках)
    const prefixedKind = detectKindByPrefix(raw)

    // 3) нормализуем токен (отрезаем префикс, пробелы и прочий мусор)
    const token = normalizeInviteToken(raw)
    if (!token) return

    const sp = new URLSearchParams()
    sp.set("token", token)
    if (prefixedKind) sp.set("type", prefixedKind)

    const target = `/invite?${sp.toString()}`

    if (loc.pathname !== "/invite" || loc.search !== `?${sp.toString()}`) {
      nav(target, { replace: true })
    }
  }, [nav, loc.pathname, loc.search])
}
