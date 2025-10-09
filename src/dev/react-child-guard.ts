// src/dev/react-child-guard.ts
import * as React from "react"

// Этот файл — «горячий патч», подключай его первым в entry (main.tsx/index.tsx).
// Он перехватывает createElement и подменяет не-рендеримые дети безопасной строкой,
// одновременно логируя компонент, где мусор появился.

if (!(window as any).__REACT_GUARD_185__) {
  (window as any).__REACT_GUARD_185__ = true

  const origCreateElement = (React as any).createElement

  const isRenderable = (x: any): boolean => {
    return (
      x == null ||
      typeof x === "string" ||
      typeof x === "number" ||
      React.isValidElement(x) ||
      (Array.isArray(x) && x.every(isRenderable))
    )
  }

  // TS считает свойство readonly — делаем явный каст + ts-ignore.
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  ;(React as unknown as any).createElement = (type: any, props: any, ...children: any[]) => {
    const bad: Array<{ idx: number; kind: string; sample: string[]; path?: string }> = []

    const check = (c: any, idx: number, path = "") => {
      if (c == null || typeof c === "string" || typeof c === "number" || React.isValidElement(c)) return
      if (Array.isArray(c)) {
        c.forEach((v, i) => check(v, i, path ? `${path}.${i}` : String(i)))
        return
      }
      bad.push({ idx, kind: typeof c, sample: Object.keys(c || {}).slice(0, 6), path })
    }

    children.forEach((c, i) => check(c, i))

    if (bad.length) {
      const name =
        typeof type === "function" ? type.displayName || type.name || "<anon>" : String(type)
      // eslint-disable-next-line no-console
      console.error("[ReactGuard185] Bad child in <%s>", name, {
        badChildren: bad,
        // propsPreview: Object.keys(props || {}).slice(0, 12),
      })
      children = children.map((c) => (isRenderable(c) ? c : "[object]"))
    }

    return origCreateElement(type, props, ...children)
  }
}
