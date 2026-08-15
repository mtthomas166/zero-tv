import fs from 'fs';

const TMDB_KEY = 'af32459863d504e3a5d04f317e7f12e1';
const SITE_URL = 'https://zero-tv.pages.dev';

function slugify(text) {
  if (!text) return '';
  return text.toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 60);
}

async function fetchTMDB(path) {
  const url = `https://api.themoviedb.org/3${path}${path.includes('?') ? '&' : '?'}api_key=${TMDB_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDB ${res.status}`);
  return res.json();
}

async function getAll() {
  const items = [];
  try {
    const [trendingM, popularM, trendingTV, popularTV] = await Promise.all([
      fetchTMDB('/trending/movie/week?page=1'),
      fetchTMDB('/movie/popular?page=1'),
      fetchTMDB('/trending/tv/week?page=1'),
      fetchTMDB('/tv/popular?page=1'),
    ]);

    trendingM.results?.slice(0, 30).forEach(m => {
      if(m.id && m.title) items.push({type:'movie', id:m.id, title:m.title});
    });
    popularM.results?.slice(0, 30).forEach(m => {
      if(m.id && m.title) items.push({type:'movie', id:m.id, title:m.title});
    });
    trendingTV.results?.slice(0, 30).forEach(tv => {
      if(tv.id && tv.name) items.push({type:'tv', id:tv.id, title:tv.name});
    });
    popularTV.results?.slice(0, 30).forEach(tv => {
      if(tv.id && tv.name) items.push({type:'tv', id:tv.id, title:tv.name});
    });
  } catch(e) {
    console.error('TMDB fetch failed, using fallback', e);
  }
  // remove duplicates by id+type
  const seen = new Set();
  const unique = [];
  for(const it of items){
    const k = it.type+'-'+it.id;
    if(!seen.has(k)){ seen.add(k); unique.push(it); }
  }
  return unique;
}

async function main(){
  const urls = [];
  urls.push({loc: `${SITE_URL}/`, priority: '1.0'});
  
  const items = await getAll();
  
  for(const item of items){
    const slug = slugify(item.title);
    const path = item.type === 'movie' ? `/movie/${item.id}${slug ? '-'+slug : ''}` : `/tv/${item.id}${slug ? '-'+slug : ''}`;
    urls.push({loc: `${SITE_URL}${path}`, priority: item.type==='movie' ? '0.9' : '0.8'});
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <changefreq>weekly</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  fs.mkdirSync('public', {recursive:true});
  fs.writeFileSync('public/sitemap.xml', xml, 'utf8');
  console.log(`Sitemap generated with ${urls.length} urls`);
}

main();
