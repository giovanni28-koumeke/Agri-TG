// =========================================================
// AGRI TG — script.js
// Vitrine principale + Simulateur Blockchain
// =========================================================

// --- 1. SÉLECTION DES ÉLÉMENTS ---
const btnCertify = document.getElementById('btn-certify');
const memberInput = document.getElementById('member-name');
const amountInput = document.getElementById('contribution-amount');
const ledgerList = document.getElementById('ledger-list');

// Bloc courant (Genesis = Bloc 0, on commence à 1)
let blockCount = 1;

// =========================================================
// 2. UTILITAIRES BLOCKCHAIN
// =========================================================

/** Génère un hash hexadécimal simulé */
function generateFakeHash() {
    const chars = '0123456789abcdef';
    let hash = '0x';
    for (let i = 0; i < 16; i++) {
        hash += chars[Math.floor(Math.random() * chars.length)];
    }
    return hash;
}

/** Formate un timestamp en date lisible */
function formatDate(timestamp) {
    const d = new Date(timestamp);
    return d.toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

// =========================================================
// 3. LOCALSTORAGE — PERSISTANCE DES TRANSACTIONS
// =========================================================

const STORAGE_KEY = 'agritg_blockchain_transactions';

/**
 * Lit toutes les transactions certifiées depuis localStorage.
 */
function getStoredTransactions() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

/**
 * Sauvegarde une nouvelle transaction dans localStorage
 * et déclenche un événement pour notifier d'autres onglets.
 */
function saveTransaction(tx) {
    const transactions = getStoredTransactions();
    transactions.unshift(tx); // Plus récente en premier
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));

    // Notifie les écouteurs sur la même page si besoin
    window.dispatchEvent(new CustomEvent('agritg:new_transaction', { detail: tx }));
}

// =========================================================
// 4. LOGIQUE PRINCIPALE : CERTIFICATION D'UN BLOC
// =========================================================

if (btnCertify) {
    btnCertify.addEventListener('click', function () {
        const memberName = memberInput.value.trim();
        const amountRaw = amountInput.value.trim();

        if (!memberName || !amountRaw) {
            alert('Veuillez remplir le nom du membre et le montant !');
            return;
        }

        const amount = parseFloat(amountRaw);
        if (isNaN(amount) || amount <= 0) {
            alert('Veuillez entrer un montant valide.');
            return;
        }

        // Animation UX : état "minage"
        const originalText = btnCertify.textContent;
        btnCertify.textContent = '⏳ Validation par les noeuds…';
        btnCertify.disabled = true;
        btnCertify.classList.add('loading');

        // Simule le délai réseau / Proof of Work
        setTimeout(() => {
            const blockHash = generateFakeHash();
            const timestamp = Date.now();
            const blockIndex = blockCount;

            // Objet transaction structuré — compatible phase2.js
            const newTransaction = {
                id: 'tx_' + timestamp + '_' + blockIndex,
                bloc: blockIndex,
                hash: blockHash,
                membre: memberName,
                montant: amount,
                type: 'cotisation',
                timestamp: timestamp,
                date: formatDate(timestamp),
                certifie: true
            };

            // Sauvegarder dans localStorage
            saveTransaction(newTransaction);

            // Afficher le bloc dans le registre visuel (ledger)
            const newBlockHTML =
                '<li class="block-card fade-in-element visible">' +
                '<div class="block-header">' +
                '<span class="block-id">Bloc ' + blockIndex + ' — Validé on-chain</span>' +
                '<span class="text-green">✓ Certifié</span>' +
                '</div>' +
                '<div class="block-hash">Hash : <span>' + blockHash + '</span></div>' +
                '<p class="block-data">Participant : <strong>' + memberName + '</strong></p>' +
                '<p class="block-data">Montant : <strong>' + amount.toLocaleString('fr-FR') + ' FCFA</strong></p>' +
                '<p class="block-data" style="font-size:0.78rem;color:var(--text-secondary);margin-top:0.4rem;">' +
                formatDate(timestamp) + ' · ✓ Synchronisé avec le dashboard' +
                '</p>' +
                '</li>';

            ledgerList.insertAdjacentHTML('afterbegin', newBlockHTML);

            blockCount++;
            memberInput.value = '';
            amountInput.value = '';

            btnCertify.textContent = originalText;
            btnCertify.disabled = false;
            btnCertify.classList.remove('loading');

        }, 2000);
    });
}

// =========================================================
// 5. SYSTÈME DE THÈME (LIGHT / DARK MODE)
// =========================================================

const themeToggleBtn = document.getElementById('theme-toggle');

const currentTheme = localStorage.getItem('theme');
if (currentTheme === 'light') {
    document.body.classList.add('light-mode');
    if (themeToggleBtn) themeToggleBtn.textContent = '🌙';
}

if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', function () {
        document.body.classList.toggle('light-mode');
        const isLight = document.body.classList.contains('light-mode');
        themeToggleBtn.textContent = isLight ? '🌙' : '☀️';
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
    });
}

// =========================================================
// 6. ANIMATIONS AU DÉFILEMENT (INTERSECTION OBSERVER)
// =========================================================

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            obs.unobserve(entry.target);
        }
    });
}, observerOptions);

const elementsToAnimate = document.querySelectorAll(
    '.card, .section-heading, .demo-container, .hero-content, ' +
    '.stat-card, .charts-section, .vote-card, tr.fade-in-element'
);

elementsToAnimate.forEach(el => {
    if (!el.classList.contains('fade-in-element')) {
        el.classList.add('fade-in-element');
    }
    observer.observe(el);
});
