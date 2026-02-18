const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const MOBILE_UA =
  "Mozilla/5.0 (Linux; Android 11; SAMSUNG SM-G973U) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/14.2 Chrome/87.0.4280.141 Mobile Safari/537.36";

interface InstagramMedia {
  type: "image" | "video";
  url: string;
  thumbnail?: string;
  quality?: string;
}

interface InstagramResult {
  success: boolean;
  creator?: string;
  title?: string;
  username?: string;
  media?: InstagramMedia[];
  duration?: number;
  error?: string;
  provider?: string;
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 15000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function extractShortcode(url: string): string | null {
  const patterns = [
    /instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/,
    /instagram\.com\/stories\/[^/]+\/(\d+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function buildGraphQLBody(shortcode: string): string {
  const params: Record<string, string> = {
    av: "0",
    __d: "www",
    __user: "0",
    __a: "1",
    __req: "b",
    __hs: "20183.HYP:instagram_web_pkg.2.1...0",
    dpr: "3",
    __ccg: "GOOD",
    __rev: "1021613311",
    __s: "hm5eih:ztapmw:x0losd",
    __hsi: "7489787314313612244",
    __dyn:
      "7xeUjG1mxu1syUbFp41twpUnwgU7SbzEdF8aUco2qwJw5ux609vCwjE1EE2Cw8G11wBz81s8hwGxu786a3a1YwBgao6C0Mo2swtUd8-U2zxe2GewGw9a361qw8Xxm16wa-0oa2-azo7u3C2u2J0bS1LwTwKG1pg2fwxyo6O1FwlA3a3zhA6bwIxe6V8aUuwm8jwhU3cyVrDyo",
    __csr: "",
    __comet_req: "7",
    lsd: "AVrqPT0gJDo",
    jazoest: "2946",
    __spin_r: "1021613311",
    __spin_b: "trunk",
    __spin_t: "1743852001",
    __crn: "comet.igweb.PolarisPostRoute",
    fb_api_caller_class: "RelayModern",
    fb_api_req_friendly_name: "PolarisPostActionLoadPostQueryQuery",
    variables: JSON.stringify({
      shortcode,
      fetch_tagged_user_count: null,
      hoisted_comment_id: null,
      hoisted_reply_id: null,
    }),
    server_timestamps: "true",
    doc_id: "8845758582119845",
  };

  return new URLSearchParams(params).toString();
}

async function tryGraphQLApi(shortcode: string): Promise<InstagramResult> {
  try {
    const res = await fetchWithTimeout("https://www.instagram.com/graphql/query", {
      method: "POST",
      headers: {
        "User-Agent": MOBILE_UA,
        Accept: "*/*",
        "Accept-Language": "en-US,en;q=0.5",
        "Content-Type": "application/x-www-form-urlencoded",
        "X-FB-Friendly-Name": "PolarisPostActionLoadPostQueryQuery",
        "X-BLOKS-VERSION-ID":
          "0d99de0d13662a50e0958bcb112dd651f70dea02e1859073ab25f8f2a477de96",
        "X-CSRFToken": "uy8OpI1kndx4oUHjlHaUfu",
        "X-IG-App-ID": "1217981644879628",
        "X-FB-LSD": "AVrqPT0gJDo",
        "X-ASBD-ID": "359341",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        Referer: `https://www.instagram.com/p/${shortcode}/`,
      },
      body: buildGraphQLBody(shortcode),
    });

    if (res.status === 429 || res.status === 401) {
      return { success: false, error: "Rate limited by Instagram" };
    }

    if (!res.ok) {
      return { success: false, error: `Instagram returned status ${res.status}` };
    }

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("json")) {
      return { success: false, error: "Instagram returned non-JSON response" };
    }

    const data = await res.json();
    const mediaData = data?.data?.xdt_shortcode_media;

    if (!mediaData) {
      return { success: false, error: "Post not found or is private" };
    }

    const media: InstagramMedia[] = [];

    if (mediaData.is_video && mediaData.video_url) {
      media.push({
        type: "video",
        url: mediaData.video_url,
        thumbnail: mediaData.thumbnail_src || mediaData.display_url,
        quality: mediaData.dimensions
          ? `${mediaData.dimensions.width}x${mediaData.dimensions.height}`
          : undefined,
      });
    } else if (mediaData.display_url) {
      media.push({
        type: "image",
        url: mediaData.display_url,
        thumbnail: mediaData.thumbnail_src,
      });
    }

    if (
      mediaData.edge_sidecar_to_children?.edges &&
      Array.isArray(mediaData.edge_sidecar_to_children.edges)
    ) {
      for (const edge of mediaData.edge_sidecar_to_children.edges) {
        const node = edge.node;
        if (node?.is_video && node?.video_url) {
          media.push({
            type: "video",
            url: node.video_url,
            thumbnail: node.display_url,
          });
        } else if (node?.display_url) {
          media.push({
            type: "image",
            url: node.display_url,
          });
        }
      }
    }

    if (media.length === 0) {
      return { success: false, error: "No downloadable media found in this post" };
    }

    return {
      success: true,
      creator: "apis by Silent Wolf",
      provider: "graphql",
      title: mediaData.title || mediaData.edge_media_to_caption?.edges?.[0]?.node?.text?.substring(0, 100) || "Instagram Media",
      username: mediaData.owner?.username,
      media,
      duration: mediaData.video_duration || undefined,
    };
  } catch {
    return { success: false, error: "GraphQL request failed" };
  }
}

async function trySnapSaveApi(url: string): Promise<InstagramResult> {
  try {
    const res = await fetchWithTimeout("https://snapsave.app/action.php?lang=en", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": USER_AGENT,
        Origin: "https://snapsave.app",
        Referer: "https://snapsave.app/",
      },
      body: new URLSearchParams({ url: url.trim() }).toString(),
    });

    const responseText = await res.text();

    const evalMatch = responseText.match(
      new RegExp('eval\\(function\\(h,u,n,t,e,r\\)\\{.*?\\}\\("(.*?)","?(\\d+)"?,"(.*?)",(\\d+),(\\d+),(\\d+)\\)\\)', 's')
    );

    if (!evalMatch) {
      return { success: false, error: "SnapSave returned unexpected format" };
    }

    const [, h, , n, tStr, eStr] = evalMatch;
    const t = parseInt(tStr);
    const e = parseInt(eStr);
    const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/";

    const convertBase = (d: string, fromBase: number, toBase: number): string => {
      const g = chars.split("");
      const h2 = g.slice(0, fromBase);
      const i = g.slice(0, toBase);
      let j = d
        .split("")
        .reverse()
        .reduce((a: number, b: string, c: number) => {
          if (h2.indexOf(b) !== -1) return a + h2.indexOf(b) * Math.pow(fromBase, c);
          return a;
        }, 0);
      let k = "";
      while (j > 0) {
        k = i[j % toBase] + k;
        j = (j - (j % toBase)) / toBase;
      }
      return k || "0";
    }

    let decoded = "";
    for (let i = 0; i < h.length; i++) {
      let s = "";
      while (h[i] !== n[e]) {
        s += h[i];
        i++;
      }
      for (let j = 0; j < n.length; j++) s = s.replace(new RegExp(n[j], "g"), j.toString());
      decoded += String.fromCharCode(parseInt(convertBase(s, e, 10)) - t);
    }
    try {
      decoded = decodeURIComponent(escape(decoded));
    } catch {}

    if (decoded.includes("error_api_get_instagram") || decoded.includes("Error:") || decoded.includes("Unable to connect")) {
      return { success: false, error: "SnapSave could not connect to Instagram" };
    }

    const linkRegex = /href="(https?:\/\/[^"]*(?:scontent|cdninstagram|fbcdn)[^"]*)"/gi;
    const links: string[] = [];
    let m;
    while ((m = linkRegex.exec(decoded)) !== null) links.push(m[1]);

    const srcRegex = /src="(https?:\/\/[^"]*(?:scontent|cdninstagram|fbcdn)[^"]*)"/gi;
    while ((m = srcRegex.exec(decoded)) !== null) links.push(m[1]);

    if (links.length === 0) {
      return { success: false, error: "SnapSave returned no download links" };
    }

    const media: InstagramMedia[] = links.map((link) => ({
      type: link.includes(".mp4") || link.includes("video") ? "video" as const : "image" as const,
      url: link.replace(/&amp;/g, "&"),
    }));

    return {
      success: true,
      creator: "apis by Silent Wolf",
      provider: "snapsave",
      title: "Instagram Media",
      media,
    };
  } catch {
    return { success: false, error: "SnapSave unavailable" };
  }
}

async function tryFastDlApi(url: string): Promise<InstagramResult> {
  try {
    const res = await fetchWithTimeout("https://api-wh.fastdl.app/api/convert", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": USER_AGENT,
        Origin: "https://fastdl.app",
        Referer: "https://fastdl.app/en2",
        Accept: "application/json",
      },
      body: new URLSearchParams({ sf_url: url.trim() }).toString(),
    });

