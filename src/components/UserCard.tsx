// src/components/UserCard.tsx
import Avatar from "./Avatar"
type Props = {
  name: string
  username?: string
  photo_url?: string
}
const UserCard = ({ name, username, photo_url }: Props) => (
  <div className="flex items-center px-5 py-4">
    <Avatar name={name} src={photo_url} size={56} />
    <div className="ml-4 flex flex-col">
      <div className="font-bold text-base text-[var(--tg-text-color)]">{name}</div>
      {username && <div className="text-[var(--tg-hint-color)] text-xs mt-0.5">@{username}</div>}
    </div>
  </div>
)
export default UserCard
