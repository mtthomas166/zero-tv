import fs from 'fs'
const key = "5468bcf493cc45ad840c9598df986663"
const files = fs.readdirSync('public').filter(f => f.startsWith('sitemap-') && f.endsWith('.xml'))
let allUrls = []
for (const file of files) {
  const xml = fs.readFileSync(`public/${file}`,'utf8')
  const m = xml.match(/<loc>(.*?)<\/loc>/g) || []
  allUrls.push(...m.map(x=>x.replace(/<\/?loc>/g,'')))
}
console.log(`Found ${allUrls.length} URLs`)
fetch('https://api.indexnow.org/indexnow',{
  method:'POST',
  headers:{'Content-Type':'application/json'},
  body:JSON.stringify({
    host:"zero-tv.pages.dev",
    key,
    keyLocation:`https://zero-tv.pages.dev/${key}.txt`,
    urlList: allUrls.slice(0,10000)
  })
}).then(r=>console.log('IndexNow:',r.status))
