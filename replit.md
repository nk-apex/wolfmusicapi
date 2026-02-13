# WolfApis

## Overview
A multi-provider API hub (branded as WOLFAPIS) that provides unified access to multiple AI services (GPT, Claude, Mistral, Gemini, DeepSeek, Venice, Groq, Cohere), AI image generation (DALL-E, Venice), and YouTube music download endpoints. Features a minimal dark-themed cyberpunk documentation frontend with interactive playground.

## Architecture
- **Frontend**: React + Vite + TailwindCSS + shadcn/ui components
- **Backend**: Express.js server in `server/`
- **AI Proxy**: `server/ai-routes.ts` - routes that proxy to various AI provider APIs using direct API keys
- **Music Scraping**: `lib/scraper.ts` - shared scraping module for YouTube music search/download
- **Data Source (Music)**: rinodepot.fr (MP3Juice clone) - uses /search and /check endpoints

## Key Files
- `shared/schema.ts` - All endpoint definitions, categories, and TypeScript types
- `server/ai-routes.ts` - AI proxy endpoints (GPT, Claude, Mistral, Gemini, DeepSeek, Venice, Groq, Cohere, DALL-E, Venice Image)
- `server/routes.ts` - Express API endpoint definitions (music + registers AI routes)
- `lib/scraper.ts` - Shared scraping logic (search, check, download info)
- `client/src/pages/home.tsx` - Main UI with category browsing, endpoint docs, and playground
- `client/src/index.css` - Styles
- `client/src/assets/wolf-logo.png` - Wolf logo

## API Categories
### AI Chat
- `POST /api/ai/gpt` - OpenAI GPT (requires OPENAI_API_KEY)
- `POST /api/ai/claude` - Anthropic Claude (requires ANTHROPIC_API_KEY)
- `POST /api/ai/mistral` - Mistral AI (requires MISTRAL_API_KEY)
- `POST /api/ai/gemini` - Google Gemini (requires GEMINI_API_KEY)
- `POST /api/ai/deepseek` - DeepSeek (requires DEEPSEEK_API_KEY)
- `POST /api/ai/venice` - Venice AI (requires VENICE_API_KEY)
- `POST /api/ai/groq` - Groq (requires GROQ_API_KEY)
- `POST /api/ai/cohere` - Cohere (requires COHERE_API_KEY)

### AI Image
- `POST /api/ai/image/dall-e` - DALL-E 3 (requires OPENAI_API_KEY)
- `POST /api/ai/image/venice` - Venice Image Gen (requires VENICE_API_KEY)

### Music & Media
- `GET /api/search?q=...` - Search songs
- `GET /download/mp3?url=...` - MP3 download
- `GET /download/mp4?url=...` - MP4 download
- `GET /download/audio?url=...` - Audio extraction
- Plus more download variants (ytmp3, dlmp3, yta, yta2, yta3)

## API Key Setup
Each AI provider requires its own API key set as environment secret:
- OPENAI_API_KEY, ANTHROPIC_API_KEY, MISTRAL_API_KEY, GEMINI_API_KEY
- DEEPSEEK_API_KEY, VENICE_API_KEY, GROQ_API_KEY, COHERE_API_KEY
Endpoints return a helpful 503 error when their key is not configured.

## Branding
- Name: WOLFAPIS (WOLF in green #00ff00, APIS in white)
- Subtitle: MULTI-PROVIDER API HUB
- Dark theme with #0a0a0a background, minimal borders, neon green accents
- Wolf logo image as favicon and header icon

## Recent Changes
- 2026-02-13: Major pivot from music-only (WolfMusicApi) to multi-provider API hub (WolfApis)
- 2026-02-13: Added AI chat endpoints for 8 providers + 2 image generation endpoints
- 2026-02-13: Redesigned frontend with category filtering, endpoint cards, and unified playground
- 2026-02-12: Initial build with YouTube music endpoints and cyberpunk theme
