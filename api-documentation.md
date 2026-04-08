# Documentation API JUNA

## Base URL
```
http://localhost:5000/api/v1
```

## Conventions générales

- Tous les endpoints retournent un JSON avec la structure suivante :
```json
{
  "success": true | false,
  "message": "Message lisible",
  "data": { ... }        // présent si succès
  "error": { "code": "ERROR_CODE" }  // présent si erreur
}
```
- Les endpoints protégés nécessitent un header `Authorization: Bearer {accessToken}`
- Les tokens expirent : `accessToken` → 15 minutes, `refreshToken` → 7 jours
- Rate limit : 5 requêtes / 15 minutes sur les endpoints auth

---

## PARTIE 0 — GÉOGRAPHIE

Les pays, villes et landmarks sont gérés par l'admin et consommés publiquement. Le flux pour l'app mobile : sélection pays → sélection ville → affichage landmarks pour filtrer les abonnements.

### GET /countries — Lister les pays disponibles

**Accès :** public

**Réponse 200 ✅ — TEST 0.1 :**
```json
{
  "success": true,
  "message": "Liste des pays",
  "data": [
    {
      "id": "8b60ac9a-c04b-45d6-acea-ad5cf1a340f6",
      "code": "BJ",
      "translations": { "en": "Benin", "fr": "Bénin" },
      "isActive": true,
      "createdAt": "2026-04-08T16:34:35.035Z"
    }
  ]
}
```

---

### GET /countries/:code/cities — Villes d'un pays

**Accès :** public

**Paramètre :** `code` = code ISO du pays (ex: `BJ`)

**Réponse 200 ✅ — TEST 0.2 :**
```json
{
  "success": true,
  "message": "Villes du pays",
  "data": [
    {
      "id": "101a6a8c-ad3b-4071-b399-ba5cd5afed0c",
      "name": "Cotonou",
      "countryId": "8b60ac9a-c04b-45d6-acea-ad5cf1a340f6",
      "isActive": true,
      "createdAt": "2026-04-08T16:37:58.275Z"
    },
    {
      "id": "d9617182-b28b-4988-81ec-1bcf68c61b14",
      "name": "Lokossa",
      "countryId": "8b60ac9a-c04b-45d6-acea-ad5cf1a340f6",
      "isActive": true,
      "createdAt": "2026-04-08T16:39:00.065Z"
    }
  ]
}
```

**Réponse 404 ❌ — Pays introuvable :**
```json
{
  "success": false,
  "message": "Pays introuvable",
  "error": { "code": "RESOURCE_NOT_FOUND" }
}
```

---

### GET /cities/:cityId/landmarks — Landmarks d'une ville

**Accès :** public

**Réponse 200 ✅ — TEST 0.3 :**
```json
{
  "success": true,
  "message": "Lieux de la ville",
  "data": [
    {
      "id": "fdd37c8b-67d6-46f3-9078-befcf2ceb085",
      "name": "Campus IUT Lokossa",
      "cityId": "d9617182-b28b-4988-81ec-1bcf68c61b14",
      "isActive": true,
      "createdAt": "2026-04-08T22:18:39.932Z"
    }
  ]
}
```

---

### POST /admin/countries — Créer un pays

**Accès :** ADMIN, SUPER_ADMIN

**Body :**
```json
{
  "code": "CM",
  "translations": {
    "fr": "Cameroun",
    "en": "Cameroon"
  }
}
```

**Réponse 201 ✅ — TEST 0.6 :**
```json
{
  "success": true,
  "message": "Pays créé avec succès",
  "data": {
    "id": "8b60ac9a-c04b-45d6-acea-ad5cf1a340f6",
    "code": "BJ",
    "translations": { "fr": "Bénin", "en": "Benin" },
    "isActive": true,
    "createdAt": "2026-04-08T16:34:35.035Z"
  }
}
```

---

### POST /admin/cities — Créer une ville

**Accès :** ADMIN, SUPER_ADMIN

**Body :**
```json
{
  "name": "Ouidah",
  "countryId": "<uuid>"
}
```

