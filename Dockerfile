# syntax=docker/dockerfile:1

# ---------- build ----------
FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
# На этапе generate Prisma не подключается к базе, но переменная должна существовать.
# Заданы обе: в репозитории два конфига (prisma.config.ts ждёт DATABASE_URL,
# дубль prisma7.config.ts — POSTGRES_URL), и Prisma подхватывает второй.
# Дубль стоит удалить, тогда хватит одной переменной.
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build
ENV POSTGRES_URL=postgresql://build:build@localhost:5432/build
RUN npm run db:generate && npm run build

# ---------- runtime ----------
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Сгенерированный Prisma-клиент лежит в prisma/generated — без него приложение не стартует.
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/dist ./dist

USER node
EXPOSE 4000
CMD ["node", "dist/main"]
