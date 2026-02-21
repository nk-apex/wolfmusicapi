const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

interface FacebookResult {
  success: boolean;
  creator?: string;
  title?: string;
  sdUrl?: string;
  hdUrl?: string;
  thumbnail?: string;
  duration?: string;
  error?: string;
}

export async function downloadFacebook(url: string): Promise<FacebookResult> {
  try {
    const result = await tryFdownloader(url);
    if (result.success) return result;

    const result2 = await tryGetmyfb(url);
    if (result2.success) return result2;

    return {
      success: false,
      error: "Could not process this Facebook video URL. Make sure the video is public and the URL is correct.",
    };
  } catch (error: any) {
    return { success: false, error: `Facebook download failed: ${error.message}` };
  }
}

async function tryFdownloader(url: string): Promise<FacebookResult> {
  try {
    const res = await fetch("https://v3.fdownloader.net/api/ajaxSearch", {
      method: "POST",
      headers: {
        "User-Agent": USER_AGENT,
        "Content-Type": "application/x-www-form-urlencoded",
        "Origin": "https://fdownloader.net",
        "Referer": "https://fdownloader.net/",
      },
      body: new URLSearchParams({ q: url.trim(), lang: "en", country: "en" }).toString(),
    });

    const json = await res.json();

    if (json.status !== "ok" || !json.data) {
      return { success: false, error: "fdownloader returned no data" };
    }

    const html: string = json.data;

    const linkMatches: string[] = [];
    const linkRegex = /href=\\?"(https?:\/\/[^\\"\s]+)\\?"/gi;
    let lm;
    while ((lm = linkRegex.exec(html)) !== null) linkMatches.push(lm[1]);

    const downloadLinks = linkMatches.filter(l =>
      l.includes("snapcdn.app/download") || l.includes("fbcdn.net") || l.includes(".mp4")
    );

    if (downloadLinks.length === 0) {
      return { success: false, error: "No download links found" };
    }

    const thumbnailMatch = html.match(/src=\\?"(https?:\/\/[^\\"\s]+\.(?:jpg|png|jpeg)[^\\"\s]*)\\?"/i);
    const durationMatch = html.match(/<p[^>]*>(\d{1,2}:\d{2}(?::\d{2})?)<\/p>/i);
    const titleMatch = html.match(/<h3[^>]*>([^<]+)<\/h3>/i);

    let hdUrl: string | undefined;
    let sdUrl: string | undefined;

    for (const link of downloadLinks) {
      const decoded = link.replace(/\\"/g, '"');
      if (decoded.includes("720p") || decoded.includes("(HD)") || decoded.includes("1080p")) {
        if (!hdUrl) hdUrl = decoded;
      } else {
        if (!sdUrl) sdUrl = decoded;
      }
    }

    if (!hdUrl && !sdUrl) {
      sdUrl = downloadLinks[0].replace(/\\"/g, '"');
      hdUrl = downloadLinks[1]?.replace(/\\"/g, '"');
    }

    return {
      success: true,
      creator: "APIs by Silent Wolf | A tech explorer",
      title: titleMatch?.[1]?.trim() || "Facebook Video",
      sdUrl: sdUrl || hdUrl,
      hdUrl: hdUrl || sdUrl,
      thumbnail: thumbnailMatch?.[1]?.replace(/&amp;/g, "&") || undefined,
      duration: durationMatch?.[1] || undefined,
    };
  } catch {
    return { success: false, error: "fdownloader.net unavailable" };
  }
}

async function tryGetmyfb(url: string): Promise<FacebookResult> {
  try {
    const res = await fetch("https://getmyfb.com/process", {
      method: "POST",
      headers: {
        "User-Agent": USER_AGENT,
        "Content-Type": "application/x-www-form-urlencoded",
        "Origin": "https://getmyfb.com",
        "Referer": "https://getmyfb.com/",
      },
      body: new URLSearchParams({ id: url.trim(), locale: "en" }).toString(),
    });

    const html = await res.text();

    const allLinks: string[] = [];
    let m;
    const videoRegex = /href="(https?:\/\/[^"]*video[^"]*\.mp4[^"]*)"/gi;
    while ((m = videoRegex.exec(html)) !== null) allLinks.push(m[1]);
    const dlRegex = /href="(https?:\/\/[^"]+)"\s*[^>]*download/gi;
    while ((m = dlRegex.exec(html)) !== null) allLinks.push(m[1]);

    if (allLinks.length === 0) {
      const anyLinks: string[] = [];
      const fbRegex = /href="(https?:\/\/[^"]*(?:fbcdn|facebook|fb)[^"]*)"/gi;
      while ((m = fbRegex.exec(html)) !== null) anyLinks.push(m[1]);
      if (anyLinks.length === 0) {
        return { success: false, error: "No download links found from alternative service" };
      }
      return {
        success: true,
        creator: "APIs by Silent Wolf | A tech explorer",
        title: "Facebook Video",
        sdUrl: anyLinks[0],
        hdUrl: anyLinks[1] || undefined,
      };
    }

    return {
      success: true,
      creator: "APIs by Silent Wolf | A tech explorer",
      title: "Facebook Video",
      sdUrl: allLinks[0],
      hdUrl: allLinks[1] || undefined,
    };
  } catch {
    return { success: false, error: "Alternative service unavailable" };
  }
}