**Réponse 201 ✅ — TEST 0.5 :**
```json
{
  "success": true,
  "message": "Ville créée avec succès",
  "data": {
    "id": "101a6a8c-ad3b-4071-b399-ba5cd5afed0c",
    "name": "Cotonou",
    "countryId": "8b60ac9a-c04b-45d6-acea-ad5cf1a340f6",
    "isActive": true,
    "createdAt": "2026-04-08T16:37:58.275Z",
    "country": {
      "id": "8b60ac9a-c04b-45d6-acea-ad5cf1a340f6",
      "code": "BJ",
      "translations": { "en": "Benin", "fr": "Bénin" },
      "isActive": true,
      "createdAt": "2026-04-08T16:34:35.035Z"
    }
  }
}
```

---

### POST /admin/landmarks — Créer un landmark

**Accès :** ADMIN, SUPER_ADMIN

**Body :**
```json
{
  "name": "IUT de Lokossa",
  "cityId": "<uuid>"
}
```

**Réponse 201 ✅ — TEST 0.4 :**
```json
{
  "success": true,
  "message": "Lieu créé avec succès",
  "data": {
    "id": "fdd37c8b-67d6-46f3-9078-befcf2ceb085",
    "name": "Campus IUT Lokossa",
    "cityId": "d9617182-b28b-4988-81ec-1bcf68c61b14",
    "isActive": true,
    "createdAt": "2026-04-08T22:18:39.932Z",
    "city": {
      "id": "d9617182-b28b-4988-81ec-1bcf68c61b14",
      "name": "Lokossa",
      "countryId": "8b60ac9a-c04b-45d6-acea-ad5cf1a340f6",
      "isActive": true,
      "country": {
        "id": "8b60ac9a-c04b-45d6-acea-ad5cf1a340f6",
        "code": "BJ",
        "translations": { "en": "Benin", "fr": "Bénin" },
        "isActive": true
      }
    }
  }
}
```

**Codes d'erreur possibles :**
| Code | HTTP | Description |
|------|------|-------------|
| `RESOURCE_NOT_FOUND` | 404 | Pays ou ville introuvable |
| `EMAIL_ALREADY_EXISTS` | 409 | Lieu/ville/pays déjà existant |
| `UNAUTHORIZED` | 401 | Token manquant ou expiré |
| `FORBIDDEN` | 403 | Rôle insuffisant |

---

## PARTIE 1 — AUTH

### POST /auth/register — Créer un compte

**Body :**
```json
{
  "email": "kofi.mensah@gmail.com",
  "password": "Password123",
  "name": "Kofi Mensah",
  "phone": "+22961111111"
}
```

**Réponse 201 ✅ — TEST 1.1 :**
```json
{
  "success": true,
  "message": "Compte créé avec succès",
  "data": {
    "user": {
      "id": "<uuid>",
      "email": "kofi.mensah@gmail.com",
      "name": "Kofi Mensah",
      "phone": "+22961111111",
      "role": "USER",
      "isVerified": false,
      "isActive": true,
      "isProfileComplete": false,
      "createdAt": "<timestamp>"
    },
    "accessToken": "<jwt>",
    "refreshToken": "<jwt>"
  }
}
```

**Réponse 409 ❌ — Email déjà utilisé (TEST 1.4) :**
```json
{
  "success": false,
  "message": "Cet email est déjà utilisé",
  "error": { "code": "EMAIL_ALREADY_EXISTS" }
}
```

**Réponse 400 ❌ — Mot de passe trop faible (TEST 1.5) :**
```json
{
  "success": false,
  "message": "Validation failed: ...",
  "error": { "code": "VALIDATION_ERROR" }
}
```

---

### POST /auth/login — Connexion

**Body :**
```json
{
  "email": "kofi.mensah@gmail.com",
  "password": "Password123"
}
```

**Réponse 200 ✅ — TEST 2.1 :**
```json
{
  "success": true,
  "message": "Connexion réussie",
  "data": {
    "user": {
      "id": "<uuid>",
      "email": "kofi.mensah@gmail.com",
      "name": "Kofi Mensah",
      "role": "USER"
    },
    "accessToken": "<jwt>",
    "refreshToken": "<jwt>"
  }
}
```

