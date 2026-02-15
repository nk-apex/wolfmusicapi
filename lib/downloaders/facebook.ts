const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

interface FacebookResult {
  success: boolean;
  title?: string;
  sdUrl?: string;
  hdUrl?: string;
  thumbnail?: string;
  duration?: string;
  error?: string;
}

export async function downloadFacebook(url: string): Promise<FacebookResult> {
  try {
    const result = await tryFdownApi(url);
    if (result.success) return result;

    const result2 = await tryAlternativeApi(url);
    if (result2.success) return result2;

    return {
      success: false,
      error: "Could not process this Facebook video URL. Make sure the video is public and the URL is correct.",
    };
  } catch (error: any) {
    return { success: false, error: `Facebook download failed: ${error.message}` };
  }
}

async function tryFdownApi(url: string): Promise<FacebookResult> {
  try {
    const formData = new URLSearchParams();
    formData.append("URLz", url.trim());

    const res = await fetch("https://fdown.net/download.php", {
      method: "POST",
      headers: {
        "User-Agent": USER_AGENT,
        "Origin": "https://fdown.net",
        "Referer": "https://fdown.net/",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const html = await res.text();

    if (!html || html.includes("challenge-platform") || html.length < 100) {
      return { success: false, error: "Service temporarily unavailable" };
    }

    const sdMatch = html.match(/id="sdlink"\s*href="([^"]+)"/i) ||
                    html.match(/quality_sd[^"]*"[^"]*href="([^"]+)"/i) ||
                    html.match(/Normal\s*Quality[^"]*href="([^"]+)"/i);
    const hdMatch = html.match(/id="hdlink"\s*href="([^"]+)"/i) ||
                    html.match(/quality_hd[^"]*"[^"]*href="([^"]+)"/i) ||
                    html.match(/HD\s*Quality[^"]*href="([^"]+)"/i);
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);

    if (!sdMatch && !hdMatch) {
      return { success: false, error: "No download links found" };
    }

    return {
      success: true,
      title: titleMatch?.[1]?.trim() || "Facebook Video",
      sdUrl: sdMatch?.[1] || undefined,
      hdUrl: hdMatch?.[1] || undefined,
    };
  } catch {
    return { success: false, error: "fdown.net unavailable" };
  }
}

async function tryAlternativeApi(url: string): Promise<FacebookResult> {
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
        title: "Facebook Video",
        sdUrl: anyLinks[0],
        hdUrl: anyLinks[1] || undefined,
      };
    }

    return {
      success: true,
      title: "Facebook Video",
      sdUrl: allLinks[0],
      hdUrl: allLinks[1] || undefined,
    };
  } catch {
    return { success: false, error: "Alternative service unavailable" };
  }
}
