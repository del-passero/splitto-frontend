import { Fragment, useState, useEffect } from "react"
import { Dialog, Transition } from "@headlessui/react"
import { useTranslation } from "react-i18next"
import { getGroupInvite } from "../api/groupsApi"

type Props = {
    open: boolean
    onClose: () => void
    groupId: number
}

const BOT_USERNAME = "Splitto_Bot" // Укажи своего бота!

const InviteGroupModal = ({ open, onClose, groupId }: Props) => {
    const { t } = useTranslation()
    const [inviteUrl, setInviteUrl] = useState("")
    const [loading, setLoading] = useState(false)
    const [copied, setCopied] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchInvite = async () => {
        setLoading(true)
        setError(null)
        setCopied(false)
        try {
            const res = await getGroupInvite(groupId)
            const url = `https://t.me/${BOT_USERNAME}?startapp=${res.token}`
            setInviteUrl(url)
        } catch (e: any) {
            setError(e?.response?.data?.detail || t("error_invite_link"))
        } finally {
            setLoading(false)
        }
    }

    const handleCopy = async () => {
        if (inviteUrl) {
            await navigator.clipboard.writeText(inviteUrl)
            setCopied(true)
            setTimeout(() => setCopied(false), 1200)
        }
    }

    useEffect(() => {
        if (open && groupId) fetchInvite()
        // eslint-disable-next-line
    }, [open, groupId])

    return (
        <Transition.Root show={open} as={Fragment}>
            <Dialog as="div" className="fixed z-50 inset-0 flex items-center justify-center" onClose={onClose}>
                <div className="fixed inset-0 bg-black/30" />
                <div className="inline-block bg-[var(--tg-card-bg)] rounded-2xl p-6 shadow-xl w-full max-w-xs text-center z-50">
                    <Dialog.Title className="text-lg font-bold mb-4">{t("invite_by_link")}</Dialog.Title>
                    {loading && (
                        <div className="text-[var(--tg-hint-color)]">{t("loading")}</div>
                    )}
                    {error && (
                        <div className="text-red-500 mb-2">{error}</div>
                    )}
                    {!loading && !error && (
                        <>
                            <div className="break-all text-[var(--tg-link-color)] bg-[var(--tg-secondary-bg)] rounded-lg px-2 py-1 mb-2 select-all">
                                {inviteUrl}
                            </div>
                            <button
                                className="btn-primary w-full mb-2"
                                onClick={handleCopy}
                                disabled={copied}
                            >
                                {copied ? t("copied") : t("copy_link")}
                            </button>
                            {navigator.share && (
                                <button
                                    className="btn-secondary w-full"
                                    onClick={() => navigator.share({ text: inviteUrl })}
                                >
                                    {t("share")}
                                </button>
                            )}
                        </>
                    )}
                    <button className="btn-secondary w-full mt-4" onClick={onClose}>
                        {t("close")}
                    </button>
                </div>
            </Dialog>
        </Transition.Root>
    )
}

export default InviteGroupModal
