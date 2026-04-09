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
      "id": "2c637fab-de4e-4303-a35c-b7856635d053",
      "email": "kofi.mensah@gmail.com",
      "name": "Kofi Mensah",
      "phone": "+22961111111",
      "role": "USER",
      "isVerified": false,
      "isActive": true,
      "createdAt": "2026-04-08T22:23:33.884Z",
      "updatedAt": "2026-04-08T22:23:33.884Z"
    },
    "tokens": {
      "accessToken": "<jwt>",
      "refreshToken": "<jwt>"
    },
    "isProfileComplete": true
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
  "message": "Validation failed: [{\"field\":\"password\",\"message\":\"Minimum 8 caractères\"},{\"field\":\"password\",\"message\":\"Le mot de passe doit contenir au moins une majuscule\"},{\"field\":\"password\",\"message\":\"Le mot de passe doit contenir au moins un chiffre\"}]",
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
      "id": "2c637fab-de4e-4303-a35c-b7856635d053",
      "email": "kofi.mensah@gmail.com",
      "name": "Kofi Mensah",
      "phone": "+22961111111",
      "role": "USER",
      "isVerified": false,
      "isActive": true,
      "createdAt": "2026-04-08T22:23:33.884Z",
      "updatedAt": "2026-04-08T22:23:33.884Z"
    },
    "tokens": {
      "accessToken": "<jwt>",
      "refreshToken": "<jwt>"
    },
    "isProfileComplete": false
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

### PUT /users/me/location — Définir sa ville

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

