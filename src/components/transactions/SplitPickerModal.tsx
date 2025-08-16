// src/components/transactions/SplitPickerModal.tsx
// Модалка выбора деления: выбор участников группы + режим (Equal/Shares/Custom)

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import FiltersRow from "../FiltersRow";
import { getGroupMembers } from "../../api/groupMembersApi";
import type { GroupMember } from "../../types/group_member";

type SplitMode = "equal" | "shares" | "custom";

type Props = {
  open: boolean;
  onClose: () => void;
  groupId: number;
  initialSelectedIds?: number[];     // кого делим
  initialMode?: SplitMode;
  onApply: (data: { memberIds: number[]; mode: SplitMode }) => void;
};

function norm(s: string) {
  return (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
const firstName = (u: any) => ((u?.first_name || u?.name || "").split(" ")[0] || "User").trim();

function Avatar({ name, avatarUrl }: { name: string; avatarUrl?: string | null }) {
  const letter = (name || "?").trim().charAt(0).toUpperCase();
  if (avatarUrl) {
    return <img src={avatarUrl} alt={name} className="mr-3 rounded-xl object-cover" style={{ width: 34, height: 34 }} />;
  }
  const palette = ["#40A7E3", "#7C5CFC", "#FF7A59", "#00C48C", "#FFB020", "#EF466F"];
  const idx = (letter.charCodeAt(0) + 7) % palette.length;
  const bg = palette[idx];
  return (
    <div className="flex items-center justify-center mr-3 rounded-xl text-white" style={{ width: 34, height: 34, background: bg }}>
      <span style={{ fontSize: 16 }}>{letter}</span>
    </div>
  );
}

export default function SplitPickerModal({ open, onClose, groupId, initialSelectedIds = [], initialMode = "equal", onApply }: Props) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<GroupMember[]>([]);
  const [checked, setChecked] = useState<Set<number>>(new Set(initialSelectedIds));
  const [mode, setMode] = useState<SplitMode>(initialMode);

  const reqIdRef = useRef(0);

  useEffect(() => {
    if (!open || !groupId) return;
    setSearch("");
    setChecked(new Set(initialSelectedIds));
    setMode(initialMode);
    const myId = ++reqIdRef.current;
    (async () => {
      setLoading(true);
      try {
        // грузим всех участников (страницы подряд)
        let offset = 0;
        const pageSize = 100;
        const acc: GroupMember[] = [];
        /* eslint-disable no-constant-condition */
        while (true) {
          const res = await getGroupMembers(groupId, offset, pageSize);
          const page: GroupMember[] = res?.items ?? [];
          acc.push(...page);
          offset += page.length;
          if (page.length < pageSize) break;
        }
        if (reqIdRef.current !== myId) return;
        setItems(acc);
      } finally {
        if (reqIdRef.current === myId) setLoading(false);
      }
    })();
  }, [open, groupId, initialSelectedIds, initialMode]);

  const list = useMemo(() => {
    const q = norm(search).trim();
    const src = items || [];
    if (!q) return src;
    return src.filter((m) => norm(firstName(m.user)).includes(q));
  }, [items, search]);

  if (!open) return null;

  const toggle = (id: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const apply = () => onApply({ memberIds: Array.from(checked), mode });

  return (
    <div className="fixed inset-0 z-[1100] flex items-end justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative w-full sm:max-w-md bg-[var(--tg-card-bg)] text-[var(--tg-text-color)] rounded-t-2xl shadow-tg-card overflow-hidden animate-modal-pop h-[90vh] max-h-[90vh] flex flex-col">
        {/* header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--tg-secondary-bg-color,#e7e7e7)]">
          <div className="text-[15px] font-semibold">{t("tx_modal.split")}</div>
          <button onClick={onClose} className="text-[13px] opacity-70 hover:opacity-100 transition">{t("close")}</button>
        </div>

        {/* режимы */}
        <div className="px-4 pt-2 pb-1">
          <div className="inline-flex rounded-xl border border-[var(--tg-secondary-bg-color,#e7e7e7)] overflow-hidden">
            <button type="button" onClick={() => setMode("equal")} className={`px-3 h-9 text-[13px] ${mode === "equal" ? "bg-[var(--tg-accent-color,#40A7E3)] text-white" : ""}`}>{t("tx_modal.split_equal")}</button>
            <button type="button" onClick={() => setMode("shares")} className={`px-3 h-9 text-[13px] ${mode === "shares" ? "bg-[var(--tg-accent-color,#40A7E3)] text-white" : ""}`}>{t("tx_modal.split_shares")}</button>
            <button type="button" onClick={() => setMode("custom")} className={`px-3 h-9 text-[13px] ${mode === "custom" ? "bg-[var(--tg-accent-color,#40A7E3)] text-white" : ""}`}>{t("tx_modal.split_custom")}</button>
          </div>
        </div>

        {/* поиск */}
        <div className="px-2 pt-1 pb-1">
          <FiltersRow search={search} setSearch={setSearch} placeholderKey="search_placeholder" />
        </div>

        {/* список участников — чекбоксы */}
        <div className="flex-1 overflow-y-auto">
          {list.map((m, idx) => {
            const id = m.user.id;
            const name = firstName(m.user);
            const selected = checked.has(id);
            return (
              <div key={id} className="relative">
                <button
                  type="button"
                  onClick={() => toggle(id)}
                  className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-black/5 dark:hover:bg-white/5 transition"
                >
                  <div className="flex items-center min-w-0">
                    <Avatar name={name} avatarUrl={(m.user as any)?.avatar_url} />
                    <div className="text-[15px] font-medium truncate">{name}</div>
                  </div>
                  <div className={`relative w-5 h-5 border rounded ${selected ? "border-[var(--tg-link-color)]" : "border-[var(--tg-hint-color)]"}`}>
                    {selected && <div className="absolute inset-0.5 rounded bg-[var(--tg-link-color)]" />}
                  </div>
                </button>
                {idx !== list.length - 1 && <div className="absolute left-[74px] right-0 bottom-0 h-px bg-[var(--tg-hint-color)] opacity-15" />}
              </div>
            );
          })}
          {!loading && list.length === 0 && <div className="px-4 py-8 text-center text-[var(--tg-hint-color)]">{t("contacts_not_found")}</div>}
          {loading && <div className="px-4 py-4 text-[13px] text-[var(--tg-hint-color)]">{t("loading")}</div>}
        </div>

        {/* apply */}
        <div className="p-3">
          <button
            type="button"
            className="w-full h-11 rounded-xl font-semibold text-white bg-[var(--tg-accent-color,#40A7E3)] active:scale-95 transition"
            onClick={apply}
          >
            {t("save")}
          </button>
        </div>
      </div>
    </div>
  );
}
