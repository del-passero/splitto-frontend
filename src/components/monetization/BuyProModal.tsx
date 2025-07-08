// src/components/monetization/BuyProModal.tsx

import UniversalModal from "../common/UniversalModal"

export default function BuyProModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <UniversalModal open={open} onClose={onClose}>
      <div className="text-center py-8 text-lg">Будет реализовано позже!</div>
    </UniversalModal>
  )
}
