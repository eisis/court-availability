# court-availability

Tokyo & Kanagawa Pickleball Court Guide 用の空き状況収集。30分ごとに各コートの予約ページを読み、`data/availability.json` を更新します。

## 対応状況

| コート | 予約システム | 状態 |
|---|---|---|
| KPI PARK | LaBOLA | ✅ 対応済み（2週間先まで） |
| Pacific PICKLE CLUB | resv.jp | 未対応 |
| ピックルボールワン銀座新橋 | RESERVA | 未対応 |
| SEIBU FAST SPORTS FIELD 品川 | TableCheck | 未対応 |
| 東京タワー | 要調査 | 未対応 |

## 使い方

```bash
npm ci
npm test         # 保存済みHTMLでパーサーを検証（ネット不要）
npm run scrape   # 実際に取得して data/availability.json を出力
```

## セットアップ（GitHub）

1. このフォルダを新しいGitHubリポジトリ（公開）として push
2. Actions タブで「Scrape court availability」を有効化 → 「Run workflow」で手動テスト
3. サイト側はこのURLのJSONを読む：
   `https://raw.githubusercontent.com/<ユーザー名>/<リポジトリ名>/main/data/availability.json`

サイト本体と別リポジトリにしているのは、30分ごとのコミットでVercelの再デプロイが走らないようにするためです。

## 出力形式

```json
{
  "updatedAt": "2026-10-12T05:00:00.000Z",
  "venues": [
    {
      "id": "kpi-park", "name": "KPI PARK", "area": "横浜", "ok": true,
      "slots": [
        { "court": "ピックルPB1", "date": "2026-10-12", "start": "17:00", "end": "17:30",
          "bookingUrl": "https://yoyaku.labola.jp/r/booking/rental/..." }
      ]
    }
  ]
}
```

## 方針

- 取得するのは「空き枠」だけ。予約者名など他人の情報は読まない
- リクエストは1回あたり数ページ、ページ間に3秒待機
- 予約は必ず公式ページ（`bookingUrl`）へ送る
- `ok: false` のコートはサイト側で「取得できませんでした」と表示し、古いデータを出さない
