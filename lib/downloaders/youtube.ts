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
  title?: string;
  description?: string;
  thumbnail?: string;
  duration?: string;
  videoId?: string;
  media?: YouTubeMedia[];
  error?: string;
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
    const media: YouTubeMedia[] = [];
    const items = api.mediaItems || api.medias || [];

    if (Array.isArray(items)) {
      for (const m of items) {
        if (m.mediaUrl) {
          media.push({
            type: m.type || "Video",
            quality: m.mediaQuality || "Unknown",
            resolution: m.mediaRes || undefined,
            format: m.mediaExtension || "MP4",
            fileSize: m.mediaFileSize || "Unknown",
            downloadUrl: m.mediaUrl,
            duration: m.mediaDuration || undefined,
          });
        }
      }
    }

    const thumbnail = api.imagePreviewUrl || items?.[0]?.mediaThumbnail;

    return {
      success: true,
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
