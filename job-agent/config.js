// Configuration de l'agent de recherche d'emploi.
// Modifie librement les mots-clés, la zone et les exclusions.
module.exports = {
  // Mots-clés envoyés à chaque source (une requête par mot-clé).
  keywords: [
    'graphiste',
    'designer graphique',
    'directeur artistique',
    'directrice artistique',
    'infographiste',
    'maquettiste PAO',
    'motion designer',
    'webdesigner',
    'designer UI',
    'brand designer',
  ],

  location: {
    city: 'Lyon',
    radiusKm: 30,
    // Départements interrogés sur France Travail (69 = Rhône).
    departements: ['69'],
  },

  // Ne garder que les offres publiées depuis N jours (France Travail accepte 1, 3, 7, 14 ou 31).
  maxAgeDays: 3,

  // Le titre de l'offre doit contenir au moins un de ces motifs (insensible à la casse/accents),
  // pour écarter le bruit des agrégateurs (« designer industriel », « commercial », etc.).
  titleMustMatch: [
    'graphi', 'design', 'directeur artistique', 'directrice artistique', 'direction artistique',
    'maquettist', 'pao', 'motion', 'illustrat', 'infographi', 'identite visuelle', 'creatif', 'creative',
  ],

  // Offres écartées si le titre contient un de ces motifs.
  titleExclude: [
    'designer industriel', 'design industriel', 'mobilier', 'interieur', 'textile', 'automobile', 'paysag',
  ],

  // Types de contrat à exclure, ex. ['stage', 'alternance']. Vide = tout garder.
  contractExclude: [],

  // Flux RSS supplémentaires (Google Alertes, job boards qui publient un flux, etc.).
  rssFeeds: [
    // { name: 'Google Alertes', url: 'https://www.google.fr/alerts/feeds/...' },
  ],

  discord: {
    // Envoie un message même quand il n'y a aucune nouvelle offre.
    notifyWhenEmpty: true,
  },

  // Les offres déjà vues sont oubliées après N jours.
  seenRetentionDays: 60,
};
