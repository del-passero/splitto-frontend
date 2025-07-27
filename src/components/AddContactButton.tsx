type Props = { onClick: () => void }
const AddContactButton = ({ onClick }: Props) => (
    <button
        type="button"
        onClick={onClick}
        className="
      w-16 h-16 rounded-full
      bg-[var(--tg-link-color)] text-white shadow-xl text-3xl
      flex items-center justify-center
      transition hover:scale-105 active:scale-95
      border border-white/80
    "
        aria-label="Добавить контакт"
        style={{ boxShadow: "0 4px 16px 0 rgba(34, 105, 255, 0.14)" }}
    >
        +
    </button>
)
export default AddContactButton
