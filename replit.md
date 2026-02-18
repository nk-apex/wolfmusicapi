# WolfApis

## Overview
A multi-provider API hub (branded as WOLFAPIS) that provides unified access to AI chat services, image search, social media downloaders (YouTube, TikTok, Instagram, Facebook), Spotify search/download, and Shazam music recognition. No API keys required - all endpoints work through web scraping and reverse-engineered APIs. Features a minimal dark-themed cyberpunk documentation frontend with interactive playground.

## Architecture
- **Frontend**: React + Vite + TailwindCSS + shadcn/ui components
- **Backend**: Express.js server in `server/`
- **AI Proxy**: `server/ai-routes.ts` - routes that proxy AI chat/image through chateverywhere.app (free, no API keys)
- **Music Scraping**: `lib/scraper.ts` - shared scraping module for YouTube music search via rinodepot.fr, download via y2mate.nu/etacloud.org
- **Social Media Downloaders**: `lib/downloaders/` - TikTok, Instagram, YouTube, Facebook video downloaders
- **Spotify**: `lib/downloaders/spotify.ts` - Spotify search via embed token + download via YouTube matching
- **Shazam**: `lib/downloaders/shazam.ts` - Shazam search + song recognition via reverse-engineered API (shazam-api npm)
- **Data Sources**: chateverywhere.app (AI chat + image), rinodepot.fr (music search), y2mate.nu/etacloud.org (MP3/MP4 download), Spotify embed (search), Shazam API (search + recognition)

## Key Files
- `shared/schema.ts` - All endpoint definitions, categories, and TypeScript types
- `server/ai-routes.ts` - AI proxy endpoints scraping chateverywhere.app (8 chat + 1 image)
- `server/routes.ts` - Express API endpoint definitions (music, social media, Spotify, Shazam + registers AI routes)
- `lib/scraper.ts` - Shared scraping logic (search, check, download info)
- `lib/downloaders/spotify.ts` - Spotify search (via embed token) + download (via YouTube)
- `lib/downloaders/shazam.ts` - Shazam search + song recognition (via shazam-api npm package)
- `lib/downloaders/tiktok.ts` - TikTok video downloader
- `lib/downloaders/instagram.ts` - Instagram media downloader (multiple fallback providers)
- `lib/downloaders/youtube.ts` - YouTube video downloader
- `lib/downloaders/facebook.ts` - Facebook video downloader
- `client/src/pages/home.tsx` - Main UI with category browsing, endpoint docs, and playground
- `client/src/index.css` - Styles
- `client/src/assets/wolf-logo.png` - Wolf logo

## API Categories
### AI Chat (all powered by chateverywhere.app - no API keys needed)
- `POST /api/ai/gpt` - GPT chat
- `POST /api/ai/claude` - Claude-style chat
- `POST /api/ai/mistral` - Mistral-style chat
- `POST /api/ai/gemini` - Gemini-style chat
- `POST /api/ai/deepseek` - DeepSeek-style chat
- `POST /api/ai/venice` - Venice-style chat
- `POST /api/ai/groq` - Groq-style chat
- `POST /api/ai/cohere` - Cohere-style chat

### AI Image (powered by chateverywhere.app Unsplash proxy)
- `POST /api/ai/image/dall-e` - Image search by prompt

### Music & Media (search via rinodepot.fr, download via y2mate.nu - no API keys needed)
- `GET /api/search?q=...` - Search songs
- `GET /download/mp3?url=...` - MP3 download (real MP3, 192kbps)
- `GET /download/mp4?url=...` - MP4 download (360p)
- `GET /download/stream/mp3?q=...` - Stream MP3 directly (best for bots)
- `GET /download/stream/mp4?q=...` - Stream MP4 directly (best for bots)
- Plus more download variants (audio, ytmp3, dlmp3, yta, yta2, yta3)

### Spotify (no API keys needed - uses embed token)
- `GET /api/spotify/search?q=...` - Search tracks on Spotify (returns title, artist, album, art, duration, Spotify URL)
- `GET /api/spotify/download?url=...` or `?q=...` - Download Spotify track as MP3 (via YouTube matching)

### Shazam (no API keys needed - reverse-engineered API)
- `GET /api/shazam/search?q=...` - Search for songs on Shazam
- `POST /api/shazam/recognize` - Identify a song from audio (base64 PCM or audio URL)
- `GET /api/shazam/track/:id` - Get detailed track info by Shazam ID

### Social Media Downloaders
- `GET /api/download/tiktok?url=...` - Download TikTok videos without watermark
- `GET /api/download/instagram?url=...` - Download Instagram media (currently blocked by Instagram)
- `GET /api/download/youtube?url=...` or `?q=...` - Download YouTube videos
- `GET /api/download/facebook?url=...` - Download Facebook videos

## No API Keys Required
All endpoints work through web scraping and reverse-engineered APIs - no API keys or environment secrets needed for any functionality.

## Branding
- Name: WOLFAPIS (WOLF in green #00ff00, APIS in white)
- Subtitle: MULTI-PROVIDER API HUB
- Dark theme with #0a0a0a background, minimal borders, neon green accents
- Wolf logo image as favicon and header icon

## Recent Changes
- 2026-02-18: Added Spotify search + download endpoints (search via embed token, download via YouTube matching)
- 2026-02-18: Added Shazam search + song recognition + track details endpoints (via shazam-api npm package)
- 2026-02-18: Improved Instagram downloader with 5 fallback providers and better error handling
- 2026-02-15: Switched MP3/MP4 downloads from ytdown.to (returned M4A) to y2mate.nu/etacloud.org (returns real MP3 at 192kbps)
- 2026-02-15: Added /download/stream/mp3 and /download/stream/mp4 endpoints for direct bot playback
- 2026-02-15: Simplified YouTube full downloader to return MP3 + MP4 via y2mate
- 2026-02-13: Switched AI endpoints from direct API keys to scraping chateverywhere.app (free, no keys needed)
- 2026-02-13: Major pivot from music-only (WolfMusicApi) to multi-provider API hub (WolfApis)
- 2026-02-13: Added AI chat endpoints for 8 providers + image search endpoint
- 2026-02-13: Redesigned frontend with category filtering, endpoint cards, and unified playground
- 2026-02-12: Initial build with YouTube music endpoints and cyberpunk theme
