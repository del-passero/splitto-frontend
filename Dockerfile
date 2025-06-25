# Используем официальный образ Node.js
FROM node:18-alpine

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и устанавливаем зависимости
COPY . .
RUN npm install

# Копируем остальные файлы и собираем проект
COPY . .
RUN npm run build

# Устанавливаем сервер для раздачи статики
RUN npm install -g serve

# Запускаем приложение
CMD ["serve", "-s", "dist", "-l", "80"]
