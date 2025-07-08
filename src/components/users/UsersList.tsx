// src/components/Users/UsersList.tsx
import type { User } from "../../types/user";
import UserCard from "./UserCard";

export default function UsersList({ users }: { users: User[] }) {
  if (!users.length) return <div className="text-xs opacity-60">Пользователей нет</div>;
  return (
    <div className="flex flex-col gap-2">
      {users.map((user, idx) => (
        <UserCard user={user} key={user.id} right={<span className="text-xs opacity-40">#{idx + 1}</span>} />
      ))}
    </div>
  );
}
