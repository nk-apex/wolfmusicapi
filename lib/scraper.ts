const RINODEPOT_BASE = "https://rinodepot.fr";
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

function extractVideoId(url: string): string | null {
  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /\/embed\/([a-zA-Z0-9_-]{11})/,
    /\/v\/([a-zA-Z0-9_-]{11})/,
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

async function fetchYtdownMedia(url: string): Promise<any> {
  const formData = new URLSearchParams();
  formData.append("url", url.trim());

  const res = await fetch("https://app.ytdown.to/proxy.php", {
    method: "POST",
    headers: {
      "User-Agent": USER_AGENT,
      "Origin": "https://app.ytdown.to",
      "Referer": "https://app.ytdown.to/en2/",
      "Accept": "*/*",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData.toString(),
  });

  return await res.json();
}

async function resolveDirectUrl(processingUrl: string): Promise<string | null> {
  const maxRetries = 5;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await fetch(processingUrl, {
        headers: {
          "User-Agent": USER_AGENT,
          "Accept": "application/json",
        },
      });
      if (!res.ok) return null;
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("json")) {
        const data = await res.json();
        if (data.status === "error") return null;
        if (data.fileUrl && !data.fileUrl.includes("Waiting")) return data.fileUrl;
        if (data.viewUrl && !data.viewUrl.includes("Waiting")) return data.viewUrl;
        if (data.status === "completed" && (data.fileUrl || data.viewUrl)) {
          return data.fileUrl || data.viewUrl;
        }
        if (data.status === "processing" || data.status === "waiting" || data.percent === "Waiting...") {
          await new Promise(r => setTimeout(r, 1500));
          continue;
        }
        if (data.url) return data.url;
        if (data.downloadUrl) return data.downloadUrl;
        return null;
      }
      return processingUrl;
    } catch {
      return null;
    }
  }
  return null;
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
    const data = await fetchYtdownMedia(youtubeUrl);

    if (!data.api || data.api.status?.toLowerCase() === "error") {
      return {
        success: false,
        error: data.api?.message || "Failed to process video.",
        videoId,
      };
    }

    const api = data.api;
    const items = api.mediaItems || api.medias || [];
    const title = api.title || "Unknown";

    let processingUrl: string | null = null;
    let fileSize: string | null = null;
    let quality: string | null = null;

    if (Array.isArray(items)) {
      if (format === "mp3") {
        const sorted = items
          .filter((m: any) => m.type === "Audio" && m.mediaUrl)
          .sort((a: any, b: any) => {
            const qa = parseInt(a.mediaQuality) || 0;
            const qb = parseInt(b.mediaQuality) || 0;
            return qb - qa;
          });
        const audioItem = sorted[0];
        if (audioItem) {
          processingUrl = audioItem.mediaUrl;
          fileSize = audioItem.mediaFileSize || null;
          quality = audioItem.mediaQuality || "128K";
        }
      } else {
        const videoItem = items.find((m: any) =>
          m.type === "Video" && m.mediaUrl && (m.mediaQuality === "HD" || m.mediaRes?.includes("720"))
        ) || items.find((m: any) => m.type === "Video" && m.mediaUrl);
        if (videoItem) {
          processingUrl = videoItem.mediaUrl;
          fileSize = videoItem.mediaFileSize || null;
          quality = videoItem.mediaQuality || "SD";
        }
      }
    }

    let downloadUrl: string | null = null;
    if (processingUrl) {
      downloadUrl = await resolveDirectUrl(processingUrl);
    }

    const thumbnail = api.imagePreviewUrl || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

    return {
      success: true,
      title,
      videoId,
      format,
      quality,
      fileSize,
      downloadUrl,
      thumbnail,
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
