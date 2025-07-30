// src/api/groupsApi.ts

import type { Group, GroupWithMembers, GroupCreate } from "../types/group"

// Кладём сюда же функцию для получения initData
function getTelegramInitData(): string {
    // @ts-ignore
    return window?.Telegram?.WebApp?.initData || ""
}

// Универсальный API URL (dev/prod fallback)
const API_URL = import.meta.env.VITE_API_URL || "https://splitto-backend-prod-ugraf.amvera.io/api"
const BASE_URL = `${API_URL}/groups`
const MEMBERS_URL = `${API_URL}/group_members`

// Универсальный fetchJson (как в friendsApi)
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

// Получить список групп пользователя
export async function getGroupsByUser(userId: number): Promise<Group[]> {
    const url = `${BASE_URL}/user/${userId}`
    return fetchJson<Group[]>(url)
}

// Получить группу по id (детали без участников)
export async function getGroupById(groupId: number): Promise<Group> {
    return fetchJson<Group>(`${BASE_URL}/${groupId}/detail/`)
}

// Получить группу с участниками
export async function getGroupWithMembers(groupId: number): Promise<GroupWithMembers> {
    const group = await fetchJson<Group>(`${BASE_URL}/${groupId}/detail/`)
    const membersRes = await fetchJson<any[]>(`${MEMBERS_URL}/group/${groupId}`)
    const members = membersRes.map((item: any) => item.user)
    return { ...group, members }
}

// Создать новую группу
export async function createGroup(data: GroupCreate): Promise<Group> {
    const { user_ids, ...groupData } = data
    const group = await fetchJson<Group>(`${BASE_URL}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(groupData)
    })
    if (user_ids && user_ids.length > 0) {
        await Promise.all(
            user_ids.map(userId =>
                fetchJson(`${MEMBERS_URL}/`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ group_id: group.id, user_id: userId })
                })
            )
        )
    }
    return group
}

// Обновить группу (название, описание)
export async function updateGroup(groupId: number, data: Partial<GroupCreate>): Promise<Group> {
    return fetchJson<Group>(`${BASE_URL}/${groupId}/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    })
}

// Удалить группу
export async function deleteGroup(groupId: number): Promise<void> {
    await fetchJson(`${BASE_URL}/${groupId}/`, { method: "DELETE" })
}

// Получить инвайт-ссылку (token) для группы
export async function getGroupInvite(groupId: number): Promise<{ id: number, group_id: number, token: string }> {
    return fetchJson(`${BASE_URL}/${groupId}/invite`, { method: "POST" })
}

// Принять инвайт для группы по токену (добавляет текущего пользователя)
export async function acceptGroupInvite(token: string): Promise<any> {
    return fetchJson(`${BASE_URL}/accept-invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
    })
}
