// src/components/group/GroupBalanceTabSmart.tsx
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Bell } from "lucide-react";
import { useParams } from "react-router-dom";

import { useUserStore } from "../../store/userStore";
import { useGroupsStore } from "../../store/groupsStore";
import CreateTransactionModal from "../transactions/CreateTransactionModal";

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

  // такие же отступы и разделители, как в списке транзакций
  const H_PADDING = 16;
  const LEFT_INSET = 52; // 40 (аватар/колонка) + 12 gap — начало линии

  // тек. пользователь и текущая группа
  const me = useUserStore((s) => s.user);
  const myId = me?.id as number | undefined;
  const params = useParams();
  const groupId = Number(params.groupId || params.id || 0) || undefined;

  // группы — для CreateTransactionModal
  const groups = useGroupsStore((s: any) => (s.groups ?? []) as any[]);

  // CreateTransactionModal с предзаполнением
  const [createOpen, setCreateOpen] = useState(false);
  const [prefill, setPrefill] = useState<{
    type?: "expense" | "transfer";
    amount?: number;
    paidBy?: { id: number; name?: string; avatar_url?: string };
    toUser?: { id: number; name?: string; avatar_url?: string };
    comment?: string | null;
  } | null>(null);

  // заглушка «Напомнить о долге»
  const [remindText, setRemindText] = useState<string | null>(null);

  const openRepay = (d: MyDebt) => {
    if (!myId || !groupId) return;
    setPrefill({
      type: "transfer",
      amount: Math.abs(d.amount),
      paidBy: { id: myId, name: me?.first_name || me?.username, avatar_url: (me as any)?.photo_url },
      toUser: { id: d.user.id, name: firstOnly(d.user), avatar_url: d.user.photo_url },
      comment: null,
    });
    setCreateOpen(true);
  };

  const openRemind = () => {
    setRemindText(String(t("debts_reserved") || ""));
  };

  // текст «должен» в нижнем регистре для вкладки «Все»
  const owesWord = String(t("tx_modal.owes") || "должен").toLocaleLowerCase();

  return (
    <div className="w-full" style={{ color: "var(--tg-text-color)" }}>
      {/* переключатель оставляем неизменным */}
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
                {myDebts.map((d, idx) => {
                  const iOwe = d.amount < 0;          // я должен
                  const amountStr = fmtMoney(Math.abs(d.amount), currency);

                  return (
                    <div key={d.user.id} className={`relative ${idx > 0 ? "" : ""}`}>
                      {/* row — карточки сделали повыше (py-2.5) */}
                      <div className="flex items-center justify-between py-2.5">
                        {/* левая часть: аватар, имя, сумма ниже имени */}
                        <div className="min-w-0 flex items-center gap-3">
                          {d.user.photo_url ? (
                            <img
                              src={d.user.photo_url}
                              alt=""
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <span
                              className="w-10 h-10 rounded-full inline-block"
                              style={{ background: "var(--tg-link-color)" }}
                            />
                          )}

                          <div className="min-w-0">
                            <div className="truncate text-[14px] text-[var(--tg-text-color)] font-medium">
                              {firstOnly(d.user)}
                            </div>
                            <div className="text-[12px] font-semibold text-[var(--tg-text-color)] opacity-80 truncate">
                              {amountStr}
                            </div>
                          </div>
                        </div>

                        {/* правая часть: действие */}
                        <div className="shrink-0 flex items-center gap-2">
                          {iOwe ? (
                            <button
                              type="button"
                              onClick={() => openRepay(d)}
                              className="inline-flex items-center gap-1.5 px-2.5 h-8 rounded-lg border text-[13px] hover:bg-black/5 dark:hover:bg-white/5 transition"
                              style={{ borderColor: "var(--tg-secondary-bg-color,#e7e7e7)" }}
                            >
                              <CheckCircle2 size={16} />
                              <span>{t("repay_debt") || "Погасить долг"}</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={openRemind}
                              className="inline-flex items-center gap-1.5 px-2.5 h-8 rounded-lg border text-[13px] hover:bg-black/5 dark:hover:bg-white/5 transition"
                              style={{ borderColor: "var(--tg-secondary-bg-color,#e7e7e7)" }}
                            >
                              <Bell size={16} />
                              <span>{t("remind_debt") || "Напомнить о долге"}</span>
                            </button>
                          )}
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
                  );
                })}
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
                {allDebts.map((p, idx) => {
                  const amountStr = fmtMoney(p.amount, currency);
                  return (
                    <div key={`${p.from.id}-${p.to.id}-${idx}`} className={`relative`}>
                      {/* row — повыше и без стрелки, вместо неё слово «должен» */}
                      <div className="flex items-center justify-between py-2.5">
                        <div className="min-w-0 flex items-center gap-3">
                          {/* левая сторона: from */}
                          {p.from.photo_url ? (
                            <img src={p.from.photo_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                          ) : (
                            <span className="w-9 h-9 rounded-full inline-block" style={{ background: "var(--tg-link-color)" }} />
                          )}
                          <div className="min-w-0">
                            <div className="truncate text-[14px] text-[var(--tg-text-color)] font-medium">
                              {firstOnly(p.from)} <span className="opacity-60">{owesWord}</span> {firstOnly(p.to)}
                            </div>
                            <div className="text-[12px] font-semibold text-[var(--tg-text-color)] opacity-80 truncate">
                              {amountStr}
                            </div>
                          </div>
                        </div>

                        {/* правой кнопки здесь нет */}
                      </div>

                      {/* divider начинается со 2-го столбца */}
                      {idx !== allDebts.length - 1 && (
                        <div
                          className="absolute bottom-0 h-px bg-[var(--tg-hint-color)] opacity-15 right-0"
                          style={{ left: LEFT_INSET, right: -H_PADDING }}
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
      </div>

      {/* Модалка «создать транзакцию» с предзаполнением (перевод на погашение долга) */}
      <CreateTransactionModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        groups={groups.map((g: any) => ({
          id: g.id,
          name: g.name,
          icon: (g as any).icon,
          color: (g as any).color,
          default_currency_code: (g as any).default_currency_code,
          currency_code: (g as any).currency_code,
          currency: (g as any).currency,
        }))}
        defaultGroupId={groupId}
        onCreated={() => {}}
        // новый проп: prefill
        prefill={prefill || undefined}
      />

      {/* Заглушка «Напомнить о долге» */}
      {remindText && (
        <div
          className="fixed inset-0 z-[1100] flex items-end justify-center"
          onClick={() => setRemindText(null)}
        >
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="relative w-full max-w-[520px] rounded-t-2xl bg-[var(--tg-card-bg)] text-[var(--tg-text-color)] border border-[var(--tg-secondary-bg-color,#e7e7e7)] shadow-[0_-12px_40px_-12px_rgba(0,0,0,0.45)] p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-[14px]">{remindText}</div>
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                className="px-4 h-9 rounded-lg border text-[13px] hover:bg-black/5 dark:hover:bg-white/5 transition"
                style={{ borderColor: "var(--tg-secondary-bg-color,#e7e7e7)" }}
                onClick={() => setRemindText(null)}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Хук для onFabClick (как было) */}
      <div className="hidden">
        <button type="button" onClick={onFabClick} />
      </div>
    </div>
  );
}
