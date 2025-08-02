// src/api/friendsApi.ts

import { Friend, FriendInvite } from "../types/friend"

// ��������� initData �� Telegram WebApp
function getTelegramInitData(): string {
  // @ts-ignore
  return window?.Telegram?.WebApp?.initData || ""
}

const API_URL = import.meta.env.VITE_API_URL || "https://splitto-backend-prod-ugraf.amvera.io/api"
const BASE_URL = `${API_URL}/friends`

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
 * �������� ������ ������ � ���������� ���������.
 * ���� offset/limit �� ������, ���������� ��� �������� (����������� � ��� �� ������ {total, friends})
 */
export async function getFriends(
  showHidden: boolean = false,
  offset?: number,
  limit?: number
): Promise<{ total: number, friends: Friend[] }> {
  let url = `${BASE_URL}/?`
  if (typeof offset === "number" && typeof limit === "number") {
    url += `offset=${offset}&limit=${limit}`
  }
  if (showHidden) {
    url += (url.endsWith("?") ? "" : "&") + "show_hidden=true"
  }

  // API ����� ������� ��� ������, ��� ������ � ����� ���������� ��� ������!
  const result = await fetchJson<any>(url)
  if (Array.isArray(result)) {
    return { total: result.length, friends: result }
  }
  // � ������ backend ������ ���������� {total, friends}
  return result
}

// ������������� invite-������ (POST)
export async function createInvite(): Promise<FriendInvite> {
  return fetchJson<FriendInvite>(`${BASE_URL}/invite`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    }
  })
}

// ������� invite �� ������ (POST)
export async function acceptInvite(token: string): Promise<{ success: boolean }> {
  return fetchJson<{ success: boolean }>(`${BASE_URL}/accept`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token })
  })
}

// ������ ����� (POST)
export async function hideFriend(friendId: number): Promise<{ success: boolean }> {
  return fetchJson<{ success: boolean }>(`${BASE_URL}/${friendId}/hide`, {
    method: "POST"
  })
}

// ������������ (unhide) ����� (POST)
export async function unhideFriend(friendId: number): Promise<{ success: boolean }> {
  return fetchJson<{ success: boolean }>(`${BASE_URL}/${friendId}/unhide`, {
    method: "POST"
  })
}
