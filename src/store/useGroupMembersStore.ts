// src/store/useGroupMembersStore.ts

import { create } from "zustand"
import type { GroupUser } from "../types/group"

// Получение initData из Telegram WebApp
function getTelegramInitData(): string {
    // @ts-ignore
    return window?.Telegram?.WebApp?.initData || ""
}

// Универсальный API URL (dev/prod fallback)
const API_URL = import.meta.env.VITE_API_URL || "https://splitto-backend-prod-ugraf.amvera.io/api"
const MEMBERS_URL = `${API_URL}/group_members`

// Универсальный fetch с авторизацией
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

interface GroupMembersState {
    membersByGroup: Record<number, GroupUser[]>
    loading: boolean
    error: string | null

    fetchMembers: (groupId: number) => Promise<GroupUser[]>
    addMember: (groupId: number, user: GroupUser) => Promise<void>
    setMembersForGroup: (groupId: number, members: GroupUser[]) => void
}

export const useGroupMembersStore = create<GroupMembersState>((set, get) => ({
    membersByGroup: {},
    loading: false,
    error: null,

    // Загрузить участников для одной группы
    async fetchMembers(groupId) {
        set({ loading: true, error: null })
        try {
            const data = await fetchJson<any[]>(`${MEMBERS_URL}/group/${groupId}`)
            // В ответе [{id, group_id, user: {...}}], вытаскиваем только user
            const members = data.map((item: any) => item.user)
            set(state => ({
                membersByGroup: { ...state.membersByGroup, [groupId]: members }
            }))
            return members
        } catch (err: any) {
            set({ error: err?.message || "Ошибка загрузки участников" })
            return []
        } finally {
            set({ loading: false })
        }
    },

    // Добавить участника в группу
    async addMember(groupId, user) {
        set({ loading: true, error: null })
        try {
            await fetchJson(`${MEMBERS_URL}/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ group_id: groupId, user_id: user.id })
            })
            await get().fetchMembers(groupId)
        } catch (err: any) {
            set({ error: err?.message || "Ошибка добавления участника" })
        } finally {
            set({ loading: false })
        }
    },

    // Локально обновить участников (например, после редактирования)
    setMembersForGroup(groupId, members) {
        set(state => ({
            membersByGroup: { ...state.membersByGroup, [groupId]: members }
        }))
    }
}))
