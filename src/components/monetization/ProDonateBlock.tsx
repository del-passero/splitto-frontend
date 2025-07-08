// src/components/monetization/ProDonateBlock.tsx

import AppButton from "../common/AppButton"
import Badge from "../common/Badge"
import { useState } from "react"
import BuyProModal from "./BuyProModal"
import DonateModal from "./DonateModal"
import { t } from "../../locales/locale"
import { useThemeLang } from "../../contexts/ThemeLangContext"

export default function ProDonateBlock() {
  const { lang } = useThemeLang()
  const [buyOpen, setBuyOpen] = useState(false)
  const [donateOpen, setDonateOpen] = useState(false)
  return (
    <div className="rounded-2xl bg-[var(--tg-theme-secondary-bg-color)] p-4 mb-4 shadow">
      <div className="flex items-center mb-2">
        <Badge color="gold">PRO</Badge>
        <div className="font-bold text-base ml-2">{t("pro.pro", lang)}</div>
      </div>
      <div className="mb-3 text-sm opacity-70">{t("pro.description", lang)}</div>
      <div className="flex gap-2">
        <AppButton color="primary" onClick={() => setBuyOpen(true)}>
          {t("pro.buy", lang)}
        </AppButton>
        <AppButton color="secondary" onClick={() => setDonateOpen(true)}>
          {t("pro.donate", lang)}
        </AppButton>
      </div>
      <BuyProModal open={buyOpen} onClose={() => setBuyOpen(false)} />
      <DonateModal open={donateOpen} onClose={() => setDonateOpen(false)} />
    </div>
  )
}
