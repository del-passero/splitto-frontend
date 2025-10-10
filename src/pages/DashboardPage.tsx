// src/pages/DashboardPage.tsx
// Главная страница (Дашборд): каркас по ТЗ + подключённый блок «Мой баланс».
// Остальные секции остаются заглушками. Данные подгружаем только для баланса через hydrateIfNeeded().

import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useDashboardStore } from "../store/dashboardStore"
import DashboardBalanceCard from "../components/dashboard/DashboardBalanceCard"

export default function DashboardPage() {
  const { t } = useTranslation()

  const { hydrateIfNeeded, loading, error } = useDashboardStore((s) => ({
    hydrateIfNeeded: s.hydrateIfNeeded,
    loading: !!s.loading?.global,
    error: s.error,
  }))

  useEffect(() => {
    // грузим данные для баланса и прочего стейта (пока реально используем только баланс)
    hydrateIfNeeded()
  }, [hydrateIfNeeded])

  return (
    <div className="p-3 text-[var(--tg-text-color)] bg-[var(--tg-bg-color)] min-h-screen">
      {/* Заголовок страницы */}
      <h1 className="text-lg font-bold mb-3">{t("home_title", { defaultValue: "Главная" })}</h1>

      {error && (
        <div className="mb-3 text-red-500">
          {t("error_generic", { defaultValue: "Ошибка загрузки" })}: {String(error)}
        </div>
      )}

      {/* 1) Мой баланс (full-width) — реальный компонент */}
      <section aria-label={t("home_balance", { defaultValue: "Мой баланс" })} className="mb-4">
        {/* Компонент сам рисует свою «карточку», поэтому без внешнего Card */}
        <DashboardBalanceCard />
      </section>

      {/* 2) Активность (left) + Топ категорий (right) — заглушки */}
      <section aria-label={t("home_activity_and_categories", { defaultValue: "Активность и категории" })} className="mb-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Активность */}
          <Card>
            <SectionHeader title={t("home_activity", { defaultValue: "Активность" })}>
              <ChipRow>
                <Chip>{t("period_week", { defaultValue: "Неделя" })}</Chip>
                <Chip active>{t("period_month", { defaultValue: "Месяц" })}</Chip>
                <Chip>{t("period_year", { defaultValue: "Год" })}</Chip>
              </ChipRow>
            </SectionHeader>
            <Placeholder height="h-40">
              {t("chart_placeholder", { defaultValue: "График активности" })}
            </Placeholder>
          </Card>

          {/* Топ категорий */}
          <Card>
            <SectionHeader title={t("home_top_categories", { defaultValue: "Топ категорий" })}>
              <ChipRow>
                <Chip>{t("period_week", { defaultValue: "Неделя" })}</Chip>
                <Chip active>{t("period_month", { defaultValue: "Месяц" })}</Chip>
                <Chip>{t("period_year", { defaultValue: "Год" })}</Chip>
              </ChipRow>
            </SectionHeader>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              <ListPlaceholderItem />
              <ListPlaceholderItem />
              <ListPlaceholderItem />
              <ListPlaceholderItem />
              <ListPlaceholderItem />
            </div>
          </Card>
        </div>
      </section>

      {/* 3) Сводка (3 столбца) — заглушка */}
      <section aria-label={t("home_summary", { defaultValue: "Сводка" })} className="mb-4">
        <Card>
          <SectionHeader title={t("home_summary", { defaultValue: "Сводка" })}>
            <div className="flex flex-wrap items-center gap-2">
              <ChipRow>
                <Chip>{t("period_day", { defaultValue: "День" })}</Chip>
                <Chip>{t("period_week", { defaultValue: "Неделя" })}</Chip>
                <Chip active>{t("period_month", { defaultValue: "Месяц" })}</Chip>
                <Chip>{t("period_year", { defaultValue: "Год" })}</Chip>
              </ChipRow>
              <div className="ml-auto">
                <Chip active>{t("currency_current", { defaultValue: "USD" })}</Chip>
              </div>
            </div>
          </SectionHeader>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <SummaryCell label={t("summary_spent", { defaultValue: "Потрачено" })} value="—" />
            <SummaryCell label={t("summary_avg", { defaultValue: "Средний чек" })} value="—" />
            <SummaryCell label={t("summary_my_share", { defaultValue: "Моя доля" })} value="—" />
          </div>
        </Card>
      </section>

      {/* 4) Последние активные группы — заглушка */}
      <section aria-label={t("home_recent_groups", { defaultValue: "Последние активные группы" })} className="mb-4">
        <Card>
          <SectionHeader title={t("home_recent_groups", { defaultValue: "Последние активные группы" })} />
          <div className="space-y-2">
            <RowPlaceholder />
            <RowPlaceholder />
            <RowPlaceholder />
          </div>
        </Card>
      </section>

      {/* 5) Часто делю расходы — заглушка */}
      <section aria-label={t("home_top_partners", { defaultValue: "Часто делю расходы" })} className="mb-4">
        <Card>
          <SectionHeader title={t("home_top_partners", { defaultValue: "Часто делю расходы" })}>
            <ChipRow>
              <Chip>{t("period_week", { defaultValue: "Неделя" })}</Chip>
              <Chip active>{t("period_month", { defaultValue: "Месяц" })}</Chip>
              <Chip>{t("period_year", { defaultValue: "Год" })}</Chip>
            </ChipRow>
          </SectionHeader>
          <div className="overflow-x-auto">
            <div className="flex gap-3 w-max pr-2">
              <CarouselCardPlaceholder />
              <CarouselCardPlaceholder />
              <CarouselCardPlaceholder />
              <CarouselCardPlaceholder />
            </div>
            <div className="mt-2 flex justify-center gap-1">
              <Dot />
              <Dot active />
              <Dot />
            </div>
          </div>
        </Card>
      </section>

      {/* 6) Лента событий — заглушка */}
      <section aria-label={t("home_events", { defaultValue: "Лента событий" })} className="mb-6">
        <Card>
          <SectionHeader title={t("home_events", { defaultValue: "Лента событий" })}>
            <div className="flex items-center gap-2">
              <Chip active>{t("filter_all", { defaultValue: "Все" })}</Chip>
              <IconChip title={t("filter_tx", { defaultValue: "Транзакции" })}>💳</IconChip>
              <IconChip title={t("filter_edit", { defaultValue: "Редактирования" })}>✏️</IconChip>
              <IconChip title={t("filter_groups", { defaultValue: "Группы" })}>👥</IconChip>
              <IconChip title={t("filter_users", { defaultValue: "Юзеры" })}>🧑</IconChip>
            </div>
          </SectionHeader>
          <div className="space-y-2">
            <EventRowPlaceholder />
            <EventRowPlaceholder />
            <EventRowPlaceholder />
            <EventRowPlaceholder />
          </div>
          <div className="mt-3 text-center text-sm text-[var(--tg-link-color)]">
            {t("home_events_more", { defaultValue: "Открыть все события" })}
          </div>
        </Card>
      </section>

      {loading && (
        <div className="text-[var(--tg-hint-color)]">{t("loading", { defaultValue: "Загрузка…" })}</div>
      )}
    </div>
  )
}

