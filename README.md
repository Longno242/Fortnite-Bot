# Fortnite Modern Stats Dashboard

Modern React + TypeScript application powered by [Fortnite-API](https://dash.fortnite-api.com/).

## What is included

- Player stats lookup
- Creator code search
- AES endpoint overview
- Cosmetics endpoint overview
- News endpoint overview
- Item shop endpoint overview
- Playlists endpoint overview
- Map endpoint overview
- Banners endpoint overview

## Setup

1. Install dependencies:
   - `npm install`
2. Set backend proxy URL:
   - Copy `.env.example` to `.env.local`
   - Set `VITE_BACKEND_BASE_URL=https://your-worker-name.your-subdomain.workers.dev`
3. Start development server:
   - `npm run dev`

## Secure API Key (recommended)

Do not place the Fortnite API key in the frontend. This project is configured to use a Cloudflare Worker proxy in `proxy-worker/` so the key stays secret.

### Deploy proxy

1. Install Wrangler:
   - `npm install -g wrangler`
2. Login:
   - `wrangler login`
3. Go to worker folder:
   - `cd proxy-worker`
4. Add secret API key:
   - `wrangler secret put FORTNITE_API_KEY`
5. Deploy:
   - `wrangler deploy`
6. Copy your Worker URL and place it in frontend `.env.local` as `VITE_BACKEND_BASE_URL`.

## Build

- `npm run build`
- `npm run preview`
