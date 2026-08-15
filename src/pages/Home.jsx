import React, { useEffect, useState } from 'react'
import MovieRow from '../components/MovieRow.jsx'
import HeroSlider from '../components/HeroSlider.jsx'
import { api } from '../lib/api.js'

export default function Home({ watchlist, onWatchlistChange, isInWatchlist, onGoMovies, onGoTV, onGoAnime, onSelect }) {
  const [trendingMovies, setTrendingMovies] = useState([])
  const [popularMovies, setPopularMovies] = useState([])
  const [topRatedMovies, setTopRatedMovies] = useState([])
  
  const [trendingTV, setTrendingTV] = useState([])
  const [popularTV, setPopularTV] = useState([])
  const [topRatedTV, setTopRatedTV] = useState([])
  
  const [trendingAnime, setTrendingAnime] = useState([])
  const [popularAnime, setPopularAnime] = useState([])
  const [topRatedAnime, setTopRatedAnime] = useState([])
  const [airingAnime, setAiringAnime] = useState([])
  const [upcomingAnime, setUpcomingAnime] = useState([])

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadAll() {
      setLoading(true)
      try {
        const [
          trM, popM, topM,
          trTV, popTV, topTV,
          trAn, popAn, topAn,
          airAn, upAn
        ] = await Promise.all([
          api.trendingMovies(1),
          api.popularMovies(1),
          api.topRatedMovies(1),
          api.trendingTV(1),
          api.popularTV(1),
          api.topRatedTV(1),
          api.animeTrending(1),
          api.animePopular(1),
          api.animeTopRated(1),
          api.animeAiring(1),
          api.animeUpcoming(1),
        ])

        setTrendingMovies((trM.results || []).map(m => ({ ...m, type: 'movie' })))
        setPopularMovies((popM.results || []).map(m => ({ ...m, type: 'movie' })))
        setTopRatedMovies((topM.results || []).map(m => ({ ...m, type: 'movie' })))

        setTrendingTV((trTV.results || []).map(m => ({ ...m, type: 'tv', isAnime: false })))
        setPopularTV((popTV.results || []).map(m => ({ ...m, type: 'tv', isAnime: false })))
        setTopRatedTV((topTV.results || []).map(m => ({ ...m, type: 'tv', isAnime: false })))

        setTrendingAnime((trAn.results || []).map(m => ({ ...m, type: 'tv', isAnime: true })))
        setPopularAnime((popAn.results || []).map(m => ({ ...m, type: 'tv', isAnime: true })))
        setTopRatedAnime((topAn.results || []).map(m => ({ ...m, type: 'tv', isAnime: true })))
        setAiringAnime((airAn.results || []).map(m => ({ ...m, type: 'tv', isAnime: true })))
        setUpcomingAnime((upAn.results || []).map(m => ({ ...m, type: 'tv', isAnime: true })))
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    loadAll()
  }, [])

  return (
    <div style={{ margin: '-20px -20px 0 -20px' }}>
      <HeroSlider items={trendingMovies} onSelect={onSelect} onWatchlistChange={onWatchlistChange} isInWatchlist={isInWatchlist} />

      <div style={{ padding: '10px 20px 0' }}>
        <p style={{ color: '#7d8894', fontSize: '13px', marginBottom: '24px' }}>Movies, TV shows and anime — all in one place.</p>

        <MovieRow title="🔥 Trending Movies" items={trendingMovies} loading={loading} onSelect={onSelect} onViewAll={() => onGoMovies && onGoMovies('trending')} watchlist={watchlist} onWatchlistChange={onWatchlistChange} isInWatchlist={isInWatchlist} type="movie" />
        <MovieRow title="🎬 Popular Movies" items={popularMovies} loading={loading} onSelect={onSelect} onViewAll={() => onGoMovies && onGoMovies('popular')} watchlist={watchlist} onWatchlistChange={onWatchlistChange} isInWatchlist={isInWatchlist} type="movie" />
        <MovieRow title="⭐ Top Rated Movies" items={topRatedMovies} loading={loading} onSelect={onSelect} onViewAll={() => onGoMovies && onGoMovies('top_rated')} watchlist={watchlist} onWatchlistChange={onWatchlistChange} isInWatchlist={isInWatchlist} type="movie" />

        <div style={{ margin: '36px 0 18px', padding: '14px 0 0', borderTop: '1px solid rgba(255,255,255,.08)' }}>
          <h2 style={{ margin: 0, fontSize: '22px', color: '#fff' }}>📺 TV Shows</h2>
          <p style={{ margin: '4px 0 0', color: '#6f7883', fontSize: '12px' }}>Binge-worthy series and shows</p>
        </div>
        <MovieRow title="🔥 Trending TV Shows" items={trendingTV} loading={loading} onSelect={onSelect} onViewAll={() => onGoTV && onGoTV()} watchlist={watchlist} onWatchlistChange={onWatchlistChange} isInWatchlist={isInWatchlist} type="tv" />
        <MovieRow title="🎬 Popular TV Shows" items={popularTV} loading={loading} onSelect={onSelect} onViewAll={() => onGoTV && onGoTV()} watchlist={watchlist} onWatchlistChange={onWatchlistChange} isInWatchlist={isInWatchlist} type="tv" />
        <MovieRow title="⭐ Top Rated TV" items={topRatedTV} loading={loading} onSelect={onSelect} onViewAll={() => onGoTV && onGoTV()} watchlist={watchlist} onWatchlistChange={onWatchlistChange} isInWatchlist={isInWatchlist} type="tv" />

        <div style={{ margin: '36px 0 18px', padding: '14px 0 0', borderTop: '1px solid rgba(255,255,255,.08)' }}>
          <h2 style={{ margin: 0, fontSize: '22px', color: '#fff' }}>🍥 Anime</h2>
          <p style={{ margin: '4px 0 0', color: '#6f7883', fontSize: '12px' }}>Japanese animation and beyond</p>
        </div>
        <MovieRow title="🔥 Trending Anime" items={trendingAnime} loading={loading} onSelect={onSelect} onViewAll={() => onGoAnime && onGoAnime('trending')} watchlist={watchlist} onWatchlistChange={onWatchlistChange} isInWatchlist={isInWatchlist} type="anime" />
        <MovieRow title="🎬 Popular Anime" items={popularAnime} loading={loading} onSelect={onSelect} onViewAll={() => onGoAnime && onGoAnime('popular')} watchlist={watchlist} onWatchlistChange={onWatchlistChange} isInWatchlist={isInWatchlist} type="anime" />
        <MovieRow title="⭐ Top Rated Anime" items={topRatedAnime} loading={loading} onSelect={onSelect} onViewAll={() => onGoAnime && onGoAnime('top_rated')} watchlist={watchlist} onWatchlistChange={onWatchlistChange} isInWatchlist={isInWatchlist} type="anime" />
        <MovieRow title="📡 Airing Now Anime" items={airingAnime} loading={loading} onSelect={onSelect} onViewAll={() => onGoAnime && onGoAnime('airing')} watchlist={watchlist} onWatchlistChange={onWatchlistChange} isInWatchlist={isInWatchlist} type="anime" />
        <MovieRow title="🚀 Upcoming Anime" items={upcomingAnime} loading={loading} onSelect={onSelect} onViewAll={() => onGoAnime && onGoAnime('upcoming')} watchlist={watchlist} onWatchlistChange={onWatchlistChange} isInWatchlist={isInWatchlist} type="anime" />
      </div>
    </div>
  )
}
