const CREATOR = "APIs by Silent Wolf | A tech explorer";

// ─── QURAN (alquran.cloud) ────────────────────────────────────────────────────

export async function getQuranVerse(surah: number, ayah: number) {
  const [arRes, enRes] = await Promise.all([
    fetch(`https://api.alquran.cloud/v1/ayah/${surah}:${ayah}`),
    fetch(`https://api.alquran.cloud/v1/ayah/${surah}:${ayah}/en.asad`),
  ]);
  if (!arRes.ok || !enRes.ok) throw new Error("Verse not found");
  const [ar, en] = await Promise.all([arRes.json(), enRes.json()]);
  const a = ar.data; const e = en.data;
  return {
    success: true, creator: CREATOR,
    reference: `${a.surah.englishName} ${surah}:${ayah}`,
    surah: { number: a.surah.number, name: a.surah.name, englishName: a.surah.englishName, englishNameTranslation: a.surah.englishNameTranslation },
    ayah: a.numberInSurah,
    arabic: a.text,
    translation: e.text,
    translator: "Muhammad Asad",
    audio: `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${a.number}.mp3`,
  };
}

export async function getQuranSurah(surahNum: number) {
  const res = await fetch(`https://api.alquran.cloud/v1/surah/${surahNum}/en.asad`);
  if (!res.ok) throw new Error("Surah not found");
  const data = await res.json();
  const s = data.data;
  return {
    success: true, creator: CREATOR,
    number: s.number, name: s.name, englishName: s.englishName,
    englishNameTranslation: s.englishNameTranslation, numberOfAyahs: s.numberOfAyahs,
    revelationType: s.revelationType,
    ayahs: s.ayahs.map((a: any) => ({ number: a.numberInSurah, text: a.text })),
  };
}

export async function getQuranRandom() {
  const total = 6236;
  const num = Math.floor(Math.random() * total) + 1;
  const [arRes, enRes] = await Promise.all([
    fetch(`https://api.alquran.cloud/v1/ayah/${num}`),
    fetch(`https://api.alquran.cloud/v1/ayah/${num}/en.asad`),
  ]);
  if (!arRes.ok || !enRes.ok) throw new Error("Failed to fetch random verse");
  const [ar, en] = await Promise.all([arRes.json(), enRes.json()]);
  const a = ar.data; const e = en.data;
  return {
    success: true, creator: CREATOR,
    reference: `${a.surah.englishName} ${a.surah.number}:${a.numberInSurah}`,
    surah: { number: a.surah.number, name: a.surah.name, englishName: a.surah.englishName },
    ayah: a.numberInSurah, arabic: a.text, translation: e.text, translator: "Muhammad Asad",
    audio: `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${a.number}.mp3`,
  };
}

export async function searchQuran(query: string) {
  const res = await fetch(`https://api.alquran.cloud/v1/search/${encodeURIComponent(query)}/all/en.asad`);
  if (!res.ok) throw new Error("Search failed");
  const data = await res.json();
  const matches = (data.data?.matches || []).slice(0, 10);
  return {
    success: true, creator: CREATOR, query, count: matches.length,
    results: matches.map((m: any) => ({
      reference: `${m.surah.englishName} ${m.surah.number}:${m.numberInSurah}`,
      surah: m.surah.englishName, ayah: m.numberInSurah, text: m.text,
    })),
  };
}

// ─── TV SHOWS (TVMaze) ────────────────────────────────────────────────────────

export async function searchTVShows(query: string) {
  const res = await fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error("TVMaze search failed");
  const data = await res.json();
  return {
    success: true, creator: CREATOR, query,
    results: data.slice(0, 10).map((r: any) => ({
      id: r.show.id, name: r.show.name,
      status: r.show.status, type: r.show.type,
      genres: r.show.genres, language: r.show.language,
      premiered: r.show.premiered,
      rating: r.show.rating?.average,
      summary: r.show.summary?.replace(/<[^>]+>/g, ""),
      image: r.show.image?.medium || null,
      network: r.show.network?.name || r.show.webChannel?.name || null,
    })),
  };
}

