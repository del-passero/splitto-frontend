// src/components/Profile/ProfileTabs.tsx
interface Props {
  tab: "profile" | "settings";
  setTab: (tab: "profile" | "settings") => void;
}

export default function ProfileTabs({ tab, setTab }: Props) {
  return (
    <div className="flex rounded-xl overflow-hidden mb-4 border border-[var(--tg-theme-hint-color)]">
      <button
        className={`flex-1 py-2 font-semibold transition ${
          tab === "profile"
            ? "bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)]"
            : "bg-[var(--tg-theme-secondary-bg-color)] text-[var(--tg-theme-text-color)]"
        }`}
        onClick={() => setTab("profile")}
      >
        Профиль
      </button>
      <button
        className={`flex-1 py-2 font-semibold transition ${
          tab === "settings"
            ? "bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)]"
            : "bg-[var(--tg-theme-secondary-bg-color)] text-[var(--tg-theme-text-color)]"
        }`}
        onClick={() => setTab("settings")}
      >
        Настройки
      </button>
    </div>
  );
}
