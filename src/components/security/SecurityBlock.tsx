// src/components/security/SecurityBlock.tsx

import AppButton from "../common/AppButton"
import { useState } from "react"
import PinModal from "./PinModal"
import BiometricSwitch from "./BiometricSwitch"
import { t } from "../../locales/locale"
import { useThemeLang } from "../../contexts/ThemeLangContext"

export default function SecurityBlock() {
  const { lang } = useThemeLang()
  const [pinOpen, setPinOpen] = useState(false)
  return (
    <div className="rounded-2xl bg-[var(--tg-theme-secondary-bg-color)] p-4 mb-4 shadow">
      <div className="font-bold mb-2">{t("security.title", lang)}</div>
      <div className="flex flex-col gap-2">
        <AppButton color="secondary" onClick={() => setPinOpen(true)}>
          {t("security.set_pin", lang)}
        </AppButton>
        <BiometricSwitch />
      </div>
      <PinModal open={pinOpen} onClose={() => setPinOpen(false)} />
    </div>
  )
}
