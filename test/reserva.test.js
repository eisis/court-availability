// 2026/10/14 の実ページと同じ構造・同じ空き配置でパーサーを検証する
import assert from 'node:assert/strict';
import { parseDay } from '../scrapers/reserva.js';

const hours = Array.from({ length: 17 }, (_, i) => i + 6); // 6〜22時
// 実ページの配置：O=空き(circle) X=満席(cross) _=受付なし(空欄)
const rows = {
  '【レンタルコート（ONEコート）】': 'OXXXXXXXXXXXXXXXX',
  '【レンタルコート（FUNコート）】': 'OXXXXO__OOXXXXXXX',
};
const cell = (ch) =>
  `<td class="availability-list__vacancy"><div class="availability-list__vacancy__inner"><span class="availability-list__vacancy__data">${
    ch === 'O'
      ? `<a href="javascript:void(0)" class="availability-list__vacancy__data_link circle" onclick="bookingRedirect('0','1','1','search_evt_no=x')"></a>`
      : ch === 'X'
        ? `<a href="javascript:void(0)" class="availability-list__vacancy__data_link cross"></a>`
        : ''
  }</span></div></td>`;
const html = `
<table class="availability-list__row-header availability-list__row-header__sticky show"><thead><tr>${hours
  .map((h) => `<th class="availability-list__time"><div class="availability-list__time__hour"><span>${h}</span></div><div class="availability-list__time__minute"><span>00</span></div></th>`)
  .join('')}</tr></thead></table>
<table class="availability-list__column-header"><thead><tr><th></th>${Object.keys(rows)
  .map((n) => `<th><a href="javascript:void(0)"><span>${n}</span></a></th>`)
  .join('')}</tr></thead></table>
<table class="availability-list__data"><tbody>${Object.values(rows)
  .map((p) => `<tr class="availability-list__table__body">${[...p].map(cell).join('')}</tr>`)
  .join('')}</tbody></table>`;

const slots = parseDay(html, '2026-10-14');
assert.equal(slots.length, 5, '空き枠は5件');
assert.deepEqual(slots[0], { court: 'レンタルコート（ONEコート）', date: '2026-10-14', start: '06:00', end: '07:00' });
assert.deepEqual(
  slots.filter((s) => s.court.includes('FUN')).map((s) => s.start),
  ['06:00', '11:00', '14:00', '15:00']
);
console.log('OK reserva', slots.length, '件');
