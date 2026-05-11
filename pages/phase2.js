// =========================================================
// AGRI TG — pages/phase2.js  (version finale)
// =========================================================

document.addEventListener('DOMContentLoaded', () => {

    // =====================================================
    // 1. CONSTANTES & ÉTAT GLOBAL
    // =====================================================

    const STORAGE_KEY = 'agritg_blockchain_transactions';
    const SESSION_KEY = 'agritg_session';

    // ── Données de démo (affichées si localStorage vide) ──
    const DEMO_TRANSACTIONS = [
        {
            id: 'demo_1', bloc: 0, hash: '0x3f7a9c4d1e2b8fa0',
            membre: 'AMAVI Jojo', montant: 500000, type: 'cotisation',
            timestamp: Date.now() - 3 * 86400000,
            date: '09 Mai 2026, 09:14', certifie: true
        },
        {
            id: 'demo_2', bloc: 0, hash: '0xb2e1f5a044fa3c91',
            membre: 'KOMI Hervé', montant: -70000, type: 'depense',
            timestamp: Date.now() - 5 * 86400000,
            date: '07 Mai 2026, 14:30', certifie: true
        },
        {
            id: 'demo_3', bloc: 0, hash: '0x9c4d2f7e01bc88a3',
            membre: 'KOMA Ablavi', montant: 250000, type: 'prime',
            timestamp: Date.now() - 2 * 86400000,
            date: '10 Mai 2026, 08:00', certifie: true
        },
        {
            id: 'demo_4', bloc: 0, hash: '0x5d2c1bc7f09a33b8',
            membre: 'KASSA Junior', montant: 300000, type: 'cotisation',
            timestamp: Date.now() - 7 * 86400000,
            date: '05 Mai 2026, 08:45', certifie: true
        },
        {
            id: 'demo_5', bloc: 0, hash: '0x1a8be301f09a6d72',
            membre: 'SASSOU Komi', montant: -45000, type: 'depense',
            timestamp: Date.now() - 6 * 86400000,
            date: '06 Mai 2026, 11:22', certifie: true
        }
    ];

    // =====================================================
    // 2. SESSION — lecture & adaptation de l'UI
    // =====================================================

    let session = null;
    try {
        const raw = sessionStorage.getItem(SESSION_KEY);
        if (raw) session = JSON.parse(raw);
    } catch (e) { }

    // ── Mettre à jour le header avec le vrai nom/initiales ─
    if (session) {
        const headerNom = document.querySelector('.user-name');
        const headerInitials = document.querySelector('.avatar-circle');
        if (headerNom) headerNom.textContent = session.nom;
        if (headerInitials) headerInitials.textContent = session.initiales;

        // Badge de rôle à côté du nom
        const userProfile = document.querySelector('.user-profile');
        if (userProfile && !document.getElementById('role-badge')) {
            const colors = {
                membre: { bg: 'rgba(59,130,246,0.15)', color: '#3B82F6', border: 'rgba(59,130,246,0.3)' },
                tresorier: { bg: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: 'rgba(245,158,11,0.3)' },
                president: { bg: 'rgba(16,185,129,0.15)', color: '#10B981', border: 'rgba(16,185,129,0.3)' }
            };
            const labels = {
                membre: '👤 Membre', tresorier: '💰 Trésorier', president: '🏛️ Président'
            };
            const c = colors[session.role] || colors.membre;
            const badge = document.createElement('span');
            badge.id = 'role-badge';
            badge.textContent = labels[session.role] || session.role;
            badge.style.cssText = [
                'font-size:0.7rem', 'font-weight:700',
                'padding:2px 8px', 'border-radius:20px',
                'margin-left:6px',
                'background:' + c.bg,
                'color:' + c.color,
                'border:1px solid ' + c.border
            ].join(';');
            userProfile.appendChild(badge);
        }

        // ── Bandeau de rôle dans le contenu ────────────────
        const appContent = document.querySelector('.app-content');
        if (appContent && !document.getElementById('role-banner')) {
            const droits = {
                membre: 'Vous pouvez consulter le solde, l\'historique et voter.',
                tresorier: 'Vous pouvez enregistrer des transactions et consulter les rapports.',
                president: 'Accès complet : transactions, votes, rapports et gestion des membres.'
            };
            const bColors = {
                membre: { bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.25)', color: '#3B82F6' },
                tresorier: { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', color: '#F59E0B' },
                president: { bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.25)', color: '#10B981' }
            };
            const icons = { membre: '👤', tresorier: '💰', president: '🏛️' };
            const bc = bColors[session.role] || bColors.membre;
            const banner = document.createElement('div');
            banner.id = 'role-banner';
            banner.style.cssText = [
                'display:flex', 'align-items:center', 'gap:10px',
                'padding:10px 14px', 'margin-bottom:16px',
                'border-radius:8px', 'font-size:0.83rem',
                'background:' + bc.bg,
                'border:1px solid ' + bc.border,
                'color:' + bc.color, 'font-weight:500'
            ].join(';');
            banner.innerHTML =
                '<span>' + (icons[session.role] || '👤') + '</span>' +
                '<strong style="text-transform:capitalize">' + session.role + '</strong>' +
                ' — ' + (droits[session.role] || '');
            appContent.insertBefore(banner, appContent.firstChild);
        }

        // ── Permissions selon le rôle ───────────────────────
        applyRolePermissions(session.role);
    }

    // ── Déconnexion ────────────────────────────────────────
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', function (e) {
            e.preventDefault();
            if (confirm('Voulez-vous vous déconnecter ?')) {
                sessionStorage.removeItem(SESSION_KEY);
                window.location.href = 'login.html';
            }
        });
    }

    function applyRolePermissions(role) {
        const btnNewTx = document.getElementById('btn-new-tx');
        // "Nouvelle proposition" est le 2ème lien .nav-item.outline
        const outlineLinks = document.querySelectorAll('.nav-item.outline');
        const btnNewProposal = outlineLinks.length >= 2 ? outlineLinks[1] : null;

        function grise(el, msg) {
            if (!el) return;
            el.style.opacity = '0.35';
            el.style.cursor = 'not-allowed';
            el.title = msg;
            el.addEventListener('click', function (e) {
                e.preventDefault();
                showPermissionAlert(msg);
            });
        }

        if (role === 'membre') {
            grise(btnNewTx, '⛔ Réservé au trésorier.');
            grise(btnNewProposal, '⛔ Réservé au président.');
        } else if (role === 'tresorier') {
            grise(btnNewProposal, '⛔ Réservé au président.');
        }
        // president → aucune restriction
    }

    // =====================================================
    // 3. TRANSACTIONS — lecture localStorage + démo
    // =====================================================

    function getAllTransactions() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            const stored = raw ? JSON.parse(raw) : [];
            return [...stored, ...DEMO_TRANSACTIONS];
        } catch (e) {
            return DEMO_TRANSACTIONS;
        }
    }

    // =====================================================
    // 4. CALCUL DES MÉTRIQUES
    // =====================================================

    function calcMetrics(transactions) {
        let solde = 0, entrees = 0, sorties = 0;
        transactions.forEach(tx => {
            const m = parseFloat(tx.montant) || 0;
            if (m >= 0) { solde += m; entrees += m; }
            else { solde += m; sorties += Math.abs(m); }
        });
        return { solde, entrees, sorties, nbTx: transactions.length };
    }

    // =====================================================
    // 5. MISE À JOUR DE L'INTERFACE
    // =====================================================

    function updateSoldeDisplay(solde) {
        // Cible exacte : .balance-info h2 dans phase2.html
        const el = document.querySelector('.balance-info h2');
        if (!el) return;
        el.textContent = solde.toLocaleString('fr-FR') + ' CFA';
        el.style.transition = 'color 0.3s';
        el.style.color = '#22c55e';
        setTimeout(() => { el.style.color = ''; }, 1500);
    }

    function updateStatBoxes(metrics) {
        // Les 4 .stat-info strong dans l'ordre du HTML :
        // [0] Membres actifs  [1] Transactions  [2] Certifiés  [3] Votes actifs
        const strongs = document.querySelectorAll('.stat-info strong');
        if (strongs[1]) strongs[1].textContent = metrics.nbTx;
        if (strongs[2]) strongs[2].textContent = metrics.nbTx;
    }

    // =====================================================
    // 6. RENDU DE L'HISTORIQUE DES TRANSACTIONS
    // =====================================================

    function getTxStyle(type, montant) {
        const m = parseFloat(montant);
        if (m < 0 || type === 'depense') return { color: 'text-red', signe: '-', label: 'Dépense' };
        if (type === 'prime') return { color: 'text-green', signe: '+', label: 'Prime' };
        if (type === 'achat') return { color: 'text-red', signe: '-', label: 'Achat groupé' };
        return { color: 'text-green', signe: '+', label: 'Cotisation' };
    }

    function getInitials(name) {
        return (name || '??').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    }

    function buildTxRow(tx, isNew) {
        const m = parseFloat(tx.montant);
        const style = getTxStyle(tx.type, m);
        const montantAbs = Math.abs(m).toLocaleString('fr-FR');
        const signe = m >= 0 ? '+' : '-';
        const hashShort = tx.hash ? tx.hash.slice(0, 10) + '…' : '—';
        const highlight = isNew
            ? 'background:#f0fdf4;border-left:3px solid #22c55e;border-radius:6px;'
            : '';

        return '<div class="tx-item" data-type="' + tx.type + '" style="' + highlight + '">' +
            '<div class="tx-user">' +
            '<div class="avatar-sm" style="' +
            'background:' + (m >= 0 ? '#dcfce7' : '#fee2e2') + ';' +
            'color:' + (m >= 0 ? '#166534' : '#7f1d1d') + ';' +
            'display:flex;align-items:center;justify-content:center;' +
            'font-size:9px;font-weight:700;border-radius:50%;">' +
            getInitials(tx.membre) +
            '</div>' +
            '<span>' + tx.membre + '</span>' +
            '</div>' +
            '<div class="tx-desc" title="Hash: ' + (tx.hash || '—') + '">' +
            style.label +
            '<span style="font-size:0.7rem;color:#9ca3af;display:block;font-family:monospace;">' +
            hashShort +
            '</span>' +
            '</div>' +
            '<div class="tx-amount ' + style.color + '">' + signe + montantAbs + ' CFA</div>' +
            '<div class="tx-time">' + (tx.date || '—') + '</div>' +
            '</div>';
    }

    function renderTransactionList(transactions) {
        const list = document.querySelector('.transaction-list');
        if (!list) return;
        if (!transactions.length) {
            list.innerHTML = '<p style="text-align:center;color:#9ca3af;padding:2rem;">Aucune transaction enregistrée.</p>';
            return;
        }
        list.innerHTML = transactions.slice(0, 8).map(tx => buildTxRow(tx, false)).join('');
    }

    // =====================================================
    // 7. INITIALISATION DU DASHBOARD
    // =====================================================

    function initDashboard() {
        const allTx = getAllTransactions();
        const metrics = calcMetrics(allTx);
        updateSoldeDisplay(metrics.solde);
        updateStatBoxes(metrics);
        renderTransactionList(allTx);
    }

    initDashboard();

    // =====================================================
    // 8. MISE À JOUR EN TEMPS RÉEL (autre onglet)
    // =====================================================

    window.addEventListener('storage', function (event) {
        if (event.key !== STORAGE_KEY) return;

        const allTx = getAllTransactions();
        const metrics = calcMetrics(allTx);
        updateSoldeDisplay(metrics.solde);
        updateStatBoxes(metrics);

        try {
            const newList = JSON.parse(event.newValue) || [];
            if (newList.length > 0) {
                const list = document.querySelector('.transaction-list');
                if (list) {
                    list.insertAdjacentHTML('afterbegin', buildTxRow(newList[0], true));
                    showToast('✓ Nouvelle transaction certifiée sur la blockchain !');
                    setTimeout(function () {
                        const first = list.querySelector('.tx-item');
                        if (first) first.removeAttribute('style');
                    }, 3000);
                }
            }
        } catch (e) { }
    });

    // =====================================================
    // 9. FILTRES TOUT / ENTRER / SORTIE
    // =====================================================

    document.querySelectorAll('.filter-tabs button').forEach(function (btn) {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.filter-tabs button')
                .forEach(function (b) { b.classList.remove('active'); });
            btn.classList.add('active');

            const label = btn.textContent.trim().toLowerCase();
            const allTx = getAllTransactions();
            let filtered;

            if (label === 'entrées' || label === 'entrees' || label === 'entrer') {
                filtered = allTx.filter(tx => parseFloat(tx.montant) > 0);
            } else if (label === 'sorties' || label === 'sortie') {
                filtered = allTx.filter(tx => parseFloat(tx.montant) < 0);
            } else {
                filtered = allTx;
            }

            renderTransactionList(filtered);
        });
    });

    // =====================================================
    // 10. BOUTON "NOUVELLE TRANSACTION"
    // =====================================================

    const btnNewTx = document.getElementById('btn-new-tx');

    if (btnNewTx) {
        btnNewTx.addEventListener('click', function (e) {
            e.preventDefault();

            // Vérification de permission (sécurité côté client)
            if (session && session.role === 'membre') {
                showPermissionAlert('⛔ Seul le trésorier peut enregistrer des transactions.');
                return;
            }

            const membres = ['AGBO Kofi', 'DOVI Mawuli', 'GBAFA Akosua', 'LAWSON Edem', 'MENSAH Afi'];
            const types = ['cotisation', 'prime'];
            const membre = membres[Math.floor(Math.random() * membres.length)];
            const type = types[Math.floor(Math.random() * types.length)];
            const montant = (Math.floor(Math.random() * 40) + 1) * 10000;

            const chars = '0123456789abcdef';
            let hash = '0x';
            for (let i = 0; i < 16; i++) hash += chars[Math.floor(Math.random() * chars.length)];

            const now = Date.now();
            const newTx = {
                id: 'tx_' + now,
                bloc: Math.floor(Math.random() * 900) + 100,
                hash: hash,
                membre: membre,
                montant: montant,
                type: type,
                timestamp: now,
                date: new Date(now).toLocaleDateString('fr-FR', {
                    day: '2-digit', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                }),
                certifie: true
            };

            try {
                const raw = localStorage.getItem(STORAGE_KEY);
                const stored = raw ? JSON.parse(raw) : [];
                stored.unshift(newTx);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
            } catch (e) { }

            const list = document.querySelector('.transaction-list');
            if (list) list.insertAdjacentHTML('afterbegin', buildTxRow(newTx, true));

            const metrics = calcMetrics(getAllTransactions());
            updateSoldeDisplay(metrics.solde);
            updateStatBoxes(metrics);

            showToast('✓ Transaction certifiée on-chain !');
        });
    }

    // =====================================================
    // 11. VOTE BLOCKCHAIN — OUI et NON complets
    // =====================================================

    // Sélecteurs calqués sur le HTML exact :
    //   <button class="btn-vote btn-yes" id="btn-vote-yes">
    //   <button class="btn-vote btn-no">
    //   <div class="bar-green" style="width:75%">
    const btnVoteYes = document.getElementById('btn-vote-yes');
    const btnVoteNo = document.querySelector('.btn-no');
    const progressBar = document.querySelector('.bar-green');

    let votesOui = 15;
    let votesNon = 5;
    let aVote = false;

    function genHash(len) {
        const chars = '0123456789abcdef';
        let h = '0x';
        for (let i = 0; i < (len || 16); i++)
            h += chars[Math.floor(Math.random() * chars.length)];
        return h;
    }

    // ── Recalcule et affiche les % + la barre ─────────────
    function updateVoteUI() {
        const total = votesOui + votesNon;
        const pctOui = Math.round((votesOui / total) * 100);
        const pctNon = 100 - pctOui;

        // Barre de progression
        if (progressBar) {
            progressBar.style.transition = 'width 0.6s ease';
            progressBar.style.width = pctOui + '%';
        }

        // Labels .vote-label (ordre DOM : [0]=Oui, [1]=Non)
        const labels = document.querySelectorAll('.vote-label');
        if (labels[0]) labels[0].innerHTML = 'Oui<br><small>' + votesOui + ' votes</small>';
        if (labels[1]) labels[1].innerHTML = 'Non<br><small>' + votesNon + ' votes</small>';

        // Résumé dans .vote-meta
        const voteMeta = document.querySelector('.vote-meta');
        if (voteMeta) {
            voteMeta.innerHTML =
                '<span style="color:#22c55e;font-weight:700;">' + pctOui + '% Oui (' + votesOui + ')</span>' +
                ' &nbsp;·&nbsp; ' +
                '<span style="color:#ef4444;font-weight:700;">' + pctNon + '% Non (' + votesNon + ')</span>' +
                ' &nbsp;·&nbsp; ' +
                '<span style="color:#6b7280;">' + total + ' participants</span>';
        }
    }

    function processVote(choix) {
        if (aVote) {
            // Afficher le message "déjà voté" sans en empiler plusieurs
            if (!document.getElementById('vote-already-msg')) {
                const msg = document.createElement('p');
                msg.id = 'vote-already-msg';
                msg.style.cssText = 'font-size:0.8rem;color:#f59e0b;text-align:center;margin-top:8px;font-weight:600;';
                msg.textContent = '⚠ Vous avez déjà voté sur cette proposition.';
                const section = document.querySelector('.vote-progress-section');
                if (section) section.appendChild(msg);
            }
            return;
        }
        aVote = true;

        // ── État "minage" ────────────────────────────────────
        [btnVoteYes, btnVoteNo].forEach(function (btn) {
            if (!btn) return;
            btn.disabled = true;
            btn.textContent = '⏳';
            btn.style.opacity = '0.6';
        });

        setTimeout(function () {
            const hash = genHash(12);
            const bloc = Math.floor(Math.random() * 9000) + 1000;
            const heure = new Date().toLocaleTimeString('fr-FR');

            // Incrémenter le compteur
            if (choix === 'oui') votesOui++;
            else votesNon++;

            updateVoteUI();

            // ── Bouton choisi → confirmation colorée ─────────
            if (choix === 'oui' && btnVoteYes) {
                btnVoteYes.textContent = '✓ Voté Oui';
                btnVoteYes.style.cssText =
                    'background:#166534;color:#fff;opacity:1;' +
                    'border:2px solid #22c55e;font-weight:700;cursor:default;';
            }
            if (choix === 'non' && btnVoteNo) {
                btnVoteNo.textContent = '✓ Voté Non';
                btnVoteNo.style.cssText =
                    'background:#7f1d1d;color:#fff;opacity:1;' +
                    'border:2px solid #ef4444;font-weight:700;cursor:default;';
            }

            // ── Bouton non choisi → grisé définitivement ─────
            if (choix === 'oui' && btnVoteNo) {
                btnVoteNo.textContent = 'Non';
                btnVoteNo.style.cssText = 'opacity:0.3;cursor:not-allowed;';
            }
            if (choix === 'non' && btnVoteYes) {
                btnVoteYes.textContent = 'Oui';
                btnVoteYes.style.cssText = 'opacity:0.3;cursor:not-allowed;';
            }

            // ── Encadré "certifié on-chain" ───────────────────
            const section = document.querySelector('.vote-progress-section');
            if (section) {
                const old = section.querySelector('.vote-hash-result');
                if (old) old.remove();

                const box = document.createElement('div');
                box.className = 'vote-hash-result';
                box.style.cssText = [
                    'margin-top:12px', 'padding:8px 12px',
                    'background:#052e16', 'border:1px solid #166534',
                    'border-radius:6px', 'font-size:0.75rem',
                    'font-family:monospace', 'color:#86efac', 'line-height:1.8'
                ].join(';');

                box.innerHTML =
                    '<span style="color:#22c55e;font-weight:700;">✓ Vote certifié on-chain</span><br>' +
                    'Hash &nbsp; : ' + hash + '<br>' +
                    'Bloc &nbsp; : #' + bloc + '<br>' +
                    'Choix &nbsp;: <strong style="color:' +
                    (choix === 'oui' ? '#22c55e' : '#ef4444') + ';">' +
                    choix.toUpperCase() + '</strong><br>' +
                    'Heure &nbsp;: ' + heure;

                section.appendChild(box);
            }

            // ── Toast de confirmation ─────────────────────────
            const couleur = choix === 'oui' ? '#166534' : '#7f1d1d';
            const bordure = choix === 'oui' ? '#22c55e' : '#ef4444';
            const t = document.createElement('div');
            t.id = 'vote-toast';
            t.style.cssText = [
                'position:fixed', 'bottom:80px', 'left:50%',
                'transform:translateX(-50%)',
                'background:' + couleur,
                'border:1px solid ' + bordure,
                'color:#fff', 'padding:10px 20px',
                'border-radius:8px', 'font-size:0.85rem',
                'font-weight:600', 'z-index:99999',
                'box-shadow:0 4px 15px rgba(0,0,0,0.25)',
                'white-space:nowrap'
            ].join(';');
            t.textContent = '✓ Vote ' + choix.toUpperCase() + ' enregistré — ' + hash.slice(0, 12) + '…';
            document.body.appendChild(t);
            setTimeout(function () {
                t.style.opacity = '0';
                t.style.transition = 'opacity 0.5s';
                setTimeout(function () { t.remove(); }, 500);
            }, 3500);

        }, 2000); // Délai simulé "Proof of Work"
    }

    if (btnVoteYes) btnVoteYes.addEventListener('click', function () { processVote('oui'); });
    if (btnVoteNo) btnVoteNo.addEventListener('click', function () { processVote('non'); });

    updateVoteUI(); // Initialiser les compteurs dès le chargement

    // =====================================================
    // 12. MODALE SIMULATEUR MOBILE
    // =====================================================

    const btnDemoMobile = document.getElementById('btn-demo-mobile');
    const mobileModal = document.getElementById('mobile-demo-modal');
    const closeMobileBtn = document.getElementById('close-mobile-demo');

    if (btnDemoMobile && mobileModal) {
        btnDemoMobile.addEventListener('click', function (e) {
            e.preventDefault();
            mobileModal.style.display = 'flex';
        });
        if (closeMobileBtn) {
            closeMobileBtn.addEventListener('click', function () {
                mobileModal.style.display = 'none';
            });
        }
        mobileModal.addEventListener('click', function (e) {
            if (e.target === mobileModal) mobileModal.style.display = 'none';
        });
    }

    // =====================================================
    // 13. TOAST GÉNÉRIQUE
    // =====================================================

    function showToast(message) {
        const old = document.getElementById('agritg-toast');
        if (old) old.remove();
        const t = document.createElement('div');
        t.id = 'agritg-toast';
        t.textContent = message;
        t.style.cssText = [
            'position:fixed', 'bottom:90px', 'left:50%',
            'transform:translateX(-50%)',
            'background:#166534', 'color:#fff',
            'padding:10px 20px', 'border-radius:8px',
            'font-size:0.85rem', 'font-weight:600',
            'z-index:99999', 'box-shadow:0 4px 15px rgba(0,0,0,0.2)',
            'white-space:nowrap'
        ].join(';');
        document.body.appendChild(t);
        setTimeout(function () {
            t.style.opacity = '0';
            t.style.transition = 'opacity 0.5s';
            setTimeout(function () { t.remove(); }, 500);
        }, 3000);
    }

    // =====================================================
    // 14. ALERTE PERMISSION REFUSÉE
    // =====================================================

    function showPermissionAlert(msg) {
        const old = document.getElementById('permission-alert');
        if (old) old.remove();
        const el = document.createElement('div');
        el.id = 'permission-alert';
        el.style.cssText = [
            'position:fixed', 'top:80px', 'left:50%',
            'transform:translateX(-50%)',
            'background:#450a0a', 'border:1px solid #ef4444',
            'color:#fca5a5', 'padding:10px 20px',
            'border-radius:8px', 'font-size:0.85rem',
            'font-weight:600', 'z-index:99999',
            'box-shadow:0 4px 15px rgba(0,0,0,0.25)',
            'max-width:90vw', 'text-align:center'
        ].join(';');
        el.textContent = msg;
        document.body.appendChild(el);
        setTimeout(function () {
            el.style.opacity = '0';
            el.style.transition = 'opacity 0.5s';
            setTimeout(function () { el.remove(); }, 500);
        }, 3000);
    }

    // =====================================================
    // 15. RACCOURCI RESET (Ctrl+Shift+R) — mode dev
    // =====================================================

    document.addEventListener('keydown', function (e) {
        if (e.ctrlKey && e.shiftKey && e.key === 'R') {
            e.preventDefault();
            if (confirm('Réinitialiser toutes les transactions simulées ?')) {
                localStorage.removeItem(STORAGE_KEY);
                initDashboard();
                showToast('Données réinitialisées.');
            }
        }
    });

});
