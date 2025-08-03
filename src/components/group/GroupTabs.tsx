// src/components/group/GroupTabs.tsx

type Tab = {
  key: string
  label: string
}

type Props = {
  tabs: Tab[]
  selected: string
  onSelect: (key: string) => void
  className?: string
}

const GroupTabs = ({ tabs, selected, onSelect, className = "" }: Props) => (
  <div className={"flex w-full overflow-x-auto border-b border-[var(--tg-separator-color)] bg-[var(--tg-bg-color)] " + className}>
    {tabs.map(tab => (
      <button
        key={tab.key}
        onClick={() => onSelect(tab.key)}
        className={
          "relative px-4 py-2 font-medium transition text-base focus:outline-none" +
          (selected === tab.key
            ? " text-[#53A6F7] font-bold"
            : " text-[var(--tg-hint-color)] font-normal") +
          " bg-transparent"
        }
        style={{ minWidth: 64 }}
        tabIndex={0}
      >
        {tab.label}
        {selected === tab.key && (
          <span className="absolute left-1/2 -translate-x-1/2 bottom-0 h-1 w-6 rounded-b-xl bg-[#53A6F7]" />
        )}
      </button>
    ))}
  </div>
)

export default GroupTabs