---

### POST /auth/refresh — Rafraîchir le token

**Body :**
```json
{ "refreshToken": "<jwt>" }
```

**Réponse 200 ✅ :**
```json
{
  "success": true,
  "message": "Token rafraîchi",
  "data": { "accessToken": "<jwt>" }
}
```

---

### POST /auth/logout — Déconnexion

**Header :** `Authorization: Bearer <accessToken>`

**Body :**
```json
{ "refreshToken": "<jwt>" }
```

**Réponse 200 ✅ :**
```json
{
  "success": true,
  "message": "Déconnexion réussie"
}
```

---

## PARTIE 2 — LOCALISATION

### PUT /users/location — Définir sa ville

**Accès :** utilisateur connecté

**Body :**
```json
{ "cityId": "<uuid>" }
```

**Réponse 200 ✅ — TEST 2.2 :**
```json
{
  "success": true,
  "message": "Localisation mise à jour",
  "data": {
    "cityId": "<uuid>",
    "cityName": "Cotonou",
    "countryCode": "BJ"
  }
}
```

**Réponse 404 ❌ — Ville introuvable (TEST 2.3) :**
```json
{
  "success": false,
  "message": "Ville introuvable",
  "error": { "code": "RESOURCE_NOT_FOUND" }
}
```

---

## PARTIE 3 — PROFIL USER

### GET /users/me — Mon profil

**Réponse 200 ✅ — TEST 2.4 / 3.2 :**
```json
{
  "success": true,
  "message": "Profil récupéré",
  "data": {
    "id": "<uuid>",
    "email": "kofi.mensah@gmail.com",
    "name": "Kofi Mensah",
    "phone": "+22961111111",
    "role": "USER",
    "isVerified": false,
    "isActive": true,
    "isProfileComplete": true,
    "createdAt": "<timestamp>",
    "profile": {
      "avatar": null,
      "address": null,
      "city": {
        "id": "<uuid>",
        "name": "Cotonou",
        "country": { "code": "BJ", "translations": { "fr": "Bénin", "en": "Benin" } }
      },
      "preferences": null
    }
  }
}
```

---

### PUT /users/profile — Mettre à jour le profil

**Body :**
```json
{
  "name": "Kofi Mensah Jr",
  "address": "Quartier Cadjehoun, Cotonou"
}
```

**Réponse 200 ✅ — TEST 3.1 :**
```json
{
  "success": true,
  "message": "Profil mis à jour",
  "data": { "..." }
}
```

---

## PARTIE 4 — ADMIN

### POST /auth/login — Login Admin

**Body :**
```json
{
  "email": "admin@juna.app",
  "password": "ChangeMe123!"
}
```

**Réponse 200 ✅ — TEST 0.0 :**
```json
{
  "success": true,
  "message": "Connexion réussie",
  "data": {
    "user": {
      "id": "af11691c-e3f4-4517-97e2-e5f8789033b0",
      "email": "admin@juna.app",
      "name": "Administrateur JUNA",
      "phone": "+22900000000",
      "role": "ADMIN",
      "isVerified": true,
      "isActive": true,
      "createdAt": "2026-04-08T16:29:39.814Z",
      "updatedAt": "2026-04-08T16:29:39.814Z"
    },
    "tokens": {
      "accessToken": "<jwt>",
      "refreshToken": "<jwt>"
    },
    "isProfileComplete": true
  }
}
```

> Les tokens sont imbriqués sous `tokens` (pas directement sous `data`). Cette structure s'applique à tous les endpoints de connexion.

---

### GET /admin/dashboard — Statistiques globales

**Réponse 200 ✅ — TEST 4.2 :**
```json
{
  "success": true,
  "message": "Dashboard",
  "data": {
    "totalUsers": "<number>",
    "totalProviders": "<number>",
    "pendingProviders": "<number>",
    "totalOrders": "<number>"
  }
}
```

---

### GET /admin/users — Lister les utilisateurs

