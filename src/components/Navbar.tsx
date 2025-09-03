// src/components/Navbar.tsx
import { NavLink, useLocation } from "react-router-dom"
import { Home, Users, BookUser, UserCog } from "lucide-react"
import clsx from "clsx"
import { useTranslation } from "react-i18next"

const Navbar = () => {
  const { t } = useTranslation()
  const location = useLocation()

  const navItems = [
    { to: "/groups", label: t("groups"), icon: Users },
    { to: "/", label: t("main"), icon: Home },
    { to: "/contacts", label: t("contacts"), icon: BookUser },
    { to: "/profile", label: t("profile"), icon: UserCog },
  ]

  return (
    <nav
      role="navigation"
      aria-label="Primary"
      className={clsx(
        "fixed bottom-0 left-0 right-0 z-30",
        "w-full max-w-md mx-auto",
        "bg-[var(--tg-card-bg)] shadow-tg-card rounded-t-2xl",
        "px-2 pt-2",
        "pb-[calc(8px+env(safe-area-inset-bottom))]" // safe-area снизу
      )}
    >
      <div className="flex justify-around items-end">
        {navItems.map(({ to, label, icon: Icon }) => {
          const isActive = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to)
          return (
            <NavLink
              to={to}
              key={to}
              aria-label={label}
              className={clsx(
                "group flex flex-col items-center justify-center flex-1 min-w-0",
                "py-1 rounded-xl transition-all select-none",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tg-link-color)]/30",
                isActive
                  ? "bg-[var(--tg-link-color)] bg-opacity-90"
                  : "hover:bg-[var(--tg-link-color)] hover:bg-opacity-50"
              )}
              style={{ minWidth: 60 }}
            >
              <Icon
                size={26}
                className={
                  isActive
                    ? "text-white mb-0.5"
                    : "text-[var(--tg-hint-color)] mb-0.5 group-hover:text-white"
                }
              />
              <span
                className={
                  isActive
                    ? "text-xs font-medium text-white"
                    : "text-xs font-medium text-[var(--tg-hint-color)] group-hover:text-white"
                }
              >
                {label}
              </span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}

export default Navbar
