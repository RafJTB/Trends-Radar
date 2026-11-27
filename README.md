# Trend Radar

Prototype front-end : un globe 3D pour explorer **les besoins les plus demandés, pays par pays**, et décider quelle app construire.

> **DÉMO : toutes les données sont fictives.** Aucun backend, aucune API externe, aucun compte.

## Lancer le projet

```bash
npm install
npm run dev
```

Puis ouvre http://localhost:5173.

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Vérification TypeScript + build de production dans `dist/` |
| `npm run preview` | Sert la build de production |
| `npm test` | Tests unitaires (score, cohérence des chiffres) |
| `npm run e2e` | Tests navigateur Playwright (+ accessibilité axe) |
| `npm run data` | Régénère les données fictives (graine fixe, résultat identique) |
| `npm run countries` | Régénère les contours des pays depuis Natural Earth |

## En ligne

Le site est publié sur GitHub Pages à chaque mise à jour de `main` : https://rafjtb.github.io/Trends-Radar/
(workflow `.github/workflows/deploy.yml` : tests unitaires, build, déploiement).

## Stack

React 19, TypeScript, Vite 8, **MapLibre GL JS 6** (projection `globe`), icônes Lucide, police Inter auto-hébergée.
Aucun fond de carte en tuiles : le globe est dessiné à partir des contours **Natural Earth 1:110m** (domaine public), stockés dans `public/data/`. Aucune clé d'API.

## Données

- `src/data/demo-needs.json` : 32 besoins (4 par catégorie), avec leurs critères, des messages et solutions **fictifs**, et **le volume quotidien par pays sur 180 jours**.
- Tous les chiffres affichés (globe, liste, fiche, graphique, infobulle) sont **calculés** à partir de ces séries dans `src/domain/aggregate.ts`. Des tests vérifient qu'ils concordent (somme des pays = total mondial, somme du graphique = volume de la fiche…).
- **Brancher une vraie source** : produire un fichier au format `src/data/types.ts`, ou remplacer `demoSource` dans `src/data/source.ts`.

### Score (sur 100)

| Critère | Poids |
|---|---|
| Douleur | 25 % |
| Croissance | 20 % |
| Faiblesse de la concurrence | 20 % |
| Disposition à payer | 20 % |
| Faisabilité | 15 % |

La croissance est calculée sur la période choisie (7, 30 ou 90 jours) comparée à la période précédente de même durée : −20 % ou moins = 0, +80 % ou plus = 100, linéaire entre les deux. Le score change donc avec la période. Le détail est affiché dans chaque fiche.

## Arborescence

```
scripts/            génération des contours et des données fictives
public/data/        contours des pays et graticule (GeoJSON)
src/data/           types, source de données, données fictives
src/domain/         score, agrégats, catégories, formats
src/state/          état de l'exploration (filtres, sélection)
src/components/     barre du haut, globe, liste, fiche, éléments communs
tests/unit/         Vitest
tests/e2e/          Playwright
```
