# 🚀 Деплой MellstroyVerse

## Архитектура

- **Backend Server**: `91.229.8.162` - API, WebSocket, база данных
- **Frontend Server**: `91.229.8.94` - Next.js приложение

## 📋 Предварительные требования

1. SSH доступ к серверам
2. Git репозиторий с кодом
3. Docker и Docker Compose на серверах
4. Nginx на серверах

## 🔧 Первоначальная настройка серверов

```bash
# Настройка всех серверов
chmod +x setup-servers.sh
./setup-servers.sh
```

## 🚀 Деплой

### Полный деплой (backend + frontend)
```bash
chmod +x deploy.sh
./deploy.sh all
```

### Деплой только backend
```bash
./deploy.sh backend
```

### Деплой только frontend
```bash
./deploy.sh frontend
```

## 🔗 URL после деплоя

- **Backend API**: http://91.229.8.162:3000
- **Frontend**: http://91.229.8.94:3000

## 📁 Структура файлов

```
├── deploy.sh                 # Главный скрипт деплоя
├── deploy-backend.sh         # Деплой backend
├── deploy-frontend.sh        # Деплой frontend
├── setup-servers.sh          # Настройка серверов
├── Dockerfile.backend        # Docker для backend
├── docker-compose.backend.yml
├── nginx-backend.conf        # Nginx для backend
├── nginx-frontend.conf       # Nginx для frontend
├── env.production.example    # Пример переменных окружения
└── frontend/mellstroy/
    ├── Dockerfile
    └── docker-compose.yml
```

## 🔐 Настройка переменных окружения

1. Скопируйте `env.production.example` в `.env.production`
2. Настройте переменные:
   - `JWT_SECRET` - секретный ключ для JWT
   - `EMAIL_USER` - email для отправки писем
   - `EMAIL_PASS` - пароль приложения для email
   - `CORS_ORIGIN` - URL frontend сервера

## 🐳 Docker команды

### Backend сервер (91.229.8.162)
```bash
# Подключение к серверу
ssh root@91.229.8.162

# Переход в директорию проекта
cd /var/www/mellstroy-backend

# Управление контейнерами
docker-compose -f docker-compose.backend.yml up -d
docker-compose -f docker-compose.backend.yml down
docker-compose -f docker-compose.backend.yml logs -f
```

### Frontend сервер (91.229.8.94)
```bash
# Подключение к серверу
ssh root@91.229.8.94

# Переход в директорию проекта
cd /var/www/mellstroy-frontend/frontend/mellstroy

# Управление контейнерами
docker-compose up -d
docker-compose down
docker-compose logs -f
```

## 🔍 Мониторинг

### Проверка статуса
```bash
# Backend
ssh root@91.229.8.162 "docker ps | grep mellstroy"

# Frontend  
ssh root@91.229.8.94 "docker ps | grep mellstroy"
```

### Логи
```bash
# Backend логи
ssh root@91.229.8.162 "docker-compose -f /var/www/mellstroy-backend/docker-compose.backend.yml logs -f"

# Frontend логи
ssh root@91.229.8.94 "docker-compose -f /var/www/mellstroy-frontend/frontend/mellstroy/docker-compose.yml logs -f"
```

## 🔄 Обновление

Для обновления кода:
1. Запушьте изменения в Git
2. Запустите соответствующий скрипт деплоя
3. Docker автоматически пересоберет контейнеры

## 🛠️ Troubleshooting

### Проблемы с Docker
```bash
# Очистка Docker
docker system prune -a
docker volume prune
```

### Проблемы с Nginx
```bash
# Перезапуск Nginx
systemctl restart nginx
systemctl status nginx
```

### Проблемы с базой данных
```bash
# Миграции
npx prisma migrate deploy
npx prisma generate
```
