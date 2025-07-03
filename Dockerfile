# --- 1. Сборка приложения ---
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# --- 2. Слой для раздачи фронта через nginx ---
FROM nginx:alpine

# Копируем свой nginx.conf (важно!)
COPY nginx.conf /etc/nginx/nginx.conf

# Копируем только собранную статику
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
