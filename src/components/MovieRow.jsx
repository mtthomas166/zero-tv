import React, { useRef } from 'react'
import MediaCard from './MediaCard.jsx'

export default function MovieRow({
  title,
  items = [],
  loading = false,
  onSelect,
  onViewAll,
  watchlist,
  onWatchlistChange,
  isInWatchlist,
  type = 'movie',
}) {
  const scrollRef = useRef(null)

  function scroll(dir) {
    if (!scrollRef.current) return
    const amount = 800
    scrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' })
  }

  return (
    <section style={{ marginBottom: '38px' }}>
      {/* Header - FIXED: Title and View All are now clickable */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', gap: '12px' }}>
        <h2
          onClick={onViewAll}
          style={{
            margin: 0,
            fontSize: '18px',
            color: '#fff',
            cursor: onViewAll ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
          title={onViewAll ? `View all ${title}` : undefined}
        >
          <span>{title}</span>
        </h2>

        {onViewAll && (
          <button
            onClick={onViewAll}
            style={{
              background: 'rgba(255,255,255,.06)',
              border: '1px solid rgba(255,255,255,.08)',
              color: '#00d4ff',
              fontSize: '11px',
              fontWeight: 700,
              padding: '6px 12px',
              borderRadius: '999px',
              cursor: 'pointer',
              letterSpacing: '.02em',
            }}
          >
            View All
          </button>
        )}
      </div>

      <div style={{ position: 'relative' }}>
        {/* Left Arrow */}
        <button onClick={() => scroll('left')} style={{ position: 'absolute', left: '-14px', top: '42%', transform: 'translateY(-50%)', zIndex: 2, width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(0,0,0,.75)', border: '1px solid rgba(255,255,255,.12)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>

        <div
          ref={scrollRef}
          style={{
            display: 'flex',
            gap: '14px',
            overflowX: 'auto',
            overflowY: 'hidden',
            paddingBottom: '8px',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
          className="hide-scrollbar"
        >
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{ flex: '0 0 160px', aspectRatio: '2/3', background: 'rgba(255,255,255,.06)', borderRadius: '10px' }} />
              ))
            : items.map(item => (
                <div key={`${item.type || type}-${item.id}`} style={{ flex: '0 0 160px' }}>
                  <MediaCard item={item} type={type} onClick={onSelect} onWatchlistChange={onWatchlistChange} isInWatchlist={isInWatchlist} />
                </div>
              ))}
        </div>

        {/* Right Arrow */}
        <button onClick={() => scroll('right')} style={{ position: 'absolute', right: '-14px', top: '42%', transform: 'translateY(-50%)', zIndex: 2, width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(0,0,0,.75)', border: '1px solid rgba(255,255,255,.12)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
      </div>
    </section>
  )
}
