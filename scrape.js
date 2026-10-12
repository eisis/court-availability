// 全コートの空き枠を集めて data/availability.json に書き出す
// 新しい予約システムに対応したら sources に1行足すだけで増やせる構成
import { writeFile, mkdir } from 'node:fs/promises';
import { fetchLabola, splitTo30min } from './scrapers/labola.js';

const sources = [
  {
    id: 'kpi-park',
    name: 'KPI PARK',
    area: '横浜',
    fetch: () =>
      fetchLabola({
        shopId: 3302,
        tabName: 'ピックルボールコート',
        weeks: 2,
        excludeCourts: ['レンタル'], // 「パドル＋ボールレンタル」はコートではないので除外
      }),
  },
  // TODO: Pacific PICKLE CLUB（resv.jp）、ピックルボールワン（RESERVA）、SEIBU（TableCheck）、東京タワー
];

const result = { updatedAt: new Date().toISOString(), venues: [] };

for (const s of sources) {
  try {
    const slots = splitTo30min(await s.fetch());
    result.venues.push({ id: s.id, name: s.name, area: s.area, ok: true, slots });
    console.log(`✓ ${s.name}: ${slots.length} 枠（30分単位）`);
  } catch (e) {
    // 1か所が失敗しても他は出す。サイト側は ok:false なら「取得できませんでした」と表示
    result.venues.push({ id: s.id, name: s.name, area: s.area, ok: false, error: String(e.message), slots: [] });
    console.error(`✗ ${s.name}: ${e.message}`);
  }
}

await mkdir('data', { recursive: true });
await writeFile('data/availability.json', JSON.stringify(result, null, 2));
