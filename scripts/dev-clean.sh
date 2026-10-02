#!/usr/bin/env sh
# Снимает осиротевшие dev-процессы перед запуском watch-режима.
#
# Закрытый терминал не убивает `nest start --watch`: процесс переезжает под
# launchd и продолжает пересобирать проект. После этого на каждое сохранение
# порт успевает занять старая сборка, а новая падает с EADDRINUSE — и порт
# приходится убивать руками.

pkill -f "$PWD/node_modules/.bin/nest start --watch" 2>/dev/null

port=$(grep -h '^APPLICATION_PORT=' .env 2>/dev/null | tail -1 | cut -d= -f2 | tr -d "\"' \r")
pids=$(lsof -ti "tcp:${port:-4000}" -sTCP:LISTEN 2>/dev/null)
[ -n "$pids" ] && kill -9 $pids 2>/dev/null

exit 0
