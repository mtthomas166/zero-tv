import React, { useEffect, useState } from 'react'
import MediaGrid from '../components/MediaGrid.jsx'
import { api } from '../lib/api.js'

const categories = [
  { key: 'trending', label: 'Trending', fetcher: (p) => api.animeTrending(p) },
  { key: 'popular', label: 'Popular', fetcher: (p) => api.animePopular(p) },
  { key: 'top_rated', label: 'Top Rated', fetcher: (p) => api.animeTopRated(p) },
  { key: 'airing', label: 'Airing Now', fetcher: (p) => api.animeAiring(p) },
  { key: 'upcoming', label: 'Upcoming', fetcher: (p) => api.animeUpcoming(p) },
]

const PAGE_BATCH = 4
const STORAGE_KEY = 'zero-tv-anime-active'
const SCROLL_KEY = 'zero-tv-scroll-pos'

function isAnimeItem(item){
  if(!item) return false
  const hasAnimation = Array.isArray(item.genre_ids) ? item.genre_ids.includes(16) : (Array.isArray(item.genres) ? item.genres.some(g => g.id === 16 || g.name === 'Animation') : false)
  if(!hasAnimation) return false
  return true
}

export default function Anime({ watchlist, onWatchlistChange, isInWatchlist, initialCategory, onSelect }) {
  const [active, setActive] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || initialCategory || 'trending'
  })
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [nextPage, setNextPage] = useState(5)

  useEffect(() => {
    if (initialCategory) setActive(initialCategory)
  }, [initialCategory])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, active)
  }, [active])

  // Load initial 70
  useEffect(() => {
    async function load() {
      setLoading(true)
      setNextPage(5)
      try {
        const cat = categories.find(c => c.key === active) || categories[0]
        const uniqueMap = new Map()
        let page = 1
        // Keep fetching until we have 70 anime or we tried 30 pages
        while(uniqueMap.size < 70 && page < 30){
          const responses = await Promise.all([page, page+1, page+2, page+3].map(p => cat.fetcher(p)))
          const allResults = responses.flatMap(r => r.results || [])
          const filtered = allResults.filter(isAnimeItem)
          filtered.forEach(item => {
            if (!uniqueMap.has(item.id)) uniqueMap.set(item.id, {...item, type: 'tv', isAnime: true })
          })
          if(allResults.length === 0) break
          page += 4
        }
        setItems(Array.from(uniqueMap.values()).slice(0, 70))
        setNextPage(page)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [active])

  // Restore scroll position after items loaded - FIX for back button returning to same place
  useEffect(() => {
    if(!loading && items.length > 0){
      const saved = sessionStorage.getItem(SCROLL_KEY)
      if(saved){
        const pos = parseInt(saved, 10)
        // Wait for DOM to render then scroll
        setTimeout(() => {
          window.scrollTo({ top: pos, behavior: 'instant' })
          sessionStorage.removeItem(SCROLL_KEY)
        }, 100)
        // Second attempt after images load
        setTimeout(() => {
          window.scrollTo({ top: pos, behavior: 'instant' })
        }, 500)
      }
    }
  }, [loading, items])

  const handleSelect = (item) => {
    // Save exact scroll position before navigating
    sessionStorage.setItem(SCROLL_KEY, window.scrollY.toString())
    sessionStorage.setItem('zero-tv-last-path', window.location.pathname)
    onSelect({...item, type: 'tv', isAnime: true })
  }

  async function handleLoadMore() {
    if (loadingMore) return
    setLoadingMore(true)
    try {
      const cat = categories.find(c => c.key === active) || categories[0]
      const existingIds = new Set(items.map(i => i.id))
      const newMap = new Map()
      let page = nextPage
      // Infinite: keep trying pages until we find 70 new anime
      let attempts = 0
      while(newMap.size < 70 && page < 100 && attempts < 10){
        const responses = await Promise.all([page, page+1, page+2, page+3].map(p => cat.fetcher(p)))
        const allResults = responses.flatMap(r => r.results || [])
        const filtered = allResults.filter(isAnimeItem)
        filtered.forEach(item => {
          if (!existingIds.has(item.id) && !newMap.has(item.id)) {
            newMap.set(item.id, {...item, type: 'tv', isAnime: true })
          }
        })
        if(allResults.length === 0){
          attempts++
        } else {
          page += 4
        }
        // If after filtering we got nothing, keep searching next pages (infinite behavior)
        if(filtered.length === 0){
          page += 4
          attempts++
          continue
        }
      }
      const newItems = Array.from(newMap.values()).slice(0, 70)
      if(newItems.length > 0){
        setItems(prev => [...prev, ...newItems])
      }
      setNextPage(page)
    } catch (e) { 
      console.error(e) 
    } finally { 
      setLoadingMore(false) 
    }
  }

  return (
    <div style={{ paddingTop: '10px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ margin: '0 0 6px', fontSize: '28px', color: '#fff' }}>Anime</h1>
        <p style={{ margin: 0, color: '#7d8894', fontSize: '13px' }}>{items.length} titles +</p>
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {categories.map(cat => (
          <button key={cat.key} onClick={() => setActive(cat.key)} style={{ padding: '8px 14px', borderRadius: '999px', border: '1px solid rgba(255,255,255,.1)', background: active === cat.key? '#e50914' : 'rgba(255,255,255,.06)', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>{cat.label}</button>
        ))}
      </div>
      <MediaGrid items={items} type="anime" loading={loading} onSelect={handleSelect} onWatchlistChange={onWatchlistChange} isInWatchlist={isInWatchlist} />
      {!loading && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '28px' }}>
          <button onClick={handleLoadMore} disabled={loadingMore} style={{ minHeight: '44px', padding: '0 28px', borderRadius: '10px', border: '1px solid rgba(255,255,255,.12)', background: loadingMore? 'rgba(255,255,255,.06)' : '#e50914', color: '#fff', fontWeight: 800, fontSize: '13px', cursor: loadingMore? 'not-allowed' : 'pointer' }}>
            {loadingMore? 'Loading...' : 'Load More +70'}
          </button>
        </div>
      )}
    </div>
  )
}
