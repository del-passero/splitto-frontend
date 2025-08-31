// src/components/group/GroupBalanceTabSmart.tsx
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

type User = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
};

export type MyDebt = { user: User; amount: number }; // >0 — вам должны, <0 — вы должны
export type AllDebt = { from: User; to: User; amount: number };

type Props = {
  myBalance: number;
  myDebts: MyDebt[];
  allDebts: AllDebt[];
  loading: boolean;
  onFabClick: () => void;
  currency?: string | null;
};

const decimalsByCode = (code?: string | null) =>
  code && ["JPY", "KRW", "VND"].includes(code) ? 0 : 2;

const fmtMoney = (n: number, code?: string | null) => {
  const d = decimalsByCode(code || undefined);
  try {
    return `${new Intl.NumberFormat(undefined, {
      minimumFractionDigits: d,
      maximumFractionDigits: d,
    }).format(n)} ${code || ""}`.trim();
  } catch {
    return `${n.toFixed(d)} ${code || ""}`.trim();
  }
};

// только ИМЯ (без фамилии)
const firstOnly = (u?: User) => {
  if (!u) return "";
  const name = (u.first_name || "").trim();
  return name || u.username || `#${u.id}`;
};

export default function GroupBalanceTabSmart({
  myBalance,
  myDebts,
  allDebts,
  loading,
  onFabClick,
  currency,
}: Props) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<"mine" | "all">("mine");

  const headerText = useMemo(() => {
    if (myBalance > 0)
      return t("group_balance_you_get", { sum: fmtMoney(myBalance, currency) });
    if (myBalance < 0)
      return t("group_balance_you_owe", {
        sum: fmtMoney(Math.abs(myBalance), currency),
      });
    return t("group_balance_zero");
  }, [myBalance, t, currency]);

  // константы как в TransactionList
  const H_PADDING = 16;
  const LEFT_INSET = 52; // 40px (иконка/колонка) + 12px gap — как у TransactionList

  return (
    <div className="w-full" style={{ color: "var(--tg-text-color)" }}>
      {/* переключатель оставляем как было */}
      <div className="flex justify-center mt-1 mb-2">
        <div
          className="inline-flex rounded-xl border overflow-hidden"
          style={{ borderColor: "var(--tg-secondary-bg-color,#e7e7e7)" }}
        >
          <button
            type="button"
            onClick={() => setTab("mine")}
            className={`px-3 h-9 text-[13px] ${
              tab === "mine"
                ? "bg-[var(--tg-accent-color,#40A7E3)] text-white"
                : "text-[var(--tg-text-color)]"
            }`}
          >
            {t("group_balance_microtab_mine")}
          </button>
          <button
            type="button"
            onClick={() => setTab("all")}
            className={`px-3 h-9 text-[13px] ${
              tab === "all"
                ? "bg-[var(--tg-accent-color,#40A7E3)] text-white"
                : "text-[var(--tg-text-color)]"
            }`}
          >
            {t("group_balance_microtab_all")}
          </button>
        </div>
      </div>

      {/* контейнер списка как у TransactionList */}
      <div
        className="w-full"
        style={{
          paddingLeft: H_PADDING,
          paddingRight: H_PADDING,
          background: "transparent",
          color: "inherit",
        }}
      >
        {loading ? (
          <div className="py-8 text-center text-[var(--tg-hint-color)]">
            {t("loading")}
          </div>
        ) : tab === "mine" ? (
          <>
            <div className="text-[14px] font-semibold text-[var(--tg-text-color)] mb-2">
              {headerText}
            </div>

            {myDebts.length === 0 ? (
              <div className="text-[13px] text-[var(--tg-hint-color)]">
                {t("group_balance_no_debts")}
              </div>
            ) : (
              <div role="list">
                {myDebts.map((d, idx) => (
                  <div key={d.user.id} className={`relative ${idx > 0 ? "-mt-1" : ""}`}>
                    {/* row */}
                    <div className="flex items-center justify-between py-[6px]">
                      <div className="min-w-0 flex items-center gap-2">
                        {d.user.photo_url ? (
                          <img
                            src={d.user.photo_url}
                            alt=""
                            className="w-7 h-7 rounded-full object-cover"
                          />
                        ) : (
                          <span
                            className="w-7 h-7 rounded-full inline-block"
                            style={{ background: "var(--tg-link-color)" }}
                          />
                        )}
                        <span className="truncate text-[14px] text-[var(--tg-text-color)]">
                          {firstOnly(d.user)}
                        </span>
                      </div>
                      <div className="text-[14px] font-semibold text-[var(--tg-text-color)] text-right">
                        {d.amount >= 0
                          ? t("group_balance_get_from", {
                              sum: fmtMoney(d.amount, currency),
                            })
                          : t("group_balance_owe_to", {
                              sum: fmtMoney(Math.abs(d.amount), currency),
                            })}
                      </div>
                    </div>

                    {/* divider */}
                    {idx !== myDebts.length - 1 && (
                      <div
                        className="absolute bottom-0 h-px bg-[var(--tg-hint-color)] opacity-15 right-0"
                        style={{ left: LEFT_INSET, right: -H_PADDING }}
                        aria-hidden
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {allDebts.length === 0 ? (
              <div className="text-[13px] text-[var(--tg-hint-color)]">
                {t("group_balance_no_debts_all")}
              </div>
            ) : (
              <div role="list">
                {allDebts.map((p, idx) => (
                  <div key={`${p.from.id}-${p.to.id}-${idx}`} className={`relative ${idx > 0 ? "-mt-1" : ""}`}>
                    {/* row */}
                    <div className="flex items-center justify-between py-[6px]">
                      <div className="min-w-0 flex items-center gap-2">
                        {p.from.photo_url ? (
                          <img
                            src={p.from.photo_url}
                            alt=""
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        ) : (
                          <span
                            className="w-6 h-6 rounded-full inline-block"
                            style={{ background: "var(--tg-link-color)" }}
                          />
                        )}
                        <span className="text-[14px] text-[var(--tg-text-color)] max-w-[36%] truncate">
                          {firstOnly(p.from)}
                        </span>
                        <span className="opacity-60 shrink-0">→</span>
                        <span className="text-[14px] text-[var(--tg-text-color)] max-w-[36%] truncate">
                          {firstOnly(p.to)}
                        </span>
                      </div>
                      <div className="text-[14px] font-semibold text-[var(--tg-text-color)] text-right">
                        {fmtMoney(p.amount, currency)}
                      </div>
                    </div>

                    {/* divider */}
                    {idx !== allDebts.length - 1 && (
                      <div
                        className="absolute bottom-0 h-px bg-[var(--tg-hint-color)] opacity-15 right-0"
                        style={{ left: LEFT_INSET, right: -H_PADDING }}
                        aria-hidden
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Hook для onFabClick (оставляем невидимую кнопку, если понадобится) */}
      <div className="hidden">
        <button type="button" onClick={onFabClick} />
      </div>
    </div>
  );
}
