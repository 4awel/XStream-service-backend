#!/usr/bin/env bash
# Полный интерактивный сценарий на РЕАЛЬНОЙ почте, только через curl:
#
#   1. POST /auth/register  — регистрация, на почту уходит 6-значный код
#   2. вы сами вводите код из письма
#   3. POST /auth/verify    — код подтверждён, аккаунт создан, сервер выдал session-cookie (токен)
#   4. GET  /auth/me        — первый заход с токеном
#   5. GET  /auth/me        — повторный заход «с чистого листа»: ТОЛЬКО токен, без email/пароля/кода
#   6. GET  /auth/me        — контроль: без токена и с поддельным токеном → 401
#
# Сервер должен быть запущен (npm run start:dev).
#
#   ./scripts/test-auth-flow.sh                       # спросит email и пароль
#   ./scripts/test-auth-flow.sh me@gmail.com          # спросит только пароль
#   EMAIL=me@gmail.com PASSWORD='Str0ngPass1!' ./scripts/test-auth-flow.sh
#   BASE_URL=http://localhost:3001 ./scripts/test-auth-flow.sh
set -uo pipefail

cd "$(dirname "$0")/.."
BASE_URL="${BASE_URL:-http://localhost:4000}"

env_val() { grep -E "^$1=" .env 2>/dev/null | head -1 | cut -d= -f2-; }
COOKIE_NAME="$(env_val SESSION_NAME)"; COOKIE_NAME="${COOKIE_NAME:-sid}"

TMP="$(mktemp -d)"
JAR="$TMP/cookies.txt"
trap 'rm -rf "$TMP"' EXIT

# --- оформление --------------------------------------------------------------
if [ -t 1 ]; then
  C_G=$'\033[32m'; C_R=$'\033[31m'; C_Y=$'\033[33m'; C_B=$'\033[34m'; C_D=$'\033[2m'; C_BOLD=$'\033[1m'; C_0=$'\033[0m'
else
  C_G=; C_R=; C_Y=; C_B=; C_D=; C_BOLD=; C_0=
fi
PASS=0; FAIL=0

step()  { echo; echo "${C_BOLD}${C_B}━━ ШАГ $1 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${C_0}"; echo "${C_BOLD}$2${C_0}"; }
info()  { echo "   ${C_D}$*${C_0}"; }
warn()  { echo "   ${C_Y}! $*${C_0}"; }
ok()    { PASS=$((PASS+1)); echo "   ${C_G}✔ PASS${C_0}  $1"; }
fail()  { FAIL=$((FAIL+1)); echo "   ${C_R}✘ FAIL${C_0}  $1"; [ -n "${2:-}" ] && echo "          $2"; }
die()   { echo; echo "${C_R}Остановлено:${C_0} $1"; exit 1; }

pretty() { # красивый JSON, если получится
  if command -v jq >/dev/null 2>&1 && jq . "$1" 2>/dev/null; then :;
  elif python3 -m json.tool "$1" 2>/dev/null; then :;
  else cat "$1"; echo; fi
}

# request <METHOD> <path> <json|-> <cookie-mode>
#   cookie-mode:  none | jar (читать и сохранять $JAR) | raw:<sid-cookie-value>
# Результат: STATUS, HEADERS_FILE, BODY_FILE
request() {
  local method="$1" path="$2" body="$3" mode="$4"
  local args=(-s -o "$TMP/body" -D "$TMP/headers" -w '%{http_code}' -X "$method" "$BASE_URL$path")
  local shown="curl -X $method $BASE_URL$path"

  if [ "$body" != "-" ]; then
    args+=(-H 'Content-Type: application/json' -d "$body")
    shown+=" \\
       -H 'Content-Type: application/json' \\
       -d '$(echo "$body" | sed -E 's/("password":")[^"]*/\1********/')'"
  fi
  case "$mode" in
    jar)  args+=(-b "$JAR" -c "$JAR"); shown+=" \\
       -b cookies.txt -c cookies.txt   ${C_D}# cookie-jar: curl сам отправит/сохранит cookie${C_0}" ;;
    raw:*) args+=(-H "Cookie: $COOKIE_NAME=${mode#raw:}"); shown+=" \\
       -H 'Cookie: $COOKIE_NAME=${mode#raw:}'" ;;
    none) shown+="   ${C_D}# без cookie${C_0}" ;;
  esac

  echo "   ${C_BOLD}→ Запрос:${C_0}"
  echo "       $shown"
  STATUS="$(curl "${args[@]}")"
  echo "   ${C_BOLD}← Ответ: HTTP $STATUS${C_0}"
  local set_cookie; set_cookie="$(grep -i '^set-cookie:' "$TMP/headers" | tr -d '\r')"
  if [ -n "$set_cookie" ]; then
    echo "$set_cookie" | sed 's/^/       /'
  else
    info "   (заголовка Set-Cookie в ответе нет)"
  fi
  echo "       body:"
  pretty "$TMP/body" | sed 's/^/         /'
}

