// =================================================================
// AGRI TG — blockchain.js
// Connexion ethers.js → Smart Contract Ethereum Sepolia
//


(function () {

    // =============================================================
    // 1. CONFIGURATION  ← Mettre à jour après déploiement Remix
    // =============================================================

    const CONTRACT_ADDRESS = '0xd9145CCE52D386f254917e481eB44e9943F39138';
    // Ex: '0x742d35Cc6634C0532925a3b8D4C9C4A1B3f7E2A'

    const SEPOLIA_RPC = 'https://rpc.ankr.com/eth_sepolia';
    // RPC public gratuit — pas besoin de clé API pour lire
    // Pour écrire (transactions), MetaMask est utilisé

    // ABI minimal — uniquement les fonctions utilisées par le dashboard
    const CONTRACT_ABI = [
        // Enregistrer une transaction
        {
            name: 'enregistrerTransaction',
            type: 'function',
            stateMutability: 'nonpayable',
            inputs: [
                { name: '_txHash', type: 'bytes32' },
                { name: '_montant', type: 'uint256' },
                { name: '_typeTx', type: 'string' }
            ],
            outputs: [{ name: 'success', type: 'bool' }]
        },
        // Enregistrer un vote
        {
            name: 'enregistrerVote',
            type: 'function',
            stateMutability: 'nonpayable',
            inputs: [
                { name: '_voteHash', type: 'bytes32' },
                { name: '_propositionHash', type: 'bytes32' },
                { name: '_choix', type: 'string' }
            ],
            outputs: [{ name: 'success', type: 'bool' }]
        },
        // Ancrer un rapport
        {
            name: 'ancrerRapport',
            type: 'function',
            stateMutability: 'nonpayable',
            inputs: [
                { name: '_rapportHash', type: 'bytes32' },
                { name: '_annee', type: 'uint16' },
                { name: '_mois', type: 'uint8' }
            ],
            outputs: [{ name: 'success', type: 'bool' }]
        },
        // Vérifier si une transaction existe (lecture gratuite)
        {
            name: 'transactionExiste',
            type: 'function',
            stateMutability: 'view',
            inputs: [{ name: '_txHash', type: 'bytes32' }],
            outputs: [{ type: 'bool' }]
        },
        // Consulter une transaction (lecture gratuite)
        {
            name: 'consulterTransaction',
            type: 'function',
            stateMutability: 'view',
            inputs: [{ name: '_txHash', type: 'bytes32' }],
            outputs: [
                { name: 'montant', type: 'uint256' },
                { name: 'typeTx', type: 'string' },
                { name: 'timestamp', type: 'uint256' }
            ]
        },
        // Statistiques globales
        {
            name: 'statistiques',
            type: 'function',
            stateMutability: 'view',
            inputs: [],
            outputs: [
                { name: 'nbTransactions', type: 'uint256' },
                { name: 'nbVotes', type: 'uint256' },
                { name: 'nbRapports', type: 'uint256' },
                { name: 'proprietaire', type: 'address' }
            ]
        },
        // Événements (pour écouter en temps réel)
        {
            name: 'TransactionEnregistree',
            type: 'event',
            inputs: [
                { name: 'txHash', type: 'bytes32', indexed: true },
                { name: 'montant', type: 'uint256', indexed: false },
                { name: 'typeTx', type: 'string', indexed: false },
                { name: 'timestamp', type: 'uint256', indexed: false }
            ]
        },
        {
            name: 'VoteEnregistre',
            type: 'event',
            inputs: [
                { name: 'voteHash', type: 'bytes32', indexed: true },
                { name: 'propositionHash', type: 'bytes32', indexed: false },
                { name: 'choix', type: 'string', indexed: false },
                { name: 'timestamp', type: 'uint256', indexed: false }
            ]
        }
    ];

    // =============================================================
    // 2. ÉTAT DU MODULE BLOCKCHAIN
    // =============================================================

    const state = {
        disponible: false,  // ethers.js chargé ?
        metamask: false,  // MetaMask installé ?
        connecte: false,  // Wallet connecté ?
        reseau: null,   // Réseau actuel
        adresse: null,   // Adresse wallet connecté
        provider: null,   // ethers.JsonRpcProvider (lecture)
        signer: null,   // ethers.BrowserProvider signer (écriture)
        contrat_ro: null,   // Contrat en lecture seule
        contrat_rw: null,   // Contrat en lecture/écriture (MetaMask)
        contratDeploye: CONTRACT_ADDRESS !== 'ADRESSE_DU_CONTRAT_APRES_DEPLOIEMENT'
    };

    // =============================================================
    // 3. INITIALISATION
    // =============================================================

    async function init() {
        // Vérifier que ethers.js est chargé
        if (typeof ethers === 'undefined') {
            console.warn('[Blockchain] ethers.js non chargé — mode simulation uniquement.');
            window.AgriTGBlockchain = creerModuleSimule();
            return;
        }

        state.disponible = true;

        // Contrat en lecture seule (pas besoin de MetaMask)
        try {
            state.provider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
            state.contrat_ro = new ethers.Contract(
                CONTRACT_ADDRESS, CONTRACT_ABI, state.provider
            );
            console.log('[Blockchain] Provider Sepolia connecté (lecture seule).');
        } catch (err) {
            console.warn('[Blockchain] Erreur provider :', err.message);
        }

        // MetaMask disponible ?
        state.metamask = typeof window.ethereum !== 'undefined';

        if (state.metamask) {
            console.log('[Blockchain] MetaMask détecté.');
            // Écouter les changements de réseau/compte
            window.ethereum.on('chainChanged', () => window.location.reload());
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    state.connecte = false;
                    state.adresse = null;
                    majIndicateurUI(false);
                } else {
                    state.adresse = accounts[0];
                    majIndicateurUI(true);
                }
            });
        }

        // Exposer le module globalement pour phase2.js
        window.AgriTGBlockchain = {
            connecterWallet,
            certifierTransaction,
            certifierVote,
            ancrerRapport,
            verifierTransaction,
            getStatistiques,
            estConnecte: () => state.connecte,
            estDisponible: () => state.disponible,
            contratDeploye: () => state.contratDeploye,
            getAdresse: () => state.adresse
        };

        console.log('[Blockchain] Module AgriTG initialisé.',
            state.contratDeploye
                ? 'Contrat déployé ✓'
                : '⚠ Contrat non déployé — en attente de configuration.'
        );

        // Afficher l'indicateur blockchain dans le header
        afficherIndicateurHeader();
    }

    // =============================================================
    // 4. CONNEXION METAMASK
    // =============================================================

    async function connecterWallet() {
        if (!state.metamask) {
            return {
                succes: false,
                erreur: 'MetaMask non installé. Télécharger sur metamask.io'
            };
        }

        try {
            // Demander l'accès aux comptes
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            // Vérifier qu'on est sur Sepolia (chainId = 11155111)
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            const chainIdInt = parseInt(chainId, 16);

            if (chainIdInt !== 11155111) {
                // Demander à MetaMask de basculer sur Sepolia
                try {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: '0xaa36a7' }] // Sepolia
                    });
                } catch (switchErr) {
                    // Si Sepolia n'est pas dans MetaMask, l'ajouter
                    if (switchErr.code === 4902) {
                        await window.ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [{
                                chainId: '0xaa36a7',
                                chainName: 'Sepolia Testnet',
                                nativeCurrency: {
                                    name: 'SepoliaETH', symbol: 'ETH', decimals: 18
                                },
                                rpcUrls: ['https://rpc.ankr.com/eth_sepolia'],
                                blockExplorerUrls: ['https://sepolia.etherscan.io']
                            }]
                        });
                    }
                }
            }

            // Créer le signer et le contrat en lecture/écriture
            const browserProvider = new ethers.BrowserProvider(window.ethereum);
            state.signer = await browserProvider.getSigner();
            state.contrat_rw = new ethers.Contract(
                CONTRACT_ADDRESS, CONTRACT_ABI, state.signer
            );

            state.connecte = true;
            state.adresse = accounts[0];
            majIndicateurUI(true);

            return {
                succes: true,
                adresse: accounts[0],
                reseau: 'Sepolia Testnet'
            };

        } catch (err) {
            return {
                succes: false,
                erreur: err.code === 4001
                    ? 'Connexion refusée par l\'utilisateur.'
                    : err.message
            };
        }
    }

    // =============================================================
    // 5. CERTIFIER UNE TRANSACTION ON-CHAIN
    // Appelée depuis phase2.js après INSERT Supabase réussi
    // =============================================================

    async function certifierTransaction(txSupabase) {
        // Si contrat non déployé → simulation
        if (!state.contratDeploye) {
            return simulerCertification(txSupabase.id);
        }

        // Si MetaMask non connecté → demander connexion
        if (!state.connecte) {
            const connexion = await connecterWallet();
            if (!connexion.succes) {
                console.warn('[Blockchain] Wallet non connecté :', connexion.erreur);
                return simulerCertification(txSupabase.id);
            }
        }

        try {
            // Convertir le hash local (hex string) en bytes32
            const hashBytes32 = '0x' + txSupabase.hash_local.padEnd(64, '0');
            const montantWei = BigInt(Math.round(txSupabase.montant));

            console.log('[Blockchain] Envoi transaction sur Sepolia…');

            // Appeler le smart contract
            const tx = await state.contrat_rw.enregistrerTransaction(
                hashBytes32,
                montantWei,
                txSupabase.type
            );

            console.log('[Blockchain] Transaction envoyée, hash :', tx.hash);

            // Attendre la confirmation (1 bloc)
            const receipt = await tx.wait(1);

            console.log('[Blockchain] ✓ Confirmée — Bloc :', receipt.blockNumber);

            return {
                succes: true,
                transactionHash: tx.hash,
                blockNumber: receipt.blockNumber,
                etherscanUrl: 'https://sepolia.etherscan.io/tx/' + tx.hash
            };

        } catch (err) {
            console.error('[Blockchain] Erreur certification :', err.message);
            // En cas d'erreur réseau → simulation de secours
            return simulerCertification(txSupabase.id, err.message);
        }
    }

    // =============================================================
    // 6. CERTIFIER UN VOTE ON-CHAIN
    // =============================================================

    async function certifierVote(voteData) {
        if (!state.contratDeploye) {
            return simulerCertification(voteData.id);
        }

        if (!state.connecte) {
            const connexion = await connecterWallet();
            if (!connexion.succes) return simulerCertification(voteData.id);
        }

        try {
            const voteHash = '0x' + voteData.hash_local.padEnd(64, '0');
            const propHash = '0x' + (voteData.proposition_id || '').replace(/-/g, '').padEnd(64, '0');

            const tx = await state.contrat_rw.enregistrerVote(
                voteHash, propHash, voteData.choix
            );
            const receipt = await tx.wait(1);

            return {
                succes: true,
                transactionHash: tx.hash,
                blockNumber: receipt.blockNumber,
                etherscanUrl: 'https://sepolia.etherscan.io/tx/' + tx.hash
            };

        } catch (err) {
            console.error('[Blockchain] Erreur vote :', err.message);
            return simulerCertification(voteData.id, err.message);
        }
    }

    // =============================================================
    // 7. ANCRER UN RAPPORT ON-CHAIN
    // =============================================================

    async function ancrerRapport(rapportData) {
        if (!state.contratDeploye) {
            return simulerCertification(rapportData.id);
        }

        if (!state.connecte) {
            const connexion = await connecterWallet();
            if (!connexion.succes) return simulerCertification(rapportData.id);
        }

        try {
            const hash = '0x' + rapportData.hash_contenu.padEnd(64, '0');

            const tx = await state.contrat_rw.ancrerRapport(
                hash,
                rapportData.annee,
                rapportData.mois
            );
            const receipt = await tx.wait(1);

            return {
                succes: true,
                transactionHash: tx.hash,
                blockNumber: receipt.blockNumber,
                etherscanUrl: 'https://sepolia.etherscan.io/tx/' + tx.hash
            };

        } catch (err) {
            console.error('[Blockchain] Erreur rapport :', err.message);
            return simulerCertification(rapportData.id, err.message);
        }
    }

    // =============================================================
    // 8. VÉRIFICATION (lecture seule — gratuite)
    // =============================================================

    async function verifierTransaction(hashLocal) {
        if (!state.contrat_ro || !state.contratDeploye) {
            return { existe: false, simule: true };
        }
        try {
            const hashBytes32 = '0x' + hashLocal.padEnd(64, '0');
            const existe = await state.contrat_ro.transactionExiste(hashBytes32);
            if (existe) {
                const [montant, typeTx, timestamp] =
                    await state.contrat_ro.consulterTransaction(hashBytes32);
                return {
                    existe: true,
                    montant: montant.toString(),
                    typeTx,
                    timestamp: new Date(Number(timestamp) * 1000).toLocaleString('fr-FR'),
                    simule: false
                };
            }
            return { existe: false, simule: false };
        } catch (err) {
            return { existe: false, erreur: err.message, simule: true };
        }
    }

    async function getStatistiques() {
        if (!state.contrat_ro || !state.contratDeploye) {
            return { nbTransactions: 0, nbVotes: 0, nbRapports: 0, simule: true };
        }
        try {
            const [nbTx, nbVotes, nbRapports] = await state.contrat_ro.statistiques();
            return {
                nbTransactions: Number(nbTx),
                nbVotes: Number(nbVotes),
                nbRapports: Number(nbRapports),
                simule: false
            };
        } catch (err) {
            return { nbTransactions: 0, nbVotes: 0, nbRapports: 0, simule: true };
        }
    }

    // =============================================================
    // 9. SIMULATION (quand contrat pas encore déployé)
    // Génère un faux hash réaliste pour la démo Phase 2
    // =============================================================

    function simulerCertification(id, raisonSimulation) {
        const chars = '0123456789abcdef';
        let hash = '0x';
        for (let i = 0; i < 64; i++) {
            hash += chars[Math.floor(Math.random() * chars.length)];
        }
        const bloc = Math.floor(Math.random() * 1000000) + 7000000;

        console.log('[Blockchain] Mode simulation — hash généré :', hash.slice(0, 18) + '…');
        if (raisonSimulation) {
            console.warn('[Blockchain] Raison simulation :', raisonSimulation);
        }

        return {
            succes: true,
            transactionHash: hash,
            blockNumber: bloc,
            etherscanUrl: 'https://sepolia.etherscan.io/tx/' + hash,
            simule: true   // Indique que c'est simulé
        };
    }

    // =============================================================
    // 10. MODULE DE SECOURS (ethers.js non disponible)
    // =============================================================

    function creerModuleSimule() {
        const sim = (id) => Promise.resolve(simulerCertification(id, 'ethers.js absent'));
        return {
            connecterWallet: () => Promise.resolve({ succes: false, erreur: 'ethers.js non chargé' }),
            certifierTransaction: (tx) => sim(tx.id),
            certifierVote: (v) => sim(v.id),
            ancrerRapport: (r) => sim(r.id),
            verifierTransaction: () => Promise.resolve({ existe: false, simule: true }),
            getStatistiques: () => Promise.resolve({ nbTransactions: 0, simule: true }),
            estConnecte: () => false,
            estDisponible: () => false,
            contratDeploye: () => false,
            getAdresse: () => null
        };
    }

    // =============================================================
    // 11. INDICATEUR UI DANS LE HEADER DU DASHBOARD
    // =============================================================

    function afficherIndicateurHeader() {
        // Chercher le header du dashboard
        const header = document.querySelector('.app-header, .topbar, header');
        if (!header) return;

        const indicateur = document.createElement('div');
        indicateur.id = 'blockchain-status';
        indicateur.style.cssText = [
            'display:flex', 'align-items:center', 'gap:6px',
            'font-size:0.75rem', 'font-weight:600',
            'padding:4px 10px', 'border-radius:20px',
            'background:' + (state.contratDeploye
                ? 'rgba(16,185,129,0.12)'
                : 'rgba(245,158,11,0.12)'),
            'color:' + (state.contratDeploye ? '#10B981' : '#F59E0B'),
            'border:1px solid ' + (state.contratDeploye
                ? 'rgba(16,185,129,0.3)'
                : 'rgba(245,158,11,0.3)'),
            'cursor:pointer',
            'margin-left:8px'
        ].join(';');

        indicateur.innerHTML = state.contratDeploye
            ? '<span style="width:6px;height:6px;border-radius:50%;background:#10B981;display:inline-block;animation:pulse 2s infinite;"></span> Sepolia connecté'
            : '<span style="width:6px;height:6px;border-radius:50%;background:#F59E0B;display:inline-block;"></span> Blockchain simulée';

        indicateur.title = state.contratDeploye
            ? 'Smart contract déployé sur Ethereum Sepolia'
            : 'Contrat non encore déployé — hashages simulés';

        // Cliquer → connecter MetaMask
        indicateur.addEventListener('click', async () => {
            if (!state.connecte && state.metamask) {
                indicateur.textContent = '⏳ Connexion…';
                const res = await connecterWallet();
                majIndicateurUI(res.succes);
            }
        });

        header.appendChild(indicateur);
    }

    function majIndicateurUI(connecte) {
        const el = document.getElementById('blockchain-status');
        if (!el) return;
        if (connecte) {
            el.style.background = 'rgba(16,185,129,0.12)';
            el.style.color = '#10B981';
            el.style.border = '1px solid rgba(16,185,129,0.3)';
            const adresseCourtе = state.adresse
                ? state.adresse.slice(0, 6) + '…' + state.adresse.slice(-4)
                : '';
            el.innerHTML = '<span style="width:6px;height:6px;border-radius:50%;background:#10B981;display:inline-block;animation:pulse 2s infinite;"></span> ' + adresseCourtе;
        } else {
            el.innerHTML = '<span style="width:6px;height:6px;border-radius:50%;background:#F59E0B;display:inline-block;"></span> Wallet déconnecté';
        }
    }

    // =============================================================
    // 12. DÉMARRAGE
    // =============================================================

    // Initialiser dès que le DOM est prêt
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();