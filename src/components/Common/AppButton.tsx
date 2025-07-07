// src/components/Common/AppButton.tsx
export default function AppButton({
  children,
  onClick,
  danger,
  ...props
}: {
  children: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
  [key: string]: any;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full py-3 rounded-2xl font-semibold text-lg transition ${
        danger
          ? "bg-[#ea5757] text-white"
          : "bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)]"
      }`}
      style={props.style}
      {...props}
    >
      {children}
    </button>
  );
}
