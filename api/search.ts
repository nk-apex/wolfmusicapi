import type { VercelRequest, VercelResponse } from "@vercel/node";
import { searchSongs } from "../lib/scraper";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const q = req.query.q as string;
    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: "Query parameter 'q' is required" });
    }

    const results = await searchSongs(q.trim());
    return res.status(200).json(results.items);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Search failed" });
  }
}
