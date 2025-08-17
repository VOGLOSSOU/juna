# Architecture API REST - Plateforme Juna

## 1. Structure générale des APIs

### Base URL
- **Production**: `https://api.juna.com/v1`
- **Staging**: `https://staging-api.juna.com/v1`
- **Développement**: `http://localhost:3000/api/v1`

### Authentification
- **Type**: JWT (JSON Web Token)
- **Header**: `Authorization: Bearer <token>`
- **Expiration**: 24h (access token), 30 jours (refresh token)

---

## 2. Modules API

### 2.1 Authentication API (`/auth`)

| Méthode | Endpoint | Description | Authentification |
|---------|----------|-------------|------------------|
| POST | `/auth/register` | Créer un compte utilisateur | ❌ |
| POST | `/auth/login` | Connexion utilisateur | ❌ |
| POST | `/auth/logout` | Déconnexion | ✅ |
| POST | `/auth/refresh` | Renouveler token | ✅ |
| POST | `/auth/forgot-password` | Demande réinitialisation | ❌ |
| POST | `/auth/reset-password` | Réinitialiser mot de passe | ❌ |

### 2.2 Users API (`/users`)

| Méthode | Endpoint | Description | Authentification |
|---------|----------|-------------|------------------|
| GET | `/users/me` | Profil utilisateur connecté | ✅ |
| PUT | `/users/me` | Modifier profil | ✅ |
| GET | `/users/me/subscriptions` | Mes souscriptions | ✅ |
| GET | `/users/me/reviews` | Mes avis | ✅ |
| GET | `/users/me/proposals` | Mes propositions | ✅ |
| PUT | `/users/me/location` | Mettre à jour localisation | ✅ |

### 2.3 Subscriptions API (`/subscriptions`)

| Méthode | Endpoint | Description | Authentification |
|---------|----------|-------------|------------------|
| GET | `/subscriptions` | Liste abonnements disponibles | ❌ |
| GET | `/subscriptions/search` | Recherche avec filtres | ❌ |
| GET | `/subscriptions/:id` | Détails d'un abonnement | ❌ |
| POST | `/subscriptions/:id/subscribe` | Souscrire à un abonnement | ✅ |
| GET | `/subscriptions/categories` | Catégories disponibles | ❌ |
| GET | `/subscriptions/popular` | Abonnements populaires | ❌ |

### 2.4 Proposals API (`/proposals`)

| Méthode | Endpoint | Description | Authentification |
|---------|----------|-------------|------------------|
| POST | `/proposals` | Créer une proposition | ✅ |
| GET | `/proposals/me` | Mes propositions | ✅ |
| PUT | `/proposals/:id` | Modifier proposition | ✅ |
| DELETE | `/proposals/:id` | Supprimer proposition | ✅ |

### 2.5 Payments API (`/payments`)

| Méthode | Endpoint | Description | Authentification |
|---------|----------|-------------|------------------|
| POST | `/payments/initiate` | Initier paiement | ✅ |
| GET | `/payments/:id/status` | Statut paiement | ✅ |
| POST | `/payments/webhook` | Webhook passerelles | ❌ |
| GET | `/payments/methods` | Méthodes disponibles | ❌ |

### 2.6 Reviews API (`/reviews`)

| Méthode | Endpoint | Description | Authentification |
|---------|----------|-------------|------------------|
| GET | `/reviews/subscription/:id` | Avis d'un abonnement | ❌ |
| POST | `/reviews` | Créer un avis | ✅ |
| PUT | `/reviews/:id` | Modifier mon avis | ✅ |
| DELETE | `/reviews/:id` | Supprimer mon avis | ✅ |

### 2.7 Support API (`/support`)

| Méthode | Endpoint | Description | Authentification |
|---------|----------|-------------|------------------|
| POST | `/support/tickets` | Créer ticket support | ✅ |
| GET | `/support/tickets/me` | Mes tickets | ✅ |
| GET | `/support/tickets/:id` | Détails ticket | ✅ |
| POST | `/support/tickets/:id/messages` | Ajouter message | ✅ |

### 2.8 Geolocation API (`/geo`)

