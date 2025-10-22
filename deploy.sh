#!/bin/bash

# Главный скрипт деплоя MellstroyVerse
# Деплой на два сервера: backend (91.229.8.162) и frontend (91.229.8.94)

set -e

echo "🚀 Начинаем полный деплой MellstroyVerse..."

# Проверка аргументов
if [ "$1" = "backend" ]; then
    echo "📦 Деплоим только backend..."
    ./deploy-backend.sh
elif [ "$1" = "frontend" ]; then
    echo "🎨 Деплоим только frontend..."
    ./deploy-frontend.sh
elif [ "$1" = "all" ] || [ -z "$1" ]; then
    echo "🌐 Деплоим backend и frontend..."
    echo ""
    echo "1️⃣ Деплой backend на 91.229.8.162..."
    ./deploy-backend.sh
    echo ""
    echo "2️⃣ Деплой frontend на 91.229.8.94..."
    ./deploy-frontend.sh
    echo ""
    echo "✅ Полный деплой завершен!"
    echo "🔗 Backend API: http://91.229.8.162:3000"
    echo "🔗 Frontend: http://91.229.8.94:3000"
else
    echo "❌ Неверный аргумент. Используйте:"
    echo "  ./deploy.sh backend   - деплой только backend"
    echo "  ./deploy.sh frontend  - деплой только frontend"
    echo "  ./deploy.sh all       - деплой всего (по умолчанию)"
    exit 1
fi
