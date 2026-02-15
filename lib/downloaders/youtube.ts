const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

interface YouTubeMedia {
  type: string;
  quality: string;
  resolution?: string;
  format: string;
  fileSize: string;
  downloadUrl: string;
  duration?: string;
}

interface YouTubeResult {
  success: boolean;
  creator?: string;
  title?: string;
  description?: string;
  thumbnail?: string;
  duration?: string;
  videoId?: string;
  media?: YouTubeMedia[];
  error?: string;
}

async function resolveMediaUrl(processingUrl: string): Promise<string | null> {
  const maxRetries = 4;
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

export async function downloadYouTube(url: string): Promise<YouTubeResult> {
  try {
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

    const data = await res.json();

    if (!data.api || data.api.status?.toLowerCase() === "error") {
      return {
        success: false,
        error: data.api?.message || "Failed to process YouTube URL.",
      };
    }

    const api = data.api;
    const items = api.mediaItems || api.medias || [];

    const mediaPromises: Promise<YouTubeMedia | null>[] = [];
    if (Array.isArray(items)) {
      for (const m of items) {
        if (m.mediaUrl) {
          mediaPromises.push(
            resolveMediaUrl(m.mediaUrl).then(resolvedUrl => {
              if (!resolvedUrl) return null;
              return {
                type: m.type || "Video",
                quality: m.mediaQuality || "Unknown",
                resolution: m.mediaRes || undefined,
                format: m.mediaExtension || "MP4",
                fileSize: m.mediaFileSize || "Unknown",
                downloadUrl: resolvedUrl,
                duration: m.mediaDuration || undefined,
              };
            })
          );
        }
      }
    }

    const resolvedMedia = await Promise.all(mediaPromises);
    const media = resolvedMedia.filter((m): m is YouTubeMedia => m !== null);
    const thumbnail = api.imagePreviewUrl || items?.[0]?.mediaThumbnail;

    return {
      success: true,
      creator: "apis by Silent Wolf",
      title: api.title || "YouTube Video",
      description: api.description?.substring(0, 300) || undefined,
      thumbnail,
      duration: items?.[0]?.mediaDuration || undefined,
      videoId: api.id,
      media: media.length > 0 ? media : undefined,
    };
  } catch (error: any) {
    return { success: false, error: `YouTube download failed: ${error.message}` };
  }
}
