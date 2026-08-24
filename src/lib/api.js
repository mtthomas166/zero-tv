export const TMDB_KEY = import.meta.env.VITE_TMDB_KEY || 'af32459863d504e3a5d04f317e7f12e1'

export const EMBED_SERVERS = {
  multiembed: {
    name: 'MultiEmbed - No Ads',
    movie: (id) => `https://multiembed.mov/?video_id=${id}&tmdb=1`,
    tv: (id, s, e) => `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`,
  },
  smashy: {
    name: 'SmashyStream - No Ads',
    movie: (id) => `https://player.smashy.stream/movie/${id}`,
    tv: (id, s, e) => `https://player.smashy.stream/tv/${id}?s=${s}&e=${e}`,
  },
  autoembed: {
    name: 'AutoEmbed',
    movie: (id) => `https://autoembed.co/movie/tmdb/${id}`,
    tv: (id, s, e) => `https://autoembed.co/tv/tmdb/${id}-${s}-${e}`,
  },
  vidsrc_su: {
    name: 'VidSrc.su',
    movie: (id) => `https://vidsrc.su/embed/movie/${id}`,
    tv: (id, s, e) => `https://vidsrc.su/embed/tv/${id}/${s}/${e}`,
  },
  _2embed: {
    name: '2Embed',
    movie: (id) => `https://www.2embed.cc/embed/${id}`,
    tv: (id, s, e) => `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}`,
  },
  vidsrc_to: {
    name: 'VidSrc.to - Fallback',
    movie: (id) => `https://vidsrc.to/embed/movie/${id}`,
    tv: (id, s, e) => `https://vidsrc.to/embed/tv/${id}/${s}/${e}`,
  },
};

export function getEmbedUrl(tmdbId, type = 'movie', season = 1, episode = 1, serverKey = 'multiembed') {
  const server = EMBED_SERVERS[serverKey] || EMBED_SERVERS.multiembed;
  return type === 'movie'? server.movie(tmdbId) : server.tv(tmdbId, season, episode);
}

export const IMG_BASE = 'https://image.tmdb.org/t/p/w300'
export const IMG_BASE_LG = 'https://image.tmdb.org/t/p/w780'

async function tmdbFetch(path) {
  const separator = path.includes('?')? '&' : '?'
  const url = `https://api.themoviedb.org/3${path}${separator}api_key=${TMDB_KEY}&language=en-US`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`TMDB error: ${res.status}`)
  return res.json()
}

async function tmdbTVDetails(id) {
  return tmdbFetch(`/tv/${id}?append_to_response=credits,videos,keywords`)
}

function animeDiscover(page = 1, extra = '') {
  return tmdbFetch(`/discover/tv?with_genres=16&with_origin_country=JP&page=${page}${extra}`)
}
function today() { return new Date().toISOString().slice(0, 10) }

export const api = {
  trendingMovies: (page = 1) => tmdbFetch(`/trending/movie/week?page=${page}`),
  popularMovies: (page = 1) => tmdbFetch(`/movie/popular?page=${page}`),
  topRatedMovies: (page = 1) => tmdbFetch(`/movie/top_rated?page=${page}`),
  nowPlayingMovies: (page = 1) => tmdbFetch(`/movie/now_playing?page=${page}`),
  upcomingMovies: (page = 1) => tmdbFetch(`/movie/upcoming?page=${page}`),
  trendingTV: (page = 1) => tmdbFetch(`/trending/tv/week?page=${page}`),
  popularTV: (page = 1) => tmdbFetch(`/tv/popular?page=${page}`),
  topRatedTV: (page = 1) => tmdbFetch(`/tv/top_rated?page=${page}`),
  searchMovies: (q, page = 1) => tmdbFetch(`/search/movie?query=${encodeURIComponent(q)}&page=${page}`),
  searchTV: (q, page = 1) => tmdbFetch(`/search/tv?query=${encodeURIComponent(q)}&page=${page}`),
  movieDetails: (id) => tmdbFetch(`/movie/${id}?append_to_response=credits,videos,keywords`),
  tvDetails: (id) => tmdbTVDetails(id),
  getTVDetails: (id) => tmdbTVDetails(id),
  seasonDetails: (id, season) => tmdbFetch(`/tv/${id}/season/${season}`),
}

// Unique content builder for SEO - 100% English
export function buildUniqueContent(movie) {
  const cast = movie.credits?.cast?.slice(0, 5).map(c => c.name).join(', ') || 'N/A'
  const director = movie.credits?.crew?.find(c => c.job === 'Director')?.name || 'Unknown'
  const genres = movie.genres?.map(g => g.name).join(', ') || 'Drama'
  const keywords = movie.keywords?.keywords?.slice(0, 3).map(k => k.name).join(', ') || genres
  const story = movie.overview || movie.tagline || `A ${genres} film titled ${movie.title}.`
  const year = movie.release_date?.slice(0,4) || 'N/A'

  return {
    longDesc: `${movie.title} (${year}) originally titled ${movie.original_title} is a ${genres} movie directed by ${director}. The story follows ${story} Featuring themes of ${keywords}, the film has received a rating of ${movie.vote_average}/10 on TMDB. Starring ${cast}, this ${movie.runtime || 120}-minute film is a must-watch for fans of ${genres} on ZERO TV.`,
    whyWatch: `Directed by ${director} - Starring ${cast} - Runtime ${movie.runtime || 120} min`,
    faqs: [
      { q: `What is the story of ${movie.title}?`, a: story },
      { q: `Who stars in ${movie.title}?`, a: `The main cast includes ${cast}.` },
      { q: `What is the rating of ${movie.title}?`, a: `The movie has a rating of ${movie.vote_average} out of 10.` },
    ]
  }
}

export function posterUrl(path, large = false) { return path? (large? IMG_BASE_LG : IMG_BASE) + path : null }
export function formatRating(r) { return r? parseFloat(r).toFixed(1) : null }
export function getYear(d) { return (d || '').slice(0, 4) }
