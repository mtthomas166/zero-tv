import React from 'react'
import MediaCard from './MediaCard.jsx'

export default function MediaGrid({
  items = [],
  type = 'movie',
  loading = false,
  onSelect,
  selectedId,
  onWatchlistChange,
  isInWatchlist,
}) {
  if (loading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }}>
        {Array.from({ length: 14 }).map((_, i) => (
          <div key={i} style={{ aspectRatio: '2/3', background: 'rgba(255,255,255,.06)', borderRadius: '10px', animation: 'pulse 1.5s infinite' }} />
        ))}
      </div>
    )
  }

  if (!items.length) {
    return <div style={{ color: '#7d8894', padding: '40px', textAlign: 'center' }}>No results found.</div>
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }}>
      {items.map(item => (
        <MediaCard
          key={`${item.type || type}-${item.id}`}
          item={item}
          type={type}
          onClick={onSelect}
          selected={String(selectedId) === String(item.id)}
          onWatchlistChange={onWatchlistChange}
          isInWatchlist={isInWatchlist}
        />
      ))}
    </div>
  )
}
