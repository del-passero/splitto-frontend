// src/types/currency.ts
// Справочник валют (для /api/currencies*)

export interface Currency {
  code: string               // "USD"
  numeric_code: number       // 840
  decimals: number           // 2
  symbol?: string | null     // "$"
  flag_emoji?: string | null // "🇺🇸"
  display_country?: string | null // "US"
  name_i18n: Record<string, string> // {"en":"US Dollar","ru":"Доллар США"}
  is_popular: boolean
  is_active: boolean
}
