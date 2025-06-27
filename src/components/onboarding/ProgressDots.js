import { jsx as _jsx } from "react/jsx-runtime";
const ProgressDots = ({ count, activeIndex }) => (_jsx("div", { className: "flex items-center justify-center gap-2 mt-4 mb-2", children: Array.from({ length: count }).map((_, idx) => (_jsx("span", { className: "inline-block rounded-full transition-all duration-150", style: {
            background: idx === activeIndex
                ? "var(--tg-theme-link-color, #229ed9)"
                : "var(--tg-theme-hint-color, #888888)",
            width: idx === activeIndex ? 12 : 8,
            height: idx === activeIndex ? 12 : 8,
            opacity: idx === activeIndex ? 1 : 0.5,
        } }, idx))) }));
export default ProgressDots;
