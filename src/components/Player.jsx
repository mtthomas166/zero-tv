import { useState, useEffect } from 'react';
import styles from './Player.module.css';

// فقط السيرفرات النضيفة اللي مفهاش اعلانات Melbet - شلت VidSrc.to خالص
const CLEAN_SERVERS = [
  {
    id: 'multiembed',
    name: '✨ Server 1 - No Ads (الأنضف)',
    url: (id, type, s, e) => type === 'movie' 
      ? `https://multiembed.mov/?video_id=${id}&tmdb=1`
      : `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`
  },
  {
    id: 'smashy',
    name: '✨ Server 2 - Smashy (بدون اعلانات)',
    url: (id, type, s, e) => type === 'movie'
      ? `https://player.smashy.stream/movie/${id}`
      : `https://player.smashy.stream/tv/${id}?s=${s}&e=${e}`
  },
  {
    id: 'autoembed',
    name: 'Server 3 - AutoEmbed',
    url: (id, type, s, e) => type === 'movie'
      ? `https://autoembed.co/movie/tmdb/${id}`
      : `https://autoembed.co/tv/tmdb/${id}-${s}-${e}`
  }
];

export default function Player({ tmdbId, type = 'movie', season = 1, episode = 1 }) {
  const [server, setServer] = useState(CLEAN_SERVERS[0].id);
  const [loading, setLoading] = useState(true);

  // امنع اي اعلان يفتح صفحة جديدة
  useEffect(() => {
    const originalOpen = window.open;
    window.open = () => null;
    return () => { window.open = originalOpen; };
  }, [server]);

  const current = CLEAN_SERVERS.find(x => x.id === server);
  const src = current ? current.url(tmdbId, type, season, episode) : '';

  return (
    <div style={{width:'100%', background:'#0f0f0f', borderRadius:'12px', overflow:'hidden'}}>
      <div style={{background:'#1a1a1a', padding:'12px', display:'flex', gap:'8px', flexWrap:'wrap', alignItems:'center'}}>
        <span style={{color:'#fff', fontSize:'13px'}}>جرب سيرفر تاني لو فيه اعلانات:</span>
        {CLEAN_SERVERS.map(s => (
          <button
            key={s.id}
            onClick={() => { setServer(s.id); setLoading(true); }}
            style={{
              background: server === s.id ? '#e50914' : '#2a2a2a',
              color: server === s.id ? '#fff' : '#ccc',
              border:'1px solid #444',
              padding:'6px 12px',
              borderRadius:'20px',
              fontSize:'11px',
              cursor:'pointer'
            }}
          >
            {s.name}
          </button>
        ))}
      </div>

      <div style={{position:'relative', width:'100%', paddingTop:'56.25%', background:'#000'}}>
        {loading && (
          <div style={{position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', color:'#fff', textAlign:'center', zIndex:2}}>
            <div style={{width:'30px', height:'30px', border:'3px solid #333', borderTop:'3px solid #e50914', borderRadius:'50%', animation:'spin 1s linear infinite', margin:'0 auto 10px'}}></div>
            <p style={{fontSize:'12px'}}>جاري التحميل بدون اعلانات...</p>
          </div>
        )}
        <iframe
          key={`${server}-${tmdbId}-${season}-${episode}`}
          src={src}
          style={{position:'absolute', top:0, left:0, width:'100%', height:'100%', border:'none'}}
          allowFullScreen
          // ده السحر - بيمنع الـ Popups بتاعة Melbet و Jean_sexy
          sandbox="allow-forms allow-pointer-lock allow-same-origin allow-scripts allow-presentation"
          referrerPolicy="no-referrer"
          allow="autoplay; encrypted-media; fullscreen"
          onLoad={() => setLoading(false)}
        />
      </div>
      <style>{`@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

{/* إعلان ExoClick تحت المشغل */}
<div style={{ margin: '15px auto', textAlign: 'center', maxWidth: '300px' }}>
  <ins className="eas6a9788e2" data-zoneid="6003080"></ins>
</div>
