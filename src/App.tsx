import { useTelegram } from "./hooks/useTelegram";

function App() {
  const { user, theme } = useTelegram();

  return (
    <div className="min-h-screen flex items-center justify-center bg-telegram text-white text-center p-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">
          Привет, {user?.first_name || "гость"}!
        </h1>
        <p className="text-sm text-white/80">Добро пожаловать в Splitto!</p>
        {theme && (
          <p className="mt-2 text-xs text-white/60">
            Текущая тема: фон {theme.bg_color}
          </p>
        )}
      </div>
    </div>
  );
}

export default App;
