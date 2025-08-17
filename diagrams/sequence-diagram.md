sequenceDiagram
    participant U as Utilisateur
    participant UI as Interface Web/Mobile
    participant Auth as Service Auth
    participant AS as Service Abonnement
    participant PS as Service Paiement
    participant NS as Service Notification
    participant TS as Service Ticket
    participant DB as Base de données
    participant PG as Passerelle Paiement
    
    U->>UI: Consulte page d'accueil
    UI->>AS: Récupère abonnements par localisation
    AS->>DB: Query abonnements par zone
    DB-->>AS: Liste abonnements
    AS-->>UI: Abonnements disponibles
    UI-->>U: Affiche abonnements avec filtres
    
    U->>UI: Sélectionne un abonnement
    UI->>AS: Demande détails abonnement
    AS->>DB: Query détails complets
    DB-->>AS: Détails abonnement
    AS-->>UI: Informations complètes
    UI-->>U: Affiche détails (prix, contenu, options)
    
    U->>UI: Clique "Souscrire"
    UI->>Auth: Vérifie authentification
    Auth-->>UI: Statut connexion
    
    alt Utilisateur non connecté
        UI-->>U: Redirige vers connexion
        U->>UI: Saisit identifiants
        UI->>Auth: Valide credentials
        Auth->>DB: Vérifie utilisateur
        DB-->>Auth: Données utilisateur
        Auth-->>UI: Token authentification
    end
    
    U->>UI: Choisit mode récupération (livraison/retrait)
    
    alt Mode livraison
        U->>UI: Confirme adresse livraison
        UI->>AS: Vérifie zone de livraison
        AS-->>UI: Confirmation faisabilité
    else Mode retrait
        UI->>AS: Récupère points de retrait
        AS-->>UI: Liste points disponibles
        U->>UI: Sélectionne point de retrait
    end
    
    U->>UI: Confirme souscription
    UI->>AS: Crée souscription temporaire
    AS->>DB: Insert souscription (statut: EN_ATTENTE)
    DB-->>AS: ID souscription
    
    UI->>PS: Initie processus paiement
    PS->>PG: Demande paiement
    PG-->>U: Interface paiement
    U->>PG: Effectue paiement
    PG->>PS: Confirmation paiement
    PS->>DB: Met à jour statut paiement
    
    alt Paiement réussi
        PS->>AS: Confirme paiement
        AS->>DB: Update souscription (statut: ACTIVE)
        AS->>TS: Génère ticket
        TS->>DB: Sauvegarde ticket avec QR
        TS-->>AS: Ticket généré
        AS->>NS: Déclenche notifications
        NS->>U: Email confirmation + ticket
        NS->>UI: Notification push
        UI-->>U: Confirmation souscription réussie
    else Paiement échoué
        PS->>AS: Signale échec
        AS->>DB: Update souscription (statut: ECHEC)
        UI-->>U: Message d'erreur
    end