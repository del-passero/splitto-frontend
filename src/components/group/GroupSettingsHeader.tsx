// src/components/group/GroupSettingsHeader.tsx
import { useState } from "react";
import GroupAvatar from "../GroupAvatar";
import { Pencil, X, Check, Ban } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Group } from "../../types/group";

type Props = {
  group: Group;
  onBack: () => void;
  /**
   * Необязательно. Если нужен внешний побочный эффект при входе в режим редактирования.
   * Сам режим редактирования теперь включается внутри компонента.
   */
  onEdit?: () => void;
  /**
   * Необязательно. Если передать — будет вызвано при сохранении.
   * Можно дернуть PATCH на бэкенд и затем обновить состояние родителя.
   */
  onSave?: (
    payload: { name: string; description: string }
  ) => void | Promise<void>;
};

const GroupSettingsHeader = ({ group, onEdit, onBack, onSave }: Props) => {
  const { t } = useTranslation();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(group.name || "");
  const [desc, setDesc] = useState(group.description || "");
  const [saving, setSaving] = useState(false);

  const startEdit = () => {
    // синхронизируем поля, если в пропсах обновили группу
    setName(group.name || "");
    setDesc(group.description || "");
    setEditing(true);
    onEdit?.();
  };

  const cancelEdit = () => {
    setEditing(false);
    setName(group.name || "");
    setDesc(group.description || "");
  };

  const handleSave = async () => {
    const trimmedName = (name || "").trim();
    if (!trimmedName) return; // мягкая валидация: пустое имя не сохраняем
    try {
      setSaving(true);
      await onSave?.({ name: trimmedName, description: (desc || "").trim() });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center px-4 py-5 border-b border-[var(--tg-hint-color)] bg-[var(--tg-card-bg)] relative">
      {/* Назад */}
      <button
        type="button"
        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-red-500/10 transition"
        onClick={onBack}
        aria-label={t("group_settings_close") as string}
      >
        <X className="w-6 h-6 text-red-500" />
      </button>

      <GroupAvatar name={group.name} size={60} className="mr-4 ml-8" />

      {/* Контент: просмотр или редактирование */}
      {!editing ? (
        <>
          <div className="flex flex-col flex-grow min-w-0">
            <div className="font-bold text-lg break-words text-[var(--tg-text-color)] leading-tight">
              {group.name}
            </div>
            {group.description && (
              <div className="mt-1 text-sm text-[var(--tg-hint-color)] whitespace-pre-line break-words">
                {group.description}
              </div>
            )}
          </div>

          {/* Карандаш — включает режим редактирования */}
          <button
            type="button"
            className="ml-4 p-2 rounded-full hover:bg-[var(--tg-accent-color)]/10 transition"
            onClick={startEdit}
            aria-label={t("edit_group") as string}
            title={t("edit_group") as string}
          >
            <Pencil className="w-6 h-6 text-[var(--tg-accent-color)]" />
          </button>
        </>
      ) : (
        <>
          <div className="flex flex-col flex-grow min-w-0">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("group_form.name_placeholder") as string}
              className="w-full rounded-lg border border-[var(--tg-secondary-bg-color,#e7e7e7)] bg-[var(--tg-bg-color,#fff)] px-3 py-2 text-[15px] font-semibold text-[var(--tg-text-color)] focus:outline-none focus:border-[var(--tg-accent-color)]"
              maxLength={64}
            />
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder={t("group_form.description_placeholder") as string}
              className="mt-2 w-full rounded-lg border border-[var(--tg-secondary-bg-color,#e7e7e7)] bg-[var(--tg-bg-color,#fff)] px-3 py-2 text-[14px] text-[var(--tg-text-color)] focus:outline-none focus:border-[var(--tg-accent-color)]"
              rows={3}
              maxLength={240}
            />
          </div>

          {/* Кнопки Сохранить / Отмена */}
          <div className="ml-3 flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="p-2 rounded-full bg-[var(--tg-accent-color,#40A7E3)] text-white hover:opacity-90 active:scale-95 transition disabled:opacity-60"
              aria-label={t("save") as string}
              title={t("save") as string}
            >
              <Check className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              disabled={saving}
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition"
              aria-label={t("cancel") as string}
              title={t("cancel") as string}
            >
              <Ban className="w-5 h-5 text-[var(--tg-hint-color)]" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default GroupSettingsHeader;
