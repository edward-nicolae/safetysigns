# SafetySigns

Production-ready Next.js 14 App Router starter for a safety signs ordering platform.

## Stack

- Next.js 14 (App Router)
- TypeScript
- TailwindCSS
- React Context for cart state

## Pages

- /
- /catalog
- /cart
- /upload
- /about

## Run locally

1. npm install
2. npm run dev

## Notes

- Catalog data is stored in data/signs.json.
- Runtime data is persisted via DATA_DIR (default: data locally, /data on Fly if set).
- Logo uploads are handled by app/api/upload/route.ts and served from /uploads/*.
- Basic i18n-ready structure is in i18n/ with English defaults.

## Deploy on Fly.io

This project is configured for Fly using Docker + Next.js standalone output.

### 1) Create app (only once)

```bash
fly apps create safetysigns
```

If you already have an app, keep the same name in fly.toml (`app = "safetysigns"`).

### 2) Create persistent volume (only once per region)

```bash
fly volumes create safetysigns_data --region otp --size 1
```

The volume is mounted at `/data` (configured in fly.toml).

### 3) Deploy

```bash
fly deploy
```

### 4) Optional checks

```bash
fly status
fly logs
```

## Fly persistence behavior

- JSON files that are edited from admin/API routes are read/written from DATA_DIR.
- Uploaded files are stored in DATA_DIR/uploads and served through `GET /uploads/[...path]`.
- On first boot, if files are missing in DATA_DIR, they are seeded from the repository `data/` defaults.
