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
  const [phase, setPhase] = useState('ad'); // 'ad' | 'content'
  const [canSkip, setCanSkip] = useState(false);
  const [adError, setAdError] = useState(false);
  const videoRef = useRef(null);
  const fluidRef = useRef(null);

  const activeServerData = useMemo(() => 
    SERVERS.find(s => s.id === activeServer) || SERVERS[0], 
    [activeServer]
  );

  const embedUrl = useMemo(() => {
    if (!tmdbId) return '';
    return activeServerData.getUrl(tmdbId, type, season, episode);
  }, [tmdbId, type, season, episode, activeServerData]);

  // Load Fluid Player for VAST
  useEffect(() => {
    if (phase !== 'ad') return;

    const loadFluid = () => {
      return new Promise((resolve, reject) => {
        if (window.fluidPlayer) {
          resolve();
          return;
        }
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdn.fluidplayer.com/v3/current/fluidplayer.min.css';
        document.head.appendChild(link);

        const script = document.createElement('script');
        script.src = 'https://cdn.fluidplayer.com/v3/current/fluidplayer.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
      });
    };

    loadFluid().then(() => {
      if (!videoRef.current) return;
      
      try {
        const player = window.fluidPlayer('vast-ad-player', {
          layoutControls: {
            fillToContainer: true,
            autoPlay: true,
            mute: false,
            allowTheatre: false,
            playButtonShowing: true,
            playPauseAnimation: true,
          },
          vastOptions: {
            adList: [
              {
                roll: 'preRoll',
                vastTag: VAST_TAG,
                adText: 'Advertisement - Zero TV',
              }
            ],
            adCTAText: 'Visit Site',
            adCTATextPosition: 'bottom right',
            vastAdvanced: {
              vastLoadedCallback: () => console.log('VAST loaded'),
              noVastVideoCallback: () => {
                console.log('No VAST, skipping to content');
                setPhase('content');
              },
              vastVideoSkippedCallback: () => {
                console.log('Ad skipped');
                setPhase('content');
              },
              vastVideoEndedCallback: () => {
                console.log('Ad ended');
                setPhase('content');
              },
            }
          }
        });
        fluidRef.current = player;

        // Enable skip after 5 seconds
        setTimeout(() => setCanSkip(true), 5000);

        // Fallback: if ad doesn't load in 15s, go to content
        setTimeout(() => {
          if (phase === 'ad') {
            console.log('Ad timeout, going to content');
            setPhase('content');
          }
        }, 15000);

      } catch (e) {
        console.error('Fluid Player error', e);
        setAdError(true);
        setPhase('content');
      }
    }).catch(() => {
      setAdError(true);
      setPhase('content');
    });

    return () => {
      try {
        if (fluidRef.current) {
          fluidRef.current.destroy();
        }
      } catch {}
    };
  }, [phase]);

  const handleSkipAd = () => {
    setPhase('content');
  };

  // Ad Phase
  if (phase === 'ad') {
    return (
      <div className={styles.playerWrapper}>
        <div className={styles.videoContainer} style={{ position: 'relative', background: '#000', minHeight: '400px' }}>
          <video 
            ref={videoRef}
            id="vast-ad-player"
            style={{ width: '100%', height: '100%', minHeight: '400px' }}
            playsInline
          >
            {/* Fluid Player will load VAST ad here */}
          </video>
          
          <div style={{
            position: 'absolute',
            bottom: '20px',
            right: '20px',
            zIndex: 10,
            display: 'flex',
            gap: '10px',
            alignItems: 'center'
          }}>
            {canSkip && (
              <button
                onClick={handleSkipAd}
                style={{
                  background: 'rgba(255,255,255,0.9)',
                  color: '#000',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}
              >
                Skip Ad →
              </button>
            )}
          </div>

          <div style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            background: 'rgba(229, 9, 20, 0.9)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            zIndex: 10
          }}>
            Ad - Supports Zero TV
          </div>
        </div>

        <div style={{ textAlign: 'center', padding: '10px', background: '#111', color: '#888', fontSize: '12px' }}>
          Ad will end soon, movie starts after ad... 
          {canSkip && <span style={{ color: '#fff', marginLeft: '10px' }}>You can skip now</span>}
        </div>
      </div>
    );
  }

  // Content Phase (original player)
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
          If video is not working, try another server above • Ad revenue supports Zero TV
        </p>
      </div>
    </div>
  );
}
