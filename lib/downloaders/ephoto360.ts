const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export interface EphotoEffect {
  id: string;
  name: string;
  slug: string;
  category: string;
  params: { name: string; type: "text" | "image"; placeholder?: string }[];
}

export interface EphotoResult {
  success: boolean;
  creator: string;
  effectName?: string;
  imageUrl?: string;
  error?: string;
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 20000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export const EPHOTO_EFFECTS: EphotoEffect[] = [
  { id: "797", name: "Neon Light Text", slug: "create-colorful-neon-light-text-effects-online-797", category: "neon", params: [{ name: "text", type: "text", placeholder: "Your neon text" }] },
  { id: "68", name: "Neon Text Effect", slug: "neon-text-effect-68", category: "neon", params: [{ name: "text", type: "text", placeholder: "Neon text" }] },
  { id: "767", name: "Digital Glitch Text", slug: "create-digital-glitch-text-effects-online-767", category: "text", params: [{ name: "text", type: "text", placeholder: "Glitch text" }] },
  { id: "802", name: "Glossy Silver 3D Text", slug: "create-glossy-silver-3d-text-effect-online-802", category: "3d", params: [{ name: "text", type: "text", placeholder: "3D text" }] },
  { id: "817", name: "3D Comic Text", slug: "create-online-3d-comic-style-text-effects-817", category: "3d", params: [{ name: "text", type: "text", placeholder: "Comic text" }] },
  { id: "818", name: "Deadpool Logo Text", slug: "create-text-effects-in-the-style-of-the-deadpool-logo-818", category: "text", params: [{ name: "text", type: "text", placeholder: "Logo text" }] },
  { id: "809", name: "Dragon Ball Text", slug: "create-dragon-ball-style-text-effects-online-809", category: "text", params: [{ name: "text", type: "text", placeholder: "Dragon Ball text" }] },
  { id: "774", name: "Typography on Pavement", slug: "create-typography-text-effect-on-pavement-online-774", category: "text", params: [{ name: "text", type: "text", placeholder: "Pavement text" }] },
  { id: "810", name: "Blackpink Logo", slug: "create-a-blackpink-style-logo-with-members-signatures-810", category: "text", params: [{ name: "text", type: "text", placeholder: "Logo text" }] },
  { id: "779", name: "Blackpink Born Pink", slug: "create-blackpink-s-born-pink-album-logo-online-779", category: "text", params: [{ name: "text", type: "text", placeholder: "Album text" }] },
  { id: "91", name: "Galaxy Text", slug: "create-galaxy-style-text-effect-91", category: "text", params: [{ name: "text", type: "text", placeholder: "Galaxy text" }] },
  { id: "93", name: "Metallic Text", slug: "create-metallic-text-effect-93", category: "text", params: [{ name: "text", type: "text", placeholder: "Metal text" }] },
  { id: "114", name: "Frozen Text", slug: "frozen-text-effect-114", category: "text", params: [{ name: "text", type: "text", placeholder: "Frozen text" }] },
  { id: "144", name: "Fire Text", slug: "fire-text-effect-144", category: "fire", params: [{ name: "text", type: "text", placeholder: "Fire text" }] },
  { id: "170", name: "Gold Text Effect", slug: "gold-text-effect-170", category: "text", params: [{ name: "text", type: "text", placeholder: "Gold text" }] },
  { id: "194", name: "3D Graffiti Text", slug: "3d-graffiti-text-effect-194", category: "3d", params: [{ name: "text", type: "text", placeholder: "Graffiti text" }] },
  { id: "239", name: "Horror Text", slug: "horror-text-effect-239", category: "text", params: [{ name: "text", type: "text", placeholder: "Horror text" }] },
  { id: "360", name: "Neon Writing on Wall", slug: "neon-writing-on-wall-360", category: "neon", params: [{ name: "text", type: "text", placeholder: "Wall text" }] },
  { id: "374", name: "Blood Text Effect", slug: "blood-text-effect-374", category: "text", params: [{ name: "text", type: "text", placeholder: "Blood text" }] },
  { id: "386", name: "Lava Text", slug: "lava-text-effect-386", category: "fire", params: [{ name: "text", type: "text", placeholder: "Lava text" }] },
  { id: "393", name: "Thunder Text", slug: "thunder-text-effect-393", category: "text", params: [{ name: "text", type: "text", placeholder: "Thunder text" }] },
  { id: "405", name: "Matrix Text", slug: "matrix-text-effect-405", category: "text", params: [{ name: "text", type: "text", placeholder: "Matrix text" }] },
  { id: "428", name: "Smoke Text", slug: "smoke-text-effect-428", category: "text", params: [{ name: "text", type: "text", placeholder: "Smoke text" }] },
  { id: "466", name: "Naruto Text", slug: "naruto-text-effect-466", category: "text", params: [{ name: "text", type: "text", placeholder: "Naruto text" }] },
  { id: "504", name: "LED Text", slug: "led-text-effect-504", category: "neon", params: [{ name: "text", type: "text", placeholder: "LED text" }] },
];

export async function generateEphoto(effectSlug: string, texts: string[]): Promise<EphotoResult> {
  const effect = EPHOTO_EFFECTS.find(e => e.slug === effectSlug || e.id === effectSlug);
  const effectName = effect?.name || effectSlug;

  try {
    const pageUrl = `https://en.ephoto360.com/${effectSlug}.html`;
    const pageRes = await fetchWithTimeout(pageUrl, {
      headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
    });

    if (!pageRes.ok) {
      return { success: false, creator: "APIs by Silent Wolf | A tech explorer", error: `Effect page not found (${pageRes.status})` };
    }

    const pageHtml = await pageRes.text();
    const cookies = pageRes.headers.get("set-cookie") || "";

    const tokenMatch = pageHtml.match(/name="token"\s+value="([^"]+)"/);
    const buildServerMatch = pageHtml.match(/name="build_server"\s+value="([^"]+)"/);
    const buildServerIdMatch = pageHtml.match(/name="build_server_id"\s+value="([^"]+)"/);

    if (!tokenMatch || !buildServerMatch) {
      return { success: false, creator: "APIs by Silent Wolf | A tech explorer", error: "Could not extract form tokens" };
    }

    const token = tokenMatch[1];
    const buildServer = buildServerMatch[1];
    const buildServerId = buildServerIdMatch?.[1] || "1";

    const formData = new URLSearchParams();
    for (const t of texts) {
      formData.append("text[]", t);
    }
    formData.append("token", token);
    formData.append("build_server", buildServer);
    formData.append("build_server_id", buildServerId);
    formData.append("submit", "GO");

    const cookieHeader = cookies.split(",").map(c => c.split(";")[0].trim()).filter(Boolean).join("; ");

    const postRes = await fetchWithTimeout(pageUrl, {
      method: "POST",
      headers: {
        "User-Agent": USER_AGENT,
        "Content-Type": "application/x-www-form-urlencoded",
        "Referer": pageUrl,
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
      body: formData.toString(),
    });

    const postHtml = await postRes.text();
    const postCookies = postRes.headers.get("set-cookie") || "";
    const allCookies = [cookieHeader, ...postCookies.split(",").map(c => c.split(";")[0].trim())].filter(Boolean).join("; ");

    const formValueMatch = postHtml.match(/form_value_input"\s+value="([^"]+)"/);
    if (!formValueMatch) {
      return { success: false, creator: "APIs by Silent Wolf | A tech explorer", error: "Could not extract form value for image generation" };
    }

    const formValueRaw = formValueMatch[1]
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&#039;/g, "'");

    let formValue: any;
    try {
      formValue = JSON.parse(formValueRaw);
    } catch {
      return { success: false, creator: "APIs by Silent Wolf | A tech explorer", error: "Invalid form value data" };
    }

    const createData = new URLSearchParams();
    createData.append("id", formValue.id || "");
    if (Array.isArray(formValue.text)) {
      for (const t of formValue.text) {
        createData.append("text[]", t);
      }
    }
    createData.append("token", formValue.token || "");
    createData.append("build_server", formValue.build_server || "");
    createData.append("build_server_id", formValue.build_server_id || "");

    let imageResult: any = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const createRes = await fetchWithTimeout("https://en.ephoto360.com/effect/create-image", {
        method: "POST",
        headers: {
          "User-Agent": USER_AGENT,
          "Content-Type": "application/x-www-form-urlencoded",
          "X-Requested-With": "XMLHttpRequest",
          "Referer": pageUrl,
          ...(allCookies ? { Cookie: allCookies } : {}),
        },
        body: createData.toString(),
      });

      const createText = await createRes.text();
      try {
        imageResult = JSON.parse(createText);
        if (imageResult.success === true && imageResult.image) {
          break;
        }
      } catch {
        // retry
      }
      await new Promise(r => setTimeout(r, 2000));
    }

    if (!imageResult || !imageResult.success || !imageResult.image) {
      return { success: false, creator: "APIs by Silent Wolf | A tech explorer", error: "Image generation failed after multiple attempts" };
    }

    const imageUrl = `${formValue.build_server}${imageResult.image}`;

    return {
      success: true,
      creator: "APIs by Silent Wolf | A tech explorer",
      effectName,
      imageUrl,
    };
  } catch (err: any) {
    return { success: false, creator: "APIs by Silent Wolf | A tech explorer", error: err.message || "Ephoto360 generation failed" };
  }
}

export function listEphotoEffects() {
  return EPHOTO_EFFECTS.map(e => ({
    id: e.id,
    name: e.name,
    slug: e.slug,
    category: e.category,
    endpoint: `/api/ephoto/${e.slug}`,
    params: e.params.map(p => ({ name: p.name, type: p.type, placeholder: p.placeholder })),
  }));
}
