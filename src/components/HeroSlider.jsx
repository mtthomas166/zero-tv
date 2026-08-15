import React, { useEffect, useState, useRef } from 'react'
import { posterUrl } from '../lib/api.js'

export default function HeroSlider({ items = [], onSelect, onWatchlistChange, isInWatchlist }) {
  const [current, setCurrent] = useState(0)
  const [progress, setProgress] = useState(0)
  const timerRef = useRef(null)
  const progressRef = useRef(null)

  const movie = items[current]

  // Auto slide every 6 seconds
  useEffect(() => {
    if (!items.length) return
    startTimer()
    return () => clearTimers()
  }, [current, items.length])

  function clearTimers() {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (progressRef.current) clearInterval(progressRef.current)
  }

  function startTimer() {
    clearTimers()
    setProgress(0)
    let p = 0
    progressRef.current = setInterval(() => {
      p += 1
      setProgress(p)
      if (p >= 100) clearInterval(progressRef.current)
    }, 60) // 60*100 = 6000ms = 6s

    timerRef.current = setTimeout(() => {
      setCurrent(prev => (prev + 1) % items.length)
    }, 6000)
  }

  function goTo(index) {
    setCurrent(index)
  }

  if (!movie) return null

  const title = movie.title || movie.name || 'Unknown'
  const overview = movie.overview || ''
  const year = (movie.release_date || movie.first_air_date || '').slice(0, 4)
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : null
  const backdrop = movie.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` : null
  const isSaved = isInWatchlist ? isInWatchlist(movie, 'movie') : false

  return (
    <div style={{ position: 'relative', width: '100%', height: '78vh', minHeight: '520px', maxHeight: '760px', overflow: 'hidden', borderRadius: '0 0 18px 18px', background: '#0b0e12', marginBottom: '26px' }}>
      {/* Backdrop */}
      <div style={{ position: 'absolute', inset: 0, background: backdrop ? `url("${backdrop}") center/cover no-repeat` : '#151922', transition: 'background 0.8s ease' }} />
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(90deg, #0b0e12 0%, rgba(11,14,18,.85) 35%, rgba(11,14,18,.25) 70%), linear-gradient(0deg, #0b0e12 0%, rgba(11,14,18,0) 60%)` }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 5% 60px', maxWidth: '1200px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <span style={{ padding: '5px 10px', borderRadius: '999px', background: 'rgba(229,9,20,.15)', border: '1px solid rgba(229,9,20,.3)', color: '#ff6b6b', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>↗ Trending</span>
          <span style={{ padding: '5px 10px', borderRadius: '999px', background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)', color: '#c5ccd3', fontSize: '11px', fontWeight: 600 }}>Movie</span>
          {rating && <span style={{ padding: '5px 10px', borderRadius: '999px', background: 'rgba(255,213,102,.12)', border: '1px solid rgba(255,213,102,.2)', color: '#ffd166', fontSize: '11px', fontWeight: 700 }}>★ {rating}</span>}
          {year && <span style={{ padding: '5px 10px', borderRadius: '999px', background: 'rgba(255,255,255,.06)', color: '#9aa5b1', fontSize: '11px' }}>{year}</span>}
        </div>

        <h1 style={{ margin: '0 0 14px', fontSize: 'clamp(32px, 6vw, 64px)', lineHeight: 0.95, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '-.02em', maxWidth: '650px', textShadow: '0 4px 24px rgba(0,0,0,.6)' }}>{title}</h1>

        <p style={{ margin: '0 0 22px', color: '#b8bec8', fontSize: '14px', lineHeight: 1.6, maxWidth: '520px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{overview}</p>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={() => onSelect && onSelect(movie)} style={{ minHeight: '44px', padding: '0 20px', borderRadius: '10px', border: 'none', background: '#e50914', color: '#fff', fontWeight: 800, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 8px 24px rgba(229,9,20,.35)' }}>▶ Watch Now</button>
          <button onClick={() => onSelect && onSelect(movie)} style={{ minHeight: '44px', padding: '0 18px', borderRadius: '10px', border: '1px solid rgba(255,255,255,.14)', background: 'rgba(255,255,255,.08)', color: '#fff', fontWeight: 700, fontSize: '13px', cursor: 'pointer', backdropFilter: 'blur(8px)' }}>ⓘ Details</button>
          <button onClick={() => onWatchlistChange && onWatchlistChange(movie, 'movie')} style={{ minHeight: '44px', padding: '0 18px', borderRadius: '10px', border: '1px solid rgba(255,255,255,.14)', background: isSaved ? '#e50914' : 'rgba(255,255,255,.06)', color: '#fff', fontWeight: 700, fontSize: '13px', cursor: 'pointer', backdropFilter: 'blur(8px)' }}>{isSaved ? '♥ In List' : '+ Watchlist'}</button>
        </div>
      </div>

      {/* Dots */}
      <div style={{ position: 'absolute', bottom: '18px', left: '50%', transform: 'translateX(-50%)', zIndex: 3, display: 'flex', gap: '8px', alignItems: 'center' }}>
        {items.slice(0, 8).map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            style={{
              width: current === i ? '28px' : '8px',
              height: '8px',
              borderRadius: '999px',
              border: 'none',
              background: current === i ? '#e50914' : 'rgba(255,255,255,.3)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              padding: 0,
            }}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Progress Bar */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: 'rgba(255,255,255,.1)', zIndex: 3 }}>
        <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #e50914, #ff6b6b)', transition: 'width 0.06s linear' }} />
      </div>
    </div>
  )
}