    const text = await res.text();
    if (!text || text.trim().length === 0) {
      return { success: false, error: "FastDL returned empty response" };
    }

    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      return { success: false, error: "FastDL returned invalid response" };
    }

    if (!data || data.success === false) {
      return { success: false, error: data?.message || "FastDL failed" };
    }

    const info = data?.info;
    if (typeof info === "string" && (info.includes("error") || info.includes("invalid_request"))) {
      return { success: false, error: "FastDL returned error" };
    }

    return parseFastDlResponse(data, "fastdl");
  } catch {
    return { success: false, error: "FastDL unavailable" };
  }
}

function parseFastDlResponse(data: any, provider: string): InstagramResult {
  const media: InstagramMedia[] = [];

  if (data.url_list && Array.isArray(data.url_list)) {
    for (const item of data.url_list) {
      if (typeof item === "string") {
        const isVideo = item.includes(".mp4") || item.includes("video");
        media.push({ type: isVideo ? "video" : "image", url: item });
      } else if (item?.url) {
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
    return { success: false, error: "No downloadable media found" };
  }

  return {
    success: true,
    creator: "apis by Silent Wolf",
    provider,
    title: data.meta?.title || data.title || "Instagram Media",
    username: data.meta?.source_url?.match(/@?([a-zA-Z0-9_.]+)/)?.[1] || data.username,
    media,
  };
}

async function tryFastDlJsonApi(url: string): Promise<InstagramResult> {
  try {
    const res = await fetchWithTimeout("https://fastdl.app/api/convert", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": USER_AGENT,
        Origin: "https://fastdl.app",
        Referer: "https://fastdl.app/en2",
        Accept: "application/json",
      },
      body: JSON.stringify({ url: url.trim() }),
    });

    const text = await res.text();
    if (!text || text.trim().length === 0) {
      return { success: false, error: "FastDL JSON API returned empty response" };
    }

    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      return { success: false, error: "FastDL JSON API returned invalid response" };
    }

    if (data.success === false || (!data.url_list && !data.url)) {
      return { success: false, error: data.message || "FastDL JSON API failed" };
    }

    return parseFastDlResponse(data, "fastdl-json");
  } catch {
    return { success: false, error: "FastDL JSON API unavailable" };
  }
}

