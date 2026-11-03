#!/usr/bin/env node
// Agent quotidien : interroge les sources, garde les nouvelles offres, publie sur Discord + rapport.
// Usage : node src/index.js [--dry-run]
//   --dry-run : n'envoie rien sur Discord et ne met pas à jour l'historique.
const config = require('../config');
const { selectNewJobs, pruneSeen } = require('./pipeline');
const { loadSeen, saveSeen } = require('./store');
const { buildMarkdown, writeReport } = require('./report');
const { sendToDiscord } = require('./discord');

const SOURCES = [
  require('./sources/franceTravail'),
  require('./sources/adzuna'),
  require('./sources/jooble'),
  require('./sources/rss'),
];

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const env = process.env;
  const date = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Paris' }); // AAAA-MM-JJ

  const sourcesStatus = [];
  const errors = [];
  const all = [];

  const results = await Promise.allSettled(
    SOURCES.map(async (s) => {
      if (!s.isEnabled(env, config)) return { s, skipped: true };
      return { s, jobs: await s.search(config, env) };
    }),
  );
  results.forEach((r, i) => {
    const s = SOURCES[i];
    if (r.status === 'rejected') {
      console.error(`✗ ${s.name} : ${r.reason.message}`);
      errors.push(s.name);
      sourcesStatus.push({ name: s.name, status: 'erreur' });
    } else if (r.value.skipped) {
      console.log(`- ${s.name} : non configuré, ignoré`);
    } else {
      console.log(`✓ ${s.name} : ${r.value.jobs.length} résultat(s) brut(s)`);
      all.push(...r.value.jobs);
      sourcesStatus.push({ name: s.name, status: `${r.value.jobs.length} résultats` });
    }
  });

  if (!sourcesStatus.length) {
    throw new Error(
      'Aucune source configurée. Renseigne au moins FRANCE_TRAVAIL_CLIENT_ID/SECRET, ADZUNA_APP_ID/KEY ou JOOBLE_API_KEY (voir README).',
    );
  }

  const seen = loadSeen();
  const fresh = selectNewJobs(all, config, seen);
  console.log(`→ ${fresh.length} nouvelle(s) offre(s) pertinente(s)`);

  const markdown = buildMarkdown(fresh, { date, sourcesStatus });

  if (dryRun) {
    console.log(`\n${markdown}`);
    return;
  }

  writeReport(markdown, date);

  if (env.DISCORD_WEBHOOK_URL) {
    await sendToDiscord(env.DISCORD_WEBHOOK_URL, fresh, {
      date,
      notifyWhenEmpty: config.discord.notifyWhenEmpty,
      errors,
    });
    console.log('✓ Envoyé sur Discord');
  } else {
    console.log('- DISCORD_WEBHOOK_URL absent : pas d’envoi Discord');
  }

  // On ne marque les offres comme vues qu'après un envoi réussi.
  const now = new Date().toISOString();
  for (const j of fresh) seen[j.key] = now;
  saveSeen(pruneSeen(seen, config.seenRetentionDays));

  if (errors.length === sourcesStatus.length) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
