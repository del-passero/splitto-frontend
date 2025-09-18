// src/components/group/GroupBalanceTabSmart.tsx
import { useMemo, useState, useCallback, type ReactNode, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { HandCoins, Bell } from "lucide-react";
import { useUserStore } from "../../store/userStore";

/* ===== Types (как в старом рабочем коде) ===== */
type User = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
};

export type MyDebt = { user: User; amount: number; currency: string }; // >0 — мне должны, <0 — я должен
export type AllDebt = { from: User; to: User; amount: number; currency: string };

type Props = {
  myBalanceByCurrency: Record<string, number>;
  myDebts: MyDebt[];
  allDebts: AllDebt[];
  loading: boolean;
  onFabClick: () => void;

  onRepay?:  (user: User, amount: number, currency: string) => void;
  onRemind?: (user: User, amount: number, currency: string) => void;
};

/* ---------- utils ---------- */
const firstOnly = (u?: User) => {
  if (!u) return "";
  const name = (u.first_name || "").trim();
  return name || u.username || `#${u.id}`;
};

/** «550 TRY» или «45,50 USD»: без копеек, если дробная часть = 0 */
const fmtNoTrailing = (n: number, code: string, locale?: string) => {
  const rounded = Math.round(n * 100) / 100;
  const hasCents = Math.round((rounded % 1) * 100) !== 0;
  try {
    const nf = new Intl.NumberFormat(locale, {
      minimumFractionDigits: hasCents ? 2 : 0,
      maximumFractionDigits: hasCents ? 2 : 0,
    });
    return `${nf.format(rounded)}\u00A0${code}`;
  } catch {
    return `${hasCents ? rounded.toFixed(2) : Math.trunc(rounded)}\u00A0${code}`;
  }
};

function Avatar({ url, alt, size = 56 }: { url?: string; alt?: string; size?: number }) {
  return url ? (
    <img
      src={url}
      alt={alt || ""}
      className="rounded-full object-cover shrink-0"
      style={{ width: size, height: size }}
    />
  ) : (
    <span
      className="rounded-full inline-block shrink-0"
      style={{ width: size, height: size, background: "var(--tg-link-color)" }}
      aria-hidden
    />
  );
}

/* ---------- helpers ---------- */
type CurrencyLine = { currency: string; amount: number }; // абсолют
type CardItem = { user: User; lines: CurrencyLine[]; total: number };

function totalsToInline(by: Record<string, number>, locale?: string) {
  const parts = Object.entries(by)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([ccy, sum]) => fmtNoTrailing(sum, ccy, locale));
  return parts.join("; ");
}

function moreLabel(n: number, locale: string) {
  if (locale === "ru") return `и ещё ${n}`;
  if (locale === "es") return `y ${n} más`;
  return `and ${n} more`;
}
function collapseLabel(locale: string) {
  if (locale === "ru") return "Свернуть";
  if (locale === "es") return "Contraer";
  return "Collapse";
}

