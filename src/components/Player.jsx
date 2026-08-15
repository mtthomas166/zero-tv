import { useState, useMemo, useEffect } from 'react';
import styles from './Player.module.css';

// كل السيرفرات المجانية اللي مش محتاجة API Key - زي VidSrc.to
const SERVERS = [
  {
    id: 'vidsrc_to',
    name: 'Server 1 - Fast ⚡',
    label: 'بدون اعلانات كتير',
    getUrl: (id, type, s, e) => type === 'movie' 
      ? `https://vidsrc.to/embed/movie/${id}`
      : `https://vidsrc.to/embed/tv/${id}/${s}/${e}`
  },
  {
    id: 'vidsrc_me',
    name: 'Server 2 - HD',
    label: 'جودة عالية',
    getUrl: (id, type, s, e) => type === 'movie'
      ? `https://vidsrc.me/embed/movie?tmdb=${id}`
      : `https://vidsrc.me/embed/tv?tmdb=${id}&season=${s}&episode=${e}`
  },
  {
    id: 'superembed',
    name: 'Server 3 - No Ads',
    label: 'أنضف واحد',
    getUrl: (id, type, s, e) => type === 'movie'
      ? `https://multiembed.mov/?video_id=${id}&tmdb=1`
      : `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`
  },
  {
    id: 'vidapi',
    name: 'Server 4 - Backup',
    label: 'احتياطي',
    getUrl: (id, type, s, e) => type === 'movie'
      ? `https://vidapi.xyz/embed/movie/${id}`
      : `https://vidapi.xyz/embed/tv/${id}&s=${s}&e=${e}`
  },
  {
    id: '2embed',
    name: 'Server 5 - 2Embed',
    label: 'قديم وثابت',
    getUrl: (id, type, s, e) => type === 'movie'
      ? `https://www.2embed.cc/embed/${id}`
      : `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}`
  },
  {
    id: 'vidsrc_su',
    name: 'Server 6 - SU',
    label: 'سريع',
    getUrl: (id, type, s, e) => type === 'movie'
      ? `https://vidsrc.su/embed/movie/${id}`
      : `https://vidsrc.su/embed/tv/${id}/${s}/${e}`
  },
  {
    id: 'autoembed',
    name: 'Server 7 - Auto',
    label: 'اوتوماتيك',
    getUrl: (id, type, s, e) => type === 'movie'
      ? `https://autoembed.co/movie/tmdb/${id}`
      : `https://autoembed.co/tv/tmdb/${id}-${s}-${e}`
  },
  {
    id: 'smashy',
    name: 'Server 8 - Smashy',
    label: 'جديد',
    getUrl: (id, type, s, e) => type === 'movie'
      ? `https://player.smashy.stream/movie/${id}`
      : `https://player.smashy.stream/tv/${id}?s=${s}&e=${e}`
  },
];

export default function Player({ tmdbId, type = 'movie', season = 1, episode = 1, title }) {
  const [activeServer, setActiveServer] = useState(SERVERS[0].id);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ سكريبت ExoClick - بيشغل البانر تحت المشغل
  useEffect(() => {
    // نتأكد ان السكريبت متحملش قبل كده
    if (document.querySelector('script[src="https://a.magsrv.com/ad-provider.js"]')) {
      if (window.AdProvider) {
        window.AdProvider.push({ "serve": {} });
      }
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://a.magsrv.com/ad-provider.js';
    script.async = true;
    script.type = 'application/javascript';
    document.body.appendChild(script);

    script.onload = () => {
      (window.AdProvider = window.AdProvider || []).push({ "serve": {} });
    };
  }, [activeServer]); // هيعيد تحميل الاعلان مع كل سيرفر عشان يعد Views

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
      {/* شريط اختيار السيرفر */}
      <div className={styles.serverBar}>
        <div className={styles.serverLabel}>
          <span>🎬 اختار السيرفر لو واحد علق:</span>
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

      {/* المشغل */}
      <div className={styles.videoContainer}>
        {isLoading && (
          <div className={styles.loader}>
            <div className={styles.spinner}></div>
            <p>جاري تحميل {activeServerData.name}...</p>
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

      {/* ✅ مكان اعلانك - ExoClick */}
      <div className={styles.adSlot} style={{ minHeight: '280px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#111', padding: '15px', marginTop: '15px', borderRadius: '8px' }}>
        <p style={{fontSize:'11px', color:'#666', marginBottom:'8px', letterSpacing:'1px'}}>ADVERTISEMENT</p>
        <ins className="eas6a9788e2" data-zoneid="6003080"></ins>
        
        <p style={{fontSize:'12px', color:'#888', textAlign:'center', marginTop:'15px'}}>
          لو الفيديو مش شغال دوس على سيرفر تاني فوق 👆
        </p>
      </div>
    </div>
  );
}
