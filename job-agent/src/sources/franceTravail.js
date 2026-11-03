// API officielle « Offres d'emploi v2 » de France Travail (ex-Pôle emploi).
// Inclut aussi les offres des sites partenaires (Indeed, HelloWork, Meteojob, etc.).
// Identifiants gratuits : https://francetravail.io → « Offres d'emploi v2 ».
const { fetchJson, sleep, stripHtml } = require('../util');

const TOKEN_URL =
  'https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=%2Fpartenaire';
const SEARCH_URL = 'https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search';

const name = 'France Travail';

function isEnabled(env) {
  return Boolean(env.FRANCE_TRAVAIL_CLIENT_ID && env.FRANCE_TRAVAIL_CLIENT_SECRET);
}

async function getToken(env) {
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: env.FRANCE_TRAVAIL_CLIENT_ID,
    client_secret: env.FRANCE_TRAVAIL_CLIENT_SECRET,
    scope: 'api_offresdemploiv2 o2dsoffre',
  });
  const data = await fetchJson(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  return data.access_token;
}

/** France Travail n'accepte que 1, 3, 7, 14 ou 31 jours. */
function publieeDepuis(days) {
  return [1, 3, 7, 14, 31].find((d) => d >= days) || 31;
}

function toJob(o) {
  const partner = o.origineOffre?.partenaires?.[0];
  return {
    id: `ft-${o.id}`,
    source: name,
    via: partner?.nom || null,
    title: o.intitule,
    company: o.entreprise?.nom || null,
    location: o.lieuTravail?.libelle || null,
    contract: o.typeContratLibelle || o.typeContrat || null,
    salary: o.salaire?.libelle || null,
    url: `https://candidat.francetravail.fr/offres/recherche/detail/${o.id}`,
    publishedAt: o.dateCreation || null,
    description: stripHtml(o.description),
  };
}

async function search(config, env) {
  const token = await getToken(env);
  const jobs = [];
  for (const dep of config.location.departements) {
    for (const kw of config.keywords) {
      const params = new URLSearchParams({
        motsCles: kw,
        departement: dep,
        publieeDepuis: String(publieeDepuis(config.maxAgeDays)),
        sort: '1', // tri par date
        range: '0-149',
      });
      const data = await fetchJson(`${SEARCH_URL}?${params}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      for (const o of data?.resultats || []) jobs.push(toJob(o));
      await sleep(300); // limite de débit de l'API
    }
  }
  return jobs;
}

module.exports = { name, isEnabled, search, toJob };
