# Reypetch Threads Dashboard

Multi-account Threads bot untuk reypetch-ai.com — mengelola 2 akun (`@iams_ichi` personal + `@rrpetch` official) yang mempromosikan 3 produk (Safar AI, Tomodachi AI, ViaAI).

## Struktur

```
reypetch-threads-dashboard/
├── accounts/
│   ├── iams.config.mjs         ← config akun personal (4 post/hari, voice iams_ichi)
│   └── rrpetch.config.mjs      ← config akun official (10 post/hari, B2B fokus)
├── scripts/
│   ├── lib/                    ← shared: claude.mjs, threads.mjs, config.mjs
│   ├── generate-and-post.mjs   ← --account=iams|rrpetch --slot=<n>
│   ├── catchup-post.mjs        ← smart catchup (per akun)
│   ├── fetch-insights.mjs      ← per akun
│   └── exchange-token.mjs      ← OAuth exchange
├── data/
│   ├── iams/{posted-log,insights}.json
│   └── rrpetch/{posted-log,insights}.json
├── .github/workflows/
│   ├── catchup-iams.yml        ← trigger via cron-job.org
│   ├── catchup-rrpetch.yml
│   └── fetch-insights.yml      ← both accounts, hourly
└── index.html                  ← dashboard dengan account switcher (port 8090)
```

## Cara akses dashboard lokal

```bash
npx --yes http-server -p 8090 -c-1 -o
```

Buka http://localhost:8090 — sidebar ada tombol `iams_ichi` / `rrpetch` untuk switch.

## GitHub Secrets yang dibutuhkan

| Name | Value |
|---|---|
| `ANTHROPIC_API_KEY` | Sama dengan goglobal atau baru |
| `IAMS_THREADS_ACCESS_TOKEN` | Long-lived token untuk @iams_ichi |
| `IAMS_THREADS_USER_ID` | User ID @iams_ichi |
| `RRPETCH_THREADS_ACCESS_TOKEN` | Long-lived token untuk @rrpetch |
| `RRPETCH_THREADS_USER_ID` | User ID @rrpetch |

## Setup langkah

1. Bikin Meta App baru (nama: "Reypetch Threads Bot")
2. Add Threads use case + set redirect URI `https://localhost/`
3. Add @iams_ichi + @rrpetch sebagai Threads Testers
4. OAuth per akun → dapat long-lived token via `scripts/exchange-token.mjs`
5. Set GitHub Secrets
6. Bikin 2 cron job di cron-job.org (trigger `catchup-iams.yml` + `catchup-rrpetch.yml` tiap 15 menit)
