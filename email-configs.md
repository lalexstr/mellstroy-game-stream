# 📧 Альтернативные настройки email

## Варианты обхода блокировки портов 25/465:

### 1. Gmail (порт 587 - TLS)
```javascript
{
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-app-password'
  }
}
```

### 2. Yandex (порт 587)
```javascript
{
  host: 'smtp.yandex.ru',
  port: 587,
  secure: false,
  auth: {
    user: 'your-email@yandex.ru',
    pass: 'your-password'
  }
}
```

### 3. Mail.ru (порт 587)
```javascript
{
  host: 'smtp.mail.ru',
  port: 587,
  secure: false,
  auth: {
    user: 'your-email@mail.ru',
    pass: 'your-password'
  }
}
```

### 4. Outlook/Hotmail (порт 587)
```javascript
{
  host: 'smtp-mail.outlook.com',
  port: 587,
  secure: false,
  auth: {
    user: 'your-email@outlook.com',
    pass: 'your-password'
  }
}
```

### 5. SendGrid (порт 587)
```javascript
{
  host: 'smtp.sendgrid.net',
  port: 587,
  secure: false,
  auth: {
    user: 'apikey',
    pass: 'your-sendgrid-api-key'
  }
}
```

## Настройка переменных окружения:

```env
# Для Gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Для Yandex
EMAIL_USER=your-email@yandex.ru
EMAIL_PASS=your-password

# Для SendGrid
EMAIL_USER=apikey
EMAIL_PASS=your-sendgrid-api-key
```
