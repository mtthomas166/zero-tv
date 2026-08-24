const TMDB_KEY = import.meta.env.VITE_TMDB_KEY || "af32459863d504e3a5d04f317e7f12e1";
const BASE = "https://api.themoviedb.org/3";
const IMG_BASE = "https://image.tmdb.org/t/p";

async function tmdbFetch(path) {
  const sep = path.includes("?") ? "&" : "?";
  const url = BASE + path + sep + "api_key=" + TMDB_KEY + "&language=en-US";
  const res = await fetch(url);
  if (!res.ok) throw new Error("TMDB " + res.status);
  return res.json();
}
function withPage(path, page) {
  const p = page || 1;
  const sep = path.includes("?") ? "&" : "?";
  return path + sep + "page=" + p;
}
export function posterUrl(p) { return p ? IMG_BASE + "/w500" + p : "/placeholder.jpg"; }
export function backdropUrl(p) { return p ? IMG_BASE + "/original" + p : ""; }
export function getYear(d) { return d ? d.slice(0,4) : ""; }
export function formatRating(r) { return r ? r.toFixed(1) : "N/A"; }

export const api = {
  trendingMovies: (page) => tmdbFetch(withPage("/trending/movie/day", page)),
  popularMovies: (page) => tmdbFetch(withPage("/movie/popular", page)),
  topRatedMovies: (page) => tmdbFetch(withPage("/movie/top_rated", page)),
  nowPlayingMovies: (page) => tmdbFetch(withPage("/movie/now_playing", page)),
  upcomingMovies: (page) => tmdbFetch(withPage("/movie/upcoming", page)),
  trendingTV: (page) => tmdbFetch(withPage("/trending/tv/day", page)),
  popularTV: (page) => tmdbFetch(withPage("/tv/popular", page)),
  topRatedTV: (page) => tmdbFetch(withPage("/tv/top_rated", page)),
  airingTodayTV: (page) => tmdbFetch(withPage("/tv/airing_today", page)),
  onTheAirTV: (page) => tmdbFetch(withPage("/tv/on_the_air", page)),
  animeTrending: (page) => tmdbFetch(withPage("/discover/tv?with_genres=16&sort_by=popularity.desc", page)),
  trendingAnime: (page) => tmdbFetch(withPage("/discover/tv?with_genres=16&sort_by=popularity.desc", page)),
  popularAnime: (page) => tmdbFetch(withPage("/discover/tv?with_genres=16&sort_by=popularity.desc", page)),
  animePopular: (page) => tmdbFetch(withPage("/discover/tv?with_genres=16&sort_by=popularity.desc", page)),
  topRatedAnime: (page) => tmdbFetch(withPage("/discover/tv?with_genres=16&sort_by=vote_average.desc&vote_count.gte=100", page)),
  animeTopRated: (page) => tmdbFetch(withPage("/discover/tv?with_genres=16&sort_by=vote_average.desc&vote_count.gte=100", page)),
  animeAiring: (page) => tmdbFetch(withPage("/tv/on_the_air", page)),
  animeUpcoming: (page) => tmdbFetch(withPage("/discover/tv?with_genres=16&sort_by=first_air_date.desc&first_air_date.gte=2025-01-01", page)),
  airingAnime: (page) => tmdbFetch(withPage("/tv/on_the_air", page)),
  upcomingAnime: (page) => tmdbFetch(withPage("/discover/tv?with_genres=16&sort_by=first_air_date.desc&first_air_date.gte=2025-01-01", page)),
  movieDetails: (id) => tmdbFetch("/movie/" + id + "?append_to_response=credits,videos,similar,genres"),
  tvDetails: (id) => tmdbFetch("/tv/" + id + "?append_to_response=credits,videos,similar,genres"),
  seasonDetails: (tvId, s) => tmdbFetch("/tv/" + tvId + "/season/" + s),
  episodeDetails: (tvId, s, e) => tmdbFetch("/tv/" + tvId + "/season/" + s + "/episode/" + e),
  searchMulti: (q, page) => tmdbFetch(withPage("/search/multi?query=" + encodeURIComponent(q), page))
};
export default api;

