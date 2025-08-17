# Schéma de base de données - Juna

## 1. Tables principales

### 1.1 Table UTILISATEURS
```sql
CREATE TABLE utilisateurs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    mot_de_passe_hash VARCHAR(255) NOT NULL,
    numero_telephone VARCHAR(20),
    type_utilisateur ENUM('PARTICULIER', 'ENTREPRISE', 'FOURNISSEUR') DEFAULT 'PARTICULIER',
    is_active BOOLEAN DEFAULT true,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_derniere_connexion TIMESTAMP,
    localisation_id UUID REFERENCES localisations(id),
    photo_profil_url VARCHAR(500),
    preferences_json JSONB,
    
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT telephone_format CHECK (numero_telephone ~* '^\+?[1-9]\d{1,14}$')
);

CREATE INDEX idx_utilisateurs_email ON utilisateurs(email);
CREATE INDEX idx_utilisateurs_type ON utilisateurs(type_utilisateur);
CREATE INDEX idx_utilisateurs_actif ON utilisateurs(is_active);
```

### 1.2 Table LOCALISATIONS
```sql
CREATE TABLE localisations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pays VARCHAR(100) NOT NULL,
    region VARCHAR(100),
    ville VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    adresse_complete TEXT,
    code_postal VARCHAR(20),
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT lat_range CHECK (latitude >= -90 AND latitude <= 90),
    CONSTRAINT lng_range CHECK (longitude >= -180 AND longitude <= 180)
);

CREATE INDEX idx_localisations_pays ON localisations(pays);
CREATE INDEX idx_localisations_ville ON localisations(ville);
CREATE INDEX idx_localisations_coords ON localisations(latitude, longitude);
```

### 1.3 Table FOURNISSEURS
```sql
CREATE TABLE fournisseurs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom VARCHAR(200) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telephone VARCHAR(20),
    description TEXT,
    specialites TEXT[],
    is_actif BOOLEAN DEFAULT true,
    date_inscription TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    localisation_id UUID REFERENCES localisations(id),
    logo_url VARCHAR(500),
    documents_json JSONB,
    
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})
);

CREATE INDEX idx_fournisseurs_actif ON fournisseurs(is_actif);
CREATE INDEX idx_fournisseurs_specialites ON fournisseurs USING GIN(specialites);
```

### 1.4 Table ABONNEMENTS
```sql
CREATE TABLE abonnements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom VARCHAR(200) NOT NULL,
    description TEXT,
    type_nourriture ENUM('AFRICAINE', 'EUROPEENNE', 'ASIATIQUE', 'AMERICAINE', 'VEGETARIENNE', 'HALAL', 'AUTRE'),
    prix DECIMAL(10, 2) NOT NULL,
    duree ENUM('HEBDOMADAIRE', 'MENSUEL', 'TRIMESTRIEL', 'ANNUEL'),
    frequence ENUM('QUOTIDIEN', 'PLUSIEURS_FOIS_SEMAINE', 'HEBDOMADAIRE', 'MENSUEL'),
    is_public BOOLEAN DEFAULT true,
    statut ENUM('ACTIF', 'INACTIF', 'SUSPENDU') DEFAULT 'ACTIF',
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fournisseur_id UUID REFERENCES fournisseurs(id),
    localisation_id UUID REFERENCES localisations(id),
    images_urls TEXT[],
    details_json JSONB,
    
    CONSTRAINT prix_positif CHECK (prix > 0)
);

CREATE INDEX idx_abonnements_type ON abonnements(type_nourriture);
CREATE INDEX idx_abonnements_prix ON abonnements(prix);
CREATE INDEX idx_abonnements_statut ON abonnements(statut);
CREATE INDEX idx_abonnements_localisation ON abonnements(localisation_id);
CREATE INDEX idx_abonnements_fournisseur ON abonnements(fournisseur_id);
```

### 1.5 Table SOUSCRIPTIONS
```sql
CREATE TABLE souscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    utilisateur_id UUID REFERENCES utilisateurs(id),
    abonnement_id UUID REFERENCES abonnements(id),
    date_souscription TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_expiration TIMESTAMP NOT NULL,
    mode_recuperation ENUM('LIVRAISON', 'RETRAIT') NOT NULL,
    statut_souscription ENUM('EN_ATTENTE', 'ACTIVE', 'SUSPENDUE', 'EXPIREE', 'ANNULEE') DEFAULT 'EN_ATTENTE',
    ticket_reference VARCHAR(50) UNIQUE,
    details_recuperation_json JSONB,
    
    CONSTRAINT date_expiration_future CHECK (date_expiration > date_souscription)
);

CREATE INDEX idx_souscriptions_utilisateur ON souscriptions(utilisateur_id);
CREATE INDEX idx_souscriptions_abonnement ON souscriptions(abonnement_id);
CREATE INDEX idx_souscriptions_statut ON souscriptions(statut_souscription);
CREATE INDEX idx_souscriptions_expiration ON souscriptions(date_expiration);
```

