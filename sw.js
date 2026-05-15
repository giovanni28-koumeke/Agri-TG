// =========================================================
// AGRI TG — sw.js  (Service Worker)
// Fichier à la RACINE du projet, même niveau que index.html
// =========================================================
//
// COMMENT ÇA MARCHE :
//   install  → met en cache tous les fichiers statiques
//   activate → supprime les anciens caches
//   fetch    → Cache First pour les fichiers du projet
//              Network First pour les polices Google
//              Page offline si tout échoue
//
// POUR FORCER UNE MISE À JOUR → changer CACHE_VERSION

const CACHE_VERSION = 'agritg-v2.1';
const CACHE_STATIC  = CACHE_VERSION + '-static';
const CACHE_DYNAMIC = CACHE_VERSION + '-dynamic';

// =========================================================
// LISTE DES FICHIERS À METTRE EN CACHE
// Chemins relatifs à la racine (là où sw.js est placé)
// =========================================================

const FICHIERS_STATIQUES = [
    // Pages HTML
    './',
    './index.html',
    './pages/login.html',
    './pages/phase2.html',

    // CSS
    './style.css',
    './pages/phase2.css',

    // JavaScript
    './script.js',
    './pages/phase2.js',
    './pages/supabaseClient.js',

    // Manifest PWA
    './manifest.json',

    // Assets images
    './assets/logoAgriTG.jpeg',
    './assets/dashboard.jpeg',
    './assets/historique.jpeg',
    './assets/votes.jpeg',
    './assets/icon-192.png',
    './assets/icon-512.png',
    './assets/phase2/mockups/image.png'
];

// Polices Google — cachées séparément car elles peuvent échouer
// sans connexion lors de la première installation
const POLICES_GOOGLE = [
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@500;600;700;800&display=swap'
];

// =========================================================
// 1. INSTALL — Premier chargement de l'application
// =========================================================

self.addEventListener('install', function(event) {
    console.log('[SW Agri TG] Installation — version :', CACHE_VERSION);

    event.waitUntil(
        caches.open(CACHE_STATIC)
            .then(function(cache) {

                // Mettre en cache les fichiers un par un avec Promise.allSettled
                // allSettled = un fichier manquant ne bloque pas les autres
                var promesses = FICHIERS_STATIQUES.map(function(url) {
                    return cache.add(url)
                        .then(function() {
                            console.log('[SW] Caché :', url);
                        })
                        .catch(function(err) {
                            // On signale l'erreur mais on ne bloque pas l'install
                            console.warn('[SW] Échec cache :', url, '—', err.message);
                        });
                });

                // Tenter les polices Google (optionnel, peut échouer hors ligne)
                var promessesPolices = POLICES_GOOGLE.map(function(url) {
                    return fetch(url, { mode: 'no-cors' })
                        .then(function(response) {
                            return cache.put(url, response);
                        })
                        .catch(function() {
                            console.warn('[SW] Fonte Google non mise en cache (hors ligne ?)');
                        });
                });

                return Promise.all(promesses.concat(promessesPolices));
            })
            .then(function() {
                console.log('[SW Agri TG] Installation complète. skipWaiting…');
                // Activer immédiatement — pas besoin de fermer l'onglet
                return self.skipWaiting();
            })
    );
});

// =========================================================
// 2. ACTIVATE — Nettoyage des anciens caches
// =========================================================

self.addEventListener('activate', function(event) {
    console.log('[SW Agri TG] Activation — nettoyage des anciens caches…');

    event.waitUntil(
        caches.keys()
            .then(function(tousLesCaches) {
                return Promise.all(
                    tousLesCaches
                        .filter(function(nom) {
                            // Supprimer uniquement les caches Agri TG périmés
                            return nom.startsWith('agritg-') &&
                                   nom !== CACHE_STATIC &&
                                   nom !== CACHE_DYNAMIC;
                        })
                        .map(function(nom) {
                            console.log('[SW] Suppression ancien cache :', nom);
                            return caches.delete(nom);
                        })
                );
            })
            .then(function() {
                console.log('[SW Agri TG] Activation complète. Contrôle de tous les onglets.');
                // Prendre le contrôle de tous les onglets sans reload
                return self.clients.claim();
            })
    );
});

// =========================================================
// 3. FETCH — Interception de toutes les requêtes réseau
// =========================================================
//
// Stratégies appliquées :
//
//  Fichiers du projet      → CACHE FIRST
//    On sert depuis le cache. Si absent, on va sur le réseau
//    et on sauvegarde le résultat pour la prochaine fois.
//
//  Polices Google Fonts    → NETWORK FIRST
//    On essaie le réseau pour avoir la version fraîche.
//    Si hors ligne, on sert depuis le cache.
//
//  Autres domaines tiers   → ON LAISSE PASSER (pas de cache)
//

