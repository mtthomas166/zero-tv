import fs from 'fs'
const key = "5468bcf493cc45ad840c9598df986663"
const files = fs.readdirSync('public').filter(f => f.startsWith('sitemap-') && f.endsWith('.xml'))

let allUrls = []
for (const file of files) {
  const xml = fs.readFileSync(`public/${file}`,'utf8')
  const matches = xml.match(/<loc>(.*?)<\/loc>/g) || []
  allUrls.push(...matches.map(x => x.replace(/<\/?loc>/g,'')))
}

fetch('https://api.indexnow.org/indexnow',{
  method:'POST',
  headers:{'Content-Type':'application/json'},
  body:JSON.stringify({
    host:"zero-tv.pages.dev",
    key,
    keyLocation:`https://zero-tv.pages.dev/${key}.txt`,
    urlList: allUrls
  })
}).then(r=>console.log('IndexNow status:', r.status, 'sent:', allUrls.length))
