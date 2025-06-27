import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/components/onboarding/Onboarding.tsx
import { useEffect, useState } from "react";
function getThemeParam(name, fallback) {
    // @ts-ignore
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.themeParams) {
        return window.Telegram.WebApp.themeParams[name] || fallback;
    }
    return fallback;
}
const Onboarding = ({ onFinish, onSkip }) => {
    const [colors, setColors] = useState({
        bg: "#ffffff",
        text: "#222f3f",
        button: "#3390ec",
        buttonText: "#ffffff",
        hint: "#a8a8a8",
    });
    useEffect(() => {
        setColors({
            bg: getThemeParam("bg_color", "#ffffff"),
            text: getThemeParam("text_color", "#222f3f"),
            button: getThemeParam("button_color", "#3390ec"),
            buttonText: getThemeParam("button_text_color", "#ffffff"),
            hint: getThemeParam("hint_color", "#a8a8a8"),
        });
    }, []);
    return (_jsxs("div", { style: {
            background: colors.bg,
            color: colors.text,
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            fontFamily: "system-ui, sans-serif",
            transition: "background 0.2s",
        }, children: [_jsx("img", { src: "https://cdn4.iconfinder.com/data/icons/social-media-rounded-corners/512/Telegram-512.png", alt: "Splitto", style: { width: 80, marginBottom: 24, borderRadius: 20, boxShadow: "0 6px 16px #0002" } }), _jsx("h1", { style: { fontWeight: 800, fontSize: 28, margin: 0, marginBottom: 12 }, children: "\u0414\u043E\u0431\u0440\u043E \u043F\u043E\u0436\u0430\u043B\u043E\u0432\u0430\u0442\u044C!" }), _jsxs("div", { style: { maxWidth: 340, textAlign: "center", fontSize: 18, marginBottom: 36, color: colors.hint }, children: ["Splitto \u2014 \u0431\u044B\u0441\u0442\u0440\u044B\u0439 \u0441\u043F\u043E\u0441\u043E\u0431 \u0434\u0435\u043B\u0438\u0442\u044C \u0442\u0440\u0430\u0442\u044B \u0441 \u0434\u0440\u0443\u0437\u044C\u044F\u043C\u0438.", _jsx("br", {}), _jsx("span", { style: { fontSize: 15, color: colors.text, opacity: 0.7 }, children: "\u0410\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u044F \u0438 \u0438\u043D\u0442\u0435\u0440\u0444\u0435\u0439\u0441 \u043F\u043E\u043B\u043D\u043E\u0441\u0442\u044C\u044E \u0438\u043D\u0442\u0435\u0433\u0440\u0438\u0440\u043E\u0432\u0430\u043D\u044B \u0441 Telegram." })] }), _jsxs("div", { style: { display: "flex", gap: 18, marginBottom: 12 }, children: [_jsx("button", { style: {
                            padding: "12px 36px",
                            fontSize: 17,
                            fontWeight: 600,
                            borderRadius: 16,
                            border: "none",
                            background: colors.button,
                            color: colors.buttonText,
                            boxShadow: "0 2px 16px #0002",
                            cursor: "pointer",
                            outline: "none",
                            transition: "background 0.15s, color 0.15s",
                        }, onClick: onFinish, children: "\u041D\u0430\u0447\u0430\u0442\u044C" }), _jsx("button", { style: {
                            padding: "12px 30px",
                            fontSize: 17,
                            borderRadius: 16,
                            border: `1.5px solid ${colors.button}`,
                            background: "transparent",
                            color: colors.button,
                            fontWeight: 600,
                            cursor: "pointer",
                            outline: "none",
                            transition: "background 0.15s, color 0.15s, border 0.2s",
                        }, onClick: onSkip, children: "\u041F\u043E\u0437\u0436\u0435" })] }), _jsxs("div", { style: { fontSize: 14, color: colors.hint, marginTop: 18 }, children: ["\u041F\u0440\u043E\u0434\u043E\u043B\u0436\u0430\u044F, \u0432\u044B \u043F\u0440\u0438\u043D\u0438\u043C\u0430\u0435\u0442\u0435 ", _jsx("a", { href: "#", style: { color: colors.button, textDecoration: "underline" }, children: "\u0443\u0441\u043B\u043E\u0432\u0438\u044F \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u043D\u0438\u044F" })] })] }));
};
export default Onboarding;
