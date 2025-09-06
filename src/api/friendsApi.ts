// src/api/friendsApi.ts
import { Friend, FriendInvite, FriendsResponse } from "../types/friend"

// Получение initData из Telegram WebApp
function getTelegramInitData(): string {
  // @ts-ignore
  return window?.Telegram?.WebApp?.initData || ""
}

const API_URL = import.meta.env.VITE_API_URL || "https://splitto-backend-prod-ugraf.amvera.io/api"
const BASE_URL = `${API_URL}/friends/` // < один слэш на конце!

async function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const headers: HeadersInit = {
    ...(init?.headers || {}),
    "x-telegram-initdata": getTelegramInitData(),
  }
  const res = await fetch(input, { ...init, headers })
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail?.code || errorData.detail || res.statusText)
  }
  return await res.json()
}

/**
 * Получить список друзей с поддержкой пагинации.
 * Теперь сервер всегда возвращает объект { total, friends }
 */
export async function getFriends(
  showHidden: boolean = false,
  offset: number = 0,
  limit: number = 50
): Promise<FriendsResponse> {
  let url = `${BASE_URL}?offset=${offset}&limit=${limit}`
  if (showHidden) {
    url += `&show_hidden=true`
  }
  return fetchJson<FriendsResponse>(url)
}

/**
 * Серверный поиск друзей по query
 */
export async function searchFriends(
  query: string,
  showHidden: boolean = false,
  offset: number = 0,
  limit: number = 50
): Promise<FriendsResponse> {
  let url = `${BASE_URL}search?query=${encodeURIComponent(query)}&offset=${offset}&limit=${limit}`
  if (showHidden) {
    url += `&show_hidden=true`
  }
  return fetchJson<FriendsResponse>(url)
}

// Сгенерировать invite-ссылку (POST)
export async function createInvite(): Promise<FriendInvite> {
  return fetchJson<FriendInvite>(`${BASE_URL}invite`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    }
  })
}

// Принять invite по токену (POST)
export async function acceptInvite(token: string): Promise<{ success: boolean }> {
  return fetchJson<{ success: boolean }>(`${BASE_URL}accept`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token })
  })
}

// Скрыть друга (POST)
export async function hideFriend(friendId: number): Promise<{ success: boolean }> {
  return fetchJson<{ success: boolean }>(`${BASE_URL}${friendId}/hide`, {
    method: "POST"
  })
}

// Восстановить (unhide) друга (POST)
export async function unhideFriend(friendId: number): Promise<{ success: boolean }> {
  return fetchJson<{ success: boolean }>(`${BASE_URL}${friendId}/unhide`, {
    method: "POST"
  })
}

/* ======= НОВОЕ ДЛЯ СТРАНИЦЫ КОНТАКТА ======= */

// Детали конкретного друга
export async function getFriendDetail(friendId: number): Promise<Friend> {
  return fetchJson<Friend>(`${BASE_URL}${friendId}`)
}

// Имена общих групп
export async function getCommonGroupNames(friendId: number): Promise<string[]> {
  return fetchJson<string[]>(`${BASE_URL}${friendId}/common-groups`)
}

// Друзья выбранного пользователя (для вкладки «Друзья контакта»)
export async function getFriendsOfUser(
  userId: number,
  offset: number = 0,
  limit: number = 50
): Promise<FriendsResponse> {
  const url = `${BASE_URL}of/${userId}?offset=${offset}&limit=${limit}`
  return fetchJson<FriendsResponse>(url)
}
