import { useState } from "react"
import { useTranslation } from "react-i18next"
import AddContactButton from "../components/AddContactButton"
import SearchBar from "../components/SearchBar"
import SortButton from "../components/SortButton"
import FilterButton from "../components/FilterButton"
import InviteFriendModal from "../components/InviteFriendModal"

const ContactsPage = () => {
    const { t } = useTranslation()
    const [search, setSearch] = useState("")
    const [inviteOpen, setInviteOpen] = useState(false)
    const [inviteLink, setInviteLink] = useState<string | null>(null)
    const [sortOpen, setSortOpen] = useState(false)
    const [filterOpen, setFilterOpen] = useState(false)

    // Здесь будет реальный массив друзей, пока пустой
    const contacts: any[] = []

    // Функция создания инвайт-ссылки (заглушка — замени на backend)
    const handleCreateInvite = () => {
        // Тут обычно вызывается API backend
        const fakeLink = "https://t.me/SplittoInviteBot?start=abcdefg"
        setInviteLink(fakeLink)
    }

    // Сортировка и фильтры пока-заглушки:
    const handleSortClick = () => setSortOpen(true)
    const handleFilterClick = () => setFilterOpen(true)

    return (
        <div className="relative w-full max-w-md mx-auto min-h-screen flex flex-col">
            <header className="flex items-center justify-between mb-4 px-2 pt-6">
                <h1 className="text-xl font-bold">{t("contacts")}</h1>
            </header>

            <div className="flex items-center gap-2 mb-4 px-2">
                <FilterButton onClick={handleFilterClick} />
                <div className="flex-1">
                    <SearchBar value={search} onChange={setSearch} placeholder={t("search_placeholder") || "Поиск..."} />
                </div>
                <SortButton onClick={handleSortClick} />
            </div>

            <div className="mb-2 px-2 text-xs text-[var(--tg-hint-color)]">
                {t("contacts_count", { count: contacts.length })}
            </div>

            {/* Пока только пустое состояние */}
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-[var(--tg-hint-color)] text-lg">
                    {t("empty_contacts")}
                </div>
            </div>

            {/* FAB и подпись */}
            <div className="absolute right-6 bottom-[90px] flex flex-col items-center z-40">
                <AddContactButton onClick={() => setInviteOpen(true)} />
                <span className="mt-1 text-xs font-medium text-[var(--tg-hint-color)] select-none">
                    {t("invite_friend")}
                </span>
            </div>

            {/* Модалка инвайта */}
            <InviteFriendModal
                open={inviteOpen}
                onClose={() => { setInviteOpen(false); setInviteLink(null) }}
                inviteLink={inviteLink}
                onCreateLink={handleCreateInvite}
            />

            {/* Модалки фильтра и сортировки — можно реализовать позже */}
            {/* 
      {sortOpen && <SortModal onClose={() => setSortOpen(false)} />}
      {filterOpen && <FilterModal onClose={() => setFilterOpen(false)} />}
      */}
        </div>
    )
}
export default ContactsPage