### 1.6 Table PAIEMENTS
```sql
CREATE TABLE paiements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    souscription_id UUID REFERENCES souscriptions(id),
    montant DECIMAL(10, 2) NOT NULL,
    methode_paiement ENUM('MOBILE_MONEY', 'CARTE_BANCAIRE', 'VIREMENT', 'ESPECES'),
    statut_paiement ENUM('EN_ATTENTE', 'VALIDE', 'ECHEC', 'REMBOURSE') DEFAULT 'EN_ATTENTE',
    date_transaction TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reference_transaction VARCHAR(100) UNIQUE,
    reference_externe VARCHAR(100),
    details_paiement_json JSONB,
    
    CONSTRAINT montant_positif CHECK (montant > 0)
);

CREATE INDEX idx_paiements_souscription ON paiements(souscription_id);
CREATE INDEX idx_paiements_statut ON paiements(statut_paiement);
CREATE INDEX idx_paiements_methode ON paiements(methode_paiement);
CREATE INDEX idx_paiements_reference ON paiements(reference_transaction);
```

### 1.7 Table AVIS
```sql
CREATE TABLE avis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    utilisateur_id UUID REFERENCES utilisateurs(id),
    abonnement_id UUID REFERENCES abonnements(id),
    note INTEGER NOT NULL,
    commentaire TEXT,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_modere BOOLEAN DEFAULT false,
    is_visible BOOLEAN DEFAULT true,
    moderateur_id UUID REFERENCES utilisateurs(id),
    date_moderation TIMESTAMP,
    
    CONSTRAINT note_valide CHECK (note >= 1 AND note <= 5),
    CONSTRAINT avis_unique UNIQUE(utilisateur_id, abonnement_id)
);

CREATE INDEX idx_avis_abonnement ON avis(abonnement_id);
CREATE INDEX idx_avis_utilisateur ON avis(utilisateur_id);
CREATE INDEX idx_avis_note ON avis(note);
CREATE INDEX idx_avis_visible ON avis(is_visible);
```

---

## 2. Tables de support

### 2.1 Table PROPOSITIONS_ABONNEMENTS
```sql
CREATE TABLE propositions_abonnements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    utilisateur_id UUID REFERENCES utilisateurs(id),
    type_nourriture VARCHAR(100),
    frequence VARCHAR(50),
    localisation_id UUID REFERENCES localisations(id),
    prix_souhaite DECIMAL(10, 2),
    description TEXT,
    statut_proposition ENUM('EN_ATTENTE', 'VALIDEE', 'REJETEE') DEFAULT 'EN_ATTENTE',
    date_proposition TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    commentaire_validation TEXT,
    validateur_id UUID REFERENCES utilisateurs(id),
    date_validation TIMESTAMP,
    is_public BOOLEAN DEFAULT false,
    
    CONSTRAINT prix_souhaite_positif CHECK (prix_souhaite > 0)
);

CREATE INDEX idx_propositions_utilisateur ON propositions_abonnements(utilisateur_id);
CREATE INDEX idx_propositions_statut ON propositions_abonnements(statut_proposition);
CREATE INDEX idx_propositions_date ON propositions_abonnements(date_proposition);
```

### 2.2 Table TICKETS
```sql
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    souscription_id UUID REFERENCES souscriptions(id),
    qr_code VARCHAR(255) UNIQUE NOT NULL,
    date_generation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_utilisation TIMESTAMP,
    is_utilise BOOLEAN DEFAULT false,
    details_utilisation_json JSONB
);

CREATE INDEX idx_tickets_souscription ON tickets(souscription_id);
CREATE INDEX idx_tickets_qr ON tickets(qr_code);
CREATE INDEX idx_tickets_utilise ON tickets(is_utilise);
```

