// LaBOLA（yoyaku.labola.jp）の週カレンダーから空き枠を取り出す
// 予約者名などの個人情報は取得しない。空き（td.slot.empty）だけを読む。
import * as cheerio from 'cheerio';

const BASE = 'https://yoyaku.labola.jp';

/** 週カレンダーHTMLから空き枠を抽出（純粋関数・テスト用に分離） */
export function parseWeek(html, { excludeCourts = [] } = {}) {
  const $ = cheerio.load(html);
  const slots = [];
  $('#calendar_width tr.spaces').each((_, tr) => {
    const court = $(tr).find('td.court').text().trim();
    if (!court || excludeCourts.some((x) => court.includes(x))) return;
    $(tr).find('td.slot.empty[data-link]').each((_, td) => {
      const link = $(td).attr('data-link');
      const m = link.match(/facility\/(\d+)\/(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})-(\d{2})(\d{2})/);
      if (!m) return;
      const [, facilityId, y, mo, d, sh, sm, eh, em] = m;
      slots.push({
        court,
        facilityId,
        date: `${y}-${mo}-${d}`,
        start: `${sh}:${sm}`,
        end: `${eh}:${em}`,
        bookingUrl: link,
      });
    });
  });
  return slots;
}

/** 1時間枠などを30分単位に分割（サイト側の表示単位をそろえる用） */
export function splitTo30min(slots) {
  const toMin = (t) => +t.slice(0, 2) * 60 + +t.slice(3);
  const toStr = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  return slots.flatMap((s) => {
    const out = [];
    for (let m = toMin(s.start); m < toMin(s.end); m += 30) {
      out.push({ ...s, start: toStr(m), end: toStr(Math.min(m + 30, toMin(s.end))) });
    }
    return out;
  });
}

function mondayOf(date) {
  const d = new Date(date);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

/**
 * shopId の指定タブを、今日から weeks 週分取得
 * 例: fetchLabola({ shopId: 3302, tabName: 'ピックルボールコート', weeks: 2 })
 */
export async function fetchLabola({ shopId, tabName, weeks = 2, excludeCourts = [], delayMs = 3000 }) {
  const all = [];
  const start = mondayOf(new Date(Date.now() + 9 * 3600 * 1000)); // JST基準
  for (let w = 0; w < weeks; w++) {
    const d = new Date(start);
    d.setDate(d.getDate() + 7 * w);
    const url = `${BASE}/r/shop/${shopId}/calendar_week/${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}/?tab_name=${encodeURIComponent(tabName)}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'tokyo-pickleball-guide availability bot (+https://tokyo-pickleball-guide.vercel.app/)' },
    });
    if (!res.ok) throw new Error(`LaBOLA ${res.status} ${url}`);
    all.push(...parseWeek(await res.text(), { excludeCourts }));
    if (w < weeks - 1) await new Promise((r) => setTimeout(r, delayMs)); // 相手サーバーに配慮
  }
  return all;
}
