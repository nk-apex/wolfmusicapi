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

async function ytdlpConvert(videoId: string, format: "mp3" | "mp4"): Promise<{
  downloadUrl: string;
  title: string;
}> {
  if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    throw new Error("yt-dlp: Invalid video ID");
  }

  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

  const formatArg = format === "mp3"
    ? "bestaudio[ext=m4a]/bestaudio"
    : "best[height<=480][ext=mp4]/best[ext=mp4]/best";

  const { stdout } = await execAsync(
    `yt-dlp --no-warnings --print title -f "${formatArg}" -g "${youtubeUrl}" 2>/dev/null`,
    { timeout: 30000 }
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

let y2mateAuthCache: { auth: string; paramChar: string; expiresAt: number } | null = null;

async function fetchY2MateAuth(): Promise<{ auth: string; paramChar: string }> {
  if (y2mateAuthCache && Date.now() < y2mateAuthCache.expiresAt) {
    return { auth: y2mateAuthCache.auth, paramChar: y2mateAuthCache.paramChar };
  }

  const pageRes = await fetchWithTimeout("https://v1.y2mate.nu/", {
    headers: { "User-Agent": USER_AGENT },
  }, 10000);
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

  y2mateAuthCache = { auth, paramChar, expiresAt: Date.now() + 4 * 60 * 1000 };

  return { auth, paramChar };
}

async function y2mateConvert(videoId: string, format: "mp3" | "mp4"): Promise<{
  downloadUrl: string;
  title: string;
}> {
  const { auth, paramChar } = await fetchY2MateAuth();
  const ts = () => Math.floor(Date.now() / 1000);

  const initRes = await fetchWithTimeout(
    `https://eta.etacloud.org/api/v1/init?${paramChar}=${encodeURIComponent(auth)}&t=${ts()}`,
    { headers: Y2MATE_HEADERS },
    10000
  );

  if (initRes.status === 429) {
    y2mateAuthCache = null;
    throw new Error("y2mate rate limited (429)");
  }

  const initData = await safeJsonParse(initRes, "y2mate init");

  if (initData.error !== "0" && initData.error !== 0) {
    throw new Error("y2mate init failed: " + (initData.error || "unknown"));
  }

  let convertUrl = initData.convertURL;
  if (convertUrl.includes("&v=")) convertUrl = convertUrl.split("&v=")[0];
  convertUrl += `&v=${videoId}&f=${format}&t=${ts()}`;

  const convertRes = await fetchWithTimeout(convertUrl, { headers: Y2MATE_HEADERS }, 15000);

  if (convertRes.status === 429) {
    y2mateAuthCache = null;
    throw new Error("y2mate convert rate limited (429)");
  }

  let data = await safeJsonParse(convertRes, "y2mate convert");

  if (data.redirect === 1 && data.redirectURL) {
    let rUrl = data.redirectURL;
    if (rUrl.includes("&v=")) rUrl = rUrl.split("&v=")[0];
    rUrl += `&v=${videoId}&f=${format}&t=${ts()}`;
    const rRes = await fetchWithTimeout(rUrl, { headers: Y2MATE_HEADERS }, 15000);
    data = await safeJsonParse(rRes, "y2mate redirect");
  }

  if (data.error && data.error !== "0" && data.error !== 0) {
    throw new Error("y2mate convert error: " + data.error);
  }

  let title = data.title || "";

  if (data.progressURL) {
    for (let i = 0; i < 15; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const pRes = await fetchWithTimeout(data.progressURL + "&t=" + ts(), { headers: Y2MATE_HEADERS }, 10000);
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

async function veviozConvert(videoId: string, format: "mp3" | "mp4"): Promise<{
  downloadUrl: string;
  title: string;
}> {
  const endpoints = [
    format === "mp3"
      ? `https://api.vevioz.com/api/button/mp3/${videoId}`
      : `https://api.vevioz.com/api/button/mp4/${videoId}`,
    format === "mp3"
      ? `https://api.vevioz.com/api/widget/mp3/${videoId}`
      : `https://api.vevioz.com/api/widget/mp4/${videoId}`,
  ];

  for (const endpoint of endpoints) {
    try {
      const res = await fetchWithTimeout(endpoint, {
        headers: {
          "User-Agent": USER_AGENT,
          "Accept": "text/html",
        },
      }, 12000);

      if (!res.ok) continue;

      const html = await res.text();

      const urlMatch = html.match(/href="(https?:\/\/[^"]+\.(?:mp3|mp4|m4a)[^"]*)"/i)
        || html.match(/href="(https?:\/\/dl[^"]+)"/i)
        || html.match(/href="(https?:\/\/[^"]*download[^"]*)"/i);

      if (!urlMatch) continue;

      const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].replace(/\s*-\s*vevioz.*$/i, "").trim() : `video_${videoId}`;

      return {
        downloadUrl: urlMatch[1],
        title,
      };
    } catch {
      continue;
    }
  }

  throw new Error("Vevioz: All endpoints failed");
}

const COBALT_INSTANCES = [
  "https://cobalt-backend.canine.tools",
  "https://cobalt-api.kwiatekmiki.com",
  "https://co.eepy.today",
  "https://cobalt.dark-dragon.digital",
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
        body.videoQuality = "480";
      }

      const res = await fetchWithTimeout(instance, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "User-Agent": USER_AGENT,
        },
        body: JSON.stringify(body),
      }, 15000);

      if (res.status === 429 || res.status === 403 || res.status === 401) {
        errors.push(`${instance}: status ${res.status}`);
        continue;
      }

      if (res.status >= 500) {
        errors.push(`${instance}: server error ${res.status}`);
        continue;
      }

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

      if (data.status === "tunnel" && data.url) {
        return {
          downloadUrl: data.url,
          title: data.filename || `video_${videoId}`,
        };
      }

      if (data.status === "redirect" && data.url) {
        return {
          downloadUrl: data.url,
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

async function saveFromConvert(videoId: string, format: "mp3" | "mp4"): Promise<{
  downloadUrl: string;
  title: string;
}> {
  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

  const res = await fetchWithTimeout("https://worker.sf-tools.com/savefrom.php", {
    method: "POST",
    headers: {
      "User-Agent": USER_AGENT,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json, text/javascript, */*; q=0.01",
      Origin: "https://en.savefrom.net",
      Referer: "https://en.savefrom.net/",
    },
    body: new URLSearchParams({
      sf_url: youtubeUrl,
      sf_submit: "",
      new: "2",
      lang: "en",
      app: "",
      country: "en",
      os: "Windows",
      browser: "Chrome",
      channel: "main",
      sf_page: "https://en.savefrom.net/",
    }).toString(),
  }, 15000);

  const text = await res.text();
  if (!text || text.trim().length === 0) {
    throw new Error("SaveFrom: empty response");
  }

  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("SaveFrom: invalid JSON");
  }

  if (Array.isArray(data) && data.length > 0) {
    const item = data[0];
    if (item.url) {
      const title = item.meta?.title || item.title || `video_${videoId}`;

      if (format === "mp3" && item.url_audio) {
        return { downloadUrl: item.url_audio, title };
      }

      if (item.url) {
        return { downloadUrl: item.url, title };
      }
    }

    if (item.hosting === "youtube" && item.sd?.url) {
      return { downloadUrl: format === "mp3" && item.audio?.url ? item.audio.url : item.sd.url, title: item.meta?.title || `video_${videoId}` };
    }
  }

  if (data.url) {
    return { downloadUrl: data.url, title: data.meta?.title || `video_${videoId}` };
  }

  throw new Error("SaveFrom: no download URL found");
}

async function cnvmp3Convert(videoId: string, format: "mp3" | "mp4"): Promise<{
  downloadUrl: string;
  title: string;
}> {
  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

  const res = await fetchWithTimeout(`https://api.cnvmp3.com/fetch?url=${encodeURIComponent(youtubeUrl)}`, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
      Origin: "https://cnvmp3.com",
      Referer: "https://cnvmp3.com/",
    },
  }, 15000);

  if (!res.ok) {
    throw new Error(`cnvmp3: status ${res.status}`);
  }

  const data = await safeJsonParse(res, "cnvmp3");

  if (data.error) {
    throw new Error(`cnvmp3: ${data.error}`);
  }

  const title = data.title || data.meta?.title || `video_${videoId}`;

  if (format === "mp3") {
    const audioUrl = data.audio_url || data.url?.audio || data.links?.audio;
    if (audioUrl) return { downloadUrl: audioUrl, title };
  }

  const videoUrl = data.video_url || data.url?.video || data.links?.video || data.url;
  if (videoUrl && typeof videoUrl === "string") {
    return { downloadUrl: videoUrl, title };
  }

  throw new Error("cnvmp3: no download URL in response");
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

type ConvertProvider = {
  name: string;
  fn: (videoId: string, format: "mp3" | "mp4") => Promise<{ downloadUrl: string; title: string }>;
};

const providers: ConvertProvider[] = [
  { name: "ytdlp", fn: ytdlpConvert },
  { name: "y2mate", fn: y2mateConvert },
  { name: "cobalt", fn: cobaltConvert },
  { name: "vevioz", fn: veviozConvert },
  { name: "savefrom", fn: saveFromConvert },
  { name: "cnvmp3", fn: cnvmp3Convert },
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

      const isHlsOrM4a = result.downloadUrl.includes(".m3u8") || result.downloadUrl.includes("manifest");
      const audioQuality = isHlsOrM4a ? "128kbps (HLS stream)" : "192kbps";

      return {
        success: true,
        title: result.title || "Unknown",
        videoId,
        format,
        quality: format === "mp3" ? audioQuality : "360p",
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
