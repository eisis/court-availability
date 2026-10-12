import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { parseWeek, splitTo30min } from '../scrapers/labola.js';

const html = readFileSync(new URL('./fixture-labola.html', import.meta.url), 'utf8');
const slots = parseWeek(html, { excludeCourts: ['レンタル'] });

assert.equal(slots.length, 5, '空き枠は5件');
assert.ok(slots.every((s) => s.court.startsWith('ピックルPB')), 'レンタル行は除外');
assert.deepEqual(
  { court: slots[0].court, date: slots[0].date, start: slots[0].start, end: slots[0].end },
  { court: 'ピックルPB1', date: '2026-10-12', start: '17:00', end: '18:00' }
);
assert.equal(slots.at(-1).date, '2026-10-13');
const half = splitTo30min(slots);
assert.equal(half.length, 10);
assert.equal(half[1].start, '17:30');
console.log('OK', JSON.stringify(half.slice(0, 2), null, 1));
