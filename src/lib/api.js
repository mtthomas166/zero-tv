// =========================
// API KEYS - the clean version without ads
// =========================

export const TMDB_KEY = 
'af32459863d504e3a5d04f317e7f12e1'

// =========================
// EMBED - All clean servers without Melbet ads
// =========================

export const EMBED_SERVERS = { 
multiembed: { 
name: '✨ MultiEmbed - No Ads', 
movie: (id) => `https://multiembed.mov/?video_id=${id}&tmdb=1`, 
tv: (id, s, e) => `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`, 
}, 
smashy:{ 
name: '✨ SmashyStream - No Ads', 
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
// We left VidSrc.to as a last choice, but only if it all happened 
vidsrc_to: { 
name: 'VidSrc.to (contains ads)', 
movie: (id) => `https://vidsrc.to/embed/movie/${id}`, 
tv: (id, s, e) => `https://vidsrc.to/embed/tv/${id}/${s}/${e}`, 
},
};

export function getEmbedUrl(tmdbId, type = 'movie', season = 1, episode = 1, serverKey = 'multiembed') { 
const server = EMBED_SERVERS[serverKey] || EMBED_SERVERS.multiembed; 
if (type === 'movie') { 
return server. movie(tmdbId); 
} else { 
return server.tv(tmdbId, season, episode); 
}
}

// To be compatible with the old code - let the default be added
export const EMBED_BASE = 'https://multiembed.mov';
export const EMBED_API_KEY = '';


// =========================
// IMAGE BASE URLS
// =========================

export const IMG_BASE = 
'https://image.tmdb.org/t/p/w300'

export const IMG_BASE_LG = 
'https://image.tmdb.org/t/p/w780'


// =========================
// TMDB FETCH
// =========================

async function tmdbFetch(path) { 
const separator = path.includes('?') ? '&' : '?' 
const url = `https://api.themoviedb.org/3${path}` + `${separator}api_key=${TMDB_KEY}` 
const res = await fetch(url) 
if (!res.ok) { 
let message = `TMDB error: ${res.status}` 
try { 
const error = await res.json() 
if (error?.status_message) { 
message = `TMDB error: ${res.status} - ${error.status_message}` 
} 
} catch {} 
throw new Error(message) 
} 
return res.json()
}

async function tmdbTVDetails(id) { 
if (id === null || id === undefined || id === '') { 
throw new Error('TV details requires a valid TMDB id') 
} 
return tmdbFetch(`/tv/${encodeURIComponent(id)}` + `?append_to_response=credits,videos`)
}

function animeDiscover(page = 1, extra = '') { 
return tmdbFetch(`/discover/tv` + `?with_genres=16` + `&with_origin_country=JP` + `&page=${page}` + extra)
}

function today() { 
return new Date().toISOString().slice(0, 10)
}

export const api = { 
trendingMovies: (page = 1) => tmdbFetch(`/trending/movie/week?page=${page}`), 
popularMovies: (page = 1) => tmdbFetch(`/movie/popular?page=${page}`), 
topRatedMovies: (page = 1) => tmdbFetch(`/movie/top_rated?page=${page}`), 
nowPlayingMovies: (page = 1) => tmdbFetch(`/movie/now_playing?page=${page}`), 
upcomingMovies: (page = 1) => tmdbFetch(`/movie/upcoming?page=${page}`), 
trendingTV: (page = 1) => tmdbFetch(`/trending/tv/week?page=${page}`), 
popularTV: (page = 1) => tmdbFetch(`/tv/popular?page=${page}`), 
topRatedTV: (page = 1) => tmdbFetch(`/tv/top_rated?page=${page}`), 
airingTodayTV: (page = 1) => tmdbFetch(`/tv/airing_today?page=${page}`), 
onTheAirTV: (page = 1) => tmdbFetch(`/tv/on_the_air?page=${page}`), 
animeTrending: (page = 1) => animeDiscover(page, `&sort_by=popularity.desc`), 
animePopular: (page = 1) => animeDiscover(page, `&sort_by=popularity.desc`), 
animeTopRated: (page = 1) => animeDiscover(page, `&sort_by=vote_average.desc` + `&vote_count.gte=100`), 
animeAiring: (page = 1) => animeDiscover(page, `&sort_by=first_air_date.desc` + `&air_date.lte=${today()}`), 
animeUpcoming: (page = 1) => animeDiscover(page, `&sort_by=first_air_date.asc` + `&first_air_date.gte=${today()}`), 
searchMovies: (q, page = 1) => tmdbFetch(`/search/movie?query=${encodeURIComponent(q)}&page=${page}`), 
searchTV: (q, page = 1) => tmdbFetch(`/search/tv?query=${encodeURIComponent(q)}&page=${page}`), 
searchAnime: (q, page = 1) => tmdbFetch(`/search/tv?query=${encodeURIComponent(q)}&page=${page}`), 
movieDetails: (id) => tmdbFetch(`/movie/${encodeURIComponent(id)}` + `?append_to_response=credits,videos`), 
tvDetails: (id) => tmdbTVDetails(id), 
getTVDetails: (id) => tmdbTVDetails(id), 
animeDetails: (id) => tmdbTVDetails(id), 
seasonDetails: (id, season) => tmdbFetch(`/tv/${encodeURIComponent
