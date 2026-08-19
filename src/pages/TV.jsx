import React, { useEffect, useState } from 'react'
import MediaGrid from '../components/MediaGrid.jsx'
import { api } from '../lib/api.js'

const categories = [
  { key: 'trending', label: '🔥 Trending', fetcher: (p) => api.trendingTV(p) },
  { key: 'popular', label: '🎬 Popular', fetcher: (p) => api.popularTV(p) },
  { key: 'top_rated', label: '⭐ Top Rated', fetcher: (p) => api.topRatedTV(p) },
  { key: 'airing_today', label: '📡 Airing Today', fetcher: (p) => api.airingTodayTV(p) },
  { key: 'on_the_air', label: '📺 On The Air', fetcher: (p) => api.onTheAirTV(p) },
]

const PAGE_BATCH = 4
const STORAGE_KEY = 'zero-tv-tv-active'

export default function TV({ watchlist, onWatchlistChange, isInWatchlist, onSelect }) {
  const [active, setActive] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || 'trending'
  })
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [nextPage, setNextPage] = useState(5)
  const [hasMore, setHasMore] = useState(true)

  // احفظ الفلتر
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, active)
  }, [active])

  useEffect(() => {
    async function load() {
      setLoading(true)
      setHasMore(true)
      setNextPage(5)
      try {
        const cat = categories.find(c => c.key === active) || categories[0]
        const responses = await Promise.all([1,2,3,4].map(p => cat.fetcher(p)))
        const allResults = responses.flatMap(r => r.results || [])
        const uniqueMap = new Map()
        allResults.forEach(item => {
          if (!uniqueMap.has(item.id)) uniqueMap.set(item.id, {...item, type: 'tv', isAnime: false })
        })
        setItems(Array.from(uniqueMap.values()).slice(0, 70))
        // رجع مكان الاسكرول
        const savedScroll = sessionStorage.getItem('zero-tv-scroll')
        if (savedScroll) {
          setTimeout(() => window.scrollTo(0, parseInt(savedScroll)), 100)
          sessionStorage.removeItem('zero-tv-scroll')
        }
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [active])

  const handleSelect = (item) => {
    // احفظ مكانك قبل ما تفتح الفيلم
    sessionStorage.setItem('zero-tv-scroll', window.scrollY.toString())
    localStorage.setItem(STORAGE_KEY, active)
    onSelect(item)
  }

  async function handleLoadMore() {
    if (loadingMore ||!hasMore) return
    setLoadingMore(true)
    try {
      const cat = categories.find(c => c.key === active) || categories[0]
      const responses = await Promise.all([nextPage, nextPage+1, nextPage+2, nextPage+3].map(p => cat.fetcher(p)))
      const allResults = responses.flatMap(r => r.results || [])
      if (allResults.length === 0) { setHasMore(false); return }
      const existingIds = new Set(items.map(i => i.id))
      const newUnique = []
      allResults.forEach(item => {
        if (!existingIds.has(item.id)) {
          newUnique.push({...item, type: 'tv', isAnime: false })
          existingIds.add(item.id)
        }
      })
      if (newUnique.length === 0) setHasMore(false)
      else {
        setItems(prev => [...prev,...newUnique])
        setNextPage(prev => prev + PAGE_BATCH)
      }
    } catch (e) { console.error(e) }
    finally { setLoadingMore(false) }
  }

  return (
    <div style={{ paddingTop: '10px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ margin: '0 0 6px', fontSize: '28px', color: '#fff' }}>📺 TV Shows</h1>
        <p style={{ margin: 0, color: '#7d8894', fontSize: '13px' }}>{items.length} shows {hasMore? '+' : ''}</p>
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {categories.map(cat => (
          <button key={cat.key} onClick={() => setActive(cat.key)} style={{ padding: '8px 14px', borderRadius: '999px', border: '1px solid rgba(255,255,255,.1)', background: active === cat.key? '#e50914' : 'rgba(255,255,255,.06)', color: '#fff