async function trySaveFromApi(url: string): Promise<InstagramResult> {
  try {
    const headers: Record<string, string> = {
      "User-Agent": USER_AGENT,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json, text/javascript, */*; q=0.01",
      Origin: "https://en.savefrom.net",
      Referer: "https://en.savefrom.net/",
    };

    const res = await fetchWithTimeout("https://worker.sf-tools.com/savefrom.php", {
      method: "POST",
      headers,
      body: new URLSearchParams({
        sf_url: url.trim(),
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
    });

    const text = await res.text();
    if (!text || text.trim().length === 0) {
      return { success: false, error: "SaveFrom returned empty response" };
    }

    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      return { success: false, error: "SaveFrom returned invalid response" };
    }

    const media: InstagramMedia[] = [];

    if (Array.isArray(data)) {
      for (const item of data) {
        if (item.url && (item.url.includes("instagram") || item.url.includes("cdninstagram") || item.url.includes("fbcdn"))) {
          media.push({
            type: item.type === "video" || item.url.includes(".mp4") ? "video" : "image",
            url: item.url,
            quality: item.quality,
          });
        }
      }
    } else if (data.url) {
      media.push({
        type: data.url.includes(".mp4") ? "video" : "image",
        url: data.url,
      });
    }

    if (media.length === 0) {
      return { success: false, error: "SaveFrom returned no download links" };
    }

    return {
      success: true,
      creator: "apis by Silent Wolf",
      provider: "savefrom",
      title: data.meta?.title || "Instagram Media",
      media,
    };
  } catch {
    return { success: false, error: "SaveFrom unavailable" };
  }
}

export async function downloadInstagram(url: string): Promise<InstagramResult> {
  const shortcode = extractShortcode(url);

  if (!shortcode) {
    return {
      success: false,
      error: "Invalid Instagram URL. Provide a valid post, reel, or IGTV link.",
    };
  }

  const providers: Array<{ name: string; fn: () => Promise<InstagramResult> }> = [
    { name: "graphql", fn: () => tryGraphQLApi(shortcode) },
    { name: "snapsave", fn: () => trySnapSaveApi(url) },
    { name: "fastdl", fn: () => tryFastDlApi(url) },
    { name: "fastdl-json", fn: () => tryFastDlJsonApi(url) },
    { name: "savefrom", fn: () => trySaveFromApi(url) },
  ];

  const errors: string[] = [];

  for (const provider of providers) {
    try {
      console.log(`[instagram] Trying provider: ${provider.name}`);
      const result = await provider.fn();
      if (result.success) {
        console.log(`[instagram] Provider ${provider.name} succeeded`);
        return result;
      }
      errors.push(`${provider.name}: ${result.error}`);
      console.log(`[instagram] Provider ${provider.name} failed: ${result.error}`);
    } catch (err: any) {
      errors.push(`${provider.name}: ${err.message}`);
      console.log(`[instagram] Provider ${provider.name} crashed: ${err.message}`);
    }
  }

  return {
    success: false,
    creator: "apis by Silent Wolf",
    error:
      "Instagram is currently blocking all download services. This is a known issue — Instagram has recently tightened their anti-scraping protections. Please try again later.",
    details: errors.join(" | "),
  } as any;
}
