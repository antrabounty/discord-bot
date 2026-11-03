// Envoi des offres dans un salon Discord via un webhook (aucun bot à héberger).
const { sleep, truncate } = require('./util');
const { formatDate } = require('./report');

const COLORS = { 'France Travail': 0x1e3a8a, Adzuna: 0x16a34a, Jooble: 0xea580c, RSS: 0x6b7280 };

function toEmbed(job) {
  const fields = [
    job.company && { name: 'Entreprise', value: truncate(job.company, 100), inline: true },
    job.location && { name: 'Lieu', value: truncate(job.location, 100), inline: true },
    job.contract && { name: 'Contrat', value: truncate(job.contract, 100), inline: true },
    job.salary && { name: 'Salaire', value: truncate(job.salary, 100), inline: true },
  ].filter(Boolean);
  const published = formatDate(job.publishedAt);
  return {
    title: truncate(job.title, 250),
    url: job.url,
    ...(job.description ? { description: truncate(job.description, 250) } : {}),
    color: COLORS[job.source] ?? 0x6b7280,
    fields,
    footer: { text: [job.via ? `${job.source} · ${job.via}` : job.source, published && `publiée le ${published}`].filter(Boolean).join(' — ') },
  };
}

async function post(webhookUrl, payload) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'Veille Emploi Lyon', ...payload }),
      signal: AbortSignal.timeout(20000),
    });
    if (res.status === 429) {
      const body = await res.json().catch(() => ({}));
      await sleep(Math.ceil((body.retry_after || 2) * 1000));
      continue;
    }
    if (!res.ok) throw new Error(`Discord a répondu HTTP ${res.status} : ${await res.text()}`);
    return;
  }
  throw new Error('Discord : trop de tentatives (rate limit)');
}

async function sendToDiscord(webhookUrl, jobs, { date, notifyWhenEmpty, errors }) {
  const warn = errors.length ? `\n⚠️ Sources en erreur : ${errors.join(', ')}` : '';
  if (!jobs.length) {
    if (notifyWhenEmpty) await post(webhookUrl, { content: `🔎 **${date}** — aucune nouvelle offre de designer graphique à Lyon aujourd’hui.${warn}` });
    return;
  }
  await post(webhookUrl, {
    content: `🎨 **${date}** — ${jobs.length} nouvelle(s) offre(s) de designer graphique à Lyon${warn}`,
  });
  // Discord limite un message à 10 embeds et 6000 caractères : on envoie par paquets de 5.
  for (let i = 0; i < jobs.length; i += 5) {
    await post(webhookUrl, { embeds: jobs.slice(i, i + 5).map(toEmbed) });
    await sleep(1000);
  }
}

module.exports = { sendToDiscord, toEmbed };
