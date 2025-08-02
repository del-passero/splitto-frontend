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
  <div className="flex flex-col min-h-screen bg-[var(--tg-bg-color)]">
    <main className="flex-1 pb-16">{children}</main>
    <Navbar />
    {!!fabActions.length && <FAB actions={fabActions} />}
  </div>
)

export default MainLayout
