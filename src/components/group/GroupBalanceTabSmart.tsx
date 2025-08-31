import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import CardSection from "../CardSection";
import { CheckCircle2, Bell } from "lucide-react";

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
  // новые колбэки для действий с карточек
  onRepay?: (u: User, amount: number) => void;
  onRemind?: (u: User, amount: number) => void;
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

const firstOnly = (u?: User) => {
  if (!u) return "";
  const name = (u.first_name || "").trim();
  return name || u.username || `#${u.id}`;
};

function Avatar({ url, size = 28 }: { url?: string; size?: number }) {
  return url ? (
    <img
      src={url}
      alt=""
      className="rounded-full object-cover"
      style={{ width: size, height: size }}
      loading="lazy"
    />
  ) : (
    <span
      className="rounded-full inline-block"
      style={{ width: size, height: size, background: "var(--tg-link-color)" }}
      aria-hidden
    />
  );
}

function ActionIcon({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <div className="shrink-0 flex flex-col items-center ml-2">
      <button
        type="button"
        onClick={onClick}
        className="w-9 h-9 rounded-full bg-[var(--tg-accent-color,#40A7E3)] text-white flex items-center justify-center active:scale-95"
        aria-label={label}
        title={label}
      >
        {icon}
      </button>
      <div className="mt-1 text-[10px] leading-none text-[var(--tg-hint-color)] text-center max-w-[72px] truncate">
        {label}
      </div>
    </div>
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
    if (myBalance > 0) return t("group_balance_you_get", { sum: fmtMoney(myBalance, currency) });
    if (myBalance < 0) return t("group_balance_you_owe", { sum: fmtMoney(Math.abs(myBalance), currency) });
    return t("group_balance_zero");
  }, [myBalance, t, currency]);

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
            className={`px-3 h-9 text-[13px] ${
              tab === "mine" ? "bg-[var(--tg-accent-color,#40A7E3)] text-white" : "text-[var(--tg-text-color)]"
            }`}
          >
            {t("group_balance_microtab_mine")}
          </button>
          <button
            type="button"
            onClick={() => setTab("all")}
            className={`px-3 h-9 text-[13px] ${
              tab === "all" ? "bg-[var(--tg-accent-color,#40A7E3)] text-white" : "text-[var(--tg-text-color)]"
            }`}
          >
            {t("group_balance_microtab_all")}
          </button>
        </div>
      </div>

      {/* контейнер под карточки */}
      <CardSection className="py-0">
        {loading ? (
          <div className="py-8 text-center text-[var(--tg-hint-color)]">{t("loading")}</div>
        ) : tab === "mine" ? (
          <>
            <div className="px-3 pt-2 pb-1 text-[14px] font-semibold text-[var(--tg-text-color)]">
              {headerText}
            </div>

            {myDebts.length === 0 ? (
              <div className="px-3 pb-3 text-[13px] text-[var(--tg-hint-color)]">
                {t("group_balance_no_debts")}
              </div>
            ) : (
              <div className="w-full" role="list">
                {myDebts.map((d, idx) => {
                  const iOwe = d.amount < 0;
                  const amountAbs = Math.abs(d.amount);
                  const leftInset = 64; // как у TransactionList
                  return (
                    <div key={d.user.id} className="relative px-3 py-2.5">
                      <div className="flex items-center gap-3">
                        <Avatar url={d.user.photo_url} size={40} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1 min-w-0">
                            <span className="text-[13px] text-[var(--tg-text-color)] shrink-0">
                              {iOwe ? t("group_balance_you_owe", { sum: "" }).replace(/\s*{{sum}}\s*/,"").trim() : t("group_balance_you_get", { sum: "" }).replace(/\s*{{sum}}\s*/,"").trim()}
                            </span>
                            <strong className="text-[13px] text-[var(--tg-text-color)] truncate">
                              {firstOnly(d.user)}
                            </strong>
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <div className="text-[14px] font-semibold text-[var(--tg-text-color)]">
                            {fmtMoney(amountAbs, currency)}
                          </div>
                        </div>

                        {iOwe ? (
                          <ActionIcon
                            icon={<CheckCircle2 size={18} />}
                            label={t("repay_debt")}
                            onClick={() => onRepay?.(d.user, amountAbs)}
                          />
                        ) : (
                          <ActionIcon
                            icon={<Bell size={18} />}
                            label={t("remind_debt")}
                            onClick={() => onRemind?.(d.user, amountAbs)}
                          />
                        )}
                      </div>

                      {/* разделитель */}
                      {idx !== myDebts.length - 1 && (
                        <div
                          className="absolute bottom-0 right-0 h-px bg-[var(--tg-hint-color)] opacity-15"
                          style={{ left: leftInset }}
                          aria-hidden
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <>
            {allDebts.length === 0 ? (
              <div className="px-3 py-3 text-[13px] text-[var(--tg-hint-color)]">
                {t("group_balance_no_debts_all")}
              </div>
            ) : (
              <div className="w-full" role="list">
                {allDebts.map((p, idx) => {
                  const leftInset = 64;
                  return (
                    <div key={`${p.from.id}-${p.to.id}-${idx}`} className="relative px-3 py-2.5">
                      <div className="grid grid-cols-[auto,1fr,auto] items-center gap-x-3">
                        {/* аватар + «Имя должен Имя» в одну строку */}
                        <div className="flex items-center gap-3 min-w-0 col-span-2">
                          <Avatar url={p.from.photo_url} size={40} />
                          <div className="min-w-0 text-[14px] text-[var(--tg-text-color)] truncate">
                            <span className="font-medium truncate max-w-[44%] inline-block align-baseline">
                              {firstOnly(p.from)}
                            </span>
                            <span className="opacity-80 mx-1 shrink-0">{t("tx_modal.owes")}</span>
                            <span className="font-medium truncate max-w-[44%] inline-block align-baseline">
                              {firstOnly(p.to)}
                            </span>
                          </div>
                        </div>

                        {/* сумма справа */}
                        <div className="justify-self-end text-[14px] font-semibold text-[var(--tg-text-color)]">
                          {fmtMoney(p.amount, currency)}
                        </div>
                      </div>

                      {/* разделитель */}
                      {idx !== allDebts.length - 1 && (
                        <div
                          className="absolute bottom-0 right-0 h-px bg-[var(--tg-hint-color)] opacity-15"
                          style={{ left: leftInset }}
                          aria-hidden
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </CardSection>

      {/* Hook для onFabClick (оставляем невидимую кнопку, если понадобится) */}
      <div className="hidden">
        <button type="button" onClick={onFabClick} />
      </div>
    </div>
  );
}
