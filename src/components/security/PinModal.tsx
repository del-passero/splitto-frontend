// src/components/security/PinModal.tsx
import UniversalModal from "../common/UniversalModal"

export default function PinModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <UniversalModal open={open} onClose={onClose}>
      <div className="text-center py-8 text-lg">PIN-код появится в будущем!</div>
    </UniversalModal>
  )
}
