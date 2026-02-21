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

interface ChatEndpointConfig {
  path: string;
  label: string;
  model: string;
  defaultSystem: string;
}

const chatEndpoints: ChatEndpointConfig[] = [
  {
    path: "/api/ai/gpt",
    label: "GPT",
    model: "gpt-3.5-turbo",
    defaultSystem: "You are a helpful assistant.",
  },
  {
    path: "/api/ai/claude",
    label: "Claude",
    model: "gpt-3.5-turbo",
    defaultSystem: "You are Claude, a helpful AI assistant made by Anthropic. Respond thoughtfully and accurately.",
  },
  {
    path: "/api/ai/mistral",
    label: "Mistral",
    model: "gpt-3.5-turbo",
    defaultSystem: "You are a helpful AI assistant. Respond clearly and accurately.",
  },
  {
    path: "/api/ai/gemini",
    label: "Gemini",
    model: "gpt-3.5-turbo",
    defaultSystem: "You are a helpful AI assistant. Respond clearly and accurately.",
  },
  {
    path: "/api/ai/deepseek",
    label: "DeepSeek",
    model: "gpt-3.5-turbo",
    defaultSystem: "You are a helpful AI assistant. Respond clearly and accurately.",
  },
  {
    path: "/api/ai/venice",
    label: "Venice",
    model: "gpt-3.5-turbo",
    defaultSystem: "You are a helpful AI assistant. Respond clearly and accurately.",
  },
  {
    path: "/api/ai/groq",
    label: "Groq",
    model: "gpt-3.5-turbo",
    defaultSystem: "You are a helpful AI assistant. Respond clearly and accurately.",
  },
  {
    path: "/api/ai/cohere",
    label: "Cohere",
    model: "gpt-3.5-turbo",
    defaultSystem: "You are a helpful AI assistant. Respond clearly and accurately.",
  },
];

export function registerAIRoutes(app: Express): void {
  for (const ep of chatEndpoints) {
    app.get(ep.path, (_req: Request, res: Response) => {
      return res.json({
        endpoint: ep.path,
        method: "POST",
        description: `${ep.label} AI Chat endpoint. Send a POST request with a JSON body.`,
        usage: {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: { prompt: "Your message here", system: "(optional) Custom system prompt" },
        },
        example: `curl -X POST ${ep.path} -H "Content-Type: application/json" -d '{"prompt":"Hello!"}'`,
      });
    });

    app.post(ep.path, async (req: Request, res: Response) => {
      const { prompt, system } = req.body;
      if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
        return res.status(400).json({ success: false, error: "Parameter 'prompt' is required." });
      }

      try {
        const systemPrompt = system || ep.defaultSystem;
        const text = await chatEverywhereProxy(prompt, systemPrompt);
        return res.json({
          success: true,
          creator: "APIs by Silent Wolf | A tech explorer",
          provider: "ChatEverywhere",
          model: ep.model,
          response: text,
        });
      } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message, provider: "ChatEverywhere" });
      }
    });
  }

  app.get("/api/ai/image/dall-e", (_req: Request, res: Response) => {
    return res.json({
      endpoint: "/api/ai/image/dall-e",
      method: "POST",
      description: "Image search endpoint. Send a POST request with a JSON body.",
      usage: {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: { prompt: "Image description" },
      },
      example: `curl -X POST /api/ai/image/dall-e -H "Content-Type: application/json" -d '{"prompt":"sunset ocean"}'`,
    });
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
        creator: "APIs by Silent Wolf | A tech explorer",
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