export async function getTVShowInfo(id: string) {
  const res = await fetch(`https://api.tvmaze.com/shows/${id}?embed[]=episodes&embed[]=cast`);
  if (!res.ok) throw new Error("Show not found");
  const s = await res.json();
  return {
    success: true, creator: CREATOR,
    id: s.id, name: s.name, status: s.status, type: s.type,
    genres: s.genres, language: s.language,
    premiered: s.premiered, ended: s.ended,
    rating: s.rating?.average, runtime: s.runtime,
    summary: s.summary?.replace(/<[^>]+>/g, ""),
    image: s.image?.original || s.image?.medium || null,
    network: s.network?.name || s.webChannel?.name || null,
    totalEpisodes: s._embedded?.episodes?.length || 0,
    cast: (s._embedded?.cast || []).slice(0, 10).map((c: any) => ({
      name: c.person.name, character: c.character.name, image: c.person.image?.medium || null,
    })),
  };
}

export async function getTVShowEpisodes(id: string, season?: string) {
  const url = season
    ? `https://api.tvmaze.com/shows/${id}/episodes?season=${season}`
    : `https://api.tvmaze.com/shows/${id}/episodes`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Episodes not found");
  const data = await res.json();
  return {
    success: true, creator: CREATOR,
    showId: id, season: season || "all",
    count: data.length,
    episodes: data.slice(0, 50).map((e: any) => ({
      id: e.id, season: e.season, episode: e.number,
      name: e.name, airdate: e.airdate, runtime: e.runtime,
      summary: e.summary?.replace(/<[^>]+>/g, ""),
    })),
  };
}

export async function getTVSchedule(country?: string) {
  const cc = (country || "US").toUpperCase();
  const date = new Date().toISOString().split("T")[0];
  const res = await fetch(`https://api.tvmaze.com/schedule?country=${cc}&date=${date}`);
  if (!res.ok) throw new Error("Schedule fetch failed");
  const data = await res.json();
  return {
    success: true, creator: CREATOR, country: cc, date,
    count: data.length,
    schedule: data.slice(0, 20).map((e: any) => ({
      time: e.airtime, name: e.name,
      season: e.season, episode: e.number,
      show: e.show.name, network: e.show.network?.name || null,
      runtime: e.runtime,
    })),
  };
}

// ─── ANIME INFO (Jikan / MyAnimeList) ────────────────────────────────────────

export async function searchAnimeInfo(query: string, limit = 10) {
  const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=${limit}&sfw=true`);
  if (!res.ok) throw new Error("Jikan search failed");
  const data = await res.json();
  return {
    success: true, creator: CREATOR, query,
    results: (data.data || []).map((a: any) => ({
      mal_id: a.mal_id, title: a.title, title_english: a.title_english,
      type: a.type, episodes: a.episodes, status: a.status,
      score: a.score, scored_by: a.scored_by,
      rating: a.rating, genres: (a.genres || []).map((g: any) => g.name),
      synopsis: a.synopsis, year: a.year, aired: a.aired?.string,
      image: a.images?.jpg?.image_url || null,
    })),
  };
}

export async function getAnimeInfoById(id: string) {
  const res = await fetch(`https://api.jikan.moe/v4/anime/${id}/full`);
  if (!res.ok) throw new Error("Anime not found");
  const data = await res.json();
  const a = data.data;
  return {
    success: true, creator: CREATOR,
    mal_id: a.mal_id, title: a.title, title_english: a.title_english,
    type: a.type, episodes: a.episodes, status: a.status,
    score: a.score, scored_by: a.scored_by, rank: a.rank,
    popularity: a.popularity, members: a.members,
    rating: a.rating, duration: a.duration,
    genres: (a.genres || []).map((g: any) => g.name),
    themes: (a.themes || []).map((t: any) => t.name),
    studios: (a.studios || []).map((s: any) => s.name),
    synopsis: a.synopsis, background: a.background,
    year: a.year, aired: a.aired?.string,
    image: a.images?.jpg?.large_image_url || a.images?.jpg?.image_url || null,
    trailer: a.trailer?.url || null,
  };
}

