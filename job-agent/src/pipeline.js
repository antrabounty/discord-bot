const { normalize, matchesAny } = require('./util');

/** Clé de dédoublonnage : la même offre publiée sur plusieurs sites a le même titre + entreprise. */
function dedupeKey(job) {
  const company = normalize(job.company || '');
  return company ? `${normalize(job.title)}|${company}` : `url|${job.url}`;
}

function isRelevant(job, config) {
  if (!job.title || !job.url) return false;
  if (!matchesAny(job.title, config.titleMustMatch)) return false;
  if (matchesAny(job.title, config.titleExclude)) return false;
  if (config.contractExclude.length && matchesAny(`${job.contract || ''} ${job.title}`, config.contractExclude)) {
    return false;
  }
  if (job.publishedAt) {
    const published = Date.parse(job.publishedAt);
    // Petite marge : certaines sources datent à la mise à jour plutôt qu'à la création.
    const limit = Date.now() - (config.maxAgeDays + 1) * 86400000;
    if (!Number.isNaN(published) && published < limit) return false;
  }
  return true;
}

/** Filtre, dédoublonne (entre sources et avec l'historique) et trie du plus récent au plus ancien. */
function selectNewJobs(jobs, config, seen) {
  const out = new Map();
  for (const job of jobs) {
    if (!isRelevant(job, config)) continue;
    const key = dedupeKey(job);
    if (seen[key] || out.has(key)) continue;
    out.set(key, { ...job, key });
  }
  return [...out.values()].sort(
    (a, b) => (Date.parse(b.publishedAt) || 0) - (Date.parse(a.publishedAt) || 0),
  );
}

function pruneSeen(seen, retentionDays, now = Date.now()) {
  const limit = now - retentionDays * 86400000;
  return Object.fromEntries(Object.entries(seen).filter(([, d]) => Date.parse(d) >= limit));
}

module.exports = { dedupeKey, isRelevant, selectNewJobs, pruneSeen };
