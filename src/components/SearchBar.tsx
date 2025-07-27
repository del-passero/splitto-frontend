type Props = {
    value: string
    onChange: (v: string) => void
    placeholder?: string
}
const SearchBar = ({ value, onChange, placeholder }: Props) => (
    <input
        type="text"
        className="
      w-full h-10 rounded-xl bg-[var(--tg-card-bg)] border-none px-4
      text-base outline-none shadow-tg-card
      text-[var(--tg-text-color)]
      placeholder-[var(--tg-hint-color)] transition"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
    />
)
export default SearchBar
