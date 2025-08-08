// src/api/currenciesApi.ts
// Новый клиент для валют: список, популярные и получить по коду.
// Поддерживает locale через ?locale= и/или Accept-Language.

import type { Currency } from "../types/currency"

const API_URL = import.meta.env.VITE_API_URL || "https://splitto-backend-prod-ugraf.amvera.io/api"

function getTelegramInitData(): string {
  // @ts-ignore
  return window?.Telegram?.WebApp?.initData || ""
}

function buildLangHeaders(locale?: string): HeadersInit {
  const h: HeadersInit = { "x-telegram-initdata": getTelegramInitData() }
  if (locale) h["Accept-Language"] = locale
  return h
}

/** Список валют с пагинацией и поиском. Возвращает { items, total } */
export async function listCurrencies(params?: {
  q?: string
  locale?: string
  limit?: number
  offset?: number
}): Promise<{ items: Currency[]; total: number }> {
  const q = params?.q ? `&q=${encodeURIComponent(params.q)}` : ""
  const limit = params?.limit ?? 100
  const offset = params?.offset ?? 0
  const url = `${API_URL}/currencies?limit=${limit}&offset=${offset}${q}`

  const res = await fetch(url, { headers: buildLangHeaders(params?.locale) })
  if (!res.ok) throw new Error(await res.text())
  return await res.json()
}

/** Популярные валюты (без total) */
export async function listPopularCurrencies(locale?: string): Promise<Currency[]> {
  const url = `${API_URL}/currencies/popular`
  const res = await fetch(url, { headers: buildLangHeaders(locale) })
  if (!res.ok) throw new Error(await res.text())
  return await res.json()
}

/** Получить валюту по коду */
export async function getCurrency(code: string, locale?: string): Promise<Currency> {
  const url = `${API_URL}/currencies/${encodeURIComponent(code)}`
  const res = await fetch(url, { headers: buildLangHeaders(locale) })
  if (!res.ok) throw new Error(await res.text())
  return await res.json()
}
