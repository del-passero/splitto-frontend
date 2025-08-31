import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Bell, CheckCircle2 } from "lucide-react";

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

  // НОВОЕ: опц. колбэки (для модалок/напоминаний)
  onRepay?: (user: User, amount: number) => void;
  onRemind?: (user: User, amount: number) => void;
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

// маленький круглый аватар, как в TransactionCard
function MiniAvatar({ url, alt, size = 18 }: { url?: string; alt?: string; size?: number }) {
  return url ? (
    <img
      src={url}
      alt={alt || ""}
      className="rounded-full object-cover shrink-0"
      style={{ width: size, height: size }}
      loading="lazy"
    />
  ) : (
    <span
      className="rounded-full inline-block shrink-0"
      style={{ width: size, height: size, background: "var(--tg-link-color)" }}
      aria-hidden
    />
  );
}

export default function GroupBalanceTabSmart({
  myBalance,
  myDebts,
  allDebts,
  loading,
  onFabClick,
  currency,
  onRepay,
  onRemind,
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

  // «owes» (нижний регистр). Фолбэк на owes_label.
  const owesWord =
    (t("tx_modal.owes") as string) ||
    ((t("tx_modal.owes_label") as string) || "").toString().toLowerCase() ||
    "owes";

  return (
    <div className="w-full">
      {/* Microtabs */}
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

      {/* Карточка-контейнер под список */}
      <div
        className="rounded-xl border p-3 bg-[var(--tg-card-bg)]"
        style={{ borderColor: "var(--tg-secondary-bg-color,#e7e7e7)" }}
      >
        {loading ? (
          <div className="py-8 text-center text-[var(--tg-hint-color)]">
            {t("loading")}
          </div>
        ) : tab === "mine" ? (
          <>
            {/* Заголовок */}
            <div className="text-[14px] font-semibold text-[var(--tg-text-color)] mb-3">
              {headerText}
            </div>

            {myDebts.length === 0 ? (
              <div className="text-[13px] text-[var(--tg-hint-color)]">
                {t("group_balance_no_debts")}
              </div>
            ) : (
              <div>
                {myDebts.map((d, idx) => {
                  const iOwe = d.amount < 0; // <0 — я должен
                  const amountAbs = Math.abs(d.amount);

                  return (
                    <div key={d.user.id} className="relative">
                      {/* Ряд */}
                      <div className="py-2">
                        <div
                          className="grid items-center"
                          style={{
                            // label | avatar | name | amount | actions
                            gridTemplateColumns:
                              "auto auto minmax(0,1fr) auto 96px",
                            columnGap: 8,
                          }}
                        >
                          {/* label */}
                          <div className="min-w-0 text-[14px] text-[var(--tg-text-color)]">
                            {iOwe
                              ? t("group_balance_owe_to", { sum: "" })
                                  .replace(/\s*[:：]\s*$/, "") || t("group_balance_owe_to")
                              : t("group_balance_get_from", { sum: "" })
                                  .replace(/\s*[:：]\s*$/, "") || t("group_balance_get_from")}
                          </div>

                          {/* avatar */}
                          <MiniAvatar url={d.user.photo_url} alt={firstOnly(d.user)} />

                          {/* name */}
                          <div className="min-w-0 text-[14px] text-[var(--tg-text-color)] font-medium truncate">
                            {firstOnly(d.user)}
                          </div>

                          {/* amount */}
                          <div className="text-[14px] font-semibold text-[var(--tg-text-color)] text-right">
                            {fmtMoney(amountAbs, currency)}
                          </div>

                          {/* action button (+ подпись снизу) */}
                          <div className="justify-self-end">
                            <div className="w-[96px] flex flex-col items-center">
                              <button
                                type="button"
                                className="w-10 h-10 rounded-full flex items-center justify-center border hover:bg-black/5 dark:hover:bg-white/5 transition"
                                style={{
                                  borderColor:
                                    "var(--tg-secondary-bg-color,#e7e7e7)",
                                }}
                                onClick={() => {
                                  if (iOwe) {
                                    if (onRepay) onRepay(d.user, amountAbs);
                                    else alert(t("debts_reserved") as string);
                                  } else {
                                    if (onRemind) onRemind(d.user, amountAbs);
                                    else alert(t("debts_reserved") as string);
                                  }
                                }}
                                aria-label={
                                  iOwe
                                    ? (t("repay_debt") as string) || "Repay debt"
                                    : (t("remind_debt") as string) ||
                                      "Remind about debt"
                                }
                              >
                                {iOwe ? (
                                  <CheckCircle2
                                    size={20}
                                    className="text-[var(--tg-text-color)] opacity-90"
                                  />
                                ) : (
                                  <Bell
                                    size={20}
                                    className="text-[var(--tg-text-color)] opacity-90"
                                  />
                                )}
                              </button>
                              <div className="mt-1 text-[12px] leading-tight text-center whitespace-normal break-words">
                                {iOwe
                                  ? (t("repay_debt") as string) || "Repay debt"
                                  : (t("remind_debt") as string) ||
                                    "Remind about debt"}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* divider */}
                      {idx !== myDebts.length - 1 && (
                        <div className="absolute left-0 right-0 bottom-0 h-px bg-[var(--tg-hint-color)] opacity-15" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          // === ALL BALANCES ===
          <>
            {allDebts.length === 0 ? (
              <div className="text-[13px] text-[var(--tg-hint-color)]">
                {t("group_balance_no_debts_all")}
              </div>
            ) : (
              <div>
                {allDebts.map((p, idx) => (
                  <div key={idx} className="relative">
                    <div className="py-2">
                      <div
                        className="grid items-center"
                        style={{
                          // [avatar+name] [owes] [avatar+name] [amount]
                          gridTemplateColumns:
                            "minmax(0,1fr) auto minmax(0,1fr) auto",
                          columnGap: 8,
                        }}
                      >
                        {/* left: debtor */}
                        <div className="min-w-0 flex items-center gap-2">
                          <MiniAvatar url={p.from.photo_url} alt={firstOnly(p.from)} />
                          <span className="min-w-0 text-[14px] text-[var(--tg-text-color)] font-medium truncate">
                            {firstOnly(p.from)}
                          </span>
                        </div>

                        {/* owes word (нижний регистр) */}
                        <div className="text-[14px] text-[var(--tg-text-color)] opacity-90 whitespace-nowrap">
                          {owesWord}
                        </div>

                        {/* right: creditor */}
                        <div className="min-w-0 flex items-center gap-2">
                          <MiniAvatar url={p.to.photo_url} alt={firstOnly(p.to)} />
                          <span className="min-w-0 text-[14px] text-[var(--tg-text-color)] font-medium truncate">
                            {firstOnly(p.to)}
                          </span>
                        </div>

                        {/* amount */}
                        <div className="text-[14px] font-semibold text-[var(--tg-text-color)] text-right">
                          {fmtMoney(p.amount, currency)}
                        </div>
                      </div>
                    </div>

                    {/* divider */}
                    {idx !== allDebts.length - 1 && (
                      <div className="absolute left-0 right-0 bottom-0 h-px bg-[var(--tg-hint-color)] opacity-15" />
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
