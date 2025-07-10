// src/components/UserCard.tsx
type Props = {
  name: string
  username?: string
  photo_url?: string
}
const UserCard = ({ name, username, photo_url }: Props) => (
  <div className="flex items-center px-3 py-3 gap-4">
    {photo_url ? (
      <img src={photo_url} alt="avatar" className="w-12 h-12 rounded-full object-cover bg-[var(--tg-hint-color)]" />
    ) : (
      <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[var(--tg-link-color)] text-white text-xl font-bold">
        {name.charAt(0)}
      </div>
    )}
    <div>
      <div className="font-semibold text-base">{name}</div>
      <div className="text-[var(--tg-hint-color)] text-xs">@{username}</div>
    </div>
  </div>
)
export default UserCard
