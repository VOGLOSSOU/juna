# 🗺️ Parcours Utilisateurs - Juna

## 1. Utilisateur Standard (User)

### 1.1. Parcours : Souscription à un Abonnement Existant

```mermaid
graph TD
    A[Arrivée sur l'app] --> B{Authentifié?}
    B -->|Non| C[Page d'accueil publique]
    B -->|Oui| D[Page d'accueil personnalisée]
    
    C --> E[Consulter les abonnements]
    D --> E
    
    E --> F[Filtrer par catégorie/localisation]
    F --> G[Sélectionner un abonnement]
    
    G --> H[Voir les détails]
    H --> I[Choisir le mode de récupération]
    
    I --> J{Livraison ou Retrait?}
    J -->|Livraison| K[Saisir/confirmer adresse]
    J -->|Retrait| L[Choisir point de retrait]
    
    K --> M{Authentifié?}
    L --> M
    
    M -->|Non| N[Créer compte / Se connecter]
    M -->|Oui| O[Récapitulatif commande]
    
    N --> O
    O --> P[Choisir moyen de paiement]
    P --> Q[Payer]
    
    Q --> R{Paiement réussi?}
    R -->|Non| S[Message d'erreur]
    R -->|Oui| T[Confirmation souscription]
    
    S --> P
    T --> U[Recevoir ticket par email]
    T --> V[Voir le ticket dans l'app]
    
    V --> W{Mode de récupération?}
    W -->|Livraison| X[Attendre livraison]
    W -->|Retrait| Y[Présenter QR code sur place]
    
    X --> Z[Recevoir repas]
    Y --> Z
    
    Z --> AA[Laisser un avis optionnel]
```

#### Étapes Détaillées

1. **Découverte**
   - L'utilisateur arrive sur l'application (web ou mobile)
   - Consultation libre des abonnements disponibles sans authentification
   - Filtrage par localisation (géolocalisation automatique ou saisie manuelle)
   - Tri par popularité, prix, nouveautés, catégories (Afrique, Europe, Asie, etc.)

2. **Sélection**
   - Clic sur un abonnement pour voir les détails complets :
     - Description du contenu
     - Durée (journalier, hebdomadaire, mensuel)
     - Prix
     - Zone de livraison / Points de retrait
     - Avis et notes des utilisateurs
     - Photos des repas

3. **Personnalisation**
   - Choix du mode de récupération :
     - **Livraison** : saisie/validation de l'adresse de livraison (avec géolocalisation)
     - **Retrait** : sélection d'un point de retrait disponible dans la liste

4. **Authentification (si nécessaire)**
   - Si l'utilisateur n'est pas connecté, redirection vers :
     - Création de compte (email, mot de passe, nom, téléphone, localisation)
     - Connexion (email + mot de passe)
     - Ou connexion via OAuth (Google, Facebook) - optionnel v2

5. **Paiement**
   - Récapitulatif de la commande
   - Choix du moyen de paiement :
     - Mobile Money (Wave, MTN, Moov, Orange Money)
     - Carte bancaire (Stripe)
   - Validation du paiement
   - Gestion des erreurs de paiement (solde insuffisant, carte expirée, etc.)

6. **Confirmation**
   - Page de confirmation avec numéro de commande
   - Réception d'un email contenant :
     - Récapitulatif de la souscription
     - Ticket numérique
     - QR code (si retrait sur place)
     - Détails de livraison ou d'accès au point de retrait
   - Ticket accessible dans le profil utilisateur

7. **Réception / Retrait**
   - **Si livraison** : 
     - Notification de préparation
     - Notification de départ du livreur (v2)
     - Suivi en temps réel (v2)
     - Réception du repas
   - **Si retrait** :
     - Présentation du QR code au point de retrait
     - Scan par le fournisseur
     - Récupération du repas

8. **Après-vente**
   - Invitation à laisser un avis (note + commentaire)
   - Possibilité de contacter le service client en cas de problème
   - Possibilité de renouveler l'abonnement

---

### 1.2. Parcours : Proposition d'Abonnement Personnalisé

