// src/components/DebugTelegramInfo.tsx
export default function DebugTelegramInfo() {
  const tg = window.Telegram?.WebApp
  const params = tg?.themeParams
  const user = tg?.initDataUnsafe?.user

  return (
    <div style={{ background: "#fff", color: "#000", padding: 16, fontSize: 14 }}>
      <div><b>themeParams:</b> {JSON.stringify(params)}</div>
      <div><b>initDataUnsafe.user:</b> {JSON.stringify(user)}</div>
      <div><b>initData:</b> {tg?.initData}</div>
      <div><b>isTelegram:</b> {tg ? "YES" : "NO"}</div>
    </div>
  )
}
