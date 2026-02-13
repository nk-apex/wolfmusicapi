import type { Express, Request, Response } from "express";

function makeOpenAICompatibleHandler(
  envKey: string,
  baseUrl: string,
  defaultModel: string,
  providerName: string
) {
  return async (req: Request, res: Response) => {
    const apiKey = process.env[envKey];
    if (!apiKey) {
      return res.status(503).json({
        success: false,
        error: `${providerName} API key not configured. Set ${envKey} in environment.`,
        provider: providerName,
      });
    }

    const { prompt, model = defaultModel } = req.body;
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ success: false, error: "Parameter 'prompt' is required." });
    }

    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt.trim() }],
          max_tokens: 2048,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        return res.status(response.status).json({ success: false, error: err, provider: providerName });
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || "";

      return res.json({
        success: true,
        provider: providerName,
        model: data.model || model,
        response: text,
        usage: data.usage || null,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message, provider: providerName });
    }
  };
}

export function registerAIRoutes(app: Express): void {
  app.post("/api/ai/gpt", makeOpenAICompatibleHandler(
    "OPENAI_API_KEY",
    "https://api.openai.com/v1",
    "gpt-4o-mini",
    "OpenAI"
  ));

  app.post("/api/ai/mistral", makeOpenAICompatibleHandler(
    "MISTRAL_API_KEY",
    "https://api.mistral.ai/v1",
    "mistral-small-latest",
    "Mistral AI"
  ));

  app.post("/api/ai/deepseek", makeOpenAICompatibleHandler(
    "DEEPSEEK_API_KEY",
    "https://api.deepseek.com/v1",
    "deepseek-chat",
    "DeepSeek"
  ));

  app.post("/api/ai/venice", makeOpenAICompatibleHandler(
    "VENICE_API_KEY",
    "https://api.venice.ai/api/v1",
    "llama-3.3-70b",
    "Venice"
  ));

  app.post("/api/ai/groq", makeOpenAICompatibleHandler(
    "GROQ_API_KEY",
    "https://api.groq.com/openai/v1",
    "llama-3.1-70b-versatile",
    "Groq"
  ));

  app.post("/api/ai/cohere", async (req: Request, res: Response) => {
    const apiKey = process.env.COHERE_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        success: false,
        error: "Cohere API key not configured. Set COHERE_API_KEY in environment.",
        provider: "Cohere",
      });
    }

    const { prompt, model = "command-r-plus" } = req.body;
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ success: false, error: "Parameter 'prompt' is required." });
    }

    try {
      const response = await fetch("https://api.cohere.ai/v1/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ model, message: prompt.trim() }),
      });

      if (!response.ok) {
        const err = await response.text();
        return res.status(response.status).json({ success: false, error: err, provider: "Cohere" });
      }

      const data = await response.json();
      return res.json({
        success: true,
        provider: "Cohere",
        model,
        response: data.text || "",
        usage: data.meta?.tokens || null,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message, provider: "Cohere" });
    }
  });

  app.post("/api/ai/claude", async (req: Request, res: Response) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        success: false,
        error: "Anthropic API key not configured. Set ANTHROPIC_API_KEY in environment.",
        provider: "Anthropic",
      });
    }

    const { prompt, model = "claude-3-5-sonnet-20241022" } = req.body;
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ success: false, error: "Parameter 'prompt' is required." });
    }

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: 2048,
          messages: [{ role: "user", content: prompt.trim() }],
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        return res.status(response.status).json({ success: false, error: err, provider: "Anthropic" });
      }

      const data = await response.json();
      const text = data.content?.[0]?.text || "";

      return res.json({
        success: true,
        provider: "Anthropic",
        model: data.model || model,
        response: text,
        usage: data.usage || null,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message, provider: "Anthropic" });
    }
  });

  app.post("/api/ai/gemini", async (req: Request, res: Response) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        success: false,
        error: "Gemini API key not configured. Set GEMINI_API_KEY in environment.",
        provider: "Google",
      });
    }

    const { prompt, model = "gemini-1.5-flash" } = req.body;
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ success: false, error: "Parameter 'prompt' is required." });
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt.trim() }] }],
          }),
        }
      );

      if (!response.ok) {
        const err = await response.text();
        return res.status(response.status).json({ success: false, error: err, provider: "Google" });
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

      return res.json({
        success: true,
        provider: "Google",
        model,
        response: text,
        usage: data.usageMetadata || null,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message, provider: "Google" });
    }
  });

  app.post("/api/ai/image/dall-e", async (req: Request, res: Response) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        success: false,
        error: "OpenAI API key not configured. Set OPENAI_API_KEY in environment.",
        provider: "OpenAI",
      });
    }

    const { prompt, size = "1024x1024" } = req.body;
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ success: false, error: "Parameter 'prompt' is required." });
    }

    try {
      const response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ model: "dall-e-3", prompt: prompt.trim(), n: 1, size }),
      });

      if (!response.ok) {
        const err = await response.text();
        return res.status(response.status).json({ success: false, error: err, provider: "OpenAI" });
      }

      const data = await response.json();
      return res.json({
        success: true,
        provider: "OpenAI",
        model: "dall-e-3",
        url: data.data?.[0]?.url || null,
        revised_prompt: data.data?.[0]?.revised_prompt || null,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message, provider: "OpenAI" });
    }
  });

  app.post("/api/ai/image/venice", async (req: Request, res: Response) => {
    const apiKey = process.env.VENICE_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        success: false,
        error: "Venice API key not configured. Set VENICE_API_KEY in environment.",
        provider: "Venice",
      });
    }

    const { prompt, model = "fluently-xl" } = req.body;
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ success: false, error: "Parameter 'prompt' is required." });
    }

    try {
      const response = await fetch("https://api.venice.ai/api/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ model, prompt: prompt.trim(), n: 1 }),
      });

      if (!response.ok) {
        const err = await response.text();
        return res.status(response.status).json({ success: false, error: err, provider: "Venice" });
      }

      const data = await response.json();
      return res.json({
        success: true,
        provider: "Venice",
        model,
        url: data.data?.[0]?.url || null,
        b64_json: data.data?.[0]?.b64_json || null,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message, provider: "Venice" });
    }
  });
}
