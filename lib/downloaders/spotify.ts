const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

interface SpotifyTrack {
  title: string;
  artist: string;
  album?: string;
  albumArt?: string;
  duration?: number;
  releaseDate?: string;
  spotifyUrl?: string;
  previewUrl?: string;
  trackId?: string;
}

interface SpotifySearchResult {
  success: boolean;
  creator: string;
  query?: string;
  tracks?: SpotifyTrack[];
  error?: string;
}

interface SpotifyDownloadResult {
  success: boolean;
  creator: string;
  title?: string;
  artist?: string;
  album?: string;
  albumArt?: string;
  downloadUrl?: string;
  format?: string;
  source?: string;
  spotifyUrl?: string;
  error?: string;
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

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getSpotifyTokenViaAnonymous(): Promise<string | null> {
  try {
    const res = await fetchWithTimeout("https://open.spotify.com/get_access_token?reason=transport&productType=web_player", {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "application/json",
        "Origin": "https://open.spotify.com",
        "Referer": "https://open.spotify.com/",
      },
    }, 10000);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.accessToken) {
      console.log("[spotify] Got token via anonymous endpoint");
      return data.accessToken;
    }
    return null;
  } catch {
    return null;
  }
}

async function getSpotifyTokenViaEmbed(): Promise<string | null> {
  const embedTracks = [
    "0VjIjW4GlUZAMYd2vXMi3b",
    "7qiZfU4dY1lWllzX7mPBI3",
    "4cOdK2wGLETKBW3PvgPWqT",
  ];

  for (const trackId of embedTracks) {
    try {
      const embedRes = await fetchWithTimeout(
        `https://open.spotify.com/embed/track/${trackId}`,
        { headers: { "User-Agent": USER_AGENT } },
        8000
      );
      if (!embedRes.ok) continue;
      const html = await embedRes.text();

      const tokenMatch = html.match(/"accessToken":"([^"]+)"/);
      if (tokenMatch) {
        console.log("[spotify] Got token via embed");
        return tokenMatch[1];
      }
    } catch {
      continue;
    }
  }
  return null;
}

async function getSpotifyToken(): Promise<string | null> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const tokenGetters = [
    getSpotifyTokenViaAnonymous,
    getSpotifyTokenViaEmbed,
  ];

  for (const getter of tokenGetters) {
    const token = await getter();
    if (token) {
      cachedToken = {
        token,
        expiresAt: Date.now() + 30 * 60 * 1000,
      };
      return token;
    }
  }

  console.log("[spotify] All token methods failed");
  return null;
}

function extractSpotifyId(url: string): { type: string; id: string } | null {
  const match = url.match(/spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/);
  if (match) return { type: match[1], id: match[2] };
  const uriMatch = url.match(/spotify:(track|album|playlist):([a-zA-Z0-9]+)/);
  if (uriMatch) return { type: uriMatch[1], id: uriMatch[2] };
  return null;
}

function parseSpotifyApiTrack(item: any): SpotifyTrack {
  return {
    title: item.name || "Unknown",
    artist: item.artists?.map((a: any) => a.name).join(", ") || "Unknown",
    album: item.album?.name || undefined,
    albumArt: item.album?.images?.[0]?.url || undefined,
    duration: item.duration_ms ? Math.round(item.duration_ms / 1000) : undefined,
    releaseDate: item.album?.release_date || undefined,
    spotifyUrl: item.external_urls?.spotify || `https://open.spotify.com/track/${item.id}`,
    previewUrl: item.preview_url || undefined,
    trackId: item.id,
  };
}

async function searchViaSpotifyApi(query: string, retryCount = 0): Promise<SpotifyTrack[]> {
  const token = await getSpotifyToken();
  if (!token) return [];

  try {
    const res = await fetchWithTimeout(
      `https://api.spotify.com/v1/search?type=track&q=${encodeURIComponent(query)}&limit=10`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "User-Agent": USER_AGENT,
        },
      }
    );

    if (res.status === 401) {
      cachedToken = null;
      if (retryCount < 1) {
        return searchViaSpotifyApi(query, retryCount + 1);
      }
      return [];
    }

    if (res.status === 429) {
      const retryAfter = parseInt(res.headers.get("retry-after") || "5");
      console.log(`[spotify] Rate limited, retry after ${retryAfter}s`);
      cachedToken = null;
      if (retryCount < 1 && retryAfter <= 30) {
        await new Promise(r => setTimeout(r, Math.min(retryAfter, 5) * 1000));
        return searchViaSpotifyApi(query, retryCount + 1);
      }
      return [];
    }

    if (!res.ok) return [];

    const text = await res.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      return [];
    }

    if (!data.tracks?.items?.length) return [];

    return data.tracks.items.map(parseSpotifyApiTrack);
  } catch {
    return [];
  }
}

