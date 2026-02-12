# MediaDL API

## Overview
A media download API service that scrapes rinodepot.fr to provide YouTube search, MP3, and MP4 download endpoints. Features a beautiful API documentation frontend with playground.

## Architecture
- **Frontend**: React + Vite + TailwindCSS + shadcn/ui components
- **Backend**: Express.js with scraping endpoints
- **Data Source**: rinodepot.fr (MP3Juice clone) - uses /search and /check endpoints

## Key Files
- `server/scraper.ts` - Core scraping logic (search, check, download info)
- `server/routes.ts` - All API endpoint definitions
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

## Recent Changes
- 2026-02-12: Initial build with full API endpoints, scraper, and frontend
