import { ArrowDownUp } from "lucide-react"
type Props = { onClick: () => void }
const SortButton = ({ onClick }: Props) => (
    <button
        type="button"
        onClick={onClick}
        className="
      flex items-center justify-center
      h-10 w-10 min-w-[40px]
      rounded-xl bg-[var(--tg-card-bg)]
      hover:bg-[var(--tg-link-color)] hover:text-white
      text-[var(--tg-hint-color)] transition
      shadow-tg-card
    "
        title="Сортировка"
    >
        <ArrowDownUp size={18} />
    </button>
)
export default SortButton