async function getTrackViaSpotifyApi(trackId: string): Promise<SpotifyTrack | null> {
  const token = await getSpotifyToken();
  if (!token) return null;

  try {
    const res = await fetchWithTimeout(
      `https://api.spotify.com/v1/tracks/${trackId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "User-Agent": USER_AGENT,
        },
      }
    );

    if (res.status === 429 || res.status === 401) {
      cachedToken = null;
      return null;
    }

    if (!res.ok) return null;

    const text = await res.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      return null;
    }

    return parseSpotifyApiTrack(data);
  } catch {
    return null;
  }
}

async function getSpotifyEmbed(trackId: string): Promise<SpotifyTrack | null> {
  try {
    const res = await fetchWithTimeout(
      `https://open.spotify.com/embed/track/${trackId}`,
      { headers: { "User-Agent": USER_AGENT } }
    );
    if (!res.ok) return null;
    const html = await res.text();

    const titleMatch = html.match(/"title":"([^"]+)"/);
    const artistsMatch = html.match(/"artists":\[([^\]]+)\]/);

    let title = "Unknown";
    let artist = "Unknown";
    let albumArt: string | undefined;

    if (titleMatch) title = titleMatch[1];

    if (artistsMatch) {
      const names = artistsMatch[1].match(/"name":"([^"]+)"/g);
      if (names) {
        artist = names.map(n => n.replace(/"name":"/, "").replace(/"$/, "")).join(", ");
      }
    }

    const artMatch = html.match(/"coverArt":\{"sources":\[.*?"url":"([^"]+)"/);
    if (artMatch) albumArt = artMatch[1];

    return {
      title,
      artist,
      albumArt,
      spotifyUrl: `https://open.spotify.com/track/${trackId}`,
      trackId,
    };
  } catch {
    return null;
  }
}

async function getDownloadViaYouTube(title: string, artist: string, baseUrl: string): Promise<{ url: string; source: string } | null> {
  try {
    const query = `${title} ${artist}`;
    const searchRes = await fetchWithTimeout(`${baseUrl}/api/search?q=${encodeURIComponent(query)}`);
    if (!searchRes.ok) return null;

    const searchText = await searchRes.text();
    let searchData: any;
    try {
      searchData = JSON.parse(searchText);
    } catch {
      return null;
    }
    if (!searchData.items?.length) return null;

    const videoId = searchData.items[0].id;
    const dlRes = await fetchWithTimeout(`${baseUrl}/download/mp3?url=https://www.youtube.com/watch?v=${videoId}`);
    if (!dlRes.ok) return null;

    const dlText = await dlRes.text();
    let dlData: any;
    try {
      dlData = JSON.parse(dlText);
    } catch {
      return null;
    }
    if (!dlData.success || !dlData.downloadUrl) return null;

    return { url: dlData.downloadUrl, source: "youtube" };
  } catch {
    return null;
  }
}

async function getDownloadViaYouTubeDirect(query: string, baseUrl: string): Promise<{ url: string; title: string; artist: string } | null> {
  try {
    const searchRes = await fetchWithTimeout(`${baseUrl}/api/search?q=${encodeURIComponent(query)}`);
    if (!searchRes.ok) return null;

    const searchText = await searchRes.text();
    let searchData: any;
    try {
      searchData = JSON.parse(searchText);
    } catch {
      return null;
    }
    if (!searchData.items?.length) return null;

    const firstResult = searchData.items[0];
    const videoId = firstResult.id;
    const videoTitle = firstResult.title || query;

    const dlRes = await fetchWithTimeout(`${baseUrl}/download/mp3?url=https://www.youtube.com/watch?v=${videoId}`);
    if (!dlRes.ok) return null;

    const dlText = await dlRes.text();
    let dlData: any;
    try {
      dlData = JSON.parse(dlText);
    } catch {
      return null;
    }
    if (!dlData.success || !dlData.downloadUrl) return null;

    const titleParts = videoTitle.split(" - ");
    const artist = titleParts.length > 1 ? titleParts[0].trim() : "Unknown";
    const title = titleParts.length > 1 ? titleParts.slice(1).join(" - ").trim() : videoTitle;

    return { url: dlData.downloadUrl, title, artist };
  } catch {
    return null;
  }
}

