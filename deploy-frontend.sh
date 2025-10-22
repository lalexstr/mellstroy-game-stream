#!/bin/bash

# Frontend Deploy Script
# Сервер: 91.229.8.94

set -e

echo "🚀 Начинаем деплой frontend на сервер 91.229.8.94..."

# Переменные
SERVER_IP="91.229.8.94"
SERVER_USER="root"
PROJECT_NAME="mellstroy-frontend"
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

echo "🔧 Переходим в директорию frontend..."
run_on_server "
    cd $APP_DIR/frontend/mellstroy
"

echo "📦 Устанавливаем зависимости..."
run_on_server "
    cd $APP_DIR/frontend/mellstroy
    npm ci --only=production
"

echo "🐳 Собираем и запускаем Docker контейнер..."
run_on_server "
    cd $APP_DIR/frontend/mellstroy
    docker-compose down || true
    docker-compose build --no-cache
    docker-compose up -d
"

echo "🔍 Проверяем статус контейнеров..."
run_on_server "
    docker ps | grep $PROJECT_NAME
"

echo "✅ Frontend успешно задеплоен на сервер 91.229.8.94!"
echo "🌐 Приложение доступно по адресу: http://91.229.8.94:3000"
