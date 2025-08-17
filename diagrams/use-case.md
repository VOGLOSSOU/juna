```mermaid
graph TB
    %% Acteurs
    User[👤 Utilisateur]
    Provider[🍽️ Fournisseur de repas]
    Admin[👨‍💼 Administrateur Juna]
    Support[🎧 Service Client]
    PaymentGateway[💳 Passerelle de paiement]
    
    %% Cas d'utilisation principaux
    subgraph "Gestion des comptes"
        UC1[Créer un compte]
        UC2[Se connecter]
        UC3[Gérer profil]
        UC4[Réinitialiser mot de passe]
    end
    
    subgraph "Navigation et découverte"
        UC5[Consulter page d'accueil]
        UC6[Filtrer abonnements]
        UC7[Rechercher par localisation]
        UC8[Trier abonnements]
    end
    
    subgraph "Gestion des abonnements"
        UC9[Consulter détails abonnement]
        UC10[Souscrire à un abonnement]
        UC11[Proposer abonnement personnalisé]
        UC12[Choisir mode de récupération]
        UC13[Effectuer paiement]
    end
    
    subgraph "Avis et expérience"
        UC14[Noter un abonnement]
        UC15[Rédiger un avis]
        UC16[Partager expérience]
        UC17[Consulter avis]
    end
    
    subgraph "Service client"
        UC18[Contacter support Juna]
        UC19[Contacter fournisseur]
        UC20[Créer réclamation]
        UC21[Suivre ticket support]
    end
    
    subgraph "Administration"
        UC22[Gérer utilisateurs]
        UC23[Valider propositions]
        UC24[Gérer abonnements]
        UC25[Modérer avis]
        UC26[Consulter statistiques]
        UC27[Gérer paiements]
    end
    
    subgraph "Fournisseurs"
        UC28[Proposer services]
        UC29[Gérer commandes]
        UC30[Communiquer avec clients]
    end
    
    %% Relations User
    User --> UC1
    User --> UC2
    User --> UC3
    User --> UC4
    User --> UC5
    User --> UC6
    User --> UC7
    User --> UC8
    User --> UC9
    User --> UC10
    User --> UC11
    User --> UC12
    User --> UC13
    User --> UC14
    User --> UC15
    User --> UC16
    User --> UC17
    User --> UC18
    User --> UC19
    User --> UC20
    User --> UC21
    
    %% Relations Provider
    Provider --> UC28
    Provider --> UC29
    Provider --> UC30
    Provider --> UC2
    Provider --> UC3
    
    %% Relations Admin
    Admin --> UC22
    Admin --> UC23
    Admin --> UC24
    Admin --> UC25
    Admin --> UC26
    Admin --> UC27
    Admin --> UC2
    
    %% Relations Support
    Support --> UC18
    Support --> UC20
    Support --> UC21
    
    %% Relations externes
    PaymentGateway --> UC13
    
    %% Inclusions et extensions
    UC10 -.->|include| UC2
    UC11 -.->|include| UC2
    UC13 -.->|include| UC2
    UC14 -.->|include| UC2
    UC15 -.->|include| UC2
    UC10 -.->|include| UC13
    UC23 -.->|extends| UC11