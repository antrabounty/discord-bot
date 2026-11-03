const fs = require('fs');
const path = require('path');

const REPORTS_DIR = path.join(__dirname, '..', 'reports');

function formatDate(iso) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Paris' });
}

function escapeMd(s = '') {
  return String(s).replace(/([|[\]])/g, '\\$1');
}

function buildMarkdown(jobs, { date, sourcesStatus }) {
  const lines = [`# Offres designer graphique — Lyon — ${date}`, ''];
  lines.push(`**${jobs.length} nouvelle(s) offre(s)**`, '');
  lines.push('Sources : ' + sourcesStatus.map((s) => `${s.name} (${s.status})`).join(', '), '');
  if (jobs.length) {
    lines.push('| Poste | Entreprise | Lieu | Contrat | Publiée | Source |');
    lines.push('|---|---|---|---|---|---|');
    for (const j of jobs) {
      lines.push(
        `| [${escapeMd(j.title)}](${j.url}) | ${escapeMd(j.company || '—')} | ${escapeMd(j.location || '—')} | ${escapeMd(j.contract || '—')} | ${formatDate(j.publishedAt) || '—'} | ${escapeMd(j.via ? `${j.source} / ${j.via}` : j.source)} |`,
      );
    }
  } else {
    lines.push('Aucune nouvelle offre aujourd’hui.');
  }
  return `${lines.join('\n')}\n`;
}

function writeReport(markdown, date) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  fs.writeFileSync(path.join(REPORTS_DIR, `${date}.md`), markdown);
  fs.writeFileSync(path.join(REPORTS_DIR, 'latest.md'), markdown);
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown);
}

module.exports = { buildMarkdown, writeReport, formatDate };
