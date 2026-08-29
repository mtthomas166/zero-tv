import fs from 'fs';
const SITE_URL = 'https://zero-tv.pages.dev';
const TMDB_KEY = process.env.TMDB_KEY || 'af32459863d504e3a5d04f317e7f12e1';
const TMDB_IMG = 'https://image.tmdb.org/t/p/w500';

async function fetchTMDB(p){ 
  const u=`https://api.themoviedb.org/3${p}${p.includes('?')?'&':'?'}api_key=${TMDB_KEY}`; 
  const r=await fetch(u); 
  if(!r.ok) throw new Error(r.status); 
  return r.json(); 
}
function slugify(t){ return t ? t.toString().toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').substring(0,60) : ''; }
function escapeXml(s){ return s ? s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;') : ''; }
const sleep = ms => new Promise(r=>setTimeout(r,ms));

async function main(){
  const [moviesData, tvData] = await Promise.all([
    fetchTMDB('/trending/movie/week?page=1'),
    fetchTMDB('/trending/tv/week?page=1')
  ]);
  
  const items = [];
  
  for(const m of (moviesData.results || []).slice(0,10)){
    items.push({
      title: m.title,
      url: `${SITE_URL}/movie/${m.id}-${slugify(m.title)}`,
      overview: m.overview,
      poster: m.poster_path ? `${TMDB_IMG}${m.poster_path}` : '',
      date: m.release_date,
      label: `Movie`
    });
  }
  
  for(const tv of (tvData.results || []).slice(0,6)){
    try{
      const details = await fetchTMDB(`/tv/${tv.id}`);
      const isAnime = details.genres?.some(g=>g.name==='Animation') || details.origin_country?.includes('JP');
      const typeLabel = isAnime ? 'Anime' : 'TV Show';
      const slug = slugify(details.name || tv.name);
      
      items.push({
        title: details.name || tv.name,
        url: `${SITE_URL}/${isAnime ? 'anime' : 'tv'}/${tv.id}-${slug}`,
        overview: details.overview || tv.overview,
        poster: tv.poster_path ? `${TMDB_IMG}${tv.poster_path}` : '',
        date: details.first_air_date,
        label: typeLabel
      });
      
      const lastEp = details.last_episode_to_air;
      if(lastEp){
        const epSlug = slugify(lastEp.name || `episode-${lastEp.episode_number}`);
        items.push({
          title: `${details.name} - S${lastEp.season_number}E${lastEp.episode_number} ${lastEp.name || ''}`.trim(),
          url: `${SITE_URL}/${isAnime ? 'anime' : 'tv'}/${tv.id}-${slug}/season/${lastEp.season_number}/episode/${lastEp.episode_number}${epSlug ? '/'+epSlug : ''}`,
          overview: lastEp.overview || `Watch ${details.name} Episode ${lastEp.episode_number}`,
          poster: lastEp.still_path ? `${TMDB_IMG}${lastEp.still_path}` : (tv.poster_path ? `${TMDB_IMG}${tv.poster_path}` : ''),
          date: lastEp.air_date,
          label: `${typeLabel} Episode`
        });
      }
      await sleep(200);
    }catch(e){}
  }
  
  const finalItems = items.sort(()=>Math.random()-0.5).slice(0,20);
  const now = new Date().toUTCString();
  
  const xmlItems = finalItems.map(m => {
    const pubDate = m.date ? new Date(m.date).toUTCString() : now;
    const safeOverview = escapeXml(m.overview || '');
    // FIX: enclosure without length=0 and with proper escaping, Pinterest needs valid URL
    const imgTag = m.poster ? `    <enclosure url="${m.poster}" type="image/jpeg" />
    <media:content url="${m.poster}" medium="image" type="image/jpeg" />
    <media:thumbnail url="${m.poster}" />` : '';
    return `  <item>
    <title><![CDATA[${m.title} [${m.label}]]]></title>
    <link>${m.url}</link>
    <guid isPermaLink="true">${m.url}</guid>
    <pubDate>${pubDate}</pubDate>
    <description><![CDATA[${safeOverview}]]></description>
${imgTag}
  </item>`;
  }).join('\n');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>Zero TV</title>
  <link>${SITE_URL}</link>
  <description>Zero TV - Latest Movies, TV Shows, Anime and Episodes</description>
  <lastBuildDate>${now}</lastBuildDate>
  <language>en</language>
  <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
  <generator>Zero TV - Full Content Feed</generator>
${xmlItems}
</channel>
</rss>`;

  fs.mkdirSync('dist',{recursive:true});
  fs.mkdirSync('public',{recursive:true});
  
  // كل الاسماء اللي كنت بتستخدمها هتولد من نفس المحتوى عشان Pinterest و MastoFeed
  const files = ['feed.xml', 'rss.xml', 'anime-feed.xml', 'tv-feed.xml', 'movies-feed.xml'];
  for(const f of files){
    fs.writeFileSync(`dist/${f}`, rss);
    fs.writeFileSync(`public/${f}`, rss);
  }
  
  console.log(`✅ FULL FEED - ${finalItems.length} items (Movies + TV + Anime + Episodes) with IMAGES`);
  finalItems.forEach(i=>console.log(` - ${i.label}: ${i.title} | ${i.poster ? 'IMG OK' : 'NO IMG'}`));
}
main();
