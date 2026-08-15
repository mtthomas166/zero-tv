import React, { useEffect, useState } from 'react'

import Home from './pages/Home.jsx'
import Movies from './pages/Movies.jsx'
import TV from './pages/TV.jsx'
import Anime from './pages/Anime.jsx'
import MediaGrid from './components/MediaGrid.jsx'

import {
  api,
  posterUrl,
  formatRating,
  getYear,
  movieEmbedUrl,
  tvEmbedUrl,
} from './lib/api.js'

import styles from './App.module.css'

// =========================================================
// WATCHLIST STORAGE
// =========================================================

const WATCHLIST_KEY = 'cs_watchlist'

function loadWatchlist() {
  try {
    const value = localStorage.getItem(WATCHLIST_KEY)
    if (!value) return []
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveWatchlist(items) {
  try {
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(items))
  } catch {}
}

// =========================================================
// GLOBAL DETAILS MODAL - FIXED WITH WATCH BUTTON
// =========================================================

function GlobalDetailsModal({
  item,
  details,
  loading,
  onClose,
  onWatchlistChange,
  isInWatchlist,
}) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [seasonNum, setSeasonNum] = useState(1)
  const [episodeNum, setEpisodeNum] = useState(1)

  if (!item) return null

  const isMovie = item.type === 'movie'
  const isAnime = item.isAnime === true || item.type === 'anime'
  const mediaType = isMovie ? 'movie' : 'tv'
  const data = details || item

  const title = isMovie ? (data.title || item.title || 'Unknown') : (data.name || item.name || 'Unknown')
  const originalTitle = isMovie ? data.original_title : data.original_name
  const date = isMovie ? (data.release_date || item.release_date) : (data.first_air_date || item.first_air_date)
  const year = getYear(date)
  const rating = formatRating(data.vote_average)
  const overview = data.overview || item.overview || 'No description available.'
  const poster = posterUrl(data.poster_path || item.poster_path, true)
  const backdrop = data.backdrop_path || item.backdrop_path
  const backdropUrl = backdrop ? `https://image.tmdb.org/t/p/w1280${backdrop}` : null

  const watchlistType = isAnime ? 'anime' : mediaType
  const saved = typeof isInWatchlist === 'function' ? isInWatchlist({ ...item, ...data }, watchlistType) : false

  function handleWatchlist() {
    if (typeof onWatchlistChange !== 'function') return
    onWatchlistChange({ ...item, ...data, type: watchlistType, isAnime }, watchlistType)
  }

  const genres = Array.isArray(data.genres) ? data.genres : []
  const cast = Array.isArray(data?.credits?.cast) ? data.credits.cast.slice(0, 12) : []
  const videos = Array.isArray(data?.videos?.results) ? data.videos.results : []
  const trailer = videos.find(v => v.site === 'YouTube' && v.type === 'Trailer' && v.key) || videos.find(v => v.site === 'YouTube' && v.key)
  const seasons = !isMovie && Array.isArray(data.seasons) ? data.seasons.filter(s => s.season_number >= 0) : []

  useEffect(() => {
    if (!isMovie && seasons.length > 0) {
      const first = seasons.find(s => s.season_number > 0) || seasons[0]
      if (first) setSeasonNum(first.season_number)
    }
  }, [details])

  useEffect(() => {
    setIsPlaying(false)
  }, [item.id])

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onClose()
  }

  const embedUrl = isMovie ? movieEmbedUrl(item.id) : tvEmbedUrl(item.id, seasonNum, episodeNum)

  return (
    <div onClick={handleOverlayClick} style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,.88)', padding: '20px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', overflow: 'hidden' }}>
      <style>{`
        .details-scroll::-webkit-scrollbar { width: 8px; }
        .details-scroll::-webkit-scrollbar-track { background: rgba(255,255,255,.04); }
        .details-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,.15); border-radius: 999px; }
        .details-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,.25); }
        .details-scroll { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,.15) transparent; }
      `}</style>
      <div className="details-scroll" style={{ width: '100%', maxWidth: '920px', background: '#0b0e12', borderRadius: '16px', position: 'relative', margin: '20px auto', border: '1px solid rgba(255,255,255,.08)', maxHeight: '90vh', overflowY: 'auto', overscrollBehavior: 'contain' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '14px', right: '14px', zIndex: 20, width: '38px', height: '38px', borderRadius: '50%', border: '1px solid rgba(255,255,255,.15)', background: 'rgba(0,0,0,.65)', color: '#fff', cursor: 'pointer', fontSize: '20px' }}>×</button>

        {isPlaying ? (
          <div style={{ width: '100%', aspectRatio: '16/9', background: '#000', position: 'sticky', top: 0, zIndex: 5 }}>
            <iframe src={embedUrl} title={`${title} player`} allowFullScreen style={{ width: '100%', height: '100%', border: 0 }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
            <button onClick={() => setIsPlaying(false)} style={{ position: 'absolute', top: '12px', left: '12px', padding: '8px 14px', borderRadius: '8px', background: 'rgba(0,0,0,.75)', color: '#fff', border: '1px solid rgba(255,255,255,.2)', cursor: 'pointer', fontSize: '12px' }}>← Details</button>
          </div>
        ) : (
          <div style={{ height: '340px', background: backdropUrl ? `linear-gradient(180deg, rgba(11,14,18,.08), rgba(11,14,18,.6), #0b0e12), url("${backdropUrl}")` : `linear-gradient(135deg, #151922, #090b0f)`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        )}

        <div style={{ position: 'relative', display: 'flex', gap: '26px', padding: '0 28px 30px', marginTop: isPlaying ? '0' : '-110px', flexWrap: 'wrap' }}>
          <div style={{ flex: '0 0 210px', position: 'relative', zIndex: 5 }}>
            {poster ? <img src={poster} alt={title} style={{ display: 'block', width: '100%', aspectRatio: '2/3', objectFit: 'cover', borderRadius: '12px', background: '#171b21', boxShadow: '0 15px 40px rgba(0,0,0,.6)' }} /> : <div style={{ width: '100%', aspectRatio: '2/3', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', background: '#171b21', color: '#777' }}>No Image</div>}
          </div>

          <div style={{ flex: '1', minWidth: 0, paddingTop: isPlaying ? '18px' : '88px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
              <span style={{ padding: '6px 11px', borderRadius: '999px', background: '#e50914', color: '#fff', fontSize: '11px', fontWeight: 800 }}>{isAnime ? 'ANIME' : isMovie ? 'MOVIE' : 'TV'}</span>
              {year && <span style={{ color: '#aeb5c0', fontSize: '13px' }}>{year}</span>}
              {rating && <span style={{ color: '#ffd166', fontSize: '13px', fontWeight: 700 }}>★ {rating}</span>}
            </div>

            <h2 style={{ margin: '0 0 6px', color: '#fff', fontSize: 'clamp(26px, 4vw, 38px)', lineHeight: 1.15 }}>{title}</h2>
            {originalTitle && originalTitle !== title && <div style={{ marginBottom: '12px', color: '#6f7883', fontSize: '13px' }}>{originalTitle}</div>}

            {genres.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px', marginBottom: '14px' }}>
                {genres.map(g => <span key={g.id} style={{ padding: '5px 9px', borderRadius: '6px', background: 'rgba(255,255,255,.07)', color: '#aeb5c0', fontSize: '11px' }}>{g.name}</span>)}
              </div>
            )}

            <p style={{ margin: 0, color: '#b8bec8', lineHeight: 1.7, fontSize: '14px' }}>{overview}</p>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '22px' }}>
              <button type="button" onClick={() => setIsPlaying(true)} style={{ minHeight: '46px', padding: '0 22px', border: 'none', borderRadius: '10px', background: '#e50914', color: '#fff', cursor: 'pointer', fontWeight: 800, fontSize: '14px', boxShadow: '0 6px 20px rgba(229,9,20,.35)' }}>▶ Watch Now</button>
              <button type="button" onClick={handleWatchlist} style={{ minHeight: '46px', padding: '0 18px', border: '1px solid rgba(255,255,255,.12)', borderRadius: '10px', background: saved ? '#e50914' : 'rgba(255,255,255,.06)', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>{saved ? '♥ In Watchlist' : '♡ Add to Watchlist'}</button>
            </div>

            {!isMovie && seasons.length > 0 && (
              <div style={{ marginTop: '18px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ color: '#89939f', fontSize: '12px' }}>{seasons.length} {seasons.length === 1 ? 'Season' : 'Seasons'}</span>
                <select value={seasonNum} onChange={e => setSeasonNum(Number(e.target.value))} style={{ padding: '7px 12px', borderRadius: '8px', background: '#1a1f28', color: '#fff', border: '1px solid rgba(255,255,255,.12)' }}>
                  {seasons.map(s => <option key={s.id} value={s.season_number}>Season {s.season_number}</option>)}
                </select>
                <select value={episodeNum} onChange={e => setEpisodeNum(Number(e.target.value))} style={{ padding: '7px 12px', borderRadius: '8px', background: '#1a1f28', color: '#fff', border: '1px solid rgba(255,255,255,.12)' }}>
                  {Array.from({ length: 50 }, (_, i) => i + 1).map(ep => <option key={ep} value={ep}>Episode {ep}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>

        {cast.length > 0 && (
          <section style={{ padding: '0 28px 28px' }}>
            <h3 style={{ margin: '0 0 14px', color: '#fff', fontSize: '18px' }}>Cast</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(95px, 1fr))', gap: '12px' }}>
              {cast.map(p => {
                const img = posterUrl(p.profile_path)
                return (
                  <div key={p.credit_id || p.id} style={{ overflow: 'hidden', borderRadius: '8px', background: 'rgba(255,255,255,.04)' }}>
                    {img ? <img src={img} alt={p.name} loading="lazy" style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover' }} /> : <div style={{ width: '100%', aspectRatio: '2/3', background: '#171b21', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>{p.name?.slice(0,2)}</div>}
                    <div style={{ padding: '7px 8px' }}><div style={{ color: '#fff', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div><div style={{ color: '#7d8894', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.character}</div></div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {trailer && !isPlaying && (
          <section style={{ padding: '0 28px 28px' }}>
            <h3 style={{ margin: '0 0 14px', color: '#fff', fontSize: '18px' }}>Trailer</h3>
            <div style={{ aspectRatio: '16/9', overflow: 'hidden', borderRadius: '10px', background: '#000' }}>
              <iframe title={`${title} trailer`} src={`https://www.youtube.com/embed/${trailer.key}`} allowFullScreen style={{ width: '100%', height: '100%', border: 0 }} />
            </div>
          </section>
        )}

        {loading && <div style={{ position: 'absolute', inset: 0, zIndex: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(11,14,18,.7)', color: '#fff' }}>Loading details...</div>}
      </div>
    </div>
  )
}

// =========================================================
// APP
// =========================================================

export default function App() {
  const [tab, setTab] = useState(() => sessionStorage.getItem('cs_tab') || 'home')
  const [homeKey, setHomeKey] = useState(0)
  const [moviesCategory, setMoviesCategory] = useState('trending')
  const [animeCategory, setAnimeCategory] = useState('trending')
  const [watchlist, setWatchlist] = useState(loadWatchlist)
  const [globalQuery, setGlobalQuery] = useState('')
  const [globalResults, setGlobalResults] = useState([])
  const [globalLoading, setGlobalLoading] = useState(false)
  const [globalSearched, setGlobalSearched] = useState(false)
  const [globalSelectedItem, setGlobalSelectedItem] = useState(null)
  const [globalSelectedDetails, setGlobalSelectedDetails] = useState(null)
  const [globalDetailsLoading, setGlobalDetailsLoading] = useState(false)

  useEffect(() => {
    const saved = sessionStorage.getItem('global_query')
    if (saved) setGlobalQuery(saved)
  }, [])

  useEffect(() => {
    function handleEscape(e) {
      if (e.key === 'Escape') {
        setGlobalSelectedItem(null)
        setGlobalSelectedDetails(null)
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [])

  function isInWatchlist(item, type) {
    if (!item) return false
    return watchlist.some(saved => String(saved.id) === String(item.id) && saved.type === type)
  }

  function toggleWatchlist(item, type) {
    if (!item) return
    setWatchlist(current => {
      const exists = current.some(saved => String(saved.id) === String(item.id) && saved.type === type)
      let updated
      if (exists) {
        updated = current.filter(saved => !(String(saved.id) === String(item.id) && saved.type === type))
      } else {
        updated = [...current, { ...item, type }]
      }
      saveWatchlist(updated)
      return updated
    })
  }

  function closeGlobalDetails() {
    setGlobalSelectedItem(null)
    setGlobalSelectedDetails(null)
    setGlobalDetailsLoading(false)
  }

  async function selectGlobalResult(item) {
    if (!item?.id) return
    setGlobalSelectedItem(item)
    setGlobalSelectedDetails(null)
    setGlobalDetailsLoading(true)
    try {
      let details
      if (item.type === 'movie') details = await api.movieDetails(item.id)
      else details = await api.tvDetails(item.id)
      setGlobalSelectedDetails(details)
    } catch (error) {
      console.error('Global details failed:', error)
      setGlobalSelectedDetails(item)
    } finally {
      setGlobalDetailsLoading(false)
    }
  }

  function goHome() {
    closeGlobalDetails()
    setTab('home')
    sessionStorage.setItem('cs_tab', 'home')
    setGlobalSearched(false)
    setHomeKey(k => k + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function goMovies(category) {
    closeGlobalDetails()
    if (category) setMoviesCategory(category)
    setTab('movies')
    sessionStorage.setItem('cs_tab', 'movies')
    setGlobalSearched(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function goTV() {
    closeGlobalDetails()
    setTab('tv')
    sessionStorage.setItem('cs_tab', 'tv')
    setGlobalSearched(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function goAnime(category) {
    closeGlobalDetails()
    if (category) setAnimeCategory(category)
    setTab('anime')
    sessionStorage.setItem('cs_tab', 'anime')
    setGlobalSearched(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function goWatchlist() {
    closeGlobalDetails()
    setTab('watchlist')
    sessionStorage.setItem('cs_tab', 'watchlist')
    setGlobalSearched(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function searchFromHeader(e) {
    if (e.key !== 'Enter') return
    const value = e.target.value.trim()
    if (!value) return
    closeGlobalDetails()
    setGlobalQuery(value)
    sessionStorage.setItem('global_query', value)
    setGlobalResults([])
    setGlobalLoading(true)
    setGlobalSearched(true)
    setTab('search')
    sessionStorage.setItem('cs_tab', 'search')
    window.scrollTo({ top: 0, behavior: 'smooth' })
    try {
      const [moviesResponse, tvResponse, animeResponse] = await Promise.all([
        api.searchMovies(value),
        api.searchTV(value),
        api.searchAnime(value),
      ])
      const movies = (moviesResponse?.results || []).map(item => ({ ...item, type: 'movie' }))
      const tv = (tvResponse?.results || []).map(item => ({ ...item, type: 'tv', isAnime: false }))
      const anime = (animeResponse?.results || []).map(item => ({ ...item, type: 'tv', isAnime: true }))

      const map = new Map()
      ;[...movies, ...tv, ...anime].forEach(item => {
        const dedupKey = item.type === 'movie' ? `movie-${item.id}` : `tv-${item.id}`
        if (!map.has(dedupKey)) {
          map.set(dedupKey, item)
        } else {
          const existing = map.get(dedupKey)
          if (item.isAnime && !existing.isAnime) {
            map.set(dedupKey, { ...existing, isAnime: true })
          }
        }
      })

      const unique = Array.from(map.values())
      unique.sort((a, b) => Number(b.vote_average || 0) - Number(a.vote_average || 0))
      setGlobalResults(unique)
    } catch (error) {
      console.error('Global search failed:', error)
      setGlobalResults([])
    } finally {
      setGlobalLoading(false)
    }
  }

  function clearGlobalSearch() {
    closeGlobalDetails()
    setGlobalQuery('')
    setGlobalResults([])
    setGlobalSearched(false)
    sessionStorage.removeItem('global_query')
    setTab('home')
    sessionStorage.setItem('cs_tab', 'home')
    setHomeKey(k => k + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function WatchlistPage() {
    return (
      <div style={{ paddingTop: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', gap: '20px' }}>
          <div>
            <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8d99a6' }}>Your Collection</p>
            <h1 style={{ margin: '6px 0 0', fontSize: '28px', color: '#ffffff' }}>♥ Watchlist</h1>
          </div>
          <div style={{ padding: '8px 12px', borderRadius: '999px', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.08)', color: '#9aa5b1', fontSize: '12px' }}>{watchlist.length} {watchlist.length === 1 ? 'item' : 'items'}</div>
        </div>
        {watchlist.length === 0 ? (
          <div style={{ minHeight: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', border: '1px dashed rgba(255,255,255,.1)', borderRadius: '16px', padding: '40px' }}>
            <div style={{ fontSize: '42px', marginBottom: '12px' }}>♡</div>
            <h2 style={{ margin: '0 0 8px', color: '#ffffff', fontSize: '20px' }}>Your Watchlist is empty</h2>
            <p style={{ margin: 0, color: '#7d8894', fontSize: '13px' }}>Add movies or TV shows using the ♡ button.</p>
          </div>
        ) : (
          <MediaGrid items={watchlist} type="movie" loading={false} onSelect={selectGlobalResult} selectedId={null} onWatchlistChange={toggleWatchlist} isInWatchlist={isInWatchlist} />
        )}
      </div>
    )
  }

  function GlobalSearchPage() {
    const movieCount = globalResults.filter(item => item.type === 'movie').length
    const tvCount = globalResults.filter(item => item.type === 'tv').length
    return (
      <div style={{ paddingTop: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div>
            <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8d99a6' }}>Global Search</p>
            <h1 style={{ margin: '6px 0 0', fontSize: '28px', color: '#ffffff' }}>Search results</h1>
            <p style={{ margin: '8px 0 0', color: '#7d8894', fontSize: '13px' }}>Results for "{globalQuery}"</p>
          </div>
          <button type="button" onClick={clearGlobalSearch} style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,.1)', background: 'rgba(255,255,255,.05)', color: '#ffffff', cursor: 'pointer' }}>← Back</button>
        </div>
        {!globalLoading && globalResults.length > 0 && (
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <span style={{ padding: '7px 11px', borderRadius: '999px', background: 'rgba(255,255,255,.06)', color: '#c5ccd3', fontSize: '12px' }}>🎬 {movieCount} Movies</span>
            <span style={{ padding: '7px 11px', borderRadius: '999px', background: 'rgba(255,255,255,.06)', color: '#c5ccd3', fontSize: '12px' }}>📺 {tvCount} TV / Anime</span>
          </div>
        )}
        <MediaGrid items={globalResults} type="movie" loading={globalLoading} onSelect={selectGlobalResult} selectedId={null} onWatchlistChange={toggleWatchlist} isInWatchlist={isInWatchlist} />
      </div>
    )
  }

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <button className={styles.logo} onClick={goHome} aria-label="Go to home"><span className={styles.logoAccent}>zero</span><span className={styles.logoDot}>·</span>tv</button>
        <nav className={styles.tabs}>
          <button className={`${styles.tab} ${tab === 'home' ? styles.active : ''}`} onClick={goHome}>Home</button>
          <button className={`${styles.tab} ${tab === 'movies' ? styles.active : ''}`} onClick={goMovies}>Movies</button>
          <button className={`${styles.tab} ${tab === 'tv' ? styles.active : ''}`} onClick={goTV}>TV Shows</button>
          <button className={`${styles.tab} ${tab === 'anime' ? styles.active : ''}`} onClick={goAnime}>🍥 Anime</button>
          <button className={`${styles.tab} ${tab === 'watchlist' ? styles.active : ''}`} onClick={goWatchlist}>♥ Watchlist{watchlist.length > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '18px', height: '18px', marginLeft: '6px', padding: '0 5px', borderRadius: '999px', fontSize: '10px', background: '#e50914', color: '#fff' }}>{watchlist.length > 99 ? '99+' : watchlist.length}</span>}</button>
        </nav>
        <div className={styles.headerRight}>
          <div className={styles.headerSearch}><span className={styles.searchIcon}>🔍</span><input className={styles.headerSearchInput} value={globalQuery} placeholder="Search movies & shows..." onChange={e => setGlobalQuery(e.target.value)} onKeyDown={searchFromHeader} /></div>
        </div>
      </header>

      <main className={styles.main}>
        {tab === 'search' && <GlobalSearchPage />}
        {tab === 'home' && <Home key={homeKey} watchlist={watchlist} onWatchlistChange={toggleWatchlist} isInWatchlist={isInWatchlist} onGoMovies={goMovies} onGoTV={goTV} onGoAnime={goAnime} onSelect={selectGlobalResult} />}
        {tab === 'movies' && <Movies key={`${homeKey}-${moviesCategory}`} watchlist={watchlist} onWatchlistChange={toggleWatchlist} isInWatchlist={isInWatchlist} initialCategory={moviesCategory} onSelect={selectGlobalResult} />}
        {tab === 'tv' && <TV key={homeKey} watchlist={watchlist} onWatchlistChange={toggleWatchlist} isInWatchlist={isInWatchlist} onSelect={selectGlobalResult} />}
        {tab === 'anime' && <Anime key={`${homeKey}-${animeCategory}`} watchlist={watchlist} onWatchlistChange={toggleWatchlist} isInWatchlist={isInWatchlist} initialCategory={animeCategory} onSelect={selectGlobalResult} />}
        {tab === 'watchlist' && <WatchlistPage />}
      </main>

      {globalSelectedItem && <GlobalDetailsModal item={globalSelectedItem} details={globalSelectedDetails} loading={globalDetailsLoading} onClose={closeGlobalDetails} onWatchlistChange={toggleWatchlist} isInWatchlist={isInWatchlist} />}

      <footer className={styles.footer}><p className={styles.footerText}>&copy; {new Date().getFullYear()} All rights reserved <a href="https://www.codespecters.com/" target="_blank" rel="noopener noreferrer" className={styles.footerLink}>Code Specter</a> | Digital Entertainment Democratized</p></footer>
    </div>
  )
}
