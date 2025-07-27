import Navbar from "../components/Navbar"
const MainLayout = ({ children }: { children: React.ReactNode }) => (
    <div className="flex flex-col min-h-screen bg-[var(--tg-bg-color)]">
        <main className="flex-1 pb-16">{children}</main>
        <Navbar />
    </div>
)
export default MainLayout
