# Этап 1: сборка проекта
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .
RUN npm run build

# Этап 2: Nginx для сервинга
FROM nginx:stable-alpine AS production

COPY --from=builder /app/dist /usr/share/nginx/html

# Кастомная конфигурация (по желанию)
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

