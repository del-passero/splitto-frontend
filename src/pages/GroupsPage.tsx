import { useTranslation } from "react-i18next"
const GroupsPage = () => {
    const { t } = useTranslation()
    return (
        <div className="w-full max-w-md mx-auto py-6">
            <h1 className="text-xl font-bold mb-4">{t("groups")}</h1>
        </div>
    )
}
export default GroupsPage
