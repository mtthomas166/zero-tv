import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams, useSearchParams, NavLink } from 'react-router-dom'

import Home from './pages/Home.jsx'
import Movies from './pages/Movies.jsx'
import TV from './pages/TV.jsx'
import Anime from './pages/Anime.jsx'
import MediaGrid from './components/MediaGrid.jsx'
import Player from './components/Player.jsx'

import {
  api,
  posterUrl,
  formatRating,
  getYear,
  movieEmbedUrl,
  tvEmbedUrl,
} from './lib/api.js'

import styles from './App.module.css'

function slugify(text) {
  if (!text) return ''
  return text.toString().toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').substring(0,60)
}

const WATCHLIST_KEY = 'cs_watchlist'
function loadWatchlist() {
  try {
    const value = localStorage.getItem(WATCHLIST_KEY)
    if (!value) return []
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch { return [] }
}
function saveWatchlist(items) {
  try { localStorage.setItem(WATCHLIST_KEY, JSON.stringify(items)) } catch {}
}

function setMeta(name, content, isProperty = false) {
  if (!content) return
  const selector = isProperty ? `meta[property="${name}"]` : `meta[name="${name}"]`
  let el = document.querySelector(selector)
  if (!el) {
    el = document.createElement('meta')
    if (isProperty) el.setAttribute('property', name)
    else el.setAttribute('name', name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}
function setCanonical(url) {
  let el = document.querySelector('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', url)
}
function setJsonLd(data) {
  let el = document.getElementById('json-ld-details')
  if (!el) {
    el = document.createElement('script')
    el.id = 'json-ld-details'
    el.type = 'application/ld+json'
    document.head.appendChild(el)
  }
  el.textContent = JSON.stringify(data)
}
function clearJsonLd() {
  const el = document.getElementById('json-ld-details')
  if (el) el.remove()
}

function DetailsPage({ watchlist, onWatchlistChange, isInWatchlist }) {
  const { id, seasonNum: urlSeason, episodeNum: urlEpisode } = useParams()
  const [searchParams] = useSearchParams()
  const [details, setDetails] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [seasonNum, setSeasonNum] = useState(urlSeason ? parseInt(urlSeason) : 1)
  const [episodeNum, setEpisodeNum] = useState(urlEpisode ? parseInt(urlEpisode) : 1)
  const [type, setType] = useState('movie')
  const [seasonDetails, setSeasonDetails] = useState(null)
  const [episodesLoading, setEpisodesLoading] = useState(false)
  const navigate = useNavigate()

  // If URL has ?s= & e= or /season/X/episode/Y, sync it
  useEffect(() => {
    if (urlSeason) setSeasonNum(parseInt(urlSeason))
    if (urlEpisode) {
      setEpisodeNum(parseInt(urlEpisode))
      setIsPlaying(true)
    }
    const qS = searchParams.get('s')
    const qE = searchParams.get('e')
    if (qS) setSeasonNum(parseInt(qS))
    if (qE) {
      setEpisodeNum(parseInt(qE))
      setIsPlaying(true)
    }
  }, [urlSeason, urlEpisode, searchParams])


  useEffect(() => {
    async function load() {
      setLoading(true)
      const path = window.location.pathname
      const isMoviePath = path.startsWith('/movie')
      try {
        if (isMoviePath) {
          try {
            const movieData = await api.movieDetails(id)
            if (movieData && movieData.title) {
              setDetails(movieData)
              setType('movie')
              return
            }
          } catch {}
          const tvData = await api.tvDetails(id)
          setDetails(tvData)
          setType(tvData.genres?.some(g => g.name === 'Animation') || tvData.origin_country?.includes('JP') ? 'anime' : 'tv')
        } else {
          try {
            const tvData = await api.tvDetails(id)
            if (tvData && (tvData.name || tvData.original_name)) {
              setDetails(tvData)
              const isAnimeCheck = tvData.genres?.some(g => g.name === 'Animation') || tvData.origin_country?.includes('JP')
              setType(isAnimeCheck ? 'anime' : 'tv')
              return
            }
          } catch {}
          const movieData = await api.movieDetails(id)
          setDetails(movieData)
          setType('movie')
        }
      } catch (e) { console.error(e) } finally { setLoading(false) }
    }
    load()
  }, [id])

  useEffect(() => {
    if (!details) return
    const isMovie = type === 'movie' || !!details.title
    const title = isMovie ? details.title : details.name
    const year = getYear(isMovie ? details.release_date : details.first_air_date)
    const overview = details.overview || `Watch ${title} online in HD on Zero TV`
    const shortDesc = overview.slice(0, 155)
    const poster = posterUrl(details.poster_path, true)
    const backdrop = details.backdrop_path ? `https://image.tmdb.org/t/p/w1280${details.backdrop_path}` : poster
    const slug = slugify(title)
    const isEpisodeView = !isMovie && isPlaying
    const epSlugForUrl = seasonDetails?.episodes?.find(e => e.episode_number === episodeNum)?.name ? slugify(seasonDetails.episodes.find(e => e.episode_number === episodeNum).name) : ''
    const canonicalUrl = isEpisodeView 
      ? `https://zero-tv.pages.dev/${type}/${id}/${slug}/season/${seasonNum}/episode/${episodeNum}${epSlugForUrl ? '/' + epSlugForUrl : ''}`
      : `https://zero-tv.pages.dev/${type}/${id}${slug ? '-' + slug : ''}`
    const fullTitle = isEpisodeView
      ? `${title} S${seasonNum}E${episodeNum} ${seasonDetails?.episodes?.find(e => e.episode_number === episodeNum)?.name || ''} - Watch Online - Zero TV`.trim()
      : `${title} ${year ? `(${year})` : ''} - Watch Online - Zero TV`.trim()

    document.title = fullTitle
    setMeta('description', shortDesc)
    setMeta('og:title', fullTitle, true)
    setMeta('og:description', shortDesc, true)
    setMeta('og:image', poster || backdrop, true)
    setMeta('og:url', canonicalUrl, true)
    setMeta('og:type', isMovie ? 'video.movie' : 'video.tv_show', true)
    setMeta('og:site_name', 'Zero TV', true)
    setMeta('twitter:card', 'summary_large_image')
    setMeta('twitter:title', fullTitle)
    setMeta('twitter:description', shortDesc)
    setMeta('twitter:image', poster || backdrop)
    setCanonical(canonicalUrl)

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": isMovie ? "Movie" : "TVSeries",
      "name": title,
      "description": overview,
      "image": poster,
      "dateCreated": isMovie ? details.release_date : details.first_air_date,
      "aggregateRating": details.vote_average ? {
        "@type": "AggregateRating",
        "ratingValue": details.vote_average,
        "ratingCount": details.vote_count,
        "bestRating": "10"
      } : undefined,
      "genre": details.genres?.map(g=>g.name),
      "url": canonicalUrl
    }
    setJsonLd(jsonLd)

    return () => {
      document.title = 'Zero TV - Watch Movies & TV Shows Free'
      clearJsonLd()
    }
  }, [details, type, id])

  useEffect(() => {
    if (details && details.seasons) {
      const first = details.seasons.find(s => s.season_number > 0) || details.seasons[0]
      if (first) setSeasonNum(first.season_number)
    }
  }, [details])

  useEffect(() => {
    if (!details || details.title) return
    async function fetchSeason() {
      setEpisodesLoading(true)
      try {
        const data = await api.seasonDetails(id, seasonNum)
        setSeasonDetails(data)
        if (data.episodes && data.episodes.length > 0) {
          setEpisodeNum(data.episodes[0].episode_number)
        }
      } catch (e) {
        console.error('season fetch error', e)
        setSeasonDetails(null)
      } finally {
        setEpisodesLoading(false)
      }
    }
    fetchSeason()
  }, [id, seasonNum, details])

  if (loading) return <div style={{ padding: '100px', textAlign: 'center', color: '#fff' }}>Loading...</div>
  if (!details) return <div style={{ padding: '100px', textAlign: 'center', color: '#fff' }}>Content not found</div>

  const isMovie = type === 'movie' || !!details.title
  const title = isMovie ? details.title : details.name
  const originalTitle = isMovie ? details.original_title : details.original_name
  const date = isMovie ? details.release_date : details.first_air_date
  const year = getYear(date)
  const rating = formatRating(details.vote_average)
  const overview = details.overview || 'No description available.'
  const poster = posterUrl(details.poster_path, true)
  const backdrop = details.backdrop_path
  const backdropUrl = backdrop ? `https://image.tmdb.org/t/p/w1280${backdrop}` : null
  const genres = Array.isArray(details.genres) ? details.genres : []
  const cast = Array.isArray(details?.credits?.cast) ? details.credits.cast.slice(0, 12) : []
  const seasons = !isMovie && Array.isArray(details.seasons) ? details.seasons.filter(s => s.season_number >= 0) : []
  const watchlistType = type === 'anime' ? 'anime' : isMovie ? 'movie' : 'tv'
  const saved = isInWatchlist({ id: details.id }, watchlistType)

  return (
    <div style={{ margin: '-20px -20px 0 -20px' }}>
      <div style={{ height: '420px', background: backdropUrl ? `linear-gradient(180deg, rgba(11,14,18,.2), rgba(11,14,18,.8), #0b0e12), url("${backdropUrl}")` : `linear-gradient(135deg, #151922, #090b0f)`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
        <Link to="/" style={{ position: 'absolute', top: '20px', left: '20px', padding: '8px 14px', borderRadius: '8px', background: 'rgba(0,0,0,.6)', color: '#fff', border: '1px solid rgba(255,255,255,.2)', textDecoration: 'none' }}>Back</Link>
      </div>
      <div style={{ padding: '0 28px 30px', marginTop: '-120px', position: 'relative', display: 'flex', gap: '26px', flexWrap: 'wrap' }}>
        <div style={{ flex: '0 0 220px' }}>
          {poster ? <img src={poster} alt={title} style={{ width: '100%', borderRadius: '12px', boxShadow: '0 15px 40px rgba(0,0,0,.6)' }} /> : <div style={{ width: '100%', aspectRatio: '2/3', background: '#171b21' }} />}
        </div>
        <div style={{ flex: '1', minWidth: '300px', paddingTop: '60px' }}>
          <h1 style={{ margin: '0 0 6px', fontSize: '32px', color: '#fff' }}>{title} {year && <span style={{ color: '#8d99a6', fontWeight: 400 }}>({year})</span>}</h1>
          {originalTitle && originalTitle !== title && <p style={{ margin: '0 0 10px', color: '#8d99a6' }}>{originalTitle}</p>}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', margin: '10px 0 16px' }}>
            {rating && <span style={{ background: '#1e242e', border: '1px solid #2a323f', padding: '4px 8px', borderRadius: '6px', color: '#f7c948' }}>{rating}</span>}
            {year && <span style={{ background: '#1e242e', border: '1px solid #2a323f', padding: '4px 8px', borderRadius: '6px', color: '#cbd5df' }}>{year}</span>}
            {genres.map(g => <span key={g.id} style={{ background: '#1e242e', border: '1px solid #2a323f', padding: '4px 8px', borderRadius: '6px', color: '#cbd5df' }}>{g.name}</span>)}
          </div>
          <p style={{ color: '#cbd5df', lineHeight: 1.7, maxWidth: '800px' }}>{overview}</p>
          <div style={{ display: 'flex', gap: '12px', marginTop: '18px' }}>
            <button onClick={() => setIsPlaying(v => !v)} style={{ padding: '10px 18px', borderRadius: '10px', border: 'none', background: '#e50914', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>{isPlaying ? 'Stop' : 'Watch'}</button>
            <button onClick={() => onWatchlistChange(details, watchlistType)} style={{ padding: '10px 18px', borderRadius: '10px', border: '1px solid #2a323f', background: saved ? '#1e242e' : 'transparent', color: '#fff', cursor: 'pointer' }}>{saved ? 'In Watchlist' : 'Add to Watchlist'}</button>
          </div>
          {cast.length > 0 && <div style={{ marginTop: '24px' }}><h3 style={{ color: '#fff', marginBottom: '10px' }}>Cast</h3><div style={{ display: 'flex', gap: '10px', overflowX: 'auto' }}>{cast.map(c => <div key={c.id} style={{ minWidth: '90px', textAlign: 'center' }}><img src={posterUrl(c.profile_path) || ''} alt={c.name} style={{ width: '70px', height: '70px', borderRadius: '50%', objectFit: 'cover', background: '#222' }} /><div style={{ color: '#cbd5df', fontSize: '12px', marginTop: '4px' }}>{c.name}</div></div>)}</div></div>}
        </div>
      </div>
      {isPlaying && <div style={{ padding: '20px 28px' }}><Player tmdbId={id} type={isMovie ? 'movie' : 'tv'} season={seasonNum} episode={episodeNum} title={title} /></div>}
      {!isMovie && (
        <div style={{ padding: '0 28px 20px' }}>
          {seasons.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
              {seasons.map(s => <button key={s.id} onClick={() => { setSeasonNum(s.season_number); setIsPlaying(false); }} style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid #2a323f', background: seasonNum === s.season_number ? '#e50914' : '#1e242e', color: '#fff', cursor: 'pointer', fontWeight: seasonNum === s.season_number ? 700 : 400 }}>Season {s.season_number}</button>)}
            </div>
          )}
          <div style={{ marginTop: '10px' }}>
            <h3 style={{ color: '#fff', marginBottom: '12px' }}>Episodes {seasonDetails ? `(${seasonDetails.episodes?.length || 0})` : ''}</h3>
            {episodesLoading ? (
              <div style={{ color: '#888' }}>Loading episodes...</div>
            ) : seasonDetails && seasonDetails.episodes ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '10px' }}>
                {seasonDetails.episodes.map(ep => {
                  const epSlug = slugify(ep.name || `episode-${ep.episode_number}`)
                  const titleSlug = slugify(details?.name || details?.original_name || '')
                  const episodeUrl = `/${type}/${id}/${titleSlug}/season/${seasonNum}/episode/${ep.episode_number}/${epSlug}`
                  return (
                  <button
                    key={ep.id}
                    onClick={() => { 
                      setEpisodeNum(ep.episode_number); 
                      setIsPlaying(true); 
                      // Update URL with episode number + name
                      navigate(episodeUrl);
                      window.scrollTo({ top: 0, behavior: 'smooth' }); 
                    }}
                    style={{
                      display: 'flex',
                      gap: '12px',
                      padding: '10px',
                      borderRadius: '10px',
                      border: episodeNum === ep.episode_number ? '2px solid #e50914' : '1px solid #2a323f',
                      background: episodeNum === ep.episode_number ? '#1e242e' : '#151a23',
                      color: '#fff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ width: '80px', height: '45px', background: '#0b0e12', borderRadius: '6px', overflow: 'hidden', flexShrink: 0 }}>
                      {ep.still_path ? <img src={`https://image.tmdb.org/t/p/w200${ep.still_path}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: '10px' }}>No Img</div>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>E{ep.episode_number}: {ep.name || `Episode ${ep.episode_number}`}</div>
                      <div style={{ fontSize: '11px', color: '#8d99a6', marginTop: '2px' }}>{ep.air_date || ''} {ep.runtime ? `• ${ep.runtime}m` : ''}</div>
                    </div>
                    {episodeNum === ep.episode_number && isPlaying && <span style={{ color: '#e50914', fontSize: '12px' }}>Playing</span>}
                  </button>
                  )
                })}
              </div>
            ) : (
              <div style={{ color: '#888' }}>No episodes found for this season</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function SearchPage({ watchlist, onWatchlistChange, isInWatchlist }) {
  const [params] = useSearchParams()
  const q = params.get('q') || ''
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  useEffect(() => {
    document.title = q ? `Search: ${q} - Zero TV` : 'Search - Zero TV'
    async function run() {
      if (!q) return
      setLoading(true)
      try {
        const [movies, tv] = await Promise.all([api.searchMovies(q), api.searchTV(q)])
        const combined = [...(movies.results || []), ...(tv.results || [])].map(r => ({ ...r, type: r.title ? 'movie' : 'tv', isAnime: r.genre_ids?.includes(16) }))
        setResults(combined)
      } catch {} finally { setLoading(false) }
    }
    run()
  }, [q])
  function handleSelect(item) {
    const slug = slugify(item.title || item.name)
    const type = item.type === 'movie' ? 'movie' : item.isAnime ? 'anime' : 'tv'
    navigate(`/${type}/${item.id}/${slug}`)
  }
  return (
    <div>
      <h2 style={{ color: '#fff' }}>Search results for: {q}</h2>
      {loading ? <div style={{ color: '#fff' }}>Searching...</div> : <MediaGrid items={results} onSelect={handleSelect} watchlist={watchlist} onWatchlistChange={onWatchlistChange} isInWatchlist={isInWatchlist} />}
    </div>
  )
}

function WatchlistPage({ watchlist, onWatchlistChange, isInWatchlist }) {
  const navigate = useNavigate()
  useEffect(() => { document.title = 'Watchlist - Zero TV' }, [])
  function handleSelect(item) {
    const slug = slugify(item.title || item.name)
    const type = item.type === 'movie' ? 'movie' : item.type === 'tv' ? 'tv' : 'anime'
    navigate(`/${type}/${item.id}/${slug}`)
  }
  return (
    <div>
      <h2 style={{ color: '#fff' }}>Watchlist ({watchlist.length})</h2>
      {watchlist.length === 0 ? <p style={{ color: '#8d99a6' }}>Your watchlist is empty</p> : <MediaGrid items={watchlist} onSelect={handleSelect} watchlist={watchlist} onWatchlistChange={onWatchlistChange} isInWatchlist={isInWatchlist} />}
    </div>
  )
}

function HomeWrapper({ watchlist, onWatchlistChange, isInWatchlist }) {
  const navigate = useNavigate()
  useEffect(() => {
    document.title = 'Zero TV - Watch Movies & TV Shows Free'
    setMeta('description', 'Watch latest movies, TV shows and anime in HD for free on Zero TV')
    setCanonical('https://zero-tv.pages.dev/')
  }, [])
  function handleSelect(item) {
    const slug = slugify(item.title || item.name)
    const type = item.type === 'movie' ? 'movie' : item.isAnime ? 'anime' : 'tv'
    navigate(`/${type}/${item.id}/${slug}`)
  }
  return <Home watchlist={watchlist} onWatchlistChange={onWatchlistChange} isInWatchlist={isInWatchlist} onSelect={handleSelect} onGoMovies={() => navigate('/movies')} onGoTV={() => navigate('/tv')} onGoAnime={() => navigate('/anime')} />
}

function MoviesWrapper({ watchlist, onWatchlistChange, isInWatchlist }) {
  const navigate = useNavigate()
  useEffect(() => {
    document.title = 'Movies - Zero TV'
    setMeta('description', 'Watch latest movies online in HD quality')
    setCanonical('https://zero-tv.pages.dev/movies')
  }, [])
  function handleSelect(item) {
    const slug = slugify(item.title || item.name)
    navigate(`/movie/${item.id}/${slug}`)
  }
  return <Movies watchlist={watchlist} onWatchlistChange={onWatchlistChange} isInWatchlist={isInWatchlist} onSelect={handleSelect} />
}

function TVWrapper({ watchlist, onWatchlistChange, isInWatchlist }) {
  const navigate = useNavigate()
  useEffect(() => {
    document.title = 'TV Shows - Zero TV'
    setMeta('description', 'Watch latest TV shows online in HD quality')
    setCanonical('https://zero-tv.pages.dev/tv')
  }, [])
  function handleSelect(item) {
    const slug = slugify(item.title || item.name)
    navigate(`/tv/${item.id}/${slug}`)
  }
  return <TV watchlist={watchlist} onWatchlistChange={onWatchlistChange} isInWatchlist={isInWatchlist} onSelect={handleSelect} />
}

function AnimeWrapper({ watchlist, onWatchlistChange, isInWatchlist }) {
  const navigate = useNavigate()
  useEffect(() => {
    document.title = 'Anime - Zero TV'
    setMeta('description', 'Watch latest anime episodes online in HD')
    setCanonical('https://zero-tv.pages.dev/anime')
  }, [])
  function handleSelect(item) {
    const slug = slugify(item.title || item.name)
    navigate(`/anime/${item.id}/${slug}`)
  }
  return <Anime watchlist={watchlist} onWatchlistChange={onWatchlistChange} isInWatchlist={isInWatchlist} onSelect={handleSelect} />
}

export default function App() {
  const [watchlist, setWatchlist] = useState(loadWatchlist)
  const [globalQuery, setGlobalQuery] = useState('')
  const navigate = useNavigate()

  function isInWatchlist(item, type) {
    if (!item) return false
    return watchlist.some(saved => String(saved.id) === String(item.id) && saved.type === type)
  }
  function toggleWatchlist(item, type) {
    if (!item) return
    setWatchlist(current => {
      const exists = current.some(saved => String(saved.id) === String(item.id) && saved.type === type)
      let updated
      if (exists) updated = current.filter(saved => !(String(saved.id) === String(item.id) && saved.type === type))
      else updated = [...current, { ...item, type }]
      saveWatchlist(updated)
      return updated
    })
  }
  function handleSearch(e) {
    if (e.key !== 'Enter') return
    const value = e.target.value.trim()
    if (!value) return
    navigate(`/search?q=${encodeURIComponent(value)}`)
    setGlobalQuery('')
  }

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <Link to="/" className={styles.logo} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/zero-tv-icon.png" alt="Zero TV" style={{ width: '38px', height: '38px', objectFit: 'contain' }} />
          <img src="/zero-tv-logo.png" alt="Zero TV" style={{ height: '26px', objectFit: 'contain' }} />
        </Link>
        <nav className={styles.tabs}>
          <NavLink to="/" className={({ isActive }) => `${styles.tab} ${isActive ? styles.active : ''}`}>Home</NavLink>
          <NavLink to="/movies" className={({ isActive }) => `${styles.tab} ${isActive ? styles.active : ''}`}>Movies</NavLink>
          <NavLink to="/tv" className={({ isActive }) => `${styles.tab} ${isActive ? styles.active : ''}`}>TV Shows</NavLink>
          <NavLink to="/anime" className={({ isActive }) => `${styles.tab} ${isActive ? styles.active : ''}`}>Anime</NavLink>
          <NavLink to="/watchlist" className={({ isActive }) => `${styles.tab} ${isActive ? styles.active : ''}`}>Watchlist{watchlist.length > 0 && <span style={{ marginLeft: '6px', background: '#e50914', borderRadius: '999px', padding: '0 6px', fontSize: '10px' }}>{watchlist.length}</span>}</NavLink>
        </nav>
        <div className={styles.headerRight}>
          <div className={styles.headerSearch}>
            <span className={styles.searchIcon}>🔍</span>
            <input className={styles.headerSearchInput} value={globalQuery} placeholder="Search movies & shows..." onChange={e => setGlobalQuery(e.target.value)} onKeyDown={handleSearch} />
          </div>
        </div>
      </header>
      <main className={styles.main}>
        <Routes>
          <Route path="/" element={<HomeWrapper watchlist={watchlist} onWatchlistChange={toggleWatchlist} isInWatchlist={isInWatchlist} />} />
          <Route path="/movies" element={<MoviesWrapper watchlist={watchlist} onWatchlistChange={toggleWatchlist} isInWatchlist={isInWatchlist} />} />
          <Route path="/tv" element={<TVWrapper watchlist={watchlist} onWatchlistChange={toggleWatchlist} isInWatchlist={isInWatchlist} />} />
          <Route path="/anime" element={<AnimeWrapper watchlist={watchlist} onWatchlistChange={toggleWatchlist} isInWatchlist={isInWatchlist} />} />
          <Route path="/watchlist" element={<WatchlistPage watchlist={watchlist} onWatchlistChange={toggleWatchlist} isInWatchlist={isInWatchlist} />} />
          <Route path="/search" element={<SearchPage watchlist={watchlist} onWatchlistChange={toggleWatchlist} isInWatchlist={isInWatchlist} />} />
          <Route path="/movie/:id/:slug?" element={<DetailsPage watchlist={watchlist} onWatchlistChange={toggleWatchlist} isInWatchlist={isInWatchlist} />} />
          <Route path="/tv/:id/:slug?" element={<DetailsPage watchlist={watchlist} onWatchlistChange={toggleWatchlist} isInWatchlist={isInWatchlist} />} />
          <Route path="/anime/:id/:slug?" element={<DetailsPage watchlist={watchlist} onWatchlistChange={toggleWatchlist} isInWatchlist={isInWatchlist} />} />
          {/* Episode URLs with episode number + name */}
          <Route path="/tv/:id/:slug?/season/:seasonNum/episode/:episodeNum/:episodeSlug?" element={<DetailsPage watchlist={watchlist} onWatchlistChange={toggleWatchlist} isInWatchlist={isInWatchlist} />} />
          <Route path="/anime/:id/:slug?/season/:seasonNum/episode/:episodeNum/:episodeSlug?" element={<DetailsPage watchlist={watchlist} onWatchlistChange={toggleWatchlist} isInWatchlist={isInWatchlist} />} />
          <Route path="/tv/:id/season/:seasonNum/episode/:episodeNum" element={<DetailsPage watchlist={watchlist} onWatchlistChange={toggleWatchlist} isInWatchlist={isInWatchlist} />} />
          <Route path="/anime/:id/season/:seasonNum/episode/:episodeNum" element={<DetailsPage watchlist={watchlist} onWatchlistChange={toggleWatchlist} isInWatchlist={isInWatchlist} />} />
          <Route path="/movie/:id" element={<DetailsPage watchlist={watchlist} onWatchlistChange={toggleWatchlist} isInWatchlist={isInWatchlist} />} />
        </Routes>
      </main>
      <footer className={styles.footer}>
        <p className={styles.footerText} style={{textAlign:'center', padding:'20px', color:'#666', fontSize:'13px'}}>
          &copy; {new Date().getFullYear()} Zero TV - Watch Movies & TV Shows Free | All Rights Reserved
        </p>
      </footer>
    </div>
  )
}

export function AppWithRouter() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  )
}
