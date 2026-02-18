import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const RINODEPOT_BASE = "https://rinodepot.fr";
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const Y2MATE_HEADERS = {
  "User-Agent": USER_AGENT,
  "Referer": "https://v1.y2mate.nu/",
  "Origin": "https://v1.y2mate.nu",
};

async function safeJsonParse(res: Response, label: string): Promise<any> {
  const text = await res.text();
  if (!text || text.trim().length === 0) {
    throw new Error(`${label}: Empty response (status ${res.status})`);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${label}: Invalid JSON response (status ${res.status})`);
  }
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 15000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

function extractVideoId(url: string): string | null {
  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /\/embed\/([a-zA-Z0-9_-]{11})/,
    /\/v\/([a-zA-Z0-9_-]{11})/,
    /\/shorts\/([a-zA-Z0-9_-]{11})/,
    /\/live\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return url;
  }

  return null;
}

async function fetchY2MateAuth(): Promise<{ auth: string; paramChar: string; json: any }> {
  const pageRes = await fetchWithTimeout("https://v1.y2mate.nu/", {
    headers: { "User-Agent": USER_AGENT },
  });
  const html = await pageRes.text();

  const jsonMatch = html.match(/var json\s*=\s*JSON\.parse\('([^']+)'\)/);
  if (!jsonMatch) throw new Error("Failed to extract y2mate auth config");

  const json = JSON.parse(jsonMatch[1]);

  let auth = "";
  for (let t = 0; t < json[0].length; t++) {
    auth += String.fromCharCode(json[0][t] - json[2][json[2].length - (t + 1)]);
  }
  if (json[1]) auth = auth.split("").reverse().join("");
  if (auth.length > 32) auth = auth.substring(0, 32);

  const paramChar = String.fromCharCode(json[6]);

  return { auth, paramChar, json };
}

async function y2mateConvert(videoId: string, format: "mp3" | "mp4"): Promise<{
  downloadUrl: string;
  title: string;
}> {
  const { auth, paramChar } = await fetchY2MateAuth();
  const ts = () => Math.floor(Date.now() / 1000);

  const initRes = await fetchWithTimeout(
    `https://eta.etacloud.org/api/v1/init?${paramChar}=${encodeURIComponent(auth)}&t=${ts()}`,
    { headers: Y2MATE_HEADERS }
  );
  const initData = await safeJsonParse(initRes, "y2mate init");

  if (initData.error !== "0" && initData.error !== 0) {
    throw new Error("y2mate init failed: " + (initData.error || "unknown"));
  }

  let convertUrl = initData.convertURL;
  if (convertUrl.includes("&v=")) convertUrl = convertUrl.split("&v=")[0];
  convertUrl += `&v=${videoId}&f=${format}&t=${ts()}`;

  const convertRes = await fetchWithTimeout(convertUrl, { headers: Y2MATE_HEADERS });
  let data = await safeJsonParse(convertRes, "y2mate convert");

  if (data.redirect === 1 && data.redirectURL) {
    let rUrl = data.redirectURL;
    if (rUrl.includes("&v=")) rUrl = rUrl.split("&v=")[0];
    rUrl += `&v=${videoId}&f=${format}&t=${ts()}`;
    const rRes = await fetchWithTimeout(rUrl, { headers: Y2MATE_HEADERS });
    data = await safeJsonParse(rRes, "y2mate redirect");
  }

  if (data.error && data.error !== "0" && data.error !== 0) {
    throw new Error("y2mate convert error: " + data.error);
  }

  let title = data.title || "";

  if (data.progressURL) {
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      const pRes = await fetchWithTimeout(data.progressURL + "&t=" + ts(), { headers: Y2MATE_HEADERS });
      const p = await safeJsonParse(pRes, "y2mate progress");
      if (p.title) title = p.title;
      if (p.error && p.error !== 0 && p.error !== "0") {
        throw new Error("Conversion error: " + p.error);
      }
      if (p.progress >= 3 || p.progress === "completed") {
        if (p.url) {
          return { downloadUrl: p.url + `&s=3&v=${videoId}&f=${format}`, title };
        }
        break;
      }
    }
  }

  if (data.downloadURL) {
    return {
      downloadUrl: data.downloadURL + `&s=3&v=${videoId}&f=${format}`,
      title,
    };
  }

  throw new Error("Conversion timed out or no download URL received.");
}

const COBALT_INSTANCES = [
  "https://cobalt-api.ayo.tf",
  "https://cobalt.api.timelessnesses.me",
  "https://api.cobalt.tools",
];

