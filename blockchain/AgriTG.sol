// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// =================================================================
// AGRI TG — Smart Contract
// Réseau : Ethereum Sepolia Testnet
//
// DÉPLOIEMENT (Remix IDE) :
//   1. Aller sur https://remix.ethereum.org
//   2. Créer un fichier AgriTG.sol et coller ce code
//   3. Compiler avec Solidity 0.8.19
//   4. Dans "Deploy & Run" :
//        Environment → Injected Provider (MetaMask)
//        Réseau      → Sepolia Testnet
//   5. Cliquer "Deploy"
//   6. Copier l'adresse du contrat → mettre dans blockchain.js
// =================================================================

contract AgriTG {

    // ── Propriétaire du contrat (président de la coopérative) ──
    address public owner;

    // ── Événements émis sur la blockchain ──────────────────────
    // Ces événements sont visibles sur Etherscan et écoutables
    // via ethers.js dans le dashboard

    event TransactionEnregistree(
        bytes32 indexed txHash,   // Hash SHA-256 de la transaction
        uint256 montant,          // Montant en FCFA
        string  typeTx,           // "cotisation", "depense", etc.
        uint256 timestamp         // Horodatage
    );

    event VoteEnregistre(
        bytes32 indexed voteHash, // Hash SHA-256 du vote
        bytes32 propositionHash,  // Hash de la proposition
        string  choix,            // "oui" ou "non"
        uint256 timestamp
    );

    event RapportAncre(
        bytes32 indexed rapportHash, // Hash SHA-256 du rapport
        uint16  annee,
        uint8   mois,
        uint256 timestamp
    );

    // ── Structures de données ───────────────────────────────────

    struct TransactionRecord {
        bytes32 txHash;
        uint256 montant;
        string  typeTx;
        uint256 timestamp;
        bool    existe;
    }

    struct VoteRecord {
        bytes32 voteHash;
        string  choix;
        uint256 timestamp;
        bool    existe;
    }

    // ── Stockage (mapping hash → enregistrement) ────────────────
    mapping(bytes32 => TransactionRecord) public transactions;
    mapping(bytes32 => VoteRecord)        public votes;
    mapping(bytes32 => bool)              public rapports;

    // ── Compteurs pour les statistiques ─────────────────────────
    uint256 public totalTransactions;
    uint256 public totalVotes;
    uint256 public totalRapports;

    // ── Contrôle d'accès : adresses autorisées ──────────────────
    // President + Tresorier peuvent écrire
    mapping(address => bool) public autorise;

    // ── Modificateurs ───────────────────────────────────────────

    modifier seulementOwner() {
        require(msg.sender == owner, "AgriTG: reservé au président");
        _;
    }

    modifier seulementAutorise() {
        require(
            autorise[msg.sender] || msg.sender == owner,
            "AgriTG: adresse non autorisée"
        );
        _;
    }

    // ── Constructeur ────────────────────────────────────────────

    constructor() {
        owner = msg.sender;
        autorise[msg.sender] = true; // Le déployeur est autorisé
    }

    // =============================================================
    // FONCTIONS D'ADMINISTRATION
    // =============================================================

    /// @notice Ajouter une adresse autorisée (trésorier, etc.)
    function ajouterAutorise(address _adresse) external seulementOwner {
        autorise[_adresse] = true;
    }

    /// @notice Retirer une autorisation
    function retirerAutorise(address _adresse) external seulementOwner {
        require(_adresse != owner, "AgriTG: impossible de retirer le owner");
        autorise[_adresse] = false;
    }

    // =============================================================
    // FONCTIONS PRINCIPALES
    // =============================================================

    /// @notice Ancrer une transaction sur la blockchain
    /// @param _txHash  Hash SHA-256 de la transaction (depuis Supabase)
    /// @param _montant Montant en FCFA
    /// @param _typeTx  Type : "cotisation", "depense", "prime", etc.
    /// @return success Vrai si l'enregistrement a réussi
    function enregistrerTransaction(
        bytes32 _txHash,
        uint256 _montant,
        string calldata _typeTx
    )
        external
        seulementAutorise
        returns (bool success)
    {
        // Empêcher le double enregistrement
        require(
            !transactions[_txHash].existe,
            "AgriTG: transaction déjà enregistrée"
        );

        transactions[_txHash] = TransactionRecord({
            txHash    : _txHash,
            montant   : _montant,
            typeTx    : _typeTx,
            timestamp : block.timestamp,
            existe    : true
        });

        totalTransactions++;

        emit TransactionEnregistree(_txHash, _montant, _typeTx, block.timestamp);
        return true;
    }

    /// @notice Ancrer un vote sur la blockchain
    /// @param _voteHash      Hash SHA-256 du vote (depuis Supabase)
    /// @param _propositionHash Hash de la proposition concernée
    /// @param _choix         "oui", "non" ou "abstention"
    function enregistrerVote(
        bytes32 _voteHash,
        bytes32 _propositionHash,
        string calldata _choix
    )
        external
        seulementAutorise
        returns (bool success)
    {
        require(
            !votes[_voteHash].existe,
            "AgriTG: vote déjà enregistré"
        );

        votes[_voteHash] = VoteRecord({
            voteHash  : _voteHash,
            choix     : _choix,
            timestamp : block.timestamp,
            existe    : true
        });

        totalVotes++;

        emit VoteEnregistre(_voteHash, _propositionHash, _choix, block.timestamp);
        return true;
    }

    /// @notice Ancrer un rapport mensuel
    /// @param _rapportHash Hash SHA-256 du rapport
    /// @param _annee       Année du rapport (ex: 2026)
    /// @param _mois        Mois du rapport (1-12)
    function ancrerRapport(
        bytes32 _rapportHash,
        uint16  _annee,
        uint8   _mois
    )
        external
        seulementOwner
        returns (bool success)
    {
        require(!rapports[_rapportHash], "AgriTG: rapport déjà ancré");
        require(_mois >= 1 && _mois <= 12, "AgriTG: mois invalide");

        rapports[_rapportHash] = true;
        totalRapports++;

        emit RapportAncre(_rapportHash, _annee, _mois, block.timestamp);
        return true;
    }

    // =============================================================
    // FONCTIONS DE CONSULTATION (gratuites — pas de gas)
    // =============================================================

    /// @notice Vérifier si une transaction existe on-chain
    function transactionExiste(bytes32 _txHash)
        external view returns (bool)
    {
        return transactions[_txHash].existe;
    }

    /// @notice Consulter les détails d'une transaction
    function consulterTransaction(bytes32 _txHash)
        external view
        returns (uint256 montant, string memory typeTx, uint256 timestamp)
    {
        require(transactions[_txHash].existe, "AgriTG: transaction introuvable");
        TransactionRecord memory r = transactions[_txHash];
        return (r.montant, r.typeTx, r.timestamp);
    }

    /// @notice Vérifier si un vote existe on-chain
    function voteExiste(bytes32 _voteHash)
        external view returns (bool)
    {
        return votes[_voteHash].existe;
    }

    /// @notice Vérifier si un rapport est ancré
    function rapportExiste(bytes32 _rapportHash)
        external view returns (bool)
    {
        return rapports[_rapportHash];
    }

    /// @notice Statistiques globales du contrat
    function statistiques()
        external view
        returns (
            uint256 nbTransactions,
            uint256 nbVotes,
            uint256 nbRapports,
            address proprietaire
        )
    {
        return (totalTransactions, totalVotes, totalRapports, owner);
    }
}
