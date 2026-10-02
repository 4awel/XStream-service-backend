#!/usr/bin/env bash
# Как с фронта: регистрация -> подтверждение кода -> GET /user/me (пользователь + канал).
# Сервер запущен (npm run start:dev). Код приходит на реальную почту — его вводите вручную.
#
#   ./scripts/create-user-and-get-me.sh me@gmail.com
#   EMAIL=me@gmail.com PASSWORD='Str0ngPass1!' ./scripts/create-user-and-get-me.sh
#   BASE_URL=http://localhost:3001 ./scripts/create-user-and-get-me.sh me@gmail.com
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:4000}"
EMAIL="${1:-${EMAIL:-}}"
[ -n "$EMAIL" ] || read -r -p "Почта (на неё придёт код): " EMAIL
PASSWORD="${PASSWORD:-Str0ngPassw0rd!}"
JAR="$(mktemp)"
trap 'rm -f "$JAR"' EXIT

pretty() { jq . 2>/dev/null || python3 -m json.tool; }

echo "== 1. POST /auth/register ($EMAIL)"
curl -s -X POST "$BASE_URL/auth/register" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" | pretty

echo
read -r -p "== Код из письма (6 цифр): " CODE

echo; echo "== 2. POST /auth/verify"
curl -s -X POST "$BASE_URL/auth/verify" \
  -H 'Content-Type: application/json' \
  -c "$JAR" -b "$JAR" \
  -d "{\"email\":\"$EMAIL\",\"code\":\"$CODE\"}" | pretty

echo; echo "== 3. GET /user/me (пользователь + канал)"
curl -s "$BASE_URL/user/me" -b "$JAR" | pretty
