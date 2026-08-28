export async function onRequest() {
  const r = await fetch("https://pinterest-feeds.mtthomas166.workers.dev/series-feed.xml");
  const text = await r.text();
  return new Response(text, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
