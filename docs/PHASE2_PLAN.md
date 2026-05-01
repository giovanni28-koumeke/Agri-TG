# Phase 2 - Agri TG

## Objectif principal

La Phase 2 doit démontrer un prototype fonctionnel de la solution blockchain pour les coopératives agricoles, avec une composante web et une composante mobile.

## Ce que la Phase 2 doit livrer

1. Un dashboard coopératif
   - Solde global de la coopérative
   - Nombre total de transactions
   - Nombre de propositions de vote / votes

2. Un historique des transactions
   - Date
   - Membre
   - Type (cotisation, dépense, commission...)
   - Montant
   - Statut
   - Catégorie (cotisation vs dépense)

3. Un mécanisme de vote transparent
   - Liste de propositions
   - Résultats Oui / Non / Abstention
   - Statut de la proposition (Ouvert, Clôturé)
   - Barre de progression ou indicateur de vote
   - Boutons interactifs pour voter

4. Une expérience mobile pour les membres
   - Consultation du solde personnel et du solde coopératif
   - Consultation des propositions et des résultats de vote
   - Participation aux décisions depuis le mobile
   - Interface simple, rapide et cohérente avec la web app

5. Intégration avec la simulation blockchain existante
   - chaque transaction certifiée dans le simulateur met à jour le dashboard
   - l’historique se remplit automatiquement
   - le solde se recalcul automatiquement

6. UI/UX responsive
   - section Phase 2 accessible depuis le menu principal
   - design lisible et premium
   - adaptation mobile/tablette

---

## Organisation recommandée

### Structure du projet

- Rester dans le même projet pour garder une base cohérente
- Ajouter Phase 2 comme une section de `index.html` ou une page distincte `phase2.html`
- Pour le pitch, une seule base est préférable ; on peut ensuite isoler la démo si besoin

### Option privilégiée

- `index.html` = vitrine + section Phase 2
- Menu principal = `Accueil`, `Le problème`, `La solution`, `Phase 2`, `Outil blockchain`

---

## Répartition pour une équipe de 4

### Membre 1 — Architecture & structure web/mobile
- Définir l’architecture de la Phase 2 dans `index.html` ou `phase2.html`
- Construire le dashboard coopératif et le tableau des transactions
- Construire le panneau Vote transparent
- Définir la structure de l’application mobile membre (écrans ou sections dédiées)
- Prévoir une expérience mobile « app-like » : navigation simple, accès direct au solde et aux votes

### Membre 2 — UI / UX design mobile-first
- Styliser la section Phase 2 et les composants du dashboard
- Créer la charte visuelle mobile pour l’application membre
- Mettre en forme le tableau de transactions et les panneaux de vote
- Concevoir des maquettes mobile/tablette et une version web cohérente
- Veiller à l’ergonomie mobile : gros boutons, lisibilité et fluidité de navigation

### Membre 3 — JavaScript / logique & mobile interactions
- Préparer les données de démonstration pour web et mobile
- Générer dynamiquement le dashboard, le tableau et les propositions de vote
- Gérer les votes Oui/Non et l’état des propositions
- Relier le simulateur blockchain au dashboard et au flux mobile
- Mettre à jour automatiquement les métriques et les transactions
- Implémenter le comportement mobile : affichage de l’application membre, filtres et interactions rapides

### Membre 4 — Contenu / QA / intégration mobile
- Rédiger les textes, les statuts et les messages utilisateurs
- Vérifier la cohérence avec le brief et le pitch
- Tester les parcours web et mobile, y compris l’accès au solde et aux votes depuis le mobile
- Valider l’expérience mobile membre et les écrans de démonstration
- Corriger les bugs, proposer des améliorations et documenter le processus

---

## Ordre de réalisation recommandé

1. Structure HTML et menu Phase 2
2. Design et interface mobile
3. Logique JavaScript pour dashboard, transactions et vote
4. Intégration du simulateur blockchain
5. Tests et ajustements responsive
6. Revue finale et validation collective

---

## Conseils pratiques

- Créer une branche Git `phase2`
- Travailler en petits commits : `phase2/html`, `phase2/css`, `phase2/js`, `phase2/content`
- Éviter la duplication de la vitrine : Phase 2 est une extension cohérente du projet
- Préférer une page unique si vous voulez un livrable simple et clair

---

## Résumé rapide

- La Phase 2 est une démonstration fonctionnelle du produit
- Elle complète la vitrine sans la remplacer
- Elle doit inclure une expérience mobile membre
- Chaque membre a une responsabilité précise
