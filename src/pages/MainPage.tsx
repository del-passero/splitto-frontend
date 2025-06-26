import React from "react";

/**
 * MainPage — главная страница приложения Splitto.
 * Здесь будет выводиться основная информация, пока просто заголовок.
 */
const MainPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-telegram-bg dark:bg-telegram-bg-dark flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold text-telegram-header dark:text-telegram-header-dark">
        Добро пожаловать в Splitto!
      </h1>
      <p className="mt-4 text-telegram-main dark:text-telegram-main-dark text-lg">
        Это главная страница приложения.
      </p>
    </div>
  );
};

export default MainPage;
