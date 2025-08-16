// src/components/transactions/PaidByPickerModal.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import FiltersRow from "../FiltersRow";
import { getGroupMembers } from "../../api/groupMembersApi";
import type { GroupMember } from "../../types/group_member";

type Props = {
  open: boolean;
  onClose: () => void;
  groupId?: number;
  selectedUserId?: number;
  onSelect: (userId: number) => void;
  closeOnSelect?: boolean;
};

function norm(s: string) {
  return (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

const PALETTE = [
  "#40A7E3", "#8E61FF", "#FF6B6B", "#FFB020", "#2EC4B6",
  "#7DCE82", "#FF7AB6", "#6C8AE4", "#E67E22", "#9B59B6",
];
function colorById(id?: number) {
  if (!id || id < 0) return "#40A7E3";
  return PALETTE[id % PALETTE.length];
}

function Avatar({ name, id }: { name: string; id?: number }) {
  const bg = colorById(id);
  const letter = (name || "?").trim().charAt(0).toUpperCase();
  return (
    <div
      className="flex items-center justify-center mr-3 rounded-xl text-white"
      style={{ width: 34, height: 34, background: bg }}
    >
      <span style={{ fontSize: 16 }}>{letter}</span>
    </div>
  );
}

export default function PaidByPickerModal({
  open,
  onClose,
  groupId,
  selectedUserId,
  onSelect,
  closeOnSelect = true,
}: Props) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(false);
  const reqIdRef = useRef(0);

  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (!groupId) { setMembers([]); return; }
    const my = ++reqIdRef.current;
    (async () => {
      try {
        setLoading(true);
        const res = await getGroupMembers(groupId, 0, 100);
        if (reqIdRef.current !== my) return;
        setMembers(Array.isArray(res?.items) ? (res.items as GroupMember[]) : []);
      } catch {
        if (reqIdRef.current === my) setMembers([]);
      } finally {
        if (reqIdRef.current === my) setLoading(false);
      }
    })();
  }, [open, groupId]);

  const filtered = useMemo(() => {
    const q = norm(search).trim();
    const list = members;
    if (!q) return list;
    return list.filter((m) => {
      const hay = norm(`${m.user?.first_name || ""} ${m.user?.last_name || ""}`);
      return hay.includes(q);
    });
  }, [members, search]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1100] flex items-end justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative w-full sm:max-w-md bg-[var(--tg-card-bg)] text-[var(--tg-text-color)] rounded-t-2xl shadow-tg-card overflow-hidden animate-modal-pop h-[80vh] max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--tg-secondary-bg-color,#e7e7e7)]">
          <div className="text-[15px] font-semibold">{t("tx_modal.paid_by")}</div>
          <button onClick={onClose} className="text-[13px] opacity-70 hover:opacity-100 transition">
            {t("close")}
          </button>
        </div>

        <div className="px-2 pt-1 pb-1">
          <FiltersRow search={search} setSearch={setSearch} />
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.map((m, idx) => {
            const id = m.user?.id ?? 0;
            const selected = id === selectedUserId;
            const nameOnly = String(m.user?.first_name || "").trim() || "—";
            return (
              <div key={id || `u-${idx}`} className="relative">
                <button
                  type="button"
                  onClick={() => { if (id) { onSelect(id); if (closeOnSelect) onClose(); } }}
                  className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-black/5 dark:hover:bg:white/5 transition"
                  aria-selected={selected}
                >
                  <div className="flex items-center min-w-0">
                    <Avatar name={nameOnly} id={id} />
                    <div className="flex flex-col text-left min-w-0">
                      <div className="text-[15px] font-medium text-[var(--tg-text-color)] truncate">{nameOnly}</div>
                    </div>
                  </div>
                  <div className={`relative flex items-center justify-center w-6 h-6 rounded-full border ${selected ? "border-[var(--tg-link-color)]" : "border-[var(--tg-hint-color)]"}`}>
                    {selected && <div className="w-3 h-3 rounded-full" style={{ background: "var(--tg-link-color)" }} />}
                  </div>
                </button>
                {idx !== filtered.length - 1 && (
                  <div className="absolute left-[74px] right-0 bottom-0 h-px bg-[var(--tg-hint-color)] opacity-15" />
                )}
              </div>
            );
          })}

          {!loading && filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-[var(--tg-hint-color)]">{t("contacts_not_found")}</div>
          )}
          {loading && <div className="px-4 py-4 text-[13px] text-[var(--tg-hint-color)]">{t("loading")}</div>}
        </div>
      </div>
    </div>
  );
}
