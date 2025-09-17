// src/components/group/GroupBalanceTabSmart.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
// если используете lucide-react — можно импортить иконки, но тут я сделал текстовые кнопки 💵/💬,
// чтобы не тащить зависимость в пример. При желании замените на <Banknote/> и <MessageCircle/>.

type User = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
};

export type MyDebt = { user: User; amount: number; currency: string }; // >0 — вам должны, <0 — вы должны
export type AllDebt = { from: User; to: User; amount: number; currency: string };

type Props = {
  myBalanceByCurrency: Record<string, number>;
  myDebts: MyDebt[];
  allDebts: AllDebt[];
  loading: boolean;
  onFabClick: () => void;

  onRepay?: (user: User, amount: number, currency: string) => void;
  onRemind?: (user: User, amount: number, currency: string) => void;
};

/* ---------- utils ---------- */
const DECLESS = new Set(["JPY", "KRW", "VND"]);
const decimalsByCode = (c?: string | null) => (c && DECLESS.has(c) ? 0 : 2);
const fmtMoney = (n: number, code?: string | null) => {
  const d = decimalsByCode(code);
  try {
    return `${new Intl.NumberFormat(undefined, { minimumFractionDigits: d, maximumFractionDigits: d }).format(n)} ${code || ""}`.trim();
  } catch {
    return `${n.toFixed(d)} ${code || ""}`.trim();
  }
};
const firstOnly = (u?: User) => {
  if (!u) return "";
  const name = (u.first_name || "").trim();
  return name || u.username || `#${u.id}`;
};

function MiniAvatar({ url, alt, size = 28 }: { url?: string; alt?: string; size?: number }) {
  return url ? (
    <img src={url} alt={alt || ""} className="rounded-full object-cover shrink-0" style={{ width: size, height: size }} />
  ) : (
    <span className="rounded-full inline-block shrink-0" style={{ width: size, height: size, background: "var(--tg-link-color)" }} aria-hidden />
  );
}

/* ---------- helpers для «двух колонок» ---------- */
type CurrencyLine = { currency: string; amount: number }; // всегда абсолют
type CardItem = { user: User; lines: CurrencyLine[]; total: number };

function aggregateTotals(lines: CurrencyLine[]) {
  const by: Record<string, number> = {};
  for (const l of lines) by[l.currency] = (by[l.currency] || 0) + l.amount;
  return by;
}
function totalsToInline(by: Record<string, number>) {
  // "100 RUB, 28 BYN, 5 USD"
  const entries = Object.entries(by);
  if (entries.length === 0) return "";
  return entries
    .map(([ccy, sum]) => fmtMoney(sum, ccy))
    .join(", ");
}

/* ---------- constants ---------- */
const ITEM_VPAD = 6;
const SEP_LEFT_INSET = 12;

