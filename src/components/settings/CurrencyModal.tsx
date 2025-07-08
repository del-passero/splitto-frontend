// src/components/settings/CurrencyModal.tsx
import UniversalModal from "../common/UniversalModal"

export default function CurrencyModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <UniversalModal open={open} onClose={onClose}>
      <div className="text-center py-8 text-lg">Выбор валюты появится позже!</div>
    </UniversalModal>
  )
}
