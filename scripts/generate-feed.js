import { Feed } from 'feed';
import fs from 'fs';

const siteUrl = "https://mtthomas166.github.io/zero-tv";

const feed = new Feed({
  title: "Zero TV",
  description: "Zero TV - Watch Live TV",
  id: siteUrl,
  link: siteUrl,
  language: "ar",
  copyright: `All rights reserved ${new Date().getFullYear()}`,
  feedLinks: {
    rss2: `${siteUrl}/feed.xml`,
    json: `${siteUrl}/feed.json`,
  },
});

feed.addItem({
  title: "Zero TV - Live",
  id: siteUrl,
  link: siteUrl,
  description: "Watch live TV on Zero TV",
  date: new Date(),
});

if (!fs.existsSync('public')) fs.mkdirSync('public');

const rss = feed.rss2();

fs.writeFileSync('public/feed.xml', rss);
fs.writeFileSync('public/rss.xml', rss); // ده اللي انت عايزه
fs.writeFileSync('public/rss', rss);
fs.writeFileSync('public/feed.json', feed.json1());

console.log('✅ Feed generated: feed.xml, rss.xml, rss');