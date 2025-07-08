// src/locales/locale.ts
import { locales, SupportedLangs } from "./index";

export function t(path: string, lang: SupportedLangs): string {
  const keys = path.split(".");
  let cur: any = locales[lang] || locales["en"];
  for (const k of keys) cur = cur?.[k];
  return typeof cur === "string" ? cur : path;
}