**Réponse 200 ✅ — TEST 4.3 :**
```json
{
  "success": true,
  "message": "Liste des utilisateurs",
  "data": [ { "id": "<uuid>", "email": "...", "name": "...", "role": "USER" } ]
}
```

---

### GET /admin/providers/pending — Candidatures en attente

**Réponse 200 ✅ — TEST 4.4 / 5.6 :**
```json
{
  "success": true,
  "message": "Fournisseurs en attente",
  "data": [ { "id": "<uuid>", "businessName": "Chez Mariam", "status": "PENDING" } ]
}
```

---

## PARTIE 5 — CANDIDATURE PROVIDER

### POST /providers/register — S'inscrire comme provider

**Body :**
```json
{
  "businessName": "Chez Mariam",
  "description": "Cuisine africaine authentique...",
  "businessAddress": "Rue du Port, Quartier Gbeto",
  "logo": "https://res.cloudinary.com/.../logo.jpg",
  "cityId": "<uuid>",
  "acceptsDelivery": true,
  "acceptsPickup": true,
  "deliveryZones": [
    { "city": "Cotonou", "country": "BJ", "cost": 500 },
    { "city": "Abomey-Calavi", "country": "BJ", "cost": 800 }
  ],
  "landmarkIds": ["<uuid>", "<uuid>"]
}
```

**Réponse 201 ✅ — TEST 5.2 :**
```json
{
  "success": true,
  "message": "Candidature enregistrée",
  "data": {
    "id": "<uuid>",
    "businessName": "Chez Mariam",
    "status": "PENDING",
    "message": "Votre demande a ete enregistree. En attente de validation par l'admin."
  }
}
```

**Réponse 400 ❌ — Logo manquant (TEST 5.3) :**
```json
{
  "success": false,
  "message": "Validation failed: [{\"field\":\"logo\",\"message\":\"Le logo doit être une URL valide\"}]",
  "error": { "code": "VALIDATION_ERROR" }
}
```

**Réponse 400 ❌ — Aucun mode de réception (TEST 5.4) :**
```json
{
  "success": false,
  "message": "Validation failed: [{\"field\":\"\",\"message\":\"Vous devez proposer au moins un mode de réception (livraison ou retrait sur place)\"}]",
  "error": { "code": "VALIDATION_ERROR" }
}
```

**Réponse 400 ❌ — Livraison sans zones (TEST 5.5) :**
```json
{
  "success": false,
  "message": "Validation failed: [{\"field\":\"\",\"message\":\"Vous devez définir au moins une zone de livraison si vous proposez la livraison\"}]",
  "error": { "code": "VALIDATION_ERROR" }
}
```

---

### PUT /admin/providers/:id/approve — Approuver un provider

**Réponse 200 ✅ — TEST 5.8 :**
```json
{
  "success": true,
  "message": "Fournisseur approuvé",
  "data": {
    "id": "<uuid>",
    "businessName": "Chez Mariam",
    "status": "APPROVED"
  }
}
```

---

### GET /providers/me — Profil provider

**Réponse 200 ✅ — TEST 5.10 :**
```json
{
  "success": true,
  "message": "Profil fournisseur",
  "data": {
    "id": "<uuid>",
    "businessName": "Chez Mariam",
    "logo": "https://res.cloudinary.com/.../logo.jpg",
    "cityId": "<uuid>",
    "city": { "id": "<uuid>", "name": "Cotonou", "country": { "code": "BJ" } },
    "acceptsDelivery": true,
    "acceptsPickup": true,
    "deliveryZones": [ { "city": "Cotonou", "country": "BJ", "cost": 500 } ],
    "status": "APPROVED",
    "rating": 0,
    "totalReviews": 0
  }
}
```

---

## PARTIE 6 — REPAS

### POST /meals — Créer un repas

**Body :**
```json
{
  "name": "Riz sauce graine + poisson",
  "description": "Riz blanc avec sauce graine maison et poisson grillé",
  "price": 1500,
  "mealType": "LUNCH",
  "imageUrl": "https://images.unsplash.com/..."
}
```

