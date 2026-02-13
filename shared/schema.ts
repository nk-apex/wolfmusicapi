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
    description: "YouTube search, MP3, and MP4 download endpoints",
    icon: "Music",
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
    description: "Download audio as MP3 from YouTube URL",
    params: [{ name: "url", type: "string", required: true, description: "YouTube video URL" }],
    format: "mp3",
    category: "music",
  },
  {
    path: "/download/mp4",
    method: "GET",
    description: "Download video as MP4 from YouTube URL",
    params: [{ name: "url", type: "string", required: true, description: "YouTube video URL" }],
    format: "mp4",
    category: "music",
  },
  {
    path: "/download/audio",
    method: "GET",
    description: "Extract audio from YouTube URL",
    params: [{ name: "url", type: "string", required: true, description: "YouTube video URL" }],
    format: "mp3",
    category: "music",
  },
  {
    path: "/download/ytmp3",
    method: "GET",
    description: "Convert YouTube video to MP3",
    params: [{ name: "url", type: "string", required: true, description: "YouTube video URL" }],
    format: "mp3",
    category: "music",
  },
  {
    path: "/download/dlmp3",
    method: "GET",
    description: "Direct MP3 download",
    params: [{ name: "url", type: "string", required: true, description: "YouTube video URL" }],
    format: "mp3",
    category: "music",
  },
  {
    path: "/download/yta",
    method: "GET",
    description: "YouTube Audio extractor (primary)",
    params: [{ name: "url", type: "string", required: true, description: "YouTube video URL" }],
    format: "mp3",
    category: "music",
  },
  {
    path: "/download/yta2",
    method: "GET",
    description: "YouTube Audio extractor (secondary)",
    params: [{ name: "url", type: "string", required: true, description: "YouTube video URL" }],
    format: "mp3",
    category: "music",
  },
  {
    path: "/download/yta3",
    method: "GET",
    description: "YouTube Audio extractor (tertiary)",
    params: [{ name: "url", type: "string", required: true, description: "YouTube video URL" }],
    format: "mp3",
    category: "music",
  },
];

export const endpointInfo = allEndpoints.filter(e => e.category === "music");

export type EndpointInfo = typeof endpointInfo[number];
export type ApiCategory = typeof apiCategories[number];
