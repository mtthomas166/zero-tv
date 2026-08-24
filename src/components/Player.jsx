import { useState, useMemo, useEffect } from 'react';
import styles from './Player.module.css';
import { api, buildUniqueContent } from '../lib/api.js';

const SERVERS = [
  {
    id: 'autoembed',
    name: 'Server 1 - Auto Main',
    label: 'Best - No Ads',
    getUrl: (id, type, s, e) => type === 'movie'
     ? `https://autoembed.co/movie/tmdb/${id}`
      : `https://autoembed.co/tv/tmdb/${id}-${s}-${e}`
  },
  {
    id: 'superembed',
    name: 'Server 2 - No Ads',
    label: 'Clean',
    getUrl: (id, type, s, e) => type === 'movie'
     ? `https://multiembed.mov/?video_id=${id}&tmdb=1`
      : `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`
  },
  {
    id: 'smashy',
    name: 'Server 3 - Smashy',
    label: 'New & Clean',
    getUrl: (id, type, s, e) => type === 'movie'
     ? `https://player.smashy.stream/movie/${id}`
      : `https://player.smashy.stream/tv/${id}?s=${s}&e=${e}`
  },
  {
    id: 'vidsrc_su',
    name: 'Server 4 - SU',
    label: 'Fast',
    getUrl: (id, type, s, e) => type === 'movie'
     ? `https://vidsrc.su/embed/movie/${id}`
      : `https://vidsrc.su/embed/tv/${id}/${s}/${e}`
  },
  {
    id: 'vidapi',
    name: 'Server 5 - Backup',
    label: 'Backup',
    getUrl: (id, type, s, e) => type === 'movie'
     ? `https://vidapi.xyz/embed/movie/${id}`
      : `https://vidapi.xyz/embed/tv/${id}&s=${s}&e=${e}`
  },
  {
    id: '2embed',
    name: 'Server 6 - 2Embed',
    label: 'Stable',
    getUrl: (id, type, s, e) => type === 'movie'
     ? `https://www.2embed.cc/embed/${id}`
      : `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}`
  },
  {
    id: 'vidsrc_me',
    name: 'Server 7 - HD',
    label: 'High Quality',
    getUrl: (id, type, s, e) => type === 'movie'
     ? `https://vidsrc.me/embed/movie?tmdb=${id}`
      : `https://vidsrc.me/embed/tv?tmdb=${id}&season=${s}&episode=${e}`
  },
  {
    id: 'vidsrc_to',
    name: 'Server 8 - Fast',
    label: 'Has Ads',
    getUrl: (id, type, s, e) => type === 'movie'
     ? `https://vidsrc.to/embed/movie/${id}`
      : `https://vidsrc.to/embed/tv/${id}/${s}/${e}`
  },
];

export default function Player({ tmdbId, type = 'movie', season = 1, episode = 1, title, movieData }) {
  const [activeServer, setActiveServer] = useState('autoembed');
  const [isLoading, setIsLoading] = useState(true);
  const [details, setDetails] = useState(movieData || null);
  const [unique, setUnique] = useState(movieData? buildUniqueContent(movieData) : null);

  useEffect(() => {
    if (movieData) {
      setDetails(movieData);
      setUnique(buildUniqueContent(movieData));
    }
  }, [movieData]);

  useEffect(() => {
    if (!tmdbId || movieData) return;
    async function fetchDetails() {
      try {
        const data = type === 'movie'
         ? await api.movieDetails(tmdbId)
          : await api.tvDetails(tmdbId);
        setDetails(data);
        setUnique(buildUniqueContent(data));
      } catch (e) {}
    }
    fetchDetails();
  }, [tmdbId, type, movieData]);

  const activeServerData = useMemo(() =>
    SERVERS.find(s => s.id === activeServer) || SERVERS[0],
    [activeServer]
  );

  const embedUrl = useMemo(() => {
    if (!tmdbId) return '';
    return activeServerData.getUrl(tmdbId, type, season, episode);
  }, [tmdbId, type, season, episode, activeServerData]);

  const jsonLd = useMemo(() => {
    if (!details ||!unique) return null;
    return {
      "@context": "https://schema.org",
      "@type": type === 'movie'? "Movie" : "TVSeries",
      "name": details.title || details.name,
      "description": unique.longDesc,
      "image": details.poster_path? `https://image.tmdb.org/t/p/w500${details.poster_path}` : undefined,
      "datePublished": details.release_date || details.first_air_date,
      "aggregateRating": details.vote_average? {
        "@type": "AggregateRating",
        "ratingValue": details.vote_average,
        "bestRating": 10,
        "ratingCount": details.vote_count
      } : undefined
    };
  }, [details, unique, type]);

  return (
    <div className={styles.playerWrapper}>
      <div className={styles.serverBar}>
        <div className={styles.serverLabel}>
          <span>Choose server if one is not working:</span>
          {title && <span className={styles.movieTitle}> - {title}</span>}
        </div>
        <div className={styles.serverList}>
          {SERVERS.map((server) => (
            <button
              key={server.id}
              className={`${styles.serverBtn} ${activeServer === server.id? styles.active : ''}`}
              onClick={() => {
                setActiveServer(server.id);
                setIsLoading(true);
              }}
              title={server.label}
            >
              {server.name}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.videoContainer}>
        {isLoading && (
          <div className={styles.loader}>
            <div className={styles.spinner}></div>
            <p>Loading {activeServerData.name}...</p>
          </div>
        )}
        <iframe
          key={`${activeServer}-${tmdbId}-${season}-${episode}`}
          src={embedUrl}
          className={styles.iframe}
          allowFullScreen
          frameBorder="0"
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          onLoad={() => setIsLoading(false)}
        ></iframe>
      </div>

      <div className={styles.adSlot}>
        <p style={{fontSize:'12px', color:'#888', textAlign:'center', marginTop:'10px'}}>
          If video is not working, try another server above
        </p>
      </div>

      {unique && details && (
        <div style={{marginTop:'30px', textAlign:'left', lineHeight:'1.7', color:'#ddd'}}>
          {jsonLd && (
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
          )}

          <h2 style={{color:'#fff'}}>About {details.title || details.name} ({details.release_date?.slice(0,4) || details.first_air_date?.slice(0,4)})</h2>
          <p>{unique.longDesc}</p>

          <h3 style={{color:'#fff', marginTop:'20px'}}>Story</h3>
          <p>{details.overview}</p>

          <h3 style={{color:'#fff', marginTop:'20px'}}>Details</h3>
          <p>{unique.whyWatch}</p>

          <h3 style={{color:'#fff', marginTop:'20px'}}>FAQ</h3>
          {unique.faqs.map((f, i) => (
            <div key={i} style={{marginBottom:'15px'}}>
              <strong>{f.q}</strong>
              <p style={{margin:'5px 0'}}>{f.a}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
