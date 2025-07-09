// src/components/UserCard.tsx
import Avatar from "./Avatar"
type Props = {
  name: string
  username?: string
  photo_url?: string
}
const UserCard = ({ name, username, photo_url }: Props) => (
  <div className="flex flex-col items-center rounded-2xl bg-[var(--tg-bg-color)] shadow p-4 mb-6">
    <Avatar name={name} src={photo_url} size={80} />
    <div className="mt-3 font-bold text-lg text-[var(--tg-text-color)]">{name}</div>
    {username && <div className="text-[var(--tg-hint-color)] text-sm">@{username}</div>}
  </div>
)
export default UserCard
