import React, { useEffect, useState } from 'react'
import MediaGrid from '../components/MediaGrid.jsx'
import { api } from '../lib/api.js'

const categories = [
  { key: 'trending', label: '🔥 Trending', fetcher: (p) => api.animeTrending(p) },
  { key: 'popular', label: '🎬 Popular', fetcher: (p) => api.animePopular(p) },
  { key: 'top_rated', label: '⭐ Top Rated', fetcher: (p) => api.animeTopRated(p) },
  { key: 'airing', label: '📡 Airing Now', fetcher: (p) => api.animeAiring(p) },
  { key: 'upcoming', label: '🚀 Upcoming', fetcher: (p) => api.animeUpcoming(p) },
]

const STORAGE_KEY = 'zero-tv-anime-active'
const SCROLL_KEY = 'zero-tv-scroll'

function isAnimeItem(item){
  if(!item) return false
  const isJP = item.origin_country?.includes('JP') || item.original_language === 'ja'
  const hasAnimation = Array.isArray(item.genre_ids) ? item.genre_ids.includes(16) : false
  const hasAnimationGenre = Array.isArray(item.genres) ? item.genres.some(g => g.id === 16 || g.name === 'Animation') : false
  return isJP || hasAnimation || hasAnimationGenre
}

export default function Anime({ watchlist, onWatchlistChange, isInWatchlist, initialCategory, onSelect }) {
  const [active, setActive] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || initialCategory || 'trending'
  })
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [nextPage, setNextPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    if (initialCategory) {
      setActive(initialCategory)
    }
  }, [initialCategory])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, active)
  }, [active])

  useEffect(() => {
    async function load() {
      setLoading(true)
      setHasMore(true)
      setNextPage(1)
      try {
        const cat = categories.find(c => c.key === active) || categories[0]
        const uniqueMap = new Map()
        let page = 1
        let tries = 0
        // لحد ما نجمع 70 انمي او نقلب 20 صفحة (80 محاولة)
        while(uniqueMap.size < 70 && page <= 25 && tries < 8){
          const responses = await Promise.all([page, page+1, page+2, page+3].map(p => cat.fetcher(p)))
          const allResults = responses.flatMap(r => r.results || [])
          const filtered = allResults.filter(isAnimeItem)
          filtered.forEach(item => {
            if (!uniqueMap.has(item.id)) uniqueMap.set(item.id, {...item, type: 'tv', isAnime: true })
          })
          const gotAny = allResults.length > 0
          page += 4
          tries++
          if(!gotAny) break
        }
        const mapped = Array.from(uniqueMap.values()).slice(0, 70)
        setItems(mapped)
        setNextPage(page)
        setHasMore(uniqueMap.size >= 70 || page <= 25)

        const savedScroll = sessionStorage.getItem(SCROLL_KEY)
        if (savedScroll) {
          setTimeout(() => {
            window.scrollTo(0, parseInt(savedScroll))
            sessionStorage.removeItem(SCROLL_KEY)
          }, 150)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [active])

  const handleSelect = (item) => {
    sessionStorage.setItem(SCROLL_KEY, window.scrollY.toString())
    sessionStorage.setItem('zero-tv-last-path', window.location.pathname)
    onSelect({...item, type: 'tv', isAnime: true })
  }

  async function handleLoadMore() {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      const cat = categories.find(c => c.key === active) || categories[0]
      const uniqueNew = new Map()
      let page = nextPage
      let tries = 0
      const existingIds = new Set(items.map(i => i.id))
      while(uniqueNew.size < 70 && page <= 30 && tries < 6){
        const responses = await Promise.all([page, page+1, page+2, page+3].map(p => cat.fetcher(p)))
        const allResults = responses.flatMap(r => r.results || [])
        const filtered = allResults.filter(isAnimeItem)
        filtered.forEach(item => {
          if (!existingIds.has(item.id) && !uniqueNew.has(item.id)) {
            uniqueNew.set(item.id, {...item, type: 'tv', isAnime: true })
          }
        })
        const gotAny = allResults.length > 0
        page += 4
        tries++
        if(!gotAny) break
      }
      const newItems = Array.from(uniqueNew.values()).slice(0,70)
      if (newItems.length === 0) setHasMore(false)
      else {
        setItems(prev => [...prev, ...newItems])
        setNextPage(page)
        setHasMore(page <= 30)
      }
    } catch (e) { console.error(e) }
    finally { setLoadingMore(false) }
  }

  return (
    <div style={{ paddingTop: '10px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ margin: '0 0 6px', fontSize: '28px', color: '#fff' }}>🍥 Anime</h1>
        <p style={{ margin: 0, color: '#7d8894', fontSize: '13px' }}>{items.length} titles {hasMore? '+' : ''}</p>
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {categories.map(cat => (
          <button key={cat.key} onClick={() => setActive(cat.key)} style={{ padding: '8px 14px', borderRadius: '999px', border: '1px solid rgba(255,255,255,.1)', background: active === cat.key? '#e50914' : 'rgba(255,255,255,.06)', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>{cat.label}</button>
        ))}
      </div>
      <MediaGrid items={items} type="anime" loading={loading} onSelect={handleSelect} onWatchlistChange={onWatchlistChange} isInWatchlist={isInWatchlist} />
      {!loading && hasMore && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '28px' }}>
          <button onClick={handleLoadMore} disabled={loadingMore} style={{ minHeight: '44px', padding: '0 28px', borderRadius: '10px', border: '1px solid rgba(255,255,255,.12)', background: loadingMore? 'rgba(255,255,255,.06)' : '#e50914', color: '#fff', fontWeight: 800, fontSize: '13px', cursor: loadingMore? 'not-allowed' : 'pointer' }}>{loadingMore? 'Loading...' : 'Load More +70'}</button>
        </div>
      )}
    </div>
  )
}
