const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const SHAZAM_SEARCH_URL = "https://www.shazam.com/services/amapi/v1/catalog/US/search";
const SHAZAM_TRACK_URL = "https://www.shazam.com/discovery/v5/en/US/web/-/track";

interface ShazamTrack {
  title: string;
  artist: string;
  album?: string;
  albumArt?: string;
  genre?: string;
  year?: string;
  shazamUrl?: string;
  appleMusic?: string;
  spotify?: string;
  trackId?: string;
  previewUrl?: string;
}

interface ShazamSearchResult {
  success: boolean;
  creator: string;
  query?: string;
  tracks?: ShazamTrack[];
  error?: string;
}

interface ShazamRecognizeResult {
  success: boolean;
  creator: string;
  title?: string;
  artist?: string;
  album?: string;
  albumArt?: string;
  genre?: string;
  year?: string;
  shazamUrl?: string;
  appleMusic?: string;
  spotify?: string;
  trackId?: string;
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

function parseShazamTrack(item: any): ShazamTrack | null {
  try {
    const attrs = item.attributes || item;
    const track: ShazamTrack = {
      title: attrs.title || attrs.name || "Unknown",
      artist: attrs.artistName || attrs.subtitle || attrs.artist || "Unknown",
      album: attrs.albumName || undefined,
      genre: attrs.genreNames?.[0] || undefined,
      year: attrs.releaseDate?.substring(0, 4) || undefined,
      trackId: item.id || undefined,
    };

    if (attrs.artwork?.url) {
      track.albumArt = attrs.artwork.url
        .replace("{w}", "400")
        .replace("{h}", "400");
    } else if (attrs.images?.coverarthq || attrs.images?.coverart) {
      track.albumArt = attrs.images.coverarthq || attrs.images.coverart;
    }

    if (attrs.url) {
      track.shazamUrl = attrs.url;
    } else if (attrs.share?.href) {
      track.shazamUrl = attrs.share.href;
    }

    if (attrs.previews?.[0]?.url) {
      track.previewUrl = attrs.previews[0].url;
    }

    const providers = attrs.hub?.providers || [];
    for (const p of providers) {
      if (p.type === "SPOTIFY" && p.actions?.[0]?.uri) {
        track.spotify = p.actions[0].uri;
      }
    }

    if (attrs.hub?.options) {
      for (const opt of attrs.hub.options) {
        if (opt.providername === "SPOTIFY" && opt.actions?.[0]?.uri) {
          track.spotify = opt.actions[0].uri;
        }
        if (opt.providername === "APPLE_MUSIC" && opt.actions?.[0]?.uri) {
          track.appleMusic = opt.actions[0].uri;
        }
      }
    }

    return track;
  } catch {
    return null;
  }
}

async function searchViaShazamApi(query: string): Promise<ShazamTrack[]> {
  try {
    const url = `${SHAZAM_SEARCH_URL}?term=${encodeURIComponent(query)}&limit=10&types=songs`;
    const res = await fetchWithTimeout(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
    });
    if (!res.ok) return [];
    const data = await res.json();

    const songs = data?.results?.songs?.data || [];
    const tracks: ShazamTrack[] = [];
    for (const song of songs) {
      const t = parseShazamTrack(song);
      if (t) tracks.push(t);
    }
    return tracks;
  } catch {
    return [];
  }
}

async function searchViaShazamWeb(query: string): Promise<ShazamTrack[]> {
  try {
    const url = `https://www.shazam.com/services/search/v4/en/US/web/search?term=${encodeURIComponent(query)}&numResults=10&offset=0&types=songs,artists`;
    const res = await fetchWithTimeout(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
    });
    if (!res.ok) return [];
    const data = await res.json();

    const tracks: ShazamTrack[] = [];

    const hits = data?.tracks?.hits || data?.songs?.hits || [];
    for (const hit of hits) {
      const item = hit.track || hit;
      const t = parseShazamTrack(item);
      if (t) tracks.push(t);
    }

    if (tracks.length === 0 && data?.results?.songs?.data) {
      for (const song of data.results.songs.data) {
        const t = parseShazamTrack(song);
        if (t) tracks.push(t);
      }
    }

    return tracks;
  } catch {
    return [];
  }
}

async function searchViaShazamV1(query: string): Promise<ShazamTrack[]> {
  try {
    const url = `https://www.shazam.com/services/search/v3/en/US/web/search?query=${encodeURIComponent(query)}&numResults=10&offset=0&types=songs`;
    const res = await fetchWithTimeout(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
    });
    if (!res.ok) return [];
    const data = await res.json();

    const tracks: ShazamTrack[] = [];
    const hits = data?.tracks?.hits || [];
    for (const hit of hits) {
      const item = hit.track || hit;
      const t: ShazamTrack = {
        title: item.heading?.title || item.title || "Unknown",
        artist: item.heading?.subtitle || item.subtitle || "Unknown",
        albumArt: item.images?.default || item.images?.coverart || undefined,
        shazamUrl: item.url || item.share?.href || undefined,
        trackId: item.key || item.id || undefined,
      };

      if (item.stores?.apple?.previewurl) {
        t.previewUrl = item.stores.apple.previewurl;
      }
      if (item.hub?.providers) {
        for (const p of item.hub.providers) {
          if (p.type === "SPOTIFY") t.spotify = p.actions?.[0]?.uri;
        }
      }
      tracks.push(t);
    }
    return tracks;
  } catch {
    return [];
  }
}

