// frontend/src/pages/InviteLandingPage.tsx
import InviteJoinModal from "../components/InviteJoinModal"

export default function InviteLandingPage() {
  // Модалка сама дергает preview/accept и решает: показать себя, редиректнуть в группу, или скрыться.
  return (
    <>
      {/* Фоновая заглушка — на случай очень медленной сети */}
      <div
        style={{
          padding: "24px",
          opacity: 0.6,
          textAlign: "center",
          color: "var(--tg-theme-hint-color, rgba(0,0,0,0.6))",
        }}
      >
        Loading invite…
      </div>

      <InviteJoinModal />
    </>
  )
}