### 2.3 Table LIVRAISONS
```sql
CREATE TABLE livraisons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    souscription_id UUID REFERENCES souscriptions(id),
    adresse_livraison TEXT NOT NULL,
    date_programmee TIMESTAMP NOT NULL,
    date_effective TIMESTAMP,
    statut_livraison ENUM('PROGRAMMEE', 'EN_COURS', 'LIVREE', 'ECHEC') DEFAULT 'PROGRAMMEE',
    livreur_id UUID,
    commentaires TEXT,
    coordonnees_livraison POINT,
    
    CONSTRAINT date_programmee_future CHECK (date_programmee > CURRENT_TIMESTAMP)
);

CREATE INDEX idx_livraisons_souscription ON livraisons(souscription_id);
CREATE INDEX idx_livraisons_statut ON livraisons(statut_livraison);
CREATE INDEX idx_livraisons_date ON livraisons(date_programmee);
CREATE INDEX idx_livraisons_coords ON livraisons USING GIST(coordonnees_livraison);
```

### 2.4 Table TICKETS_SUPPORT
```sql
CREATE TABLE tickets_support (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    utilisateur_id UUID REFERENCES utilisateurs(id),
    type_probleme ENUM('TECHNIQUE', 'PAIEMENT', 'LIVRAISON', 'QUALITE', 'AUTRE'),
    sujet VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    statut_ticket ENUM('OUVERT', 'EN_COURS', 'RESOLU', 'FERME') DEFAULT 'OUVERT',
    priorite ENUM('BASSE', 'NORMALE', 'HAUTE', 'URGENTE') DEFAULT 'NORMALE',
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_resolution TIMESTAMP,
    assigne_a UUID REFERENCES utilisateurs(id),
    resolution TEXT
);

CREATE INDEX idx_tickets_support_utilisateur ON tickets_support(utilisateur_id);
CREATE INDEX idx_tickets_support_statut ON tickets_support(statut_ticket);
CREATE INDEX idx_tickets_support_priorite ON tickets_support(priorite);
CREATE INDEX idx_tickets_support_date ON tickets_support(date_creation);
```

---

## 3. Vues matérialisées pour optimisation

### 3.1 Vue des statistiques d'abonnements
```sql
CREATE MATERIALIZED VIEW vue_stats_abonnements AS
SELECT 
    a.id,
    a.nom,
    COUNT(s.id) as nombre_souscripteurs,
    AVG(av.note) as note_moyenne,
    COUNT(av.id) as nombre_avis,
    SUM(p.montant) as revenus_total,
    a.fournisseur_id,
    a.localisation_id
FROM abonnements a
LEFT JOIN souscriptions s ON a.id = s.abonnement_id
LEFT JOIN avis av ON a.id = av.abonnement_id
LEFT JOIN paiements p ON s.id = p.souscription_id AND p.statut_paiement = 'VALIDE'
WHERE a.statut = 'ACTIF'
GROUP BY a.id, a.nom, a.fournisseur_id, a.localisation_id;

CREATE UNIQUE INDEX idx_vue_stats_abonnements_id ON vue_stats_abonnements(id);
```

### 3.2 Vue des abonnements populaires par zone
```sql
CREATE MATERIALIZED VIEW vue_abonnements_populaires AS
SELECT 
    a.*,
    l.pays,
    l.region,
    l.ville,
    COUNT(s.id) as popularite,
    AVG(av.note) as note_moyenne
FROM abonnements a
JOIN localisations l ON a.localisation_id = l.id
LEFT JOIN souscriptions s ON a.id = s.abonnement_id
LEFT JOIN avis av ON a.id = av.abonnement_id
WHERE a.statut = 'ACTIF' AND a.is_public = true
GROUP BY a.id, l.pays, l.region, l.ville
ORDER BY popularite DESC, note_moyenne DESC;
```

---

## 4. Triggers et fonctions

### 4.1 Trigger pour génération automatique de tickets
```sql
CREATE OR REPLACE FUNCTION generer_ticket_souscription()
RETURNS TRIGGER AS $
BEGIN
    IF NEW.statut_souscription = 'ACTIVE' AND OLD.statut_souscription != 'ACTIVE' THEN
        INSERT INTO tickets (souscription_id, qr_code)
        VALUES (NEW.id, 'QR_' || NEW.id || '_' || EXTRACT(EPOCH FROM NOW()));
    END IF;
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generer_ticket
    AFTER UPDATE ON souscriptions
    FOR EACH ROW
    EXECUTE FUNCTION generer_ticket_souscription();
```

