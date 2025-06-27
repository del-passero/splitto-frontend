import { jsx as _jsx } from "react/jsx-runtime";
const Button = ({ children, variant = "primary", fullWidth = true, className = "", ...props }) => (_jsx("button", { type: props.type || "button", className: `
      px-8 py-3 rounded-xl font-bold text-[17px] transition
      shadow-sm focus:outline-none
      ${fullWidth ? "w-full max-w-[320px]" : ""}
      ${variant === "primary"
        ? "bg-telegram-blue text-white active:bg-telegram-blue/80"
        : "bg-telegram-card dark:bg-telegram-card-dark text-telegram-main dark:text-telegram-main-dark border border-telegram-blue"}
      ${className}
    `, ...props, children: children }));
export default Button;
