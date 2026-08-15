import React, { useEffect, useState, useMemo } from 'react'
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

// =========================================================
// UTILS - SEO SLUG
// =========================================================
function slugify(text) {
  if (!text) return ''
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-') // عربي + انجليزي
    .replace(/^-+|-+$/g, '')
}

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
// DETAILS PAGE - ده اللي بيخلي كل فيلم ليه رابط وعنوان
// =========================================================
function DetailsPage({ watchlist, onWatchlistChange, isInWatchlist }) {
  const { id } = useParams()
  const [details, setDetails] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [seasonNum, setSeasonNum] = useState(1)
  const [episodeNum, setEpisodeNum] = useState(1)
  const [type, setType] = useState('movie') // movie / tv

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        // جرب فيلم الأول، لو فشل جرب مسلسل
        try {
          const movieData = await api.movieDetails(id)
          if (movieData && movieData.title) {
            setDetails(movieData)
            setType('movie')
            // ✅ ده اللي بيخلي العنوان يتغير في التاب
            document.title = `مشاهدة ${movieData.title} مترجم - Zero TV`
            return
          }
        } catch {}
        
        const tvData = await api.tvDetails(id)
        setDetails(tvData)
        const isAnimeCheck = tvData.genres?.some(g => g.name === 'Animation') || tvData.origin_country?.includes('JP')
        setType(isAnimeCheck ? 'anime' : 'tv')
        document.title = `مشاهدة ${tvData.name} مترجم - Zero TV`
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
    
    // لما تخرج من الصفحة رجع العنوان الأصلي
    return () => {
      document.title = 'Zero TV - مشاهدة أفلام ومسلسلات مجانا'
    }
  }, [id])

  useEffect(() => {
    if (details && details.seasons) {
      const first = details.seasons.find(s => s.season_number > 0) || details.seasons[0]
      if (first) setSeasonNum(first.season_number)
    }
  }, [details])

  if (loading) {
    return <div style={{ padding: '100px', textAlign: 'center', color: '#fff' }}>جاري التحميل...</div>
  }

  if (!details) {
    return <div style={{ padding: '100px', textAlign: 'center', color: '#fff' }}>المحتوى غير موجود</div>
  }

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
  const videos = Array.isArray(details?.videos?.results) ? details.videos.results : []
  const trailer = videos.find(v => v.site === 'YouTube' && v.type === 'Trailer' && v.key) || videos.find(v => v.site === 'YouTube' && v.key)
  const seasons = !isMovie && Array.isArray(details.seasons) ? details.seasons.filter(s => s.season_number >= 0) : []

  const watchlistType = type === 'anime' ? 'anime' : isMovie ? 'movie' : 'tv'
  const saved = isInWatchlist({ id: details.id }, watchlistType)

  const embedUrl = isMovie ? movieEmbedUrl(id) : tvEmbedUrl(id, seasonNum, episodeNum)

  return (
    <div style={{ margin: '-20px -20px 0 -20px' }}>
      {/* Hero Backdrop */}
      <div style={{ 
        height: '420px', 
        background: backdropUrl ? `linear-gradient(180deg, rgba(11,14,18,.2), rgba(11,14,18,.8), #0b0e12), url("${backdropUrl}")` : `linear-gradient(135deg, #151922, #090b0f)`, 
        backgroundSize: 'cover', 
        backgroundPosition: 'center',
        position: 'relative'
      }}>
        <Link to="/" style={{ position: 'absolute', top: '20px', left: '20px', padding: '8px 14px', borderRadius: '8px', background: 'rgba(0,0,0,.6)', color: '#fff', border: '1px solid rgba(255,255,255,.2)', textDecoration: 'none' }}>← رجوع</Link>
      </div>

      <div style={{ padding: '0 28px 30px', marginTop: '-120px', position: 'relative', display: 'flex', gap: '26px', flexWrap: 'wrap' }}>
        <div style={{ flex: '0 0 220px' }}>
          {poster ? <img src={poster} alt={title} style={{ width: '100%', borderRadius: '12px', boxShadow: '0 15px 40px rgba(0,0,0,.6)' }} /> : <div style={{ width: '100%', aspectRatio: '2/3', background: '#171b21' }} />}
        </div>

        <div style={{ flex: '1', minWidth: '300px', paddingTop: '60px' }}>
          <h1 style={{ margin: '0 0 6px', fontSize: '32px', color: '#fff' }}>{title} {year && <span style={{ color: '#8d99a6', fontWeight: 400 }}>({year})</span>}</h1>
          {originalTitle && originalTitle !== title && <p style={{ margin: '0 0 10px', color: '#8d99a6' }}>{originalTitle}</p>}
          
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', margin: '12px 0', alignItems: 'center' }}>
            <span style={{ padding: '5px 10px', borderRadius: '6px', background: '#e50914', color: '#fff', fontSize: '13px', fontWeight: 700 }}>{rating} ★</span>
            <span style={{ color: '#8d99a6', fontSize: '13px' }}>{date}</span>
            {genres.map(g => <span key={g.id} style={{ padding: '4px 8px', borderRadius: '999px', background: 'rgba(255,255,255,.08)', fontSize: '11px', color: '#c5ccd3' }}>{g.name}</span>)}
          </div>

          <p style={{ color: '#c5ccd3', lineHeight: '1.7', fontSize: '14px', maxWidth: '700px' }}>{overview}</p>

          <div style={{ display: 'flex', gap: '10px', marginTop: '22px', flexWrap: 'wrap' }}>
            <button onClick={() => setIsPlaying(true)} style={{ minHeight: '46px', padding: '0 22px', border: 'none', borderRadius: '10px', background: '#e50914', color: '#fff', cursor: 'pointer', fontWeight: 800, fontSize: '14px' }}>▶ مشاهدة الآن</button>
            <button onClick={() => onWatchlistChange({ ...details, type: watchlistType, title: title, name: title, poster_path: details.poster_path }, watchlistType)} style={{ minHeight: '46px', padding: '0 18px', border: '1px solid rgba(255,255,255,.12)', borderRadius: '10px', background: saved ? '#e50914' : 'rgba(255,255,255,.06)', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>{saved ? '♥ في المفضلة' : '♡ اضافة للمفضلة'}</button>
          </div>

          {!isMovie && seasons.length > 0 && (
            <div style={{ marginTop: '18px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <select value={seasonNum} onChange={e => setSeasonNum(Number(e.target.value))} style={{ padding: '8px 12px', borderRadius: '8px', background: '#1a1f28', color: '#fff', border: '1px solid rgba(255,255,255,.12)' }}>
                {seasons.map(s => <option key={s.id} value={s.season_number}>الموسم {s.season_number}</option>)}
              </select>
              <select value={episodeNum} onChange={e => setEpisodeNum(Number(e.target.value))} style={{ padding: '8px 12px', borderRadius: '8px', background: '#1a1f28', color: '#fff', border: '1px solid rgba(255,255,255,.12)' }}>
                {Array.from({ length: 50 }, (_, i) => i + 1).map(ep => <option key={ep} value={ep}>الحلقة {ep}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Player */}
      {isPlaying && (
        <div style={{ padding: '0 20px 30px' }}>
          <Player tmdbId={id} type={isMovie ? 'movie' : 'tv'} season={seasonNum} episode={episodeNum} title={title} />
        </div>
      )}

      {cast.length > 0 && (
        <section style={{ padding: '0 28px 28px' }}>
          <h3 style={{ color: '#fff', fontSize: '18px' }}>طاقم العمل</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(95px, 1fr))', gap: '12px', marginTop: '12px' }}>
            {cast.map(p => {
              const img = posterUrl(p.profile_path)
              return (
                <div key={p.credit_id || p.id} style={{ overflow: 'hidden', borderRadius: '8px', background: 'rgba(255,255,255,.04)' }}>
                  {img ? <img src={img} alt={p.name} loading="lazy" style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover' }} /> : <div style={{ width: '100%', aspectRatio: '2/3', background: '#171b21' }} />}
                  <div style={{ padding: '7px 8px' }}><div style={{ color: '#fff', fontSize: '12px' }}>{p.name}</div><div style={{ color: '#7d8894', fontSize: '11px' }}>{p.character}</div></div>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}

function SearchPage({ watchlist, onWatchlistChange, isInWatchlist }) {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!query) return
    document.title = `بحث: ${query} - Zero TV`
    async function search() {
      setLoading(true)
      try {
        const [moviesRes, tvRes, animeRes] = await Promise.all([
          api.searchMovies(query),
          api.searchTV(query),
          api.searchAnime(query),
        ])
        const movies = (moviesRes?.results || []).map(i => ({ ...i, type: 'movie' }))
        const tv = (tvRes?.results || []).map(i => ({ ...i, type: 'tv', isAnime: false }))
        const anime = (animeRes?.results || []).map(i => ({ ...i, type: 'tv', isAnime: true }))
        const map = new Map()
        ;[...movies, ...tv, ...anime].forEach(item => {
          const key = `${item.type}-${item.id}`
          if (!map.has(key)) map.set(key, item)
        })
        setResults(Array.from(map.values()))
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    search()
  }, [query])

  function handleSelect(item) {
    const slug = slugify(item.title || item.name)
    const type = item.type === 'movie' ? 'movie' : item.isAnime ? 'anime' : 'tv'
    navigate(`/${type}/${item.id}/${slug}`)
  }

  return (
    <div style={{ paddingTop: '10px' }}>
      <h1 style={{ color: '#fff' }}>نتائج البحث عن "{query}"</h1>
      <MediaGrid items={results} type="movie" loading={loading} onSelect={handleSelect} onWatchlistChange={onWatchlistChange} isInWatchlist={isInWatchlist} />
    </div>
  )
}

function WatchlistPage({ watchlist, onWatchlistChange, isInWatchlist }) {
  const navigate = useNavigate()
  useEffect(() => { document.title = 'المفضلة - Zero TV' }, [])
  
  function handleSelect(item) {
    const slug = slugify(item.title || item.name)
    const type = item.type || 'movie'
    navigate(`/${type}/${item.id}/${slug}`)
  }

  return (
    <div style={{ paddingTop: '10px' }}>
      <h1 style={{ color: '#fff' }}>♥ المفضلة ({watchlist.length})</h1>
      {watchlist.length === 0 ? <p style={{ color: '#7d8894' }}>المفضلة فاضية</p> : <MediaGrid items={watchlist} type="movie" loading={false} onSelect={handleSelect} onWatchlistChange={onWatchlistChange} isInWatchlist={isInWatchlist} />}
    </div>
  )
}

// Wrapper for Home etc to make navigation work
function HomeWrapper({ watchlist, onWatchlistChange, isInWatchlist }) {
  const navigate = useNavigate()
  useEffect(() => { document.title = 'Zero TV - مشاهدة أفلام ومسلسلات وانمي مجانا' }, [])
  function handleSelect(item) {
    const slug = slugify(item.title || item.name)
    const type = item.type === 'movie' ? 'movie' : item.isAnime ? 'anime' : 'tv'
    navigate(`/${type}/${item.id}/${slug}`)
  }
  return <Home watchlist={watchlist} onWatchlistChange={onWatchlistChange} isInWatchlist={isInWatchlist} onSelect={handleSelect} onGoMovies={() => navigate('/movies')} onGoTV={() => navigate('/tv')} onGoAnime={() => navigate('/anime')} />
}

function MoviesWrapper({ watchlist, onWatchlistChange, isInWatchlist }) {
  const navigate = useNavigate()
  useEffect(() => { document.title = 'أفلام - Zero TV' }, [])
  function handleSelect(item) {
    const slug = slugify(item.title || item.name)
    navigate(`/movie/${item.id}/${slug}`)
  }
  return <Movies watchlist={watchlist} onWatchlistChange={onWatchlistChange} isInWatchlist={isInWatchlist} onSelect={handleSelect} />
}

function TVWrapper({ watchlist, onWatchlistChange, isInWatchlist }) {
  const navigate = useNavigate()
  useEffect(() => { document.title = 'مسلسلات - Zero TV' }, [])
  function handleSelect(item) {
    const slug = slugify(item.title || item.name)
    navigate(`/tv/${item.id}/${slug}`)
  }
  return <TV watchlist={watchlist} onWatchlistChange={onWatchlistChange} isInWatchlist={isInWatchlist} onSelect={handleSelect} />
}

function AnimeWrapper({ watchlist, onWatchlistChange, isInWatchlist }) {
  const navigate = useNavigate()
  useEffect(() => { document.title = 'أنمي - Zero TV' }, [])
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
      if (exists) {
        updated = current.filter(saved => !(String(saved.id) === String(item.id) && saved.type === type))
      } else {
        updated = [...current, { ...item, type }]
      }
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
        <Link to="/" className={styles.logo} style={{ textDecoration: 'none' }}><span className={styles.logoAccent}>zero</span><span className={styles.logoDot}>·</span>tv</Link>
        <nav className={styles.tabs}>
          <NavLink to="/" className={({ isActive }) => `${styles.tab} ${isActive ? styles.active : ''}`}>Home</NavLink>
          <NavLink to="/movies" className={({ isActive }) => `${styles.tab} ${isActive ? styles.active : ''}`}>Movies</NavLink>
          <NavLink to="/tv" className={({ isActive }) => `${styles.tab} ${isActive ? styles.active : ''}`}>TV Shows</NavLink>
          <NavLink to="/anime" className={({ isActive }) => `${styles.tab} ${isActive ? styles.active : ''}`}>🍥 Anime</NavLink>
          <NavLink to="/watchlist" className={({ isActive }) => `${styles.tab} ${isActive ? styles.active : ''}`}>♥ Watchlist{watchlist.length > 0 && <span style={{ marginLeft: '6px', background: '#e50914', borderRadius: '999px', padding: '0 6px', fontSize: '10px' }}>{watchlist.length}</span>}</NavLink>
        </nav>
        <div className={styles.headerRight}>
          <div className={styles.headerSearch}>
            <span className={styles.searchIcon}>🔍</span>
            <input 
              className={styles.headerSearchInput} 
              value={globalQuery} 
              placeholder="Search movies & shows..." 
              onChange={e => setGlobalQuery(e.target.value)} 
              onKeyDown={handleSearch} 
            />
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
          {/* ✅ أهم حاجة - الروابط الديناميك اللي جوجل هيحبها */}
          <Route path="/movie/:id/:slug?" element={<DetailsPage watchlist={watchlist} onWatchlistChange={toggleWatchlist} isInWatchlist={isInWatchlist} />} />
          <Route path="/tv/:id/:slug?" element={<DetailsPage watchlist={watchlist} onWatchlistChange={toggleWatchlist} isInWatchlist={isInWatchlist} />} />
          <Route path="/anime/:id/:slug?" element={<DetailsPage watchlist={watchlist} onWatchlistChange={toggleWatchlist} isInWatchlist={isInWatchlist} />} />
          {/* للتوافق مع الروابط القديمة بدون slug */}
          <Route path="/movie/:id" element={<DetailsPage watchlist={watchlist} onWatchlistChange={toggleWatchlist} isInWatchlist={isInWatchlist} />} />
        </Routes>
      </main>

      <footer className={styles.footer}><p className={styles.footerText}>&copy; {new Date().getFullYear()} All rights reserved <a href="https://www.codespecters.com/" target="_blank" rel="noopener noreferrer" className={styles.footerLink}>Code Specter</a> | Digital Entertainment Democratized</p></footer>
    </div>
  ) 
}

// Wrapper for main.jsx
export function AppWithRouter() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  )
}
