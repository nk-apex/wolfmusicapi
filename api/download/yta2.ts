import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getDownloadInfo } from "../../lib/scraper";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const url = req.query.url as string;
    if (!url || url.trim().length === 0) {
      return res.status(400).json({ success: false, error: "Query parameter 'url' is required. Provide a YouTube video URL." });
    }
    const result = await getDownloadInfo(url.trim(), "mp3");
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || "Download failed" });
  }
}