```mermaid
graph TD
    A[Page d'accueil] --> B[Cliquer sur 'Proposer un abonnement']
    
    B --> C{Authentifié?}
    C -->|Non| D[Créer compte / Se connecter]
    C -->|Oui| E[Formulaire de proposition]
    
    D --> E
    
    E --> F[Remplir les champs]
    F --> G[Type de nourriture]
    G --> H[Fréquence souhaitée]
    H --> I[Zone géographique]
    I --> J[Budget]
    J --> K[Détails supplémentaires]
    
    K --> L[Choisir visibilité]
    L --> M{Public ou Privé?}
    
    M -->|Public| N[Accessible à tous]
    M -->|Privé| O[Uniquement pour moi]
    
    N --> P[Soumettre la proposition]
    O --> P
    
    P --> Q[Confirmation de soumission]
    Q --> R[Notification envoyée à l'équipe Juna]
    
    R --> S[Attente de validation]
    S --> T{Décision Juna}
    
    T -->|Validé| U[Notification de validation]
    T -->|Rejeté| V[Notification de rejet avec raisons]
    
    U --> W{Visibilité?}
    W -->|Public| X[Abonnement publié sur la plateforme]
    W -->|Privé| Y[Abonnement disponible uniquement pour le demandeur]
    
    V --> Z[Possibilité de modifier et resoumettre]
    
    X --> AA[Autres utilisateurs peuvent souscrire]
    Y --> BB[Le demandeur peut souscrire]
    
    AA --> CC[Processus de souscription standard]
    BB --> CC
```

#### Étapes Détaillées

1. **Accès au formulaire**
   - Bouton "Proposer un abonnement personnalisé" visible sur la page d'accueil
   - Authentification obligatoire avant de remplir le formulaire

2. **Remplissage du formulaire**
   - **Type de nourriture** : africaine, européenne, asiatique, fusion, végétarienne, etc.
   - **Spécificités** : halal, végétarien, vegan, sans gluten, etc.
   - **Fréquence** : quotidien, 3x/semaine, hebdomadaire, mensuel
   - **Horaires préférés** : petit-déjeuner, déjeuner, dîner
   - **Zone géographique** : pays, ville, quartier
   - **Budget** : fourchette de prix souhaitée
   - **Nombre de personnes** : individuel ou groupe (famille, bureau)
   - **Détails supplémentaires** : préférences, allergies, instructions spéciales

3. **Choix de visibilité**
   - **Public** : la proposition, une fois validée, sera visible par tous les utilisateurs de la plateforme
   - **Privé** : seul le demandeur pourra souscrire à cet abonnement personnalisé

4. **Soumission**
   - Validation du formulaire (tous les champs obligatoires remplis)
   - Envoi de la proposition à l'équipe Juna
   - Notification par email de la soumission

5. **Traitement par Juna**
   - Analyse de la faisabilité (zone couverte, partenaires disponibles)
   - Vérification du budget
   - Contact éventuel de fournisseurs
   - Délai de réponse : 24-48h (à définir)

6. **Notification de décision**
   - **Si validé** :
     - Email/notification de validation
     - Proposition ajoutée à la plateforme (si publique) ou au profil (si privée)
     - Utilisateur peut procéder à la souscription
   - **Si rejeté** :
     - Email/notification avec raisons du rejet
     - Suggestions d'alternatives
     - Possibilité de modifier et resoumettre

7. **Souscription (si validé)**
   - Même processus que pour un abonnement standard
   - Paiement, confirmation, réception du ticket

---

### 1.3. Parcours : Gestion du Profil

```mermaid
graph TD
    A[Se connecter] --> B[Accéder au profil]
    
    B --> C[Voir les informations]
    C --> D[Abonnements actifs]
    C --> E[Historique des commandes]
    C --> F[Avis donnés]
    C --> G[Tickets sauvegardés]
    C --> H[Propositions personnalisées]
    
    D --> I[Gérer un abonnement]
    I --> J{Action?}
    J -->|Modifier| K[Changer adresse/mode retrait]
    J -->|Suspendre| L[Mettre en pause v2]
    J -->|Annuler| M[Demander remboursement]
    
    E --> N[Consulter une commande]
    N --> O[Voir détails]
    O --> P[Télécharger facture]
    O --> Q[Contacter support si problème]
    
    F --> R[Modifier/Supprimer un avis]
    
    H --> S[Voir statut des propositions]
    S --> T{Statut?}
    T -->|En attente| U[Attendre validation]
    T -->|Validée| V[Souscrire]
    T -->|Rejetée| W[Modifier et resoumettre]
```

