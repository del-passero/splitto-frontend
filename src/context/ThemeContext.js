import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useState } from "react";
const ThemeContext = createContext({
    themeParams: {},
    isDark: false,
});
export const useTheme = () => useContext(ThemeContext);
export const ThemeProvider = ({ children }) => {
    const [themeParams, setThemeParams] = useState({});
    const [isDark, setIsDark] = useState(false);
    useEffect(() => {
        const tg = window.Telegram?.WebApp;
        let params = {};
        let dark = false;
        if (tg && tg.themeParams) {
            params = tg.themeParams;
            dark = tg.colorScheme === "dark";
        }
        else {
            params = {};
            dark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
        }
        setThemeParams(params);
        setIsDark(dark);
        const root = document.documentElement;
        Object.entries(params).forEach(([k, v]) => {
            if (typeof v === "string") {
                root.style.setProperty(`--tg-theme-${k.replace(/_/g, "-")}`, v);
            }
        });
        root.classList.toggle("dark", dark);
        if (tg && tg.onEvent) {
            const handler = () => {
                const updParams = tg.themeParams || {};
                setThemeParams(updParams);
                setIsDark(tg.colorScheme === "dark");
                Object.entries(updParams).forEach(([k, v]) => {
                    if (typeof v === "string") {
                        root.style.setProperty(`--tg-theme-${k.replace(/_/g, "-")}`, v);
                    }
                });
                root.classList.toggle("dark", tg.colorScheme === "dark");
            };
            tg.onEvent("themeChanged", handler);
            return () => {
                tg.offEvent("themeChanged", handler);
            };
        }
    }, []);
    return (_jsx(ThemeContext.Provider, { value: { themeParams, isDark }, children: children }));
};
