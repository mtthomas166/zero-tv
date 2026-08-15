import React, { useEffect, useState } from 'react'
import MediaGrid from '../components/MediaGrid.jsx'
import styles from './Watchlist.module.css'

const WATCHLIST_KEY = 'cs_watchlist'

function loadWatchlist() {
  try {
    const value = localStorage.getItem(WATCHLIST_KEY)
    return value ? JSON.parse(value) : []
  } catch {
    return []
  }
}

export default function Watchlist() {
  const [items, setItems] = useState(loadWatchlist)

  useEffect(() => {
    function refresh() {
      setItems(loadWatchlist())
    }

    window.addEventListener('watchlist-updated', refresh)
    window.addEventListener('storage', refresh)

    return () => {
      window.removeEventListener('watchlist-updated', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  function removeItem(item) {
    const updated = items.filter(
      saved =>
        !(
          saved.id === item.id &&
          saved.mediaType === item.mediaType
        )
    )

    localStorage.setItem(
      WATCHLIST_KEY,
      JSON.stringify(updated)
    )

    setItems(updated)

    window.dispatchEvent(
      new Event('watchlist-updated')
    )
  }

  const movies = items.filter(
    item => item.mediaType === 'movie'
  )

  const shows = items.filter(
    item => item.mediaType === 'tv'
  )

  return (
    <div className={styles.page}>

      <div className={styles.header}>

        <div>
          <p className={styles.kicker}>
            MY LIBRARY
          </p>

          <h1>
            Watchlist
          </h1>

          <p className={styles.subtitle}>
            Movies and TV shows you saved to watch later.
          </p>
        </div>

        <div className={styles.count}>
          {items.length} saved
        </div>

      </div>

      {items.length === 0 ? (

        <div className={styles.empty}>

          <div className={styles.emptyIcon}>
            ♡
          </div>

          <h2>
            Your Watchlist is empty
          </h2>

          <p>
            Add movies or TV shows using the bookmark button.
          </p>

        </div>

      ) : (

        <>

          {movies.length > 0 && (
            <section className={styles.section}>

              <div className={styles.sectionHeader}>
                <h2>
                  🎬 Movies
                </h2>

                <span>
                  {movies.length}
                </span>
              </div>

              <div className={styles.grid}>
                {movies.map(item => (
                  <div
                    key={`movie-${item.id}`}
                    className={styles.item}
                  >

                    <MediaGrid
                      items={[item]}
                      type="movie"
                      selectedId={null}
                    />

                    <button
                      type="button"
                      className={styles.remove}
                      onClick={() =>
                        removeItem(item)
                      }
                    >
                      ✓ Saved
                    </button>

                  </div>
                ))}
              </div>

            </section>
          )}

          {shows.length > 0 && (
            <section className={styles.section}>

              <div className={styles.sectionHeader}>
                <h2>
                  📺 TV Shows
                </h2>

                <span>
                  {shows.length}
                </span>
              </div>

              <div className={styles.grid}>
                {shows.map(item => (
                  <div
                    key={`tv-${item.id}`}
                    className={styles.item}
                  >

                    <MediaGrid
                      items={[item]}
                      type="tv"
                      selectedId={null}
                    />

                    <button
                      type="button"
                      className={styles.remove}
                      onClick={() =>
                        removeItem(item)
                      }
                    >
                      ✓ Saved
                    </button>

                  </div>
                ))}
              </div>

            </section>
          )}

        </>

      )}

    </div>
  )
}