expect() { # <ожидаемый статус> <описание>
  if [ "$STATUS" = "$1" ]; then ok "$2 (HTTP $STATUS)"; else fail "$2" "ожидали HTTP $1, получили $STATUS"; fi
}

# извлечь значение session-cookie из cookie-jar (строки HttpOnly начинаются с #HttpOnly_)
jar_cookie() { sed 's/^#HttpOnly_//' "$JAR" 2>/dev/null | awk -v n="$COOKIE_NAME" '$6==n {print $7}' | tail -1; }
json_field() { python3 -c 'import json,sys; print(json.load(open(sys.argv[1])).get(sys.argv[2],""))' "$TMP/body" "$1" 2>/dev/null; }

summary() {
  echo; echo "${C_BOLD}━━ ИТОГ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${C_0}"
  echo "   ${C_G}$PASS passed${C_0}, $( [ "$FAIL" -gt 0 ] && echo "${C_R}$FAIL failed${C_0}" || echo "0 failed")"
  [ "$FAIL" -eq 0 ]
}

# --- ввод данных -------------------------------------------------------------
echo "${C_BOLD}Полный тест авторизации${C_0}  ${C_D}(сервер: $BASE_URL, cookie: $COOKIE_NAME)${C_0}"

EMAIL="${1:-${EMAIL:-}}"
if [ -z "$EMAIL" ]; then read -r -p "Ваша почта (на неё придёт код): " EMAIL; fi
EMAIL="$(echo "$EMAIL" | tr '[:upper:]' '[:lower:]' | xargs)"
[ -n "$EMAIL" ] || die "email не указан"

PASSWORD="${PASSWORD:-}"
if [ -z "$PASSWORD" ]; then
  read -r -s -p "Пароль для аккаунта (8–128 символов, буква + цифра): " PASSWORD; echo
fi
[ -n "$PASSWORD" ] || die "пароль не указан"

# --- preflight ---------------------------------------------------------------
step 0 "Проверяем, что сервер доступен"
if curl -s -o /dev/null --max-time 3 "$BASE_URL/api"; then
  ok "сервер отвечает на $BASE_URL"
else
  die "сервер недоступен на $BASE_URL — запустите npm run start:dev"
fi

# --- 1. регистрация ----------------------------------------------------------
step 1 "Регистрация: сервер отправляет код на $EMAIL"
info "Пароль в запросе виден серверу, но в выводе ниже он замаскирован."
request POST /auth/register "$(printf '{"email":"%s","password":"%s"}' "$EMAIL" "$PASSWORD")" none
case "$STATUS" in
  200) ok "регистрация принята (HTTP 200)"
       info "Ответ одинаков для нового и уже занятого email — так сервер не даёт перебирать чужие почты."
       warn "Если письмо не придёт за минуту: этот email уже зарегистрирован (проверьте «Спам» тоже)." ;;
  429) fail "сработал rate-limit / кулдаун 60с на этот email" "подождите минуту и запустите снова"; summary; exit 1 ;;
  400) fail "сервер отклонил email/пароль (валидация)" "пароль: 8–128 символов, минимум одна буква и одна цифра"; summary; exit 1 ;;
  *)   fail "неожиданный статус регистрации" "HTTP $STATUS"; summary; exit 1 ;;
esac

