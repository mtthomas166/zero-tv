import { useState, useEffect, useRef, useMemo } from 'react';
import styles from './Player.module.css';

const VAST_TAG = 'https://s.magsrv.com/v1/vast.php?idzone=6003446';

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
  const [phase, setPhase] = useState('ad');
  const [canSkip, setCanSkip] = useState(false);
  const [adFailed, setAdFailed] = useState(false);
  const videoRef = useRef(null);

  const activeServerData = useMemo(() => 
    SERVERS.find(s => s.id === activeServer) || SERVERS[0], 
    [activeServer]
  );

  const embedUrl = useMemo(() => {
    if (!tmdbId) return '';
    return activeServerData.getUrl(tmdbId, type, season, episode);
  }, [tmdbId, type, season, episode, activeServerData]);

  // Load Fluid Player
  useEffect(() => {
    if (phase !== 'ad') return;

    let timeout1, timeout2, timeout3;

    const init = async () => {
      // Add CSS
      if (!document.querySelector('link[href*="fluidplayer"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdn.fluidplayer.com/v3/current/fluidplayer.min.css';
        document.head.appendChild(link);
      }

      // Load script
      if (!window.fluidPlayer) {
        await new Promise((res, rej) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.fluidplayer.com/v3/current/fluidplayer.min.js';
          script.onload = res;
          script.onerror = rej;
          document.body.appendChild(script);
        }).catch(() => {
          setAdFailed(true);
          setPhase('content');
        });
      }

      // Small delay to ensure DOM ready
      timeout1 = setTimeout(() => {
        try {
          const video = document.getElementById('vast-ad-player');
          if (!video) {
            setPhase('content');
            return;
          }

          const fp = window.fluidPlayer('vast-ad-player', {
            layoutControls: {
              fillToContainer: true,
              autoPlay: true,
              mute: false,
              allowTheatre: false,
              playButtonShowing: true,
              controlBar: {
                autoHide: false,
              }
            },
            vastOptions: {
              adList: [
                {
                  roll: 'preRoll',
                  vastTag: VAST_TAG,
                  adText: 'Ad',
                }
              ],
              adCTAText: false,
              adCTATextPosition: 'bottom right',
              vastAdvanced: {
                vastLoadedCallback: () => console.log('VAST OK'),
                noVastVideoCallback: () => {
                  console.log('No VAST - skip');
                  setPhase('content');
                },
                vastVideoSkippedCallback: () => setPhase('content'),
                vastVideoEndedCallback: () => setPhase('content'),
              }
            }
          });

          // Can skip after 3 sec
          timeout2 = setTimeout(() => setCanSkip(true), 3000);
          
          // Force skip if stuck after 10 sec (Brave blocks etc)
          timeout3 = setTimeout(() => {
            console.log('Ad timeout fallback');
            setPhase('content');
          }, 10000);

        } catch (e) {
          console.error(e);
          setPhase('content');
        }
      }, 500);
    };

    init();

    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
    };
  }, [phase]);

  if (phase === 'ad') {
    return (
      <div className={styles.playerWrapper}>
        <div className={styles.videoContainer} style={{ background: '#000', minHeight: '480px', position: 'relative' }}>
          <video
            id="vast-ad-player"
            style={{ width: '100%', height: '100%', minHeight: '480px' }}
            playsInline
            muted={false}
          >
            {/* Dummy source - required for Fluid Player to init, VAST will play before this */}
            <source src="https://cdn.fluidplayer.com/videos/valiant-720p.mp4" type="video/mp4" />
          </video>

          {/* Skip Button */}
          <div style={{
            position: 'absolute',
            bottom: '30px',
            right: '20px',
            zIndex: 9999,
            display: 'flex',
            gap: '10px'
          }}>
            <button
              onClick={() => setPhase('content')}
              style={{
                background: canSkip ? '#fff' : 'rgba(255,255,255,0.5)',
                color: '#000',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: canSkip ? 'pointer' : 'not-allowed',
                fontWeight: 'bold',
                fontSize: '14px',
                pointerEvents: canSkip ? 'auto' : 'none',
                transition: 'all 0.3s'
              }}
            >
              {canSkip ? 'Skip Ad →' : 'Skip in 3s...'}
            </button>
          </div>

          <div style={{
            position: 'absolute',
            top: '15px',
            left: '15px',
            background: 'rgba(0,0,0,0.7)',
            color: '#fff',
            padding: '6px 12px',
            borderRadius: '4px',
            fontSize: '13px',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ width: '8px', height: '8px', background: '#e50914', borderRadius: '50%', display: 'inline-block' }}></span>
            Advertisement - Support Zero TV
          </div>
        </div>

        <div style={{ textAlign: 'center', padding: '12px', background: '#111', color: '#aaa', fontSize: '12px', borderTop: '1px solid #222' }}>
          {adFailed ? 'Loading movie...' : 'Movie starts after ad - Thanks for supporting us ❤️'}
        </div>
      </div>
    );
  }

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
          If video is not working, try another server above • Support Zero TV by watching ads ❤️
        </p>
      </div>
    </div>
  );
}
