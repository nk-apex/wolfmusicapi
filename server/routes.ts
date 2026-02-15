import type { Express } from "express";
import { type Server } from "http";
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

  const streamHandler = (format: "mp3" | "mp4") => async (req: any, res: any) => {
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

      const result = await getDownloadInfo(url, format);
      if (!result.success || !result.downloadUrl) {
        return res.status(500).json({ success: false, creator: "apis by Silent Wolf", error: `Failed to get ${format} download URL.` });
      }

      const fileRes = await fetch(result.downloadUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          "Referer": "https://v1.y2mate.nu/",
        },
      });

      if (!fileRes.ok || !fileRes.body) {
        return res.status(502).json({ success: false, creator: "apis by Silent Wolf", error: `Failed to fetch ${format} file from source.` });
      }

      const safeTitle = (result.title || (format === "mp3" ? "audio" : "video")).replace(/[^a-zA-Z0-9_\- ]/g, "").substring(0, 80);
      const contentType = format === "mp3" ? "audio/mpeg" : "video/mp4";
      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", `attachment; filename="${safeTitle}.${format}"`);
      res.setHeader("X-Creator", "apis by Silent Wolf");
      if (fileRes.headers.get("content-length")) {
        res.setHeader("Content-Length", fileRes.headers.get("content-length")!);
      }

      const reader = fileRes.body.getReader();
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
        return res.status(500).json({ success: false, creator: "apis by Silent Wolf", error: error.message || "Stream failed" });
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

  return httpServer;
}
