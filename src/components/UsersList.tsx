// src/components/UsersList.tsx

import type { User } from "../types/user";
import UserCard from "./UserCard";

interface UsersListProps {
  users: User[];
  showNumbers?: boolean;
}

export default function UsersList({ users, showNumbers = true }: UsersListProps) {
  return (
    <div className="space-y-2">
      {users.map((user, idx) => (
        <UserCard
          user={user}
          key={user.id}
          right={showNumbers ? <span className="text-xs opacity-50">{idx + 1}</span> : undefined}
        />
      ))}
    </div>
  );
}
