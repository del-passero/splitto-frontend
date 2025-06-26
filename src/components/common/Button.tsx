import React from "react";

/**
 * Button — универсальная кнопка для всего проекта (Telegram-style).
 */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  fullWidth = true,
  className = "",
  ...props
}) => (
  <button
    type={props.type || "button"}
    className={`
      px-8 py-3 rounded-xl font-bold text-[17px] transition
      shadow-sm focus:outline-none
      ${fullWidth ? "w-full max-w-[320px]" : ""}
      ${
        variant === "primary"
          ? "bg-telegram-blue text-white active:bg-telegram-blue/80"
          : "bg-telegram-card dark:bg-telegram-card-dark text-telegram-main dark:text-telegram-main-dark border border-telegram-blue"
      }
      ${className}
    `}
    {...props}
  >
    {children}
  </button>
);

export default Button;
