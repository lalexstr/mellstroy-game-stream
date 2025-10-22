#!/bin/bash

# Скрипт настройки серверов для деплоя
# Выполнить на каждом сервере перед первым деплоем

set -e

echo "🔧 Настройка серверов для MellstroyVerse..."

# Функция для настройки сервера
setup_server() {
    local server_ip=$1
    local server_name=$2
    
    echo "🖥️ Настраиваем сервер $server_name ($server_ip)..."
    
    ssh root@$server_ip "
        # Обновление системы
        apt update && apt upgrade -y
        
        # Установка Docker
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        systemctl enable docker
        systemctl start docker
        
        # Установка Docker Compose
        curl -L \"https://github.com/docker/compose/releases/latest/download/docker-compose-\$(uname -s)-\$(uname -m)\" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
        
        # Установка Nginx
        apt install nginx -y
        systemctl enable nginx
        systemctl start nginx
        
        # Установка Node.js (для Prisma)
        curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
        apt install nodejs -y
        
        # Установка Git
        apt install git -y
        
        # Создание директорий
        mkdir -p /var/www
        mkdir -p /var/log/nginx
        
        # Настройка firewall
        ufw allow 22
        ufw allow 80
        ufw allow 3000
        ufw --force enable
        
        echo '✅ Сервер $server_name настроен!'
    "
}

# Настройка backend сервера
echo "1️⃣ Настройка backend сервера (91.229.8.162)..."
setup_server "91.229.8.162" "Backend"

# Настройка frontend сервера  
echo "2️⃣ Настройка frontend сервера (91.229.8.94)..."
setup_server "91.229.8.94" "Frontend"

echo "✅ Все серверы настроены!"
echo "🚀 Теперь можно выполнить деплой: ./deploy.sh"
