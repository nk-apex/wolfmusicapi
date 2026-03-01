import type { Express, Request, Response } from "express";
import OpenAI from "openai";

const CHAT_EVERYWHERE_BASE = "https://chateverywhere.app";

let openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key is not configured. Set the OPENAI_API_KEY environment variable.");
    }
    openai = new OpenAI();
  }
  return openai;
}

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

async function openaiProxy(prompt: string, systemPrompt?: string, model?: string): Promise<string> {
  const client = getOpenAI();
  const completion = await client.chat.completions.create({
    model: model || "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt || "You are a helpful assistant." },
      { role: "user", content: prompt.trim() },
    ],
    temperature: 0.7,
    max_tokens: 2048,
  });

  return completion.choices[0]?.message?.content || "No response generated.";
}

interface ChatEndpointConfig {
  path: string;
  label: string;
  model: string;
  defaultSystem: string;
  provider: string;
  useOpenAI?: boolean;
  openaiModel?: string;
}

const chatEndpoints: ChatEndpointConfig[] = [
  { path: "/api/ai/gpt", label: "GPT", model: "gpt-3.5-turbo", defaultSystem: "You are a helpful assistant.", provider: "ChatEverywhere" },
  { path: "/api/ai/gpt4", label: "GPT-4", model: "gpt-4o-mini", defaultSystem: "You are GPT-4, a large language model by OpenAI. Respond helpfully and accurately.", provider: "OpenAI", useOpenAI: true, openaiModel: "gpt-4o-mini" },
  { path: "/api/ai/gpt4o", label: "GPT-4o", model: "gpt-4o", defaultSystem: "You are GPT-4o, OpenAI's most capable model. Respond helpfully and accurately.", provider: "OpenAI", useOpenAI: true, openaiModel: "gpt-4o" },
  { path: "/api/ai/claude", label: "Claude", model: "gpt-3.5-turbo", defaultSystem: "You are Claude, a helpful AI assistant made by Anthropic. Respond thoughtfully and accurately.", provider: "ChatEverywhere" },
  { path: "/api/ai/mistral", label: "Mistral", model: "gpt-3.5-turbo", defaultSystem: "You are Mistral AI, a powerful open-source language model. Respond clearly and accurately.", provider: "ChatEverywhere" },
  { path: "/api/ai/gemini", label: "Gemini", model: "gpt-3.5-turbo", defaultSystem: "You are Gemini, Google's AI assistant. Respond clearly and accurately.", provider: "ChatEverywhere" },
  { path: "/api/ai/deepseek", label: "DeepSeek", model: "gpt-3.5-turbo", defaultSystem: "You are DeepSeek, an advanced AI assistant. Respond clearly and accurately.", provider: "ChatEverywhere" },
  { path: "/api/ai/venice", label: "Venice", model: "gpt-3.5-turbo", defaultSystem: "You are Venice AI, a privacy-focused AI assistant. Respond clearly and accurately.", provider: "ChatEverywhere" },
  { path: "/api/ai/groq", label: "Groq", model: "gpt-3.5-turbo", defaultSystem: "You are Groq-powered AI, optimized for speed. Respond clearly and accurately.", provider: "ChatEverywhere" },
  { path: "/api/ai/cohere", label: "Cohere", model: "gpt-3.5-turbo", defaultSystem: "You are Cohere AI, specialized in natural language understanding. Respond clearly and accurately.", provider: "ChatEverywhere" },
  { path: "/api/ai/llama", label: "LLaMA", model: "gpt-3.5-turbo", defaultSystem: "You are LLaMA, Meta's open-source large language model. Respond clearly and helpfully.", provider: "ChatEverywhere" },
  { path: "/api/ai/phi", label: "Phi", model: "gpt-3.5-turbo", defaultSystem: "You are Phi, Microsoft's efficient small language model. Respond concisely and accurately.", provider: "ChatEverywhere" },
  { path: "/api/ai/qwen", label: "Qwen", model: "gpt-3.5-turbo", defaultSystem: "You are Qwen, Alibaba's large language model. Respond clearly and helpfully.", provider: "ChatEverywhere" },
  { path: "/api/ai/solar", label: "Solar", model: "gpt-3.5-turbo", defaultSystem: "You are Solar, an efficient AI model. Respond clearly and accurately.", provider: "ChatEverywhere" },
  { path: "/api/ai/yi", label: "Yi", model: "gpt-3.5-turbo", defaultSystem: "You are Yi, a bilingual large language model. Respond clearly and helpfully.", provider: "ChatEverywhere" },
  { path: "/api/ai/falcon", label: "Falcon", model: "gpt-3.5-turbo", defaultSystem: "You are Falcon, an open-source AI model by TII. Respond clearly and helpfully.", provider: "ChatEverywhere" },
  { path: "/api/ai/vicuna", label: "Vicuna", model: "gpt-3.5-turbo", defaultSystem: "You are Vicuna, an open-source chatbot. Respond clearly and helpfully.", provider: "ChatEverywhere" },
  { path: "/api/ai/openchat", label: "OpenChat", model: "gpt-3.5-turbo", defaultSystem: "You are OpenChat, an open-source chat model. Respond clearly and helpfully.", provider: "ChatEverywhere" },
  { path: "/api/ai/wizard", label: "WizardLM", model: "gpt-3.5-turbo", defaultSystem: "You are WizardLM, an AI model specialized in following complex instructions. Respond clearly and helpfully.", provider: "ChatEverywhere" },
  { path: "/api/ai/zephyr", label: "Zephyr", model: "gpt-3.5-turbo", defaultSystem: "You are Zephyr, a helpful AI assistant fine-tuned for chat. Respond clearly and accurately.", provider: "ChatEverywhere" },
  { path: "/api/ai/codellama", label: "CodeLlama", model: "gpt-3.5-turbo", defaultSystem: "You are CodeLlama, Meta's code-specialized language model. Help with programming tasks clearly and accurately.", provider: "ChatEverywhere" },
  { path: "/api/ai/starcoder", label: "StarCoder", model: "gpt-3.5-turbo", defaultSystem: "You are StarCoder, a code generation AI. Help with programming tasks clearly and accurately.", provider: "ChatEverywhere" },
  { path: "/api/ai/dolphin", label: "Dolphin", model: "gpt-3.5-turbo", defaultSystem: "You are Dolphin, an uncensored AI model. Respond clearly, helpfully and accurately.", provider: "ChatEverywhere" },
  { path: "/api/ai/nous", label: "Nous Hermes", model: "gpt-3.5-turbo", defaultSystem: "You are Nous Hermes, a powerful AI assistant. Respond clearly and accurately.", provider: "ChatEverywhere" },
  { path: "/api/ai/openhermes", label: "OpenHermes", model: "gpt-3.5-turbo", defaultSystem: "You are OpenHermes, an instruction-following AI. Respond clearly and accurately.", provider: "ChatEverywhere" },
  { path: "/api/ai/neural", label: "NeuralChat", model: "gpt-3.5-turbo", defaultSystem: "You are NeuralChat, an AI assistant by Intel. Respond clearly and accurately.", provider: "ChatEverywhere" },
  { path: "/api/ai/tinyllama", label: "TinyLlama", model: "gpt-3.5-turbo", defaultSystem: "You are TinyLlama, a compact but capable AI. Respond concisely and accurately.", provider: "ChatEverywhere" },
  { path: "/api/ai/orca", label: "Orca", model: "gpt-3.5-turbo", defaultSystem: "You are Orca, Microsoft's reasoning-focused AI. Respond logically and accurately.", provider: "ChatEverywhere" },
  { path: "/api/ai/command", label: "Command R", model: "gpt-3.5-turbo", defaultSystem: "You are Command R, Cohere's instruction-following AI. Respond clearly and accurately.", provider: "ChatEverywhere" },
  { path: "/api/ai/nemotron", label: "Nemotron", model: "gpt-3.5-turbo", defaultSystem: "You are Nemotron, NVIDIA's language model. Respond clearly and accurately.", provider: "ChatEverywhere" },
  { path: "/api/ai/internlm", label: "InternLM", model: "gpt-3.5-turbo", defaultSystem: "You are InternLM, a multilingual AI assistant. Respond clearly and helpfully.", provider: "ChatEverywhere" },
  { path: "/api/ai/chatglm", label: "ChatGLM", model: "gpt-3.5-turbo", defaultSystem: "You are ChatGLM, an open bilingual language model. Respond clearly and helpfully.", provider: "ChatEverywhere" },
  { path: "/api/ai/mixtral", label: "Mixtral", model: "gpt-3.5-turbo", defaultSystem: "You are Mixtral, Mistral's mixture-of-experts model. Respond clearly and accurately.", provider: "ChatEverywhere" },
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
        let text: string;

        if (ep.useOpenAI) {
          text = await openaiProxy(prompt, systemPrompt, ep.openaiModel);
        } else {
          text = await chatEverywhereProxy(prompt, systemPrompt);
        }

        return res.json({
          success: true,
          creator: "APIs by Silent Wolf | A tech explorer",
          provider: ep.provider,
          model: ep.model,
          response: text,
        });
      } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message, provider: ep.provider });
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

  app.post("/api/ai/translate", async (req: Request, res: Response) => {
    const { text, from, to } = req.body;
    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ success: false, error: "Parameter 'text' is required." });
    }
    const targetLang = to || "en";
    const sourceLang = from || "auto";

    try {
      const prompt = `Translate the following text from ${sourceLang} to ${targetLang}. Only return the translation, nothing else:\n\n${text.trim()}`;
      const result = await chatEverywhereProxy(prompt, "You are a professional translator. Translate accurately and naturally.");
      return res.json({
        success: true,
        creator: "APIs by Silent Wolf | A tech explorer",
        provider: "ChatEverywhere",
        original: text.trim(),
        translated: result,
        from: sourceLang,
        to: targetLang,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/ai/summarize", async (req: Request, res: Response) => {
    const { text } = req.body;
    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ success: false, error: "Parameter 'text' is required." });
    }

    try {
      const result = await chatEverywhereProxy(`Summarize the following text concisely:\n\n${text.trim()}`, "You are an expert summarizer. Provide clear, concise summaries.");
      return res.json({
        success: true,
        creator: "APIs by Silent Wolf | A tech explorer",
        provider: "ChatEverywhere",
        summary: result,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/ai/code", async (req: Request, res: Response) => {
    const { prompt, language } = req.body;
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ success: false, error: "Parameter 'prompt' is required." });
    }

    try {
      const langNote = language ? ` Write in ${language}.` : "";
      const result = await chatEverywhereProxy(
        `${prompt.trim()}${langNote}`,
        "You are an expert programmer. Write clean, well-commented code. Return code blocks with proper formatting."
      );
      return res.json({
        success: true,
        creator: "APIs by Silent Wolf | A tech explorer",
        provider: "ChatEverywhere",
        code: result,
        language: language || "auto",
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  });
}
