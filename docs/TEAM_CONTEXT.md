# Agri TG — Contexte et alignement équipe

## Objectif du fichier

Ce document donne à chaque collaborateur le contexte du projet, la manière de travailler ensemble, et les informations nécessaires pour que tous les rendus aillent dans le même sens.

---

## 1. Contexte du projet

Agri TG est une plateforme de transparence pour les coopératives agricoles togolaises.

Le projet se compose de deux volets :
- une **vitrine publique** qui présente le problème, le contexte, les bénéfices et la solution blockchain
- une **Phase 2 fonctionnelle** qui démontre un prototype web / mobile pour :
  - tableau de bord coopératif
  - historique des transactions
  - vote transparent
  - expérience membre mobile-like

---

## 2. Vision de la Phase 2

### Ce qu’on livre

1. **Dashboard coopératif**
   - solde global
   - nombre de transactions
   - nombre de propositions / votes

2. **Historique des transactions**
   - date
   - membre
   - type (cotisation, dépense, commission)
   - montant
   - statut
   - catégorie (cotisation vs dépense)

3. **Vote transparent**
   - liste de propositions
   - résultats Oui / Non / Abstention
   - statut des propositions (Ouvert, Clôturé)
   - visualisation des résultats
   - actions de vote interactives

4. **Expérience mobile membre**
   - consultation du solde personnel et coopératif
   - consultation des propositions et résultats
   - participation aux décisions depuis mobile
   - navigation app-like

5. **Intégration avec le simulateur blockchain**
   - chaque transaction certifiée met à jour le dashboard
   - l’historique se remplit automatiquement
   - le solde est recalculé

6. **UI/UX responsive**
   - accessible depuis le menu
   - apparence premium
   - adaptation mobile/tablette

---

## 3. Architecture recommandée

### Organisation des pages

- `index.html` : vitrine publique + introduction de la solution
- `pages/login.html` : page de connexion simulée pour accéder à la Phase 2
- `pages/phase2.html` : espace fonctionnel / dashboard protégé
- `style.css` : style commun
- `script.js` : logique client
- `docs/PHASE2_PLAN.md` : plan de Phase 2 pour l’équipe
- `docs/TEAM_CONTEXT.md` : ce document d’alignement

### Structure du projet

- Rester dans le même dépôt
- Organiser les pages spécifiques dans `pages/`
- Placer les documents de planification dans `docs/`
- La Phase 2 reste une page distincte du site public
- Le mobile est une expérience responsive "app-like" intégrée au site

---

## 4. Stratégie Git

### Branches principales

- `main` : version stable et livrable du site
- `phase2` : branche dédiée au développement de la Phase 2

### Branches feature

Créer des branches courtes et spécifiques depuis `phase2` :
- `phase2/html-structure`
- `phase2/css-ui`
- `phase2/js-logic`
- `phase2/login-protection`
- `phase2/mobile-ux`

### Processus de collaboration

1. `git checkout phase2`
2. Créer une branche feature depuis `phase2`
3. Faire des commits courts et clairs
4. Ouvrir une Pull Request vers `phase2`
5. Une fois approuvée, merger dans `phase2`
6. Quand `phase2` est stable, ouvrir une PR `phase2 -> main`
7. Merge dans `main` après validation

---

## 5. Rôles et répartition des tâches

### Membre 1 — HTML & architecture
- créer les pages `login.html` et `phase2.html`
- construire le dashboard et le tableau de transactions
- définir la structure de l’expérience mobile membre

### Membre 2 — UI / UX design
- styliser la page Phase 2
- créer des vues responsive mobile/tablette
- concevoir l’interface app-like pour les membres
- rendre le site cohérent visuellement

### Membre 3 — JavaScript / logique
- préparer les données de démonstration
- afficher dynamiquement dashboard, transactions et votes
- gérer les actions de vote
- protéger l’accès à Phase 2 avec un login simulé
- synchroniser le simulateur blockchain avec les métriques

### Membre 4 — Contenu / QA / intégration
- rédiger les textes et explications
- vérifier la cohérence avec le brief et le PDF du projet
- tester les parcours utilisateurs web et mobile
- corriger les bugs et proposer des améliorations
- tenir à jour la documentation du projet

---

## 6. Concept mobile

### Ce que signifie "mobile" ici

- ce n’est pas une application native séparée
- c’est une **web app responsive** qui se comporte comme une app
- l’interface doit être pensée pour mobile
- le flux membre doit paraître naturel sur smartphone

### Exemple de comportement souhaité

- écran d’accueil clair
- accès au solde en un coup d’œil
- boutons larges et faciles à toucher
- navigation minimale
- pages ou sections "app-like"

---

## 7. Mise en place locale

### Ouvrir le projet

- Ouvrir le dossier `c:\MesCodes\.vscode\Agri TG` dans VS Code
- Ouvrir `index.html` avec Live Server ou dans le navigateur

### Vérifier la branche

```bash
git branch
```

### Créer une branche feature

```bash
git checkout -b phase2/js-logic
```

### Pousser la branche

```bash
git push -u origin phase2/js-logic
```

---

## 8. Bonnes pratiques

- travailler en petites tâches
- rester aligné sur le plan Phase 2
- éviter les redondances entre web et mobile
- documenter chaque changement important
- valider en équipe avant de merger dans `main`

---

## 9. Ressources utiles

- `README.md` : état actuel et instructions de base
- `PHASE2_PLAN.md` : plan Phase 2 détaillé
- `index.html` : vitrine publique
- `login.html` : page de connexion simulée
- `phase2.html` : page fonctionnelle de la Phase 2
