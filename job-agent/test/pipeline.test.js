const test = require('node:test');
const assert = require('node:assert');
const config = require('../config');
const { selectNewJobs, dedupeKey, pruneSeen } = require('../src/pipeline');
const { normalize } = require('../src/util');
const franceTravail = require('../src/sources/franceTravail');
const adzuna = require('../src/sources/adzuna');
const jooble = require('../src/sources/jooble');
const { parseFeed } = require('../src/sources/rss');
const { toEmbed } = require('../src/discord');
const { buildMarkdown } = require('../src/report');

const today = new Date().toISOString();
const job = (o) => ({ title: 'Graphiste H/F', company: 'Agence X', url: 'https://ex.com/1', publishedAt: today, source: 'Adzuna', ...o });

test('normalize retire accents et H/F', () => {
  assert.strictEqual(normalize('Directrice Artistique (H/F) – Créa'), 'directrice artistique crea');
});

test('filtre les titres hors sujet et exclus', () => {
  const jobs = [
    job({ title: 'Commercial terrain', url: 'u1' }),
    job({ title: 'Designer industriel', url: 'u2' }),
    job({ title: 'Motion designer junior', company: 'B', url: 'u3' }),
    job({ title: 'Directeur Artistique', company: 'C', url: 'u4' }),
  ];
  assert.deepStrictEqual(selectNewJobs(jobs, config, {}).map((j) => j.url).sort(), ['u3', 'u4']);
});

test('écarte les offres trop anciennes', () => {
  const old = new Date(Date.now() - 30 * 86400000).toISOString();
  assert.strictEqual(selectNewJobs([job({ publishedAt: old })], config, {}).length, 0);
});

test('dédoublonne entre sources et avec l’historique', () => {
  const a = job({ source: 'Adzuna', url: 'a' });
  const b = job({ source: 'Jooble', title: 'GRAPHISTE (F/H)', url: 'b' });
  assert.strictEqual(selectNewJobs([a, b], config, {}).length, 1);
  assert.strictEqual(selectNewJobs([a], config, { [dedupeKey(a)]: today }).length, 0);
});

test('exclusion par type de contrat', () => {
  const cfg = { ...config, contractExclude: ['stage'] };
  assert.strictEqual(selectNewJobs([job({ contract: 'Stage' })], cfg, {}).length, 0);
  assert.strictEqual(selectNewJobs([job({ contract: 'CDI' })], cfg, {}).length, 1);
});

test('pruneSeen oublie les vieilles entrées', () => {
  const old = new Date(Date.now() - 90 * 86400000).toISOString();
  assert.deepStrictEqual(Object.keys(pruneSeen({ a: old, b: today }, 60)), ['b']);
});

test('conversion des formats de chaque source', () => {
  const ft = franceTravail.toJob({
    id: '123ABC', intitule: 'Graphiste (H/F)', entreprise: { nom: 'Studio' },
    lieuTravail: { libelle: '69 - LYON 03' }, typeContratLibelle: 'CDI',
    dateCreation: today, description: 'Super <b>poste</b>',
    origineOffre: { partenaires: [{ nom: 'HELLOWORK' }] },
  });
  assert.strictEqual(ft.url, 'https://candidat.francetravail.fr/offres/recherche/detail/123ABC');
  assert.strictEqual(ft.via, 'HELLOWORK');
  assert.strictEqual(ft.description, 'Super poste');

  const az = adzuna.toJob({ id: 9, title: '<strong>Graphiste</strong>', company: { display_name: 'Y' }, location: { display_name: 'Lyon, Rhône' }, redirect_url: 'https://adzuna/9', created: today, contract_type: 'permanent', salary_min: 30000, salary_max: 35000 });
  assert.strictEqual(az.title, 'Graphiste');
  assert.strictEqual(az.salary, '30000 – 35000 € / an');

  const jo = jooble.toJob({ id: 5, title: 'Graphiste', link: 'https://jooble/5', source: 'indeed.fr', company: 'Z', updated: today });
  assert.strictEqual(jo.via, 'indeed.fr');
});

test('parse un flux RSS et Atom', () => {
  const rss = '<rss><channel><item><title><![CDATA[Graphiste Lyon]]></title><link>https://x/1</link><pubDate>Mon, 02 Nov 2026 10:00:00 GMT</pubDate></item></channel></rss>';
  const atom = '<feed><entry><title>DA junior</title><link href="https://x/2"/><updated>2026-11-02T10:00:00Z</updated></entry></feed>';
  assert.deepStrictEqual(parseFeed(rss, 'f').map((j) => [j.title, j.url]), [['Graphiste Lyon', 'https://x/1']]);
  assert.deepStrictEqual(parseFeed(atom, 'f').map((j) => [j.title, j.url]), [['DA junior', 'https://x/2']]);
});

test('embed Discord et rapport Markdown', () => {
  const e = toEmbed(job({ description: 'x'.repeat(1000), location: 'Lyon' }));
  assert.ok(e.description.length <= 250);
  assert.ok(e.fields.some((f) => f.name === 'Lieu'));
  assert.ok(!('description' in toEmbed(job({ description: '' }))));
  const md = buildMarkdown([job({ title: 'Graphiste | print' })], { date: '2026-11-03', sourcesStatus: [{ name: 'Adzuna', status: '1 résultats' }] });
  assert.match(md, /Graphiste \\\| print/);
});