### PUT /users/me — Mettre à jour le profil

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
  "message": "Profil mis à jour avec succès",
  "data": {
    "id": "2c637fab-de4e-4303-a35c-b7856635d053",
    "email": "kofi.mensah@gmail.com",
    "name": "Kofi Mensah Jr",
    "phone": "+22961111111",
    "role": "USER",
    "isVerified": false,
    "isActive": true,
    "createdAt": "2026-04-08T22:23:33.884Z",
    "isProfileComplete": true,
    "profile": {
      "avatar": null,
      "address": "Quartier Cadjehoun, Cotonou",
      "city": {
        "id": "101a6a8c-ad3b-4071-b399-ba5cd5afed0c",
        "name": "Cotonou",
        "countryId": "8b60ac9a-c04b-45d6-acea-ad5cf1a340f6",
        "isActive": true,
        "country": {
          "id": "8b60ac9a-c04b-45d6-acea-ad5cf1a340f6",
          "code": "BJ",
          "translations": { "en": "Benin", "fr": "Bénin" },
          "isActive": true
        }
      },
      "preferences": null
    }
  }
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
  "data": {
    "overview": {
      "totalUsers": 4,
      "totalProviders": 0,
      "pendingProviders": 0,
      "totalOrders": 0,
      "completedOrders": 0,
      "pendingOrders": 0,
      "totalRevenue": 0
    },
    "charts": {
      "ordersByDay": [],
      "subscriptionsByCategory": []
    }
  }
}
```

---

### GET /admin/users — Lister les utilisateurs

**Réponse 200 ✅ — TEST 4.3 :**
```json
{
  "success": true,
  "data": [
    {
      "id": "9169212a-3200-451b-80d0-daf1c22715ee",
      "email": "sena.akpovi@gmail.com",
      "name": "Sena Akpovi",
      "phone": "+22963333333",
      "role": "USER",
      "isVerified": false,
      "isActive": true,
      "createdAt": "2026-04-08T22:25:23.569Z"
    },
    {
      "id": "9efa1ffa-3f39-49fe-bc8e-288d396dca25",
      "email": "mariam.diallo@gmail.com",
      "name": "Mariam Diallo",
      "phone": "+22962222222",
      "role": "USER",
      "isVerified": false,
      "isActive": true,
      "createdAt": "2026-04-08T22:24:42.987Z"
    },
    {
      "id": "2c637fab-de4e-4303-a35c-b7856635d053",
      "email": "kofi.mensah@gmail.com",
      "name": "Kofi Mensah Jr",
      "phone": "+22961111111",
      "role": "USER",
      "isVerified": false,
      "isActive": true,
      "createdAt": "2026-04-08T22:23:33.884Z"
    },
    {
      "id": "af11691c-e3f4-4517-97e2-e5f8789033b0",
      "email": "admin@juna.app",
      "name": "Administrateur JUNA",
      "phone": "+22900000000",
      "role": "ADMIN",
      "isVerified": true,
      "isActive": true,
      "createdAt": "2026-04-08T16:29:39.814Z"
    }
  ]
}
```

---

### GET /admin/providers/pending — Candidatures en attente

**Réponse 200 ✅ — TEST 5.6 :**
```json
{
  "success": true,
  "message": "Fournisseurs en attente",
  "data": [
    {
      "id": "dc6b75af-3b82-4600-8816-6a3781a1c4cf",
      "businessName": "Chez Mariam",
      "description": "Cuisine africaine authentique, faite maison avec des produits frais du marché.",
      "businessAddress": "Rue du Port, Quartier Gbeto, face à la pharmacie centrale",
      "logo": "https://res.cloudinary.com/dm9561wpm/image/upload/v1775732528/juna/providers/vcmcewqrpownranlzody.jp",
      "city": {
        "id": "f48380b5-36d3-4dfe-8e11-0512eef18a9b",
        "name": "Lokossa",
        "countryId": "6bf5d9ac-08a8-4774-b6e8-b08af709349d",
        "isActive": true,
        "country": {
          "id": "6bf5d9ac-08a8-4774-b6e8-b08af709349d",
          "code": "BJ",
          "translations": { "en": "Benin", "fr": "Bénin" },
          "isActive": true
        }
      },
      "acceptsDelivery": true,
      "acceptsPickup": true,
      "deliveryZones": [
        { "city": "Cotonou", "cost": 500, "country": "BJ" },
        { "city": "Abomey-Calavi", "cost": 800, "country": "BJ" },
        { "city": "Ouidah", "cost": 1500, "country": "BJ" }
      ],
      "landmarks": [
        {
          "providerId": "dc6b75af-3b82-4600-8816-6a3781a1c4cf",
          "landmarkId": "f10505bb-2f0c-4da0-b529-d30f57f91eed",
          "landmark": {
            "id": "f10505bb-2f0c-4da0-b529-d30f57f91eed",
            "name": "Campus IUT Lokossa",
            "cityId": "f48380b5-36d3-4dfe-8e11-0512eef18a9b"
          }
        }
      ],
      "documentUrl": null,
      "status": "PENDING",
      "rating": 0,
      "totalReviews": 0,
      "createdAt": "2026-04-09T11:09:57.557Z"
    }
  ]
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
  "message": "Validation failed: [{\"field\":\"logo\",\"message\":\"Required\"}]",
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

### GET /admin/providers/:id — Détails d'un provider

**Accès :** ADMIN

**Réponse 200 ✅ — TEST 5.7 :**
```json
{
  "success": true,
  "data": {
    "id": "dc6b75af-3b82-4600-8816-6a3781a1c4cf",
    "businessName": "Chez Mariam",
    "description": "Cuisine africaine authentique, faite maison avec des produits frais du marché.",
    "businessAddress": "Rue du Port, Quartier Gbeto, face à la pharmacie centrale",
    "logo": "https://res.cloudinary.com/dm9561wpm/image/upload/v1775732528/juna/providers/vcmcewqrpownranlzody.jp",
    "city": {
      "id": "f48380b5-36d3-4dfe-8e11-0512eef18a9b",
      "name": "Lokossa",
      "countryId": "6bf5d9ac-08a8-4774-b6e8-b08af709349d",
      "isActive": true,
      "country": {
        "id": "6bf5d9ac-08a8-4774-b6e8-b08af709349d",
        "code": "BJ",
        "translations": { "en": "Benin", "fr": "Bénin" },
        "isActive": true
      }
    },
    "acceptsDelivery": true,
    "acceptsPickup": true,
    "deliveryZones": [
      { "city": "Cotonou", "cost": 500, "country": "BJ" },
      { "city": "Abomey-Calavi", "cost": 800, "country": "BJ" },
      { "city": "Ouidah", "cost": 1500, "country": "BJ" }
    ],
    "landmarks": [
      {
        "providerId": "dc6b75af-3b82-4600-8816-6a3781a1c4cf",
        "landmarkId": "f10505bb-2f0c-4da0-b529-d30f57f91eed",
        "landmark": {
          "id": "f10505bb-2f0c-4da0-b529-d30f57f91eed",
          "name": "Campus IUT Lokossa",
          "cityId": "f48380b5-36d3-4dfe-8e11-0512eef18a9b"
        }
      }
    ],
    "documentUrl": null,
    "status": "PENDING",
    "rating": 0,
    "totalReviews": 0,
    "createdAt": "2026-04-09T11:09:57.557Z",
    "user": {
      "id": "16abf42e-95f5-404e-bc00-d201af404c84",
      "email": "mariam.diallo@gmail.com",
      "name": "Mariam Diallo"
    }
  }
}
```

---

### PUT /admin/providers/:id/approve — Approuver un provider

**Accès :** ADMIN

**Body :**
```json
{ "message": "Dossier complet, bienvenue sur Juna !" }
```

**Réponse 200 ✅ — TEST 5.8 :**
```json
{
  "success": true,
  "message": "Fournisseur approuve avec succes",
  "data": {
    "success": true,
    "message": "Dossier complet, bienvenue sur Juna !",
    "provider": {
      "id": "dc6b75af-3b82-4600-8816-6a3781a1c4cf",
      "businessName": "Chez Mariam",
      "status": "APPROVED"
    }
  }
}
```

---

### GET /providers/me — Profil provider

**Accès :** PROVIDER connecté

**Réponse 200 ✅ — TEST 5.10 :**
```json
{
  "success": true,
  "message": "Profil fournisseur recupere avec succes",
  "data": {
    "id": "dc6b75af-3b82-4600-8816-6a3781a1c4cf",
    "businessName": "Chez Mariam",
    "description": "Cuisine africaine authentique, faite maison avec des produits frais du marché.",
    "businessAddress": "Rue du Port, Quartier Gbeto, face à la pharmacie centrale",
    "logo": "https://res.cloudinary.com/dm9561wpm/image/upload/v1775732528/juna/providers/vcmcewqrpownranlzody.jp",
    "city": {
      "id": "f48380b5-36d3-4dfe-8e11-0512eef18a9b",
      "name": "Lokossa",
      "countryId": "6bf5d9ac-08a8-4774-b6e8-b08af709349d",
      "isActive": true,
      "country": {
        "id": "6bf5d9ac-08a8-4774-b6e8-b08af709349d",
        "code": "BJ",
        "translations": { "en": "Benin", "fr": "Bénin" },
        "isActive": true
      }
    },
    "acceptsDelivery": true,
    "acceptsPickup": true,
    "deliveryZones": [
      { "city": "Cotonou", "cost": 500, "country": "BJ" },
      { "city": "Abomey-Calavi", "cost": 800, "country": "BJ" },
      { "city": "Ouidah", "cost": 1500, "country": "BJ" }
    ],
    "landmarks": [
      {
        "providerId": "dc6b75af-3b82-4600-8816-6a3781a1c4cf",
        "landmarkId": "f10505bb-2f0c-4da0-b529-d30f57f91eed",
        "landmark": {
          "id": "f10505bb-2f0c-4da0-b529-d30f57f91eed",
          "name": "Campus IUT Lokossa",
          "cityId": "f48380b5-36d3-4dfe-8e11-0512eef18a9b"
        }
      }
    ],
    "documentUrl": null,
    "status": "APPROVED",
    "rating": 0,
    "totalReviews": 0,
    "createdAt": "2026-04-09T11:09:57.557Z",
    "subscriptions": []
  }
}
```

> `landmarks` = lieux de référence configurés par le provider à l'inscription. L'app mobile utilise ces IDs pour le filtre `GET /subscriptions?landmarkId=<uuid>`. Tous les abonnements du provider héritent de ces landmarks et zones de livraison.

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
  "message": "Repas créé avec succès",
  "data": {
    "id": "429c9fb3-97be-436e-81cb-a37bc92334f1",
    "providerId": "1d3103f3-930d-45be-b7ca-0041a10a9b9f",
    "name": "Riz sauce graine + poisson",
    "description": "Riz blanc avec sauce graine maison et poisson grillé",
    "price": 1500,
    "imageUrl": "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445",
    "mealType": "LUNCH",
    "isActive": true,
    "createdAt": "2026-04-08T23:44:32.563Z",
    "updatedAt": "2026-04-08T23:44:32.563Z"
  }
}
```

---

### GET /meals/me — Mes repas

**Réponse 200 ✅ — TEST 6.4 :**
```json
{
  "success": true,
  "message": "Repas récupérés avec succès",
  "data": [
    {
      "id": "31f23337-4f8e-4f02-80a0-a6bc595dd2c4",
      "providerId": "1d3103f3-930d-45be-b7ca-0041a10a9b9f",
      "name": "Pâte de maïs sauce gombo",
      "description": "Pâte de maïs fraîche accompagnée de sauce gombo au poulet",
      "price": 1200,
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836",
      "mealType": "DINNER",
      "isActive": true,
      "createdAt": "2026-04-08T23:46:51.243Z",
      "updatedAt": "2026-04-08T23:46:51.243Z"
    },
    {
      "id": "429c9fb3-97be-436e-81cb-a37bc92334f1",
      "providerId": "1d3103f3-930d-45be-b7ca-0041a10a9b9f",
      "name": "Riz sauce graine + poisson",
      "description": "Riz blanc avec sauce graine maison et poisson grillé",
      "price": 1500,
      "imageUrl": "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445",
      "mealType": "LUNCH",
      "isActive": true,
      "createdAt": "2026-04-08T23:44:32.563Z",
      "updatedAt": "2026-04-08T23:44:32.563Z"
    },
    {
      "id": "f2368718-6aa9-4d4a-b7fe-5d3d50d38eb4",
      "providerId": "1d3103f3-930d-45be-b7ca-0041a10a9b9f",
      "name": "Bouillie de mil avec beignets",
      "description": "Bouillie de mil sucrée servie avec beignets frits dorés",
      "price": 800,
      "imageUrl": "https://images.unsplash.com/photo-1547592180-85f173990554",
      "mealType": "BREAKFAST",
      "isActive": true,
      "createdAt": "2026-04-08T23:44:10.425Z",
      "updatedAt": "2026-04-08T23:44:10.425Z"
    }
  ]
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
  "message": "Abonnement créé avec succès",
  "data": {
    "id": "9f46ad3b-d02d-406c-a78c-525a34acf628",
    "providerId": "1d3103f3-930d-45be-b7ca-0041a10a9b9f",
    "name": "Formule Semaine Africaine",
    "description": "Petit-déjeuner + déjeuner + dîner du lundi au vendredi. Cuisine africaine authentique préparée chaque jour avec des produits frais.",
    "price": 25000,
    "junaCommissionPercent": 10,
    "type": "FULL_DAY",
    "category": "AFRICAN",
    "duration": "WORK_WEEK",
    "isActive": true,
    "isPublic": true,
    "isImmediate": false,
    "preparationHours": 24,
    "imageUrl": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1",
    "subscriberCount": 0,
    "rating": 0,
    "totalReviews": 0,
    "createdAt": "2026-04-08T23:49:17.605Z",
    "updatedAt": "2026-04-08T23:49:17.605Z"
  }
}
```

**Réponse 400 ❌ — Sans repas (TEST 7.3) :**
```json
{
  "success": false,
  "message": "Validation failed: [{\"field\":\"mealIds\",\"message\":\"Au moins un repas requis\"}]",
  "error": { "code": "VALIDATION_ERROR" }
}
```

---

### GET /subscriptions/me — Mes abonnements (provider)

**Réponse 200 ✅ — TEST 7.4 :**
```json
{
  "success": true,
  "message": "Abonnements récupérés avec succès",
  "data": [
    {
      "id": "e1580ed8-d2ab-40d8-96a7-9f0c30c07ec0",
      "providerId": "1d3103f3-930d-45be-b7ca-0041a10a9b9f",
      "name": "Formule Express Déjeuner",
      "price": 8000,
      "type": "LUNCH",
      "category": "AFRICAN",
      "duration": "WORK_WEEK",
      "isActive": true,
      "isPublic": true,
      "isImmediate": true,
      "preparationHours": 0,
      "subscriberCount": 0,
      "rating": 0,
      "totalReviews": 0,
      "createdAt": "2026-04-08T23:50:39.374Z"
    },
    {
      "id": "9f46ad3b-d02d-406c-a78c-525a34acf628",
      "providerId": "1d3103f3-930d-45be-b7ca-0041a10a9b9f",
      "name": "Formule Semaine Africaine",
      "price": 25000,
      "type": "FULL_DAY",
      "category": "AFRICAN",
      "duration": "WORK_WEEK",
      "isActive": true,
      "isPublic": true,
      "isImmediate": false,
      "preparationHours": 24,
      "subscriberCount": 0,
      "rating": 0,
      "totalReviews": 0,
      "createdAt": "2026-04-08T23:49:17.605Z"
    }
  ]
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
  "message": "Abonnements récupérés avec succès",
  "data": [
    {
      "id": "9f46ad3b-d02d-406c-a78c-525a34acf628",
      "providerId": "1d3103f3-930d-45be-b7ca-0041a10a9b9f",
      "name": "Formule Semaine Africaine",
      "description": "Petit-déjeuner + déjeuner + dîner du lundi au vendredi...",
      "price": 25000,
      "junaCommissionPercent": 10,
      "type": "FULL_DAY",
      "category": "AFRICAN",
      "duration": "WORK_WEEK",
      "isActive": true,
      "isPublic": true,
      "isImmediate": false,
      "preparationHours": 24,
      "imageUrl": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1",
      "subscriberCount": 0,
      "rating": 0,
      "totalReviews": 0,
      "createdAt": "2026-04-08T23:49:17.605Z",
      "provider": {
        "id": "1d3103f3-930d-45be-b7ca-0041a10a9b9f",
        "businessName": "Chez Mariam",
        "logo": "https://res.cloudinary.com/dm9561wpm/image/upload/v1775688932/juna/providers/fd5bgwpfrhg2wtz7hm5n.jpg",
        "rating": 0,
        "totalReviews": 0,
        "acceptsDelivery": true,
        "acceptsPickup": true,
        "deliveryZones": [
          { "city": "Cotonou", "cost": 500, "country": "BJ" },
          { "city": "Abomey-Calavi", "cost": 800, "country": "BJ" },
          { "city": "Ouidah", "cost": 1500, "country": "BJ" }
        ],
        "city": {
          "id": "101a6a8c-ad3b-4071-b399-ba5cd5afed0c",
          "name": "Cotonou",
          "country": { "code": "BJ", "translations": { "en": "Benin", "fr": "Bénin" } }
        },
        "landmarks": [
          {
            "landmark": { "id": "<uuid>", "name": "Campus IUT Lokossa", "cityId": "<uuid>" }
          }
        ]
      }
    }
  ]
}
```

> Les champs `deliveryZones`, `acceptsDelivery`, `acceptsPickup` et `landmarks` sont portés par le **provider**, pas par l'abonnement. Tous les abonnements d'un provider héritent de ces infos.

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
    "provider": {
      "businessName": "Chez Mariam",
      "acceptsDelivery": true,
      "acceptsPickup": true,
      "deliveryZones": [ { "city": "Cotonou", "cost": 500, "country": "BJ" } ],
      "landmarks": [ { "landmark": { "id": "<uuid>", "name": "Campus IUT Lokossa" } } ]
    }
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

**Réponse 201 ✅ — TEST 5.0 :**
```json
{
  "success": true,
  "message": "Image uploadée avec succès",
  "data": {
    "url": "https://res.cloudinary.com/dm9561wpm/image/upload/v1775688932/juna/providers/fd5bgwpfrhg2wtz7hm5n.jpg",
    "publicId": "juna/providers/fd5bgwpfrhg2wtz7hm5n",
    "folder": "providers",
    "size": 66446,
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
