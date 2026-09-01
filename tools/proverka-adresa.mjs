/**
 * Проверка разбора адреса — без браузера.
 *
 * Разбор живёт внутри index.html, и позвать его из теста напрямую нельзя:
 * файл трогает документ, которого в узле нет. Поэтому вытаскиваем ровно одну
 * функцию текстом и гоняем её здесь. Это закрывает целый класс: ошибка в
 * разборе адреса иначе переживает любые зелёные наборы, потому что запустить
 * её негде.
 *
 * Повод: `?%zz` роняло decodeURIComponent, модуль обрывался целиком, и
 * человек вместо выбора оружия видел отладочный пульт.
 *
 *   node tools/proverka-adresa.mjs
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'index.html'), 'utf8');

const from = src.indexOf('function readAddress(raw) {');
if (from < 0) { console.error('ОШИБКА: в index.html нет функции readAddress'); process.exit(1); }
const to = src.indexOf('\n}', from) + 2;
const readAddress = new Function(src.slice(from, to) + '\nreturn readAddress;')();

const пусто = (v) => Number.isNaN(v) || v === undefined;
const случаи = [
    // адрес,            тихо,  кадр,  петля
    ['',                 false, false, пусто],
    ['?a=1',             false, false, пусто],
    ['?%zz',             false, false, пусто],   // битый процент: не падать
    ['?%',               false, false, пусто],
    ['?%D1%82%D0%B8%D1%85%D0%BE', true, false, пусто],   // «тихо» в процентах
    ['?тихо',            true,  false, пусто],
    ['?quiet=1',         true,  false, пусто],
    ['?w=quietly',       false, false, пусто],   // не подстрока, а параметр
    ['?кадр',            true,  true,  3],
    ['?loop=1',          true,  false, 1],
    ['?петля=2',         true,  false, 2],
    ['?flow=8',          true,  false, пусто],
    ['?flow=8&страж',    true,  false, пусто],
];

let плохо = 0;
for (const [адрес, тихо, кадр, петля] of случаи) {
    let r;
    try { r = readAddress(адрес); }
    catch (e) { console.error(`УПАЛО на "${адрес}": ${e.message}`); плохо++; continue; }
    const ждём = typeof петля === 'function' ? петля(r.loop) : r.loop === петля;
    if (r.quiet !== тихо || r.still !== кадр || !ждём) {
        console.error(`НЕ СОШЛОСЬ "${адрес}": тихо=${r.quiet} кадр=${r.still} петля=${r.loop}`);
        плохо++;
    }
}

// Бот-страж включается только своим параметром и ничем ещё.
for (const [адрес, ждём] of [['?flow=8&страж', true], ['?flow=8&guard', true],
    ['?flow=8', false], ['?w=guardian', false]]) {
    if (readAddress(адрес).guard !== ждём) {
        console.error(`СТРАЖ НЕ СОШЁЛСЯ "${адрес}": ${readAddress(адрес).guard}`);
        плохо++;
    }
}

// Пульт обязан быть скрыт разметкой, а не скриптом: если скрипт упадёт,
// наши внутренности не должны оказаться на экране вместо игры.
if (!/<div id="panel" class="off">/.test(src)) {
    console.error('ОШИБКА: отладочный пульт не скрыт разметкой');
    плохо++;
}

console.log(плохо ? `провалено ${плохо} из ${случаи.length + 1}` : `разбор адреса: ${случаи.length + 1} проверок, все прошли`);
process.exit(плохо ? 1 : 0);
