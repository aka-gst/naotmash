#!/usr/bin/env sh
# Выкладка «Наотмашь» на aka-gst.ru/naotmash/ (папка на сервере — worm).
#
#   sh tools/deploy.sh            показать, что уедет
#   sh tools/deploy.sh --deploy   и выложить
#
# Игра едет в свой каталог: разметка, картинки, звук. Обвязка сайта
# (game-menu.css, player-name.js, лидерборд) прототипу не нужна.
#
# Раньше сюда ехал ровно один файл, а картинки были вшиты в него строками
# base64: договор был грубым, зато наружу не могло уехать ничего лишнего.
# Теперь картинки едут файлами, и защита держится не на числе файлов, а на
# белом списке ниже: что в нём не перечислено, не уезжает.
set -eu

DEPLOY=no
[ "${1:-}" = "--deploy" ] && DEPLOY=yes
SSH_HOST="${SSH_HOST:-bonita}"
SITE_ROOT="${SITE_ROOT:-/opt/zakriva/caddy/site}"
GAME_PATH="${GAME_PATH:-worm}"          # папка на сервере
# Имя, по которому игру открывают люди. Оно разошлось с папкой: игра долго
# жила по /worm/ от первого концепта про червя, а теперь у неё свой адрес и
# со старого стоит редирект. Проверять надо то имя, которое даём человеку,
# а не то, куда кладём файлы.
PUBLIC_PATH="${PUBLIC_PATH:-naotmash}"

HERE="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$HERE/index.html"
[ -f "$SRC" ] || { echo "ОШИБКА: нет index.html" >&2; exit 1; }

# Белый список, а не чёрный: чёрный пропустит всё, что появится позже.
# Игра по-прежнему открывается и играется одним файлом — звук подгружается
# лениво, уже во время игры, и его отсутствие ничего не ломает.
SHIP="index.html sprites field sfx" 

# Игре по-прежнему запрещено ходить наружу: свои картинки и звук она берёт
# рядом с собой относительными путями, а чужого не грузит вовсе. Проверяем
# именно внешнюю загрузку — по абсолютному адресу или от корня сайта.
# Обычная ссылка <a href="/"> это переход, а не загрузка: кнопка «на главную»
# ничего не ломает. Исключение ровно одно: счётчик сайта, он отложенный.
if grep -E 'src="(https?:)?//|src="/' "$SRC" | grep -qv '/pulse/script.js' \
   || grep -Eq '<link[^>]+href="(https?:)?//' "$SRC"; then
  echo "ОШИБКА: игра начала грузить что-то снаружи" >&2
  exit 1
fi

# Каждая картинка, которую просит разметка, обязана лежать в том, что едет:
# иначе на бою она молча не появится, а мы этого не увидим — так уже было
# со спрайтами без xmlns.
python3 - "$SRC" "$HERE" <<'PY' || exit 1
import pathlib, re, sys
src, here = pathlib.Path(sys.argv[1]).read_text(), pathlib.Path(sys.argv[2])
i = src.index('const SPR_NAMES = [')
names = re.findall(r"'([a-z0-9\-]+)'", src[i:src.index('];', i)])
need = [f'sprites/{n}.svg' for n in names] + [f'field/field-{k}.png' for k in ('yard', 'ice', 'hall', 'ash')]
miss = [f for f in need if not (here / f).exists()]
print(f'  картинок просит {len(need)}, на месте {len(need) - len(miss)}')
if miss:
    print('ОШИБКА: нет файлов: ' + ', '.join(miss[:5]), file=sys.stderr)
    sys.exit(1)
PY

# Разбор адреса проверяется без браузера: битый процент в ссылке однажды
# уронил весь модуль и показал человеку отладочный пульт вместо игры.
node "$HERE/tools/proverka-adresa.mjs" || exit 1

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

# Сеть даёт 2–7% обрывов, и `000` это обрыв, а не 404. Без ретраев проверка
# врёт про выкладку, которая на самом деле прошла: за один вечер дважды.
http_code() {   # имя латиницей: sh кириллицу в именах функций не принимает
  for _ in 1 2 3 4; do
    c=$(curl -sL -o /dev/null -w "%{http_code}" --max-time 20 "$1" || true)   # -L: адрес может переехать
    case "$c" in 000|"") sleep 2 ;; *) echo "$c"; return ;; esac
  done
  echo 000
}

code=$(http_code "https://aka-gst.ru/$PUBLIC_PATH/")
echo "  /$PUBLIC_PATH/  $code"
[ "$code" = 200 ] || { echo "ОШИБКА: страница не отвечает 200" >&2; exit 1; }

# 200 у страницы ничего не говорит про картинки: проверяем, что они правда
# доехали и правда отдаются.
for probe in sprites/hero-body.svg field/field-yard.png; do
  c=$(http_code "https://aka-gst.ru/$PUBLIC_PATH/$probe")
  echo "  $probe  $c"
  [ "$c" = 200 ] || { echo "ОШИБКА: картинка не отдаётся" >&2; exit 1; }
done

# Белый список должен был оставить внутреннее дома. Проверяем это, а не верим.
for hide in README.md TODO.md ФИНИШ.md ИДЕИ.md tools/deploy.sh sprites.json .git/HEAD; do
  c=$(http_code "https://aka-gst.ru/$PUBLIC_PATH/$hide")
  [ "$c" = 404 ] || { echo "ОШИБКА: $hide отдаётся кодом $c, а должен 404" >&2; exit 1; }
done
echo "  внутренние файлы: все 404" 
echo
echo "готово: https://aka-gst.ru/$PUBLIC_PATH/"
