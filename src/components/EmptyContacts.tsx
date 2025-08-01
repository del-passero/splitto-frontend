// src/components/EmptyContacts.tsx

import { useTranslation } from "react-i18next"
import { BookUser } from "lucide-react"

type Props = {
  notFound?: boolean
}

const EmptyContacts = ({ notFound = false }: Props) => {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="mb-4 opacity-60">
        <BookUser size={56} className="text-[var(--tg-link-color)]" />
      </div>
      <div className="text-lg font-semibold mb-2 text-[var(--tg-text-color)]">
        {notFound ? t("contacts_not_found") : t("empty_contacts")}
      </div>
    </div>
  )
}

export default EmptyContacts
