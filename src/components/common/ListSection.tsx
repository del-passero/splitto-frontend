// src/components/common/ListSection.tsx

export interface ListSectionProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export default function ListSection({ title, children, className }: ListSectionProps) {
  return (
    <section className={`mb-4 ${className || ""}`}>
      {title && <h2 className="px-2 pb-1 text-xs font-bold opacity-50">{title}</h2>}
      <div className="bg-[var(--tg-theme-secondary-bg-color)] rounded-2xl p-2">
        {children}
      </div>
    </section>
  );
}
