flowchart LR
    %% Entités externes
    User[👤 Utilisateur]
    Provider[🍽️ Fournisseur]
    Admin[👨‍💼 Administrateur]
    PaymentGW[💳 Passerelle Paiement]
    EmailSrv[📧 Service Email]
    
    %% Processus niveau 0
    subgraph "Système Juna"
        P0[🔄 Plateforme Juna<br/>Gestion des abonnements alimentaires]
    end
    
    %% Flux de données niveau 0
    User -->|Données inscription<br/>Préférences<br/>Propositions| P0
    Provider -->|Offres de service<br/>Disponibilités| P0
    Admin -->|Validations<br/>Modérations| P0
    PaymentGW -->|Confirmations paiement<br/>Statuts transaction| P0
    
    P0 -->|Abonnements disponibles<br/>Confirmations<br/>Tickets| User
    P0 -->|Commandes<br/>Demandes de service| Provider
    P0 -->|Rapports<br/>Alertes| Admin
    P0 -->|Demandes paiement| PaymentGW
    P0 -->|Notifications<br/>Confirmations| EmailSrv
    
    %% Décomposition niveau 1
    subgraph "Processus Niveau 1"
        P1[🔐 Gestion Authentification]
        P2[📋 Gestion Abonnements]
        P3[💰 Gestion Paiements]
        P4[📍 Gestion Géolocalisation]
        P5[⭐ Gestion Avis]
        P6[🎧 Service Client]
        P7[👑 Administration]
    end
    
    %% Datastores
    subgraph "Stockage de données"
        D1[(👥 Utilisateurs)]
        D2[(📋 Abonnements)]
        D3[(💳 Paiements)]
        D4[(📍 Localisations)]
        D5[(⭐ Avis)]
        D6[(🎫 Tickets)]
        D7[(📧 Notifications)]
    end
    
    %% Flux détaillés utilisateur
    User -->|Credentials| P1
    User -->|Recherche, Filtres| P2
    User -->|Infos paiement| P3
    User -->|Position GPS| P4
    User -->|Notes, Commentaires| P5
    User -->|Demandes support| P6
    
    %% Flux vers datastores
    P1 --> D1
    P2 --> D2
    P3 --> D3
    P4 --> D4
    P5 --> D5
    P6 --> D6
    P7 --> D7
    
    %% Flux depuis datastores
    D1 --> P1
    D2 --> P2
    D3 --> P3
    D4 --> P4
    D5 --> P5
    D6 --> P6
    
    %% Flux entre processus
    P1 -->|Token auth| P2
    P1 -->|Token auth| P3
    P1 -->|Token auth| P5
    P1 -->|Token auth| P6
    
    P2 -->|Détails abonnement| P3
    P3 -->|Confirmation paiement| P2
    P2 -->|Localisation requise| P4
    P4 -->|Données géo| P2
    
    %% Flux vers externes
    P3 -->|Demandes transaction| PaymentGW
    PaymentGW -->|Statuts paiement| P3
    
    P6 -->|Notifications| EmailSrv
    P2 -->|Confirmations| EmailSrv
    P3 -->|Reçus| EmailSrv
    
    %% Flux admin
    Admin -->|Commandes admin| P7
    P7 -->|Rapports| Admin
    P7 --> D1
    P7 --> D2
    P7 --> D5
    
    %% Flux fournisseur
    Provider -->|Offres| P2
    P2 -->|Commandes| Provider
    
    %% Styles
    classDef external fill:#ffcdd2,stroke:#d32f2f
    classDef process fill:#e3f2fd,stroke:#1976d2
    classDef datastore fill:#e8f5e8,stroke:#388e3c
    
    class User,Provider,Admin,PaymentGW,EmailSrv external
    class P0,P1,P2,P3,P4,P5,P6,P7 process
    class D1,D2,D3,D4,D5,D6,D7 datastore