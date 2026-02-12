const RINODEPOT_BASE = "https://rinodepot.fr";

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
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
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
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Accept: "application/json",
      Referer: RINODEPOT_BASE,
    },
  });

  if (!res.ok) {
    throw new Error(`Check failed with status ${res.status}`);
  }

  return await res.json();
}

async function tryGetDirectDownload(videoId: string, format: "mp3" | "mp4"): Promise<string | null> {
  try {
    const res = await fetch(`https://api.vevioz.com/api/button/${format}/${videoId}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Referer: "https://www.y2mate.com/",
      },
    });

    if (res.ok) {
      const html = await res.text();
      const urlMatch = html.match(/href="(https?:\/\/[^"]+\.(mp3|mp4|m4a)[^"]*)"/i);
      if (urlMatch) return urlMatch[1];

      const dlMatch = html.match(/href="(https?:\/\/[^"]*dl[^"]*)"/i);
      if (dlMatch) return dlMatch[1];
    }
  } catch {
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

  try {
    const videoInfo = await checkVideo(videoId);

    if (!videoInfo.found) {
      return {
        success: false,
        error: "Video not found or unavailable.",
        videoId,
      };
    }

    const title = videoInfo.items?.title || "Unknown";
    const channelTitle = videoInfo.items?.channelTitle || "Unknown";

    const downloadUrl = await tryGetDirectDownload(videoId, format);

    const downloadPage = `${RINODEPOT_BASE}/dl/${videoId}`;
    const converterUrl = `https://y2jar.cc/?id=${videoId}`;

    return {
      success: true,
      title,
      videoId,
      channelTitle,
      format,
      downloadUrl: downloadUrl || null,
      downloadPage,
      converterUrl,
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      thumbnailMq: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
      youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
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
