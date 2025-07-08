// src/components/common/UniversalModal.tsx
export default function UniversalModal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div className="bg-[var(--tg-theme-bg-color)] rounded-2xl shadow-lg min-w-[280px] max-w-sm w-full p-4" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}
