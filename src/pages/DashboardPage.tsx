// src/pages/DashboardPage.tsx
// Подключена CreateTransactionModal без t/locale пропсов — i18n внутри модалки.

import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import MainLayout from "../layouts/MainLayout"
import { Users, UserPlus, HandCoins, ChevronRight, TrendingUp, Wallet, List, History } from "lucide-react"
import InviteFriendModal from "../components/InviteFriendModal"
import CreateGroupModal from "../components/CreateGroupModal"
import { useUserStore } from "../store/userStore"
import { useGroupsStore } from "../store/groupsStore"
import CreateTransactionModal from "../components/transactions/CreateTransactionModal"
import { useDashboardStore } from "../store/dashboardStore"
import type { ActivityBucket, RecentGroupCard, TopCategoryItem, TopPartner } from "../types/dashboard"

// Локальные утилиты UI
function Chip({
  active,
  children,
  onClick,
  ariaLabel,
}: {
  active?: boolean
  children: React.ReactNode
  onClick?: () => void
  ariaLabel?: string
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className={[
        "px-3 py-1 rounded-full text-sm border",
        active ? "bg-blue-500 text-white border-blue-500" : "bg-transparent text-current border-zinc-500/40",
      ].join(" ")}
    >
      {children}
    </button>
  )
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="w-full max-w-3xl mx-auto mb-5 px-4">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h2 className="text-base font-semibold">{title}</h2>
      </div>
      <div className="rounded-2xl border border-zinc-500/30 p-3">{children}</div>
    </section>
  )
}

