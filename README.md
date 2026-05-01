# Agri TG : Plateforme de Transparence Agricole
  
L'objectif de ce projet est de présenter une web application immersive, premium et fonctionnelle (Single Page Application) pour **Agri TG**, démontrant l'apport de la blockchain dans la transparence des coopératives agricoles.

## 🌟 Ce qui a été accompli (Livrable Actuel)

### 1. Interface et Accessibilité (HTML Vanilla)
- Architecture claire et sémantique.
- **Accessibilité (A11y) Complète :** Utilisation réfléchie des `<label>` sur les formulaires pour garantir un parcours visuel et inclusif parfait (les clics sont redirigés avec précision vers les champs de saisie).
- Narration divisée en étapes : Diagnostic du problème, Scénarios d'usage, Solution concrète et Preuve Technique (Simulateur).

### 2. Design Premium & Responsive (CSS)
- **100% Mobile-Friendly :** Le design s'adapte majestueusement aux smartphones et tablettes (breakpoints intelligents, empilement des flexbox/grilles).
- **Navigation Intelligente :** La barre supérieure ("*Sticky Navbar*") flotte discrètement par-dessus le contenu avec son léger ombrage au défilement.
- **Mode Sombre & Clair :** Système avancé de variables CSS modifiant radicalement les fonds, textes, cartes et bordures.
- Défilement fluide intégré aux ancrages HTML (`scroll-behavior: smooth`).

### 3. Interactivité technique (JavaScript)
- **Simulateur Blockchain "Réaliste" :** Contrairement à un formulaire basique, le simulateur intègre une véritable UX technologique. Au clic, le bouton entre en "Mode Minage" (Animation Pulse, Bouton désactivé) incluant un délai asynchrone (2 secondes) simulant le temps de validation du réseau avant de générer le Hash.
- **Micro-Animations fluides :** Ajout de l'API moderne `IntersectionObserver` ; tous le contenu textuel et les cartes d'information glissent et s'estompent gracieusement (Fade-In) lorsque l'utilisateur les atteint dans la page.
- Persistance du choix du thème sombre/clair dans le `localStorage` du navigateur.

## 🚀 Comment lancer le projet ?

Agri TG est monté sur une infrastructure ultra-légère (Pur Vanilla). Il n'y a aucun composant lourd à télécharger, et pas de dépendances complexes (`npm` / Node).

1. Double-cliquez simplement sur le fichier `index.htm` pour l'ouvrir dans Chrome, Safari ou Edge.
2. (Optionnel) Pour l'édition en direct, privilégiez le plug-in *Live Server* dans Visual Studio Code.

> **Attention - Images/Assets :** Pour que la vitrine soit complète visuellement, déposez vos créations Figma/Maquettes dans le dossier `assets/` avec les nomenclatures suivantes :
> - `dashboard.jpeg`
> - `votes.jpeg`
> - `historique.jpeg`
>
> **Organisation du projet :** les documents de planification sont maintenant dans `docs/` et les pages fonctionnelles Phase 2 seront rassemblées dans `pages/`.

## ✅ Rappel des correctifs récents
- Résolution des problèmes d'affichage mobile.
- Activation des animations différées au défilement.
- Réalisme du simulateur blockchain.
- Ajout fonctionnel et esthétique des *Labels* pour formulaires.
- Renommage officiel du projet en **Agri TG**.