/* ---------- main ---------- */
export default function GroupBalanceTabSmart({
  myBalanceByCurrency, myDebts, allDebts, loading, onFabClick, onRepay, onRemind,
}: Props) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<"mine" | "all">("mine");

  // long-press для контекстного меню (оставил — пригодится)
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedForMenu, setSelectedForMenu] = useState<{ user: User; amount: number; currency: string; direction: "owe" | "get" } | null>(null);
  const timer = useRef<number | null>(null);
  const startPress = (payload: { user: User; amount: number; currency: string; direction: "owe" | "get" }) => {
    clearPress();
    timer.current = window.setTimeout(() => { setSelectedForMenu(payload); setSheetOpen(true); }, 420);
  };
  const clearPress = () => { if (timer.current) window.clearTimeout(timer.current); timer.current = null; };

  /* ===== подготавливаем данные для двух колонок (только для mine) =====
     leftCards  — Я должен (amount < 0)
     rightCards — Мне должны (amount > 0)
  */
  const { leftCards, rightCards, leftTotalsInline, rightTotalsInline } = useMemo(() => {
    const leftMap = new Map<number, CardItem>();
    const rightMap = new Map<number, CardItem>();

    const leftTotals: Record<string, number> = {};
    const rightTotals: Record<string, number> = {};

    for (const d of myDebts) {
      const abs = Math.abs(d.amount);
      if (abs <= 0) continue;
      const key = d.user.id;
      if (d.amount < 0) {
        // я должен этому пользователю
        const ci = leftMap.get(key) || { user: d.user, lines: [], total: 0 };
        ci.lines.push({ currency: d.currency, amount: abs });
        ci.total += abs;
        leftMap.set(key, ci);
        leftTotals[d.currency] = (leftTotals[d.currency] || 0) + abs;
      } else {
        // этот пользователь должен мне
        const ci = rightMap.get(key) || { user: d.user, lines: [], total: 0 };
        ci.lines.push({ currency: d.currency, amount: abs });
        ci.total += abs;
        rightMap.set(key, ci);
        rightTotals[d.currency] = (rightTotals[d.currency] || 0) + abs;
      }
    }

    // сортируем карточки по убыванию total
    const sortCards = (a: CardItem, b: CardItem) => b.total - a.total;
    const leftCards = Array.from(leftMap.values()).map(ci => ({ ...ci, lines: ci.lines.sort((a,b)=>a.currency.localeCompare(b.currency)) })).sort(sortCards);
    const rightCards = Array.from(rightMap.values()).map(ci => ({ ...ci, lines: ci.lines.sort((a,b)=>a.currency.localeCompare(b.currency)) })).sort(sortCards);

    return {
      leftCards,
      rightCards,
      leftTotalsInline: totalsToInline(leftTotals),
      rightTotalsInline: totalsToInline(rightTotals),
    };
  }, [myDebts]);

  const owesWord = ((t("tx_modal.owes") as string) || "owes").toLowerCase();

  return (
    <div className="w-full">
      {/* микротабы */}
      <div className="flex justify-center mt-1 mb-2">
        <div className="inline-flex rounded-xl border overflow-hidden" style={{ borderColor: "var(--tg-secondary-bg-color,#e7e7e7)" }}>
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
          /* ================= Мой баланс: две колонки ================= */
          <div className="grid gap-3"
               style={{ gridTemplateColumns: "1fr 1fr" }}>
            {/* Левая колонка — Я должен */}
            <div className="min-w-0">
              <div className="text-[15px] font-semibold mb-1" style={{ color: "var(--tg-text-color)" }}>
                {t("i_owe") || "Я должен"}
              </div>
              {leftTotalsInline && (
                <div className="text-[12px] mb-2" style={{ color: "var(--tg-hint-color)" }}>
                  {leftTotalsInline}
                </div>
              )}

              {leftCards.length === 0 ? (
                <div className="text-[13px] text-[var(--tg-hint-color)]">{t("group_balance_no_debts_left") || "Нет долгов"}</div>
              ) : (
                leftCards.map((card, ci) => (
                  <div key={card.user.id + "-L"} className="rounded-2xl border mb-2 p-10 pb-2 pt-2"
                       style={{ borderColor: "var(--tg-secondary-bg-color,#e7e7e7)", background: "var(--tg-card-bg)" }}>
                    {/* шапка карточки: аватар + имя в одной строке */}
                    <div className="flex items-center gap-2 pb-2">
                      <MiniAvatar url={card.user.photo_url} alt={firstOnly(card.user)} />
                      <div className="text-[14px] font-medium" style={{ color: "var(--tg-text-color)" }}>
                        {firstOnly(card.user)}
                      </div>
                    </div>

                    {/* строки валют: сумма (красная) + кнопка погасить справа */}
                    <div className="flex flex-col gap-2">
                      {card.lines.map((ln, i) => (
                        <div
                          key={card.user.id + "-L-" + ln.currency + "-" + i}
                          className="grid items-center"
                          style={{ gridTemplateColumns: "1fr auto", columnGap: 8 }}
                          onPointerDown={() => startPress({ user: card.user, amount: ln.amount, currency: ln.currency, direction: "owe" })}
                          onPointerUp={clearPress}
                          onPointerLeave={clearPress}
                        >
                          <div className="text-[14px] font-semibold"
                               style={{ color: "var(--tg-destructive-text,#ff5a5f)" }}>
                            {fmtMoney(ln.amount, ln.currency)}
                          </div>
                          <button
                            type="button"
                            onClick={() => onRepay?.(card.user, ln.amount, ln.currency)}
                            className="h-8 px-3 rounded-xl text-[13px] font-semibold bg-[color:var(--tg-secondary-bg-color,#e7e7e7)] hover:opacity-90 active:scale-95 transition"
                            aria-label="Repay"
                          >
                            💵
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Правая колонка — Мне должны */}
            <div className="min-w-0">
              <div className="text-[15px] font-semibold mb-1" style={{ color: "var(--tg-text-color)" }}>
                {t("they_owe_me") || "Мне должны"}
              </div>
              {rightTotalsInline && (
                <div className="text-[12px] mb-2" style={{ color: "var(--tg-hint-color)" }}>
                  {rightTotalsInline}
                </div>
              )}

              {rightCards.length === 0 ? (
                <div className="text-[13px] text-[var(--tg-hint-color)]">{t("group_balance_no_debts_right") || "Никто не должен"}</div>
              ) : (
                rightCards.map((card) => (
                  <div key={card.user.id + "-R"} className="rounded-2xl border mb-2 p-10 pb-2 pt-2"
                       style={{ borderColor: "var(--tg-secondary-bg-color,#e7e7e7)", background: "var(--tg-card-bg)" }}>
                    {/* шапка карточки: аватар + имя */}
                    <div className="flex items-center gap-2 pb-2">
                      <MiniAvatar url={card.user.photo_url} alt={firstOnly(card.user)} />
                      <div className="text-[14px] font-medium" style={{ color: "var(--tg-text-color)" }}>
                        {firstOnly(card.user)}
                      </div>
                    </div>

                    {/* строки валют (зелёные) + одна кнопка справа по центру */}
                    <div className="grid" style={{ gridTemplateColumns: "1fr auto", columnGap: 8 }}>
                      <div className="flex flex-col gap-2">
                        {card.lines.map((ln, i) => (
                          <div key={card.user.id + "-R-" + ln.currency + "-" + i}
                               className="text-[14px] font-semibold"
                               style={{ color: "var(--tg-success-text,#2ecc71)" }}
                               onPointerDown={() => startPress({ user: card.user, amount: ln.amount, currency: ln.currency, direction: "get" })}
                               onPointerUp={clearPress}
                               onPointerLeave={clearPress}
                          >
                            {fmtMoney(ln.amount, ln.currency)}
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center">
                        <button
                          type="button"
                          onClick={() => {
                            // одна кнопка на всю карточку — передадим суммарную информацию
                            const totalFirst = card.lines[0];
                            onRemind?.(card.user, totalFirst?.amount ?? 0, totalFirst?.currency ?? "");
                          }}
                          className="h-8 px-3 rounded-xl text-[13px] font-semibold bg-[color:var(--tg-secondary-bg-color,#e7e7e7)] hover:opacity-90 active:scale-95 transition"
                          aria-label="Remind"
                        >
                          💬
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          /* ================= Все балансы: прежний список ================= */
          <>
            {allDebts.length === 0 ? (
              <div className="text-[13px] text-[var(--tg-hint-color)]">{t("group_balance_no_debts_all")}</div>
            ) : (
              <div>
                {allDebts.map((p, idx) => (
                  <div key={`${idx}-${p.currency}`} className="relative">
                    <div className={`py-${ITEM_VPAD}`}>
                      <div className="grid items-center" style={{ gridTemplateColumns: "1fr auto", columnGap: 8 }}>
                        <div className="min-w-0 flex items-center gap-2">
                          <MiniAvatar url={p.from.photo_url} alt={firstOnly(p.from)} size={22} />
                          <span className="text-[14px] text-[var(--tg-text-color)] font-medium overflow-visible">{firstOnly(p.from)}</span>
                          <span className="text-[14px] text-[var(--tg-text-color)] opacity-90">{owesWord}</span>
                          <MiniAvatar url={p.to.photo_url} alt={firstOnly(p.to)} size={22} />
                          <span className="text-[14px] text-[var(--tg-text-color)] font-medium overflow-visible">{firstOnly(p.to)}</span>
                        </div>
                        <div className="text-[14px] font-semibold text-[var(--tg-text-color)] text-right">
                          {fmtMoney(p.amount, p.currency)}
                        </div>
                      </div>
                    </div>
                    {idx !== allDebts.length - 1 && (
                      <div className="absolute right-0 bottom-0 h-px bg-[var(--tg-hint-color)] opacity-15" style={{ left: SEP_LEFT_INSET }} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* простое контекстное меню по long-press (для будущих действий) */}
      {sheetOpen && selectedForMenu && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center" onClick={() => setSheetOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="relative max-w-[84vw] w-[420px] rounded-2xl bg-[var(--tg-card-bg)] text-[var(--tg-text-color)] border border-[var(--tg-secondary-bg-color,#e7e7e7)] shadow-[0_20px_60px_-20px_rgba(0,0,0,0.5)] p-2"
            onClick={(e) => e.stopPropagation()}
          >
            {selectedForMenu.direction === "owe" ? (
              <button
                type="button"
                className="w-full text-left px-4 py-3 rounded-xl text-[14px] font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition"
                onClick={() => { onRepay?.(selectedForMenu.user, selectedForMenu.amount, selectedForMenu.currency); setSheetOpen(false); }}
              >
                {t("repay_debt")}
              </button>
            ) : (
              <button
                type="button"
                className="w-full text-left px-4 py-3 rounded-xl text-[14px] font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition"
                onClick={() => { onRemind?.(selectedForMenu.user, selectedForMenu.amount, selectedForMenu.currency); setSheetOpen(false); }}
              >
                {t("remind_debt")}
              </button>
            )}
            <div className="h-px bg-[var(--tg-hint-color)] opacity-10 my-1" />
            <button
              type="button"
              className="w-full text-center px-4 py-3 rounded-xl text-[14px] hover:bg-black/5 dark:hover:bg-white/5 transition"
              onClick={() => setSheetOpen(false)}
            >
              {t("cancel")}
            </button>
          </div>
        </div>
      )}

      {/* скрытая кнопка для FAB */}
      <div className="hidden"><button type="button" onClick={onFabClick} /></div>
    </div>
  );
}
