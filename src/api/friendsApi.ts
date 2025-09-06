// src/api/friendsApi.ts
import { Friend, FriendInvite, FriendsResponse } from "../types/friend"

function getTelegramInitData(): string {
  // @ts-ignore
  return window?.Telegram?.WebApp?.initData || ""
}

const API_URL = import.meta.env.VITE_API_URL || "https://splitto-backend-prod-ugraf.amvera.io/api"
const BASE_URL = `${API_URL}/friends/`

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

export async function getFriends(
  showHidden: boolean = false,
  offset: number = 0,
  limit: number = 50
): Promise<FriendsResponse> {
  let url = `${BASE_URL}?offset=${offset}&limit=${limit}`
  if (showHidden) url += `&show_hidden=true`
  return fetchJson<FriendsResponse>(url)
}

export async function searchFriends(
  query: string,
  showHidden: boolean = false,
  offset: number = 0,
  limit: number = 50
): Promise<FriendsResponse> {
  let url = `${BASE_URL}search?query=${encodeURIComponent(query)}&offset=${offset}&limit=${limit}`
  if (showHidden) url += `&show_hidden=true`
  return fetchJson<FriendsResponse>(url)
}

export async function createInvite(): Promise<FriendInvite> {
  return fetchJson<FriendInvite>(`${BASE_URL}invite`, {
    method: "POST",
    headers: { "Content-Type": "application/json" }
  })
}

export async function acceptInvite(token: string): Promise<{ success: boolean }> {
  return fetchJson<{ success: boolean }>(`${BASE_URL}accept`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token })
  })
}

export async function hideFriend(friendId: number): Promise<{ success: boolean }> {
  return fetchJson<{ success: boolean }>(`${BASE_URL}${friendId}/hide`, { method: "POST" })
}

export async function unhideFriend(friendId: number): Promise<{ success: boolean }> {
  return fetchJson<{ success: boolean }>(`${BASE_URL}${friendId}/unhide`, { method: "POST" })
}

/* ======= для страницы контакта ======= */
export async function getFriendDetail(friendId: number): Promise<Friend> {
  return fetchJson<Friend>(`${BASE_URL}${friendId}`)
}

export async function getCommonGroupNames(friendId: number): Promise<string[]> {
  return fetchJson<string[]>(`${BASE_URL}${friendId}/common-groups`)
}

export async function getFriendsOfUser(
  userId: number,
  offset: number = 0,
  limit: number = 50
): Promise<FriendsResponse> {
  return fetchJson<FriendsResponse>(`${BASE_URL}of/${userId}?offset=${offset}&limit=${limit}`)
}