# --- 2. код из письма --------------------------------------------------------
step 2 "Введите 6-значный код из письма"
CODE=""
for attempt in 1 2 3; do
  read -r -p "   Код из письма (попытка $attempt/3): " CODE
  CODE="$(echo "$CODE" | tr -d '[:space:]')"
  [[ "$CODE" =~ ^[0-9]{6}$ ]] && break
  warn "нужно ровно 6 цифр"; CODE=""
done
[ -n "$CODE" ] || die "код не введён"

# --- 3. подтверждение --------------------------------------------------------
step 3 "Подтверждение кода: создаём аккаунт и получаем токен (session-cookie)"
request POST /auth/verify "$(printf '{"email":"%s","code":"%s"}' "$EMAIL" "$CODE")" jar
expect 200 "код принят, аккаунт создан"

SID="$(jar_cookie)"
if [ -n "$SID" ]; then
  ok "session-cookie '$COOKIE_NAME' выдана и сохранена в cookie-jar"
  info "значение токена: $SID"
else
  fail "cookie '$COOKIE_NAME' не пришла — дальше идти нет смысла"; summary; exit 1
fi
grep -i '^set-cookie:' "$TMP/headers" | grep -qi 'httponly' \
  && ok "cookie помечена HttpOnly (JS в браузере её не прочитает)" || fail "cookie без HttpOnly"
grep -i '^set-cookie:' "$TMP/headers" | grep -qi 'samesite=lax' \
  && ok "cookie помечена SameSite=Lax (защита от CSRF)" || fail "cookie без SameSite=Lax"
info "Содержимое cookie-jar:"; sed 's/^/       /' "$JAR"

# --- 4. первый заход с токеном ----------------------------------------------
step 4 "Первый заход: GET /auth/me с cookie из cookie-jar"
request GET /auth/me - jar
expect 200 "сервер узнал нас по токену"
USER_ID="$(json_field userId)"
if [ -n "$USER_ID" ]; then ok "получен userId: $USER_ID"; else fail "в ответе нет userId"; fi

# --- 5. повторный заход только по токену -------------------------------------
step 5 "Повторный заход БЕЗ входа: новый запрос, в нём только токен"
info "Имитируем «закрыл браузер, открыл снова»: cookie-jar не используем, email/пароль/код не шлём —"
info "передаём только значение токена из шага 3 в заголовке Cookie."
request GET /auth/me - "raw:$SID"
expect 200 "повторный заход по токену работает без логина"
USER_ID2="$(json_field userId)"
if [ -n "$USER_ID" ] && [ "$USER_ID" = "$USER_ID2" ]; then
  ok "тот же пользователь ($USER_ID2) — сессия сохранилась на сервере (Redis)"
else
  fail "userId не совпал" "шаг 4: '$USER_ID', шаг 5: '$USER_ID2'"
fi

# --- 6. негативные проверки --------------------------------------------------
step 6 "Контроль: без токена и с поддельным токеном пускать нельзя"
info "6a. Совсем без cookie:"
request GET /auth/me - none
expect 401 "без токена → доступ закрыт"
info "6b. С подделанным токеном:"
request GET /auth/me - "raw:s%3Afake.forged-signature"
expect 401 "поддельный токен → доступ закрыт"

# --- уборка ------------------------------------------------------------------
echo
read -r -p "Удалить тестовый аккаунт $EMAIL из БД, чтобы можно было повторить тест? [y/N] " ANSWER
if [[ "$ANSWER" =~ ^[yY]$ ]]; then
  DB_URL="$(env_val DATABASE_URL)"
  DB_USER="$(echo "$DB_URL" | sed -E 's#^[a-z]+://([^:]+):.*#\1#')"
  DB_NAME="$(echo "$DB_URL" | sed -E 's#^.*/([^/?]+)(\?.*)?$#\1#')"
  SAFE_EMAIL="${EMAIL//\'/\'\'}"
  if docker exec postgres psql -U "$DB_USER" -d "$DB_NAME" -tAc \
      "DELETE FROM users WHERE email='$SAFE_EMAIL'; DELETE FROM email_verifications WHERE email='$SAFE_EMAIL'" >/dev/null 2>&1; then
    info "аккаунт удалён (сессия в Redis истечёт сама)"
  else
    warn "не удалось удалить через docker exec postgres — удалите вручную"
  fi
fi

summary
