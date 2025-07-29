// src/components/UserCard.tsx

import Avatar from "./Avatar"

type Props = {
  name: string
  username?: string
  photo_url?: string
}

const UserCard = ({ name, username, photo_url }: Props) => (
  <div className="flex items-center px-3 py-3 gap-4">
    <Avatar name={name} src={photo_url} size={48} />
    <div>
      <div className="font-semibold text-base">{name}</div>
      <div className="text-[var(--tg-hint-color)] text-xs">
        {username && "@"}{username}
      </div>
    </div>
  </div>
)

export default UserCard
