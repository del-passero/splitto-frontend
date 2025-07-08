// src/components/profile/EditProfileModal.tsx
import UniversalModal from "../common/UniversalModal"

export default function EditProfileModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <UniversalModal open={open} onClose={onClose}>
      <div className="text-center py-8 text-lg">Редактирование профиля будет позже!</div>
    </UniversalModal>
  )
}
