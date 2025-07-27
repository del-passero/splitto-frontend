import { useState } from "react"
import { useTranslation } from "react-i18next"
import AddContactButton from "../components/AddContactButton"
import SearchBar from "../components/SearchBar"
import SortButton from "../components/SortButton"
import FilterButton from "../components/FilterButton"

const ContactsPage = () => {
    const { t } = useTranslation()
    const [search, setSearch] = useState("")
    const handleAddContact = () => alert("Добавить контакт")
    const handleSortClick = () => alert("Сортировка")
    const handleFilterClick = () => alert("Фильтр")

    return (
        <div className="relative w-full max-w-md mx-auto min-h-screen flex flex-col">
            <header className="flex items-center justify-between mb-4 px-2 pt-6">
                <h1 className="text-xl font-bold">{t("contacts")}</h1>
            </header>

            {/* Единая строка: фильтр — поиск — сортировка */}
            <div className="flex items-center gap-2 mb-4 px-2">
                <FilterButton onClick={handleFilterClick} />
                <div className="flex-1">
                    <SearchBar value={search} onChange={setSearch} placeholder={t("search_placeholder") || "Поиск..."} />
                </div>
                <SortButton onClick={handleSortClick} />
            </div>

            <div className="mb-2 px-2 text-xs text-[var(--tg-hint-color)]">{t("contacts_count", { count: 0 })}</div>

            <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-[var(--tg-hint-color)] text-lg">
                    {t("empty_contacts")}
                </div>
            </div>

            <div className="absolute right-6 bottom-[90px] flex flex-col items-center z-40">
                <AddContactButton onClick={handleAddContact} />
                <span className="mt-1 text-xs font-medium text-[var(--tg-hint-color)] select-none">
                    {t("invite_friend")}
                </span>
            </div>
        </div>
    )
}
export default ContactsPage
