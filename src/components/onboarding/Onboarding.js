import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import "../../app/index.css";
const getThemeParam = (name, fallback) => {
    // @ts-ignore
    return window.Telegram?.WebApp?.themeParams?.[name] || fallback;
};
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
        // DEBUG: посмотри что реально приходит!
        // @ts-ignore
        console.log("themeParams", window.Telegram?.WebApp?.themeParams);
    }, []);
    return (_jsxs("div", { style: {
            background: colors.bg,
            color: colors.text,
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center"
        }, children: [_jsx("button", { style: {
                    background: colors.button,
                    color: colors.buttonText,
                }, onClick: onFinish, children: "\u041D\u0430\u0447\u0430\u0442\u044C" }), _jsx("button", { style: {
                    border: `1.5px solid ${colors.button}`,
                    color: colors.button,
                }, onClick: onSkip, children: "\u041F\u043E\u0437\u0436\u0435" })] }));
};
export default Onboarding;
