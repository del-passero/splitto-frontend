// src/components/Profile/LogoutButton.tsx
import AppButton from "../Common/AppButton";

export default function LogoutButton({ onClick }: { onClick: () => void }) {
  return (
    <AppButton onClick={onClick} danger>
      Выйти
    </AppButton>
  );
}
