// pages/phase2.js

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. DÉMO LIVE : NOUVELLE TRANSACTION ---
    const btnNewTx = document.getElementById('btn-new-tx');
    const transactionList = document.querySelector('.transaction-list');

    if (btnNewTx && transactionList) {
        btnNewTx.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Fausse transaction à ajouter
            const amount = Math.floor(Math.random() * 50) * 1000 + 10000; // Entre 10k et 50k
            const isDeposit = Math.random() > 0.3;
            
            const newTxHTML = `
                <div class="tx-item fade-in-element visible" style="background-color: #f0fdf4; border-color: #22c55e;">
                    <div class="tx-user"><div class="avatar-sm img-new" style="background-color: var(--green-primary); color: white; display: flex; align-items: center; justify-content: center; font-size: 10px;">New</div> Nouveau Membre</div>
                    <div class="tx-desc">Cotisation instantanée</div>
                    <div class="tx-amount ${isDeposit ? 'text-green' : 'text-red'}">${isDeposit ? '+' : '-'}${amount.toLocaleString('fr-FR')} CFA</div>
                    <div class="tx-time" style="color: var(--green-primary); font-weight: bold;">À l'instant</div>
                </div>
            `;
            
            // Ajouter avec animation
            transactionList.insertAdjacentHTML('afterbegin', newTxHTML);
        });
    }

    // --- 2. FONCTIONNALITÉ DE VOTE (BLOCKCHAIN) ---
    const btnVoteYes = document.getElementById('btn-vote-yes');
    const btnVoteNo = document.querySelector('.btn-no');
    const progressBar = document.querySelector('.bar-green');
    
    if (btnVoteYes) {
        btnVoteYes.addEventListener('click', () => {
            const originalText = btnVoteYes.textContent;
            btnVoteYes.textContent = "⏳ Valid...";
            btnVoteYes.disabled = true;
            btnVoteYes.style.opacity = '0.7';

            if(btnVoteNo) btnVoteNo.disabled = true;

            // Simuler le minage (2 secondes)
            setTimeout(() => {
                // Générer un faux hash
                const chars = '0123456789abcdef';
                let hash = '0x';
                for (let i = 0; i < 8; i++) hash += chars[Math.floor(Math.random() * chars.length)];
                
                // Mettre à jour l'UI
                btnVoteYes.textContent = "✓ Voté";
                btnVoteYes.style.backgroundColor = "var(--green-dark)";
                btnVoteYes.style.opacity = '1';
                
                // Mettre à jour la barre (ex: passe de 75% à 80%)
                if (progressBar) {
                    progressBar.style.width = "80%";
                }

                // Afficher le hash
                const voteMeta = document.querySelector('.vote-meta');
                if (voteMeta) {
                    voteMeta.innerHTML = `<span class="text-green">✓ Enregistré sur Blockchain (${hash}...)</span>`;
                }

            }, 2000);
        });
    }

    // --- DEMO MOBILE (SIMULATEUR) ---
    const btnDemoMobile = document.getElementById('btn-demo-mobile');
    const mobileModal = document.getElementById('mobile-demo-modal');
    const closeMobileBtn = document.getElementById('close-mobile-demo');
    
    if (btnDemoMobile && mobileModal) {
        btnDemoMobile.addEventListener('click', (e) => {
            e.preventDefault();
            mobileModal.style.display = 'flex';
        });
        
        closeMobileBtn.addEventListener('click', () => {
            mobileModal.style.display = 'none';
        });
        
        // Fermer en cliquant à côté
        mobileModal.addEventListener('click', (e) => {
            if(e.target === mobileModal) {
                mobileModal.style.display = 'none';
            }
        });
    }

});
