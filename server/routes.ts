import type { Express } from "express";
import { type Server } from "http";
import { spawn } from "child_process";
import { searchSongs, getDownloadInfo, extractVideoId } from "./scraper";
import { existsSync } from "fs";
import path from "path";
import { registerAIRoutes } from "./ai-routes";
import { downloadTikTok } from "../lib/downloaders/tiktok";
import { downloadInstagram } from "../lib/downloaders/instagram";
import { downloadYouTube } from "../lib/downloaders/youtube";
import { downloadFacebook } from "../lib/downloaders/facebook";
import { searchSpotify, downloadSpotify } from "../lib/downloaders/spotify";
import { searchShazam, recognizeShazam, recognizeShazamFull, getTrackDetails } from "../lib/downloaders/shazam";

function getCookiesPath(): string | null {
  const paths = [
    path.join(process.cwd(), "cookies.txt"),
    "/var/www/wolfmusicapi/cookies.txt",
    path.join(process.env.HOME || "", "cookies.txt"),
  ];
  for (const p of paths) {
    if (existsSync(p)) return p;
  }
  return null;
}

function isYouTubeUrl(input: string): boolean {
  return /^https?:\/\/(www\.)?(youtube\.com|youtu\.be|m\.youtube\.com)\//i.test(input) ||
         /^[a-zA-Z0-9_-]{11}$/.test(input);
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  registerAIRoutes(app);

  app.get("/api/search", async (req, res) => {
    try {
      const q = req.query.q as string;
      if (!q || q.trim().length === 0) {
        return res.status(400).json({ error: "Query parameter 'q' is required" });
      }

      const results = await searchSongs(q.trim());
      return res.json({
        success: true,
        creator: "APIs by Silent Wolf | A tech explorer",
        query: results.query,
        items: results.items,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Search failed" });
    }
  });

  const downloadHandler = (format: "mp3" | "mp4") => async (req: any, res: any) => {
    try {
      let url = (req.query.url as string) || (req.query.q as string) || (req.query.name as string);
      if (!url || url.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: "Provide 'url' (YouTube link) or 'q'/'name' (song name) as a query parameter.",
        });
      }

      url = url.trim();
      const host = req.get("host") || "";
      const protocol = req.protocol || "https";
      const baseUrl = `${protocol}://${host}`;

      if (!isYouTubeUrl(url)) {
        const searchResults = await searchSongs(url);
        if (!searchResults.items || searchResults.items.length === 0) {
          return res.status(404).json({
            success: false,
            error: `No results found for "${url}". Try a different search term.`,
          });
        }

        const firstResult = searchResults.items[0];
        const videoUrl = `https://www.youtube.com/watch?v=${firstResult.id}`;
        const result = await getDownloadInfo(videoUrl, format);

        const streamParam = `url=${encodeURIComponent(videoUrl)}`;
        return res.json({
          ...result,
          creator: "APIs by Silent Wolf | A tech explorer",
          streamUrl: `${baseUrl}/download/stream/${format}?${streamParam}`,
          note: "Use streamUrl for direct playback in bots (streams audio/video directly).",
          searchQuery: url,
          searchResult: {
            title: firstResult.title,
            channelTitle: firstResult.channelTitle,
            duration: firstResult.duration,
          },
        });
      }

      const result = await getDownloadInfo(url, format);
      const streamParam = `url=${encodeURIComponent(url)}`;
      return res.json({
        ...result,
        creator: "APIs by Silent Wolf | A tech explorer",
        streamUrl: `${baseUrl}/download/stream/${format}?${streamParam}`,
        note: "Use streamUrl for direct playback in bots (streams audio/video directly).",
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || "Download failed",
      });
    }
  };

  app.get("/download/audio", downloadHandler("mp3"));
  app.get("/download/ytmp3", downloadHandler("mp3"));
  app.get("/download/dlmp3", downloadHandler("mp3"));
  app.get("/download/mp3", downloadHandler("mp3"));
  app.get("/download/yta", downloadHandler("mp3"));
  app.get("/download/yta2", downloadHandler("mp3"));
  app.get("/download/yta3", downloadHandler("mp3"));
  app.get("/download/mp4", downloadHandler("mp4"));

  const streamHandler = (format: "mp3" | "mp4") => async (req: any, res: any) => {
    try {
      let url = (req.query.url as string) || (req.query.q as string) || (req.query.name as string);
      if (!url || url.trim().length === 0) {
        return res.status(400).json({
          success: false,
          creator: "APIs by Silent Wolf | A tech explorer",
          error: "Provide 'url' (YouTube link) or 'q'/'name' (song name) as a query parameter.",
        });
      }

      url = url.trim();

      if (!isYouTubeUrl(url)) {
        const searchResults = await searchSongs(url);
        if (!searchResults.items || searchResults.items.length === 0) {
          return res.status(404).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: `No results found for "${url}".` });
        }
        url = `https://www.youtube.com/watch?v=${searchResults.items[0].id}`;
      }

      const videoId = extractVideoId(url);
      if (!videoId) {
        return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: "Invalid YouTube URL." });
      }

      const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

      const contentType = format === "mp3" ? "audio/mpeg" : "video/mp4";
      const safeTitle = `audio_${videoId}`;
      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", `attachment; filename="${safeTitle}.${format}"`);
      res.setHeader("X-Creator", "APIs by Silent Wolf | A tech explorer");
      res.setHeader("Transfer-Encoding", "chunked");

      const formatArg = format === "mp3"
        ? "bestaudio[ext=m4a]/bestaudio"
        : "best[height<=480][ext=mp4]/best[ext=mp4]/best";

      const cookiesPath = getCookiesPath();
      const ytdlpArgs = [
        ...(cookiesPath ? ["--cookies", cookiesPath] : []),
        "--no-warnings",
        "-f", formatArg,
        "-o", "-",
        youtubeUrl,
      ];
      const ytdlp = spawn("yt-dlp", ytdlpArgs);

      let hasData = false;

      ytdlp.stdout.on("data", (chunk: Buffer) => {
        hasData = true;
        if (!res.writableEnded) {
          res.write(chunk);
        }
      });

      ytdlp.stderr.on("data", (data: Buffer) => {
        console.log(`[stream] yt-dlp stderr: ${data.toString().trim()}`);
      });

      ytdlp.on("close", (code) => {
        if (!hasData && !res.headersSent) {
          return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: `Stream failed (yt-dlp exit code ${code})` });
        }
        if (!res.writableEnded) {
          res.end();
        }
      });

      ytdlp.on("error", (err) => {
        if (!res.headersSent) {
          return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: `Stream error: ${err.message}` });
        }
        if (!res.writableEnded) {
          res.end();
        }
      });

      req.on("close", () => {
        ytdlp.kill("SIGTERM");
      });
    } catch (error: any) {
      if (!res.headersSent) {
        return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message || "Stream failed" });
      }
    }
  };

  app.get("/download/stream/mp3", streamHandler("mp3"));
  app.get("/download/stream/mp4", streamHandler("mp4"));

  app.get("/api/download/tiktok", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url || url.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: "Query parameter 'url' is required. Provide a TikTok video URL.",
        });
      }
      const result = await downloadTikTok(url);
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || "TikTok download failed" });
    }
  });

  app.get("/api/download/instagram", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url || url.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: "Query parameter 'url' is required. Provide an Instagram post/reel URL.",
        });
      }
      const result = await downloadInstagram(url);
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || "Instagram download failed" });
    }
  });

  app.get("/api/download/youtube", async (req, res) => {
    try {
      let url = (req.query.url as string) || (req.query.q as string) || (req.query.name as string);
      if (!url || url.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: "Provide 'url' (YouTube link) or 'q'/'name' (search term) as a query parameter.",
        });
      }

      url = url.trim();

      if (!isYouTubeUrl(url)) {
        const searchResults = await searchSongs(url);
        if (!searchResults.items || searchResults.items.length === 0) {
          return res.status(404).json({
            success: false,
            error: `No results found for "${url}".`,
          });
        }
        const firstResult = searchResults.items[0];
        url = `https://www.youtube.com/watch?v=${firstResult.id}`;
      }

      const result = await downloadYouTube(url);
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || "YouTube download failed" });
    }
  });

  app.get("/api/download/facebook", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url || url.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: "Query parameter 'url' is required. Provide a Facebook video URL.",
        });
      }
      const result = await downloadFacebook(url);
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || "Facebook download failed" });
    }
  });

  app.get("/api/spotify/search", async (req, res) => {
    try {
      const q = (req.query.q as string) || (req.query.query as string);
      if (!q || q.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: "Query parameter 'q' is required. Example: /api/spotify/search?q=Blinding Lights",
        });
      }
      const result = await searchSpotify(q.trim());
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message || "Spotify search failed" });
    }
  });

  app.get("/api/spotify/download", async (req, res) => {
    try {
      const input = (req.query.url as string) || (req.query.q as string) || (req.query.name as string);
      if (!input || input.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: "Provide 'url' (Spotify track link) or 'q'/'name' (song name). Example: /api/spotify/download?q=Blinding Lights",
        });
      }
      const host = req.get("host") || "";
      const protocol = req.protocol || "https";
      const baseUrl = `${protocol}://${host}`;
      const result = await downloadSpotify(input.trim(), baseUrl);
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message || "Spotify download failed" });
    }
  });

  app.get("/api/shazam/search", async (req, res) => {
    try {
      const q = (req.query.q as string) || (req.query.query as string);
      if (!q || q.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: "Query parameter 'q' is required. Example: /api/shazam/search?q=Shape of You",
        });
      }
      const result = await searchShazam(q.trim());
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message || "Shazam search failed" });
    }
  });

  app.get("/api/shazam/track/:id", async (req, res) => {
    try {
      const trackId = req.params.id;
      if (!trackId) {
        return res.status(400).json({
          success: false,
          error: "Track ID is required. Example: /api/shazam/track/552406075",
        });
      }
      const result = await getTrackDetails(trackId);
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message || "Shazam track lookup failed" });
    }
  });

  app.post("/api/shazam/recognize", async (req, res) => {
    try {
      const contentType = req.headers["content-type"] || "";
      let audioBuffer: Buffer;

      if (contentType.includes("octet-stream") || contentType.includes("audio/")) {
        const chunks: Buffer[] = [];
        for await (const chunk of req) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        audioBuffer = Buffer.concat(chunks);
      } else {
        const { audio, url: audioUrl } = req.body || {};

        if (audioUrl) {
          console.log(`[shazam] Downloading audio from URL: ${audioUrl}`);
          const audioRes = await fetch(audioUrl, {
            headers: { "User-Agent": "Mozilla/5.0" },
          });
          if (!audioRes.ok) {
            return res.status(400).json({
              success: false,
              creator: "APIs by Silent Wolf | A tech explorer",
              error: "Failed to download audio from the provided URL.",
            });
          }
          audioBuffer = Buffer.from(await audioRes.arrayBuffer());
        } else if (audio) {
          audioBuffer = Buffer.from(audio, "base64");
        } else {
          return res.status(400).json({
            success: false,
            creator: "APIs by Silent Wolf | A tech explorer",
            error: "Provide 'audio' (base64-encoded raw PCM s16LE) or 'url' (link to audio file) in the request body. Example: {\"url\": \"https://example.com/audio.mp3\"} or {\"audio\": \"<base64 PCM data>\"}",
          });
        }
      }

      if (audioBuffer.length < 1000) {
        return res.status(400).json({
          success: false,
          creator: "APIs by Silent Wolf | A tech explorer",
          error: "Audio data too short. Provide at least a few seconds of audio.",
        });
      }

      console.log(`[shazam] Recognizing audio: ${audioBuffer.length} bytes`);
      const result = await recognizeShazamFull(audioBuffer);
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message || "Shazam recognition failed" });
    }
  });

  return httpServer;
}
