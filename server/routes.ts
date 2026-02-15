import type { Express } from "express";
import { type Server } from "http";
import { spawn } from "child_process";
import { searchSongs, getDownloadInfo } from "./scraper";
import { registerAIRoutes } from "./ai-routes";
import { downloadTikTok } from "../lib/downloaders/tiktok";
import { downloadInstagram } from "../lib/downloaders/instagram";
import { downloadYouTube } from "../lib/downloaders/youtube";
import { downloadFacebook } from "../lib/downloaders/facebook";

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
        creator: "apis by Silent Wolf",
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
          creator: "apis by Silent Wolf",
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
        creator: "apis by Silent Wolf",
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

  app.get("/download/stream/mp3", async (req, res) => {
    try {
      let url = (req.query.url as string) || (req.query.q as string) || (req.query.name as string);
      if (!url || url.trim().length === 0) {
        return res.status(400).json({
          success: false,
          creator: "apis by Silent Wolf",
          error: "Provide 'url' (YouTube link) or 'q'/'name' (song name) as a query parameter.",
        });
      }

      url = url.trim();

      if (!isYouTubeUrl(url)) {
        const searchResults = await searchSongs(url);
        if (!searchResults.items || searchResults.items.length === 0) {
          return res.status(404).json({ success: false, creator: "apis by Silent Wolf", error: `No results found for "${url}".` });
        }
        url = `https://www.youtube.com/watch?v=${searchResults.items[0].id}`;
      }

      const result = await getDownloadInfo(url, "mp3");
      if (!result.success || !result.downloadUrl) {
        return res.status(500).json({ success: false, creator: "apis by Silent Wolf", error: "Failed to get audio download URL." });
      }

      const safeTitle = (result.title || "audio").replace(/[^a-zA-Z0-9_\- ]/g, "").substring(0, 80);
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Content-Disposition", `attachment; filename="${safeTitle}.mp3"`);
      res.setHeader("Transfer-Encoding", "chunked");
      res.setHeader("X-Creator", "apis by Silent Wolf");

      const ffmpeg = spawn("ffmpeg", [
        "-i", result.downloadUrl,
        "-vn",
        "-acodec", "libmp3lame",
        "-ab", "128k",
        "-f", "mp3",
        "-y",
        "pipe:1",
      ], { stdio: ["ignore", "pipe", "pipe"] });

      ffmpeg.stdout.pipe(res);

      ffmpeg.on("error", () => {
        if (!res.headersSent) {
          res.status(500).json({ success: false, creator: "apis by Silent Wolf", error: "Audio conversion failed." });
        } else {
          res.end();
        }
      });

      ffmpeg.on("close", (code) => {
        if (code !== 0 && !res.writableEnded) {
          res.end();
        }
      });

      res.on("close", () => {
        ffmpeg.kill("SIGTERM");
      });
    } catch (error: any) {
      if (!res.headersSent) {
        return res.status(500).json({ success: false, creator: "apis by Silent Wolf", error: error.message || "Stream failed" });
      }
    }
  });

  app.get("/download/stream/mp4", async (req, res) => {
    try {
      let url = (req.query.url as string) || (req.query.q as string) || (req.query.name as string);
      if (!url || url.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: "Provide 'url' (YouTube link) or 'q'/'name' (song name) as a query parameter.",
        });
      }

      url = url.trim();

      if (!isYouTubeUrl(url)) {
        const searchResults = await searchSongs(url);
        if (!searchResults.items || searchResults.items.length === 0) {
          return res.status(404).json({ success: false, error: `No results found for "${url}".` });
        }
        url = `https://www.youtube.com/watch?v=${searchResults.items[0].id}`;
      }

      const result = await getDownloadInfo(url, "mp4");
      if (!result.success || !result.downloadUrl) {
        return res.status(500).json({ success: false, error: "Failed to get video download URL." });
      }

      const videoRes = await fetch(result.downloadUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        },
      });

      if (!videoRes.ok || !videoRes.body) {
        return res.status(502).json({ success: false, error: "Failed to fetch video file from source." });
      }

      const safeTitle = (result.title || "video").replace(/[^a-zA-Z0-9_\- ]/g, "").substring(0, 80);
      res.setHeader("Content-Type", "video/mp4");
      res.setHeader("Content-Disposition", `attachment; filename="${safeTitle}.mp4"`);
      if (videoRes.headers.get("content-length")) {
        res.setHeader("Content-Length", videoRes.headers.get("content-length")!);
      }

      const reader = videoRes.body.getReader();
      const pump = async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (!res.writableEnded) {
            res.write(Buffer.from(value));
          }
        }
        res.end();
      };
      pump().catch(() => res.end());
    } catch (error: any) {
      if (!res.headersSent) {
        return res.status(500).json({ success: false, error: error.message || "Stream failed" });
      }
    }
  });

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

  return httpServer;
}
