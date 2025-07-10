#!/bin/bash

set -e

echo "1. Устанавливаем зависимости..."
npm install i18next react-i18next

echo "2. Создаем файл src/i18n.ts с базовой инициализацией..."

cat > src/i18n.ts <<'EOF'
import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import ru from "./locales/ru"
import en from "./locales/en"
import es from "./locales/es"

i18n
  .use(initReactI18next)
  .init({
    resources: {
      ru: { translation: ru },
      en: { translation: en },
      es: { translation: es }
    },
    lng: "ru",
    fallbackLng: "ru",
    interpolation: { escapeValue: false }
  })

export default i18n
EOF

echo "3. Меняем импорты и использование getLocale на useTranslation во всех tsx/ts..."

# Удаляем все импорты getLocale
find ./src -type f -name "*.tsx" -or -name "*.ts" | xargs sed -i '/import.*getLocale/d'

# Вставляем импорт useTranslation если используется t =
find ./src -type f -name "*.tsx" -exec grep -l "getLocale(" {} \; | while read file; do
  sed -i '1i import { useTranslation } from "react-i18next"' "$file"
done

# Заменяем getLocale(lang) на const { t } = useTranslation()
find ./src -type f -name "*.tsx" -exec sed -i 's/const t = getLocale([^)]*)/const { t } = useTranslation()/' {} \;

# Заменяем t.key на t("key")
find ./src -type f -name "*.tsx" -exec perl -i -pe 's/t\.([a-zA-Z0-9_]+)/t\("\1"\)/g' {} \;

echo "4. Добавляем импорт ./i18n в main.tsx если его нет..."
grep -q 'import "./i18n"' src/main.tsx || sed -i '1i import "./i18n"' src/main.tsx

echo "5. Готово! Перейди в каждый компонент и убедись, что теперь используется useTranslation и t(\"...\")"

echo "P.S. Возможно, потребуется вручную проверить вложенные ключи и убрать старые getLocale, если что-то осталось."
