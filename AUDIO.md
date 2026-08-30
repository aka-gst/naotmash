# Наотмашь — задание на звук

Задание самодостаточное. Промты по-английски — так генераторы точнее понимают
жанровые термины; пояснения и правила по-русски. У музыки два вида промта:
**строка стиля** для Suno и **развёрнутое описание** для ElevenLabs Music или
Stable Audio. Брать один из двух.

## Что за игра

Аркада про викинга, который отбивается цепом от наседающей толпы. Играется
**одним пальцем в браузере телефона**: ты ведёшь руку, оружие висит на цепи, и
всё остальное — следствие инерции. Кнопки атаки нет вообще.

Правила, из которых растёт всё:

- **Урон считается по скорости звена в момент касания**, а не по факту
  попадания. Медленное касание безвредно.
- **Уведёшь руку дальше плеча — викинг пойдёт следом.** Одним пальцем и машешь,
  и ходишь.
- **Второй палец подбирает цепь**: оружие твердеет, теряешь треть скорости,
  получаешь управляемость.
- **Точный сильный удар по голове отрывает её** вместе с врагом, и с неё падает
  кусок, который вешается на конец оружия наконечником.
- **Враги — тряпичные куклы из трёх точек.** Удар не отнимает число, а
  физически ломает: по голове — заваливается назад, по ногам — складывается.

Играть: https://aka-gst.ru/worm/

## Главное ограничение: это телефон

Игра живёт в динамике телефона, а не в наушниках, и это меняет требования
сильнее, чем жанр:

- **Низа почти нет.** Всё, что ниже 200 Гц, телефон не воспроизведёт — сочный
  сабвуферный удар там просто исчезнет. Вес удара должен читаться в диапазоне
  400–2000 Гц: не «бум», а «шмяк».
- **Играют без звука чаще, чем со звуком.** Звук обязан быть приятным
  дополнением, но игра не должна на него опираться в правилах.
- **Вес важнее качества.** Мобильный интернет: весь звук вместе не должен
  превышать пары мегабайт.

## Правила выдачи

- **Музыка:** MP3, 96–128 kbps (телефон, экономим вес), 60–90 секунд,
  бесшовная петля по такту, без вокала.
- **Звуки:** WAV 44.1 кГц на генерации, в игру кладём MP3 или OGG. Короткие,
  без хвоста тишины, пик −3 дБ.
- **Никакого низа ниже 200 Гц** — он всё равно не дойдёт, а вес заберёт.
- **Ударам нужно 3–4 варианта:** цеп бьёт по несколько раз в секунду, один
  файл на повторе звучит как пулемёт.
- **Права:** файлы уезжают на публичный сайт.

---

# Музыка

## 1. `music/battle.mp3` — цикл боя

Толпа наседает волнами, игрок машет без остановки. Музыка держит темп и не
лезет вперёд.

Строка стиля для Suno:

```
nordic folk drums, 100 BPM, D minor, frame drum and bone flute, low male
throat drone, driving, no lyrics, loopable, raw, no orchestra
```

Развёрнутое описание:

```
A raw driving Nordic folk instrumental loop for a mobile arcade game about a
viking fighting off a crowd. 100 BPM, D minor. Frame drums and a hand drum
carrying a steady insistent rhythm, a bone flute or simple wooden pipe on top,
and a low wordless throat-singing drone underneath. Raw and hand-played, not
orchestral and not cinematic. No lyrics. Keep the low end above 200 Hz — this
plays through a phone speaker. One constant intensity, no build-up. Seamless
loop, 75 seconds.
```

## 2. `music/menu.mp3`

```
sparse nordic ambient, 70 BPM, D minor, lone bone flute, wind, soft drone,
no lyrics, loopable, cold, waiting
```

## 3. `music/death.mp3` и `music/wave-clear.mp3`

По 2–3 секунды, один раз, без петли.

Смерть:

```
short nordic defeat sting, 3 seconds, a single struck frame drum and a low
throat drone falling away into wind. Bleak, not tragic. No lyrics.
```

Волна отбита:

```
short nordic victory sting, 2 seconds, two struck drums and a rising bone
flute figure resolving upward. Earned and brief. No lyrics.
```

---

# Звуки

Сейчас в игре один `AudioContext` и минимум синтеза. Ниже — словарь целиком.

## Цеп

Главная связка игры: свист набранной скорости и удар. Между ними игрок
считывает, будет ли урон, — потому что урон здесь идёт от скорости, а не от
попадания.

`sfx/whoosh-slow.wav`

