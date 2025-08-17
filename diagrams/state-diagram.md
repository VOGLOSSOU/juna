stateDiagram-v2
    [*] --> EnCours : Utilisateur sélectionne abonnement
    
    EnCours : 🛒 En cours de souscription
    EnCours : - Formulaire rempli
    EnCours : - Mode récupération choisi
    
    EnCours --> EnAttentePaiement : Confirmer souscription
    
    EnAttentePaiement : ⏳ En attente de paiement
    EnAttentePaiement : - Transaction initiée
    EnAttentePaiement : - Redirection passerelle
    
    EnAttentePaiement --> Active : Paiement réussi
    EnAttentePaiement --> Echec : Paiement échoué
    EnAttentePaiement --> Annulee : Timeout ou abandon
    
    Active : ✅ Souscription active
    Active : - Paiement validé
    Active : - Ticket généré
    Active : - Services accessibles
    
    Active --> Suspendue : Problème détecté
    Active --> Expiree : Fin de période
    Active --> Annulee : Annulation utilisateur
    
    Suspendue : ⚠️ Suspendue
    Suspendue : - Problème de paiement
    Suspendue : - Violation conditions
    
    Suspendue --> Active : Problème résolu
    Suspendue --> Annulee : Suspension définitive
    
    Expiree : ⏰ Expirée
    Expiree : - Période terminée
    Expiree : - En attente renouvellement
    
    Expiree --> Active : Renouvellement
    Expiree --> Archivee : Pas de renouvellement
    
    Echec : ❌ Échec de paiement
    Echec : - Transaction refusée
    Echec : - Fonds insuffisants
    
    Echec --> EnAttentePaiement : Nouvelle tentative
    Echec --> Annulee : Abandon définitif
    
    Annulee : 🚫 Annulée
    Annulee : - Par l'utilisateur
    Annulee : - Par l'administrateur
    Annulee : - Abandon processus
    
    Archivee : 📦 Archivée
    Archivee : - Données conservées
    Archivee : - Plus d'accès services
    
    Annulee --> [*]
    Archivee --> [*]
    
    note right of Active
        États principaux où l'utilisateur
        peut utiliser les services
    end note
    
    note right of Suspendue
        État temporaire nécessitant
        une action corrective
    end note