// src/components/UserCard.tsx
import Avatar from "./Avatar"
type Props = {
  name: string
  username?: string
  photo_url?: string
}
const UserCard = ({ name, username, photo_url }: Props) => (
  <div className="flex flex-col items-center w-full p-6 bg-gradient-to-b from-[var(--tg-accent-bg-color)] to-[var(--tg-bg-color)] rounded-t-2xl mb-2 relative">
    <Avatar name={name} src={photo_url} size={86} />
    <div className="mt-3 font-bold text-xl text-[var(--tg-text-color)]">{name}</div>
    {username && <div className="text-[var(--tg-hint-color)] text-base">@{username}</div>}
  </div>
)
export default UserCard