```
Heavy chain weapon swinging slowly through air, 0.3 seconds. A low soft
whoosh with a faint chain rattle. Must clearly read as not enough speed to
hurt anyone. Nothing below 200 Hz. Mono.
```

`sfx/whoosh-fast.wav`

```
Heavy chain weapon swinging at full speed, 0.25 seconds. A sharp aggressive
whoosh with a bright chain rattle and a Doppler-like pitch drop as it passes.
It must be obvious within the first 50 milliseconds that this swing is
dangerous. Nothing below 200 Hz. Mono.
```

`sfx/chain-rattle.wav` — 3–4 варианта, звучат постоянно, пока цеп болтается.

```
Loose iron chain links rattling, 0.2 seconds. Dry metallic clinking, quiet
and irregular. Nothing below 200 Hz. Mono.
```

`sfx/chain-stiffen.wav` — второй палец подобрал цепь, оружие затвердело.

```
Chain snapping taut and going rigid, 0.2 seconds. A quick zip of links pulling
together ending in a hard stop. Mechanical and satisfying. Mono.
```

## Попадания — по 3–4 варианта каждое

`sfx/hit-body-1..4.wav`

```
Blunt weapon striking a body, 0.2 seconds. A thick flat slap with a short
muffled thud — weight without deep bass, since this plays on a phone speaker.
Nothing below 200 Hz. Impact at the first millisecond, no fade-in. Mono.
```

`sfx/hit-head-1..3.wav`

```
Blunt weapon striking a head, 0.25 seconds. A harder wetter crack than a body
hit, with a short bone crunch. Nothing below 200 Hz. Impact at the first
millisecond. Mono.
```

`sfx/hit-weak.wav` — касание ниже порога скорости, урона нет.

```
Weak harmless bump of a weapon against a body, 0.12 seconds. A dull soft tap
with no crack and no crunch. Must sound unmistakably like nothing happened.
Mono.
```

## Отрыв головы — награда игры

Точный сильный удар отрывает голову вместе с врагом, и с неё падает кусок.
Это лучшее, что может случиться, и звук должен быть заметно длиннее любого
другого.

`sfx/tear-head.wav`

```
Head torn off a body by a heavy blow, 0.6 seconds. A hard wet crack, then a
tearing of tissue, ending in a wet spatter. Brutal and cartoon-adjacent rather
than realistic gore — the game is stylised. Nothing below 200 Hz. Mono.
```

`sfx/pickup-tip.wav` — кусок повесился на конец оружия наконечником.

```
Grim trophy attaching to a weapon, 0.3 seconds. A wet slap followed by a
short metallic chain clink and a low tone confirming the upgrade. Rewarding.
Mono.
```

## Враги

`sfx/enemy-fall-1..3.wav`

```
Ragdoll body collapsing onto ground, 0.4 seconds. A soft dull thud with cloth
and a faint bounce. Nothing below 200 Hz. Mono.
```

`sfx/enemy-grunt-1..4.wav`

```
Short male grunt of pain, 0.25 seconds. Breathy, involuntary, no words, no
scream. Dry and close. Mono.
```

`sfx/enemy-charge.wav`

```
Distant crowd of men shouting and charging, 1.5 seconds, seamless loop. A
low wordless roar, no individual voices distinguishable. Quiet enough to sit
under the music. Mono.
```

## Мир и интерфейс

`sfx/rock-throw.wav`

```
Rock thrown through air, 0.3 seconds. A tumbling whoosh with a faint whistle.
Mono.
```

`sfx/rock-hit.wav`

```
Rock striking a body, 0.2 seconds. A hard dry knock with a short dull thud.
Nothing below 200 Hz. Mono.
```

`sfx/step-1..4.wav`

```
Single heavy boot step on dirt, 0.1 seconds. Dry, soft, quiet. Mono.
```

`sfx/ui.wav`

```
UI tick, 0.05 seconds. A single soft wooden click. Very quiet. Mono.
```

---

# Что делать с готовыми файлами

1. Музыку положить в `music/`, звуки — в `sfx/`.
2. Звукового движка в игре по сути нет — его нужно написать: загрузка буферов,
   общая шина, кнопка «без звука» и **выбор случайного варианта из комплекта**
   (`hit-body-1..4` и остальные). Последнее обязательно: без него комплекты
   бессмысленны. Образец загрузчика — `~/dev/odin-udar/src/audio.js`.
3. Начинать стоит с трёх файлов: `whoosh-fast`, `hit-body`, `tear-head`. Они
   озвучивают ровно то правило, ради которого игра сделана, — что урон берётся
   из скорости.
4. Проверять обязательно на телефоне, а не в наушниках: половина решений в этом
   задании принята из-за динамика телефона.
