# WolfMusicApi

## Overview
A media download API service (branded as WolfMusicApi) that scrapes rinodepot.fr to provide YouTube search, MP3, and MP4 download endpoints. Features a cyberpunk neon-themed API documentation frontend with playground. Supports both Express.js (local/Replit) and Vercel serverless deployment.

## Architecture
- **Frontend**: React + Vite + TailwindCSS + shadcn/ui components
- **Backend (Express)**: Express.js server in `server/` for local development
- **Backend (Vercel)**: Serverless functions in `api/` for Vercel deployment
- **Shared Logic**: `lib/scraper.ts` - shared scraping module used by both backends
- **Data Source**: rinodepot.fr (MP3Juice clone) - uses /search and /check endpoints

## Key Files
- `lib/scraper.ts` - Shared scraping logic (search, check, download info) - no Express dependency
- `server/scraper.ts` - Re-exports from lib/scraper.ts for Express compatibility
- `server/routes.ts` - Express API endpoint definitions
- `api/search.ts` - Vercel serverless: search endpoint
- `api/download/*.ts` - Vercel serverless: download endpoints (audio, ytmp3, dlmp3, mp3, yta, yta2, yta3, mp4)
- `vercel.json` - Vercel routing and build configuration
- `client/src/pages/home.tsx` - Main UI with search, endpoint docs, and playground
- `shared/schema.ts` - TypeScript types and endpoint metadata

## API Endpoints
- `GET /api/search?q=...` - Search songs
- `GET /download/audio?url=...` - MP3 download
- `GET /download/ytmp3?url=...` - MP3 download
- `GET /download/dlmp3?url=...` - MP3 download
- `GET /download/mp3?url=...` - MP3 download
- `GET /download/yta?url=...` - MP3 download
- `GET /download/yta2?url=...` - MP3 download
- `GET /download/yta3?url=...` - MP3 download
- `GET /download/mp4?url=...` - MP4 download

## Vercel Deployment
The project is structured for Vercel serverless deployment:
- `api/` directory contains serverless functions (auto-mapped to /api/* routes)
- `vercel.json` rewrites /download/* to /api/download/* for the correct endpoint paths
- CORS headers are configured for cross-origin access
- Frontend is served as static files from client build output

## Recent Changes
- 2026-02-12: Refactored for Vercel serverless compatibility (added api/ directory, shared lib/scraper.ts, vercel.json)
- 2026-02-12: Initial build with full API endpoints, scraper, and frontend
