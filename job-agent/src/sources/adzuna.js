// API Adzuna : agrégateur qui indexe des centaines de sites d'emploi français.
// Clé gratuite : https://developer.adzuna.com
const { fetchJson, sleep, stripHtml } = require('../util');

const name = 'Adzuna';

function isEnabled(env) {
  return Boolean(env.ADZUNA_APP_ID && env.ADZUNA_APP_KEY);
}

function toJob(r) {
  let salary = null;
  if (r.salary_min && r.salary_max && r.salary_is_predicted !== '1') {
    salary = `${Math.round(r.salary_min)} – ${Math.round(r.salary_max)} € / an`;
  }
  return {
    id: `adzuna-${r.id}`,
    source: name,
    via: null,
    title: stripHtml(r.title),
    company: r.company?.display_name || null,
    location: r.location?.display_name || null,
    contract: [r.contract_type, r.contract_time].filter(Boolean).join(' · ') || null,
    salary,
    url: r.redirect_url,
    publishedAt: r.created || null,
    description: stripHtml(r.description),
  };
}

async function search(config, env) {
  const jobs = [];
  for (const kw of config.keywords) {
    const params = new URLSearchParams({
      app_id: env.ADZUNA_APP_ID,
      app_key: env.ADZUNA_APP_KEY,
      where: config.location.city,
      distance: String(config.location.radiusKm),
      max_days_old: String(config.maxAgeDays),
      results_per_page: '50',
      sort_by: 'date',
    });
    params.set(kw.includes(' ') ? 'what_phrase' : 'what', kw);
    const data = await fetchJson(
      `https://api.adzuna.com/v1/api/jobs/fr/search/1?${params}`,
      { headers: { Accept: 'application/json' } },
    );
    for (const r of data?.results || []) jobs.push(toJob(r));
    await sleep(300);
  }
  return jobs;
}

module.exports = { name, isEnabled, search, toJob };
