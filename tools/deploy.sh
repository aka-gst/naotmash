#!/usr/bin/env sh
# Выкладка «Наотмашь» на aka-gst.ru/worm/.
#
#   sh tools/deploy.sh            показать, что уедет
#   sh tools/deploy.sh --deploy   и выложить
#
# Игра — один самодостаточный файл без
# зависимостей, поэтому едет он один и в свой каталог. Обвязка сайта
# (game-menu.css, player-name.js, лидерборд) прототипу не нужна.
set -eu

DEPLOY=no
[ "${1:-}" = "--deploy" ] && DEPLOY=yes
SSH_HOST="${SSH_HOST:-bonita}"
SITE_ROOT="${SITE_ROOT:-/opt/zakriva/caddy/site}"
GAME_PATH="${GAME_PATH:-worm}"

HERE="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$HERE/index.html"
[ -f "$SRC" ] || { echo "ОШИБКА: нет index.html" >&2; exit 1; }

# Белый список, а не чёрный: чёрный пропустит всё, что появится позже.
# Игра по-прежнему открывается и играется одним файлом — звук подгружается
# лениво, уже во время игры, и его отсутствие ничего не ломает.
SHIP="index.html sfx" 

# Файл обязан быть самодостаточным: он не должен ничего подгружать. Проверяем
# именно загрузку — скрипты, картинки, стили. Обычная ссылка <a href="/"> это
# переход, а не загрузка: кнопка «на главную» ничего не ломает.
# Исключение ровно одно: счётчик сайта. Он отложенный и на игру не влияет —
# не загрузится, игра работает как обычно. Всё остальное по-прежнему нельзя.
if grep -E 'src="(https?:)?//|src="/' "$SRC" | grep -qv '/pulse/script.js' \
   || grep -Eq '<link[^>]+href=' "$SRC"; then
  echo "ОШИБКА: файл начал что-то подгружать — он больше не самодостаточен" >&2
  exit 1
fi

for entry in $SHIP; do
  [ -e "$HERE/$entry" ] || { echo "ОШИБКА: нет $entry" >&2; exit 1; }
done
echo "уедет в $SITE_ROOT/$GAME_PATH: $SHIP"
echo "  index.html $(wc -c < "$SRC" | tr -d ' ') байт, звуков $(ls "$HERE/sfx"/*.wav 2>/dev/null | wc -l | tr -d ' ')"
[ "$DEPLOY" = yes ] || { echo; echo "это была проверка. для выкладки: sh tools/deploy.sh --deploy"; exit 0; }

# Сервер иногда отвечает на SSH дольше 15 секунд, и выкладка срывалась на
# полпути. Ждём дольше и не считаем неудачный mkdir поводом всё бросить.
REMOTE_SHELL="ssh -o BatchMode=yes -o ConnectTimeout=45 -o ServerAliveInterval=10"
$REMOTE_SHELL "$SSH_HOST" "mkdir -p $SITE_ROOT/$GAME_PATH" || true
for entry in $SHIP; do
  rsync -az --delete -e "$REMOTE_SHELL" "$HERE/$entry" "$SSH_HOST:$SITE_ROOT/$GAME_PATH/" || {
    echo "ОШИБКА: не уехало: $entry" >&2; exit 1; }
done

code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 20 "https://aka-gst.ru/$GAME_PATH/" || echo "нет ответа")
echo "  /$GAME_PATH/  $code"
[ "$code" = 200 ] || { echo "ОШИБКА: страница не отвечает 200" >&2; exit 1; }
echo
echo "готово: https://aka-gst.ru/$GAME_PATH/"