### 4.2 Fonction de calcul de distance
```sql
CREATE OR REPLACE FUNCTION calculer_distance_km(
    lat1 DECIMAL, lng1 DECIMAL, 
    lat2 DECIMAL, lng2 DECIMAL
) RETURNS DECIMAL AS $
DECLARE
    distance DECIMAL;
BEGIN
    distance := 6371 * acos(
        cos(radians(lat1)) * cos(radians(lat2)) * 
        cos(radians(lng2) - radians(lng1)) + 
        sin(radians(lat1)) * sin(radians(lat2))
    );
    RETURN distance;
END;
$ LANGUAGE plpgsql;
```

---

## 5. Contraintes d'intégrité avancées

### 5.1 Contraintes métier
```sql
-- Un utilisateur ne peut avoir qu'une souscription active par abonnement
CREATE UNIQUE INDEX idx_souscription_unique_active 
ON souscriptions(utilisateur_id, abonnement_id) 
WHERE statut_souscription = 'ACTIVE';

-- Un avis ne peut être donné que si l'utilisateur a une souscription
ALTER TABLE avis ADD CONSTRAINT check_avis_souscription_existe
CHECK (
    EXISTS (
        SELECT 1 FROM souscriptions s 
        WHERE s.utilisateur_id = avis.utilisateur_id 
        AND s.abonnement_id = avis.abonnement_id
        AND s.statut_souscription IN ('ACTIVE', 'EXPIREE')
    )
);

-- Le prix d'un abonnement doit être cohérent avec la zone géographique
CREATE OR REPLACE FUNCTION check_prix_coherent_zone()
RETURNS TRIGGER AS $
BEGIN
    -- Logique de validation des prix selon la zone
    -- Par exemple, prix minimum selon le pays
    IF NEW.prix < (
        SELECT COALESCE(prix_minimum, 500) 
        FROM parametres_zones pz 
        JOIN localisations l ON l.pays = pz.pays 
        WHERE l.id = NEW.localisation_id
    ) THEN
        RAISE EXCEPTION 'Prix insuffisant pour cette zone géographique';
    END IF;
    RETURN NEW;
END;
$ LANGUAGE plpgsql;
```

---

## 6. Index de performance

### 6.1 Index composites pour recherches fréquentes
```sql
-- Recherche d'abonnements par zone et type
CREATE INDEX idx_abonnements_zone_type 
ON abonnements(localisation_id, type_nourriture, statut);

-- Recherche d'abonnements par prix et popularité
CREATE INDEX idx_abonnements_prix_popularite 
ON abonnements(prix, date_creation) 
WHERE statut = 'ACTIF';

-- Historique des souscriptions utilisateur
CREATE INDEX idx_souscriptions_utilisateur_date 
ON souscriptions(utilisateur_id, date_souscription DESC);

-- Paiements par période pour reporting
CREATE INDEX idx_paiements_periode 
ON paiements(date_transaction, statut_paiement, montant);
```

---

## 7. Partitioning (pour montée en charge)

### 7.1 Partitioning des paiements par mois
```sql
-- Table parent
CREATE TABLE paiements_partitioned (
    LIKE paiements INCLUDING ALL
) PARTITION BY RANGE (date_transaction);

-- Partitions mensuelles
CREATE TABLE paiements_2025_08 PARTITION OF paiements_partitioned
FOR VALUES FROM ('2025-08-01') TO ('2025-09-01');

CREATE TABLE paiements_2025_09 PARTITION OF paiements_partitioned
FOR VALUES FROM ('2025-09-01') TO ('2025-10-01');
```

---

## 8. Sécurité base de données

### 8.1 Rôles et permissions
```sql
-- Rôle application (lecture/écriture limitée)
CREATE ROLE juna_app;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO juna_app;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO juna_app;

-- Rôle lecture seule (analytics)
CREATE ROLE juna_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO juna_readonly;

-- Rôle admin (accès complet)
CREATE ROLE juna_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO juna_admin;
```

### 8.2 Row Level Security (RLS)
```sql
-- Activer RLS sur table utilisateurs
ALTER TABLE utilisateurs ENABLE ROW LEVEL SECURITY;

-- Politique : utilisateurs ne voient que leurs propres données
CREATE POLICY utilisateurs_own_data ON utilisateurs
FOR ALL TO juna_app
USING (id = current_setting('app.current_user_id')::UUID);

-- Politique admin : accès complet
CREATE POLICY utilisateurs_admin_access ON utilisateurs
FOR ALL TO juna_admin
USING (true);
```