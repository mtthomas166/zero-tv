import fs from 'fs';
const SITE_URL = 'https://zero-tv.pages.dev';
const TMDB_KEY = process.env.TMDB_KEY || 'af32459863d504e3a5d04f317e7f12e1';

function slugify(t){ return t ? t.toString().toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').substring(0,60) : ''; }
async function fetchTMDB(p){ const u=`https://api.themoviedb.org/3${p}${p.includes('?')?'&':'?'}api_key=${TMDB_KEY}`; const r=await fetch(u); if(!r.ok) throw new Error(r.status); return r.json(); }
const sleep = ms => new Promise(r=>setTimeout(r,ms));

async function getMovies(){
  const eps=['/trending/movie/week?page=1','/movie/popular?page=1','/movie/popular?page=2','/movie/top_rated?page=1'];
  const items=[]; for(const p of eps){ try{ const d=await fetchTMDB(p); d.results?.slice(0,20).forEach(i=>{ if(i.id&&i.title) items.push({id:i.id,title:i.title,type:'movie'}) }); }catch{} await sleep(150); } return items;
}
async function getTV(){
  const eps=['/trending/tv/week?page=1','/tv/popular?page=1','/tv/popular?page=2'];
  const items=[]; for(const p of eps){ try{ const d=await fetchTMDB(p); d.results?.slice(0,20).forEach(i=>{ if(i.id&&i.name) items.push({id:i.id,title:i.name,type:'tv'}) }); }catch{} await sleep(150); } return items;
}
function dedup(items){ const s=new Set(), u=[]; for(const it of items){ const k=it.type+'-'+it.id; if(!s.has(k)){ s.add(k); u.push(it);} } return u; }

async function main(){
  let urls=[
    {loc:`${SITE_URL}/`},{loc:`${SITE_URL}/movies`},{loc:`${SITE_URL}/tv`},{loc:`${SITE_URL}/anime`}
  ];
  const movies=dedup(await getMovies());
  const tvs=dedup(await getTV()).slice(0,30); // قللت من 50 لـ 30 عشان الحجم

  for(const it of movies){ const slug=slugify(it.title); urls.push({loc:`${SITE_URL}/movie/${it.id}${slug?`-${slug}`:''}`}); }

  for(const show of tvs){
    try{
      const d=await fetchTMDB(`/tv/${show.id}`);
      const slug=slugify(d.name||show.title);
      const isAnime=d.genres?.some(g=>g.name==='Animation')||d.origin_country?.includes('JP');
      const base=`/${isAnime?'anime':'tv'}/${show.id}${slug?`-${slug}`:''}`;
      urls.push({loc:`${SITE_URL}${base}`});
      const seasons=(d.seasons||[]).filter(s=>s.season_number>0).slice(0,2); // موسمين بس
      for(const s of seasons){
        try{ const sd=await fetchTMDB(`/tv/${show.id}/season/${s.season_number}`); for(const ep of sd.episodes||[]){ const es=slugify(ep.name||`ep-${ep.episode_number}`); urls.push({loc:`${SITE_URL}${base}/season/${s.season_number}/episode/${ep.episode_number}${es?`/${es}`:''}`}); } await sleep(100); }catch{}
      }
      await sleep(150);
    }catch{}
  }

  // نقسم 1000 رابط في كل ملف
  const CHUNK=1000;
  const chunks=[];
  for(let i=0;i<urls.length;i+=CHUNK) chunks.push(urls.slice(i,i+CHUNK));
  
  fs.mkdirSync('public',{recursive:true}); fs.mkdirSync('dist',{recursive:true});
  
  chunks.forEach((ch,idx)=>{
    const xml=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${ch.map(u=>`  <url><loc>${u.loc.replace(/&/g,'&amp;')}</loc></url>`).join('\n')}\n</urlset>`;
    fs.writeFileSync(`public/sitemap-${idx}.xml`,xml); fs.writeFileSync(`dist/sitemap-${idx}.xml`,xml);
  });

  const indexXml=`<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${chunks.map((_,idx)=>`  <sitemap><loc>${SITE_URL}/sitemap-${idx}.xml</loc></sitemap>`).join('\n')}\n</sitemapindex>`;
  
  fs.writeFileSync('public/sitemap.xml',indexXml); fs.writeFileSync('dist/sitemap.xml',indexXml);
  fs.writeFileSync('public/sitemap-index.xml',indexXml); fs.writeFileSync('dist/sitemap-index.xml',indexXml);
  console.log(`✅ Generated ${urls.length} urls in ${chunks.length} files`);
}
main();