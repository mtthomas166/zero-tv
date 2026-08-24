const TMDB_KEY = import.meta.env.VITE_TMDB_KEY || "af32459863d504e3a5d04f317e7f12e1";
const BASE = "https://api.themoviedb.org/3";
const IMG_BASE = "https://image.tmdb.org/t/p";

async function tmdbFetch(path) {
  const sep = path.includes("?") ? "&" : "?";
  const url = BASE + path + sep + "api_key=" + TMDB_KEY + "&language=en-US";
  const res = await fetch(url);
  if (!res.ok) throw new Error("TMDB " + res.status + " " + url);
  return res.json();
}

function withPage(path, page) {
  const p = page || 1;
  const sep = path.includes("?") ? "&" : "?";
  return path + sep + "page=" + p;
}

export function posterUrl(path) {
  if (!path) return "/placeholder.jpg";
  return IMG_BASE + "/w500" + path;
}
export function backdropUrl(path) {
  if (!path) return "";
  return IMG_BASE + "/original" + path;
}
export function getYear(date) {
  if (!date) return "";
  return date.slice(0, 4);
}
export function formatRating(rating) {
  if (!rating) return "N/A";
  return rating.toFixed(1);
}

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

  // Anime - all with genre 16
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

  movieDetails: (id) => tmdbFetch("/movie/" + id + "?append_to_response=credits,videos,similar,images"),
  tvDetails: (id) => tmdbFetch("/tv/" + id + "?append_to_response=credits,videos,similar,images"),
  seasonDetails: (tvId, seasonNumber) => tmdbFetch("/tv/" + tvId + "/season/" + seasonNumber),
  episodeDetails: (tvId, seasonNumber, episodeNumber) => tmdbFetch("/tv/" + tvId + "/season/" + seasonNumber + "/episode/" + episodeNumber),
  searchMulti: (q, page) => tmdbFetch(withPage("/search/multi?query=" + encodeURIComponent(q), page))
};

export default api;

export function buildUniqueContent(movie) {
  if (!movie) return null;
  var title = movie.title || movie.name || "";
  var year = (movie.release_date || movie.first_air_date || "").slice(0, 4);
  var rating = movie.vote_average ? movie.vote_average.toFixed(1) : "N/A";
  var cast = movie.credits && movie.credits.cast ? movie.credits.cast.slice(0, 3).map(function(c) { return c.name; }).join(", ") : "Top cast";
  return {
    longDesc: title + " " + (year ? "(" + year + ")" : "") + " " + (movie.overview || ""),
    whyWatch: "Why watch " + title + "? Rated " + rating,
    faqs: [
      { q: "Where to watch " + title + "?", a: "On Zero TV" },
      { q: "What is the rating?", a: rating },
      { q: "Who stars?", a: cast }
    ]
  };
}
