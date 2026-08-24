const TMDB_KEY = import.meta.env.VITE_TMDB_KEY || "af32459863d504e3a5d04f317e7f12e1";
const BASE = "https://api.themoviedb.org/3";

async function tmdbFetch(path) {
  const sep = path.includes("?") ? "&" : "?";
  const url = BASE + path + sep + "api_key=" + TMDB_KEY + "&language=en-US";
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("TMDB " + res.status);
  }
  return res.json();
}

export const api = {
  trendingMovies: function() { return tmdbFetch("/trending/movie/day"); },
  popularMovies: function() { return tmdbFetch("/movie/popular"); },
  topRatedMovies: function() { return tmdbFetch("/movie/top_rated"); },
  nowPlayingMovies: function() { return tmdbFetch("/movie/now_playing"); },
  upcomingMovies: function() { return tmdbFetch("/movie/upcoming"); },
  trendingTV: function() { return tmdbFetch("/trending/tv/day"); },
  popularTV: function() { return tmdbFetch("/tv/popular"); },
  topRatedTV: function() { return tmdbFetch("/tv/top_rated"); },
  airingTodayTV: function() { return tmdbFetch("/tv/airing_today"); },
  onTheAirTV: function() { return tmdbFetch("/tv/on_the_air"); },
  animeTrending: function() { return tmdbFetch("/discover/tv?with_genres=16&with_original_language=ja&sort_by=popularity.desc"); },
  trendingAnime: function() { return tmdbFetch("/discover/tv?with_genres=16&with_original_language=ja&sort_by=popularity.desc"); },
  popularAnime: function() { return tmdbFetch("/discover/tv?with_genres=16&sort_by=popularity.desc"); },
  topRatedAnime: function() { return tmdbFetch("/discover/tv?with_genres=16&sort_by=vote_average.desc&vote_count.gte=100"); },
  animeTopRated: function() { return tmdbFetch("/discover/tv?with_genres=16&sort_by=vote_average.desc&vote_count.gte=100"); },
  movieDetails: function(id) { return tmdbFetch("/movie/" + id + "?append_to_response=credits,videos,similar,images"); },
  tvDetails: function(id) { return tmdbFetch("/tv/" + id + "?append_to_response=credits,videos,similar,images"); },
  searchMulti: function(q) { return tmdbFetch("/search/multi?query=" + encodeURIComponent(q)); }
};

export default api;

export function buildUniqueContent(movie) {
  if (!movie) return null;
  var title = movie.title || movie.name || "";
  var year = (movie.release_date || movie.first_air_date || "").slice(0, 4);
  var rating = movie.vote_average ? movie.vote_average.toFixed(1) : "N/A";
  var cast = movie.credits && movie.credits.cast ? movie.credits.cast.slice(0, 3).map(function(c) { return c.name; }).join(", ") : "Top cast";
  var director = "";
  if (movie.credits && movie.credits.crew) {
    var d = movie.credits.crew.find(function(c) { return c.job === "Director"; });
    if (d) director = d.name;
  }
  return {
    longDesc: title + " " + (year ? "(" + year + ")" : "") + " is a " + rating + "/10 title. " + (movie.overview || "") + " Starring " + cast + ".",
    whyWatch: "Why watch " + title + "? Rated " + rating + ", starring " + cast + ".",
    faqs: [
      { q: "Where to watch " + title + "?", a: "You can watch " + title + " free on Zero TV in HD." },
      { q: "What is the rating of " + title + "?", a: title + " has " + rating + "/10." },
      { q: "Who stars in " + title + "?", a: cast + " star in " + title + "." }
    ]
  };
}
