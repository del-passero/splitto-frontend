// src/api/friendsApi.ts

import { Friend, FriendInvite } from "../types/friend"

// ��������� initData �� Telegram WebApp
function getTelegramInitData(): string {
  // @ts-ignore
  return window?.Telegram?.WebApp?.initData || ""
}

// ������������� API URL (dev/prod fallback)
const API_URL = import.meta.env.VITE_API_URL || "https://splitto-backend-prod-ugraf.amvera.io/api"
const BASE_URL = `${API_URL}/friends`

// ������������� fetch � �������������� ����������� �����������
async function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const headers: HeadersInit = {
    ...(init?.headers || {}),
    // ����� initData ������ ��� ��� backend (x-telegram-initdata)
    "x-telegram-initdata": getTelegramInitData(),
  }
  const res = await fetch(input, { ...init, headers })
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail?.code || errorData.detail || res.statusText)
  }
  return await res.json()
}

// �������� ������ ������ ��� ������� ������
export async function getFriends(showHidden: boolean = false): Promise<Friend[]> {
  const url = showHidden ? `${BASE_URL}/?show_hidden=true` : `${BASE_URL}/`
  return fetchJson<Friend[]>(url)
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