export async function searchShazam(query: string): Promise<ShazamSearchResult> {
  if (!query || query.trim().length === 0) {
    return { success: false, creator: "apis by Silent Wolf", error: "Search query is required." };
  }

  console.log(`[shazam] Searching: ${query}`);

  let tracks = await searchViaShazamApi(query);

  if (tracks.length === 0) {
    tracks = await searchViaShazamWeb(query);
  }

  if (tracks.length === 0) {
    tracks = await searchViaShazamV1(query);
  }

  if (tracks.length === 0) {
    return {
      success: false,
      creator: "apis by Silent Wolf",
      query,
      error: "No results found. Try a different search term.",
    };
  }

  return {
    success: true,
    creator: "apis by Silent Wolf",
    query,
    tracks,
  };
}

export async function recognizeShazam(audioBuffer: Buffer): Promise<ShazamRecognizeResult> {
  try {
    const { Shazam, s16LEToSamplesArray } = await import("shazam-api");

    const shazam = new Shazam();

    const samples = s16LEToSamplesArray(new Uint8Array(audioBuffer));

    console.log(`[shazam] Recognizing audio (${audioBuffer.length} bytes, ${samples.length} samples)`);

    const result = await shazam.recognizeSong(samples);

    if (!result) {
      return {
        success: false,
        creator: "apis by Silent Wolf",
        error: "Could not identify the song. Try a longer or clearer audio sample.",
      };
    }

    return {
      success: true,
      creator: "apis by Silent Wolf",
      title: result.title,
      artist: result.artist,
      album: result.album,
      year: result.year,
    };
  } catch (err: any) {
    console.error(`[shazam] Recognition error:`, err.message);
    return {
      success: false,
      creator: "apis by Silent Wolf",
      error: `Recognition failed: ${err.message || "Unknown error"}. Ensure audio is raw PCM (s16LE, mono, 16kHz).`,
    };
  }
}

export async function recognizeShazamFull(audioBuffer: Buffer): Promise<ShazamRecognizeResult> {
  try {
    const { Shazam, s16LEToSamplesArray } = await import("shazam-api");

    const shazam = new Shazam();
    const samples = s16LEToSamplesArray(new Uint8Array(audioBuffer));

    console.log(`[shazam] Full recognizing audio (${audioBuffer.length} bytes)`);

    const result = await shazam.fullRecognizeSong(samples);

    if (!result || !result.track) {
      return {
        success: false,
        creator: "apis by Silent Wolf",
        error: "Could not identify the song. Try a longer or clearer audio sample.",
      };
    }

    const track = result.track;
    const response: ShazamRecognizeResult = {
      success: true,
      creator: "apis by Silent Wolf",
      title: track.title || track.heading?.title,
      artist: track.subtitle || track.heading?.subtitle,
      trackId: track.key,
      shazamUrl: track.url || track.share?.href,
      genre: track.genres?.primary,
    };

    if (track.images?.coverarthq || track.images?.coverart) {
      response.albumArt = track.images.coverarthq || track.images.coverart;
    }

    if (track.sections) {
      for (const section of track.sections) {
        if (section.type === "SONG" && section.metadata) {
          for (const meta of section.metadata) {
            if (meta.title === "Album") response.album = meta.text;
            if (meta.title === "Released") response.year = meta.text;
          }
        }
      }
    }

    if (track.hub?.providers) {
      for (const p of track.hub.providers) {
        if (p.type === "SPOTIFY") response.spotify = p.actions?.[0]?.uri;
      }
    }
    if (track.hub?.options) {
      for (const opt of track.hub.options) {
        if (opt.providername === "APPLE_MUSIC") response.appleMusic = opt.actions?.[0]?.uri;
      }
    }

    return response;
  } catch (err: any) {
    console.error(`[shazam] Full recognition error:`, err.message);
    return {
      success: false,
      creator: "apis by Silent Wolf",
      error: `Recognition failed: ${err.message || "Unknown error"}. Ensure audio is raw PCM (s16LE, mono, 16kHz).`,
    };
  }
}

export async function getTrackDetails(trackId: string): Promise<ShazamRecognizeResult> {
  try {
    const url = `${SHAZAM_TRACK_URL}/${trackId}`;
    const res = await fetchWithTimeout(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    });

    if (!res.ok) {
      return { success: false, creator: "apis by Silent Wolf", error: `Track not found (${res.status})` };
    }

    const data = await res.json();
    const track = data;

    return {
      success: true,
      creator: "apis by Silent Wolf",
      title: track.title || track.heading?.title,
      artist: track.subtitle || track.heading?.subtitle,
      albumArt: track.images?.coverarthq || track.images?.coverart,
      genre: track.genres?.primary,
      shazamUrl: track.url || track.share?.href,
      trackId: track.key || trackId,
    };
  } catch {
    return { success: false, creator: "apis by Silent Wolf", error: "Failed to fetch track details." };
  }
}
