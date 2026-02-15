const RINODEPOT_BASE = "https://rinodepot.fr";
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const Y2MATE_HEADERS = {
  "User-Agent": USER_AGENT,
  "Referer": "https://v1.y2mate.nu/",
  "Origin": "https://v1.y2mate.nu",
};

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
  const pageRes = await fetch("https://v1.y2mate.nu/", {
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

  const initRes = await fetch(
    `https://eta.etacloud.org/api/v1/init?${paramChar}=${encodeURIComponent(auth)}&t=${ts()}`,
    { headers: Y2MATE_HEADERS }
  );
  const initData = await initRes.json();

  if (initData.error !== "0" && initData.error !== 0) {
    throw new Error("y2mate init failed: " + (initData.error || "unknown"));
  }

  let convertUrl = initData.convertURL;
  if (convertUrl.includes("&v=")) convertUrl = convertUrl.split("&v=")[0];
  convertUrl += `&v=${videoId}&f=${format}&t=${ts()}`;

  const convertRes = await fetch(convertUrl, { headers: Y2MATE_HEADERS });
  let data = await convertRes.json();

  if (data.redirect === 1 && data.redirectURL) {
    let rUrl = data.redirectURL;
    if (rUrl.includes("&v=")) rUrl = rUrl.split("&v=")[0];
    rUrl += `&v=${videoId}&f=${format}&t=${ts()}`;
    const rRes = await fetch(rUrl, { headers: Y2MATE_HEADERS });
    data = await rRes.json();
  }

  if (data.error && data.error !== "0" && data.error !== 0) {
    throw new Error("y2mate convert error: " + data.error);
  }

  let title = data.title || "";

  if (data.progressURL) {
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      const pRes = await fetch(data.progressURL + "&t=" + ts(), { headers: Y2MATE_HEADERS });
      const p = await pRes.json();
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

export async function searchSongs(query: string) {
  const res = await fetch(`${RINODEPOT_BASE}/search?q=${encodeURIComponent(query)}`, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
      Referer: RINODEPOT_BASE,
    },
  });

  if (!res.ok) {
    throw new Error(`Search failed with status ${res.status}`);
  }

  const data = await res.json();
  return {
    query: data.query || query,
    items: data.items || [],
  };
}

export async function checkVideo(videoId: string) {
  const res = await fetch(`${RINODEPOT_BASE}/check?q=${videoId}`, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
      Referer: RINODEPOT_BASE,
    },
  });

  if (!res.ok) {
    throw new Error(`Check failed with status ${res.status}`);
  }

  return await res.json();
}

export async function getDownloadInfo(url: string, format: "mp3" | "mp4" = "mp3") {
  const videoId = extractVideoId(url);
  if (!videoId) {
    return {
      success: false,
      error: "Invalid YouTube URL. Please provide a valid YouTube video URL.",
    };
  }

  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

  try {
    const result = await y2mateConvert(videoId, format);

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
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Failed to fetch download info: ${error.message}`,
      videoId,
    };
  }
}

export { extractVideoId };
