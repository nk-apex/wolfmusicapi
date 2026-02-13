# WolfApis

## Overview
A multi-provider API hub (branded as WOLFAPIS) that provides unified access to AI chat services and image search (scraped from chateverywhere.app) plus YouTube music download endpoints (scraped from rinodepot.fr). No API keys required - all endpoints work through web scraping. Features a minimal dark-themed cyberpunk documentation frontend with interactive playground.

## Architecture
- **Frontend**: React + Vite + TailwindCSS + shadcn/ui components
- **Backend**: Express.js server in `server/`
- **AI Proxy**: `server/ai-routes.ts` - routes that proxy AI chat/image through chateverywhere.app (free, no API keys)
- **Music Scraping**: `lib/scraper.ts` - shared scraping module for YouTube music search/download via rinodepot.fr
- **Data Sources**: chateverywhere.app (AI chat + image), rinodepot.fr (music search/download)

## Key Files
- `shared/schema.ts` - All endpoint definitions, categories, and TypeScript types
- `server/ai-routes.ts` - AI proxy endpoints scraping chateverywhere.app (8 chat + 1 image)
- `server/routes.ts` - Express API endpoint definitions (music + registers AI routes)
- `lib/scraper.ts` - Shared scraping logic (search, check, download info)
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

### Music & Media (scraped from rinodepot.fr - no API keys needed)
- `GET /api/search?q=...` - Search songs
- `GET /download/mp3?url=...` - MP3 download
- `GET /download/mp4?url=...` - MP4 download
- `GET /download/audio?url=...` - Audio extraction
- Plus more download variants (ytmp3, dlmp3, yta, yta2, yta3)

## No API Keys Required
All endpoints work through web scraping - no API keys or environment secrets needed for any functionality.

## Branding
- Name: WOLFAPIS (WOLF in green #00ff00, APIS in white)
- Subtitle: MULTI-PROVIDER API HUB
- Dark theme with #0a0a0a background, minimal borders, neon green accents
- Wolf logo image as favicon and header icon

## Recent Changes
- 2026-02-13: Switched AI endpoints from direct API keys to scraping chateverywhere.app (free, no keys needed)
- 2026-02-13: Major pivot from music-only (WolfMusicApi) to multi-provider API hub (WolfApis)
- 2026-02-13: Added AI chat endpoints for 8 providers + image search endpoint
- 2026-02-13: Redesigned frontend with category filtering, endpoint cards, and unified playground
- 2026-02-12: Initial build with YouTube music endpoints and cyberpunk theme
