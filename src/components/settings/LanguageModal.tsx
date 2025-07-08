// src/components/settings/LanguageModal.tsx

import UniversalModal from "../common/UniversalModal";
import AppButton from "../common/AppButton";
import { t } from "../../locales/locale";

interface LanguageModalProps {
  open: boolean;
  value: "ru" | "en" | "es";
  onChange: (v: "ru" | "en" | "es") => void;
  onClose: () => void;
}

const LANGUAGES = [
  { code: "ru", name: "Русский" },
  { code: "en", name: "English" },
  { code: "es", name: "Español" },
];

export default function LanguageModal({ open, value, onChange, onClose }: LanguageModalProps) {
  return (
    <UniversalModal open={open} onClose={onClose}>
      <div className="mb-4 text-lg font-semibold text-center">{t("settings.language", value)}</div>
      <div className="flex flex-col gap-2">
        {LANGUAGES.map(lang => (
          <AppButton
            key={lang.code}
            onClick={() => { onChange(lang.code as "ru" | "en" | "es"); onClose(); }}
            color={value === lang.code ? "primary" : "secondary"}
          >
            {lang.name}
          </AppButton>
        ))}
      </div>
    </UniversalModal>
  );
}