/* ========================= */
/* ====== Мелкие UI ======== */
/* ========================= */

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-3 bg-[var(--tg-secondary-bg-color)] shadow-sm border border-[color-mix(in_oklab,var(--tg-border-color)_80%,transparent)]">
      {children}
    </div>
  )
}

function SectionHeader({
  title,
  children,
}: {
  title: string
  children?: React.ReactNode
}) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <h2 className="text-base font-semibold">{title}</h2>
      <div className="ml-auto flex items-center gap-2">{children}</div>
    </div>
  )
}

function Chip({
  children,
  active,
}: {
  children: React.ReactNode
  active?: boolean
}) {
  return (
    <span
      aria-disabled
      className={[
        "px-3 py-1 text-sm rounded-full border",
        "cursor-default select-none",
        active
          ? "bg-[var(--tg-link-color)]/15 border-[var(--tg-link-color)]/30"
          : "bg-[var(--tg-secondary-bg-color)] border-[color-mix(in_oklab,var(--tg-border-color)_80%,transparent)]",
      ].join(" ")}
    >
      {children}
    </span>
  )
}

function ChipRow({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-2">{children}</div>
}

function IconChip({
  children,
  title,
}: {
  children: React.ReactNode
  title: string
}) {
  return (
    <span
      aria-label={title}
      title={title}
      className="inline-flex items-center justify-center w-8 h-8 rounded-full border bg-[var(--tg-secondary-bg-color)] border-[color-mix(in_oklab,var(--tg-border-color)_80%,transparent)] cursor-default select-none"
    >
      {children}
    </span>
  )
}

function Placeholder({
  children,
  height = "h-24",
}: {
  children?: React.ReactNode
  height?: string
}) {
  return (
    <div
      className={[
        "w-full rounded-xl border border-dashed",
        "border-[color-mix(in_oklab,var(--tg-border-color)_80%,transparent)]",
        "bg-[color-mix(in_oklab,var(--tg-secondary-bg-color)_70%,transparent)]",
        "flex items-center justify-center text-[var(--tg-hint-color)] text-sm",
        height,
      ].join(" ")}
    >
      {children}
    </div>
  )
}

function SummaryCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2 rounded-xl bg-[color-mix(in_oklab,var(--tg-secondary-bg-color)_60%,transparent)]">
      <div className="text-xs text-[var(--tg-hint-color)]">{label}</div>
      <div className="text-lg font-semibold">—</div>
    </div>
  )
}

