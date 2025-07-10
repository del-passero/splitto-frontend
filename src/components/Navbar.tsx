// src/components/Navbar.tsx

import { NavLink, useLocation } from "react-router-dom";
import { BookUser, Users, House, UserCog } from "lucide-react";
import { useSettingsStore } from "../store/settingsStore";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

// Стилизация через tailwind + CSS-переменные, как в Telegram Wallet

const navItems = [
  {
    to: "/contacts",
    labelKey: "navbar.contacts",
    icon: BookUser,
  },
  {
    to: "/groups",
    labelKey: "navbar.groups",
    icon: Users,
  },
  {
    to: "/",
    labelKey: "navbar.splitto",
    icon: House,
  },
  {
    to: "/profile",
    labelKey: "navbar.settings",
    icon: UserCog,
  },
];

const Navbar = () => {
  const { theme } = useSettingsStore();
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <nav
      className={clsx(
        "fixed bottom-0 left-0 right-0 z-30 flex justify-around items-end py-2 px-2 bg-[var(--tg-card-bg)] shadow-tg-card transition-all",
        "rounded-t-2xl",
        theme === "dark" && "backdrop-blur-lg"
      )}
      style={{
        borderTop: "1px solid var(--tg-bg-color)",
      }}
    >
      {navItems.map(({ to, labelKey, icon: Icon }) => {
        const isActive =
          to === "/"
            ? location.pathname === "/"
            : location.pathname.startsWith(to);
        return (
          <NavLink
            to={to}
            key={to}
            className={clsx(
              "flex flex-col items-center justify-center flex-1 min-w-0 py-1 rounded-xl transition-all",
              isActive
                ? "bg-[var(--tg-link-color)] bg-opacity-10"
                : "hover:bg-[var(--tg-link-color)] hover:bg-opacity-5"
            )}
            style={{
              minWidth: "60px",
            }}
          >
            <Icon
              size={26}
              className={clsx(
                "mb-0.5",
                isActive
                  ? "text-[var(--tg-link-color)]"
                  : "text-[var(--tg-hint-color)]"
              )}
            />
            <span
              className={clsx(
                "text-xs font-medium leading-none",
                isActive
                  ? "text-[var(--tg-link-color)]"
                  : "text-[var(--tg-hint-color)]"
              )}
            >
              {t(labelKey)}
            </span>
          </NavLink>
        );
      })}
    </nav>
  );
};

export default Navbar;
