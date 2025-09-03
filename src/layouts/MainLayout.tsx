// src/layouts/MainLayout.tsx

import FAB from "../components/FAB"
import Navbar from "../components/Navbar"

type FabAction = {
  key: string
  icon: React.ReactNode
  onClick: () => void
  ariaLabel: string
}

type Props = {
  children: React.ReactNode
  fabActions?: FabAction[]
}

const MainLayout = ({ children, fabActions = [] }: Props) => (
  // Внутри .app-scroll, поэтому достаточно min-h-full
  <div className="flex flex-col min-h-full bg-[var(--tg-bg-color)]">
    {/* Отступ снизу под Navbar + safe-area */}
    <main
      role="main"
      className="flex-1 pb-[calc(72px+env(safe-area-inset-bottom))]"
    >
      {children}
    </main>

    <Navbar />

    {!!fabActions.length && <FAB actions={fabActions} />}
  </div>
)

export default MainLayout
