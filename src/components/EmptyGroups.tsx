// src/components/EmptyGroups.tsx

/**
 * Компонент-заглушка для страницы "Группы", когда у пользователя нет ни одной группы.
 * Использует lucide-react иконку Users (как в Navbar).
 * Все подписи только через i18n, полная поддержка темы.
 */

import { useTranslation } from "react-i18next"
import { Users } from "lucide-react"      // Используем ту же иконку, что и в Navbar

const EmptyGroups = () => {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center justify-center py-12">
      {/* Крупная иконка Users */}
      <div className="mb-4 opacity-60">
        <Users size={56} className="text-[var(--tg-link-color)]" />
      </div>
      {/* Заголовок */}
      <div className="text-lg font-semibold mb-2 text-[var(--tg-text-color)]">
        {t("empty_groups")}
      </div>
      {/* Подзаголовок/подсказка */}
      <div className="text-sm text-[var(--tg-hint-color)] mb-4 text-center">
        {t("empty_groups_hint")}
      </div>
      {/* Кнопка "Создать группу" появится в будущем, сейчас её нет */}
    </div>
  )
}

export default EmptyGroups