export async function getTopAnime(type?: string) {
  const t = type || "tv";
  const res = await fetch(`https://api.jikan.moe/v4/top/anime?type=${t}&limit=20`);
  if (!res.ok) throw new Error("Top anime fetch failed");
  const data = await res.json();
  return {
    success: true, creator: CREATOR, type: t,
    results: (data.data || []).map((a: any) => ({
      rank: a.rank, mal_id: a.mal_id, title: a.title,
      type: a.type, episodes: a.episodes, score: a.score,
      members: a.members, genres: (a.genres || []).map((g: any) => g.name),
      image: a.images?.jpg?.image_url || null,
    })),
  };
}

export async function getRandomAnime() {
  const res = await fetch("https://api.jikan.moe/v4/random/anime");
  if (!res.ok) throw new Error("Random anime fetch failed");
  const data = await res.json();
  const a = data.data;
  return {
    success: true, creator: CREATOR,
    mal_id: a.mal_id, title: a.title, title_english: a.title_english,
    type: a.type, episodes: a.episodes, status: a.status,
    score: a.score, rating: a.rating,
    genres: (a.genres || []).map((g: any) => g.name),
    synopsis: a.synopsis, year: a.year,
    image: a.images?.jpg?.large_image_url || null,
  };
}

// ─── FOOD / MEALS (TheMealDB) ─────────────────────────────────────────────────

function formatMeal(m: any) {
  const ingredients: string[] = [];
  for (let i = 1; i <= 20; i++) {
    const ing = m[`strIngredient${i}`];
    const meas = m[`strMeasure${i}`];
    if (ing && ing.trim()) ingredients.push(`${meas?.trim() || ""} ${ing.trim()}`.trim());
  }
  return {
    id: m.idMeal, name: m.strMeal, category: m.strCategory,
    area: m.strArea, instructions: m.strInstructions,
    image: m.strMealThumb, tags: m.strTags ? m.strTags.split(",").map((t: string) => t.trim()) : [],
    youtube: m.strYoutube, source: m.strSource, ingredients,
  };
}

export async function searchMeals(query: string) {
  const res = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error("MealDB search failed");
  const data = await res.json();
  if (!data.meals) return { success: true, creator: CREATOR, query, count: 0, results: [] };
  return { success: true, creator: CREATOR, query, count: data.meals.length, results: data.meals.map(formatMeal) };
}

export async function getRandomMeal() {
  const res = await fetch("https://www.themealdb.com/api/json/v1/1/random.php");
  if (!res.ok) throw new Error("Random meal failed");
  const data = await res.json();
  return { success: true, creator: CREATOR, meal: formatMeal(data.meals[0]) };
}

export async function getMealCategories() {
  const res = await fetch("https://www.themealdb.com/api/json/v1/1/categories.php");
  if (!res.ok) throw new Error("Categories fetch failed");
  const data = await res.json();
  return {
    success: true, creator: CREATOR,
    categories: data.categories.map((c: any) => ({
      id: c.idCategory, name: c.strCategory,
      description: c.strCategoryDescription, image: c.strCategoryThumb,
    })),
  };
}

export async function getMealsByIngredient(ingredient: string) {
  const res = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?i=${encodeURIComponent(ingredient)}`);
  if (!res.ok) throw new Error("Ingredient lookup failed");
  const data = await res.json();
  if (!data.meals) return { success: true, creator: CREATOR, ingredient, count: 0, results: [] };
  return {
    success: true, creator: CREATOR, ingredient,
    count: data.meals.length,
    results: data.meals.map((m: any) => ({ id: m.idMeal, name: m.strMeal, image: m.strMealThumb })),
  };
}

// ─── COCKTAILS (TheCocktailDB) ────────────────────────────────────────────────

function formatDrink(d: any) {
  const ingredients: string[] = [];
  for (let i = 1; i <= 15; i++) {
    const ing = d[`strIngredient${i}`];
    const meas = d[`strMeasure${i}`];
    if (ing && ing.trim()) ingredients.push(`${meas?.trim() || ""} ${ing.trim()}`.trim());
  }
  return {
    id: d.idDrink, name: d.strDrink, category: d.strCategory,
    alcoholic: d.strAlcoholic, glass: d.strGlass,
    instructions: d.strInstructions, image: d.strDrinkThumb, ingredients,
  };
}

export async function searchCocktails(query: string) {
  const res = await fetch(`https://www.thecocktaildb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error("CocktailDB search failed");
  const data = await res.json();
  if (!data.drinks) return { success: true, creator: CREATOR, query, count: 0, results: [] };
  return { success: true, creator: CREATOR, query, count: data.drinks.length, results: data.drinks.map(formatDrink) };
}

