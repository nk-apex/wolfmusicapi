import type { Express } from "express";
import { type Server } from "http";
import { searchSongs, getDownloadInfo } from "./scraper";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get("/api/search", async (req, res) => {
    try {
      const q = req.query.q as string;
      if (!q || q.trim().length === 0) {
        return res.status(400).json({ error: "Query parameter 'q' is required" });
      }

      const results = await searchSongs(q.trim());
      return res.json(results.items);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Search failed" });
    }
  });

  const downloadHandler = (format: "mp3" | "mp4") => async (req: any, res: any) => {
    try {
      const url = req.query.url as string;
      if (!url || url.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: "Query parameter 'url' is required. Provide a YouTube video URL.",
        });
      }

      const result = await getDownloadInfo(url.trim(), format);
      return res.json(result);
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

  return httpServer;
}
