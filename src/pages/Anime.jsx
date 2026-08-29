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

const STORAGE_KEY = 'zero-tv-anime-active'
const SCROLL_KEY = 'zero-tv-scroll-pos'
const ITEMS_KEY = 'zero-tv-anime-items'
const NEXT_PAGE_KEY = 'zero-tv-anime-nextPage'
const ACTIVE_SAVED_KEY = 'zero-tv-anime-active-saved'

function isAnimeItem(item){
  if(!item) return false
  if(!item.poster_path) return false
  const title = (item.name || item.title || '').toLowerCase()
  if(title.includes('placeholder') || title.includes('random robotul')) return false
  const hasAnimation = Array.isArray(item.genre_ids) ? item.genre_ids.includes(16) : (Array.isArray(item.genres) ? item.genres.some(g => g.id === 16 || g.name === 'Animation') : false)
  if(!hasAnimation) return false
  const isJP = item.origin_country?.includes('JP') || item.original_language === 'ja'
  if(!isJP) return false
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

  // Save state to sessionStorage whenever items or nextPage change
  useEffect(() => {
    if(items.length > 0){
      try{
        sessionStorage.setItem(ITEMS_KEY, JSON.stringify(items))
        sessionStorage.setItem(NEXT_PAGE_KEY, nextPage.toString())
        sessionStorage.setItem(ACTIVE_SAVED_KEY, active)
      }catch(e){}
    }
  }, [items, nextPage, active])

  useEffect(() => {
    async function load() {
      // Try to restore saved content first (when user clicks back)
      try{
        const savedActive = sessionStorage.getItem(ACTIVE_SAVED_KEY)
        const savedItems = sessionStorage.getItem(ITEMS_KEY)
        const savedNext = sessionStorage.getItem(NEXT_PAGE_KEY)
        if(savedItems && savedActive === active){
          const parsed = JSON.parse(savedItems)
          if(Array.isArray(parsed) && parsed.length >= 70){
            setItems(parsed)
            setNextPage(savedNext ? parseInt(savedNext) : 5)
            setLoading(false)
            return
          }
        }
      }catch(e){}

      setLoading(true)
      setNextPage(5)
      try {
        const cat = categories.find(c => c.key === active) || categories[0]
        const uniqueMap = new Map()
        let page = 1
        while(uniqueMap.size < 70 && page < 40){
          const responses = await Promise.all([page, page+1, page+2, page+3].map(p => cat.fetcher(p)))
          const allResults = responses.flatMap(r => r.results || [])
          if(allResults.length === 0) break
          const filtered = allResults.filter(isAnimeItem)
          filtered.forEach(item => {
            if (!uniqueMap.has(item.id)) uniqueMap.set(item.id, {...item, type: 'tv', isAnime: true })
          })
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

  // Restore scroll position
  useEffect(() => {
    if(!loading && items.length > 0){
      const saved = sessionStorage.getItem(SCROLL_KEY)
      if(saved){
        const pos = parseInt(saved, 10)
        setTimeout(() => {
          window.scrollTo({ top: pos, behavior: 'instant' })
        }, 100)
        setTimeout(() => {
          window.scrollTo({ top: pos, behavior: 'instant' })
          sessionStorage.removeItem(SCROLL_KEY)
        }, 600)
      }
    }
  }, [loading, items])

  const handleSelect = (item) => {
    // Save everything before leaving page
    try{
      sessionStorage.setItem(ITEMS_KEY, JSON.stringify(items))
      sessionStorage.setItem(NEXT_PAGE_KEY, nextPage.toString())
      sessionStorage.setItem(ACTIVE_SAVED_KEY, active)
      sessionStorage.setItem(SCROLL_KEY, window.scrollY.toString())
      sessionStorage.setItem('zero-tv-last-path', window.location.pathname)
    }catch(e){}
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
      let attempts = 0
      while(newMap.size < 70 && page < 120 && attempts < 15){
        const responses = await Promise.all([page, page+1, page+2, page+3].map(p => cat.fetcher(p)))
        const allResults = responses.flatMap(r => r.results || [])
        if(allResults.length === 0){
          attempts++
          page += 4
          continue
        }
        const filtered = allResults.filter(isAnimeItem)
        filtered.forEach(item => {
          if (!existingIds.has(item.id) && !newMap.has(item.id)) {
            newMap.set(item.id, {...item, type: 'tv', isAnime: true })
          }
        })
        page += 4
        if(filtered.length === 0) attempts++
      }
      const newItems = Array.from(newMap.values()).slice(0, 70)
      if(newItems.length > 0){
        const combined = [...items, ...newItems]
        setItems(combined)
        try{
          sessionStorage.setItem(ITEMS_KEY, JSON.stringify(combined))
          sessionStorage.setItem(NEXT_PAGE_KEY, page.toString())
          sessionStorage.setItem(ACTIVE_SAVED_KEY, active)
        }catch(e){}
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
          <button key={cat.key} onClick={() => {
            // Clear saved items when changing category
            try{
              sessionStorage.removeItem(ITEMS_KEY)
              sessionStorage.removeItem(NEXT_PAGE_KEY)
              sessionStorage.removeItem(SCROLL_KEY)
            }catch(e){}
            setActive(cat.key)
          }} style={{ padding: '8px 14px', borderRadius: '999px', border: '1px solid rgba(255,255,255,.1)', background: active === cat.key? '#e50914' : 'rgba(255,255,255,.06)', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>{cat.label}</button>
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