// --- UNIQUE SEO CONTENT GENERATOR - 100% UNIQUE ---
export function buildUniqueContent(media) {
  if (!media) return null;
  const isMovie = !!media.title;
  const title = media.title || media.name || "This title";
  const year = (media.release_date || media.first_air_date || "").slice(0,4);
  const rating = media.vote_average ? media.vote_average.toFixed(1) : "N/A";
  const votes = media.vote_count ? media.vote_count.toLocaleString() : "thousands";
  const genres = media.genres && media.genres.length ? media.genres.map(g=>g.name).join(", ") : (isMovie ? "Drama, Thriller" : "Drama");
  const runtime = media.runtime || (media.episode_run_time && media.episode_run_time[0]) || 45;
  const seasons = media.number_of_seasons || "";
  const castArr = media.credits && media.credits.cast ? media.credits.cast.slice(0,5) : [];
  const castNames = castArr.map(c=>c.name).join(", ");
  const director = media.credits && media.credits.crew ? (media.credits.crew.find(c=>c.job==="Director") || {}).name : "";
  const creator = media.created_by && media.created_by[0] ? media.created_by[0].name : director;
  const overview = media.overview || "";

  const typeLabel = isMovie ? "movie" : "TV show";
  
  const longDesc = `
Watch ${title} ${year ? `(${year})` : ""} online on Zero TV. ${title} is a standout ${genres} ${typeLabel} ${isMovie ? `with a runtime of ${runtime} minutes` : (seasons ? `spanning ${seasons} season${seasons>1?'s':''}` : "")} that has earned a ${rating}/10 rating from ${votes} votes on TMDB.

${overview ? `Plot: ${overview}` : ""}

What makes ${title} unique? ${castNames ? `Featuring ${castNames},` : ""} ${creator ? `created by ${creator},` : ""} the ${typeLabel} blends ${genres.toLowerCase()} elements with compelling storytelling. ${isMovie ? `Released in ${year}, it delivers ${runtime} minutes of immersive cinema.` : `Since ${year}, it has built a loyal audience with its ${runtime}-minute episodes.`} On Zero TV you can explore cast details, trailers, similar titles, and where the story fits in the ${genres} landscape.

Whether you are searching for ${title} streaming, ${title} full ${typeLabel}, or ${title} cast and story explained, this page gives you a complete, unique overview you won't find on generic database sites. We focus on context, watch reasons, and FAQs tailored to ${title} specifically.
`.trim();

  const whyWatch = `Why watch ${title} on Zero TV? Because it offers ${genres} storytelling with a ${rating} rating, ${castNames ? `strong performances from ${castNames.split(",").slice(0,2).join(" and ")},` : ""} and ${isMovie ? "a tight cinematic experience" : `${seasons ? `${seasons} seasons` : "multiple seasons"} of binge-worthy content`}. If you like ${genres} ${typeLabel}s with high audience scores, ${title} deserves your watchlist.`;

  const faqs = [
    { q: `Where can I watch ${title} online?`, a: `You can explore ${title} ${year ? `(${year})` : ""} details, trailers, cast, and similar titles right here on Zero TV. We provide streaming information, overview, and recommendations in one place.` },
    { q: `What is ${title} about?`, a: overview ? overview.slice(0,350) + "..." : `${title} is a ${genres} ${typeLabel} ${year ? `from ${year}` : ""} centered around compelling characters and a ${genres.toLowerCase()} storyline.` },
    { q: `Who stars in ${title}?`, a: castNames ? `${title} stars ${castNames}. ${creator ? `Created/Directed by ${creator}.` : ""}` : `${title} features a talented ensemble cast in the ${genres} genre.` },
    { q: `What is the rating of ${title}?`, a: `${title} holds a ${rating}/10 rating from ${votes} votes. It is recognized as a ${parseFloat(rating) >= 7.5 ? "highly rated" : "popular"} title in ${genres}.` },
    { q: `Is ${title} worth watching?`, a: `Yes, if you enjoy ${genres}. ${whyWatch}` },
    { q: `How long is ${title}?`, a: isMovie ? `${title} has a runtime of ${runtime} minutes.` : `${title} has ${seasons ? `${seasons} season${seasons>1?'s':''} with ~${runtime} minutes per episode` : `episodes around ${runtime} minutes`}.` },
  ];

  const metaDescription = `Watch ${title} ${year ? `(${year})` : ""} - ${genres} ${typeLabel} rated ${rating}/10. ${overview ? overview.slice(0,120) : `Starring ${castNames}`}. Full cast, trailer & more on Zero TV.`;

  return { longDesc, whyWatch, faqs, metaDescription, title, year, genres, rating, typeLabel };
}
