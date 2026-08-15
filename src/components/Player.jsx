import { useState, useMemo } from 'react';
import styles from './Player.module.css';

const SERVERS = [
  {
    id: 'autoembed',
    name: 'Server 1 - Auto ⭐ Main',
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

export default function Player({ tmdbId, type = 'movie', season = 1, episode = 1, title }) {
  const [activeServer, setActiveServer] = useState('autoembed');
  const [isLoading, setIsLoading] = useState(true);

  const activeServerData = useMemo(() => 
    SERVERS.find(s => s.id === activeServer) || SERVERS[0], 
    [activeServer]
  );

  const embedUrl = useMemo(() => {
    if (!tmdbId) return '';
    return activeServerData.getUrl(tmdbId, type, season, episode);
  }, [tmdbId, type, season, episode, activeServerData]);

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
              className={`${styles.serverBtn} ${activeServer === server.id ? styles.active : ''}`}
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
    </div>
  );
}
