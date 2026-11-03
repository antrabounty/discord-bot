// Flux RSS/Atom configurés dans config.js (Google Alertes, job boards, etc.).
const { stripHtml } = require('../util');

const name = 'RSS';

function isEnabled(_env, config) {
  return config.rssFeeds.length > 0;
}

function tag(block, names) {
  for (const n of names) {
    const m = block.match(new RegExp(`<${n}\\b[^>]*>([\\s\\S]*?)</${n}>`, 'i'));
    if (m) return m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim();
    const href = block.match(new RegExp(`<${n}\\b[^>]*href="([^"]+)"`, 'i'));
    if (href) return href[1];
  }
  return '';
}

function parseFeed(xml, feedName) {
  const blocks = xml.match(/<(item|entry)\b[\s\S]*?<\/\1>/gi) || [];
  return blocks.map((b) => {
    const url = stripHtml(tag(b, ['link', 'guid', 'id']));
    return {
      id: `rss-${url}`,
      source: name,
      via: feedName,
      title: stripHtml(tag(b, ['title'])),
      company: null,
      location: null,
      contract: null,
      salary: null,
      url,
      publishedAt: tag(b, ['pubDate', 'published', 'updated', 'dc:date']) || null,
      description: stripHtml(tag(b, ['description', 'summary', 'content'])),
    };
  });
}

async function search(config) {
  const jobs = [];
  for (const feed of config.rssFeeds) {
    const res = await fetch(feed.url, { signal: AbortSignal.timeout(20000) });
    if (!res.ok) throw new Error(`HTTP ${res.status} sur le flux ${feed.name}`);
    jobs.push(...parseFeed(await res.text(), feed.name));
  }
  return jobs;
}

module.exports = { name, isEnabled, search, parseFeed };