#### Fonctionnalités du Profil

1. **Informations personnelles**
   - Nom, email, téléphone, adresse(s)
   - Photo de profil (optionnel, v2)
   - Modification des informations
   - Changement de mot de passe

2. **Mes abonnements actifs**
   - Liste de tous les abonnements en cours
   - Détails de chaque abonnement (prochaine livraison, contenu, etc.)
   - Actions possibles : modifier, suspendre (v2), annuler

3. **Historique des commandes**
   - Liste chronologique de toutes les commandes passées
   - Statut (complétée, annulée, remboursée)
   - Possibilité de recommander un abonnement passé
   - Téléchargement des factures

4. **Mes avis**
   - Liste de tous les avis laissés
   - Modification/suppression possible (dans un délai défini)

5. **Mes tickets**
   - Tous les tickets numériques sauvegardés
   - QR codes pour les retraits
   - Historique des tickets utilisés

6. **Mes propositions personnalisées**
   - Statut de chaque proposition (en attente, validée, rejetée)
   - Possibilité de modifier les propositions rejetées
   - Souscrire aux propositions validées

7. **Préférences**
   - Notifications (email, push, SMS)
   - Préférences alimentaires par défaut
   - Langue
   - Zone de recherche par défaut

---

### 1.4. Parcours : Système d'Avis

```mermaid
graph TD
    A[Recevoir repas] --> B[Notification: Laisser un avis]
    
    B --> C{Laisser un avis?}
    C -->|Non| D[Ignorer]
    C -->|Oui| E[Page d'avis]
    
    E --> F[Noter de 1 à 5 étoiles]
    F --> G[Écrire un commentaire optionnel]
    G --> H[Ajouter des photos optionnelles v2]
    H --> I[Soumettre l'avis]
    
    I --> J[Avis en attente de modération]
    J --> K{Modération Juna}
    
    K -->|Approuvé| L[Avis publié]
    K -->|Rejeté| M[Notification de rejet]
    
    L --> N[Visible sur la page de l'abonnement]
    M --> O[Raisons du rejet]
```

#### Étapes Détaillées

1. **Invitation à laisser un avis**
   - Après réception/retrait du repas
   - Notification push/email quelques heures après
   - Accessible aussi depuis le profil → Historique des commandes

2. **Rédaction de l'avis**
   - **Note obligatoire** : 1 à 5 étoiles
   - **Commentaire optionnel** : feedback textuel
   - **Photos optionnelles** (v2) : photos du repas reçu

3. **Modération**
   - Tous les avis sont modérés par l'équipe Juna avant publication
   - Critères de rejet :
     - Contenu offensant, injurieux
     - Spam, publicité
     - Hors sujet
   - Délai de modération : 24-48h

4. **Publication**
   - Avis approuvé affiché sur la page de l'abonnement
   - Contribue à la note globale
   - L'utilisateur peut modifier/supprimer son avis dans les 7 jours (par exemple)

---

### 1.5. Parcours : Service Client

```mermaid
graph TD
    A[Problème rencontré] --> B[Accéder au support]
    
    B --> C{Type de contact?}
    C -->|Équipe Juna| D[Formulaire de contact Juna]
    C -->|Fournisseur| E[Contact direct fournisseur]
    
    D --> F[Choisir la catégorie du problème]
    F --> G[Décrire le problème]
    G --> H[Joindre des preuves optionnelles]
    H --> I[Soumettre le ticket]
    
    E --> J[Chat/Email avec fournisseur]
    
    I --> K[Ticket créé et numéro attribué]
    K --> L[Notification de prise en compte]
    
    L --> M[Équipe Juna traite le ticket]
    M --> N{Type de problème?}
    
    N -->|Paiement| O[Vérification transaction]
    N -->|Livraison| P[Contact fournisseur/livreur]
    N -->|Qualité| Q[Investigation]
    N -->|Autre| R[Traitement personnalisé]
    
    O --> S[Remboursement si nécessaire]
    P --> T[Relance ou compensation]
    Q --> T
    R --> T
    
    T --> U[Réponse envoyée à l'utilisateur]
    U --> V{Satisfait?}
    
    V -->|Oui| W[Ticket clôturé]
    V -->|Non| X[Escalade au responsable]
    
    X --> Y[Traitement niveau 2]
    Y --> U
```