**Réponse 201 ✅ — TEST 6.2 :**
```json
{
  "success": true,
  "message": "Repas créé",
  "data": {
    "id": "<uuid>",
    "name": "Riz sauce graine + poisson",
    "price": 1500,
    "mealType": "LUNCH",
    "isActive": true
  }
}
```

---

### GET /meals/me — Mes repas

**Réponse 200 ✅ — TEST 6.4 :**
```json
{
  "success": true,
  "message": "Mes repas",
  "data": [ { "id": "<uuid>", "name": "...", "price": 1500, "mealType": "LUNCH" } ]
}
```

---

## PARTIE 7 — ABONNEMENTS

### POST /subscriptions — Créer un abonnement

**Body :**
```json
{
  "name": "Formule Semaine Africaine",
  "description": "Petit-déjeuner + déjeuner + dîner du lundi au vendredi...",
  "price": 25000,
  "junaCommissionPercent": 10,
  "type": "FULL_DAY",
  "category": "AFRICAN",
  "duration": "WORK_WEEK",
  "isPublic": true,
  "isImmediate": false,
  "preparationHours": 24,
  "imageUrl": "https://images.unsplash.com/...",
  "mealIds": ["<uuid>", "<uuid>", "<uuid>"]
}
```

**Réponse 201 ✅ — TEST 7.1 :**
```json
{
  "success": true,
  "message": "Abonnement créé",
  "data": {
    "id": "<uuid>",
    "name": "Formule Semaine Africaine",
    "price": 25000,
    "type": "FULL_DAY",
    "duration": "WORK_WEEK",
    "isActive": true,
    "isPublic": true
  }
}
```

---

### GET /subscriptions/me — Mes abonnements (provider)

**Réponse 200 ✅ — TEST 7.4 :**
```json
{
  "success": true,
  "message": "Mes abonnements",
  "data": [ { "id": "<uuid>", "name": "...", "price": 25000 } ]
}
```

---

## PARTIE 8 — DÉCOUVERTE

### GET /subscriptions — Lister les abonnements publics

**Query params disponibles :**
| Paramètre | Type | Description |
|-----------|------|-------------|
| `city` | string | Nom de ville (ex: `Cotonou`) |
| `country` | string | Code pays (ex: `BJ`) |
| `landmarkId` | uuid | Filtrer par lieu de référence |
| `type` | enum | Type d'abonnement |
| `category` | enum | Catégorie culinaire |
| `duration` | enum | Durée |
| `search` | string | Recherche textuelle |
| `minPrice` / `maxPrice` | number | Fourchette de prix |

**Réponse 200 ✅ — TEST 8.1 :**
```json
{
  "success": true,
  "message": "Abonnements disponibles",
  "data": [
    {
      "id": "<uuid>",
      "name": "Formule Semaine Africaine",
      "price": 25000,
      "type": "FULL_DAY",
      "duration": "WORK_WEEK",
      "provider": {
        "id": "<uuid>",
        "businessName": "Chez Mariam",
        "city": { "name": "Cotonou", "country": { "code": "BJ" } },
        "rating": 0
      }
    }
  ]
}
```

> **TEST 8.3** — `GET /subscriptions?landmarkId=<uuid>` → retourne uniquement les providers qui ont coché ce landmark

---

### GET /subscriptions/:id — Détails d'un abonnement

**Réponse 200 ✅ — TEST 8.8 :**
```json
{
  "success": true,
  "message": "Détails abonnement",
  "data": {
    "id": "<uuid>",
    "name": "Formule Semaine Africaine",
    "price": 25000,
    "meals": [ { "id": "<uuid>", "name": "Bouillie de mil", "mealType": "BREAKFAST" } ],
    "provider": { "businessName": "Chez Mariam", "deliveryZones": [ { "city": "Cotonou", "cost": 500 } ] }
  }
}
```

---

## PARTIE 9 — COMMANDES

### POST /orders — Créer une commande

**Body (livraison) :**
```json
{
  "subscriptionId": "<uuid>",
  "deliveryMethod": "DELIVERY",
  "deliveryCity": "Cotonou",
  "deliveryAddress": "Quartier Cadjehoun, immeuble bleu",
  "startAsap": true
}
```

