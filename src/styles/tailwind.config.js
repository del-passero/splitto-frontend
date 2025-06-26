/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // тёмная тема через класс .dark
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './public/index.html'
  ],
  theme: {
    extend: {
      colors: {
        // Основные telegram-цвета
        'telegram-blue': '#229ED9',
        'telegram-header': '#222222',
        'telegram-header-dark': '#FFFFFF',
        'telegram-main': '#222222',
        'telegram-main-dark': '#FFFFFF',
        'telegram-secondary': '#777777',
        'telegram-secondary-dark': '#D6D6D6',
        'telegram-card': '#F7F7F7',
        'telegram-card-dark': '#23262B',
        'telegram-bg': '#FFFFFF',
        'telegram-bg-dark': '#181B20',

        // Успешный и опасный статус
        'telegram-green': '#3DC97B',
        'telegram-red': '#FF6159',

        // Бордер
        'telegram-border': '#E5E5E5',
        'telegram-border-dark': '#23262B',

        // Прозрачность для hover и active
        'telegram-blue-light': '#229ED9CC',
      },
      fontFamily: {
        sans: [
          'SF Pro',
          'Roboto',
          'system-ui',
          'Arial',
          'sans-serif'
        ],
      },
      borderRadius: {
        'md': '16px',
        'lg': '20px',
        'full': '9999px',
        // Кастом для telegram-style
        'tg': '16px',
      },
      boxShadow: {
        'input': '0 1px 4px 0 rgba(0,0,0,0.07)',
        'card': '0 2px 16px 0 rgba(0,0,0,0.07)',
      },
      // Для отступов, если нужны кастомные
      spacing: {
        'tg-header-y': '16px',
        'tg-header-x': '16px',
        'tg-section': '24px',
      },
      maxWidth: {
        'onboarding': '400px',
      },
    },
  },
  plugins: [],
};
