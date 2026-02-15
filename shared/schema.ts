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
  {
    id: "ai-chat",
    name: "AI Chat",
    description: "Free AI chat completion APIs powered by ChatEverywhere",
    icon: "MessageSquare",
  },
  {
    id: "ai-image",
    name: "AI Image",
    description: "Image search APIs powered by ChatEverywhere",
    icon: "Image",
  },
  {
    id: "music",
    name: "Music & Media",
    description: "YouTube search, MP3, and MP4 download endpoints (supports song name or URL)",
    icon: "Music",
  },
  {
    id: "tiktok",
    name: "TikTok",
    description: "Download TikTok videos without watermark",
    icon: "Video",
  },
  {
    id: "instagram",
    name: "Instagram",
    description: "Download Instagram videos, photos, reels, and carousels",
    icon: "Camera",
  },
  {
    id: "youtube-dl",
    name: "YouTube Downloader",
    description: "Download YouTube videos in multiple qualities and formats",
    icon: "Youtube",
  },
  {
    id: "facebook",
    name: "Facebook",
    description: "Download Facebook videos in SD and HD quality",
    icon: "Facebook",
  },
];

export const allEndpoints: ApiEndpoint[] = [
  {
    path: "/api/ai/gpt",
    method: "POST",
    description: "Chat with GPT - general purpose AI assistant",
    params: [
      { name: "prompt", type: "string", required: true, description: "The message/prompt to send" },
      { name: "system", type: "string", required: false, description: "Custom system prompt" },
    ],
    format: "json",
    category: "ai-chat",
    provider: "ChatEverywhere",
  },
  {
    path: "/api/ai/claude",
    method: "POST",
    description: "Chat with Claude-style AI assistant",
    params: [
      { name: "prompt", type: "string", required: true, description: "The message/prompt to send" },
      { name: "system", type: "string", required: false, description: "Custom system prompt" },
    ],
    format: "json",
    category: "ai-chat",
    provider: "ChatEverywhere",
  },
  {
    path: "/api/ai/mistral",
    method: "POST",
    description: "Chat with Mistral-style AI assistant",
    params: [
      { name: "prompt", type: "string", required: true, description: "The message/prompt to send" },
      { name: "system", type: "string", required: false, description: "Custom system prompt" },
    ],
    format: "json",
    category: "ai-chat",
    provider: "ChatEverywhere",
  },
  {
    path: "/api/ai/gemini",
    method: "POST",
    description: "Chat with Gemini-style AI assistant",
    params: [
      { name: "prompt", type: "string", required: true, description: "The message/prompt to send" },
      { name: "system", type: "string", required: false, description: "Custom system prompt" },
    ],
    format: "json",
    category: "ai-chat",
    provider: "ChatEverywhere",
  },
  {
    path: "/api/ai/deepseek",
    method: "POST",
    description: "Chat with DeepSeek-style AI assistant",
    params: [
      { name: "prompt", type: "string", required: true, description: "The message/prompt to send" },
      { name: "system", type: "string", required: false, description: "Custom system prompt" },
    ],
    format: "json",
    category: "ai-chat",
    provider: "ChatEverywhere",
  },
  {
    path: "/api/ai/venice",
    method: "POST",
    description: "Chat with Venice-style AI assistant",
    params: [
      { name: "prompt", type: "string", required: true, description: "The message/prompt to send" },
      { name: "system", type: "string", required: false, description: "Custom system prompt" },
    ],
    format: "json",
    category: "ai-chat",
    provider: "ChatEverywhere",
  },
  {
    path: "/api/ai/cohere",
    method: "POST",
    description: "Chat with Cohere-style AI assistant",
    params: [
      { name: "prompt", type: "string", required: true, description: "The message/prompt to send" },
      { name: "system", type: "string", required: false, description: "Custom system prompt" },
    ],
    format: "json",
    category: "ai-chat",
    provider: "ChatEverywhere",
  },
  {
    path: "/api/ai/groq",
    method: "POST",
    description: "Chat with Groq-style AI assistant",
    params: [
      { name: "prompt", type: "string", required: true, description: "The message/prompt to send" },
      { name: "system", type: "string", required: false, description: "Custom system prompt" },
    ],
    format: "json",
    category: "ai-chat",
    provider: "ChatEverywhere",
  },
  {
    path: "/api/ai/image/dall-e",
    method: "POST",
    description: "Search for images by prompt (Unsplash-powered)",
    params: [
      { name: "prompt", type: "string", required: true, description: "Image search description" },
    ],
    format: "json",
    category: "ai-image",
    provider: "ChatEverywhere",
  },
  {
    path: "/api/search",
    method: "GET",
    description: "Search for songs by keyword",
    params: [{ name: "q", type: "string", required: true, description: "Search query (song name, artist, etc.)" }],
    format: "json",
    category: "music",
  },
  {
    path: "/download/mp3",
    method: "GET",
    description: "Download audio as MP3 - supports YouTube URL or song name",
    params: [
      { name: "url", type: "string", required: false, description: "YouTube video URL" },
      { name: "q", type: "string", required: false, description: "Song name to search (e.g. Alan Walker Faded)" },
    ],
    format: "mp3",
    category: "music",
  },
  {
    path: "/download/mp4",
    method: "GET",
    description: "Download video as MP4 - supports YouTube URL or song name",
    params: [
      { name: "url", type: "string", required: false, description: "YouTube video URL" },
      { name: "q", type: "string", required: false, description: "Song name to search (e.g. Alan Walker Faded)" },
    ],
    format: "mp4",
    category: "music",
  },
  {
    path: "/download/audio",
    method: "GET",
    description: "Extract audio from YouTube - supports URL or song name",
    params: [
      { name: "url", type: "string", required: false, description: "YouTube video URL" },
      { name: "q", type: "string", required: false, description: "Song name to search" },
    ],
    format: "mp3",
    category: "music",
  },
  {
    path: "/download/ytmp3",
    method: "GET",
    description: "Convert YouTube video to MP3 - supports URL or song name",
    params: [
      { name: "url", type: "string", required: false, description: "YouTube video URL" },
      { name: "q", type: "string", required: false, description: "Song name to search" },
    ],
    format: "mp3",
    category: "music",
  },
  {
    path: "/download/dlmp3",
    method: "GET",
    description: "Direct MP3 download - supports URL or song name",
    params: [
      { name: "url", type: "string", required: false, description: "YouTube video URL" },
      { name: "q", type: "string", required: false, description: "Song name to search" },
    ],
    format: "mp3",
    category: "music",
  },
  {
    path: "/download/yta",
    method: "GET",
    description: "YouTube Audio extractor (primary) - supports URL or song name",
    params: [
      { name: "url", type: "string", required: false, description: "YouTube video URL" },
      { name: "q", type: "string", required: false, description: "Song name to search" },
    ],
    format: "mp3",
    category: "music",
  },
  {
    path: "/download/yta2",
    method: "GET",
    description: "YouTube Audio extractor (secondary) - supports URL or song name",
    params: [
      { name: "url", type: "string", required: false, description: "YouTube video URL" },
      { name: "q", type: "string", required: false, description: "Song name to search" },
    ],
    format: "mp3",
    category: "music",
  },
  {
    path: "/download/yta3",
    method: "GET",
    description: "YouTube Audio extractor (tertiary) - supports URL or song name",
    params: [
      { name: "url", type: "string", required: false, description: "YouTube video URL" },
      { name: "q", type: "string", required: false, description: "Song name to search" },
    ],
    format: "mp3",
    category: "music",
  },
  {
    path: "/download/stream/mp3",
    method: "GET",
    description: "Stream MP3 audio directly (best for bots) - plays instantly without redirect",
    params: [
      { name: "url", type: "string", required: false, description: "YouTube video URL" },
      { name: "q", type: "string", required: false, description: "Song name to search (e.g. Alan Walker Faded)" },
    ],
    format: "audio stream",
    category: "music",
  },
  {
    path: "/download/stream/mp4",
    method: "GET",
    description: "Stream MP4 video directly (best for bots) - plays instantly without redirect",
    params: [
      { name: "url", type: "string", required: false, description: "YouTube video URL" },
      { name: "q", type: "string", required: false, description: "Song name to search (e.g. Alan Walker Faded)" },
    ],
    format: "video stream",
    category: "music",
  },
  {
    path: "/api/download/tiktok",
    method: "GET",
    description: "Download TikTok video without watermark in MP4 or extract audio",
    params: [
      { name: "url", type: "string", required: true, description: "TikTok video URL" },
    ],
    format: "json",
    category: "tiktok",
    provider: "ssstik.io",
  },
  {
    path: "/api/download/instagram",
    method: "GET",
    description: "Download Instagram videos, photos, reels, and carousels",
    params: [
      { name: "url", type: "string", required: true, description: "Instagram post/reel URL" },
    ],
    format: "json",
    category: "instagram",
    provider: "fastdl.app",
  },
  {
    path: "/api/download/youtube",
    method: "GET",
    description: "Download YouTube videos in multiple qualities (HD, SD, Audio) - supports URL or name",
    params: [
      { name: "url", type: "string", required: false, description: "YouTube video URL" },
      { name: "q", type: "string", required: false, description: "Video name to search (e.g. Alan Walker Faded)" },
    ],
    format: "json",
    category: "youtube-dl",
    provider: "y2mate.nu",
  },
  {
    path: "/api/download/facebook",
    method: "GET",
    description: "Download Facebook videos in SD and HD quality",
    params: [
      { name: "url", type: "string", required: true, description: "Facebook video URL" },
    ],
    format: "json",
    category: "facebook",
    provider: "fdownloader.net",
  },
];

export const endpointInfo = allEndpoints.filter(e => e.category === "music");

export type EndpointInfo = typeof endpointInfo[number];
export type ApiCategory = typeof apiCategories[number];
