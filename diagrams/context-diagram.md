graph TB
    %% Acteurs principaux
    subgraph "Utilisateurs Finaux"
        Particuliers[👤 Particuliers<br/>- Recherche abonnements<br/>- Souscriptions<br/>- Avis et évaluations]
        Entreprises[🏢 Entreprises<br/>- Abonnements employés<br/>- Gestion collective<br/>- Facturation groupée]
        Etudiants[🎓 Étudiants<br/>- Solutions économiques<br/>- Livraison campus<br/>- Partage d'abonnements]
    end
    
    %% Système central
    subgraph "Plateforme Juna"
        CoreSystem[🍽️ SYSTÈME JUNA<br/>Plateforme d'abonnements<br/>alimentaires géolocalisés]
    end
    
    %% Fournisseurs
    subgraph "Fournisseurs de Services"
        Restaurants[🍴 Restaurants<br/>- Propose menus<br/>- Gère commandes<br/>- Assure qualité]
        Traiteurs[👨‍🍳 Traiteurs<br/>- Services événements<br/>- Menus spécialisés<br/>- Livraison groupée]
        Commerces[🏪 Commerces<br/>- Produits locaux<br/>- Circuits courts<br/>- Approvisionnement]
    end
    
    %% Équipe interne
    subgraph "Équipe Juna"
        AdminTeam[👥 Équipe Admin<br/>- Validation propositions<br/>- Modération contenu<br/>- Support utilisateur]
        Marketing[📢 Marketing<br/>- Promotion plateforme<br/>- Acquisition clients<br/>- Partenariats]
        DevTeam[💻 Équipe Tech<br/>- Développement<br/>- Maintenance<br/>- Monitoring]
    end
    
    %% Services externes
    subgraph "Services Externes"
        PaymentProviders[💳 Fournisseurs Paiement<br/>- Mobile Money<br/>- Cartes bancaires<br/>- Virements]
        DeliveryServices[🚚 Services Livraison<br/>- Transport repas<br/>- Géolocalisation<br/>- Suivi colis]
        TechServices[☁️ Services Cloud<br/>- Hébergement<br/>- Storage<br/>- Monitoring]
    end
    
    %% Régulateurs et partenaires
    subgraph "Environnement Réglementaire"
        GovAgencies[🏛️ Autorités<br/>- Réglementation alimentaire<br/>- Protection consommateur<br/>- Fiscalité]
        FinancialPartners[🏦 Partenaires Financiers<br/>- Banques<br/>- Assurances<br/>- Crédit]
        LocalPartners[🤝 Partenaires Locaux<br/>- Collectivités<br/>- Associations<br/>- Événements]
    end
    
    %% Flux entrants vers Juna
    Particuliers -->|Inscriptions<br/>Souscriptions<br/>Propositions<br/>Avis| CoreSystem
    Entreprises -->|Commandes groupées<br/>Contrats<br/>Facturations| CoreSystem
    Etudiants -->|Abonnements<br/>Partages<br/>Feedback| CoreSystem
    
    Restaurants -->|Offres de service<br/>Menus<br/>Disponibilités<br/>Tarifs| CoreSystem
    Traiteurs -->|Prestations<br/>Créneaux<br/>Spécialités| CoreSystem
    Commerces -->|Produits<br/>Stock<br/>Promotions| CoreSystem
    
    AdminTeam -->|Validations<br/>Modérations<br/>Configurations| CoreSystem
    Marketing -->|Campagnes<br/>Analytics<br/>Retours clients| CoreSystem
    DevTeam -->|Mises à jour<br/>Correctifs<br/>Nouvelles features| CoreSystem
    
    PaymentProviders -->|Confirmations<br/>Statuts transactions<br/>Webhooks| CoreSystem
    DeliveryServices -->|Statuts livraisons<br/>Géolocalisation<br/>Confirmations| CoreSystem
    TechServices -->|Monitoring<br/>Alertes<br/>Métriques| CoreSystem
    
    %% Flux sortants depuis Juna
    CoreSystem -->|Abonnements disponibles<br/>Confirmations<br/>Notifications<br/>Tickets| Particuliers
    CoreSystem -->|Rapports<br/>Factures<br/>Statistiques<br/>Dashboard| Entreprises
    CoreSystem -->|Offres étudiantes<br/>Réductions<br/>Alertes| Etudiants
    
    CoreSystem -->|Commandes<br/>Planning<br/>Paiements<br/>Évaluations| Restaurants
    CoreSystem -->|Demandes prestations<br/>Cahiers des charges<br/>Contrats| Traiteurs
    CoreSystem -->|Commandes produits<br/>Prévisions<br/>Paiements| Commerces
    
    CoreSystem -->|Données analytiques<br/>Rapports activité<br/>Alertes système| AdminTeam
    CoreSystem -->|Métriques conversion<br/>Données utilisateurs<br/>ROI campagnes| Marketing
    CoreSystem -->|Logs erreurs<br/>Performances<br/>Incidents| DevTeam
    
    CoreSystem -->|Demandes paiement<br/>Données transactions<br/>Reconciliations| PaymentProviders
    CoreSystem -->|Commandes livraison<br/>Adresses<br/>Instructions| DeliveryServices
    CoreSystem -->|Données système<br/>Logs<br/>Métriques| TechServices
    
    %% Flux de conformité
    CoreSystem -->|Rapports conformité<br/>Données fiscales<br/>Audits| GovAgencies
    CoreSystem -->|Données financières<br/>Garanties<br/>Assurances| FinancialPartners
    CoreSystem -->|Partenariats<br/>Événements<br/>Promotions locales| LocalPartners
    
    GovAgencies -->|Réglementations<br/>Autorisations<br/>Contrôles| CoreSystem
    FinancialPartners -->|Services bancaires<br/>Assurances<br/>Financements| CoreSystem
    LocalPartners -->|Opportunités<br/>Événements<br/>Réseaux| CoreSystem
    
    %% Styles
    classDef userGroup fill:#e3f2fd,stroke:#1565c0
    classDef juna fill:#4caf50,stroke:#2e7d32,color:#fff
    classDef provider fill:#fff3e0,stroke:#f57c00
    classDef internal fill:#f3e5f5,stroke:#7b1fa2
    classDef external fill:#ffebee,stroke:#d32f2f
    classDef regulatory fill:#e0f2f1,stroke:#00695c
    
    class Particuliers,Entreprises,Etudiants userGroup
    class CoreSystem juna
    class Restaurants,Traiteurs,Commerces provider
    class AdminTeam,Marketing,DevTeam internal
    class PaymentProviders,DeliveryServices,TechServices external
    class GovAgencies,FinancialPartners,LocalPartners regulatory