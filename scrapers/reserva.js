// RESERVA（reserva.be）の空き状況ページから空き枠を取り出す
// 空き＝circle、満席＝cross、空欄＝受付なし。予約者の情報は含まれない。
import * as cheerio from 'cheerio';

const BASE = 'https://reserva.be';

/** 1日分の空き状況HTMLから空き枠を抽出（純粋関数・テスト用に分離） */
export function parseDay(html, date) {
  const $ = cheerio.load(html);
  // 列見出し（6, 7, 8 ...）→ 各列の開始時刻
  const hours = $('table.availability-list__row-header__sticky th')
    .map((_, th) => +$(th).find('.availability-list__time__hour').text().trim())
    .get();
  // 行見出し（コート名）
  const courts = $('table.availability-list__column-header th')
    .slice(1)
    .map((_, th) => $(th).text().trim().replace(/^【|】$/g, ''))
    .get();
  const pad = (n) => String(n).padStart(2, '0');
  const slots = [];
  $('table.availability-list__data tr').each((r, tr) => {
    $(tr).find('td').each((c, td) => {
      if (!$(td).find('a.circle').length) return;
      const h = hours[c];
      if (h === undefined || !courts[r]) return;
      slots.push({ court: courts[r], date, start: `${pad(h)}:00`, end: `${pad(h + 1)}:00` });
    });
  });
  return slots;
}

/**
 * 今日から days 日分を取得
 * 例: fetchReserva({ shop: 'pboneginza', menuIds: ['110499', '110500'], days: 14 })
 */
export async function fetchReserva({ shop, menuIds, days = 14, delayMs = 2000 }) {
  const all = [];
  const today = new Date(Date.now() + 9 * 3600 * 1000); // JST基準
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() + i);
    const ymd = d.toISOString().slice(0, 10);
    const body = new URLSearchParams({
      bus_front_availability_date: ymd.replaceAll('-', ''),
      bus_front_availability_time_from: '6',
      bus_front_availability_time_to: '23',
    });
    menuIds.forEach((id) => body.append('menu_search[]', id));
    const res = await fetch(`${BASE}/${shop}/availability`, {
      method: 'POST',
      body,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'tokyo-pickleball-guide availability bot (+https://tokyo-pickleball-guide.vercel.app/)',
      },
    });
    if (!res.ok) throw new Error(`RESERVA ${res.status} ${ymd}`);
    const slots = parseDay(await res.text(), ymd).map((s) => ({ ...s, bookingUrl: `${BASE}/${shop}` }));
    all.push(...slots);
    if (i < days - 1) await new Promise((r) => setTimeout(r, delayMs)); // 相手サーバーに配慮
  }
  return all;
}
