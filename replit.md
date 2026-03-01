# WolfApis

## Overview
A multi-provider API hub (branded as WOLFAPIS v4.0) that provides unified access to 33+ AI chat models, AI tools (translate, summarize, code), image search, music/media downloaders, social media downloaders (YouTube, TikTok, Instagram, Facebook), Spotify search/download (via spotdown.org), Shazam music recognition, Ephoto360 text effect generation (60 effects), and PhotoFunia image effects (154 effects). 65 total endpoints across 12 categories. Features a cyberpunk-themed sidebar navigation UI with popup-based API testing.

## Architecture
- **Frontend**: React + Vite + TailwindCSS + shadcn/ui components
- **Backend**: Express.js server in `server/`
- **AI Proxy**: `server/ai-routes.ts` - 33 AI chat endpoints via chateverywhere.app + OpenAI (GPT-4/4o), plus translate/summarize/code tools
- **Music Scraping**: `lib/scraper.ts` - YouTube music search via yt-dlp, download via yt-dlp + y2mate/cobalt/vevioz/savefrom/cnvmp3 fallbacks
- **Social Media Downloaders**: `lib/downloaders/` - TikTok, Instagram, YouTube, Facebook video downloaders
- **Spotify**: `lib/downloaders/spotify.ts` - Search and download via spotdown.org API with iTunes fallback
- **Shazam**: `lib/downloaders/shazam.ts` - Shazam search + song recognition via reverse-engineered API
- **Ephoto360**: `lib/downloaders/ephoto360.ts` - 60 text/neon/3D effect generators via ephoto360.com
- **PhotoFunia**: `lib/downloaders/photofunia.ts` - 154 photo effects (filters, frames, faces, billboards, text art, etc.) via photofunia.com
- **Lyrics**: Uses lrclib.net API for song lyrics (with synced lyrics support)
- **Provider Health System**: Automatic tracking of provider failures with cooldown periods

## Key Files
- `shared/schema.ts` - All 65 endpoint definitions, 12 categories, and TypeScript types
- `server/ai-routes.ts` - AI proxy endpoints (33 chat + 3 tools + 1 image)
- `server/routes.ts` - Express API endpoint definitions (music, social media, Spotify, Shazam, Ephoto, PhotoFunia + registers AI routes)
- `lib/scraper.ts` - Shared scraping logic (search, check, download info)
- `lib/downloaders/spotify.ts` - Spotify search/download via spotdown.org
- `lib/downloaders/shazam.ts` - Shazam search + song recognition
- `lib/downloaders/ephoto360.ts` - Ephoto360 text effect generation (60 effects: neon, 3D, text, fire categories)
- `lib/downloaders/photofunia.ts` - PhotoFunia image effects (154 effects across 20+ categories)
- `lib/downloaders/tiktok.ts` - TikTok video downloader
- `lib/downloaders/instagram.ts` - Instagram media downloader
- `lib/downloaders/youtube.ts` - YouTube video downloader
- `lib/downloaders/facebook.ts` - Facebook video downloader
- `client/src/pages/home.tsx` - Main UI with sidebar navigation and popup API tester
- `client/src/index.css` - Neon cyberpunk theme styles
- `client/src/assets/wolf-logo.png` - Wolf logo

## API Categories (65 endpoints total)

### AI Chat (33 endpoints - chateverywhere.app + OpenAI)
GPT, GPT-4, GPT-4o, Claude, Mistral, Gemini, DeepSeek, Venice, Groq, Cohere, LLaMA, Mixtral, Phi, Qwen, Falcon, Vicuna, OpenChat, WizardLM, Zephyr, CodeLlama, StarCoder, Dolphin, Nous Hermes, OpenHermes, NeuralChat, Solar, Yi, TinyLlama, Orca, Command R, Nemotron, InternLM, ChatGLM

### AI Tools (3 endpoints)
- `POST /api/ai/translate` - AI translation
- `POST /api/ai/summarize` - AI summarization
- `POST /api/ai/code` - AI code generation

### AI Image (1 endpoint)
- `POST /api/ai/image/dall-e` - Image search (Unsplash-powered)

### Music & Media (15 endpoints)
Search, MP3/MP4 download (multiple variants), lyrics (lrclib.net), trending

### Spotify (2 endpoints - via spotdown.org)
- `GET /api/spotify/search?q=...` - Search tracks
- `GET /api/spotify/download?url=...` or `?q=...` - Download as MP3

### Shazam (3 endpoints)
- `GET /api/shazam/search?q=...` - Search songs
- `POST /api/shazam/recognize` - Identify from audio
- `GET /api/shazam/track/:id` - Track details

### Ephoto360 (2 endpoints, 60 effects)
- `GET /api/ephoto/list` - List 60 text effects (neon 19, 3D 18, text 16+, fire 2)
- `POST /api/ephoto/generate` - Generate text effect image

### PhotoFunia (2 endpoints, 154 effects)
- `GET /api/photofunia/list` - List 154 photo effects
- `POST /api/photofunia/generate` - Generate photo effect (text, image, or both)

### Social Media Downloaders (4 endpoints)
TikTok, Instagram, YouTube, Facebook

## Environment Variables
- `OPENAI_API_KEY` - Required for GPT-4/GPT-4o endpoints only (optional, other AI endpoints work without it)
- `SPOTDOWN_API_KEY` - Spotify download API key (has fallback default)
- `YOUTUBE_API_KEY` - YouTube trending API key (optional, falls back to search)

## Branding
- Name: WOLFAPIS (WOLF in green #00ff00, APIS in white)
- Creator tag: "APIs by Silent Wolf | A tech explorer"
- Dark theme with #0a0a0a background, neon green accents
- Sidebar navigation with popup-based API testing

## Recent Changes
- 2026-03-01: v4.0 expansion - Added PhotoFunia (154 effects), expanded Ephoto360 (60 effects with neon/3D/text/fire), fixed lyrics endpoint (lrclib.net), fixed AI model names in responses (show label not internal model), updated schema to 12 categories and 65 endpoints
- 2026-03-01: Major v3.0 expansion - 33 AI chat models, Spotify rewrite (spotdown.org), Ephoto360 text effects, sidebar UI + popup tester, removed stream endpoints, added lyrics/trending/ytmp4/dlmp4/video/hd endpoints
