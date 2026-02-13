import type { Express, Request, Response } from "express";

const CHAT_EVERYWHERE_BASE = "https://chateverywhere.app";

async function chatEverywhereProxy(prompt: string, systemPrompt?: string): Promise<string> {
  const messages = [{ role: "user", content: prompt.trim() }];
  const body: any = {
    messages,
    prompt: systemPrompt || "You are a helpful assistant.",
    temperature: 0.7,
  };

  const response = await fetch(`${CHAT_EVERYWHERE_BASE}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`ChatEverywhere returned ${response.status}: ${err}`);
  }

  const text = await response.text();
  return text;
}

export function registerAIRoutes(app: Express): void {
  app.post("/api/ai/gpt", async (req: Request, res: Response) => {
    const { prompt, system } = req.body;
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ success: false, error: "Parameter 'prompt' is required." });
    }

    try {
      const text = await chatEverywhereProxy(prompt, system);
      return res.json({
        success: true,
        provider: "ChatEverywhere",
        model: "gpt-3.5-turbo",
        response: text,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message, provider: "ChatEverywhere" });
    }
  });

  app.post("/api/ai/claude", async (req: Request, res: Response) => {
    const { prompt, system } = req.body;
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ success: false, error: "Parameter 'prompt' is required." });
    }

    try {
      const systemPrompt = system || "You are Claude, a helpful AI assistant made by Anthropic. Respond thoughtfully and accurately.";
      const text = await chatEverywhereProxy(prompt, systemPrompt);
      return res.json({
        success: true,
        provider: "ChatEverywhere",
        model: "gpt-3.5-turbo",
        response: text,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message, provider: "ChatEverywhere" });
    }
  });

  app.post("/api/ai/mistral", async (req: Request, res: Response) => {
    const { prompt, system } = req.body;
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ success: false, error: "Parameter 'prompt' is required." });
    }

    try {
      const systemPrompt = system || "You are a helpful AI assistant. Respond clearly and accurately.";
      const text = await chatEverywhereProxy(prompt, systemPrompt);
      return res.json({
        success: true,
        provider: "ChatEverywhere",
        model: "gpt-3.5-turbo",
        response: text,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message, provider: "ChatEverywhere" });
    }
  });

  app.post("/api/ai/gemini", async (req: Request, res: Response) => {
    const { prompt, system } = req.body;
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ success: false, error: "Parameter 'prompt' is required." });
    }

    try {
      const systemPrompt = system || "You are a helpful AI assistant. Respond clearly and accurately.";
      const text = await chatEverywhereProxy(prompt, systemPrompt);
      return res.json({
        success: true,
        provider: "ChatEverywhere",
        model: "gpt-3.5-turbo",
        response: text,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message, provider: "ChatEverywhere" });
    }
  });

  app.post("/api/ai/deepseek", async (req: Request, res: Response) => {
    const { prompt, system } = req.body;
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ success: false, error: "Parameter 'prompt' is required." });
    }

    try {
      const systemPrompt = system || "You are a helpful AI assistant. Respond clearly and accurately.";
      const text = await chatEverywhereProxy(prompt, systemPrompt);
      return res.json({
        success: true,
        provider: "ChatEverywhere",
        model: "gpt-3.5-turbo",
        response: text,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message, provider: "ChatEverywhere" });
    }
  });

  app.post("/api/ai/venice", async (req: Request, res: Response) => {
    const { prompt, system } = req.body;
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ success: false, error: "Parameter 'prompt' is required." });
    }

    try {
      const systemPrompt = system || "You are a helpful AI assistant. Respond clearly and accurately.";
      const text = await chatEverywhereProxy(prompt, systemPrompt);
      return res.json({
        success: true,
        provider: "ChatEverywhere",
        model: "gpt-3.5-turbo",
        response: text,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message, provider: "ChatEverywhere" });
    }
  });

  app.post("/api/ai/groq", async (req: Request, res: Response) => {
    const { prompt, system } = req.body;
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ success: false, error: "Parameter 'prompt' is required." });
    }

    try {
      const systemPrompt = system || "You are a helpful AI assistant. Respond clearly and accurately.";
      const text = await chatEverywhereProxy(prompt, systemPrompt);
      return res.json({
        success: true,
        provider: "ChatEverywhere",
        model: "gpt-3.5-turbo",
        response: text,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message, provider: "ChatEverywhere" });
    }
  });

  app.post("/api/ai/cohere", async (req: Request, res: Response) => {
    const { prompt, system } = req.body;
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ success: false, error: "Parameter 'prompt' is required." });
    }

    try {
      const systemPrompt = system || "You are a helpful AI assistant. Respond clearly and accurately.";
      const text = await chatEverywhereProxy(prompt, systemPrompt);
      return res.json({
        success: true,
        provider: "ChatEverywhere",
        model: "gpt-3.5-turbo",
        response: text,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message, provider: "ChatEverywhere" });
    }
  });

  app.post("/api/ai/image/dall-e", async (req: Request, res: Response) => {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ success: false, error: "Parameter 'prompt' is required." });
    }

    try {
      const imageUrl = `${CHAT_EVERYWHERE_BASE}/api/image?q=${encodeURIComponent(prompt.trim())}&width=960&height=640`;
      const response = await fetch(imageUrl, { redirect: "follow" });

      if (!response.ok) {
        throw new Error(`Image fetch failed with status ${response.status}`);
      }

      const finalUrl = response.url;

      return res.json({
        success: true,
        provider: "ChatEverywhere",
        model: "unsplash",
        url: finalUrl,
        prompt: prompt.trim(),
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message, provider: "ChatEverywhere" });
    }
  });
}
