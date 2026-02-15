const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

interface InstagramMedia {
  type: "image" | "video";
  url: string;
  thumbnail?: string;
}

interface InstagramResult {
  success: boolean;
  creator?: string;
  title?: string;
  username?: string;
  media?: InstagramMedia[];
  error?: string;
}

export async function downloadInstagram(url: string): Promise<InstagramResult> {
  try {
    const res = await fetch("https://fastdl.app/api/convert", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": USER_AGENT,
        "Origin": "https://fastdl.app",
        "Referer": "https://fastdl.app/en2",
        "Accept": "application/json",
      },
      body: JSON.stringify({ url: url.trim() }),
    });

    const data = await res.json();

    if (data.success === false || !data.url_list) {
      const res2 = await fetch("https://fastdl.app/api/convert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": USER_AGENT,
          "Origin": "https://fastdl.app",
          "Referer": "https://fastdl.app/en2",
          "Accept": "application/json",
        },
        body: JSON.stringify({ sf_url: url.trim() }),
      });

      const data2 = await res2.json();

      if (data2.success === false && !data2.url_list) {
        return {
          success: false,
          error: data2.message || data.message || "Could not process this Instagram URL. Make sure the post is public.",
        };
      }

      return parseInstagramResponse(data2);
    }

    return parseInstagramResponse(data);
  } catch (error: any) {
    return { success: false, error: `Instagram download failed: ${error.message}` };
  }
}

function parseInstagramResponse(data: any): InstagramResult {
  const media: InstagramMedia[] = [];

  if (data.url_list && Array.isArray(data.url_list)) {
    for (const item of data.url_list) {
      if (typeof item === "string") {
        const isVideo = item.includes(".mp4") || item.includes("video");
        media.push({
          type: isVideo ? "video" : "image",
          url: item,
        });
      } else if (item.url) {
        media.push({
          type: item.type || (item.url.includes(".mp4") ? "video" : "image"),
          url: item.url,
          thumbnail: item.thumbnail,
        });
      }
    }
  }

  if (media.length === 0 && data.url) {
    media.push({
      type: data.url.includes(".mp4") ? "video" : "image",
      url: data.url,
    });
  }

  if (media.length === 0) {
    return {
      success: false,
      error: "No downloadable media found. The post may be private or the URL is invalid.",
    };
  }

  return {
    success: true,
    creator: "apis by Silent Wolf",
    title: data.meta?.title || data.title || "Instagram Media",
    username: data.meta?.source_url?.match(/@?([a-zA-Z0-9_.]+)/)?.[1] || data.username,
    media,
  };
}
