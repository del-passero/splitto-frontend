// src/store/resetAllStores.ts
// Централизованный сброс клиентских Zustand-сторов.
// Чистим localStorage-ключи и, если у стора есть reset(), вызываем его.
// БД не трогаем.

const PERSIST_KEYS = [
  "splitto-groups",
  "splitto-group-members",
  "splitto-transactions",
  "splitto-expense-categories",
  "splitto-group-categories",
  "splitto-currencies",
  "splitto-friends",
  "splitto-settings",
  // "splitto-user" — НЕ трогаем здесь
];

function clearPersistKeys() {
  for (const key of PERSIST_KEYS) {
    try { localStorage.removeItem(key); } catch {}
  }
  // подстраховка: удалить любые splitto-* кроме splitto-user
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i) || "";
      if (k.startsWith("splitto-") && k !== "splitto-user" && !PERSIST_KEYS.includes(k)) {
        localStorage.removeItem(k);
      }
    }
  } catch {}
}

// универсальный помощник: динамически импортируем стор и зовём reset(), если он есть
async function tryReset(loader: () => Promise<any>, exportName: string) {
  try {
    const m: any = await loader();
    const store: any = m?.[exportName];
    const state: any = store?.getState?.();
    const reset: any = state?.reset;
    if (typeof reset === "function") reset();
  } catch {
    /* ignore */
  }
}

async function resetInMemorySafely() {
  await tryReset(() => import("./groupsStore"), "useGroupsStore");
  await tryReset(() => import("./groupMembersStore"), "useGroupMembersStore");
  await tryReset(() => import("./transactionsStore"), "useTransactionsStore");
  await tryReset(() => import("./expenseCategoriesStore"), "useExpenseCategoriesStore");
  await tryReset(() => import("./groupCategoriesStore"), "useGroupCategoriesStore");
  await tryReset(() => import("./currenciesStore"), "useCurrenciesStore");
  await tryReset(() => import("./friendsStore"), "useFriendsStore");
  await tryReset(() => import("./settingsStore"), "useSettingsStore");
}

/** Сбрасывает persist-кэш и in-memory состояние стора (если reset есть). */
export function resetAllStores() {
  clearPersistKeys();
  // выносим в микротаск, чтобы избежать циклических импортов с userStore
  queueMicrotask(() => { void resetInMemorySafely(); });
}
