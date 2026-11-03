# 🎨 Agent de veille emploi — Designer graphique à Lyon

Chaque matin, cet agent interroge plusieurs sources d'offres d'emploi, garde uniquement les
**nouvelles** offres de designer graphique / graphiste / DA / motion designer… autour de **Lyon**,
les dédoublonne (une même offre publiée sur plusieurs sites n'apparaît qu'une fois) puis :

- les poste dans un salon **Discord** (une carte par offre, avec lien, entreprise, lieu, contrat, salaire) ;
- écrit un rapport Markdown dans [`reports/`](reports/) (`latest.md` = dernier rapport) ;
- affiche le rapport dans le résumé de l'exécution GitHub Actions.

## Sources

| Source | Ce qu'elle couvre | Clé |
|---|---|---|
| **France Travail** (API officielle) | Offres France Travail **+ sites partenaires** (HelloWork, Indeed, Meteojob, Cadremploi…) | gratuite |
| **Adzuna** (API) | Agrégateur de centaines de job boards français | gratuite |
| **Jooble** (API) | Agrégateur de milliers de sites d'emploi | gratuite |
| **Flux RSS** (optionnel) | Tout site qui propose un flux (Google Alertes, etc.) | — |

On passe uniquement par des API officielles : LinkedIn, Indeed ou Welcome to the Jungle
interdisent l'aspiration automatique de leurs pages et la bloquent. Leurs offres remontent en
grande partie via les agrégateurs ci-dessus. Pour LinkedIn et WTTJ, active en plus leurs
**alertes e-mail** natives.

Chaque source est optionnelle : celles qui n'ont pas de clé sont ignorées. Il en faut au moins une.

## Mise en place (≈ 15 min)

### 1. Obtenir les clés (gratuites)

- **France Travail** : crée un compte sur <https://francetravail.io>, crée une application
  et abonne-la à l'API **« Offres d'emploi v2 »**. Note le *client ID* et le *client secret*.
- **Adzuna** : inscris-toi sur <https://developer.adzuna.com> → *App ID* + *App Key*.
- **Jooble** : demande une clé sur <https://jooble.org/api/about>.

### 2. Créer le webhook Discord

Sur ton serveur Discord : *Paramètres du salon → Intégrations → Webhooks → Nouveau webhook*,
puis *Copier l'URL du webhook*.

### 3. Ajouter les secrets sur GitHub

Dans le dépôt : *Settings → Secrets and variables → Actions → New repository secret* :

| Secret | Valeur |
|---|---|
| `DISCORD_WEBHOOK_URL` | URL du webhook Discord |
| `FRANCE_TRAVAIL_CLIENT_ID` / `FRANCE_TRAVAIL_CLIENT_SECRET` | identifiants France Travail |
| `ADZUNA_APP_ID` / `ADZUNA_APP_KEY` | identifiants Adzuna |
| `JOOBLE_API_KEY` | clé Jooble |

### 4. Activer

Le workflow [`.github/workflows/job-agent.yml`](../.github/workflows/job-agent.yml) tourne
**tous les jours vers 7h (heure de Lyon)**. GitHub n'exécute les tâches planifiées que depuis la
branche par défaut : fusionne cette branche dans `main`. Pour un premier essai :
onglet *Actions → Veille emploi designer graphique Lyon → Run workflow*.

## Personnaliser

Tout se règle dans [`config.js`](config.js) :

- `keywords` : les recherches lancées (graphiste, DA, motion designer, webdesigner…) ;
- `location` : ville, rayon en km, départements (France Travail) ;
- `titleMustMatch` / `titleExclude` : filtre sur le titre pour écarter le bruit ;
- `contractExclude` : par ex. `['stage', 'alternance']` pour ne voir que CDI/CDD/freelance ;
- `rssFeeds` : flux RSS supplémentaires ;
- `maxAgeDays`, `seenRetentionDays`, `discord.notifyWhenEmpty`.

## Lancer en local

```bash
cd job-agent
export ADZUNA_APP_ID=... ADZUNA_APP_KEY=...   # + les autres clés si tu les as
npm run dry-run          # affiche les offres sans rien envoyer ni enregistrer
DISCORD_WEBHOOK_URL=... npm start   # exécution réelle
npm test                 # tests unitaires
```

Node.js ≥ 20, aucune dépendance à installer.

## Fonctionnement

```
config.js ─► sources (France Travail, Adzuna, Jooble, RSS) en parallèle
          ─► filtre (titre, exclusions, contrat, date)
          ─► dédoublonnage (titre + entreprise) et comparaison avec data/seen.json
          ─► Discord + reports/AAAA-MM-JJ.md
          ─► data/seen.json mis à jour (offres oubliées après 60 jours)
```

Si une source tombe en panne, les autres continuent et le message Discord le signale.
