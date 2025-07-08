// src/components/settings/SettingsBlock.tsx

import SettingItem from "./SettingItem";
import LanguageModal from "./LanguageModal";
import ThemeModal from "./ThemeModal";
import { useThemeLang } from "../../contexts/ThemeLangContext";
import { t } from "../../locales/locale";
import { useState } from "react";

/**
 * Основные настройки: язык, тема, валюта (валюта — заглушка)
 */
export default function SettingsBlock() {
  const { lang, setLang, theme, setTheme } = useThemeLang();
  const [langOpen, setLangOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);

  return (
    <>
      <SettingItem
        icon="🌐"
        label={t("settings.language", lang)}
        value={lang === "ru" ? "Русский" : lang === "en" ? "English" : "Español"}
        onClick={() => setLangOpen(true)}
      />
      <SettingItem
        icon="🌓"
        label={t("settings.theme", lang)}
        value={theme === "light" ? t("settings.light", lang) : t("settings.dark", lang)}
        onClick={() => setThemeOpen(true)}
      />
      {/* Валюта (заглушка) */}
      <SettingItem
        icon="💸"
        label={t("settings.currency", lang)}
        value="RUB"
        onClick={() => alert("Скоро!")}
      />

      <LanguageModal open={langOpen} onClose={() => setLangOpen(false)} value={lang} onChange={setLang} />
      <ThemeModal open={themeOpen} onClose={() => setThemeOpen(false)} value={theme} onChange={setTheme} />
    </>
  );
}
