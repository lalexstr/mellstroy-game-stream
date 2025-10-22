#!/bin/bash

# Backend Deploy Script
# Сервер: 91.229.8.162

set -e

echo "🚀 Начинаем деплой backend на сервер 91.229.8.162..."

# Переменные
SERVER_IP="91.229.8.162"
SERVER_USER="root"
PROJECT_NAME="mellstroy-backend"
REPO_URL="https://github.com/lalexstr/mellstroy-game-stream.git"
APP_DIR="/var/www/$PROJECT_NAME"

# Функция для выполнения команд на сервере
run_on_server() {
    ssh $SERVER_USER@$SERVER_IP "$1"
}

# Функция для копирования файлов на сервер
copy_to_server() {
    scp -r "$1" $SERVER_USER@$SERVER_IP:"$2"
}

echo "📦 Клонируем/обновляем репозиторий на сервере..."
run_on_server "
    if [ -d '$APP_DIR' ]; then
        echo 'Обновляем существующий репозиторий...'
        cd $APP_DIR
        git pull origin main
    else
        echo 'Клонируем новый репозиторий...'
        git clone $REPO_URL $APP_DIR
        cd $APP_DIR
    fi
"

echo "🔧 Устанавливаем зависимости..."
run_on_server "
    cd $APP_DIR
    npm ci --only=production
"

echo "🗄️ Настраиваем базу данных..."
run_on_server "
    cd $APP_DIR
    npx prisma generate
    npx prisma migrate deploy
"

echo "🐳 Собираем и запускаем Docker контейнер..."
run_on_server "
    cd $APP_DIR
    docker-compose -f docker-compose.backend.yml down || true
    docker-compose -f docker-compose.backend.yml build --no-cache
    docker-compose -f docker-compose.backend.yml up -d
"

echo "🔍 Проверяем статус контейнеров..."
run_on_server "
    docker ps | grep $PROJECT_NAME
"

echo "✅ Backend успешно задеплоен на сервер 91.229.8.162!"
echo "🌐 API доступно по адресу: http://91.229.8.162:3000"
