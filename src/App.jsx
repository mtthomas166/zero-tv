import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams, useSearchParams, NavLink, useLocation } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Movies from './pages/Movies.jsx'
import TV from './pages/TV.jsx'
import Anime from './pages/Anime.jsx'
import MediaGrid from './components/MediaGrid.jsx'
import Player from './components/Player.jsx'
import { api, posterUrl, formatRating, getYear, buildUniqueContent } from './lib/api.js'
import styles from './App.module.css'

function slugify(text) {
  if (!text) return ''
  return text.toString().toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').substring(0,60)
}

const WATCHLIST_KEY = 'cs_watchlist'
function loadWatchlist() {
  try {
    const value = localStorage.getItem(WATCHLIST_KEY)
    if (!value) return []
    const parsed = JSON.parse(value)
    return Array.isArray(parsed)? parsed : []
  } catch { return [] }
}
function saveWatchlist(items) {
  try { localStorage.setItem(WATCHLIST_KEY, JSON.stringify(items)) } catch {}
}
function setMeta(name, content, isProperty = false) {
  if (!content) return
  const selector = isProperty? `meta[property="${name}"]` : `meta[name="${name}"]`
  let el = document.querySelector(selector)
  if (!el) {
    el = document.createElement('meta')
    if (isProperty) el.setAttribute('property', name)
    else el.setAttribute('name', name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}
function setCanonical(url) {
  let el = document.querySelector('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', url)
}
function setJsonLd(data) {
  let el = document.getElementById('json-ld-details')
  if (!el) {
    el = document.createElement('script')
    el.id = 'json-ld-details'
    el.type = 'application/ld+json'
    document.head.appendChild(el)
  }
  el.textContent = JSON.stringify(data)
}
function clearJsonLd() {
  const el = document.getElementById('json-ld-details')
  if (el) el.remove()
}

// === FIX: ده اللي بيصلح مشكلة /watch?type=tv&id=... و utm_source بتاع Pinterest ===
function WatchRedirect() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  useEffect(() => {
    const type = searchParams.get('type') || 'tv'
    const id = searchParams.get('id')
    const s = searchParams.get('s')
    const e = searchParams.get('e')
    if (!id) {
      navigate('/', { replace: true })
      return
    }
    if (type === 'movie') {
      navigate(`/movie/${id}`, { replace: true })
    } else {
      if (s && e) {
        navigate(`/${type}/${id}/season/${s}/episode/${e}`, { replace: true })
      } else {
        navigate(`/${type}/${id}`, { replace: true })
      }
    }
  }, [searchParams, navigate])
  return <div style={{ padding: '100px', textAlign: 'center', color: '#fff' }}>Redirecting...</div>
}

function DetailsPage({ watchlist, onWatchlistChange, isInWatchlist }) {
  const { id, seasonNum: urlSeason, episodeNum: urlEpisode } = useParams()
  const [searchParams] = useSearchParams()
  const [details, setDetails] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [seasonNum, setSeasonNum] = useState(urlSeason? parseInt(urlSeason) : 1)
  const [episodeNum, setEpisodeNum] = useState(urlEpisode? parseInt(urlEpisode) : 1)
  const [type, setType] = useState('movie')
  const [seasonDetails, setSeasonDetails] = useState(null)
  const [episodesLoading, setEpisodesLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const handleBack = () => {
    const lastPath = sessionStorage.getItem('zero-tv-last-path') || location.state?.from
    if (lastPath) {
      navigate(lastPath)
    } else {
      if (type === 'movie') navigate('/movies')
      else if (type === 'tv') navigate('/tv')
      else if (type === 'anime') navigate('/anime')
      else if (window.history.length > 2) navigate(-1)
      else navigate('/')
    }
  }

  useEffect(() => {
    if (urlSeason) setSeasonNum(parseInt(urlSeason))
    if (urlEpisode) {
      setEpisodeNum(parseInt(urlEpisode))
      setIsPlaying(true)
    }
    const qS = searchParams.get('s')
    const qE = searchParams.get('e')
    if (qS) setSeasonNum(parseInt(qS))
    if (qE) {
      setEpisodeNum(parseInt(qE))
      setIsPlaying(true)
    }
  }, [urlSeason, urlEpisode, searchParams])

  useEffect(() => {
    async function load() {
      setLoading(true)
      const path = window.location.pathname
      const isMoviePath = path.startsWith('/movie')
      try {
        if (isMoviePath) {
          try {
            const movieData = await api.movieDetails(id)
            if (movieData && movieData.title) {
              setDetails(movieData)
              setType('movie')
              return
            }
          } catch {}
          const tvData = await api.tvDetails(id)
          setDetails(tvData)
          setType(tvData.genres?.some(g => g.name === 'Animation') || tvData.origin_country?.includes('JP')? 'anime' : 'tv')
        } else {
          try {
            const tvData = await api.tvDetails(id)
            if (tvData && (tvData.name || tvData.original_name)) {
              setDetails(tvData)
              const isAnimeCheck = tvData.genres?.some(g => g.name === 'Animation') || tvData.origin_country?.includes('JP')
              setType(isAnimeCheck? 'anime' : 'tv')
              return
            }
          } catch {}
          const movieData = await api.movieDetails(id)
          setDetails(movieData)
          setType('movie')
        }
      } catch (e) { console.error(e) } finally { setLoading(false) }
    }
    load()
  }, [id])

  useEffect(() => {
    if (!details) return
    const isMovie = type === 'movie' ||!!details.title
    const title = isMovie? details.title : details.name
    const year = getYear(isMovie? details.release_date : details.first_air_date)
    const overview = details.overview || `Watch ${title} online in HD on Zero TV`
    const unique = buildUniqueContent(details)
    const shortDesc = unique? unique.metaDescription : overview.slice(0, 155)
    const poster = posterUrl(details.poster_path, true)
    const backdrop = details.backdrop_path? `https://image.tmdb.org/t/p/w1280${details.backdrop_path}` : poster
    const slug = slugify(title)
    const isEpisodeView =!isMovie && isPlaying
    const epSlugForUrl = seasonDetails?.episodes?.find(e => e.episode_number === episodeNum)?.name? slugify(seasonDetails.episodes.find(e => e.episode_number === episodeNum).name) : ''
    const canonicalUrl = isEpisodeView
    ? `https://zero-tv.pages.dev/${type}/${id}/${slug}/season/${seasonNum}/episode/${episodeNum}${epSlug