function ListPlaceholderItem() {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg bg-[color-mix(in_oklab,var(--tg-secondary-bg-color)_60%,transparent)]">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-md bg-[color-mix(in_oklab,var(--tg-border-color)_30%,transparent)]" />
        <div className="h-3 w-28 rounded bg-[color-mix(in_oklab,var(--tg-border-color)_30%,transparent)]" />
      </div>
      <div className="h-3 w-16 rounded bg-[color-mix(in_oklab,var(--tg-border-color)_30%,transparent)]" />
    </div>
  )
}

function RowPlaceholder() {
  return (
    <div className="flex items-center gap-3 p-2 rounded-xl bg-[color-mix(in_oklab,var(--tg-secondary-bg-color)_60%,transparent)]">
      <div className="w-10 h-10 rounded-xl bg-[color-mix(in_oklab,var(--tg-border-color)_30%,transparent)]" />
      <div className="flex-1">
        <div className="h-3 w-40 rounded bg-[color-mix(in_oklab,var(--tg-border-color)_30%,transparent)] mb-1" />
        <div className="h-3 w-24 rounded bg-[color-mix(in_oklab,var(--tg-border-color)_20%,transparent)]" />
      </div>
    </div>
  )
}

function CarouselCardPlaceholder() {
  return (
    <div className="w-64 shrink-0 rounded-2xl p-3 border bg-[var(--tg-secondary-bg-color)] border-[color-mix(in_oklab,var(--tg-border-color)_80%,transparent)]">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-[color-mix(in_oklab,var(--tg-border-color)_30%,transparent)]" />
        <div className="flex-1">
          <div className="h-3 w-32 rounded bg-[color-mix(in_oklab,var(--tg-border-color)_30%,transparent)] mb-1" />
          <div className="h-3 w-20 rounded bg-[color-mix(in_oklab,var(--tg-border-color)_20%,transparent)]" />
        </div>
      </div>
      <div className="mt-3 h-3 w-28 rounded bg-[color-mix(in_oklab,var(--tg-border-color)_20%,transparent)]" />
    </div>
  )
}

function Dot({ active = false }: { active?: boolean }) {
  return (
    <span
      className={[
        "inline-block w-2 h-2 rounded-full",
        active ? "bg-[var(--tg-link-color)]" : "bg-[color-mix(in_oklab,var(--tg-border-color)_50%,transparent)]",
      ].join(" ")}
    />
  )
}

function EventRowPlaceholder() {
  return (
    <div className="flex items-start gap-3 p-2 rounded-xl bg-[color-mix(in_oklab,var(--tg-secondary-bg-color)_60%,transparent)]">
      <div className="w-8 h-8 rounded-lg bg-[color-mix(in_oklab,var(--tg-border-color)_30%,transparent)]" />
      <div className="flex-1">
        <div className="h-3 w-56 rounded bg-[color-mix(in_oklab,var(--tg-border-color)_30%,transparent)] mb-1" />
        <div className="h-3 w-40 rounded bg-[color-mix(in_oklab,var(--tg-border-color)_20%,transparent)]" />
      </div>
      <div className="h-3 w-16 rounded bg-[color-mix(in_oklab,var(--tg-border-color)_20%,transparent)]" />
    </div>
  )
}