**Body (retrait) :**
```json
{
  "subscriptionId": "<uuid>",
  "deliveryMethod": "PICKUP",
  "startAsap": true
}
```

**Réponse 201 ✅ — TEST 9.2 :**
```json
{
  "success": true,
  "message": "Commande créée avec succès",
  "data": {
    "id": "<uuid>",
    "orderNumber": "ORD-<date>-<num>",
    "amount": 27500,
    "deliveryCost": 2500,
    "scheduledFor": "<timestamp>",
    "qrCode": "JUNA-<code>",
    "status": "PENDING"
  }
}
```

> `amount` = prix abonnement + `deliveryCost`
> `deliveryCost` = `zone.cost × DURATION_DAYS[duration]`
> `scheduledFor` = `now + preparationHours` si `startAsap`, sinon `requestedStartDate`

**Réponse 400 ❌ — Date trop proche (TEST 9.4) :**
```json
{
  "success": false,
  "message": "La date de début doit être au moins 24h après maintenant...",
  "error": { "code": "INVALID_INPUT" }
}
```

**Réponse 400 ❌ — Ville non couverte (TEST 9.5) :**
```json
{
  "success": false,
  "message": "Le prestataire ne livre pas à Lagos",
  "error": { "code": "INVALID_INPUT" }
}
```

---

### PUT /orders/:id/confirm — Confirmer une commande (provider)

**Réponse 200 ✅ — TEST 9.10 :**
```json
{
  "success": true,
  "message": "Commande confirmée",
  "data": { "id": "<uuid>", "status": "CONFIRMED" }
}
```

---

### PUT /orders/:id/ready — Marquer comme prête (provider)

**Réponse 200 ✅ — TEST 9.11 :**
```json
{
  "success": true,
  "message": "Commande prête",
  "data": { "id": "<uuid>", "status": "READY" }
}
```

---

### DELETE /orders/:id — Annuler une commande

> Annulation possible uniquement si statut = `PENDING` ou `CONFIRMED`

**Réponse 200 ✅ :**
```json
{
  "success": true,
  "message": "Commande annulée",
  "data": { "id": "<uuid>", "status": "CANCELLED" }
}
```

**Réponse 409 ❌ — Commande déjà READY (TEST 9.12) :**
```json
{
  "success": false,
  "message": "Cette commande ne peut plus être annulée",
  "error": { "code": "ORDER_CANNOT_BE_CANCELLED" }
}
```

**Codes d'erreur possibles :**
| Code | HTTP | Description |
|------|------|-------------|
| `INVALID_INPUT` | 400 | Date trop proche, ville non couverte |
| `UNAUTHORIZED` | 401 | Token manquant ou expiré |
| `NOT_FOUND` | 404 | Abonnement ou commande introuvable |
| `ORDER_CANNOT_BE_CANCELLED` | 409 | Commande non annulable (READY, DELIVERED...) |

---

## PARTIE 10 — UPLOAD

### POST /upload/:folder — Uploader une image

**Accès :** utilisateur connecté

**Dossiers valides :** `avatars` · `meals` · `subscriptions` · `providers` · `documents`

**Body :** `multipart/form-data` avec champ `image`

**Contraintes :** formats JPG/PNG/WEBP, max 5MB

**Réponse 201 ✅ — TEST 10.1 :**
```json
{
  "success": true,
  "message": "Image uploadée avec succès",
  "data": {
    "url": "https://res.cloudinary.com/.../juna/providers/<id>.webp",
    "publicId": "juna/providers/<id>",
    "folder": "providers",
    "size": 463,
    "mimetype": "image/png"
  }
}
```

**Cas d'usage :**
| Dossier | Champ cible |
|---------|-------------|
| `providers` | `logo` dans `/providers/register` |
| `meals` | `imageUrl` dans `/meals` |
| `subscriptions` | `imageUrl` dans `/subscriptions` |
| `avatars` | `avatar` dans `/users/profile` |
| `documents` | `documentUrl` dans `/providers/register` |
