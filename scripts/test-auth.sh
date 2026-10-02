#!/usr/bin/env bash
# Smoke/security-тест регистрации. Сервер должен быть запущен (npm run start:dev),
# NODE_ENV=development (код из «письма» берётся из Redis), докер-контейнеры postgres/redis подняты.
#
#   ./scripts/test-auth.sh                # BASE_URL=http://localhost:4000
#   BASE_URL=http://localhost:3001 ./scripts/test-auth.sh
set -uo pipefail

cd "$(dirname "$0")/.."
BASE_URL="${BASE_URL:-http://localhost:4000}"

env_val() { grep -E "^$1=" .env | head -1 | cut -d= -f2-; }
REDIS_URL="$(env_val REDIS_URL)"
DB_URL="$(env_val DATABASE_URL)"
DB_USER="$(echo "$DB_URL" | sed -E 's#^[a-z]+://([^:]+):.*#\1#')"
DB_NAME="$(echo "$DB_URL" | sed -E 's#^.*/([^/?]+)(\?.*)?$#\1#')"

# ходим в тот же Redis, что и приложение (REDIS_URL), а не в «какой-то» контейнер:
# на 6379 может висеть ещё и локальный redis-server, перекрывающий docker
redis() { redis-cli -u "$REDIS_URL" --no-auth-warning "$@"; }
psql_() { docker exec postgres psql -U "$DB_USER" -d "$DB_NAME" -tAc "$1"; }

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"; cleanup' EXIT

PASS=0; FAIL=0
green() { printf '\033[32m%s\033[0m' "$1"; }
red()   { printf '\033[31m%s\033[0m' "$1"; }

ok()   { PASS=$((PASS+1)); echo "  $(green PASS)  $1"; }
fail() { FAIL=$((FAIL+1)); echo "  $(red FAIL)  $1"; [ -n "${2:-}" ] && echo "        $2"; }

# post <path> <json> [cookie-jar] -> STATUS, BODY, HEADERS
post() {
  local jar="${3:-$TMP/jar}"
  STATUS=$(curl -s -o "$TMP/body" -D "$TMP/headers" -w '%{http_code}' \
    -X POST "$BASE_URL$1" -H 'Content-Type: application/json' \
    -c "$jar" -b "$jar" -d "$2")
  BODY="$(cat "$TMP/body")"
  HEADERS="$(cat "$TMP/headers")"
}

expect_status() { # <name> <expected>
  if [ "$STATUS" = "$2" ]; then ok "$1 (HTTP $STATUS)"; else fail "$1" "ожидали HTTP $2, получили $STATUS, body: $BODY"; fi
}

reset_limits() {
  redis --scan --pattern 'rl:*' | while read -r key; do redis del "$key" >/dev/null; done
  return 0
}

cleanup() {
  reset_limits
  psql_ "DELETE FROM users WHERE email LIKE 'authtest\_%@example.com'" >/dev/null 2>&1
  psql_ "DELETE FROM email_verifications WHERE email LIKE 'authtest\_%@example.com'" >/dev/null 2>&1
  echo
  echo "Итого: $(green "$PASS passed"), $( [ "$FAIL" -gt 0 ] && red "$FAIL failed" || echo "0 failed")"
  [ "$FAIL" -eq 0 ]
}

# --- preflight ---------------------------------------------------------------
echo "Preflight"
curl -s -o /dev/null --max-time 3 "$BASE_URL/api" || { echo "$(red 'Сервер недоступен') на $BASE_URL — запустите npm run start:dev"; exit 2; }
command -v redis-cli >/dev/null || { echo "$(red 'нужен redis-cli') (brew install redis)"; exit 2; }
redis ping | grep -q PONG || { echo "$(red 'Redis недоступен')"; exit 2; }
psql_ "SELECT 1" >/dev/null || { echo "$(red 'Postgres недоступен')"; exit 2; }
echo "  $(green OK) сервер, redis и postgres отвечают"
reset_limits

RUN="$(date +%s)$RANDOM"
EMAIL="authtest_${RUN}@example.com"
EMAIL2="authtest_${RUN}b@example.com"
PASSWORD='Str0ngPassw0rd!'

# --- валидация ---------------------------------------------------------------
echo; echo "Валидация входных данных"
post /auth/register '{"email":"not-an-email","password":"Str0ngPassw0rd!"}'
expect_status "невалидный email отклонён" 400
post /auth/register "{\"email\":\"$EMAIL\",\"password\":\"short1\"}"
expect_status "короткий пароль отклонён" 400
post /auth/register "{\"email\":\"$EMAIL\",\"password\":\"onlyletterspassword\"}"
expect_status "пароль без цифры отклонён" 400
post /auth/register "{\"email\":\"$EMAIL\",\"password\":\"$(printf 'a1%.0s' $(seq 1 100))\"}"
expect_status "пароль > 128 символов отклонён (защита от DoS)" 400
post /auth/register "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"isAdmin\":true}"
expect_status "лишнее поле (isAdmin) отклонено" 400
post /auth/verify "{\"email\":\"$EMAIL\",\"code\":\"12ab56\"}"
expect_status "нецифровой код отклонён" 400

