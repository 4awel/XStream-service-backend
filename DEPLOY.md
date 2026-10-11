# Деплой: Render (API) + Netlify (фронт)

Демо-режим: вход, каталог, профили и категории работают. Стримы — нет
(MediaMTX на Render не поднять), загрузка аватарок — только с настоящим S3.

```
браузер ── https://<site>.netlify.app ──┬── страницы Next.js
                                         ├── /api/* ──прокси──> https://xstream-api.onrender.com
                                         └── WebSocket ─────────> https://xstream-api.onrender.com
```

API идёт через прокси Netlify, поэтому cookie сессии принадлежит домену фронта
и не считается сторонней (её не режут Safari и браузеры без сторонних cookie).
WebSocket Netlify не проксирует, поэтому сокет ходит на Render напрямую и
cookie туда не попадает. Из-за этого в чате на проде все считаются анонимами:
читать можно, писать нельзя.

## 1. Почта (нужна для регистрации)

Регистрация присылает код на email. Free-план Render блокирует исходящие
порты 25/465/587, поэтому нужен SMTP с альтернативным портом. Например, Brevo:

1. Зарегистрироваться на brevo.com и подтвердить адрес отправителя (Senders).
2. SMTP & API → SMTP: логин (`...@smtp-brevo.com`) и SMTP-ключ.
3. Хост `smtp-relay.brevo.com`, порт `2525` уже прописаны в `render.yaml`.

## 2. Render

1. Закоммитить и запушить бэкенд на GitHub.
2. Dashboard → New → Blueprint → выбрать репозиторий. Render создаст
   `xstream-api`, `xstream-db` (Postgres) и `xstream-redis` (Key Value).
3. Заполнить запрошенные переменные:
   - `ALLOWED_ORIGINS`, `APP_URL`: адрес фронта на Netlify (можно вписать после шага 3);
   - `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM`: из Brevo.
4. При каждом старте выполняются `prisma migrate deploy` и сид категорий.
   Проверка: `https://xstream-api.onrender.com/tags` отдаёт JSON.

Если имя `xstream-api` занято, Render выдаст другой адрес. Тогда его нужно
поменять в `netlify.toml` фронта.

## 3. Netlify

1. Закоммитить и запушить фронт (в нём есть `netlify.toml`).
2. Add new site → Import from Git → репозиторий фронта. Настройки сборки
   берутся из `netlify.toml`.
3. Полученный адрес (`https://<site>.netlify.app`) вписать в Render в
   `ALLOWED_ORIGINS` и `APP_URL` и перезапустить сервис.

## Ограничения бесплатных планов

- Сервис на Render засыпает после 15 минут без запросов. Первый запрос после
  этого идёт около минуты.
- Бесплатный Postgres на Render удаляется через 30 дней. Для долгой жизни
  подключите Neon или Supabase: поменяйте `DATABASE_URL` и `POSTGRES_URL`.
- Key Value на free-плане не сохраняется на диск: после рестарта все разлогинятся.
