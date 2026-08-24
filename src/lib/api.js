const TMDB_KEY = import.meta.env.VITE_TMDB_KEY || 'af32459863d504e3a5d04f317e7f12e1';
const BASE = 'https://api.themoviedb.org/3';

async function tmdbFetch(path) {
  const sep = path.includes('?') ? '&' : '?';
  const url = `${BASE}${path}${sep}api_key=${TMDB_KEY}&language=en-US`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDB error ${res.status}`);
  return res.json();
}

function animeDiscovery(sort) {
  return `/discover/tv?with_genres=16&with_original_language=ja&sort_by=${sort}`;
}

const baseApi = {
  trendingMovies: () => tmdbFetch('/trending/movie/day'),
  popularMovies: () => tmdbFetch('/movie/popular'),
  topRatedMovies: () => tmdbFetch('/movie/top_rated'),
  nowPlayingMovies: () => tmdbFetch('/movie/now_playing'),
  upcomingMovies: () => tmdbFetch('/movie/upcoming'),
  nowPlaying: () => tmdbFetch('/movie/now_playing'),
  upcoming: () => tmdbFetch('/movie/upcoming'),
  trendingTV: () => tmdbFetch('/trending/tv/day'),
  popularTV: () => tmdbFetch('/tv/popular'),
  topRatedTV: () => tmdbFetch('/tv/top_rated'),
  airingTodayTV: () => tmdbFetch('/tv/airing_today'),
  onTheAirTV: () => tmdbFetch('/tv/on_the_air'),
  onTheAir: () => tmdbFetch('/tv/on_the_air'),
  airingToday: () => tmdbFetch('/tv/airing_today'),
  animeTrending: () => tmdbFetch(animeDiscovery('popularity.desc')),
  trendingAnime: () => tmdbFetch(animeDiscovery('popularity.desc')),
  popularAnime: () => tmdbFetch('/discover/tv?with_genres=16&sort_by=popularity.desc'),
  topRatedAnime: () => tmdbFetch('/discover/tv?with_genres=16&sort_by=vote_average.desc&vote_count.gte=100'),
  animeTopRated: () => tmdbFetch('/discover/tv?with_genres=16&sort_by=vote_average.desc&vote_count.gte=100'),
  animePopular: () => tmdbFetch('/discover/tv?with_genres=16&sort_by=popularity.desc'),
  airingNowAnime: () => tmdbFetch(animeDiscovery('popularity.desc')),
  upcomingAnime: () => tmdbFetch(animeDiscovery('popularity.desc')),
  movieDetails: (id) => tmdbFetch(`/movie/${id}?append_to_response=credits,videos,similar,images`),
  tvDetails: (id) => tmdbFetch(`/tv/${id}?append_to_response=credits,videos,similar,images`),
  searchMulti: (q) => tmdbFetch(`/search/multi?query=${encodeURIComponent(q)}`),
};

export const api = new Proxy(baseApi, {
  get(target, prop) {
    if (prop in target) return target[prop];
    return () => tmdbFetch('/trending/all/day');
  }
});

export function buildUniqueContent(movie) {
  if (!movie) return null;
  const title = movie.title || movie.name || '';
  const year = (movie.release_date || movie.first_air_date || '').slice(0,4);
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
  const cast = movie.credits?.cast?.slice(0,3).map(c=>c.name).join(', ') || 'Top cast';
  const director = movie.credits?.crew?.find(c=>c.job==='Director')?.name || '';
  return {
    longDesc: `${title} ${year ? `(${year})` : ''} is a ${rating}/10 title. ${movie.overview || ''} Starring ${cast}. ${director ? `Directed by ${director}.` : ''} Watch ${title} in HD on Zero TV with multiple servers and no ads on main server.`,
    whyWatch: `Why watch ${title}? Rated ${rating}, with strong cast including ${cast}. ${movie.overview?.slice(0,150) || ''}`,
    faqs: [
      { q: `Where to watch ${title}?`, a: `You can watch ${title} free on Zero TV in HD with 8 servers.` },
      { q: `What is the rating of ${title}?`, a: `${title} has a rating of ${rating}/10 on TMDB with ${movie.vote_count || 0} votes.` },
      { q: `Who stars in ${title}?`, a: `${cast} star in ${title}.` },
    ]
  };
}
