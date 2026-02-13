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
  envKey?: string;
}

export const apiCategories = [
  {
    id: "ai-chat",
    name: "AI Chat",
    description: "Text generation and chat completion APIs from leading AI providers",
    icon: "MessageSquare",
  },
  {
    id: "ai-image",
    name: "AI Image",
    description: "Image generation and editing APIs",
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
    description: "Chat with OpenAI GPT models (GPT-4o, GPT-4, GPT-3.5)",
    params: [
      { name: "prompt", type: "string", required: true, description: "The message/prompt to send" },
      { name: "model", type: "string", required: false, description: "Model to use (default: gpt-4o-mini)" },
    ],
    format: "json",
    category: "ai-chat",
    provider: "OpenAI",
    envKey: "OPENAI_API_KEY",
  },
  {
    path: "/api/ai/claude",
    method: "POST",
    description: "Chat with Anthropic Claude models (Claude 3.5, Claude 3)",
    params: [
      { name: "prompt", type: "string", required: true, description: "The message/prompt to send" },
      { name: "model", type: "string", required: false, description: "Model to use (default: claude-3-5-sonnet-20241022)" },
    ],
    format: "json",
    category: "ai-chat",
    provider: "Anthropic",
    envKey: "ANTHROPIC_API_KEY",
  },
  {
    path: "/api/ai/mistral",
    method: "POST",
    description: "Chat with Mistral AI models (Mistral Large, Medium, Small)",
    params: [
      { name: "prompt", type: "string", required: true, description: "The message/prompt to send" },
      { name: "model", type: "string", required: false, description: "Model to use (default: mistral-small-latest)" },
    ],
    format: "json",
    category: "ai-chat",
    provider: "Mistral AI",
    envKey: "MISTRAL_API_KEY",
  },
  {
    path: "/api/ai/gemini",
    method: "POST",
    description: "Chat with Google Gemini models (Gemini Pro, Flash)",
    params: [
      { name: "prompt", type: "string", required: true, description: "The message/prompt to send" },
      { name: "model", type: "string", required: false, description: "Model to use (default: gemini-1.5-flash)" },
    ],
    format: "json",
    category: "ai-chat",
    provider: "Google",
    envKey: "GEMINI_API_KEY",
  },
  {
    path: "/api/ai/deepseek",
    method: "POST",
    description: "Chat with DeepSeek models (DeepSeek-V3, DeepSeek Chat)",
    params: [
      { name: "prompt", type: "string", required: true, description: "The message/prompt to send" },
      { name: "model", type: "string", required: false, description: "Model to use (default: deepseek-chat)" },
    ],
    format: "json",
    category: "ai-chat",
    provider: "DeepSeek",
    envKey: "DEEPSEEK_API_KEY",
  },
  {
    path: "/api/ai/venice",
    method: "POST",
    description: "Chat with Venice AI models (Llama, Mistral via Venice)",
    params: [
      { name: "prompt", type: "string", required: true, description: "The message/prompt to send" },
      { name: "model", type: "string", required: false, description: "Model to use (default: llama-3.3-70b)" },
    ],
    format: "json",
    category: "ai-chat",
    provider: "Venice",
    envKey: "VENICE_API_KEY",
  },
  {
    path: "/api/ai/cohere",
    method: "POST",
    description: "Chat with Cohere Command models",
    params: [
      { name: "prompt", type: "string", required: true, description: "The message/prompt to send" },
      { name: "model", type: "string", required: false, description: "Model to use (default: command-r-plus)" },
    ],
    format: "json",
    category: "ai-chat",
    provider: "Cohere",
    envKey: "COHERE_API_KEY",
  },
  {
    path: "/api/ai/groq",
    method: "POST",
    description: "Ultra-fast inference with Groq (Llama, Mixtral on LPU)",
    params: [
      { name: "prompt", type: "string", required: true, description: "The message/prompt to send" },
      { name: "model", type: "string", required: false, description: "Model to use (default: llama-3.1-70b-versatile)" },
    ],
    format: "json",
    category: "ai-chat",
    provider: "Groq",
    envKey: "GROQ_API_KEY",
  },
  {
    path: "/api/ai/image/dall-e",
    method: "POST",
    description: "Generate images with DALL-E 3",
    params: [
      { name: "prompt", type: "string", required: true, description: "Image description" },
      { name: "size", type: "string", required: false, description: "Size: 1024x1024, 1792x1024, 1024x1792" },
    ],
    format: "json",
    category: "ai-image",
    provider: "OpenAI",
    envKey: "OPENAI_API_KEY",
  },
  {
    path: "/api/ai/image/venice",
    method: "POST",
    description: "Generate images with Venice AI (Flux, SDXL models)",
    params: [
      { name: "prompt", type: "string", required: true, description: "Image description" },
      { name: "model", type: "string", required: false, description: "Model to use (default: fluently-xl)" },
    ],
    format: "json",
    category: "ai-image",
    provider: "Venice",
    envKey: "VENICE_API_KEY",
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