#### Types de Réclamations

1. **Problèmes de paiement**
   - Paiement non reconnu
   - Double prélèvement
   - Demande de remboursement

2. **Problèmes de livraison**
   - Livraison non reçue
   - Retard important
   - Adresse incorrecte

3. **Problèmes de qualité**
   - Repas non conforme
   - Problème d'hygiène
   - Quantité insuffisante

4. **Problèmes techniques**
   - Bug de l'application
   - QR code non reconnu
   - Problème de compte

5. **Autres**
   - Questions générales
   - Suggestions d'amélioration
   - Partenariats

---

## 2. Fournisseur de Repas (Provider)

### 2.1. Parcours : Inscription en tant que Fournisseur

```mermaid
graph TD
    A[Formulaire d'inscription fournisseur] --> B[Remplir informations entreprise]
    
    B --> C[Nom de l'entreprise]
    C --> D[Adresse & localisation]
    D --> E[Contact responsable]
    E --> F[Documents légaux]
    F --> G[Description de l'activité]
    
    G --> H[Soumettre la demande]
    H --> I[Demande en attente de validation]
    
    I --> J[Équipe Juna examine la demande]
    J --> K{Décision?}
    
    K -->|Approuvé| L[Notification d'approbation]
    K -->|Rejeté| M[Notification de rejet avec raisons]
    
    L --> N[Création du compte fournisseur]
    N --> O[Accès au dashboard fournisseur]
    
    M --> P[Possibilité de resoumettre avec corrections]
```

### 2.2. Parcours : Gestion des Abonnements (Fournisseur)

```mermaid
graph TD
    A[Dashboard fournisseur] --> B[Gérer mes abonnements]
    
    B --> C[Créer nouvel abonnement]
    C --> D[Remplir les détails]
    D --> E[Contenu du menu]
    E --> F[Prix & durée]
    F --> G[Zone de livraison/retrait]
    G --> H[Ajouter photos]
    H --> I[Soumettre pour validation Juna]
    
    I --> J{Validation Juna?}
    J -->|Approuvé| K[Abonnement publié]
    J -->|Rejeté| L[Modifications demandées]
    
    L --> D
    
    B --> M[Modifier abonnement existant]
    M --> N[Mettre à jour informations]
    N --> I
    
    B --> O[Suspendre/Désactiver abonnement]
    
    K --> P[Recevoir des souscriptions]
    P --> Q[Notifications de nouvelles commandes]
    Q --> R[Gérer les commandes]
```

### 2.3. Parcours : Gestion des Commandes (Fournisseur)

```mermaid
graph TD
    A[Nouvelle commande reçue] --> B[Notification]
    
    B --> C[Voir détails commande]
    C --> D[Informations client]
    D --> E[Détails abonnement]
    E --> F[Mode de récupération]
    
    F --> G{Livraison ou Retrait?}
    
    G -->|Livraison| H[Voir adresse de livraison]
    G -->|Retrait| I[Générer QR code]
    
    H --> J[Préparer la commande]
    I --> J
    
    J --> K[Marquer comme en préparation]
    K --> L{Livraison ou Retrait?}
    
    L -->|Livraison| M[Organiser la livraison]
    L -->|Retrait| N[Attendre le client]
    
    M --> O[Mettre à jour statut: En livraison]
    O --> P[Client reçoit notification]
    
    N --> Q[Client présente QR code]
    Q --> R[Scanner le QR code]
    
    R --> S[Valider le retrait]
    P --> T[Confirmer la livraison]
    
    S --> U[Commande complétée]
    T --> U
```

---

## 3. Administrateur (Admin)

