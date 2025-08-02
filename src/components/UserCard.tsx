// src/components/UserCard.tsx

import Avatar from "./Avatar"

type Props = {
  name: string
  username?: string
  photo_url?: string
  size?: number // Можно задать размер при необходимости (дефолт 48)
}

const UserCard = ({ name, username, photo_url, size = 48 }: Props) => (
  <div className="flex items-center px-3 py-3 gap-4">
    <Avatar name={name} src={photo_url} size={size} />
    <div className="min-w-0">
      <div className="font-semibold text-base truncate">{name}</div>
      <div className="text-[var(--tg-hint-color)] text-xs truncate">
        {username && "@"}{username}
      </div>
    </div>
  </div>
)

export default UserCard
