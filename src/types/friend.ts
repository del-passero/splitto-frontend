// src/types/friend.ts

// ����������� ��� ������������ (��� ����������� � UserCard)
export interface UserShort {
  id: number
  telegram_id: number
  name?: string
  username?: string
  first_name?: string
  last_name?: string
  photo_url?: string
  // ����� �������� ������ ����, ���� �����������
}

// ��� ��� ������ ����� (FriendOut)
export interface Friend {
  id: number
  user_id: number         // ID �������� ������������ (��)
  friend_id: number       // ID �����
  created_at: string
  updated_at: string
  hidden: boolean
  // ��������� ������ user (�� ����)
  user: UserShort
  // ��������� ������ friend (��� ����)
  friend: UserShort
}

// ��� ��� ������� �����
export interface FriendInvite {
  id: number
  from_user_id: number
  token: string
}
