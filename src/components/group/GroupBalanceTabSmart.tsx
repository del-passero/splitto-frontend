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

const decimalsByCode = (code?: string | null) => (code && ["JPY", "KRW", "VND"].includes(code) ? 0 : 2);
const fmtMoney = (n: number, code?: string | null) => {
  const d = decimalsByCode(code || undefined);
  try {
    return `${new Intl.NumberFormat(undefined, { minimumFractionDigits: d, maximumFractionDigits: d }).format(n)} ${code || ""}`.trim();
  } catch {
    return `${n.toFixed(d)} ${code || ""}`.trim();
  }
};

export default function GroupBalanceTabSmart({ myBalance, myDebts, allDebts, loading, onFabClick, currency }: Props) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<"mine" | "all">("mine");

  const nameOf = (u?: User) => {
    if (!u) return "";
    const n = `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim();
    return n || u.username || `#${u.id}`;
  };

  const headerText = useMemo(() => {
    if (myBalance > 0) return t("group_balance_you_get", { sum: fmtMoney(myBalance, currency) });
    if (myBalance < 0) return t("group_balance_you_owe", { sum: fmtMoney(Math.abs(myBalance), currency) });
    return t("group_balance_zero");
  }, [myBalance, t, currency]);

  return (
    <div className="w-full">
      <div className="flex justify-center mt-1 mb-2">
        <div className="inline-flex rounded-xl border overflow-hidden"
             style={{ borderColor: "var(--tg-secondary-bg-color,#e7e7e7)" }}>
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

      <div className="rounded-xl border p-3 bg-[var(--tg-card-bg)]"
           style={{ borderColor: "var(--tg-secondary-bg-color,#e7e7e7)" }}>
        {loading ? (
          <div className="py-8 text-center text-[var(--tg-hint-color)]">{t("loading")}</div>
        ) : tab === "mine" ? (
          <>
            <div className="text-[14px] font-semibold text-[var(--tg-text-color)] mb-2">{headerText}</div>
            {myDebts.length === 0 ? (
              <div className="text-[13px] text-[var(--tg-hint-color)]">{t("group_balance_no_debts")}</div>
            ) : (
              <div className="flex flex-col gap-2">
                {myDebts.map((d) => (
                  <div key={d.user.id} className="flex items-center justify-between">
                    <div className="min-w-0 flex items-center gap-2">
                      {d.user.photo_url ? (
                        <img src={d.user.photo_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                      ) : (
                        <span className="w-7 h-7 rounded-full inline-block" style={{ background: "var(--tg-link-color)" }} />
                      )}
                      <span className="truncate text-[14px] text-[var(--tg-text-color)]">{nameOf(d.user)}</span>
                    </div>
                    <div className="text-[14px] font-semibold text-[var(--tg-text-color)]">
                      {d.amount >= 0
                        ? t("group_balance_get_from", { sum: fmtMoney(d.amount, currency) })
                        : t("group_balance_owe_to", { sum: fmtMoney(Math.abs(d.amount), currency) })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {allDebts.length === 0 ? (
              <div className="text-[13px] text-[var(--tg-hint-color)]">{t("group_balance_no_debts_all")}</div>
            ) : (
              <div className="flex flex-col gap-2">
                {allDebts.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="min-w-0 flex items-center gap-2">
                      {p.from.photo_url ? (
                        <img src={p.from.photo_url} alt="" className="w-6 h-6 rounded-full object-cover" />
                      ) : (
                        <span className="w-6 h-6 rounded-full inline-block" style={{ background: "var(--tg-link-color)" }} />
                      )}
                      <span className="truncate text-[14px] text-[var(--tg-text-color)]">{nameOf(p.from)}</span>
                      <span className="opacity-60">→</span>
                      <span className="truncate text-[14px] text-[var(--tg-text-color)]">{nameOf(p.to)}</span>
                    </div>
                    <div className="text-[14px] font-semibold text-[var(--tg-text-color)]">
                      {fmtMoney(p.amount, currency)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Хук для FAB, если понадобится */}
      <div className="hidden">
        <button type="button" onClick={onFabClick} />
      </div>
    </div>
  );
}
