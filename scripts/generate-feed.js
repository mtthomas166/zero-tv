import fs from 'fs';
const SITE_URL = 'https://zero-tv.pages.dev';
const TMDB_KEY = process.env.TMDB_KEY || 'af32459863d504e3a5d04f317e7f12e1';

async function fetchTMDB(p){ 
  const u=`https://api.themoviedb.org/3${p}${p.includes('?')?'&':'?'}api_key=${TMDB_KEY}`; 
  const r=await fetch(u); 
  if(!r.ok) throw new Error(r.status); 
  return r.json(); 
}
function slugify(t){ return t ? t.toString().toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').substring(0,60) : ''; }
function escapeXml(s){ return s ? s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;') : ''; }

async function main(){
  const data = await fetchTMDB('/trending/movie/week?page=1');
  const movies = data.results?.slice(0,20) || [];
  const now = new Date().toUTCString();
  
  const items = movies.map(m => {
    const slug = slugify(m.title);
    const url = `${SITE_URL}/movie/${m.id}${slug?`-${slug}`:''}`;
    const pubDate = m.release_date ? new Date(m.release_date).toUTCString() : now;
    const overview = escapeXml(m.overview || `Watch ${m.title} on Zero TV`);
    return `  <item>
    <title><![CDATA[${m.title}]]></title>
    <link>${url}</link>
    <guid isPermaLink="true">${url}</guid>
    <pubDate>${pubDate}</pubDate>
    <description><![CDATA[${overview}]]></description>
  </item>`;
  }).join('\n');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>Zero TV</title>
  <link>${SITE_URL}</link>
  <description>Zero TV - Watch Latest Movies and TV Shows for Free</description>
  <lastBuildDate>${now}</lastBuildDate>
  <language>ar</language>
  <generator>Zero TV</generator>
${items}
</channel>
</rss>`;

  fs.mkdirSync('dist',{recursive:true});
  fs.writeFileSync('dist/feed.xml', rss);
  fs.writeFileSync('dist/rss.xml', rss);
  fs.writeFileSync('public/feed.xml', rss);
  fs.writeFileSync('public/rss.xml', rss);
  console.log(`✅ feed.xml generated with ${movies.length} movies - ${SITE_URL}`);
}
main();
