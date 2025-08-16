// src/components/transactions/PaidByPickerModal.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import FiltersRow from "../FiltersRow";
import CardSection from "../CardSection";
import { X } from "lucide-react";
import { getGroupMembers } from "../../api/groupMembersApi";

/** Локальный тип: упрощённый участник для выбора "Кто платил" */
type Member = {
  id: number;
  name: string;
  avatar_url?: string | null;
  color?: string | null;
  icon?: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  groupId: number;
  selectedUserId?: number;
  onSelect: (m: Member) => void;
  closeOnSelect?: boolean;
};

function norm(s: string) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function Avatar({
  name,
  url,
  color,
  icon,
  size = 34,
}: {
  name: string;
  url?: string | null;
  color?: string | null;
  icon?: string | null;
  size?: number;
}) {
  const letter = (name || "?").trim().charAt(0).toUpperCase();
  const bg =
    (color && /^#([0-9a-f]{3}){1,2}$/i.test(color) ? color : "#40A7E3") || "#40A7E3";
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className="rounded-xl object-cover mr-3"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="flex items-center justify-center mr-3 rounded-xl text-white"
      style={{ width: size, height: size, background: bg, fontSize: size * 0.45 }}
      aria-label={name}
    >
      <span aria-hidden>{icon || letter}</span>
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

  // --- Состояния
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const didLoadRef = useRef(false);

  // --- Загрузка участников группы при открытии
  useEffect(() => {
    if (!open || !groupId) return;
    if (didLoadRef.current && members.length > 0) return;

    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const res: any = await getGroupMembers(groupId, 0, 200);
        // ожидаем res.items — массив участников группы
        const items: Member[] = Array.isArray(res?.items)
          ? res.items.map((gm: any) => {
              const u = gm?.user || {};
              const first = (u.first_name ?? u.firstName ?? "").toString();
              const last = (u.last_name ?? u.lastName ?? "").toString();
              // «только имя» нам и нужно в превью; но в списке можно и полное
              const name =
                (first && last ? `${first} ${last}` : first || u.username || "User").trim();
              return {
                id: Number(u.id ?? gm?.user_id ?? gm?.id ?? 0),
                name,
                avatar_url: u.avatar_url ?? u.avatarUrl ?? u.photo_url ?? null,
                color: u.color ?? gm?.color ?? null,
                icon: u.icon ?? gm?.icon ?? null,
              } as Member;
            })
          : [];
        if (!cancelled) {
          setMembers(items);
          didLoadRef.current = true;
        }
      } catch {
        if (!cancelled) setMembers([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, groupId]);

  // Сбрасываем поиск при закрытии
  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  // Фильтрация
  const items = useMemo(() => {
    const q = norm(search).trim();
    if (!q) return members;
    return members.filter((m) => norm(m.name).includes(q));
  }, [members, search]);

  // --- Отрисовка: если закрыто — отрисовываем null ПОСЛЕ вызова хуков (правильно для React)
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-end justify-center"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div
        className="relative w-full sm:max-w-md bg-[var(--tg-card-bg)] text-[var(--tg-text-color)] rounded-t-2xl shadow-tg-card overflow-hidden animate-modal-pop h-[88vh] max-h-[88vh] flex flex-col"
      >
        {/* Шапка */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--tg-secondary-bg-color,#e7e7e7)]">
          <div className="text-[15px] font-semibold">{t("tx_modal.paid_by")}</div>
          <button
            onClick={onClose}
            className="text-[13px] opacity-70 hover:opacity-100 transition"
          >
            {t("close")}
          </button>
        </div>

        {/* Поиск */}
        <div className="px-2 pt-1 pb-1">
          <FiltersRow search={search} setSearch={setSearch} />
        </div>

        {/* Список */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="px-4 py-6 text-center text-[var(--tg-hint-color)]">
              {t("loading")}
            </div>
          )}

          {!loading &&
            items.map((m, idx) => {
              const selected = m.id === selectedUserId;
              return (
                <div key={m.id} className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(m);
                      if (closeOnSelect) onClose();
                    }}
                    className="w-full flex items-center justify-between px-4 py-2 hover:bg-black/5 dark:hover:bg-white/5 transition"
                    aria-selected={selected}
                  >
                    <div className="flex items-center min-w-0">
                      <Avatar
                        name={m.name}
                        url={m.avatar_url || undefined}
                        color={m.color || undefined}
                        icon={m.icon || undefined}
                        size={34}
                      />
                      <div className="flex flex-col text-left min-w-0">
                        <div className="text-[15px] font-medium text-[var(--tg-text-color)] truncate">
                          {m.name}
                        </div>
                      </div>
                    </div>

                    {/* Радио */}
                    <div
                      className={`relative flex items-center justify-center w-6 h-6 rounded-full border ${
                        selected
                          ? "border-[var(--tg-link-color)]"
                          : "border-[var(--tg-hint-color)]"
                      }`}
                    >
                      {selected && (
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ background: "var(--tg-link-color)" }}
                        />
                      )}
                    </div>
                  </button>

                  {/* Разделитель (смещаем, чтобы не заходил под аватарку) */}
                  {idx !== items.length - 1 && (
                    <div className="absolute left-[74px] right-0 bottom-0 h-px bg-[var(--tg-hint-color)] opacity-15 pointer-events-none" />
                  )}
                </div>
              );
            })}

          {!loading && items.length === 0 && (
            <CardSection>
              <div className="text-center py-8 text-[var(--tg-hint-color)]">
                {t("contacts_not_found")}
              </div>
            </CardSection>
          )}
        </div>

        {/* Кнопка закрытия (иконка), если нужна поверх — компактная и не конфликтует с контентом */}
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-10 right-2 p-2 rounded-full hover:bg-black/10"
          aria-label={t("close")}
          title={t("close") as string}
        >
          <X className="w-5 h-5 opacity-70" />
        </button>
      </div>
    </div>
  );
}
