import fs from 'fs'
const key = "5468bcf493cc45ad840c9598df986663"
const urls = fs.readFileSync('public/sitemap-0.xml','utf8').match(/<loc>(.*?)<\/loc>/g).map(x=>x.replace(/<\/?loc>/g,''))
fetch('https://api.indexnow.org/indexnow',{
 method:'POST',
 headers:{'Content-Type':'application/json'},
 body:JSON.stringify({host:"zero-tv.pages.dev",key,keyLocation:`https://zero-tv.pages.dev/${key}.txt`,urlList:urls})
}).then(r=>console.log(r.status))