export async function getRandomCocktail() {
  const res = await fetch("https://www.thecocktaildb.com/api/json/v1/1/random.php");
  if (!res.ok) throw new Error("Random cocktail failed");
  const data = await res.json();
  return { success: true, creator: CREATOR, drink: formatDrink(data.drinks[0]) };
}

export async function getCocktailsByIngredient(ingredient: string) {
  const res = await fetch(`https://www.thecocktaildb.com/api/json/v1/1/filter.php?i=${encodeURIComponent(ingredient)}`);
  if (!res.ok) throw new Error("Ingredient lookup failed");
  const data = await res.json();
  if (!data.drinks) return { success: true, creator: CREATOR, ingredient, count: 0, results: [] };
  return {
    success: true, creator: CREATOR, ingredient,
    count: data.drinks.length,
    results: data.drinks.map((d: any) => ({ id: d.idDrink, name: d.strDrink, image: d.strDrinkThumb })),
  };
}

// ─── POKEMON (PokeAPI) ───────────────────────────────────────────────────────

export async function getPokemonInfo(name: string) {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${name.toLowerCase()}`);
  if (!res.ok) throw new Error(`Pokemon "${name}" not found`);
  const p = await res.json();
  const specRes = await fetch(p.species.url);
  const spec = specRes.ok ? await specRes.json() : null;
  const desc = spec?.flavor_text_entries?.find((f: any) => f.language.name === "en")?.flavor_text?.replace(/\f|\n/g, " ") || null;
  return {
    success: true, creator: CREATOR,
    id: p.id, name: p.name,
    types: p.types.map((t: any) => t.type.name),
    abilities: p.abilities.map((a: any) => ({ name: a.ability.name, hidden: a.is_hidden })),
    stats: Object.fromEntries(p.stats.map((s: any) => [s.stat.name.replace("-", "_"), s.base_stat])),
    height_m: p.height / 10, weight_kg: p.weight / 10,
    base_experience: p.base_experience,
    moves_count: p.moves.length,
    image: p.sprites.other?.["official-artwork"]?.front_default || p.sprites.front_default,
    shiny: p.sprites.other?.["official-artwork"]?.front_shiny || p.sprites.front_shiny,
    description: desc,
    generation: spec?.generation?.name || null,
  };
}

export async function getRandomPokemon() {
  const id = Math.floor(Math.random() * 1025) + 1;
  return getPokemonInfo(String(id));
}

export async function getPokemonTypes() {
  const res = await fetch("https://pokeapi.co/api/v2/type?limit=20");
  if (!res.ok) throw new Error("Types fetch failed");
  const data = await res.json();
  return {
    success: true, creator: CREATOR,
    types: data.results.map((t: any) => t.name).filter((t: string) => !["unknown", "shadow"].includes(t)),
  };
}

export async function getPokemonByType(type: string) {
  const res = await fetch(`https://pokeapi.co/api/v2/type/${type.toLowerCase()}`);
  if (!res.ok) throw new Error(`Type "${type}" not found`);
  const data = await res.json();
  const pokemon = data.pokemon.slice(0, 20).map((p: any) => p.pokemon.name);
  return { success: true, creator: CREATOR, type, count: data.pokemon.length, sample: pokemon };
}

// ─── NASA ─────────────────────────────────────────────────────────────────────

const NASA_KEY = process.env.NASA_API_KEY || "DEMO_KEY";

