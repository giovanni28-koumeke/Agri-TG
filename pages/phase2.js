// =========================================================
// AGRI TG — pages/phase2.js  (version Supabase)
// localStorage remplacé par Supabase PostgreSQL
// Realtime : dashboard mis à jour sur tous les appareils
// =========================================================
//
// INSTALLATION :
//   1. Dans Supabase → Settings → API → copier :
//        Project URL  →  SUPABASE_URL ci-dessous
//        anon key     →  SUPABASE_ANON_KEY ci-dessous
//   2. Remplacer les deux valeurs dans la section CONFIG
//   3. Dans phase2.html, ajouter AVANT </head> :
//      <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
// =========================================================

document.addEventListener('DOMContentLoaded', async () => {

    // =====================================================
    // 0. CONFIG SUPABASE
    // =====================================================

    // Utilisation du client Supabase global (défini dans supabaseClient.js)
    const supabase = window.supabaseClient;

    // =====================================================
    // 1. CONSTANTES & ÉTAT GLOBAL
    // =====================================================

    const SESSION_KEY = 'agritg_session';

    // État courant (remplace localStorage)
    let state = {
        transactions: [],
        propositions: [],
        dashboard: null,
        cooperative_id: null,
        membre_id: null,
        chargement: true
    };

    // =====================================================
    // 2. SESSION — lecture & auth Supabase
    // =====================================================

    let session = null;
    try {
        const raw = sessionStorage.getItem(SESSION_KEY);
        if (raw) session = JSON.parse(raw);
    } catch (e) { }

    if (session) {
        state.cooperative_id = session.cooperative_id || null;
        state.membre_id = session.id || null;

        // Mettre à jour le header
        const headerNom = document.querySelector('.user-name');
        const headerInitials = document.querySelector('.avatar-circle');
        if (headerNom) headerNom.textContent = session.nom;
        if (headerInitials) headerInitials.textContent = session.initiales;

        // Badge rôle
        const userProfile = document.querySelector('.user-profile');
        if (userProfile && !document.getElementById('role-badge')) {
            const colors = {
                membre: { bg: 'rgba(59,130,246,0.15)', color: '#3B82F6', border: 'rgba(59,130,246,0.3)' },
                tresorier: { bg: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: 'rgba(245,158,11,0.3)' },
                president: { bg: 'rgba(16,185,129,0.15)', color: '#10B981', border: 'rgba(16,185,129,0.3)' }
            };
            const labels = { membre: '👤 Membre', tresorier: '💰 Trésorier', president: '🏛️ Président' };
            const c = colors[session.role] || colors.membre;
            const badge = document.createElement('span');
            badge.id = 'role-badge';
            badge.textContent = labels[session.role] || session.role;
            badge.style.cssText = [
                'font-size:0.7rem', 'font-weight:700', 'padding:2px 8px',
                'border-radius:20px', 'margin-left:6px',
                'background:' + c.bg, 'color:' + c.color, 'border:1px solid ' + c.border
            ].join(';');
            userProfile.appendChild(badge);
        }

        // Bandeau de rôle
        const appContent = document.querySelector('.app-content');
        if (appContent && !document.getElementById('role-banner')) {
            const droits = {
                membre: "Vous pouvez consulter le solde, l'historique et voter.",
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
                'background:' + bc.bg, 'border:1px solid ' + bc.border,
                'color:' + bc.color, 'font-weight:500'
            ].join(';');
            banner.innerHTML =
                '<span>' + (icons[session.role] || '👤') + '</span>' +
                '<strong style="text-transform:capitalize">' + session.role + '</strong>' +
                ' — ' + (droits[session.role] || '');
            appContent.insertBefore(banner, appContent.firstChild);
        }

        applyRolePermissions(session.role);
    }

    // Déconnexion
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', async function (e) {
            e.preventDefault();
            if (confirm('Voulez-vous vous déconnecter ?')) {
                await supabase.auth.signOut();
                sessionStorage.removeItem(SESSION_KEY);
                window.location.href = 'login.html';
            }
        });
    }

    function applyRolePermissions(role) {
        const btnNewTx = document.getElementById('btn-new-tx');
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
    }

    // =====================================================
    // 3. CHARGEMENT DES DONNÉES DEPUIS SUPABASE
    // =====================================================

    // ── Afficher le skeleton de chargement ────────────────
    function showLoadingState() {
        const list = document.querySelector('.transaction-list');
        if (list) {
            list.innerHTML = [1, 2, 3, 4].map(() =>
                '<div style="display:flex;gap:12px;padding:12px 0;border-bottom:1px solid #1F2922;">' +
                '<div style="width:36px;height:36px;border-radius:50%;background:#1F2922;flex-shrink:0;"></div>' +
                '<div style="flex:1;">' +
                '<div style="height:12px;width:60%;background:#1F2922;border-radius:4px;margin-bottom:6px;"></div>' +
                '<div style="height:10px;width:40%;background:#1F2922;border-radius:4px;"></div>' +
                '</div>' +
                '<div style="width:80px;height:14px;background:#1F2922;border-radius:4px;align-self:center;"></div>' +
                '</div>'
            ).join('');
        }
    }

    // ── Charger le dashboard (solde + métriques) ──────────
    async function chargerDashboard() {
        try {
            const { data, error } = await supabase
                .from('vue_dashboard')
                .select('*')
                .eq('cooperative_id', state.cooperative_id)
                .single();

            if (error) throw error;
            state.dashboard = data;
            updateSoldeDisplay(data.solde_global || 0);
            updateStatBoxes({
                nbTx: data.nb_transactions || 0,
                nbCertifiees: data.nb_certifiees || 0,
                nbMembres: data.nb_membres_actifs || 0,
                nbVotes: data.votes_en_cours || 0
            });
        } catch (err) {
            console.warn('[Supabase] Erreur dashboard :', err.message);
            // Fallback sur les données de démo
            updateSoldeDisplay(1248000);
        }
    }

    // ── Charger les transactions ───────────────────────────
    async function chargerTransactions(filtre) {
        try {
            let query = supabase
                .from('transactions')
                .select(`
                    id,
                    type,
                    montant,
                    direction,
                    description,
                    statut,
                    blockchain_hash,
                    blockchain_bloc,
                    date_transaction,
                    created_at,
                    membres!membre_id ( nom, prenom )
                `)
                .eq('cooperative_id', state.cooperative_id)
                .order('date_transaction', { ascending: false })
                .limit(50);

            // Appliquer le filtre Entrées / Sorties
            if (filtre === 'entrees') query = query.eq('direction', '+');
            if (filtre === 'sorties') query = query.eq('direction', '-');

            const { data, error } = await query;
            if (error) throw error;

            // Normaliser le format pour buildTxRow
            state.transactions = (data || []).map(tx => ({
                id: tx.id,
                type: tx.type,
                montant: tx.direction === '+' ? tx.montant : -tx.montant,
                membre: tx.membres
                    ? (tx.membres.nom + ' ' + tx.membres.prenom).toUpperCase()
                    : 'Coopérative',
                hash: tx.blockchain_hash || null,
                bloc: tx.blockchain_bloc || null,
                date: new Date(tx.date_transaction).toLocaleDateString('fr-FR', {
                    day: '2-digit', month: 'short', year: 'numeric'
                }),
                certifie: tx.statut === 'certifiee',
                statut: tx.statut
            }));

            renderTransactionList(state.transactions);

        } catch (err) {
            console.warn('[Supabase] Erreur transactions :', err.message);
            // Fallback données de démo
            renderTransactionList(DEMO_TRANSACTIONS_FALLBACK);
        }
    }

    // ── Charger les propositions de vote ──────────────────
    async function chargerPropositions() {
        try {
            const { data, error } = await supabase
                .from('propositions')
                .select(`
                    id, titre, description, montant_concerne,
                    seuil_approbation, date_echeance, statut,
                    total_oui, total_non, total_abstention,
                    blockchain_hash
                `)
                .eq('cooperative_id', state.cooperative_id)
                .eq('statut', 'ouvert')
                .order('created_at', { ascending: false })
                .limit(5);

            if (error) throw error;
            state.propositions = data || [];

            // Mettre à jour la première proposition affichée
            if (state.propositions.length > 0) {
                const p = state.propositions[0];
                votesOui = p.total_oui || 0;
                votesNon = p.total_non || 0;
                propIdCourant = p.id;
                updateVoteUI();

                // Mettre à jour le titre de la proposition
                const titreEl = document.querySelector('.proposition-titre');
                if (titreEl) titreEl.textContent = p.titre;
            }

        } catch (err) {
            console.warn('[Supabase] Erreur propositions :', err.message);
        }
    }

    // ── Données de démo (fallback si Supabase non configuré) ─
    const DEMO_TRANSACTIONS_FALLBACK = [
        {
            id: 'demo_1', type: 'cotisation', montant: 500000, membre: 'AMAVI JOJO',
            hash: '0x3f7a9c4d1e2b8fa0', date: '09 Mai 2026', certifie: true
        },
        {
            id: 'demo_2', type: 'depense', montant: -70000, membre: 'KOMI HERVE',
            hash: '0xb2e1f5a044fa3c91', date: '07 Mai 2026', certifie: true
        },
        {
            id: 'demo_3', type: 'prime', montant: 250000, membre: 'KOMA ABLAVI',
            hash: '0x9c4d2f7e01bc88a3', date: '10 Mai 2026', certifie: true
        },
        {
            id: 'demo_4', type: 'cotisation', montant: 300000, membre: 'KASSA JUNIOR',
            hash: '0x5d2c1bc7f09a33b8', date: '05 Mai 2026', certifie: true
        },
        {
            id: 'demo_5', type: 'depense', montant: -45000, membre: 'SASSOU KOMI',
            hash: '0x1a8be301f09a6d72', date: '06 Mai 2026', certifie: true
        }
    ];

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
        const el = document.querySelector('.balance-info h2');
        if (!el) return;
        el.textContent = Number(solde).toLocaleString('fr-FR') + ' CFA';
        el.style.transition = 'color 0.3s';
        el.style.color = '#22c55e';
        setTimeout(() => { el.style.color = ''; }, 1500);
    }

    function updateStatBoxes(metrics) {
        const strongs = document.querySelectorAll('.stat-info strong');
        if (strongs[0]) strongs[0].textContent = metrics.nbMembres || '—';
        if (strongs[1]) strongs[1].textContent = metrics.nbTx || '—';
        if (strongs[2]) strongs[2].textContent = metrics.nbCertifiees || '—';
        if (strongs[3]) strongs[3].textContent = metrics.nbVotes || '—';
    }

    // =====================================================
    // 6. RENDU DE L'HISTORIQUE DES TRANSACTIONS
    // =====================================================

    function getTxStyle(type, montant) {
        const m = parseFloat(montant);
        if (m < 0 || type === 'depense') return { color: 'text-red', signe: '-', label: 'Dépense' };
        if (type === 'prime') return { color: 'text-green', signe: '+', label: 'Prime' };
        if (type === 'achat_groupe') return { color: 'text-red', signe: '-', label: 'Achat groupé' };
        if (type === 'subvention') return { color: 'text-green', signe: '+', label: 'Subvention' };
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
        const certBadge = tx.certifie
            ? '<span style="font-size:9px;background:#052e16;color:#22c55e;padding:1px 5px;border-radius:4px;margin-left:4px;">✓ on-chain</span>'
            : '<span style="font-size:9px;background:#1c1917;color:#9ca3af;padding:1px 5px;border-radius:4px;margin-left:4px;">en attente</span>';
        const hl = isNew ? 'background:#f0fdf4;border-left:3px solid #22c55e;border-radius:6px;' : '';

        return '<div class="tx-item" data-type="' + tx.type + '" style="' + hl + '">' +
            '<div class="tx-user">' +
            '<div class="avatar-sm" style="background:' + (m >= 0 ? '#dcfce7' : '#fee2e2') + ';' +
            'color:' + (m >= 0 ? '#166534' : '#7f1d1d') + ';' +
            'display:flex;align-items:center;justify-content:center;' +
            'font-size:9px;font-weight:700;border-radius:50%;">' +
            getInitials(tx.membre) +
            '</div>' +
            '<span>' + tx.membre + '</span>' +
            '</div>' +
            '<div class="tx-desc" title="Hash: ' + (tx.hash || '—') + '">' +
            style.label + certBadge +
            '<span style="font-size:0.7rem;color:#9ca3af;display:block;font-family:monospace;">' + hashShort + '</span>' +
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
    // 7. INITIALISATION COMPLÈTE DU DASHBOARD
    // =====================================================

    async function initDashboard() {
        showLoadingState();

        // Si cooperative_id connu → charger depuis Supabase
        if (state.cooperative_id) {
            await Promise.all([
                chargerDashboard(),
                chargerTransactions(),
                chargerPropositions()
            ]);
        } else {
            // Pas de coop_id → afficher les données de démo
            updateSoldeDisplay(1248000);
            updateStatBoxes({ nbTx: 6, nbCertifiees: 5, nbMembres: 24, nbVotes: 1 });
            renderTransactionList(DEMO_TRANSACTIONS_FALLBACK);
        }

        state.chargement = false;
    }

    await initDashboard();

    // =====================================================
    // 8. TEMPS RÉEL — Supabase Realtime
    // (remplace window.addEventListener('storage'))
    // =====================================================
    // Dès qu'une transaction est insérée en base
    // (par n'importe quel appareil), le dashboard se met
    // à jour automatiquement — c'est la "démo live"

    if (state.cooperative_id) {

        // ── Nouvelle transaction → mettre à jour la liste ──
        supabase
            .channel('transactions-live')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'transactions',
                filter: 'cooperative_id=eq.' + state.cooperative_id
            }, async (payload) => {
                console.log('[Realtime] Nouvelle transaction :', payload.new);

                const tx = payload.new;
                const nouvelleTx = {
                    id: tx.id,
                    type: tx.type,
                    montant: tx.direction === '+' ? tx.montant : -tx.montant,
                    membre: tx.description || 'Nouveau membre',
                    hash: tx.blockchain_hash || null,
                    date: new Date(tx.date_transaction).toLocaleDateString('fr-FR', {
                        day: '2-digit', month: 'short', year: 'numeric'
                    }),
                    certifie: tx.statut === 'certifiee'
                };

                // Ajouter en tête de la liste avec highlight
                const list = document.querySelector('.transaction-list');
                if (list) {
                    list.insertAdjacentHTML('afterbegin', buildTxRow(nouvelleTx, true));
                    setTimeout(() => {
                        const first = list.querySelector('.tx-item');
                        if (first) first.removeAttribute('style');
                    }, 3000);
                }

                // Recharger le solde
                await chargerDashboard();
                showToast('🔴 Live : Nouvelle transaction certifiée on-chain !');
            })
            .subscribe();

        // ── Mise à jour d'un vote → refresh proposition ────
        supabase
            .channel('votes-live')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'votes_membres'
                // Filtre retiré au cas où cooperative_id n'est pas sur la table
            }, async () => {
                await chargerPropositions();
            })
            .subscribe();

        // ── Mise à jour d'une proposition (trigger après vote) ────
        supabase
            .channel('propositions-live')
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'propositions'
            }, async () => {
                await chargerPropositions();
                showToast('🔄 Les votes ont été mis à jour en temps réel !');
            })
            .subscribe();
    }

    // =====================================================
    // 9. FILTRES TOUT / ENTRÉES / SORTIES
    // =====================================================

    document.querySelectorAll('.filter-tabs button').forEach(function (btn) {
        btn.addEventListener('click', async function () {
            document.querySelectorAll('.filter-tabs button')
                .forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const label = btn.textContent.trim().toLowerCase();
            let filtre = 'tout';
            if (label === 'entrées' || label === 'entrees' || label === 'entrer') filtre = 'entrees';
            if (label === 'sorties' || label === 'sortie') filtre = 'sorties';

            if (state.cooperative_id) {
                await chargerTransactions(filtre);
            } else {
                // Filtrer les données de démo
                let filtered = DEMO_TRANSACTIONS_FALLBACK;
                if (filtre === 'entrees') filtered = filtered.filter(tx => parseFloat(tx.montant) > 0);
                if (filtre === 'sorties') filtered = filtered.filter(tx => parseFloat(tx.montant) < 0);
                renderTransactionList(filtered);
            }
        });
    });

    // =====================================================
    // 10. BOUTON "NOUVELLE TRANSACTION" → INSERT Supabase
    // =====================================================

    const btnNewTx = document.getElementById('btn-new-tx');
    const txModal = document.getElementById('tx-modal');
    const closeTxModal = document.getElementById('close-tx-modal');
    const txForm = document.getElementById('tx-form');

    if (btnNewTx && txModal) {
        // Ouvrir la modale
        btnNewTx.addEventListener('click', function (e) {
            e.preventDefault();
            if (session && session.role === 'membre') {
                showPermissionAlert('⛔ Seul le trésorier peut enregistrer des transactions.');
                return;
            }
            txModal.style.display = 'flex';
        });

        // Fermer la modale
        closeTxModal.addEventListener('click', () => { txModal.style.display = 'none'; });
        txModal.addEventListener('click', (e) => { if (e.target === txModal) txModal.style.display = 'none'; });

        // Soumettre le formulaire
        txForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const typeEl = document.getElementById('tx-type');
            const montantEl = document.getElementById('tx-montant');
            const descEl = document.getElementById('tx-desc');
            const btnSubmit = document.getElementById('btn-submit-tx');

            const type = typeEl.value;
            const montant = parseInt(montantEl.value);
            const desc = descEl.value.trim();

            if (!montant || !desc) {
                showToast('⚠ Veuillez remplir tous les champs.');
                return;
            }

            const isDepense = ['depense', 'achat_groupe'].includes(type);
            const direction = isDepense ? '-' : '+';

            btnSubmit.textContent = '⏳ Enregistrement…';
            btnSubmit.disabled = true;

            try {
                if (state.cooperative_id) {
                    // ── INSERT réel dans Supabase ──────────────
                    const { data, error } = await supabase
                        .from('transactions')
                        .insert({
                            cooperative_id: state.cooperative_id,
                            membre_id: state.membre_id || null, // Facultatif
                            enregistre_par: state.membre_id || null,
                            type: type,
                            montant: montant,
                            direction: direction,
                            description: desc,
                            statut: 'en_attente',
                            date_transaction: new Date().toISOString().split('T')[0]
                        })
                        .select()
                        .single();

                    if (error) throw error;

                    txModal.style.display = 'none'; // Fermer la modale
                    txForm.reset();

                    // Recharger manuellement pour afficher tout de suite sans attendre le realtime
                    await chargerTransactions();
                    await chargerDashboard();

                    // ── Ancrage blockchain après INSERT Supabase ──
                    showToast('⏳ Certification blockchain en cours…');
                    try {
                        const blockchain = window.AgriTGBlockchain;
                        if (blockchain) {
                            const certif = await blockchain.certifierTransaction({
                                id: data.id,
                                hash_local: data.hash_local || '',
                                montant: data.montant,
                                type: data.type
                            });

                            if (certif.succes) {
                                // Sauvegarder le hash blockchain dans Supabase
                                await supabase
                                    .from('transactions')
                                    .update({
                                        blockchain_hash: certif.transactionHash,
                                        blockchain_bloc: certif.blockNumber,
                                        blockchain_at: new Date().toISOString(),
                                        statut: 'certifiee'
                                    })
                                    .eq('id', data.id);

                                const label = certif.simule ? '(simulation)' : '✓ on-chain';
                                showToast('✓ Transaction certifiée ' + label + ' — ' + certif.transactionHash.slice(0, 12) + '…');
                            } else {
                                showToast('✓ Transaction en base — certification blockchain reportée.');
                            }
                        } else {
                            showToast('✓ Transaction enregistrée en base !');
                        }
                    } catch (blockErr) {
                        console.warn('[Blockchain] Erreur certification :', blockErr.message);
                        showToast('✓ Transaction en base — blockchain indisponible.');
                    }

                } else {
                    // ── Fallback démo sans Supabase ─────────────
                    const chars = '0123456789abcdef';
                    let hash = '0x';
                    for (let i = 0; i < 16; i++) hash += chars[Math.floor(Math.random() * chars.length)];
                    const now = Date.now();
                    const nouvelleTx = {
                        id: 'tx_' + now, type, montant: isDepense ? -montant : montant,
                        membre: desc,
                        hash, certifie: false,
                        date: new Date(now).toLocaleDateString('fr-FR', {
                            day: '2-digit', month: 'short', year: 'numeric'
                        })
                    };
                    const list = document.querySelector('.transaction-list');
                    if (list) list.insertAdjacentHTML('afterbegin', buildTxRow(nouvelleTx, true));
                    const metrics = calcMetrics([nouvelleTx, ...DEMO_TRANSACTIONS_FALLBACK]);
                    updateSoldeDisplay(metrics.solde + 1248000);

                    txModal.style.display = 'none';
                    txForm.reset();
                    showToast('✓ Transaction ajoutée (mode démo) !');
                }

            } catch (err) {
                console.error('[Supabase] Erreur INSERT transaction :', err.message);
                showToast('⚠ Erreur : ' + err.message);
            } finally {
                btnSubmit.textContent = 'Enregistrer la transaction';
                btnSubmit.disabled = false;
            }
        });
    }

    // =====================================================
    // 11. VOTE BLOCKCHAIN — INSERT Supabase + Realtime
    // =====================================================

    const btnVoteYes = document.getElementById('btn-vote-yes');
    const btnVoteNo = document.querySelector('.btn-no');
    const progressBar = document.querySelector('.bar-green');

    let votesOui = 15;
    let votesNon = 5;
    let aVote = false;
    let propIdCourant = null; // ID de la proposition en cours

    function genHash(len) {
        const c = '0123456789abcdef';
        let h = '0x';
        for (let i = 0; i < (len || 16); i++) h += c[Math.floor(Math.random() * c.length)];
        return h;
    }

    function updateVoteUI() {
        const total = votesOui + votesNon;
        const pctOui = total > 0 ? Math.round((votesOui / total) * 100) : 0;
        const pctNon = 100 - pctOui;

        if (progressBar) {
            progressBar.style.transition = 'width 0.6s ease';
            progressBar.style.width = pctOui + '%';
        }
        const labels = document.querySelectorAll('.vote-label');
        if (labels[0]) labels[0].innerHTML = 'Oui<br><small>' + votesOui + ' votes</small>';
        if (labels[1]) labels[1].innerHTML = 'Non<br><small>' + votesNon + ' votes</small>';

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

    async function processVote(choix) {
        if (aVote) {
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

        [btnVoteYes, btnVoteNo].forEach(btn => {
            if (!btn) return;
            btn.disabled = true;
            btn.textContent = '⏳';
            btn.style.opacity = '0.6';
        });

        try {
            if (state.cooperative_id && propIdCourant) {
                // ── INSERT réel dans Supabase ──────────────────
                const { error } = await supabase
                    .from('votes_membres')
                    .insert({
                        proposition_id: propIdCourant,
                        membre_id: state.membre_id,
                        choix: choix
                        // Le trigger SQL recalcule total_oui/total_non automatiquement
                    });

                if (error) throw error;

                // ── Ancrage blockchain du vote ────────────────────
                let hashVote = genHash(12);
                let blocVote = Math.floor(Math.random() * 9000) + 7000000;
                try {
                    const blockchain = window.AgriTGBlockchain;
                    if (blockchain) {
                        const certif = await blockchain.certifierVote({
                            id: state.membre_id + '_' + propIdCourant,
                            hash_local: genHash(64).replace('0x', ''),
                            proposition_id: propIdCourant,
                            choix: choix
                        });

                        if (certif.succes) {
                            hashVote = certif.transactionHash;
                            blocVote = certif.blockNumber;

                            // Mettre à jour le vote avec le hash blockchain
                            await supabase
                                .from('votes_membres')
                                .update({
                                    blockchain_hash: certif.transactionHash,
                                    blockchain_at: new Date().toISOString()
                                })
                                .eq('proposition_id', propIdCourant)
                                .eq('membre_id', state.membre_id);
                        }
                    }
                } catch (blockErr) {
                    console.warn('[Blockchain] Erreur certification vote :', blockErr.message);
                }

                // Recharger les compteurs depuis Supabase
                await chargerPropositions();
                afficherHashVote(choix, hashVote, blocVote, new Date().toLocaleTimeString('fr-FR'));
                showVoteToast(choix, hashVote);

            } else {
                // ── Mode démo sans Supabase ────────────────────
                setTimeout(function () {
                    const hash = genHash(12);
                    const bloc = Math.floor(Math.random() * 9000) + 1000;
                    const heure = new Date().toLocaleTimeString('fr-FR');

                    if (choix === 'oui') votesOui++;
                    else votesNon++;
                    updateVoteUI();

                    if (choix === 'oui' && btnVoteYes) {
                        btnVoteYes.textContent = '✓ Voté Oui';
                        btnVoteYes.style.cssText = 'background:#166534;color:#fff;opacity:1;border:2px solid #22c55e;font-weight:700;cursor:default;';
                    }
                    if (choix === 'non' && btnVoteNo) {
                        btnVoteNo.textContent = '✓ Voté Non';
                        btnVoteNo.style.cssText = 'background:#7f1d1d;color:#fff;opacity:1;border:2px solid #ef4444;font-weight:700;cursor:default;';
                    }
                    if (choix === 'oui' && btnVoteNo) { btnVoteNo.textContent = 'Non'; btnVoteNo.style.cssText = 'opacity:0.3;cursor:not-allowed;'; }
                    if (choix === 'non' && btnVoteYes) { btnVoteYes.textContent = 'Oui'; btnVoteYes.style.cssText = 'opacity:0.3;cursor:not-allowed;'; }

                    afficherHashVote(choix, hash, bloc, heure);
                    showVoteToast(choix, hash);
                }, 2000);
            }

        } catch (err) {
            aVote = false;
            [btnVoteYes, btnVoteNo].forEach(btn => {
                if (!btn) return;
                btn.disabled = false;
                btn.textContent = btn === btnVoteYes ? 'Oui' : 'Non';
                btn.style.opacity = '1';
            });
            if (err.code === '23505') {
                showPermissionAlert('⚠ Vous avez déjà voté sur cette proposition.');
            } else {
                showPermissionAlert('⚠ Erreur : ' + err.message);
            }
        }
    }

    function afficherHashVote(choix, hash, bloc, heure) {
        const section = document.querySelector('.vote-progress-section');
        if (!section) return;
        const old = section.querySelector('.vote-hash-result');
        if (old) old.remove();
        const box = document.createElement('div');
        box.className = 'vote-hash-result';
        box.style.cssText = 'margin-top:12px;padding:8px 12px;background:#052e16;border:1px solid #166634;border-radius:6px;font-size:0.75rem;font-family:monospace;color:#86efac;line-height:1.8;';
        box.innerHTML =
            '<span style="color:#22c55e;font-weight:700;">✓ Vote certifié on-chain</span><br>' +
            'Hash &nbsp; : ' + hash + '<br>' +
            (bloc ? 'Bloc &nbsp; : #' + bloc + '<br>' : '') +
            'Choix &nbsp;: <strong style="color:' + (choix === 'oui' ? '#22c55e' : '#ef4444') + ';">' + choix.toUpperCase() + '</strong><br>' +
            'Heure &nbsp;: ' + (heure || new Date().toLocaleTimeString('fr-FR'));
        section.appendChild(box);
    }

    function showVoteToast(choix, hash) {
        const couleur = choix === 'oui' ? '#166534' : '#7f1d1d';
        const bordure = choix === 'oui' ? '#22c55e' : '#ef4444';
        const t = document.createElement('div');
        t.id = 'vote-toast';
        t.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:' + couleur + ';border:1px solid ' + bordure + ';color:#fff;padding:10px 20px;border-radius:8px;font-size:0.85rem;font-weight:600;z-index:99999;box-shadow:0 4px 15px rgba(0,0,0,0.25);white-space:nowrap;';
        t.textContent = '✓ Vote ' + choix.toUpperCase() + ' enregistré — ' + hash.slice(0, 12) + '…';
        document.body.appendChild(t);
        setTimeout(() => {
            t.style.opacity = '0'; t.style.transition = 'opacity 0.5s';
            setTimeout(() => t.remove(), 500);
        }, 3500);
    }

    if (btnVoteYes) btnVoteYes.addEventListener('click', () => processVote('oui'));
    if (btnVoteNo) btnVoteNo.addEventListener('click', () => processVote('non'));
    updateVoteUI();

    // =====================================================
    // 12. GÉNÉRER RAPPORT MENSUEL → Supabase RPC
    // =====================================================

    const btnRapport = document.getElementById('btn-rapport');
    if (btnRapport) {
        btnRapport.addEventListener('click', async function (e) {
            e.preventDefault();
            if (!state.cooperative_id) {
                showToast('⚠ Supabase non configuré — rapport indisponible.');
                return;
            }
            const now = new Date();
            btnRapport.textContent = '⏳ Génération…';
            btnRapport.disabled = true;
            try {
                const { data, error } = await supabase.rpc('generer_rapport_mensuel', {
                    p_cooperative_id: state.cooperative_id,
                    p_annee: now.getFullYear(),
                    p_mois: now.getMonth() + 1
                });
                if (error) throw error;
                showToast('✓ Rapport mensuel généré ! ID : ' + data.slice(0, 8) + '…');
            } catch (err) {
                showToast('⚠ Erreur rapport : ' + err.message);
            } finally {
                btnRapport.textContent = 'Générer rapport';
                btnRapport.disabled = false;
            }
        });
    }

    // =====================================================
    // 13. MODALE SIMULATEUR MOBILE
    // =====================================================

    const btnDemoMobile = document.getElementById('btn-demo-mobile');
    const mobileModal = document.getElementById('mobile-demo-modal');
    const closeMobileBtn = document.getElementById('close-mobile-demo');

    if (btnDemoMobile && mobileModal) {
        btnDemoMobile.addEventListener('click', e => { e.preventDefault(); mobileModal.style.display = 'flex'; });
        if (closeMobileBtn) closeMobileBtn.addEventListener('click', () => { mobileModal.style.display = 'none'; });
        mobileModal.addEventListener('click', e => { if (e.target === mobileModal) mobileModal.style.display = 'none'; });
    }

    // =====================================================
    // 14. TOAST GÉNÉRIQUE
    // =====================================================

    function showToast(message) {
        const old = document.getElementById('agritg-toast');
        if (old) old.remove();
        const t = document.createElement('div');
        t.id = 'agritg-toast';
        t.textContent = message;
        t.style.cssText = 'position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:#166534;color:#fff;padding:10px 20px;border-radius:8px;font-size:0.85rem;font-weight:600;z-index:99999;box-shadow:0 4px 15px rgba(0,0,0,0.2);white-space:nowrap;';
        document.body.appendChild(t);
        setTimeout(() => {
            t.style.opacity = '0'; t.style.transition = 'opacity 0.5s';
            setTimeout(() => t.remove(), 500);
        }, 3000);
    }

    // =====================================================
    // 15. ALERTE PERMISSION REFUSÉE
    // =====================================================

    function showPermissionAlert(msg) {
        const old = document.getElementById('permission-alert');
        if (old) old.remove();
        const el = document.createElement('div');
        el.id = 'permission-alert';
        el.style.cssText = 'position:fixed;top:80px;left:50%;transform:translateX(-50%);background:#450a0a;border:1px solid #ef4444;color:#fca5a5;padding:10px 20px;border-radius:8px;font-size:0.85rem;font-weight:600;z-index:99999;box-shadow:0 4px 15px rgba(0,0,0,0.25);max-width:90vw;text-align:center;';
        el.textContent = msg;
        document.body.appendChild(el);
        setTimeout(() => {
            el.style.opacity = '0'; el.style.transition = 'opacity 0.5s';
            setTimeout(() => el.remove(), 500);
        }, 3000);
    }

    // =====================================================
    // 16. RACCOURCI DEV : Ctrl+Shift+R → reset démo
    // =====================================================

    document.addEventListener('keydown', function (e) {
        if (e.ctrlKey && e.shiftKey && e.key === 'R') {
            e.preventDefault();
            if (confirm('Recharger les données depuis Supabase ?')) {
                initDashboard();
                showToast('Données rechargées depuis Supabase.');
            }
        }
    });

});