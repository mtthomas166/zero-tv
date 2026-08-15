import React from 'react'

import {
  posterUrl,
  formatRating,
  getYear,
} from '../lib/api.js'

import styles from './MediaCard.module.css'


export default function MediaCard({
  item,
  type = 'movie',
  onClick,
  selected,
  onWatchlistChange,
  isInWatchlist,
}) {

  // =========================================================
  // TYPE - FIXED to respect isAnime flag
  // =========================================================

  const actualType =
    item?.type === 'anime' ||
    item?.type === 'tv' ||
    item?.type === 'movie'
      ? item.type
      : type


  const isAnime =
    actualType === 'anime' ||
    item?.isAnime === true

  const isTV =
    actualType === 'tv' ||
    isAnime


  // =========================================================
  // DATA
  // =========================================================

  const title =
    isTV
      ? item?.name || item?.title
      : item?.title || item?.name


  const date =
    isTV
      ? item?.first_air_date || item?.release_date
      : item?.release_date || item?.first_air_date


  const year =
    getYear(date)


  const rating =
    formatRating(
      item?.vote_average
    )


  const poster =
    posterUrl(
      item?.poster_path
    )


  // =========================================================
  // WATCHLIST TYPE
  // =========================================================

  const watchlistType =
    isAnime
      ? 'anime'
      : actualType === 'anime' ? 'tv' : actualType


  const saved =
    typeof isInWatchlist === 'function'
      ? Boolean(
          isInWatchlist(
            {
              ...item,
              type:
                item?.type ||
                actualType,
              isAnime,
            },
            watchlistType
          )
        )
      : false


  // =========================================================
  // CARD CLICK - FIXED preserve isAnime
  // =========================================================

  function handleClick() {

    if (
      typeof onClick !== 'function'
    ) {
      return
    }


    onClick({
      ...item,

      id:
        item?.id,

      type:
        item?.type ||
        actualType,

      isAnime,
    })

  }


  // =========================================================
  // KEYBOARD
  // =========================================================

  function handleKeyDown(e) {

    if (
      e.key === 'Enter' ||
      e.key === ' '
    ) {

      e.preventDefault()

      handleClick()

    }

  }


  // =========================================================
  // WATCHLIST CLICK
  // =========================================================

  function handleWatchlist(e) {

    e.preventDefault()
    e.stopPropagation()


    if (
      typeof onWatchlistChange !==
      'function'
    ) {
      return
    }


    onWatchlistChange(
      {
        ...item,

        type:
          item?.type ||
          actualType,

        isAnime,
      },
      watchlistType
    )

  }


  // =========================================================
  // TYPE LABEL
  // =========================================================

  let typeLabel =
    'MOVIE'


  if (isAnime) {

    typeLabel =
      'ANIME'

  } else if (
    actualType === 'tv'
  ) {

    typeLabel =
      'TV'

  }


  // =========================================================
  // RENDER
  // =========================================================

  return (

    <article
      className={`
        ${styles.card}
        ${selected ? styles.selected : ''}
      `}
      onClick={
        handleClick
      }
      onKeyDown={
        handleKeyDown
      }
      role="button"
      tabIndex={0}
      aria-label={`View details for ${
        title || 'media'
      }`}
    >

      <div
        className={
          styles.poster
        }
      >

        {poster ? (

          <img
            src={poster}
            alt={
              title ||
              'Poster'
            }
            loading="lazy"
          />

        ) : (

          <div
            className={
              styles.noPoster
            }
          >
            {title?.slice(
              0,
              2
            ) || 'NA'}
          </div>

        )}


        {rating && (

          <div
            className={
              styles.ratingBadge
            }
          >
            ★ {rating}
          </div>

        )}

        <div
          className={
            styles.typeBadge
          }
        >
          {typeLabel}
        </div>

        {typeof onWatchlistChange ===
          'function' && (

          <button
            type="button"
            onClick={
              handleWatchlist
            }
            aria-label={
              saved
                ? 'Remove from Watchlist'
                : 'Add to Watchlist'
            }
            title={
              saved
                ? 'Remove from Watchlist'
                : 'Add to Watchlist'
            }
            style={{
              position:
                'absolute',

              top:
                '10px',

              right:
                '10px',

              zIndex:
                20,

              width:
                '34px',

              height:
                '34px',

              borderRadius:
                '50%',

              border:
                '1px solid rgba(255,255,255,.16)',

              background:
                saved
                  ? '#e50914'
                  : 'rgba(8,10,14,.88)',

              color:
                '#fff',

              cursor:
                'pointer',

              display:
                'flex',

              alignItems:
                'center',

              justifyContent:
                'center',

              fontSize:
                '19px',

              lineHeight:
                1,

              boxShadow:
                '0 4px 14px rgba(0,0,0,.35)',
            }}
          >
            {saved
              ? '♥'
              : '♡'}
          </button>

        )}

        {selected && (

          <div
            className={
              styles.selectedBadge
            }
          >
            ✓
          </div>

        )}

      </div>

      <div
        className={
          styles.info
        }
      >

        <div
          className={
            styles.title
          }
          title={title}
        >
          {title ||
            'Unknown'}
        </div>


        {year && (

          <div
            className={
              styles.year
            }
          >
            {year}
          </div>

        )}

      </div>

    </article>

  )

}