# --- регистрация -------------------------------------------------------------
echo; echo "Регистрация"
post /auth/register "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}"
expect_status "регистрация нового email" 200
REG_BODY="$BODY"

CODE="$(redis get "dev:mail:code:$EMAIL")"
if [[ "$CODE" =~ ^[0-9]{6}$ ]]; then ok "код из «письма» — 6 цифр"; else fail "код не найден в Redis" "получили: '$CODE'"; fi

ROW="$(psql_ "SELECT code_hash, hash_password FROM email_verifications WHERE email='$EMAIL'")"
if [ -n "$ROW" ] && ! echo "$ROW" | grep -q "$CODE" && echo "$ROW" | grep -q 'scrypt\$'; then
  ok "в БД код захэширован, пароль — scrypt (не plaintext)"
else fail "код/пароль хранятся небезопасно" "$ROW"; fi

post /auth/register "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}"
expect_status "повторная регистрация за <60с → кулдаун" 429

# --- подтверждение -----------------------------------------------------------
echo; echo "Подтверждение кода"
WRONG=$([ "$CODE" = "000000" ] && echo 111111 || echo 000000)
post /auth/verify "{\"email\":\"$EMAIL\",\"code\":\"$WRONG\"}"
expect_status "неверный код отклонён" 400

post /auth/verify "{\"email\":\"$EMAIL\",\"code\":\"$CODE\"}"
expect_status "верный код → аккаунт создан" 200
if echo "$HEADERS" | grep -qi '^set-cookie: sid='; then ok "выдана session-cookie"; else fail "нет Set-Cookie sid" "$HEADERS"; fi
if echo "$HEADERS" | grep -i '^set-cookie: sid=' | grep -qi 'httponly'; then ok "cookie HttpOnly"; else fail "cookie без HttpOnly"; fi
if echo "$HEADERS" | grep -i '^set-cookie: sid=' | grep -qi 'samesite=lax'; then ok "cookie SameSite=Lax"; else fail "cookie без SameSite"; fi

USER_PW="$(psql_ "SELECT password FROM users WHERE email='$EMAIL'")"
if [[ "$USER_PW" == scrypt\$* ]] && [[ "$USER_PW" != *"$PASSWORD"* ]]; then ok "пароль пользователя в БД захэширован"; else fail "пароль в users не захэширован" "$USER_PW"; fi

post /auth/verify "{\"email\":\"$EMAIL\",\"code\":\"$CODE\"}"
expect_status "повторное использование кода отклонено" 400

# --- защита от перебора email ------------------------------------------------
echo; echo "Защита от перечисления аккаунтов"
redis del "rl:register:email:$EMAIL" "dev:mail:code:$EMAIL" >/dev/null
post /auth/register "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}"
EXISTING_STATUS="$STATUS"; EXISTING_BODY="$BODY"
if [ "$EXISTING_STATUS" = "200" ] && [ "$EXISTING_BODY" = "$REG_BODY" ]; then ok "ответ для занятого email идентичен ответу для нового"; else fail "занятый email отличим по ответу" "$EXISTING_STATUS $EXISTING_BODY"; fi
if [ -z "$(redis get "dev:mail:code:$EMAIL")" ]; then ok "для существующего аккаунта письмо не отправлено"; else fail "письмо ушло на существующий аккаунт"; fi

# --- перебор кода ------------------------------------------------------------
echo; echo "Брутфорс кода"
post /auth/register "{\"email\":\"$EMAIL2\",\"password\":\"$PASSWORD\"}"
CODE2="$(redis get "dev:mail:code:$EMAIL2")"
WRONG2=$([ "$CODE2" = "000000" ] && echo 111111 || echo 000000)
for _ in 1 2 3 4 5; do post /auth/verify "{\"email\":\"$EMAIL2\",\"code\":\"$WRONG2\"}"; done
post /auth/verify "{\"email\":\"$EMAIL2\",\"code\":\"$CODE2\"}"
expect_status "после 5 неверных попыток даже верный код не принимается" 400

# --- rate limit по IP --------------------------------------------------------
echo; echo "Rate limit по IP"
reset_limits
LAST=""
for i in $(seq 1 11); do
  post /auth/register "{\"email\":\"authtest_${RUN}_rl$i@example.com\",\"password\":\"$PASSWORD\"}"
  LAST="$STATUS"
done
if [ "$LAST" = "429" ]; then ok "11-й запрос с одного IP → 429"; else fail "лимит по IP не сработал" "последний статус: $LAST"; fi
if echo "$HEADERS$BODY" | grep -qi 'retryAfter'; then ok "в 429 указан retryAfter"; else fail "нет retryAfter в 429"; fi