### 3.1. Parcours : Validation des Propositions

```mermaid
graph TD
    A[Dashboard admin] --> B[Section Propositions]
    
    B --> C[Liste des propositions en attente]
    C --> D[Sélectionner une proposition]
    
    D --> E[Examiner les détails]
    E --> F[Type, fréquence, zone, budget]
    
    F --> G{Faisable?}
    
    G -->|Oui| H[Rechercher fournisseur compatible]
    H --> I{Fournisseur trouvé?}
    
    I -->|Oui| J[Contacter le fournisseur]
    I -->|Non| K[Chercher alternative]
    
    K --> L{Alternative trouvée?}
    L -->|Non| M[Rejeter avec suggestions]
    L -->|Oui| J
    
    J --> N[Créer l'abonnement]
    N --> O[Valider la proposition]
    
    G -->|Non| M
    
    O --> P[Notification au demandeur]
    M --> Q[Notification de rejet avec raisons]
```

### 3.2. Parcours : Gestion des Utilisateurs

```mermaid
graph TD
    A[Dashboard admin] --> B[Section Utilisateurs]
    
    B --> C[Liste des utilisateurs]
    C --> D[Filtrer/Rechercher]
    
    D --> E[Sélectionner un utilisateur]
    E --> F[Voir le profil complet]
    
    F --> G[Informations personnelles]
    F --> H[Abonnements actifs]
    F --> I[Historique commandes]
    F --> J[Avis donnés]
    F --> K[Tickets support]
    
    F --> L{Actions?}
    
    L -->|Modifier infos| M[Éditer le profil]
    L -->|Suspendre| N[Suspendre le compte]
    L -->|Bannir| O[Bannir définitivement]
    L -->|Rétablir| P[Réactiver le compte]
    
    N --> Q[Raison de suspension]
    O --> R[Raison de bannissement]
    
    Q --> S[Notifier l'utilisateur]
    R --> S
```

### 3.3. Parcours : Modération des Avis

```mermaid
graph TD
    A[Dashboard admin] --> B[Section Avis]
    
    B --> C[Avis en attente de modération]
    C --> D[Sélectionner un avis]
    
    D --> E[Lire le contenu]
    E --> F[Note donnée]
    E --> G[Commentaire]
    E --> H[Photos éventuelles v2]
    
    E --> I{Conforme?}
    
    I -->|Oui| J[Approuver l'avis]
    I -->|Non| K{Type de violation?}
    
    K -->|Offensant| L[Rejeter + Warning user]
    K -->|Spam| M[Rejeter + Bannir si récidive]
    K -->|Hors sujet| N[Rejeter avec explication]
    
    J --> O[Avis publié]
    L --> P[Notification au user]
    M --> P
    N --> P
    
    B --> Q[Avis signalés]
    Q --> R[Examiner les signalements]
    R --> S{Action?}
    
    S -->|Supprimer| T[Retirer l'avis]
    S -->|Garder| U[Ignorer le signalement]
    
    T --> V[Notifier l'auteur]
```

### 3.4. Parcours : Gestion des Tickets Support

```mermaid
graph TD
    A[Dashboard admin] --> B[Section Support]
    
    B --> C[Liste des tickets]
    C --> D[Filtrer par statut/priorité]
    
    D --> E[Sélectionner un ticket]
    E --> F[Voir détails complets]
    
    F --> G[Historique des échanges]
    F --> H[Informations utilisateur]
    F --> I[Commande concernée]
    
    F --> J{Type de problème?}
    
    J -->|Paiement| K[Vérifier transaction]
    J -->|Livraison| L[Contacter fournisseur]
    J -->|Qualité| M[Enquêter]
    J -->|Technique| N[Transférer à la tech]
    
    K --> O{Remboursement nécessaire?}
    O -->|Oui| P[Initier remboursement]
    O -->|Non| Q[Expliquer à l'utilisateur]
    
    L --> R[Coordonner avec fournisseur]
    R --> S[Proposer solution]
    
    M --> T[Décision: Remboursement/Avoir/Excuse]
    
    N --> U[Créer ticket technique interne]
    
    P --> V[Répondre au ticket]
    Q --> V
    S --> V
    T --> V
    U --> V
    
    V --> W{Résolu?}
    W -->|Oui| X[Clôturer le ticket]
    W -->|Non| Y[Continuer les échanges]
    
    Y --> V
```

