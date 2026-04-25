// --- 1. SÉLECTION DES ÉLÉMENTS DE LA PAGE ---
const btnCertify = document.getElementById('btn-certify');
const memberInput = document.getElementById('member-name');
const amountInput = document.getElementById('contribution-amount');
const ledgerList = document.getElementById('ledger-list');

// Notre blockchain commence au Bloc 1 (car le Genesis est le Bloc 0)
let blockCount = 1;

// --- 2. FONCTION UTILITAIRE : GÉNÉRER UN HASH ---
function generateFakeHash() {
    const chars = '0123456789abcdef';
    let hash = '0x';
    for (let i = 0; i < 16; i++) {
        hash += chars[Math.floor(Math.random() * chars.length)];
    }
    return hash + '...';
}

// --- 3. LOGIQUE PRINCIPALE : CERTIFICATION ---
btnCertify.addEventListener('click', function () {
    const memberName = memberInput.value;
    const amount = amountInput.value;

    if (memberName === '' || amount === '') {
        alert("Veuillez remplir le nom et le montant !");
        return;
    }

    // Début de l'état de chargement (Animation UX)
    const originalText = btnCertify.textContent;
    btnCertify.textContent = "⏳ Validation par les nœuds...";
    btnCertify.disabled = true;
    btnCertify.classList.add('loading');

    // On simule le délai réseau / minage d'un vrai Block
    setTimeout(() => {
        const blockHash = generateFakeHash();

        // Le nouveau bloc a déjà la classe 'visible' pour ne pas nécessiter le scroll public
        const newBlockHTML = `
            <li class="block-card fade-in-element visible">
                <div class="block-header">
                    <span class="block-id">Bloc ${blockCount} (Validé on-chain)</span>
                    <span class="text-green">✓ Certifié</span>
                </div>
                
                <div class="block-hash">
                    Hash: <span>${blockHash}</span>
                </div>
                <p class="block-data">Participant: <strong>${memberName}</strong></p>
                <p class="block-data">Ajout de: <strong>${amount} FCFA</strong></p>
            </li>
        `;

        ledgerList.insertAdjacentHTML('afterbegin', newBlockHTML);

        blockCount++;
        memberInput.value = '';
        amountInput.value = '';

        // Fin de l'état de chargement
        btnCertify.textContent = originalText;
        btnCertify.disabled = false;
        btnCertify.classList.remove('loading');

    }, 2000); // 2 secondes de délai (Proof of Work)
});

// =========================================================
// 4. SYSTÈME DE THÈME (LIGHT/DARK MODE)
// =========================================================

const themeToggleBtn = document.getElementById('theme-toggle');

// Vérifier la préférence de l'utilisateur stockée
const currentTheme = localStorage.getItem('theme');
if (currentTheme === 'light') {
    document.body.classList.add('light-mode');
    themeToggleBtn.textContent = '🌙';
}

// Bascule de thème
themeToggleBtn.addEventListener('click', function () {
    document.body.classList.toggle('light-mode');

    if (document.body.classList.contains('light-mode')) {
        themeToggleBtn.textContent = '🌙';
        localStorage.setItem('theme', 'light');
    } else {
        themeToggleBtn.textContent = '☀️';
        localStorage.setItem('theme', 'dark');
    }
});

// =========================================================
// 5. ANIMATIONS AU DÉFILEMENT (INTERSECTION OBSERVER)
// =========================================================

const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px"
};

const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

const elementsToAnimate = document.querySelectorAll('.card, .section-heading, .demo-container, .hero-content');

elementsToAnimate.forEach(el => {
    el.classList.add('fade-in-element');
    observer.observe(el);
});
