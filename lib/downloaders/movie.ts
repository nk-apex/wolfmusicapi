const OMDB_KEY = "trilogy";
const OMDB_BASE = "https://www.omdbapi.com";
const YTS_BASE = "https://yts.mx/api/v2";

async function omdbFetch(params: Record<string, string>): Promise<any> {
  const url = new URL(OMDB_BASE);
  url.searchParams.set("apikey", OMDB_KEY);
  for (const [k, v] of Object.entries(params)) {
    if (v) url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`OMDb API error: ${res.status}`);
  const data = await res.json() as any;
  if (data.Response === "False") throw new Error(data.Error || "Movie not found");
  return data;
}

async function ytsFetch(path: string, params: Record<string, string> = {}): Promise<any> {
  const url = new URL(`${YTS_BASE}${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (v) url.searchParams.set(k, v);
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url.toString(), { headers: { Accept: "application/json" }, signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`YTS API error: ${res.status}`);
    const data = await res.json() as any;
    return data.data;
  } catch (e: any) {
    clearTimeout(timeout);
    throw new Error("Movie listing service temporarily unavailable");
  }
}

function formatOmdbMovie(m: any) {
  return {
    title: m.Title,
    year: m.Year,
    imdbId: m.imdbID,
    type: m.Type,
    poster: m.Poster !== "N/A" ? m.Poster : null,
  };
}

function formatOmdbDetail(m: any) {
  return {
    title: m.Title,
    year: m.Year,
    rated: m.Rated,
    released: m.Released,
    runtime: m.Runtime,
    genre: m.Genre,
    director: m.Director,
    writer: m.Writer,
    actors: m.Actors,
    plot: m.Plot,
    language: m.Language,
    country: m.Country,
    awards: m.Awards,
    poster: m.Poster !== "N/A" ? m.Poster : null,
    ratings: m.Ratings?.map((r: any) => ({ source: r.Source, value: r.Value })),
    imdbRating: m.imdbRating,
    imdbVotes: m.imdbVotes,
    imdbId: m.imdbID,
    type: m.Type,
    boxOffice: m.BoxOffice,
    production: m.Production,
    website: m.Website !== "N/A" ? m.Website : null,
  };
}

function formatYtsMovie(m: any) {
  return {
    id: m.id,
    title: m.title,
    year: m.year,
    rating: m.rating,
    runtime: m.runtime,
    genres: m.genres,
    summary: m.summary || m.description_full,
    poster: m.medium_cover_image,
    posterLarge: m.large_cover_image,
    backdrop: m.background_image,
    language: m.language,
    imdbCode: m.imdb_code,
    torrents: m.torrents?.map((t: any) => ({
      quality: t.quality,
      type: t.type,
      size: t.size,
      seeds: t.seeds,
      peers: t.peers,
    })),
  };
}

export async function searchMovies(query: string, page?: string) {
  const data = await omdbFetch({ s: query, page: page || "1", type: "movie" });
  return {
    totalResults: parseInt(data.totalResults || "0"),
    movies: (data.Search || []).map(formatOmdbMovie),
  };
}

export async function getMovieInfo(id: string) {
  const data = await omdbFetch({ i: id, plot: "full" });
  return formatOmdbDetail(data);
}

export async function getMovieTrailer(id: string) {
  const searchRes = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(id + " official trailer")}&type=video&maxResults=5&key=`, { headers: { Accept: "application/json" } });

  const omdbData = await omdbFetch({ i: id, plot: "short" });
  const title = omdbData.Title;
  const year = omdbData.Year;

  const ytSearchRes = await fetch(`https://vid.puffyan.us/api/v1/search?q=${encodeURIComponent(title + " " + year + " official trailer")}&type=video`, {
    headers: { Accept: "application/json" },
  });

  if (ytSearchRes.ok) {
    const ytData = await ytSearchRes.json() as any[];
    if (ytData && ytData.length > 0) {
      return {
        title: `${title} (${year}) - Official Trailer`,
        videos: ytData.slice(0, 5).map((v: any) => ({
          title: v.title,
          videoId: v.videoId,
          url: `https://www.youtube.com/watch?v=${v.videoId}`,
          thumbnail: v.videoThumbnails?.[0]?.url,
          duration: v.lengthSeconds,
          author: v.author,
        })),
      };
    }
  }

  return {
    title: `${title} (${year}) - Official Trailer`,
    searchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(title + " " + year + " official trailer")}`,
    videos: [],
  };
}

export async function getTrendingMovies(timeWindow?: string) {
  try {
    const data = await ytsFetch("/list_movies.json", {
      sort_by: "download_count",
      limit: "20",
      order_by: "desc",
    });
    return {
      timeWindow: timeWindow || "day",
      movies: (data.movies || []).map(formatYtsMovie),
    };
  } catch {
    const currentYear = new Date().getFullYear();
    const data = await omdbFetch({ s: "movie", y: currentYear.toString(), type: "movie" });
    return {
      timeWindow: timeWindow || "day",
      source: "OMDb",
      movies: (data.Search || []).map(formatOmdbMovie),
    };
  }
}

export async function getPopularMovies(page?: string) {
  try {
    const data = await ytsFetch("/list_movies.json", { sort_by: "like_count", limit: "20", page: page || "1", order_by: "desc" });
    return { page: parseInt(page || "1"), totalResults: data.movie_count || 0, movies: (data.movies || []).map(formatYtsMovie) };
  } catch {
    const data = await omdbFetch({ s: "avengers", type: "movie", page: page || "1" });
    return { page: parseInt(page || "1"), source: "OMDb", movies: (data.Search || []).map(formatOmdbMovie) };
  }
}

export async function getUpcomingMovies(page?: string) {
  try {
    const data = await ytsFetch("/list_movies.json", { sort_by: "year", minimum_rating: "0", limit: "20", page: page || "1", order_by: "desc" });
    return { page: parseInt(page || "1"), movies: (data.movies || []).filter((m: any) => m.year >= new Date().getFullYear()).map(formatYtsMovie) };
  } catch {
    const year = (new Date().getFullYear()).toString();
    const data = await omdbFetch({ s: "movie", y: year, type: "movie" });
    return { page: parseInt(page || "1"), source: "OMDb", movies: (data.Search || []).map(formatOmdbMovie) };
  }
}

export async function getTopRatedMovies(page?: string) {
  try {
    const data = await ytsFetch("/list_movies.json", { sort_by: "rating", minimum_rating: "8", limit: "20", page: page || "1", order_by: "desc" });
    return { page: parseInt(page || "1"), totalResults: data.movie_count || 0, movies: (data.movies || []).map(formatYtsMovie) };
  } catch {
    const data = await omdbFetch({ s: "godfather", type: "movie" });
    return { page: parseInt(page || "1"), source: "OMDb", movies: (data.Search || []).map(formatOmdbMovie) };
  }
}

export async function getNowPlayingMovies(page?: string) {
  try {
    const data = await ytsFetch("/list_movies.json", { sort_by: "date_added", limit: "20", page: page || "1", order_by: "desc" });
    return { page: parseInt(page || "1"), movies: (data.movies || []).map(formatYtsMovie) };
  } catch {
    const year = (new Date().getFullYear()).toString();
    const data = await omdbFetch({ s: "new", y: year, type: "movie" });
    return { page: parseInt(page || "1"), source: "OMDb", movies: (data.Search || []).map(formatOmdbMovie) };
  }
}

export async function getSimilarMovies(id: string) {
  try {
    const data = await ytsFetch("/movie_suggestions.json", { movie_id: id });
    return { movies: (data.movies || []).map(formatYtsMovie) };
  } catch {
    const movieData = await omdbFetch({ i: id, plot: "short" });
    const genre = movieData.Genre?.split(",")[0]?.trim() || "action";
    const data = await omdbFetch({ s: genre, type: "movie" });
    return { source: "OMDb", movies: (data.Search || []).map(formatOmdbMovie) };
  }
}

export async function getMovieCredits(id: string) {
  const data = await omdbFetch({ i: id, plot: "full" });
  const actors = data.Actors?.split(", ") || [];
  const directors = data.Director?.split(", ") || [];
  const writers = data.Writer?.split(", ") || [];

  return {
    cast: actors.map((name: string) => ({ name, role: "Actor" })),
    crew: [
      ...directors.map((name: string) => ({ name, job: "Director" })),
      ...writers.map((name: string) => ({ name, job: "Writer" })),
    ],
  };
}

export async function getMovieReviews(id: string) {
  const data = await omdbFetch({ i: id, plot: "full" });
  return {
    title: data.Title,
    ratings: (data.Ratings || []).map((r: any) => ({ source: r.Source, value: r.Value })),
    imdbRating: data.imdbRating,
    imdbVotes: data.imdbVotes,
    metascore: data.Metascore,
    awards: data.Awards,
  };
}

export async function getMovieGenres() {
  return {
    genres: [
      { id: "action", name: "Action" }, { id: "adventure", name: "Adventure" },
      { id: "animation", name: "Animation" }, { id: "biography", name: "Biography" },
      { id: "comedy", name: "Comedy" }, { id: "crime", name: "Crime" },
      { id: "documentary", name: "Documentary" }, { id: "drama", name: "Drama" },
      { id: "family", name: "Family" }, { id: "fantasy", name: "Fantasy" },
      { id: "film-noir", name: "Film-Noir" }, { id: "history", name: "History" },
      { id: "horror", name: "Horror" }, { id: "music", name: "Music" },
      { id: "musical", name: "Musical" }, { id: "mystery", name: "Mystery" },
      { id: "romance", name: "Romance" }, { id: "sci-fi", name: "Sci-Fi" },
      { id: "sport", name: "Sport" }, { id: "thriller", name: "Thriller" },
      { id: "war", name: "War" }, { id: "western", name: "Western" },
    ],
  };
}

export async function discoverMovies(genreId?: string, year?: string, sortBy?: string) {
  try {
    const params: Record<string, string> = { limit: "20", sort_by: sortBy || "rating", order_by: "desc" };
    if (genreId) params.genre = genreId;
    if (year) params.query_term = year;
    if (year) params.minimum_rating = "0";
    const data = await ytsFetch("/list_movies.json", params);
    return { totalResults: data.movie_count || 0, movies: (data.movies || []).map(formatYtsMovie) };
  } catch {
    const searchTerm = genreId || "action";
    const params: Record<string, string> = { s: searchTerm, type: "movie" };
    if (year) params.y = year;
    const data = await omdbFetch(params);
    return { source: "OMDb", movies: (data.Search || []).map(formatOmdbMovie) };
  }
}
