import fs from 'fs';
const SITE_URL = 'https://zero-tv.pages.dev';
const TMDB_KEY = process.env.TMDB_KEY || 'af32459863d504e3a5d04f317e7f12e1';

function slugify(t){ return t ? t.toString().toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').substring(0,60) : ''; }
function todayISO(){ return new Date().toISOString().split('T')[0]; }
function validDate(d){ 
  if(!d) return null;
  const dt = new Date(d);
  if(isNaN(dt)) return null;
  // لو التاريخ في المستقبل خليه اليوم
  if(dt > new Date()) return todayISO();
  return d;
}
async function fetchTMDB(p){ 
  const u=`https://api.themoviedb.org/3${p}${p.includes('?')?'&':'?'}api_key=${TMDB_KEY}`; 
  const r=await fetch(u); 
  if(!r.ok) throw new Error(r.status); 
  return r.json(); 
}
const sleep = ms => new Promise(r=>setTimeout(r,ms));

async function getMovies(){
  const eps=['/trending/movie/week?page=1','/movie/popular?page=1','/movie/popular?page=2','/movie/top_rated?page=1'];
  const items=[]; 
  for(const p of eps){ 
    try{ 
      const d=await fetchTMDB(p); 
      d.results?.slice(0,20).forEach(i=>{ 
        if(i.id&&i.title) items.push({
          id:i.id,
          title:i.title,
          type:'movie',
          lastmod: validDate(i.release_date) || '2024-01-01' // تاريخ الفيلم الحقيقي مش اليوم
        }); 
      }); 
    }catch{} 
    await sleep(150); 
  } 
  return items;
}

async function getTV(){
  const eps=['/trending/tv/week?page=1','/tv/popular?page=1','/tv/popular?page=2'];
  const items=[]; 
  for(const p of eps){ 
    try{ 
      const d=await fetchTMDB(p); 
      d.results?.slice(0,20).forEach(i=>{ 
        if(i.id&&i.name) items.push({
          id:i.id,
          title:i.name,
          type:'tv',
          lastmod: validDate(i.first_air_date) || '2024-01-01'
        }); 
      }); 
    }catch{} 
    await sleep(150); 
  } 
  return items;
}

function dedup(items){ 
  const s=new Set(), u=[]; 
  for(const it of items){ 
    const k=it.type+'-'+it.id; 
    if(!s.has(k)){ s.add(k); u.push(it);} 
  } 
  return u; 
}

async function main(){
  const today = todayISO();
  
  let urls=[
    {loc:`${SITE_URL}/`, lastmod: today, changefreq: 'daily', priority: '1.0'},
    {loc:`${SITE_URL}/movies`, lastmod: today, changefreq: 'daily', priority: '0.9'},
    {loc:`${SITE_URL}/tv`, lastmod: today, changefreq: 'daily', priority: '0.9'},
    {loc:`${SITE_URL}/anime`, lastmod: today, changefreq: 'daily', priority: '0.9'}
  ];
  
  const movies=dedup(await getMovies());
  const tvs=dedup(await getTV()).slice(0,30);

  for(const it of movies){ 
    const slug=slugify(it.title); 
    urls.push({
      loc:`${SITE_URL}/movie/${it.id}${slug?`-${slug}`:''}`,
      lastmod: it.lastmod, // تاريخ الاصدار الحقيقي
      changefreq: 'weekly',
      priority: '0.8'
    }); 
  }

  for(const show of tvs){
    try{
      const d=await fetchTMDB(`/tv/${show.id}`);
      const slug=slugify(d.name||show.title);
      const isAnime=d.genres?.some(g=>g.name==='Animation')||d.origin_country?.includes('JP');
      const base=`/${isAnime?'anime':'tv'}/${show.id}${slug?`-${slug}`:''}`;
      urls.push({
        loc:`${SITE_URL}${base}`,
        lastmod: validDate(d.first_air_date || d.last_air_date) || show.lastmod,
        changefreq: 'weekly',
        priority: '0.8'
      });
      
      const seasons=(d.seasons||[]).filter(s=>s.season_number>0).slice(0,2);
      for(const s of seasons){
        try{ 
          const sd=await fetchTMDB(`/tv/${show.id}/season/${s.season_number}`); 
          for(const ep of sd.episodes||[]){ 
            const es=slugify(ep.name||`ep-${ep.episode_number}`); 
            urls.push({
              loc:`${SITE_URL}${base}/season/${s.season_number}/episode/${ep.episode_number}${es?`/${es}`:''}`,
              lastmod: validDate(ep.air_date) || validDate(d.last_air_date) || show.lastmod,
              changefreq: 'monthly',
              priority: '0.6'
            }); 
          } 
          await sleep(100); 
        }catch{}
      }
      await sleep(150);
    }catch{}
  }

  const CHUNK=1000;
  const chunks=[];
  for(let i=0;i<urls.length;i+=CHUNK) chunks.push(urls.slice(i,i+CHUNK));
  
  fs.mkdirSync('public',{recursive:true}); 
  fs.mkdirSync('dist',{recursive:true});
  
  chunks.forEach((ch,idx)=>{
    const xml=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${ch.map(u=>`  <url><loc>${u.loc.replace(/&/g,'&amp;')}</loc><lastmod>${u.lastmod}</lastmod><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`).join('\n')}\n</urlset>`;
    fs.writeFileSync(`public/sitemap-${idx}.xml`,xml); 
    fs.writeFileSync(`dist/sitemap-${idx}.xml`,xml);
  });

  const indexXml=`<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${chunks.map((_,idx)=>`  <sitemap><loc>${SITE_URL}/sitemap-${idx}.xml</loc><lastmod>${today}</lastmod></sitemap>`).join('\n')}\n</sitemapindex>`;
  
  fs.writeFileSync('public/sitemap.xml',indexXml); 
  fs.writeFileSync('dist/sitemap.xml',indexXml);
  fs.writeFileSync('public/sitemap-index.xml',indexXml); 
  fs.writeFileSync('dist/sitemap-index.xml',indexXml);
  
  console.log(`✅ Generated ${urls.length} urls in ${chunks.length} files`);
  console.log(`📅 Static pages lastmod = today (${today})`);
  console.log(`📅 Movies/TV lastmod = real release date (not today)`);
  console.log(`🔧 Now IndexNow will only submit 10-20 new URLs per day, not 40K`);
}
main();
