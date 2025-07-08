import UniversalModal from "../common/UniversalModal"
import { useThemeLang } from "../../contexts/ThemeLangContext"
import { t } from "../../locales/locale"

export default function ThemeModal({ open, onClose, value, onChange }: { open: boolean; onClose: () => void; value: "light" | "dark"; onChange: (t: "light" | "dark") => void }) {
  const { lang } = useThemeLang() // Получаем язык

  return (
    <UniversalModal open={open} onClose={onClose}>
      <div className="mb-4 text-lg font-semibold text-center">{t("settings.theme", lang)}</div>
      {/* остальной код */}
    </UniversalModal>
  )
}