async function cobaltConvert(videoId: string, format: "mp3" | "mp4"): Promise<{
  downloadUrl: string;
  title: string;
}> {
  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const errors: string[] = [];

  for (const instance of COBALT_INSTANCES) {
    try {
      const body: any = {
        url: youtubeUrl,
      };
      if (format === "mp3") {
        body.downloadMode = "audio";
        body.audioFormat = "mp3";
      } else {
        body.downloadMode = "auto";
      }

      const res = await fetchWithTimeout(instance, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "User-Agent": USER_AGENT,
        },
        body: JSON.stringify(body),
      }, 20000);

      const data = await safeJsonParse(res, `cobalt (${instance})`);

      if (data.status === "error" || data.status === "rate-limit") {
        errors.push(`${instance}: ${data.error?.code || data.text || "error"}`);
        continue;
      }

      const dlUrl = data.url || data.audio;
      if (dlUrl) {
        return {
          downloadUrl: dlUrl,
          title: data.filename || `video_${videoId}`,
        };
      }

      errors.push(`${instance}: No download URL in response`);
    } catch (e: any) {
      errors.push(`${instance}: ${e.message}`);
    }
  }

  throw new Error(`All Cobalt instances failed: ${errors.join("; ")}`);
}

async function veviozConvert(videoId: string, format: "mp3" | "mp4"): Promise<{
  downloadUrl: string;
  title: string;
}> {
  const endpoint = format === "mp3"
    ? `https://api.vevioz.com/api/button/mp3/${videoId}`
    : `https://api.vevioz.com/api/button/mp4/${videoId}`;

  const res = await fetchWithTimeout(endpoint, {
    headers: {
      "User-Agent": USER_AGENT,
      "Accept": "text/html",
    },
  }, 15000);

  const html = await res.text();

  const urlMatch = html.match(/href="(https?:\/\/[^"]+\.(?:mp3|mp4|m4a)[^"]*)"/i)
    || html.match(/href="(https?:\/\/dl[^"]+)"/i)
    || html.match(/href="(https?:\/\/[^"]*download[^"]*)"/i);

  if (!urlMatch) {
    throw new Error("Vevioz: Could not extract download URL from response");
  }

  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].replace(/\s*-\s*vevioz.*$/i, "").trim() : `video_${videoId}`;

  return {
    downloadUrl: urlMatch[1],
    title,
  };
}

export async function searchSongs(query: string) {
  const res = await fetchWithTimeout(`${RINODEPOT_BASE}/search?q=${encodeURIComponent(query)}`, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
      Referer: RINODEPOT_BASE,
    },
  });

  if (!res.ok) {
    throw new Error(`Search failed with status ${res.status}`);
  }

  const data = await safeJsonParse(res, "search");
  return {
    query: data.query || query,
    items: data.items || [],
  };
}

export async function checkVideo(videoId: string) {
  const res = await fetchWithTimeout(`${RINODEPOT_BASE}/check?q=${videoId}`, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
      Referer: RINODEPOT_BASE,
    },
  });

  if (!res.ok) {
    throw new Error(`Check failed with status ${res.status}`);
  }

  return await safeJsonParse(res, "checkVideo");
}

async function ytdlpConvert(videoId: string, format: "mp3" | "mp4"): Promise<{
  downloadUrl: string;
  title: string;
}> {
  if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    throw new Error("yt-dlp: Invalid video ID");
  }

  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

  const formatArg = format === "mp3"
    ? `"bestaudio[ext=m4a]/bestaudio"`
    : `"best[height<=480][ext=mp4]/best[ext=mp4]/best"`;

  const { stdout } = await execAsync(
    `yt-dlp --no-warnings --print title -f ${formatArg} -g "${youtubeUrl}" 2>/dev/null`,
    { timeout: 20000 }
  );

  const lines = stdout.trim().split("\n").filter(l => l.trim());

  if (lines.length < 2) {
    throw new Error("yt-dlp: Could not extract download URL");
  }

  const title = lines[0] || `video_${videoId}`;
  const downloadUrl = lines[1];

  if (!downloadUrl || !downloadUrl.startsWith("http")) {
    throw new Error("yt-dlp: No valid download URL returned");
  }

  return { downloadUrl, title };
}

type ConvertProvider = {
  name: string;
  fn: (videoId: string, format: "mp3" | "mp4") => Promise<{ downloadUrl: string; title: string }>;
};

const providers: ConvertProvider[] = [
  { name: "y2mate", fn: y2mateConvert },
  { name: "cobalt", fn: cobaltConvert },
  { name: "vevioz", fn: veviozConvert },
  { name: "ytdlp", fn: ytdlpConvert },
];

export async function getDownloadInfo(url: string, format: "mp3" | "mp4" = "mp3") {
  const videoId = extractVideoId(url);
  if (!videoId) {
    return {
      success: false,
      error: "Invalid YouTube URL. Please provide a valid YouTube video URL.",
    };
  }

  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const errors: string[] = [];

  for (const provider of providers) {
    try {
      console.log(`[scraper] Trying provider: ${provider.name} for ${videoId} (${format})`);
      const result = await provider.fn(videoId, format);

      return {
        success: true,
        title: result.title || "Unknown",
        videoId,
        format,
        quality: format === "mp3" ? "192kbps" : "360p",
        downloadUrl: result.downloadUrl,
        thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        thumbnailMq: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
        youtubeUrl,
        provider: provider.name,
      };
    } catch (error: any) {
      console.log(`[scraper] Provider ${provider.name} failed: ${error.message}`);
      errors.push(`${provider.name}: ${error.message}`);
    }
  }

  return {
    success: false,
    error: `All download providers failed. ${errors.join(" | ")}`,
    videoId,
  };
}

export { extractVideoId };
