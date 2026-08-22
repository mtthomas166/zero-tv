import fs from 'fs';

const TMDB_KEY = 'af32459863d504e3a5d04f317e7f12e1';
const SITE_URL = 'https://zero-tv.pages.dev';

function slugify(text) {
  if (!text) return '';
  return text.toString().toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 60);
}

async function fetchTMDB(path) {
  const url = `https://api.themoviedb.org/3${path}${path.includes('?') ? '&' : '?'}api_key=${TMDB_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDB ${res.status} for ${path}`);
  return res.json();
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function getMovies() {
  const endpoints = [
    '/trending/movie/week?page=1',
    '/movie/popular?page=1',
    '/movie/popular?page=2',
    '/movie/top_rated?page=1',
    '/movie/now_playing?page=1',
    '/movie/upcoming?page=1',
  ];
  const items = [];
  for (const path of endpoints) {
    try {
      const data = await fetchTMDB(path);
      data.results?.slice(0, 20).forEach(item => {
        if (item.id && item.title) items.push({ id: item.id, title: item.title, type: 'movie' });
      });
    } catch {}
    await sleep(150);
  }
  return items;
}

async function getTVShows() {
  const endpoints = [
    '/trending/tv/week?page=1',
    '/tv/popular?page=1',
    '/tv/popular?page=2',
    '/tv/top_rated?page=1',
    '/tv/on_the_air?page=1',
    '/tv/airing_today?page=1',
    '/discover/tv?with_genres=16&with_origin_country=JP&sort_by=popularity.desc&page=1',
    '/discover/tv?with_genres=16&with_origin_country=JP&sort_by=popularity.desc&page=2',
  ];
  const items = [];
  for (const path of endpoints) {
    try {
      const data = await fetchTMDB(path);
      data.results?.slice(0, 20).forEach(item => {
        if (item.id && item.name) items.push({ id: item.id, title: item.name, type: 'tv', isAnimeHint: path.includes('16') });
      });
    } catch {}
    await sleep(150);
  }
  return items;
}

function dedup(items) {
  const seen = new Set();
  const unique = [];
  for (const it of items) {
    const k = it.type + '-' + it.id;
    if (!seen.has(k)) {
      seen.add(k);
      unique.push(it);
    }
  }
  return unique;
}

async function main() {
  const urls = [];
  urls.push({ loc: `${SITE_URL}/`, priority: '1.0', changefreq: 'daily' });
  urls.push({ loc: `${SITE_URL}/movies`, priority: '0.9', changefreq: 'daily' });
  urls.push({ loc: `${SITE_URL}/tv`, priority: '0.9', changefreq: 'daily' });
  urls.push({ loc: `${SITE_URL}/anime`, priority: '0.9', changefreq: 'daily' });

  console.log('Fetching movies...');
  const movies = dedup(await getMovies());
  console.log(`Movies found: ${movies.length}`);

  console.log('Fetching TV shows...');
  const tvShows = dedup(await getTVShows());
  console.log(`TV shows found: ${tvShows.length}`);

  for (const item of movies) {
    const slug = slugify(item.title);
    const path = `/movie/${item.id}${slug ? `-${slug}` : ''}`;
    urls.push({ loc: `${SITE_URL}${path}`, priority: '0.9', changefreq: 'weekly' });
  }

  const tvToProcess = tvShows.slice(0, 50);
  let episodeCount = 0;

  for (let i = 0; i < tvToProcess.length; i++) {
    const show = tvToProcess[i];
    try {
      const details = await fetchTMDB(`/tv/${show.id}`);
      const showTitle = details.name || show.title;
      const showSlug = slugify(showTitle);
      const isAnime = details.genres?.some(g => g.name === 'Animation') || details.origin_country?.includes('JP');
      const baseType = isAnime ? 'anime' : 'tv';
      const basePath = `/${baseType}/${show.id}${showSlug ? `-${showSlug}` : ''}`;
      urls.push({ loc: `${SITE_URL}${basePath}`, priority: '0.9', changefreq: 'weekly' });

      const seasons = (details.seasons || []).filter(s => s.season_number > 0).slice(0, 3);
      for (const season of seasons) {
        try {
          const seasonData = await fetchTMDB(`/tv/${show.id}/season/${season.season_number}`);
          const episodes = seasonData.episodes || [];
          for (const ep of episodes) {
            const epSlug = slugify(ep.name || `episode-${ep.episode_number}`);
            const epPath = `${basePath}/season/${season.season_number}/episode/${ep.episode_number}${epSlug ? `/${epSlug}` : ''}`;
            urls.push({ loc: `${SITE_URL}${epPath}`, priority: '0.7', changefreq: 'weekly' });
            episodeCount++;
          }
          await sleep(100);
        } catch {}
      }
      console.log(`[${i+1}/${tvToProcess.length}] ${showTitle} - total episodes so far: ${episodeCount}`);
      await sleep(150);
    } catch (e) {
      console.warn(`Failed show ${show.id}: ${e.message}`);
    }
  }

  console.log(`Total episode URLs: ${episodeCount}`);
  console.log(`Total URLs: ${urls.length}`);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc.replace(/&/g, '&amp;')}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  fs.mkdirSync('public', { recursive: true });
  fs.mkdirSync('dist', { recursive: true });
  fs.writeFileSync('public/sitemap.xml', xml, 'utf8');
  fs.writeFileSync('dist/sitemap.xml', xml, 'utf8');
  console.log(`✅ Sitemap generated with ${urls.length} urls`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});