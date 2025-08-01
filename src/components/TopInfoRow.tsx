// src/components/TopInfoRow.tsx

/**
 * Верхний информер для страницы "Группы" — выводит количество активных групп.
 * Все подписи через i18n, поддержка темы. Нет никаких кнопок и лишнего.
 */

import { useTranslation } from "react-i18next"

type Props = {
  count: number
}

const TopInfoRow = ({ count }: Props) => {
  const { t } = useTranslation()
  return (
    <div className="w-full px-4 pt-6 pb-2 flex items-center justify-between">
      <span className="text-lg font-bold text-[var(--tg-text-color)]">
        {t("groups_top_info", { count })}
      </span>
    </div>
  )
}

export default TopInfoRow