| Méthode | Endpoint | Description | Authentification |
|---------|----------|-------------|------------------|
| GET | `/geo/countries` | Liste des pays | ❌ |
| GET | `/geo/regions/:country` | Régions d'un pays | ❌ |
| GET | `/geo/cities/:region` | Villes d'une région | ❌ |
| POST | `/geo/distance` | Calculer distance | ❌ |

### 2.9 Admin API (`/admin`)

| Méthode | Endpoint | Description | Authentification |
|---------|----------|-------------|------------------|
| GET | `/admin/dashboard` | Statistiques dashboard | ✅ Admin |
| GET | `/admin/users` | Gestion utilisateurs | ✅ Admin |
| GET | `/admin/proposals` | Propositions en attente | ✅ Admin |
| PUT | `/admin/proposals/:id/approve` | Valider proposition | ✅ Admin |
| PUT | `/admin/proposals/:id/reject` | Rejeter proposition | ✅ Admin |
| GET | `/admin/subscriptions` | Gérer abonnements | ✅ Admin |
| GET | `/admin/reviews/pending` | Avis à modérer | ✅ Admin |
| PUT | `/admin/reviews/:id/moderate` | Modérer avis | ✅ Admin |

---

## 3. Formats de données

### 3.1 Objet Utilisateur
```json
{
  "id": "usr_123456",
  "nom": "Jean Dupont",
  "email": "jean.dupont@email.com",
  "numero": "+229123456789",
  "type": "PARTICULIER",
  "localisation": {
    "pays": "Bénin",
    "region": "Littoral",
    "ville": "Cotonou",
    "latitude": 6.3654,
    "longitude": 2.4183
  },
  "dateCreation": "2025-01-15T10:00:00Z",
  "isActive": true
}
```

### 3.2 Objet Abonnement
```json
{
  "id": "sub_789012",
  "nom": "Menu Traditionnel Béninois",
  "description": "Plats traditionnels du Bénin livrés quotidiennement",
  "typeNourriture": "AFRICAINE",
  "prix": 2500,
  "duree": "MENSUEL",
  "frequence": "QUOTIDIEN",
  "zone": {
    "pays": "Bénin",
    "region": "Littoral",
    "ville": "Cotonou"
  },
  "fournisseur": {
    "id": "prv_345678",
    "nom": "Restaurant Chez Mama",
    "note": 4.5
  },
  "isPublic": true,
  "statut": "ACTIF",
  "statistiques": {
    "nombreSouscripteurs": 245,
    "notemoyenne": 4.2,
    "nombreAvis": 89
  }
}
```

### 3.3 Objet Souscription
```json
{
  "id": "ssc_456789",
  "utilisateurId": "usr_123456",
  "abonnementId": "sub_789012",
  "dateSouscription": "2025-08-17T14:30:00Z",
  "dateExpiration": "2025-09-17T14:30:00Z",
  "modeRecuperation": "LIVRAISON",
  "statut": "ACTIVE",
  "ticketReference": "TKT_2025081712345",
  "detailsRecuperation": {
    "adresseLivraison": "Rue 123, Cotonou",
    "heuresLivraison": "12:00-14:00",
    "instructions": "Sonner à l'interphone"
  }
}
```

---

## 4. Codes de réponse HTTP

### Succès
- **200 OK**: Requête réussie
- **201 Created**: Ressource créée
- **204 No Content**: Succès sans contenu

### Erreurs Client
- **400 Bad Request**: Données invalides
- **401 Unauthorized**: Authentification requise
- **403 Forbidden**: Accès refusé
- **404 Not Found**: Ressource introuvable
- **409 Conflict**: Conflit de données

### Erreurs Serveur
- **500 Internal Server Error**: Erreur serveur
- **502 Bad Gateway**: Erreur passerelle
- **503 Service Unavailable**: Service indisponible

---

## 5. Sécurité

### 5.1 Mesures de sécurité
- **HTTPS obligatoire** en production
- **Rate limiting**: 100 req/min par IP
- **Validation des données** côté serveur
- **Sanitisation** des inputs utilisateur
- **Chiffrement** des mots de passe (bcrypt)

### 5.2 Gestion des erreurs
- **Logs détaillés** pour debugging
- **Messages d'erreur** génériques pour l'utilisateur
- **Monitoring** en temps réel des erreurs
- **Alertes** automatiques pour erreurs critiques