/* ================= main ================= */
export default function GroupBalanceTabSmart({
  myBalanceByCurrency, // оставлен для совместимости
  myDebts,
  allDebts,
  loading,
  onFabClick,
  onRepay,
  onRemind,
}: Props) {
  const { t, i18n } = useTranslation();
  const locale = (i18n.language || "ru").split("-")[0];
  const me = useUserStore((s) => s.user);
  const myId = me?.id;

  // локальная заглушка для «Напомнить»
  const [stubOpen, setStubOpen] = useState(false);

  // вкладки: mine / all
  const [tab, setTab] = useState<"mine" | "all">("mine");

  // раскрытие карточек по user.id
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const toggleExpanded = useCallback((uid: number) => {
    setExpanded((prev) => ({ ...prev, [uid]: !prev[uid] }));
  }, []);

  /* подготовка данных для двух колонок */
  const { leftCards, rightCards, leftTotalsInline, rightTotalsInline } = useMemo(() => {
    const leftMap = new Map<number, CardItem>(); // я должен
    const rightMap = new Map<number, CardItem>(); // мне должны
    const leftTotals: Record<string, number> = {};
    const rightTotals: Record<string, number> = {};

    for (const d of myDebts) {
      const abs = Math.abs(d.amount);
      if (abs <= 0) continue;
      const key = d.user.id;

      if (d.amount < 0) {
        const ci = leftMap.get(key) || { user: d.user, lines: [], total: 0 };
        ci.lines.push({ currency: d.currency, amount: abs });
        ci.total += abs;
        leftMap.set(key, ci);
        leftTotals[d.currency] = (leftTotals[d.currency] || 0) + abs;
      } else {
        const ci = rightMap.get(key) || { user: d.user, lines: [], total: 0 };
        ci.lines.push({ currency: d.currency, amount: abs });
        ci.total += abs;
        rightMap.set(key, ci);
        rightTotals[d.currency] = (rightTotals[d.currency] || 0) + abs;
      }
    }

    const sortCards = (a: CardItem, b: CardItem) => b.total - a.total;
    const sortLines = (a: CurrencyLine, b: CurrencyLine) => a.currency.localeCompare(b.currency);

    const leftCards = Array.from(leftMap.values())
      .map((ci) => ({ ...ci, lines: ci.lines.sort(sortLines) }))
      .sort(sortCards);
    const rightCards = Array.from(rightMap.values())
      .map((ci) => ({ ...ci, lines: ci.lines.sort(sortLines) }))
      .sort(sortCards);

    return {
      leftCards,
      rightCards,
      leftTotalsInline: totalsToInline(leftTotals, locale),
      rightTotalsInline: totalsToInline(rightTotals, locale),
    };
  }, [myDebts, locale]);

  /* стили кнопок */
  const btn =
    "h-8 px-3 rounded-xl text-[13px] font-semibold active:scale-95 transition " +
    "bg-gradient-to-b from-[color:var(--tg-secondary-bg-color,#e7e7e7)] to-[color:rgba(0,0,0,0.04)] " +
    "shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_1px_2px_rgba(0,0,0,0.2)] " +
    "hover:brightness-105";

  /* ====== ПАРНАЯ ВЫСОТА: рендерим ПО РЯДАМ (индексам) ====== */
  const pairsCount = Math.max(leftCards.length, rightCards.length);

  return (
    <div className="w-full">
      {/* микротабы */}
      <div className="flex justify-center mt-1 mb-2">
        <div
          className="inline-flex rounded-xl border overflow-hidden"
          style={{ borderColor: "var(--tg-secondary-bg-color,#e7e7e7)" }}
        >
          <button
            type="button"
            onClick={() => setTab("mine")}
            className={`px-3 h-9 text-[13px] ${tab === "mine" ? "bg-[var(--tg-accent-color,#40A7E3)] text-white" : "text-[var(--tg-text-color)]"}`}
          >
            {t("group_balance_microtab_mine")}
          </button>
          <button
            type="button"
            onClick={() => setTab("all")}
            className={`px-3 h-9 text-[13px] ${tab === "all" ? "bg-[var(--tg-accent-color,#40A7E3)] text-white" : "text-[var(--tg-text-color)]"}`}
          >
            {t("group_balance_microtab_all")}
          </button>
        </div>
      </div>

      {/* Контент */}
      <div className="px-2 py-2">
        {loading ? (
          <div className="py-8 text-center text-[var(--tg-hint-color)]">{t("loading")}</div>
        ) : tab === "mine" ? (
          <>
            {/* ====== Мой баланс: заголовки + итоги со скроллом (только здесь) ====== */}
            <div className="grid gap-2 mb-2" style={{ gridTemplateColumns: "1fr 1fr" }}>
              {/* Левая колонка заголовок+итоги */}
              <div className="min-w-0">
                <div className="text-[15px] font-semibold mb-1" style={{ color: "var(--tg-text-color)" }}>
                  {t("i_owe") || "Я должен"}
                </div>
                {leftTotalsInline && (
                  <ScrollHint>
                    <div
                      role="region"
                      tabIndex={0}
                      aria-label={(t("group_balance_totals_aria") as string) || "Totals by currency"}
                      className="text-[12px] overflow-x-auto overflow-y-hidden px-3"
                      style={{
                        color: "var(--tg-text-color)",       // чёрный/белый по теме
                        whiteSpace: "nowrap",
                        WebkitOverflowScrolling: "touch",
                      }}
                    >
                      {leftTotalsInline}
                    </div>
                  </ScrollHint>
                )}
              </div>

              {/* Правая колонка заголовок+итоги */}
              <div className="min-w-0">
                <div className="text-[15px] font-semibold mb-1" style={{ color: "var(--tg-text-color)" }}>
                  {t("they_owe_me") || "Мне должны"}
                </div>
                {rightTotalsInline && (
                  <ScrollHint>
                    <div
                      role="region"
                      tabIndex={0}
                      aria-label={(t("group_balance_totals_aria") as string) || "Totals by currency"}
                      className="text-[12px] overflow-x-auto overflow-y-hidden px-3"
                      style={{
                        color: "var(--tg-text-color)",
                        whiteSpace: "nowrap",
                        WebkitOverflowScrolling: "touch",
                      }}
                    >
                      {rightTotalsInline}
                    </div>
                  </ScrollHint>
                )}
              </div>
            </div>

            {/* Пары карточек: по рядам. Если в паре есть раскрытая карточка — НЕ выравниваем высоту в этой строке */}
            {pairsCount === 0 ? (
              <div className="text-[13px] text-[var(--tg-hint-color)]">
                {t("group_balance_no_debts_left") || "Нет долгов"}
              </div>
            ) : (
              Array.from({ length: pairsCount }).map((_, idx) => {
                const L = leftCards[idx];
                const R = rightCards[idx];
                const leftExpanded  = L ? !!expanded[L.user.id] : false;
                const rightExpanded = R ? !!expanded[R.user.id] : false;
                const pairAlign = !(leftExpanded || rightExpanded); // если кто-то раскрыт — перестаём матчить высоту

                return (
                  <div
                    key={`pair-${idx}`}
                    className={`flex gap-2 mb-2 ${pairAlign ? "items-stretch" : "items-start"}`}
                  >
                    {/* LEFT */}
                    <div className="flex-1">
                      {L ? (
                        <DebtCardLeft
                          card={L}
                          expanded={leftExpanded}
                          onToggle={() => toggleExpanded(L.user.id)}
                          locale={locale}
                          onRepay={onRepay}
                          matchHeight={pairAlign}
                        />
                      ) : (
                        <div
                          className="rounded-xl border p-2 opacity-30"
                          style={{ borderColor: "var(--tg-secondary-bg-color,#e7e7e7)" }}
                        />
                      )}
                    </div>

                    {/* RIGHT */}
                    <div className="flex-1">
                      {R ? (
                        <DebtCardRight
                          card={R}
                          expanded={rightExpanded}
                          onToggle={() => toggleExpanded(R.user.id)}
                          locale={locale}
                          onRemind={(user, amount, currency) => {
                            setStubOpen(true); // чтобы модалка гарантированно показалась
                            onRemind?.(user, amount, currency);
                          }}
                          matchHeight={pairAlign}
                        />
                      ) : (
                        <div
                          className="rounded-xl border p-2 opacity-30"
                          style={{ borderColor: "var(--tg-secondary-bg-color,#e7e7e7)" }}
                        />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </>
        ) : (
          /* ================= Все балансы: 2 строки на элемент ================= */
          <AllBalances
            allDebts={allDebts}
            locale={locale}
            myId={myId}
            onRepay={onRepay}
            onRemind={(user, amount, currency) => {
              setStubOpen(true);
              onRemind?.(user, amount, currency);
            }}
            t_owes={(t("tx_modal.owes") as string) || "owes"}
          />
        )}
      </div>

      {/* Временная модалка-заглушка для "Напомнить" */}
      {stubOpen && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center" onClick={() => setStubOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="relative max-w-[84vw] w-[420px] rounded-xl border bg-[var(--tg-card-bg)] text-[var(--tg-text-color)] p-4 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.5)]"
            style={{ borderColor: "var(--tg-secondary-bg-color,#e7e7e7)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-[15px] font-semibold mb-2">{t("remind_debt")}</div>
            <div className="text-[14px] opacity-80 mb-3">{t("debts_reserved")}</div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setStubOpen(false)}
                className="h-9 px-4 rounded-xl bg-[var(--tg-accent-color,#40A7E3)] text-white font-semibold active:scale-95 transition"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* скрытая кнопка для FAB (совместимость со старым кодом) */}
      <div className="hidden">
        <button type="button" onClick={onFabClick} />
      </div>

      {/* стили для скролл-хинтов и т.п. */}
      <StyleOnce />
    </div>
  );
}

/* ====== Компоненты карточек (левая/правая) ====== */

function DebtCardLeft({
  card,
  expanded,
  onToggle,
  locale,
  onRepay,
  matchHeight,
}: {
  card: CardItem;
  expanded: boolean;
  onToggle: () => void;
  locale: string;
  onRepay?: (user: User, amount: number, currency: string) => void;
  matchHeight: boolean;
}) {
  const btn =
    "h-8 px-3 rounded-xl text-[13px] font-semibold active:scale-95 transition " +
    "bg-gradient-to-b from-[color:var(--tg-secondary-bg-color,#e7e7e7)] to-[color:rgba(0,0,0,0.04)] " +
    "shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_1px_2px_rgba(0,0,0,0.2)] " +
    "hover:brightness-105";

  const visible = expanded ? card.lines : card.lines.slice(0, 2);
  const rest = Math.max(0, card.lines.length - visible.length);

  return (
    <div
      className={`rounded-xl border p-2 flex flex-col ${matchHeight ? "h-full" : ""}`}
      style={{ borderColor: "var(--tg-secondary-bg-color,#e7e7e7)", background: "var(--tg-card-bg)" }}
    >
      {/* шапка */}
      <div className="flex items-center gap-2 mb-1">
        <Avatar url={card.user.photo_url} alt={firstOnly(card.user)} />
        <div className="text-[14px] font-medium truncate" style={{ color: "var(--tg-text-color)" }} title={firstOnly(card.user)}>
          {firstOnly(card.user)}
        </div>
      </div>

      {/* строки валют: грид 2 колонки */}
      <div className="grid gap-1" style={{ gridTemplateColumns: "1fr auto" }}>
        {visible.map((ln, i) => (
          <FragmentRow
            key={card.user.id + "-L-" + ln.currency + "-" + i}
            left={
              <div className="text-[14px] font-semibold" style={{ color: "var(--tg-destructive-text,#ff5a5f)" }}>
                {fmtNoTrailing(ln.amount, ln.currency, locale)}
              </div>
            }
            right={
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => onRepay?.(card.user, ln.amount, ln.currency)}
                  className={btn}
                  aria-label="Settle up"
                  title="Settle up"
                >
                  <HandCoins size={18} />
                </button>
              </div>
            }
          />
        ))}
      </div>

      {/* «и ещё N / Свернуть» — ближе к сумме */}
      {card.lines.length > 2 && (
        <div className="mt-0.5">
          {!expanded ? (
            <button
              type="button"
              onClick={onToggle}
              className="text-[12px] opacity-80 hover:opacity-100"
              style={{ color: "var(--tg-link-color)" }}
            >
              {moreLabel(rest, locale)}
            </button>
          ) : (
            <button
              type="button"
              onClick={onToggle}
              className="text-[12px] opacity-80 hover:opacity-100"
              style={{ color: "var(--tg-link-color)" }}
            >
              {collapseLabel(locale)}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function DebtCardRight({
  card,
  expanded,
  onToggle,
  locale,
  onRemind,
  matchHeight,
}: {
  card: CardItem;
  expanded: boolean;
  onToggle: () => void;
  locale: string;
  onRemind?: (user: User, amount: number, currency: string) => void;
  matchHeight: boolean;
}) {
  const btn =
    "h-8 px-3 rounded-xl text-[13px] font-semibold active:scale-95 transition " +
    "bg-gradient-to-b from-[color:var(--tg-secondary-bg-color,#e7e7e7)] to-[color:rgba(0,0,0,0.04)] " +
    "shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_1px_2px_rgba(0,0,0,0.2)] " +
    "hover:brightness-105";

  const visible = expanded ? card.lines : card.lines.slice(0, 2);
  const rest = Math.max(0, card.lines.length - visible.length);

  return (
    <div
      className={`rounded-xl border p-2 flex flex-col ${matchHeight ? "h-full" : ""}`}
      style={{ borderColor: "var(--tg-secondary-bg-color,#e7e7e7)", background: "var(--tg-card-bg)" }}
    >
      {/* шапка */}
      <div className="flex items-center gap-2 mb-1">
        <Avatar url={card.user.photo_url} alt={firstOnly(card.user)} />
        <div className="text-[14px] font-medium truncate" style={{ color: "var(--tg-text-color)" }} title={firstOnly(card.user)}>
          {firstOnly(card.user)}
        </div>
      </div>

      {/* сетка: слева суммы, справа ЕДИНСТВЕННАЯ кнопка по вертикальному центру видимых строк */}
      <div className="grid" style={{ gridTemplateColumns: "1fr auto", columnGap: 6 }}>
        <div className="flex flex-col gap-1">
          {visible.map((ln, i) => (
            <div
              key={card.user.id + "-R-" + ln.currency + "-" + i}
              className="text-[14px] font-semibold"
              style={{ color: "var(--tg-success-text,#2ecc71)" }}
            >
              {fmtNoTrailing(ln.amount, ln.currency, locale)}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => {
              const first = visible[0];
              if (first) onRemind?.(card.user, first.amount, first.currency);
            }}
            className={btn}
            aria-label="Remind"
            title="Remind"
          >
            <Bell size={18} />
          </button>
        </div>
      </div>

      {card.lines.length > 2 && (
        <div className="mt-0.5">
          {!expanded ? (
            <button
              type="button"
              onClick={onToggle}
              className="text-[12px] opacity-80 hover:opacity-100"
              style={{ color: "var(--tg-link-color)" }}
            >
              {moreLabel(rest, locale)}
            </button>
          ) : (
            <button
              type="button"
              onClick={onToggle}
              className="text-[12px] opacity-80 hover:opacity-100"
              style={{ color: "var(--tg-link-color)" }}
            >
              {collapseLabel(locale)}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ===== Вкладка «Все балансы» — 2 строки, без бегущих имён ===== */
function AllBalances({
  allDebts,
  locale,
  myId,
  onRepay,
  onRemind,
  t_owes,
}: {
  allDebts: AllDebt[];
  locale: string;
  myId?: number;
  onRepay?: (user: User, amount: number, currency: string) => void;
  onRemind?: (user: User, amount: number, currency: string) => void;
  t_owes: string;
}) {
  return (
    <div>
      {allDebts.length === 0 ? (
        <div className="text-[13px] text-[var(--tg-hint-color)]">—</div>
      ) : (
        allDebts.map((p, idx) => {
          const iAmDebtor = myId != null && p.from.id === myId;
          const iAmCreditor = myId != null && p.to.id === myId;

          const amountColor =
            iAmDebtor ? "var(--tg-destructive-text,#ff5a5f)" :
            iAmCreditor ? "var(--tg-success-text,#2ecc71)" :
            "var(--tg-text-color)";

          return (
            <div
              key={`${idx}-${p.currency}-${p.from.id}-${p.to.id}`}
              className="rounded-xl border mb-2 p-2"
              style={{ borderColor: "var(--tg-secondary-bg-color,#e7e7e7)", background: "var(--tg-card-bg)" }}
            >
              {/* Строка 1: аватар должника + имя + owes + аватар кредитора + имя */}
              <div className="flex items-center gap-2 min-w-0">
                <Avatar url={p.from.photo_url} alt={firstOnly(p.from)} size={36} />
                <span className="text-[14px] text-[var(--tg-text-color)] font-medium truncate">
                  {firstOnly(p.from)}
                </span>
                <span className="text-[14px] mx-1" style={{ color: "var(--tg-text-color)" }}>
                  {t_owes}
                </span>
                <Avatar url={p.to.photo_url} alt={firstOnly(p.to)} size={36} />
                <span className="text-[14px] text-[var(--tg-text-color)] font-medium truncate">
                  {firstOnly(p.to)}
                </span>
              </div>

              {/* Строка 2: сумма под «owes», кнопка справа от суммы */}
              <div className="grid mt-1 items-center" style={{ gridTemplateColumns: "1fr auto", columnGap: 8 }}>
                <div className="text-[14px] font-semibold" style={{ color: amountColor }}>
                  {fmtNoTrailing(p.amount, p.currency, locale)}
                </div>
                <div className="flex items-center justify-end">
                  {iAmDebtor ? (
                    <button
                      type="button"
                      onClick={() => onRepay?.(p.to, Math.abs(p.amount), p.currency)}
                      className="h-8 px-3 rounded-xl text-[13px] font-semibold active:scale-95 transition bg-gradient-to-b from-[color:var(--tg-secondary-bg-color,#e7e7e7)] to-[color:rgba(0,0,0,0.04)] shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_1px_2px_rgba(0,0,0,0.2)] hover:brightness-105"
                      aria-label="Settle up"
                      title="Settle up"
                    >
                      <HandCoins size={18} />
                    </button>
                  ) : iAmCreditor ? (
                    <button
                      type="button"
                      onClick={() => onRemind?.(p.from, Math.abs(p.amount), p.currency)}
                      className="h-8 px-3 rounded-xl text-[13px] font-semibold active:scale-95 transition bg-gradient-to-b from-[color:var(--tg-secondary-bg-color,#e7e7e7)] to-[color:rgba(0,0,0,0.04)] shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_1px_2px_rgba(0,0,0,0.2)] hover:brightness-105"
                      aria-label="Remind"
                      title="Remind"
                    >
                      <Bell size={18} />
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

/* ===== Хинт-обёртка для горизонтального скролла: мягкие тени по краям + внутренние отступы ===== */
function ScrollHint({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative ${className || ""}`}>
      {children /* у детей уже есть padding-inline: 12px */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-[color:var(--tg-bg-color,#111)] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-[color:var(--tg-bg-color,#111)] to-transparent" />
    </div>
  );
}

/* ===== Вспомогательная строка 2-колоночной сетки ===== */
function FragmentRow({ left, right }: { left: ReactNode; right: ReactNode }) {
  return (
    <>
      <div className="min-w-0">{left}</div>
      <div>{right}</div>
    </>
  );
}

/* ===== Инъекция стилей один раз ===== */
function StyleOnce() {
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (document.getElementById("gbts-scrollhint-style")) return;
    const style = document.createElement("style");
    style.id = "gbts-scrollhint-style";
    style.innerHTML = `
      /* можно добавить дополнительные мелочи при необходимости */
    `;
    document.head.appendChild(style);
  }, []);
  return null;
}

