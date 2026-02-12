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

export const endpointInfo = [
  {
    path: "/download/audio",
    method: "GET",
    description: "Download audio from a YouTube URL",
    params: [{ name: "url", type: "string", required: true, description: "YouTube video URL" }],
    format: "mp3",
  },
  {
    path: "/download/ytmp3",
    method: "GET",
    description: "Convert YouTube video to MP3",
    params: [{ name: "url", type: "string", required: true, description: "YouTube video URL" }],
    format: "mp3",
  },
  {
    path: "/download/dlmp3",
    method: "GET",
    description: "Direct MP3 download from YouTube URL",
    params: [{ name: "url", type: "string", required: true, description: "YouTube video URL" }],
    format: "mp3",
  },
  {
    path: "/download/mp3",
    method: "GET",
    description: "MP3 download endpoint",
    params: [{ name: "url", type: "string", required: true, description: "YouTube video URL" }],
    format: "mp3",
  },
  {
    path: "/download/yta",
    method: "GET",
    description: "YouTube Audio extractor (primary)",
    params: [{ name: "url", type: "string", required: true, description: "YouTube video URL" }],
    format: "mp3",
  },
  {
    path: "/download/yta2",
    method: "GET",
    description: "YouTube Audio extractor (secondary)",
    params: [{ name: "url", type: "string", required: true, description: "YouTube video URL" }],
    format: "mp3",
  },
  {
    path: "/download/yta3",
    method: "GET",
    description: "YouTube Audio extractor (tertiary)",
    params: [{ name: "url", type: "string", required: true, description: "YouTube video URL" }],
    format: "mp3",
  },
  {
    path: "/download/mp4",
    method: "GET",
    description: "Download video as MP4 from YouTube URL",
    params: [{ name: "url", type: "string", required: true, description: "YouTube video URL" }],
    format: "mp4",
  },
  {
    path: "/api/search",
    method: "GET",
    description: "Search for songs by keyword",
    params: [{ name: "q", type: "string", required: true, description: "Search query (song name, artist, etc.)" }],
    format: "json",
  },
];

export type EndpointInfo = typeof endpointInfo[number];