const DashboardPage = () => {
  const { t } = useTranslation()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [createGroupOpen, setCreateGroupOpen] = useState(false)
  const [createTxOpen, setCreateTxOpen] = useState(false)

  const user = useUserStore((s) => s.user)
  const { fetchGroups, groups } = useGroupsStore()

  // Dashboard store
  const {
    loading,
    error,
    balance,
    activity,
    topCategories,
    summary,
    recentGroups,
    topPartners,
    events,
    fetchAll,
  } = useDashboardStore()

  // === Локальные состояния для фильтров/периодов ===
  const [periodActivity, setPeriodActivity] = useState<"week" | "month" | "year">("month")
  const [periodTop, setPeriodTop] = useState<"week" | "month" | "year">("month")
  const [periodPartners, setPeriodPartners] = useState<"week" | "month" | "year">("month")
  const [periodSummary, setPeriodSummary] = useState<"day" | "week" | "month" | "year">("month")

  // Валюты:
  //  - для "Мой баланс": активны 2 последние (если есть) — можно несколько
  //  - для "Сводка": всегда одна выбранная валюта (по умолчанию последняя использованная)
  const lastCurrencies = balance?.last_currencies ?? []
  const [balanceSelected, setBalanceSelected] = useState<Set<string>>(new Set(lastCurrencies))
  const [summaryCurrency, setSummaryCurrency] = useState<string>(lastCurrencies[0] || "USD")

  // При первом успешном фетче — инициализируем валютные выборы
  useEffect(() => {
    if (lastCurrencies.length) {
      if (balanceSelected.size === 0) setBalanceSelected(new Set(lastCurrencies))
      if (!summaryCurrency) setSummaryCurrency(lastCurrencies[0])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastCurrencies.join(","), balance?.i_owe, balance?.they_owe_me])

  // Первичная загрузка
  useEffect(() => {
    // Если нет явной валюты для сводки — сначала пробуем из balance.last_currencies, иначе "USD"
    const cur = summaryCurrency || lastCurrencies[0] || "USD"
    fetchAll(cur, "month")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleGroupCreated = () => {
    setCreateGroupOpen(false)
    if (user?.id) fetchGroups(user.id)
  }

  const fabActions = [
    {
      key: "add-group",
      icon: <Users size={28} strokeWidth={1.5} />,
      onClick: () => setCreateGroupOpen(true),
      ariaLabel: t("create_group"),
      label: t("create_group"),
    },
    {
      key: "add-contact",
      icon: <UserPlus size={28} strokeWidth={1.5} />,
      onClick: () => setInviteOpen(true),
      ariaLabel: t("invite_friend"),
      label: t("invite_friend"),
    },
    {
      key: "add-transaction",
      icon: <HandCoins size={28} strokeWidth={1.5} />,
      onClick: () => setCreateTxOpen(true),
      ariaLabel: t("add_transaction"),
      label: t("add_transaction"),
    },
  ]

  // Служебные вычисления
  const balanceCurrencies = useMemo(() => {
    const keys = new Set<string>()
    Object.keys(balance?.i_owe ?? {}).forEach((k) => keys.add(k))
    Object.keys(balance?.they_owe_me ?? {}).forEach((k) => keys.add(k))
    // при отсутствии — покажем кнопки по last_currencies
    if (!keys.size && lastCurrencies.length) lastCurrencies.forEach((k) => keys.add(k))
    return Array.from(keys)
  }, [balance, lastCurrencies])

  const filteredIOwe = useMemo(() => {
    const res: Record<string, string> = {}
    for (const [ccy, val] of Object.entries(balance?.i_owe ?? {})) {
      if (balanceSelected.has(ccy)) res[ccy] = val
    }
    return res
  }, [balance?.i_owe, balanceSelected])

  const filteredTheyOweMe = useMemo(() => {
    const res: Record<string, string> = {}
    for (const [ccy, val] of Object.entries(balance?.they_owe_me ?? {})) {
      if (balanceSelected.has(ccy)) res[ccy] = val
    }
    return res
  }, [balance?.they_owe_me, balanceSelected])

  // Хэндлеры чипов
  const toggleBalanceCurrency = (ccy: string) => {
    // В "Мой баланс" можно несколько валют: чипы не взаимоисключающие
    const next = new Set(balanceSelected)
    if (next.has(ccy)) next.delete(ccy)
    else next.add(ccy)
    setBalanceSelected(next)
  }

  const switchSummaryCurrency = (ccy: string) => {
    // В "Сводка" чипы взаимоисключающие
    setSummaryCurrency(ccy)
    // перезагружаем необходимые куски
    // activity/top/partners остаются на своих периодах; summary зависит от currency
    // fetchAll тянет весь дашборд — можно, но жирно; обновим точечно — оставим как есть на MVP:
    fetchAll(ccy, periodActivity)
  }

  return (
    <MainLayout fabActions={fabActions}>
      {/* Заголовок */}
      <div className="w-full max-w-3xl mx-auto py-5 px-4">
        <h1 className="text-xl font-bold">{t("main")}</h1>
      </div>

      {/* Ошибка/лоадер */}
      {loading && (
        <div className="w-full max-w-3xl mx-auto px-4 pb-4">
          <div className="text-sm opacity-70">{t("loading")}…</div>
        </div>
      )}
      {error && (
        <div className="w-full max-w-3xl mx-auto px-4 pb-4">
          <div className="text-sm text-red-500">{error}</div>
        </div>
      )}

      {/* 1. Мой баланс (full-width) */}
      <Section title={t("dashboard.my_balance")} icon={<Wallet size={18} />}>
        {/* Чипы валют (названия валют; по умолчанию — две последние активны) */}
        <div className="flex flex-wrap gap-2 mb-3">
          {balanceCurrencies.map((ccy) => (
            <Chip
              key={ccy}
              active={balanceSelected.has(ccy)}
              onClick={() => toggleBalanceCurrency(ccy)}
              ariaLabel={ccy}
            >
              {ccy}
            </Chip>
          ))}
        </div>

        {/* Слева — я ДОЛЖЕН; Справа — мне ДОЛЖНЫ */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl p-3 border border-red-500/30">
            <div className="text-xs opacity-70 mb-1">{t("dashboard.i_owe")}</div>
            <ul className="space-y-1">
              {Object.keys(filteredIOwe).length === 0 && <li className="text-sm opacity-60">—</li>}
              {Object.entries(filteredIOwe).map(([ccy, val]) => (
                <li key={ccy} className="flex items-center justify-between">
                  <span className="text-sm">{ccy}</span>
                  <span className="text-sm text-red-500">{val}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl p-3 border border-emerald-500/30">
            <div className="text-xs opacity-70 mb-1">{t("dashboard.they_owe_me")}</div>
            <ul className="space-y-1">
              {Object.keys(filteredTheyOweMe).length === 0 && <li className="text-sm opacity-60">—</li>}
              {Object.entries(filteredTheyOweMe).map(([ccy, val]) => (
                <li key={ccy} className="flex items-center justify-between">
                  <span className="text-sm">{ccy}</span>
                  <span className="text-sm text-emerald-500">{val}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* 2. Активность (left) + Топ категорий (right) */}
      <section className="w-full max-w-3xl mx-auto mb-5 px-4">
        <div className="grid md:grid-cols-2 gap-4">
          {/* Активность */}
          <div className="rounded-2xl border border-zinc-500/30 p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp size={18} />
                <h2 className="text-base font-semibold">{t("dashboard.activity")}</h2>
              </div>
              <div className="flex gap-2">
                {(["week", "month", "year"] as const).map((p) => (
                  <Chip key={p} active={periodActivity === p} onClick={() => setPeriodActivity(p)}>
                    {t(`period.${p}`)}
                  </Chip>
                ))}
              </div>
            </div>
            {/* Простой placeholder-график (до отдельного компонента) */}
            <div className="h-24 rounded-md bg-zinc-500/10 flex items-end gap-1 p-2 overflow-hidden">
              {(activity?.buckets ?? []).map((b: ActivityBucket) => (
                <div
                  key={b.date}
                  title={`${b.date}: ${b.count}`}
                  className="bg-blue-500/70 rounded-sm"
                  style={{ height: Math.min(100, 8 + b.count * 8), width: 8 }}
                />
              ))}
              {!activity?.buckets?.length && <div className="text-sm opacity-60">{t("no_data")}</div>}
            </div>
          </div>

          {/* Топ категорий */}
          <div className="rounded-2xl border border-zinc-500/30 p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <List size={18} />
                <h2 className="text-base font-semibold">{t("dashboard.top_categories")}</h2>
              </div>
              <div className="flex gap-2">
                {(["week", "month", "year"] as const).map((p) => (
                  <Chip key={p} active={periodTop === p} onClick={() => setPeriodTop(p)}>
                    {t(`period.${p}`)}
                  </Chip>
                ))}
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto pr-1">
              {(topCategories?.items ?? []).map((c: TopCategoryItem) => (
                <div key={`${c.category_id}-${c.currency}`} className="flex items-center justify-between py-1 text-sm">
                  <div className="truncate">{c.name ?? t("category.unknown")}</div>
                  <div className="opacity-80 ml-2">{`${c.sum} ${c.currency}`}</div>
                </div>
              ))}
              {!topCategories?.items?.length && <div className="text-sm opacity-60">{t("no_data")}</div>}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Сводка (3 столбца) */}
      <Section title={t("dashboard.summary")} icon={<History size={18} />}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          {/* Период */}
          <div className="flex gap-2">
            {(["day", "week", "month", "year"] as const).map((p) => (
              <Chip key={p} active={periodSummary === p} onClick={() => setPeriodSummary(p)}>
                {t(`period.${p}`)}
              </Chip>
            ))}
          </div>
          {/* Валюты: показываем только одиночный выбор (взаимоисключающий) */}
          <div className="flex gap-2">
            {(balanceCurrencies.length ? balanceCurrencies : lastCurrencies).map((ccy) => (
              <Chip key={ccy} active={summaryCurrency === ccy} onClick={() => switchSummaryCurrency(ccy)}>
                {ccy}
              </Chip>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl p-3 border border-zinc-500/30">
            <div className="text-xs opacity-70 mb-1">{t("dashboard.spent")}</div>
            <div className="text-lg font-semibold">{summary?.spent ?? "0.00"}</div>
          </div>
          <div className="rounded-xl p-3 border border-zinc-500/30">
            <div className="text-xs opacity-70 mb-1">{t("dashboard.avg_check")}</div>
            <div className="text-lg font-semibold">{summary?.avg_check ?? "0.00"}</div>
          </div>
          <div className="rounded-xl p-3 border border-zinc-500/30">
            <div className="text-xs opacity-70 mb-1">{t("dashboard.my_share")}</div>
            <div className="text-lg font-semibold">{summary?.my_share ?? "0.00"}</div>
          </div>
        </div>
      </Section>

      {/* 4. Последние активные группы (full-width) */}
      <Section title={t("dashboard.recent_groups")} icon={<Users size={18} />}>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(recentGroups ?? []).map((g: RecentGroupCard) => (
            <a
              key={g.id}
              href={`/groups/${g.id}`}
              className="rounded-xl border border-zinc-500/30 p-3 hover:bg-zinc-500/10 transition flex items-center justify-between"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{g.name}</div>
                <div className="text-xs opacity-70 truncate">
                  {Object.entries(g.my_balance_by_currency || {})
                    .map(([ccy, v]) => `${v} ${ccy}`)
                    .join(" · ") || "—"}
                </div>
              </div>
              <ChevronRight size={16} className="opacity-60 shrink-0" />
            </a>
          ))}
          {!recentGroups?.length && <div className="text-sm opacity-60">{t("no_data")}</div>}
        </div>
      </Section>

      {/* 5. Часто делю расходы (full-width, горизонтальная карусель 2 карточки) */}
      <Section title={t("dashboard.top_partners")} icon={<UserPlus size={18} />}>
        {/* Период (уточняем в ТЗ — по умолчанию месяц) */}
        <div className="flex gap-2 mb-3">
          {(["week", "month", "year"] as const).map((p) => (
            <Chip key={p} active={periodPartners === p} onClick={() => setPeriodPartners(p)}>
              {t(`period.${p}`)}
            </Chip>
          ))}
        </div>
        {/* Простой горизонтальный скролл (2 карточки на экран) */}
        <div className="flex gap-3 overflow-x-auto snap-x">
          {(topPartners ?? []).map((p: TopPartner) => (
            <a
              key={p.user.id}
              href={`/users/${p.user.id}`}
              className="snap-start min-w-[calc(50%-0.375rem)] sm:min-w-[240px] rounded-xl border border-zinc-500/30 p-3 hover:bg-zinc-500/10 transition"
            >
              <div className="text-sm font-medium truncate">
                {p.user.first_name || p.user.username || `@${p.user.id}`}
              </div>
              <div className="text-xs opacity-70">{t("dashboard.joint_expenses", { count: p.joint_expense_count })}</div>
            </a>
          ))}
          {!topPartners?.length && <div className="text-sm opacity-60">{t("no_data")}</div>}
        </div>
      </Section>

      {/* 6. Лента событий (full-width) */}
      <Section title={t("dashboard.events_feed")} icon={<History size={18} />}>
        {/* Чипы-фильтры: Все (по умолчанию), Транзакции, Редактирования, Группы, Юзеры.
            Здесь пока просто заголовок и список последних 20 (UI-friendly),
            переход на /events — общей ссылкой ниже. */}
        <div className="space-y-2">
          {(events?.items ?? []).map((e) => (
            <div key={e.id} className="flex items-center justify-between py-1">
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{e.title}</div>
                {e.subtitle && <div className="text-xs opacity-70 truncate">{e.subtitle}</div>}
              </div>
              <div className="text-xs opacity-60">{new Date(e.created_at).toLocaleString()}</div>
            </div>
          ))}
          {!events?.items?.length && <div className="text-sm opacity-60">{t("no_events")}</div>}
          <a
            href="/events"
            className="inline-flex items-center gap-1 text-sm mt-2 text-blue-500 hover:underline"
            aria-label={t("dashboard.show_all_events")}
          >
            {t("dashboard.show_all_events")}
            <ChevronRight size={14} />
          </a>
        </div>
      </Section>

      {/* Модалки */}
      <InviteFriendModal open={inviteOpen} onClose={() => setInviteOpen(false)} inviteLink={null} />

      <CreateGroupModal
        open={createGroupOpen}
        onClose={() => setCreateGroupOpen(false)}
        ownerId={user?.id ?? 0}
        onCreated={handleGroupCreated}
      />

      <CreateTransactionModal
        open={createTxOpen}
        onOpenChange={setCreateTxOpen}
        groups={(groups ?? []).map((g: any) => ({ id: g.id, name: g.name, icon: g.icon, color: g.color }))}
      />
    </MainLayout>
  )
}

export default DashboardPage
