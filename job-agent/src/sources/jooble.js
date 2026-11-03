// API Jooble : agrégateur qui parcourt des milliers de sites d'emploi.
// Clé gratuite : https://jooble.org/api/about
const { fetchJson, sleep, stripHtml } = require('../util');

const name = 'Jooble';

function isEnabled(env) {
  return Boolean(env.JOOBLE_API_KEY);
}

function toJob(j) {
  return {
    id: `jooble-${j.id}`,
    source: name,
    via: j.source || null,
    title: stripHtml(j.title),
    company: j.company || null,
    location: j.location || null,
    contract: j.type || null,
    salary: j.salary || null,
    url: j.link,
    publishedAt: j.updated || null,
    description: stripHtml(j.snippet),
  };
}

async function search(config, env) {
  const since = new Date(Date.now() - config.maxAgeDays * 86400000).toISOString().slice(0, 10);
  const jobs = [];
  for (const kw of config.keywords) {
    const data = await fetchJson(`https://jooble.org/api/${env.JOOBLE_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        keywords: kw,
        location: config.location.city,
        radius: String(config.location.radiusKm),
        datecreatedfrom: since,
        page: '1',
      }),
    });
    for (const j of data?.jobs || []) jobs.push(toJob(j));
    await sleep(300);
  }
  return jobs;
}

module.exports = { name, isEnabled, search, toJob };
