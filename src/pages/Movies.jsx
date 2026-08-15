import React, { useEffect, useState } from 'react'
import MediaGrid from '../components/MediaGrid.jsx'
import { api } from '../lib/api.js'

const categories = [
  { key: 'trending', label: '🔥 Trending', fetcher: (p) => api.trendingMovies(p) },
  { key: 'popular', label: '🎬 Popular', fetcher: (p) => api.popularMovies(p) },
  { key: 'top_rated', label: '⭐ Top Rated', fetcher: (p) => api.topRatedMovies(p) },
  { key: 'now_playing', label: '🎥 Now Playing', fetcher: (p) => api.nowPlayingMovies(p) },
  { key: 'upcoming', label: '🚀 Upcoming', fetcher: (p) => api.upcomingMovies(p) },
]

const PAGE_BATCH = 4 // 4 pages = ~70-80 items
const TARGET_INITIAL = 70

export default function Movies({ watchlist, onWatchlistChange, isInWatchlist, initialCategory, onSelect }) {
  const [active, setActive] = useState(initialCategory || 'trending')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [nextPage, setNextPage] = useState(5) // next batch starts at 5
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    if (initialCategory) setActive(initialCategory)
  }, [initialCategory])

  useEffect(() => {
    async function load() {
      setLoading(true)
      setHasMore(true)
      setNextPage(5)
      try {
        const cat = categories.find(c => c.key === active) || categories[0]
        const pagesToFetch = [1, 2, 3, 4]
        const responses = await Promise.all(pagesToFetch.map(p => cat.fetcher(p)))
        const allResults = responses.flatMap(res => res.results || [])
        const uniqueMap = new Map()
        allResults.forEach(item => {
          if (!uniqueMap.has(item.id)) uniqueMap.set(item.id, { ...item, type: 'movie' })
        })
        const mapped = Array.from(uniqueMap.values()).slice(0, TARGET_INITIAL)
        setItems(mapped)
        if (mapped.length < TARGET_INITIAL) setHasMore(false)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [active])

  async function handleLoadMore() {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      const cat = categories.find(c => c.key === active) || categories[0]
      const pagesToFetch = [nextPage, nextPage+1, nextPage+2, nextPage+3]
      const responses = await Promise.all(pagesToFetch.map(p => cat.fetcher(p)))
      const allResults = responses.flatMap(res => res.results || [])
      
      if (allResults.length === 0) {
        setHasMore(false)
        return
      }

      const existingIds = new Set(items.map(i => i.id))
      const newUnique = []
      allResults.forEach(item => {
        if (!existingIds.has(item.id)) {
          newUnique.push({ ...item, type: 'movie' })
          existingIds.add(item.id)
        }
      })

      if (newUnique.length === 0) {
        setHasMore(false)
      } else {
        setItems(prev => [...prev, ...newUnique].slice(0, prev.length + 70))
        setNextPage(prev => prev + PAGE_BATCH)
        if (newUnique.length < 60) setHasMore(false)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <div style={{ paddingTop: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button
              key={cat.key}
              onClick={() => setActive(cat.key)}
              style={{
                padding: '8px 14px',
                borderRadius: '999px',
                border: '1px solid rgba(255,255,255,.1)',
                background: active === cat.key ? '#e50914' : 'rgba(255,255,255,.06)',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
        <span style={{ color: '#6f7883', fontSize: '12px' }}>{items.length} movies {hasMore ? '+' : ''}</span>
      </div>

      <MediaGrid items={items} type="movie" loading={loading} onSelect={onSelect} onWatchlistChange={onWatchlistChange} isInWatchlist={isInWatchlist} />

      {!loading && hasMore && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '28px' }}>
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            style={{
              minHeight: '44px',
              padding: '0 28px',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,.12)',
              background: loadingMore ? 'rgba(255,255,255,.06)' : '#e50914',
              color: '#fff',
              fontWeight: 800,
              fontSize: '13px',
              cursor: loadingMore ? 'not-allowed' : 'pointer',
              boxShadow: loadingMore ? 'none' : '0 6px 18px rgba(229,9,20,.3)',
            }}
          >
            {loadingMore ? 'Loading...' : `Load More +70`}
          </button>
        </div>
      )}

      {!hasMore && items.length > 0 && (
        <div style={{ textAlign: 'center', color: '#6f7883', fontSize: '12px', marginTop: '24px' }}>No more movies in this category</div>
      )}
    </div>
  )
}
