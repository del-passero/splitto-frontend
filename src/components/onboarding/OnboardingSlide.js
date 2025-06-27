import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const OnboardingSlide = ({ illustration, title, text, smallText, buttonText, onButtonClick, }) => (_jsxs("div", { className: "\r\n      flex flex-col items-center justify-center\r\n      w-full h-full min-h-[350px] px-6 py-4\r\n      text-center\r\n      max-w-onboarding mx-auto\r\n    ", children: [_jsx("div", { className: "flex justify-center mb-6 mt-2", children: _jsx("div", { style: {
                    width: "100%",
                    maxWidth: 220,
                    maxHeight: 140,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                }, children: illustration }) }), _jsx("h2", { className: "font-bold text-[22px] leading-tight mb-3", style: {
                color: "var(--tg-theme-text-color)",
                wordBreak: "break-word",
            }, children: title }), _jsx("div", { className: "font-medium text-[17px] leading-snug mb-2", style: {
                color: "var(--tg-theme-text-color)",
                wordBreak: "break-word",
                whiteSpace: "pre-line",
            }, children: text }), smallText && (_jsx("div", { className: "font-normal text-[15px] leading-normal mb-4", style: { color: "var(--tg-theme-hint-color)" }, children: smallText })), buttonText && onButtonClick && (_jsx("button", { className: "mt-3 px-8 py-3 rounded-xl text-[17px] font-bold transition shadow-sm focus:outline-none w-full max-w-[320px]", style: {
                background: "var(--tg-theme-button-color)",
                color: "var(--tg-theme-button-text-color)",
                border: "none",
            }, type: "button", onClick: onButtonClick, children: buttonText }))] }));
export default OnboardingSlide;