### 3.5. Parcours : Statistiques & Reporting

```mermaid
graph TD
    A[Dashboard admin] --> B[Section Statistiques]
    
    B --> C[Choisir période]
    C --> D[Choisir métriques]
    
    D --> E[Utilisateurs]
    E --> F[Nouveaux inscrits]
    E --> G[Utilisateurs actifs]
    E --> H[Taux de rétention]
    
    D --> I[Abonnements]
    I --> J[Nouveaux abonnements]
    I --> K[Abonnements actifs]
    I --> L[Abonnements populaires]
    
    D --> M[Revenus]
    M --> N[Chiffre d'affaires total]
    M --> O[Revenus par catégorie]
    M --> P[Commissions]
    
    D --> Q[Géographie]
    Q --> R[Utilisateurs par ville]
    Q --> S[Zones les plus actives]
    
    D --> T[Fournisseurs]
    T --> U[Nombre de fournisseurs]
    T --> V[Performance des fournisseurs]
    
    F --> W[Générer rapport]
    G --> W
    H --> W
    J --> W
    K --> W
    L --> W
    N --> W
    O --> W
    P --> W
    R --> W
    S --> W
    U --> W
    V --> W
    
    W --> X[Export PDF/Excel]
```

---

## 4. Super Admin

### 4.1. Parcours : Gestion des Administrateurs

```mermaid
graph TD
    A[Dashboard Super Admin] --> B[Section Admins]
    
    B --> C[Liste des administrateurs]
    C --> D{Action?}
    
    D -->|Ajouter| E[Créer nouvel admin]
    D -->|Modifier| F[Éditer permissions]
    D -->|Supprimer| G[Révoquer accès]
    
    E --> H[Remplir informations]
    H --> I[Assigner rôles/permissions]
    I --> J[Créer compte admin]
    
    F --> K[Modifier les permissions]
    K --> L[Sauvegarder]
    
    G --> M[Confirmation de suppression]
    M --> N[Désactiver compte]
```

### 4.2. Parcours : Configuration de la Plateforme

```mermaid
graph TD
    A[Dashboard Super Admin] --> B[Section Configuration]
    
    B --> C[Paramètres généraux]
    C --> D[Nom de la plateforme]
    C --> E[Logo & branding]
    C --> F[Langues disponibles]
    
    B --> G[Paramètres de paiement]
    G --> H[Moyens de paiement actifs]
    G --> I[Commissions]
    G --> J[Devises]
    
    B --> K[Paramètres de livraison]
    K --> L[Zones actives]
    K --> M[Frais de livraison]
    
    B --> N[Notifications]
    N --> O[Templates emails]
    N --> P[Templates SMS]
    N --> Q[Templates push]
    
    B --> R[Sauvegarder les modifications]
```

---

## 5. Cas d'Usage Spéciaux

### 5.1. Renouvellement Automatique d'Abonnement

```mermaid
graph TD
    A[Abonnement arrive à expiration] --> B[Job automatique déclenché]
    
    B --> C{Renouvellement auto activé?}
    C -->|Non| D[Notification d'expiration]
    C -->|Oui| E[Tenter le paiement]
    
    D --> F[Proposer renouvellement]
    
    E --> G{Paiement réussi?}
    G -->|Oui| H[Renouveler l'abonnement]
    G -->|Non| I[Notification d'échec]
    
    H --> J[Confirmer renouvellement]
    I --> K[Demander mise à jour moyen paiement]
    
    K --> L[Relancer après mise à jour]
```

### 5.2. Annulation & Remboursement

```mermaid
graph TD
    A[Demande d'annulation] --> B[Vérifier conditions]
    
    B --> C{Dans délai d'annulation?}
    C -->|Oui| D[Calculer remboursement]
    C -->|Non| E[Refuser remboursement total]
    
    D --> F{Abonnement déjà utilisé?}
    F -->|Non| G[Rembours