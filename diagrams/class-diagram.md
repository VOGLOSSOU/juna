classDiagram
    class User {
        +String id
        +String nom
        +String email
        +String motDePasse
        +String numero
        +Localisation localisation
        +Date dateCreation
        +Boolean isActive
        +UserType type
        +creerCompte()
        +seConnecter()
        +modifierProfil()
        +reinitialiserMotDePasse()
    }
    
    class Localisation {
        +String pays
        +String region
        +String ville
        +Double latitude
        +Double longitude
        +String adresseComplete
        +calculerDistance(Localisation autre)
    }
    
    class Abonnement {
        +String id
        +String nom
        +String description
        +TypeNourriture typeNourriture
        +Double prix
        +Duree duree
        +Frequence frequence
        +Localisation zone
        +Boolean isPublic
        +String fournisseurId
        +Date dateCreation
        +StatutAbonnement statut
        +consulterDetails()
        +modifierStatut()
    }
    
    class Souscription {
        +String id
        +String userId
        +String abonnementId
        +Date dateSouscription
        +Date dateExpiration
        +ModeRecuperation modeRecuperation
        +StatutSouscription statut
        +String ticketReference
        +souscrire()
        +annuler()
        +renouveler()
    }
    
    class Paiement {
        +String id
        +String souscriptionId
        +Double montant
        +MethodePaiement methode
        +StatutPaiement statut
        +Date dateTransaction
        +String referenceTransaction
        +effectuerPaiement()
        +rembourser()
    }
    
    class Avis {
        +String id
        +String userId
        +String abonnementId
        +Integer note
        +String commentaire
        +Date dateCreation
        +Boolean isModere
        +Boolean isVisible
        +publier()
        +moderer()
    }
    
    class PropositionAbonnement {
        +String id
        +String userId
        +String typeNourriture
        +String frequence
        +Localisation zone
        +Double prixSouhaite
        +String description
        +StatutProposition statut
        +Date dateProposition
        +String commentaireValidation
        +soumettre()
        +valider()
        +rejeter()
    }
    
    class Ticket {
        +String id
        +String souscriptionId
        +String qrCode
        +Date dateGeneration
        +Date dateUtilisation
        +Boolean isUtilise
        +genererQR()
        +valider()
    }
    
    class TicketSupport {
        +String id
        +String userId
        +TypeProbleme type
        +String sujet
        +String description
        +StatutTicket statut
        +Date dateCreation
        +String assigneA
        +creer()
        +traiter()
        +fermer()
    }
    
    class Fournisseur {
        +String id
        +String nom
        +String email
        +String telephone
        +Localisation adresse
        +String description
        +Boolean isActif
        +List~String~ specialites
        +ajouterAbonnement()
        +gererCommandes()
    }
    
    class Livraison {
        +String id
        +String souscriptionId
        +Localisation adresseLivraison
        +Date dateProgrammee
        +Date dateEffective
        +StatutLivraison statut
        +String livreurId
        +programmer()
        +effectuer()
    }
    
    class Administrateur {
        +String id
        +String nom
        +String email
        +Role role
        +List~Permission~ permissions
        +gererUtilisateurs()
        +validerPropositions()
        +consulterStatistiques()
    }
    
    %% Énumérations
    class UserType {
        <<enumeration>>
        PARTICULIER
        ENTREPRISE
        FOURNISSEUR
    }
    
    class StatutAbonnement {
        <<enumeration>>
        ACTIF
        INACTIF
        SUSPENDU
    }
    
    class ModeRecuperation {
        <<enumeration>>
        LIVRAISON
        RETRAIT
    }
    
    class MethodePaiement {
        <<enumeration>>
        MOBILE_MONEY
        CARTE_BANCAIRE
        VIREMENT
    }
    
    class StatutPaiement {
        <<enumeration>>
        EN_ATTENTE
        VALIDE
        ECHEC
        REMBOURSE
    }
    
    class StatutProposition {
        <<enumeration>>
        EN_ATTENTE
        VALIDEE
        REJETEE
    }
    
    User ||--o{ Souscription : souscrit
    User ||--o{ Avis : redige
    User ||--o{ PropositionAbonnement : propose
    User ||--o{ TicketSupport : cree
    User ||--|| Localisation : habite
    
    Abonnement ||--o{ Souscription : fait_objet
    Abonnement ||--o{ Avis : recoit
    Abonnement ||--|| Fournisseur : fourni_par
    Abonnement ||--|| Localisation : localise
    
    Souscription ||--|| Paiement : genere
    Souscription ||--o| Ticket : genere
    Souscription ||--o| Livraison : necessite
    
    PropositionAbonnement ||--|| User : proposee_par
    PropositionAbonnement ||--|| Localisation : localise
    
    Fournisseur ||--o{ Abonnement : propose
    Fournisseur ||--|| Localisation : situe
    
    Administrateur ||--o{ PropositionAbonnement : valide
    Administrateur ||--o{ TicketSupport : traite