async function searchViaItunes(query: string): Promise<SpotifyTrack[]> {
  try {
    const res = await fetchWithTimeout(
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=10`,
      { headers: { "User-Agent": USER_AGENT } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.results?.length) return [];

    return data.results.map((item: any) => ({
      title: item.trackName || "Unknown",
      artist: item.artistName || "Unknown",
      album: item.collectionName || undefined,
      albumArt: item.artworkUrl100?.replace("100x100", "400x400") || undefined,
      duration: item.trackTimeMillis ? Math.round(item.trackTimeMillis / 1000) : undefined,
      releaseDate: item.releaseDate?.substring(0, 10) || undefined,
      spotifyUrl: undefined,
      previewUrl: item.previewUrl || undefined,
      trackId: String(item.trackId || ""),
    }));
  } catch {
    return [];
  }
}

export async function searchSpotify(query: string): Promise<SpotifySearchResult> {
  if (!query || query.trim().length === 0) {
    return { success: false, creator: "APIs by Silent Wolf | A tech explorer", error: "Search query is required." };
  }

  console.log(`[spotify] Searching: ${query}`);

  let tracks = await searchViaSpotifyApi(query);

  if (tracks.length === 0) {
    console.log(`[spotify] Spotify API failed, trying iTunes fallback`);
    tracks = await searchViaItunes(query);
  }

  if (tracks.length === 0) {
    return {
      success: false,
      creator: "APIs by Silent Wolf | A tech explorer",
      query,
      error: "No results found. Try a different search term.",
    };
  }

  return {
    success: true,
    creator: "APIs by Silent Wolf | A tech explorer",
    query,
    tracks,
  };
}

export async function downloadSpotify(
  input: string,
  baseUrl: string
): Promise<SpotifyDownloadResult> {
  if (!input || input.trim().length === 0) {
    return { success: false, creator: "APIs by Silent Wolf | A tech explorer", error: "Provide a Spotify URL or song name." };
  }

  input = input.trim();
  let trackInfo: SpotifyTrack | null = null;

  const spotifyParsed = extractSpotifyId(input);
  if (spotifyParsed && spotifyParsed.type === "track") {
    trackInfo = await getTrackViaSpotifyApi(spotifyParsed.id);
    if (!trackInfo) {
      trackInfo = await getSpotifyEmbed(spotifyParsed.id);
    }
  }

  if (!trackInfo) {
    console.log(`[spotify] Input is not a Spotify URL or track not found, searching: ${input}`);
    const searchResult = await searchSpotify(input);
    if (searchResult.success && searchResult.tracks && searchResult.tracks.length > 0) {
      trackInfo = searchResult.tracks[0];
    }
  }

  if (trackInfo) {
    console.log(`[spotify] Found track: ${trackInfo.title} by ${trackInfo.artist}`);

    const ytResult = await getDownloadViaYouTube(trackInfo.title, trackInfo.artist, baseUrl);
    if (ytResult) {
      return {
        success: true,
        creator: "APIs by Silent Wolf | A tech explorer",
        title: trackInfo.title,
        artist: trackInfo.artist,
        album: trackInfo.album,
        albumArt: trackInfo.albumArt,
        downloadUrl: ytResult.url,
        format: "mp3",
        source: ytResult.source,
        spotifyUrl: trackInfo.spotifyUrl,
      };
    }

    return {
      success: false,
      creator: "APIs by Silent Wolf | A tech explorer",
      title: trackInfo.title,
      artist: trackInfo.artist,
      spotifyUrl: trackInfo.spotifyUrl,
      error: "Download temporarily unavailable. Try again later.",
    };
  }

  console.log(`[spotify] Spotify search unavailable, falling back to YouTube for: ${input}`);
  const ytDirect = await getDownloadViaYouTubeDirect(input, baseUrl);
  if (ytDirect) {
    return {
      success: true,
      creator: "APIs by Silent Wolf | A tech explorer",
      title: ytDirect.title,
      artist: ytDirect.artist,
      downloadUrl: ytDirect.url,
      format: "mp3",
      source: "youtube",
    };
  }

  return {
    success: false,
    creator: "APIs by Silent Wolf | A tech explorer",
    error: `Could not find track for "${input}". Try a Spotify URL or different search term.`,
  };
}