self.addEventListener('fetch', function(event) {

    var request = event.request;
    var url     = new URL(request.url);

    // ── Ignorer les requêtes non-GET (POST, PUT…) ─────────
    if (request.method !== 'GET') return;

    // ── Ignorer les protocoles non-http ───────────────────
    // (chrome-extension://, data:, etc.)
    if (!url.protocol.startsWith('http')) return;

    // ── Polices Google → Network First ────────────────────
    if (url.hostname === 'fonts.googleapis.com' ||
        url.hostname === 'fonts.gstatic.com') {

        event.respondWith(
            fetch(request)
                .then(function(reponseReseau) {
                    // Mettre en cache la réponse fraîche
                    var clone = reponseReseau.clone();
                    caches.open(CACHE_DYNAMIC).then(function(cache) {
                        cache.put(request, clone);
                    });
                    return reponseReseau;
                })
                .catch(function() {
                    // Hors ligne → servir depuis le cache
                    return caches.match(request);
                })
        );
        return;
    }

    // ── Fichiers du projet → Cache First ──────────────────
    if (url.origin === self.location.origin) {

        event.respondWith(
            caches.match(request)
                .then(function(reponseCache) {

                    // Trouvé dans le cache → réponse immédiate
                    if (reponseCache) {
                        return reponseCache;
                    }

                    // Pas dans le cache → réseau
                    return fetch(request)
                        .then(function(reponseReseau) {

                            // Vérifier que la réponse est valide
                            if (!reponseReseau || reponseReseau.status !== 200) {
                                return reponseReseau;
                            }

                            // Mettre en cache dynamique pour la prochaine fois
                            var clone = reponseReseau.clone();
                            caches.open(CACHE_DYNAMIC).then(function(cache) {
                                cache.put(request, clone);
                            });

                            return reponseReseau;
                        })
                        .catch(function() {
                            // ── HORS LIGNE et pas dans le cache ──────────

                            var accept = request.headers.get('Accept') || '';

                            // Page HTML → rediriger vers index.html
                            if (accept.includes('text/html')) {
                                return caches.match('./index.html')
                                    .then(function(page) {
                                        return page || pageOfflineFallback();
                                    });
                            }

                            // Image → placeholder SVG vert Agri TG
                            if (accept.includes('image')) {
                                return imagePlaceholder();
                            }

                            // Autre → réponse vide 503
                            return new Response('Ressource indisponible hors ligne.', {
                                status: 503,
                                headers: { 'Content-Type': 'text/plain; charset=utf-8' }
                            });
                        });
                })
        );
        return;
    }

    // ── Tous les autres domaines → laisser passer ─────────
    // (pas de mise en cache pour les APIs tierces)
});

// =========================================================
// 4. PAGE OFFLINE DE SECOURS
// =========================================================

function pageOfflineFallback() {
    var html = '<!DOCTYPE html>' +
    '<html lang="fr">' +
    '<head>' +
        '<meta charset="UTF-8">' +
        '<meta name="viewport" content="width=device-width,initial-scale=1">' +
        '<title>Agri TG — Hors ligne</title>' +
        '<style>' +
            'body{font-family:Inter,sans-serif;background:#070B09;color:#E2E8F0;' +
                 'display:flex;flex-direction:column;align-items:center;' +
                 'justify-content:center;min-height:100vh;margin:0;padding:2rem;' +
                 'text-align:center;}' +
            '.icon{font-size:3rem;margin-bottom:1rem;}' +
            'h1{font-size:1.5rem;color:#22c55e;margin-bottom:0.5rem;}' +
            'p{color:#94A3B8;font-size:0.95rem;max-width:320px;line-height:1.6;}' +
            'button{margin-top:1.5rem;padding:0.8rem 1.5rem;' +
                   'background:#22c55e;color:#070B09;border:none;' +
                   'border-radius:8px;font-size:0.95rem;font-weight:700;' +
                   'cursor:pointer;}' +
        '</style>' +
    '</head>' +
    '<body>' +
        '<div class="icon">🌿</div>' +
        '<h1>Agri TG</h1>' +
        '<p>Vous êtes hors ligne. Les données déjà consultées restent disponibles.</p>' +
        '<button onclick="window.location.reload()">Réessayer</button>' +
    '</body>' +
    '</html>';

    return new Response(html, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
}

// =========================================================
// 5. IMAGE PLACEHOLDER HORS LIGNE
// =========================================================

function imagePlaceholder() {
    var svg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120">' +
            '<rect width="200" height="120" fill="#111513" rx="8"/>' +
            '<text x="100" y="55" text-anchor="middle" ' +
                  'font-family="Inter,sans-serif" font-size="11" fill="#4B5563">' +
                'Image indisponible' +
            '</text>' +
            '<text x="100" y="72" text-anchor="middle" ' +
                  'font-size="18">🌿</text>' +
        '</svg>';

    return new Response(svg, {
        status: 200,
        headers: { 'Content-Type': 'image/svg+xml' }
    });
}

// =========================================================
// 6. MESSAGES DEPUIS LA PAGE (contrôle du SW)
// =========================================================

self.addEventListener('message', function(event) {
    if (!event.data) return;

    // Forcer l'activation immédiate d'une nouvelle version
    if (event.data.type === 'SKIP_WAITING') {
        console.log('[SW Agri TG] Mise à jour forcée.');
        self.skipWaiting();
    }

    // Vider tout le cache (utile en développement)
    if (event.data.type === 'CLEAR_CACHE') {
        caches.keys().then(function(noms) {
            Promise.all(noms.map(function(nom) {
                return caches.delete(nom);
            })).then(function() {
                console.log('[SW Agri TG] Cache entièrement vidé.');
                if (event.ports && event.ports[0]) {
                    event.ports[0].postMessage({ success: true });
                }
            });
        });
    }
});

// =========================================================
// FIN — sw.js Agri TG v2.0
// =========================================================
