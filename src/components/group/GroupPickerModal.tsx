// src/components/group/GroupPickerModal.tsx
// Модалка выбора группы в стиле CurrencyPickerModal:
// шапка, поиск (через FiltersRow), список с аватарками и радио-выбором, разделители не под аватаркой.
// Самостоятельно подгружает группы из стора при открытии, если их ещё нет.

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import FiltersRow from "../FiltersRow";
import { useGroupsStore } from "../../store/groupsStore";
import { useUserStore } from "../../store/userStore";

type GroupItem = { id: number; name: string; color?: string | null; icon?: string | null };

type Props = {
  open: boolean;
  onClose: () => void;
  selectedId?: number;
  onSelect: (g: GroupItem) => void;
  closeOnSelect?: boolean;
};

function norm(s: string) { return (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }

function Avatar({ name, color, icon }: { name: string; color?: string | null; icon?: string | null }) {
  const bg = color || "#40A7E3";
  const letter = (name || "?").trim().charAt(0).toUpperCase();
  return (
    <div className="flex items-center justify-center mr-3 rounded-xl text-white" style={{ width: 34, height: 34, background: bg }}>
      <span style={{ fontSize: 16 }}>{icon || letter}</span>
    </div>
  );
}

export default function GroupPickerModal({ open, onClose, selectedId, onSelect, closeOnSelect = true }: Props) {
  const { t } = useTranslation();
  const user = useUserStore((s) => s.user);
  const { groups, fetchGroups } = useGroupsStore();

  // загрузка при открытии, если нет данных
  const didFetchRef = useRef(false);
  useEffect(() => {
    if (!open) return;
    if ((groups?.length ?? 0) === 0 && user?.id && !didFetchRef.current) {
      didFetchRef.current = true;
      fetchGroups(user.id).catch(() => {});
    }
  }, [open, groups, user, fetchGroups]);

  const [search, setSearch] = useState("");
  useEffect(() => { if (!open) setSearch(""); }, [open]);

  const items = useMemo(() => {
    const list: GroupItem[] = (groups ?? []).map((g: any) => ({ id: g.id, name: g.name, color: g.color, icon: g.icon }));
    const q = norm(search).trim();
    if (!q) return list;
    return list.filter((g) => norm(g.name).includes(q));
  }, [groups, search]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1100] flex items-end justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative w-full sm:max-w-md bg-[var(--tg-card-bg)] text-[var(--tg-text-color)] rounded-t-2xl shadow-tg-card overflow-hidden animate-modal-pop h-[90vh] max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--tg-secondary-bg-color,#e7e7e7)]">
          <div className="text-[15px] font-semibold">{t("tx_modal.choose_group")}</div>
          <button onClick={onClose} className="text-[13px] opacity-70 hover:opacity-100 transition">{t("close")}</button>
        </div>

        {/* Поиск (встроили ваш FiltersRow) */}
        <div className="px-2 pt-1 pb-1">
          <FiltersRow search={search} setSearch={setSearch} />
        </div>

        <div className="flex-1 overflow-y-auto">
          {items.map((g, idx) => {
            const selected = g.id === selectedId;
            return (
              <div key={g.id} className="relative">
                <button type="button" onClick={() => { onSelect(g); if (closeOnSelect) onClose(); }} className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-black/5 dark:hover:bg-white/5 transition" aria-selected={selected}>
                  <div className="flex items-center min-w-0">
                    <Avatar name={g.name} color={g.color} icon={g.icon || undefined} />
                    <div className="flex flex-col text-left min-w-0">
                      <div className="text-[15px] font-medium text-[var(--tg-text-color)] truncate">{g.name}</div>
                      <div className="text-[12px] text-[var(--tg-hint-color)]">ID: {g.id}</div>
                    </div>
                  </div>
                  <div className={`relative flex items-center justify-center w-6 h-6 rounded-full border ${selected ? "border-[var(--tg-link-color)]" : "border-[var(--tg-hint-color)]"}`}>{selected && <div className="w-3 h-3 rounded-full" style={{ background: "var(--tg-link-color)" }} />}</div>
                </button>
                {idx !== items.length - 1 && <div className="absolute left-[74px] right-0 bottom-0 h-px bg-[var(--tg-hint-color)] opacity-15" />}
              </div>
            );
          })}

          {(items.length === 0) && <div className="px-4 py-8 text-center text-[var(--tg-hint-color)]">{t("groups_not_found")}</div>}
        </div>
      </div>
    </div>
  );
}
