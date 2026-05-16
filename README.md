# Agri TG : Plateforme de Transparence Agricole
  
**Agri TG** est une Progressive Web App (PWA) de nouvelle génération conçue pour ramener la transparence absolue au sein des coopératives agricoles au Togo. En combinant un design immersif, une base de données en temps réel et la puissance de la Blockchain Ethereum, le projet garantit la traçabilité des fonds et des décisions.

---

## 🌟 Fonctionnalités Principales

### 1. Landing Page (Sensibilisation & Présentation)
- **Design Premium & Responsive :** Interface utilisateur moderne (Dark/Light Mode), animations au défilement (IntersectionObserver) et navigation fluide.
- **Simulateur Blockchain :** Un module interactif démontrant le concept d'ancrage de données (hash) pour éduquer les utilisateurs sur le fonctionnement du Web3.

### 2. Tableau de Bord Coopératif (Phase 2)
- **Authentification & Rôles (RBAC) :**
  - **Président** : Accès complet (Gestion des propositions, certification des rapports).
  - **Trésorier** : Saisie et enregistrement des transactions financières.
  - **Membre** : Consultation de l'historique et droit de vote sur les propositions.
- **Temps Réel :** Le solde de la coopérative, l'historique des transactions et les jauges de vote se mettent à jour instantanément sur tous les écrans connectés.
- **Rapports Mensuels :** Génération automatique de bilans financiers complets.

### 3. Architecture Décentralisée & Web3
- **Certification on-chain :** Chaque transaction financière, vote de membre et rapport mensuel génère une signature unique (Hash) ancrée de façon immuable sur le réseau **Ethereum (Testnet Sepolia)**.
- **MetaMask :** Intégration du portefeuille pour permettre aux présidents/trésoriers de signer numériquement les opérations critiques.

---

## 🛠️ Stack Technique

### Frontend (Client-side)
- **HTML5 / CSS3 (Vanilla) :** Interface ultra-légère, flexbox/CSS Grid, variables dynamiques.
- **JavaScript (ES6+) :** Logique métier, gestion d'état, interactions asynchrones.
- **PWA (Progressive Web App) :** Fichier `manifest.json` et Service Worker (`sw.js`) permettant l'installation de l'application sur smartphone.

### Backend (BaaS)
- **Supabase :**
  - **PostgreSQL** : Base de données relationnelle (`transactions`, `propositions`, `votes_membres`, `rapports`).
  - **Realtime** : WebSockets pour la synchronisation des données en direct.
  - **Auth** : Gestion sécurisée des sessions utilisateurs.
  - **RPC & RLS** : Fonctions SQL embarquées et *Row Level Security* pour garantir que les données d'une coopérative restent strictement privées.

### Blockchain (Web3)
- **Ethers.js (v6) :** Bibliothèque pour la communication entre l'interface et la blockchain.
- **Solidity :** Smart Contract `AgriTG.sol` déployé sur Sepolia.

---

## 🚀 Comment lancer le projet ?

Agri TG est monté sans framework complexe de compilation (pas de `npm run build` obligatoire).

### 1. Lancement local
1. Ouvrez le projet dans Visual Studio Code.
2. Lancez l'extension **Live Server** (indispensable pour que le portefeuille MetaMask puisse s'injecter et éviter les blocages de sécurité liés au protocole `file:///`).
3. L'application est accessible sur `http://127.0.0.1:5500/`.

### 2. Configuration Supabase
Dans le fichier `pages/supabaseClient.js`, assurez-vous que les clés d'API (URL et ANON_KEY) correspondent bien à votre instance Supabase.

### 3. Configuration Blockchain
Dans le fichier `blockchain/blockchain.js`, l'adresse du contrat (variable `CONTRACT_ADDRESS`) doit correspondre à votre contrat fraîchement déployé via Remix IDE sur le réseau Sepolia. Prévoyez des Sepolia ETH de test sur votre MetaMask pour signer les transactions.

---

## ✅ Historique des versions récentes
- **v2.0** : Migration de `localStorage` vers **Supabase** (BDD cloud centralisée).
- **v2.1** : Intégration du **Smart Contract** et signature MetaMask.
- **v2.2** : Implémentation du **Realtime** et corrections de synchronisation inter-appareils (gestion des sessions PWA).
- **v2.3** : Ajout du module de **Rapports Mensuels** interactifs.