export async function getNASAapod(date?: string) {
  const url = date
    ? `https://api.nasa.gov/planetary/apod?api_key=${NASA_KEY}&date=${date}`
    : `https://api.nasa.gov/planetary/apod?api_key=${NASA_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("NASA APOD fetch failed");
  const d = await res.json();
  return {
    success: true, creator: CREATOR,
    date: d.date, title: d.title, explanation: d.explanation,
    media_type: d.media_type, url: d.url, hdurl: d.hdurl || d.url,
    copyright: d.copyright || null,
  };
}

export async function getNASAneo() {
  const res = await fetch(`https://api.nasa.gov/neo/rest/v1/feed/today?detailed=false&api_key=${NASA_KEY}`);
  if (!res.ok) throw new Error("NASA NEO fetch failed");
  const data = await res.json();
  const dateKey = Object.keys(data.near_earth_objects)[0];
  const neos = data.near_earth_objects[dateKey] || [];
  return {
    success: true, creator: CREATOR,
    date: dateKey, count: data.element_count,
    objects: neos.map((n: any) => ({
      name: n.name, id: n.id,
      hazardous: n.is_potentially_hazardous_asteroid,
      diameter_km: {
        min: parseFloat(n.estimated_diameter.kilometers.estimated_diameter_min.toFixed(3)),
        max: parseFloat(n.estimated_diameter.kilometers.estimated_diameter_max.toFixed(3)),
      },
      close_approach: {
        date: n.close_approach_data[0]?.close_approach_date,
        velocity_kph: parseFloat(parseFloat(n.close_approach_data[0]?.relative_velocity.kilometers_per_hour).toFixed(2)),
        miss_distance_km: parseFloat(parseFloat(n.close_approach_data[0]?.miss_distance.kilometers).toFixed(0)),
      },
      nasa_url: n.nasa_jpl_url,
    })),
  };
}

// ─── CHUCK NORRIS ────────────────────────────────────────────────────────────

export async function getChuckNorrisJoke(category?: string) {
  const url = category
    ? `https://api.chucknorris.io/jokes/random?category=${category}`
    : "https://api.chucknorris.io/jokes/random";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Chuck Norris API failed");
  const d = await res.json();
  return { success: true, creator: CREATOR, joke: d.value, category: d.categories?.[0] || "general", id: d.id };
}

export async function getChuckNorrisCategories() {
  const res = await fetch("https://api.chucknorris.io/jokes/categories");
  if (!res.ok) throw new Error("Categories fetch failed");
  const data = await res.json();
  return { success: true, creator: CREATOR, categories: data };
}

// ─── PUBLIC HOLIDAYS (Nager.Date) ────────────────────────────────────────────

export async function getPublicHolidays(country: string, year?: string) {
  const y = year || new Date().getFullYear().toString();
  const cc = country.toUpperCase();
  const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${y}/${cc}`);
  if (!res.ok) throw new Error(`No holiday data for country "${cc}" year ${y}`);
  const data = await res.json();
  return {
    success: true, creator: CREATOR, country: cc, year: y,
    count: data.length,
    holidays: data.map((h: any) => ({
      date: h.date, name: h.name, localName: h.localName,
      type: h.types?.[0] || "Public", global: h.global,
    })),
  };
}

export async function getNextHoliday(country: string) {
  const y = new Date().getFullYear().toString();
  const cc = country.toUpperCase();
  const res = await fetch(`https://date.nager.at/api/v3/NextPublicHolidaysWorldwide`);
  const res2 = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${y}/${cc}`);
  if (!res2.ok) throw new Error(`No holiday data for "${cc}"`);
  const data = await res2.json();
  const today = new Date().toISOString().split("T")[0];
  const next = data.find((h: any) => h.date >= today);
  if (!next) return { success: true, creator: CREATOR, country: cc, message: "No upcoming holidays found this year" };
  const daysUntil = Math.ceil((new Date(next.date).getTime() - new Date().getTime()) / 86400000);
  return {
    success: true, creator: CREATOR, country: cc,
    next: { date: next.date, name: next.name, localName: next.localName, daysUntil },
  };
}
