// src/components/group/MemberPickerModal.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import FiltersRow from "../FiltersRow";
import { getGroupMembers } from "../../api/groupMembersApi";
import type { GroupMember } from "../../types/group_member";

type Props = {
  open: boolean;
  onClose: () => void;
  groupId: number;
  selectedUserId?: number;
  onSelect: (user: { id: number; name: string; avatar_url?: string | null }) => void;
  closeOnSelect?: boolean;
};

function norm(s: string) { return (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
const firstName = (u: any) => ((u?.first_name || u?.name || "").split(" ")[0] || "User").trim();

function Avatar({ name, avatarUrl }: { name: string; avatarUrl?: string | null }) {
  const letter = (name || "?").trim().charAt(0).toUpperCase();
  if (avatarUrl) return <img src={avatarUrl} alt={name} className="mr-3 rounded-xl object-cover" style={{ width: 34, height: 34 }} />;
  const palette = ["#40A7E3", "#7C5CFC", "#FF7A59", "#00C48C", "#FFB020", "#EF466F"];
  const idx = (letter.charCodeAt(0) + 7) % palette.length;
  return <div className="flex items-center justify-center mr-3 rounded-xl text-white" style={{ width: 34, height: 34, background: palette[idx] }}><span style={{ fontSize: 16 }}>{letter}</span></div>;
}

const PAGE = 100;

export default function MemberPickerModal({ open, onClose, groupId, selectedUserId, onSelect, closeOnSelect = true }: Props) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<GroupMember[]>([]);
  const reqIdRef = useRef(0);

  useEffect(() => {
    if (!open || !groupId) return;
    setSearch("");
    const myId = ++reqIdRef.current;
    (async () => {
      setLoading(true);
      try {
        let offset = 0; const acc: GroupMember[] = [];
        while (true) {
          const res = await getGroupMembers(groupId, offset, PAGE);
          const page: GroupMember[] = res?.items ?? [];
          acc.push(...page); offset += page.length;
          if (page.length < PAGE) break;
        }
        if (reqIdRef.current !== myId) return;
        setItems(acc);
      } finally { if (reqIdRef.current === myId) setLoading(false); }
    })();
  }, [open, groupId]);

  const list = useMemo(() => {
    const q = norm(search).trim(); const src = items || [];
    if (!q) return src;
    return src.filter((m) => norm(firstName(m.user)).includes(q));
  }, [items, search]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1100] flex items-end justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative w-full sm:max-w-md bg-[var(--tg-card-bg)] text-[var(--tg-text-color)] rounded-t-2xl shadow-tg-card overflow-hidden animate-modal-pop h-[88vh] max-h-[88vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--tg-secondary-bg-color,#e7e7e7)]">
          <div className="text-[15px] font-semibold">{t("tx_modal.paid_by")}</div>
          <button onClick={onClose} className="text-[13px] opacity-70 hover:opacity-100 transition">{t("close")}</button>
        </div>

        <div className="px-2 pt-1 pb-1">
          <FiltersRow search={search} setSearch={setSearch} />
        </div>

        <div className="flex-1 overflow-y-auto">
          {list.map((m, idx) => {
            const id = m.user.id;
            const name = firstName(m.user);
            const selected = id === selectedUserId;
            return (
              <div key={id} className="relative">
                <button
                  type="button"
                  onClick={() => { onSelect({ id, name, avatar_url: (m.user as any)?.avatar_url }); if (closeOnSelect) onClose(); }}
                  className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-black/5 dark:hover:bg-white/5 transition"
                  aria-selected={selected}
                >
                  <div className="flex items-center min-w-0">
                    <Avatar name={name} avatarUrl={(m.user as any)?.avatar_url} />
                    <div className="text-[15px] font-medium truncate">{name}</div>
                  </div>
                  <div className={`relative flex items-center justify-center w-6 h-6 rounded-full border ${selected ? "border-[var(--tg-link-color)]" : "border-[var(--tg-hint-color)]"}`}>
                    {selected && <div className="w-3 h-3 rounded-full" style={{ background: "var(--tg-link-color)" }} />}
                  </div>
                </button>
                {idx !== list.length - 1 && <div className="absolute left-[74px] right-0 bottom-0 h-px bg-[var(--tg-hint-color)] opacity-15" />}
              </div>
            );
          })}

          {!loading && list.length === 0 && <div className="px-4 py-8 text-center text-[var(--tg-hint-color)]">{t("contacts_not_found")}</div>}
          {loading && <div className="px-4 py-4 text-[13px] text-[var(--tg-hint-color)]">{t("loading")}</div>}
        </div>
      </div>
    </div>
  );
}
