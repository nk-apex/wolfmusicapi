const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

interface TikTokResult {
  success: boolean;
  creator?: string;
  title?: string;
  author?: string;
  videoUrl?: string;
  videoUrlNoWatermark?: string;
  audioUrl?: string;
  thumbnail?: string;
  error?: string;
}

async function getToken(): Promise<{ tt: string; furl: string }> {
  const res = await fetch("https://ssstik.io/en-1", {
    headers: { "User-Agent": USER_AGENT },
  });
  const html = await res.text();

  const ttMatch = html.match(/s_tt\s*=\s*'([^']+)'/);
  const furlMatch = html.match(/s_furl\s*=\s*'([^']+)'/);

  return {
    tt: ttMatch?.[1] || "",
    furl: furlMatch?.[1] || "abc",
  };
}

export async function downloadTikTok(url: string): Promise<TikTokResult> {
  try {
    const { tt, furl } = await getToken();

    if (!tt) {
      return { success: false, error: "Failed to get session token from TikTok downloader service" };
    }

    const formData = new URLSearchParams();
    formData.append("id", url.trim());
    formData.append("locale", "en");
    formData.append("tt", tt);

    const res = await fetch(`https://ssstik.io/${furl}?url=dl`, {
      method: "POST",
      headers: {
        "User-Agent": USER_AGENT,
        "Origin": "https://ssstik.io",
        "Referer": "https://ssstik.io/en-1",
        "HX-Request": "true",
        "HX-Target": "target",
        "HX-Current-URL": "https://ssstik.io/en-1",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const html = await res.text();

    if (html.includes("error") && html.includes("invalid")) {
      return { success: false, error: "Invalid TikTok URL. Please provide a valid TikTok video link." };
    }

    const links: string[] = [];
    let linkMatch;
    const linkRegex = /href="(https?:\/\/[^"]+)"/g;
    while ((linkMatch = linkRegex.exec(html)) !== null) {
      links.push(linkMatch[1]);
    }
    const titleMatch = html.match(/<p[^>]*class="[^"]*maintext[^"]*"[^>]*>([^<]+)/i) ||
                       html.match(/<strong[^>]*class="[^"]*maintext[^"]*"[^>]*>([^<]+)/i) ||
                       html.match(/<p[^>]*>([^<]{10,100})<\/p>/);
    const authorMatch = html.match(/@([a-zA-Z0-9_.]+)/);

    const videoUrl = links.find(l => l.includes("tikcdn") && !l.includes("/m/")) || links[0];
    const videoNoWm = links.find(l => l.includes("tikcdn") && l.includes("/m/"));
    const audioUrl = links.find(l => l.includes("music") || l.includes("mp3") || l.includes("audio"));

    if (!videoUrl) {
      return { success: false, error: "Could not extract download links. The video may be private or unavailable." };
    }

    return {
      success: true,
      creator: "apis by Silent Wolf",
      title: titleMatch?.[1]?.trim() || "TikTok Video",
      author: authorMatch?.[1] || undefined,
      videoUrl,
      videoUrlNoWatermark: videoNoWm || videoUrl,
      audioUrl: audioUrl || undefined,
    };
  } catch (error: any) {
    return { success: false, error: `TikTok download failed: ${error.message}` };
  }
}
