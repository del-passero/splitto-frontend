import ru from "./ru"
import en from "./en"
import es from "./es"

const locales: Record<string, any> = { ru, en, es }

export function getLocale(lang: string | undefined): typeof ru {
    if (!lang) return locales.en
    if (lang in locales) return locales[lang]
    if (lang.includes("-")) {
        const short = lang.split("-")[0]
        if (short in locales) return locales[short]
    }
    return locales.en
}
