// =========================================================
// AGRI TG — pages/rapport.js
// Récupération et génération des rapports mensuels
// =========================================================

document.addEventListener('DOMContentLoaded', async () => {

    const supabase = window.supabaseClient;
    const SESSION_KEY = 'agritg_session';

    let state = {
        rapports: [],
        cooperative_id: null,
        membre_id: null,
        role: null
    };

    // 1. Charger la session
    let session = null;
    try {
        const raw = sessionStorage.getItem(SESSION_KEY);
        if (raw) session = JSON.parse(raw);
    } catch (e) { }

    if (session) {
        state.cooperative_id = session.cooperative_id || null;
        state.membre_id = session.id || null;
        state.role = session.role || 'membre';

        // Header
        const headerNom = document.getElementById('header-nom');
        const headerInitials = document.getElementById('header-initiales');
        if (headerNom) headerNom.textContent = session.nom;
        if (headerInitials) headerInitials.textContent = session.initiales;
    }

    // Bouton de déconnexion
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', async (e) => {
            e.preventDefault();
            if (confirm('Voulez-vous vous déconnecter ?')) {
                await supabase.auth.signOut();
                sessionStorage.removeItem(SESSION_KEY);
                window.location.href = 'login.html';
            }
        });
    }

    // Gestion du toast
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

    // 2. Charger les rapports depuis Supabase
    async function chargerRapports() {
        if (!state.cooperative_id) return;

        const container = document.getElementById('rapports-container');

        try {
            const { data, error } = await supabase
                .from('rapports')
                .select('*')
                .eq('cooperative_id', state.cooperative_id)
                .order('annee', { ascending: false })
                .order('mois', { ascending: false });

            if (error) throw error;

            state.rapports = data || [];
            afficherRapports(state.rapports);

        } catch (err) {
            console.error("Erreur chargement rapports:", err);
            container.innerHTML = `<p style="color:#ef4444;">Erreur lors du chargement des rapports.</p>`;
        }
    }

    function nomMois(m) {
        const mois = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
        return mois[m - 1] || 'Mois inconnu';
    }

    function afficherRapports(rapports) {
        const container = document.getElementById('rapports-container');
        container.innerHTML = '';

        if (rapports.length === 0) {
            container.innerHTML = `<p style="color:var(--text-secondary); width:100%; text-align:center; padding: 2rem;">Aucun rapport généré pour le moment.</p>`;
            return;
        }

        rapports.forEach(rap => {
            const certifie = rap.blockchain_hash ? true : false;
            const badgeCertif = certifie
                ? `<span class="rapport-status certifie">✓ Certifié On-chain</span>`
                : `<span class="rapport-status">En attente de certification</span>`;

            const card = document.createElement('div');
            card.className = 'rapport-card';
            card.innerHTML = `
                <div class="rapport-header">
                    <div>
                        <h3 class="rapport-title">Rapport ${nomMois(rap.mois)} ${rap.annee}</h3>
                        <span class="rapport-date">Généré le ${new Date(rap.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                    ${badgeCertif}
                </div>
                <div class="rapport-stats">
                    <div class="stat-line">
                        <span class="stat-label">Entrées</span>
                        <span class="stat-val text-green">+${Number(rap.total_entrees).toLocaleString('fr-FR')} CFA</span>
                    </div>
                    <div class="stat-line">
                        <span class="stat-label">Sorties</span>
                        <span class="stat-val text-red">-${Number(rap.total_sorties).toLocaleString('fr-FR')} CFA</span>
                    </div>
                    <div class="stat-line" style="border-top:1px solid var(--border-color); padding-top:4px; margin-top:4px;">
                        <span class="stat-label" style="color:var(--text-primary)">Solde Net</span>
                        <span class="stat-val" style="color:${rap.solde_net >= 0 ? 'var(--green-primary)' : 'var(--text-red)'}">${Number(rap.solde_net).toLocaleString('fr-FR')} CFA</span>
                    </div>
                </div>
                <button class="btn-view-report" data-id="${rap.id}">Voir les détails</button>
            `;
            container.appendChild(card);
        });

        // Ajouter les écouteurs pour ouvrir les détails
        document.querySelectorAll('.btn-view-report').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                const rapport = state.rapports.find(r => r.id === id);
                if (rapport) ouvrirModal(rapport);
            });
        });
    }

    // 3. Modale de détail du rapport
    const modal = document.getElementById('report-modal');
    const btnCloseModal = document.getElementById('close-report-modal');

    if (btnCloseModal) {
        btnCloseModal.addEventListener('click', () => { modal.style.display = 'none'; });
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });
    }

    function ouvrirModal(rap) {
        document.getElementById('modal-report-title').textContent = `Rapport Mensuel`;
        document.getElementById('modal-report-date').textContent = `${nomMois(rap.mois)} ${rap.annee} — Période: ${rap.periode}`;

        document.getElementById('modal-entrees').textContent = `+${Number(rap.total_entrees).toLocaleString('fr-FR')} CFA`;
        document.getElementById('modal-sorties').textContent = `-${Number(rap.total_sorties).toLocaleString('fr-FR')} CFA`;

        const soldeEl = document.getElementById('modal-solde');
        soldeEl.textContent = `${Number(rap.solde_net).toLocaleString('fr-FR')} CFA`;
        soldeEl.style.color = rap.solde_net >= 0 ? 'var(--green-primary)' : 'var(--text-red)';

        document.getElementById('modal-nbtx').textContent = rap.nb_transactions;
        document.getElementById('modal-nbmb').textContent = rap.nb_membres_actifs;
        document.getElementById('modal-nbvt').textContent = rap.nb_votes;

        // Détail par catégories (JSONB)
        const catContainer = document.getElementById('modal-categories-list');
        catContainer.innerHTML = '';
        if (rap.detail_categories && Object.keys(rap.detail_categories).length > 0) {
            for (const [type, montant] of Object.entries(rap.detail_categories)) {
                let nom = type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ');
                let mt = Number(montant);
                let colorClass = ['depense', 'achat_groupe'].includes(type) ? 'text-red' : 'text-green';
                let sign = ['depense', 'achat_groupe'].includes(type) ? '-' : '+';

                catContainer.innerHTML += `
                    <div class="stat-line">
                        <span class="stat-label" style="text-transform: capitalize;">${nom}</span>
                        <span class="stat-val ${colorClass}">${sign}${mt.toLocaleString('fr-FR')} CFA</span>
                    </div>
                `;
            }
        } else {
            catContainer.innerHTML = '<p style="color:var(--text-secondary); font-size:0.85rem; text-align:center;">Aucun détail disponible</p>';
        }

        // Blockchain status
        const statusEl = document.getElementById('modal-report-status');
        const hashBox = document.getElementById('modal-hash-box');

        if (rap.blockchain_hash) {
            statusEl.innerHTML = `<span class="rapport-status certifie" style="font-size:0.9rem;">✓ Certifié sur la Blockchain</span>`;
            hashBox.style.display = 'block';
            hashBox.innerHTML = `
                <span style="color:#22c55e; font-weight:bold;">Hash de certification:</span><br>
                ${rap.blockchain_hash}<br><br>
                <span style="color:#22c55e; font-weight:bold;">Hash de contenu:</span><br>
                ${rap.hash_contenu || 'Non disponible'}
            `;
        } else {
            statusEl.innerHTML = `<span class="rapport-status" style="font-size:0.9rem; background:rgba(245, 158, 11, 0.15); color:#f59e0b; border:1px solid rgba(245,158,11,0.3);">En attente de certification</span>`;
            hashBox.style.display = 'none';
        }

        modal.style.display = 'flex';
    }

    // 4. Générer un nouveau rapport via RPC
    const btnGenerer = document.getElementById('btn-generer-rapport');
    if (btnGenerer) {
        btnGenerer.addEventListener('click', async () => {
            if (state.role === 'membre') {
                showToast('⛔ Seul le président ou le trésorier peut générer un rapport.');
                return;
            }

            const now = new Date();
            const p_annee = now.getFullYear();
            const p_mois = now.getMonth() + 1;

            btnGenerer.disabled = true;
            btnGenerer.innerHTML = '⏳ Génération en cours...';

            try {
                const { data, error } = await supabase.rpc('generer_rapport_mensuel', {
                    p_cooperative_id: state.cooperative_id,
                    p_annee: p_annee,
                    p_mois: p_mois
                });

                if (error) throw error;

                showToast('✓ Rapport mensuel généré dans Supabase !');

                // ── Ancrage blockchain après génération Supabase ──
                showToast('⏳ Certification blockchain en cours…');
                try {
                    // On récupère le rapport fraîchement créé pour avoir son hash_contenu
                    const { data: rapData, error: rapErr } = await supabase
                        .from('rapports')
                        .select('*')
                        .eq('id', data)
                        .single();

                    if (rapErr) throw rapErr;

                    const blockchain = window.AgriTGBlockchain;
                    if (blockchain) {
                        const certif = await blockchain.ancrerRapport({
                            id: rapData.id,
                            hash_contenu: rapData.hash_contenu || '',
                            annee: rapData.annee,
                            mois: rapData.mois
                        });

                        if (certif.succes) {
                            // Sauvegarder le hash blockchain dans Supabase
                            await supabase
                                .from('rapports')
                                .update({
                                    blockchain_hash: certif.transactionHash,
                                    blockchain_at: new Date().toISOString()
                                })
                                .eq('id', rapData.id);

                            const label = certif.simule ? '(simulation)' : '✓ on-chain';
                            showToast('✓ Rapport certifié ' + label + ' — ' + certif.transactionHash.slice(0, 12) + '…');
                        } else {
                            showToast('✓ Rapport en base — certification blockchain reportée.');
                        }
                    } else {
                        showToast('✓ Rapport enregistré en base !');
                    }
                } catch (blockErr) {
                    console.warn('[Blockchain] Erreur certification rapport :', blockErr.message);
                    showToast('✓ Rapport en base — blockchain indisponible.');
                }

                await chargerRapports(); // Recharger la liste

            } catch (err) {
                console.error("Erreur génération rapport:", err);
                showToast('⚠ Erreur lors de la génération du rapport.');
            } finally {
                btnGenerer.disabled = false;
                btnGenerer.innerHTML = '<span class="icon">📄</span> Générer le rapport du mois';
            }
        });
    }

    // Lancer le chargement initial
    await chargerRapports();

});
