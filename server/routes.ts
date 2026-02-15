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

        return res.json({
          ...result,
          creator: "apis by Silent Wolf",
          searchQuery: url,
          searchResult: {
            title: firstResult.title,
            channelTitle: firstResult.channelTitle,
            duration: firstResult.duration,
          },
        });
      }

      const result = await getDownloadInfo(url, format);
      return res.json({ ...result, creator: "apis by Silent Wolf" });
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
