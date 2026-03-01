import { z } from "zod";

export const searchResultSchema = z.object({
  title: z.string(),
  id: z.string(),
  size: z.string().optional(),
  duration: z.string().optional(),
  channelTitle: z.string().optional(),
  source: z.string().optional(),
});

export const searchResponseSchema = z.object({
  query: z.string(),
  items: z.array(searchResultSchema),
});

export const downloadResponseSchema = z.object({
  success: z.boolean(),
  title: z.string().optional(),
  videoId: z.string().optional(),
  channelTitle: z.string().optional(),
  downloadUrl: z.string().optional(),
  format: z.enum(["mp3", "mp4"]).optional(),
  error: z.string().optional(),
});

export type SearchResult = z.infer<typeof searchResultSchema>;
export type SearchResponse = z.infer<typeof searchResponseSchema>;
export type DownloadResponse = z.infer<typeof downloadResponseSchema>;

export interface ApiParam {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

export interface ApiEndpoint {
  path: string;
  method: string;
  description: string;
  params: ApiParam[];
  format: string;
  category: string;
  provider?: string;
}

export const apiCategories = [
  { id: "ai-chat", name: "AI Chat", description: "Free AI chat completion APIs", icon: "MessageSquare" },
  { id: "ai-tools", name: "AI Tools", description: "AI-powered utility tools (translate, summarize, code)", icon: "Wand2" },
  { id: "ai-image", name: "AI Image", description: "Image search APIs", icon: "Image" },
  { id: "music", name: "Music & Media", description: "YouTube search, MP3, and MP4 download endpoints", icon: "Music" },
  { id: "tiktok", name: "TikTok", description: "Download TikTok videos without watermark", icon: "Video" },
  { id: "instagram", name: "Instagram", description: "Download Instagram videos, photos, reels", icon: "Camera" },
  { id: "youtube-dl", name: "YouTube Downloader", description: "Download YouTube videos in multiple formats", icon: "Youtube" },
  { id: "facebook", name: "Facebook", description: "Download Facebook videos", icon: "Facebook" },
  { id: "spotify", name: "Spotify", description: "Search and download Spotify tracks as MP3", icon: "Music2" },
  { id: "shazam", name: "Shazam", description: "Search songs and recognize music from audio", icon: "AudioLines" },
  { id: "ephoto", name: "Ephoto360", description: "Generate text effects and artistic images", icon: "Sparkles" },
];

const aiChatEndpoints: ApiEndpoint[] = [
  { path: "/api/ai/gpt", method: "POST", description: "Chat with GPT - general purpose AI assistant", params: [{ name: "prompt", type: "string", required: true, description: "The message/prompt to send" }, { name: "system", type: "string", required: false, description: "Custom system prompt" }], format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/gpt4", method: "POST", description: "Chat with GPT-4 - advanced reasoning AI", params: [{ name: "prompt", type: "string", required: true, description: "The message/prompt to send" }, { name: "system", type: "string", required: false, description: "Custom system prompt" }], format: "json", category: "ai-chat", provider: "OpenAI" },
  { path: "/api/ai/gpt4o", method: "POST", description: "Chat with GPT-4o - OpenAI's most capable model", params: [{ name: "prompt", type: "string", required: true, description: "The message/prompt to send" }, { name: "system", type: "string", required: false, description: "Custom system prompt" }], format: "json", category: "ai-chat", provider: "OpenAI" },
  { path: "/api/ai/claude", method: "POST", description: "Chat with Claude-style AI assistant", params: [{ name: "prompt", type: "string", required: true, description: "The message/prompt to send" }, { name: "system", type: "string", required: false, description: "Custom system prompt" }], format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/mistral", method: "POST", description: "Chat with Mistral AI assistant", params: [{ name: "prompt", type: "string", required: true, description: "The message/prompt to send" }, { name: "system", type: "string", required: false, description: "Custom system prompt" }], format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/gemini", method: "POST", description: "Chat with Gemini AI assistant", params: [{ name: "prompt", type: "string", required: true, description: "The message/prompt to send" }, { name: "system", type: "string", required: false, description: "Custom system prompt" }], format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/deepseek", method: "POST", description: "Chat with DeepSeek AI assistant", params: [{ name: "prompt", type: "string", required: true, description: "The message/prompt to send" }, { name: "system", type: "string", required: false, description: "Custom system prompt" }], format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/venice", method: "POST", description: "Chat with Venice AI assistant", params: [{ name: "prompt", type: "string", required: true, description: "The message/prompt to send" }, { name: "system", type: "string", required: false, description: "Custom system prompt" }], format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/groq", method: "POST", description: "Chat with Groq AI - fast inference", params: [{ name: "prompt", type: "string", required: true, description: "The message/prompt to send" }, { name: "system", type: "string", required: false, description: "Custom system prompt" }], format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/cohere", method: "POST", description: "Chat with Cohere AI assistant", params: [{ name: "prompt", type: "string", required: true, description: "The message/prompt to send" }, { name: "system", type: "string", required: false, description: "Custom system prompt" }], format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/llama", method: "POST", description: "Chat with LLaMA - Meta's open model", params: [{ name: "prompt", type: "string", required: true, description: "The message/prompt to send" }, { name: "system", type: "string", required: false, description: "Custom system prompt" }], format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/mixtral", method: "POST", description: "Chat with Mixtral - mixture of experts model", params: [{ name: "prompt", type: "string", required: true, description: "The message/prompt to send" }, { name: "system", type: "string", required: false, description: "Custom system prompt" }], format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/phi", method: "POST", description: "Chat with Phi - Microsoft's efficient model", params: [{ name: "prompt", type: "string", required: true, description: "The message/prompt to send" }, { name: "system", type: "string", required: false, description: "Custom system prompt" }], format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/qwen", method: "POST", description: "Chat with Qwen - Alibaba's language model", params: [{ name: "prompt", type: "string", required: true, description: "The message/prompt to send" }, { name: "system", type: "string", required: false, description: "Custom system prompt" }], format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/falcon", method: "POST", description: "Chat with Falcon - TII's open model", params: [{ name: "prompt", type: "string", required: true, description: "The message/prompt to send" }, { name: "system", type: "string", required: false, description: "Custom system prompt" }], format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/vicuna", method: "POST", description: "Chat with Vicuna - open-source chatbot", params: [{ name: "prompt", type: "string", required: true, description: "The message/prompt to send" }, { name: "system", type: "string", required: false, description: "Custom system prompt" }], format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/openchat", method: "POST", description: "Chat with OpenChat model", params: [{ name: "prompt", type: "string", required: true, description: "The message/prompt to send" }, { name: "system", type: "string", required: false, description: "Custom system prompt" }], format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/wizard", method: "POST", description: "Chat with WizardLM - instruction-following AI", params: [{ name: "prompt", type: "string", required: true, description: "The message/prompt to send" }, { name: "system", type: "string", required: false, description: "Custom system prompt" }], format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/zephyr", method: "POST", description: "Chat with Zephyr - chat-tuned AI", params: [{ name: "prompt", type: "string", required: true, description: "The message/prompt to send" }, { name: "system", type: "string", required: false, description: "Custom system prompt" }], format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/codellama", method: "POST", description: "Chat with CodeLlama - code-specialized AI", params: [{ name: "prompt", type: "string", required: true, description: "The message/prompt to send" }, { name: "system", type: "string", required: false, description: "Custom system prompt" }], format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/starcoder", method: "POST", description: "Chat with StarCoder - code generation AI", params: [{ name: "prompt", type: "string", required: true, description: "The message/prompt to send" }, { name: "system", type: "string", required: false, description: "Custom system prompt" }], format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/dolphin", method: "POST", description: "Chat with Dolphin - uncensored AI model", params: [{ name: "prompt", type: "string", required: true, description: "The message/prompt to send" }, { name: "system", type: "string", required: false, description: "Custom system prompt" }], format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/nous", method: "POST", description: "Chat with Nous Hermes AI", params: [{ name: "prompt", type: "string", required: true, description: "The message/prompt to send" }, { name: "system", type: "string", required: false, description: "Custom system prompt" }], format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/openhermes", method: "POST", description: "Chat with OpenHermes AI", params: [{ name: "prompt", type: "string", required: true, description: "The message/prompt to send" }, { name: "system", type: "string", required: false, description: "Custom system prompt" }], format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/neural", method: "POST", description: "Chat with NeuralChat - Intel's AI model", params: [{ name: "prompt", type: "string", required: true, description: "The message/prompt to send" }, { name: "system", type: "string", required: false, description: "Custom system prompt" }], format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/solar", method: "POST", description: "Chat with Solar AI model", params: [{ name: "prompt", type: "string", required: true, description: "The message/prompt to send" }, { name: "system", type: "string", required: false, description: "Custom system prompt" }], format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/yi", method: "POST", description: "Chat with Yi - bilingual language model", params: [{ name: "prompt", type: "string", required: true, description: "The message/prompt to send" }, { name: "system", type: "string", required: false, description: "Custom system prompt" }], format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/tinyllama", method: "POST", description: "Chat with TinyLlama - compact AI model", params: [{ name: "prompt", type: "string", required: true, description: "The message/prompt to send" }, { name: "system", type: "string", required: false, description: "Custom system prompt" }], format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/orca", method: "POST", description: "Chat with Orca - reasoning-focused AI", params: [{ name: "prompt", type: "string", required: true, description: "The message/prompt to send" }, { name: "system", type: "string", required: false, description: "Custom system prompt" }], format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/command", method: "POST", description: "Chat with Command R by Cohere", params: [{ name: "prompt", type: "string", required: true, description: "The message/prompt to send" }, { name: "system", type: "string", required: false, description: "Custom system prompt" }], format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/nemotron", method: "POST", description: "Chat with Nemotron - NVIDIA's AI model", params: [{ name: "prompt", type: "string", required: true, description: "The message/prompt to send" }, { name: "system", type: "string", required: false, description: "Custom system prompt" }], format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/internlm", method: "POST", description: "Chat with InternLM - multilingual AI", params: [{ name: "prompt", type: "string", required: true, description: "The message/prompt to send" }, { name: "system", type: "string", required: false, description: "Custom system prompt" }], format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/chatglm", method: "POST", description: "Chat with ChatGLM - bilingual model", params: [{ name: "prompt", type: "string", required: true, description: "The message/prompt to send" }, { name: "system", type: "string", required: false, description: "Custom system prompt" }], format: "json", category: "ai-chat", provider: "ChatEverywhere" },
];

const aiToolEndpoints: ApiEndpoint[] = [
  { path: "/api/ai/translate", method: "POST", description: "AI-powered text translation", params: [{ name: "text", type: "string", required: true, description: "Text to translate" }, { name: "to", type: "string", required: false, description: "Target language (default: en)" }, { name: "from", type: "string", required: false, description: "Source language (default: auto)" }], format: "json", category: "ai-tools", provider: "ChatEverywhere" },
  { path: "/api/ai/summarize", method: "POST", description: "AI-powered text summarization", params: [{ name: "text", type: "string", required: true, description: "Text to summarize" }], format: "json", category: "ai-tools", provider: "ChatEverywhere" },
  { path: "/api/ai/code", method: "POST", description: "AI code generation assistant", params: [{ name: "prompt", type: "string", required: true, description: "Code task description" }, { name: "language", type: "string", required: false, description: "Programming language (e.g. python, javascript)" }], format: "json", category: "ai-tools", provider: "ChatEverywhere" },
];

const aiImageEndpoints: ApiEndpoint[] = [
  { path: "/api/ai/image/dall-e", method: "POST", description: "Search for images by prompt (Unsplash-powered)", params: [{ name: "prompt", type: "string", required: true, description: "Image search description" }], format: "json", category: "ai-image", provider: "ChatEverywhere" },
];

const musicEndpoints: ApiEndpoint[] = [
  { path: "/api/search", method: "GET", description: "Search for songs by keyword", params: [{ name: "q", type: "string", required: true, description: "Search query (song name, artist, etc.)" }], format: "json", category: "music" },
  { path: "/download/mp3", method: "GET", description: "Download audio as MP3 - supports YouTube URL or song name", params: [{ name: "url", type: "string", required: false, description: "YouTube video URL" }, { name: "q", type: "string", required: false, description: "Song name to search" }], format: "mp3", category: "music" },
  { path: "/download/mp4", method: "GET", description: "Download video as MP4 - supports YouTube URL or song name", params: [{ name: "url", type: "string", required: false, description: "YouTube video URL" }, { name: "q", type: "string", required: false, description: "Song name to search" }], format: "mp4", category: "music" },
  { path: "/download/audio", method: "GET", description: "Extract audio from YouTube", params: [{ name: "url", type: "string", required: false, description: "YouTube video URL" }, { name: "q", type: "string", required: false, description: "Song name to search" }], format: "mp3", category: "music" },
  { path: "/download/ytmp3", method: "GET", description: "Convert YouTube video to MP3", params: [{ name: "url", type: "string", required: false, description: "YouTube video URL" }, { name: "q", type: "string", required: false, description: "Song name to search" }], format: "mp3", category: "music" },
  { path: "/download/dlmp3", method: "GET", description: "Direct MP3 download", params: [{ name: "url", type: "string", required: false, description: "YouTube video URL" }, { name: "q", type: "string", required: false, description: "Song name to search" }], format: "mp3", category: "music" },
  { path: "/download/yta", method: "GET", description: "YouTube Audio extractor (primary)", params: [{ name: "url", type: "string", required: false, description: "YouTube video URL" }, { name: "q", type: "string", required: false, description: "Song name to search" }], format: "mp3", category: "music" },
  { path: "/download/yta2", method: "GET", description: "YouTube Audio extractor (secondary)", params: [{ name: "url", type: "string", required: false, description: "YouTube video URL" }, { name: "q", type: "string", required: false, description: "Song name to search" }], format: "mp3", category: "music" },
  { path: "/download/yta3", method: "GET", description: "YouTube Audio extractor (tertiary)", params: [{ name: "url", type: "string", required: false, description: "YouTube video URL" }, { name: "q", type: "string", required: false, description: "Song name to search" }], format: "mp3", category: "music" },
  { path: "/download/ytmp4", method: "GET", description: "Convert YouTube video to MP4", params: [{ name: "url", type: "string", required: false, description: "YouTube video URL" }, { name: "q", type: "string", required: false, description: "Song name to search" }], format: "mp4", category: "music" },
  { path: "/download/dlmp4", method: "GET", description: "Direct MP4 download", params: [{ name: "url", type: "string", required: false, description: "YouTube video URL" }, { name: "q", type: "string", required: false, description: "Song name to search" }], format: "mp4", category: "music" },
  { path: "/download/video", method: "GET", description: "Extract video from YouTube", params: [{ name: "url", type: "string", required: false, description: "YouTube video URL" }, { name: "q", type: "string", required: false, description: "Song name to search" }], format: "mp4", category: "music" },
  { path: "/download/hd", method: "GET", description: "Download YouTube video in HD quality", params: [{ name: "url", type: "string", required: false, description: "YouTube video URL" }, { name: "q", type: "string", required: false, description: "Song name to search" }], format: "mp4", category: "music" },
  { path: "/download/lyrics", method: "GET", description: "Get song lyrics by name", params: [{ name: "q", type: "string", required: true, description: "Song name and artist" }], format: "json", category: "music" },
  { path: "/api/trending", method: "GET", description: "Get trending music from YouTube", params: [{ name: "country", type: "string", required: false, description: "Country code (default: US)" }], format: "json", category: "music" },
];

const tiktokEndpoints: ApiEndpoint[] = [
  { path: "/api/download/tiktok", method: "GET", description: "Download TikTok video without watermark", params: [{ name: "url", type: "string", required: true, description: "TikTok video URL" }], format: "json", category: "tiktok", provider: "ssstik.io" },
];

const instagramEndpoints: ApiEndpoint[] = [
  { path: "/api/download/instagram", method: "GET", description: "Download Instagram videos, photos, reels", params: [{ name: "url", type: "string", required: true, description: "Instagram post/reel URL" }], format: "json", category: "instagram", provider: "Multi-provider" },
];

const youtubeEndpoints: ApiEndpoint[] = [
  { path: "/api/download/youtube", method: "GET", description: "Download YouTube videos in multiple qualities", params: [{ name: "url", type: "string", required: false, description: "YouTube video URL" }, { name: "q", type: "string", required: false, description: "Video name to search" }], format: "json", category: "youtube-dl", provider: "y2mate.nu" },
];

const facebookEndpoints: ApiEndpoint[] = [
  { path: "/api/download/facebook", method: "GET", description: "Download Facebook videos in SD and HD quality", params: [{ name: "url", type: "string", required: true, description: "Facebook video URL" }], format: "json", category: "facebook", provider: "fdownloader.net" },
];

const spotifyEndpoints: ApiEndpoint[] = [
  { path: "/api/spotify/search", method: "GET", description: "Search for songs on Spotify", params: [{ name: "q", type: "string", required: true, description: "Search query (song name, artist)" }], format: "json", category: "spotify", provider: "Spotdown" },
  { path: "/api/spotify/download", method: "GET", description: "Download a Spotify track as MP3", params: [{ name: "url", type: "string", required: false, description: "Spotify track URL" }, { name: "q", type: "string", required: false, description: "Song name to search" }], format: "json", category: "spotify", provider: "Spotdown" },
];

const shazamEndpoints: ApiEndpoint[] = [
  { path: "/api/shazam/search", method: "GET", description: "Search for songs on Shazam", params: [{ name: "q", type: "string", required: true, description: "Search query (song name, artist)" }], format: "json", category: "shazam", provider: "Shazam" },
  { path: "/api/shazam/recognize", method: "POST", description: "Identify a song from audio", params: [{ name: "audio", type: "string", required: false, description: "Base64-encoded raw PCM audio" }, { name: "url", type: "string", required: false, description: "URL to an audio file" }], format: "json", category: "shazam", provider: "Shazam" },
  { path: "/api/shazam/track/:id", method: "GET", description: "Get details about a Shazam track by ID", params: [{ name: "id", type: "string", required: true, description: "Shazam track ID" }], format: "json", category: "shazam", provider: "Shazam" },
];

const ephotoEndpoints: ApiEndpoint[] = [
  { path: "/api/ephoto/list", method: "GET", description: "List all available Ephoto360 text effects", params: [], format: "json", category: "ephoto", provider: "Ephoto360" },
  { path: "/api/ephoto/generate", method: "POST", description: "Generate a text effect image", params: [{ name: "effect", type: "string", required: true, description: "Effect slug or ID (from /api/ephoto/list)" }, { name: "text", type: "string", required: true, description: "Text to render in the effect" }], format: "json", category: "ephoto", provider: "Ephoto360" },
];

export const allEndpoints: ApiEndpoint[] = [
  ...aiChatEndpoints,
  ...aiToolEndpoints,
  ...aiImageEndpoints,
  ...musicEndpoints,
  ...tiktokEndpoints,
  ...instagramEndpoints,
  ...youtubeEndpoints,
  ...facebookEndpoints,
  ...spotifyEndpoints,
  ...shazamEndpoints,
  ...ephotoEndpoints,
];

export const endpointInfo = allEndpoints.filter(e => e.category === "music");

export type EndpointInfo = typeof endpointInfo[number];
export type ApiCategory = typeof apiCategories[number];
