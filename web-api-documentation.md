# Documentation API JUNA — Version Web

> Documentation complète des endpoints API pour la version web de JUNA.
> Couvre trois rôles : **Consommateur**, **Checkout** (paiement) et **Dashboard Provider**.

---

## Base URL

**Production :**
```
https://juna-app.up.railway.app/api/v1
```

**Local (développement) :**
```
http://localhost:5000/api/v1
```

---

## Conventions générales

Toutes les réponses ont la structure suivante :
```json
{
  "success": true | false,
  "message": "Message lisible" | ["Message 1", "Message 2"],
  "data": { ... },
  "error": { "code": "ERROR_CODE" }
}
```

- `data` est présent uniquement en cas de succès
- `error` est présent uniquement en cas d'échec
- `message` peut être un **tableau de strings** pour les erreurs de validation Zod, ou une **string simple** pour les erreurs métier
- Les endpoints protégés nécessitent : `Authorization: Bearer {accessToken}`
- `accessToken` expire après **15 minutes**, `refreshToken` après **7 jours**
- Rate limit auth : **5 requêtes / 15 minutes**

> ⚠️ **Gestion des erreurs côté frontend** : Ne jamais afficher un message générique "Une erreur est survenue". Toujours lire `response.data.message`. Si c'est un tableau, afficher chaque item. Si c'est une string, l'afficher directement. Ces messages sont en français et directement destinés à l'utilisateur.

### Points critiques — erreurs fréquentes

| Problème | Cause | Solution |
|----------|-------|----------|
| `"Expected number, received string"` sur `page`/`limit` | Les query params arrivent toujours en string | Le serveur coerce automatiquement (`z.coerce.number()`) — envoyer `?page=1&limit=20` suffit |
| `400` sur `cityId` | UUID v4 attendu | Format exact : `xxxxxxxx-xxxx-4xxx-xxxx-xxxxxxxxxxxx` |
| Champ `isAvailable` non reconnu | Le champ s'appelle `isActive` | Utiliser exactement `isActive` |
| Upload `400 "Aucun fichier fourni"` | Mauvais nom de champ | Le champ multipart s'appelle exactement `image` (pas `file`, pas `avatar`) |
| `user.avatar null` dans les avis | L'utilisateur n'a pas de photo | Champ nullable — prévoir un fallback (initiales) |

---

## Table des routes

| Méthode | Route | Auth | Rôle | Description |
|---------|-------|------|------|-------------|
| `POST` | `/auth/register` | public | — | Inscription utilisateur |
| `POST` | `/auth/login` | public | — | Connexion |
| `POST` | `/auth/refresh` | public | — | Rafraîchir accessToken |
| `POST` | `/auth/logout` | auth | — | Déconnexion |
| `GET` | `/auth/me` | auth | — | Infos utilisateur connecté |
| `PUT` | `/auth/me` | auth | — | Modifier profil (auth service) |
| `POST` | `/auth/change-password` | auth | — | Changer mot de passe |
| `GET` | `/countries` | public | — | Lister les pays |
| `GET` | `/countries/:code/cities` | public | — | Villes d'un pays |
| `GET` | `/cities/:cityId/landmarks` | public | — | Landmarks d'une ville |
| `GET` | `/home` | public | — | Feed page d'accueil |
| `GET` | `/subscriptions` | public | — | Lister abonnements (Explorer) |
| `GET` | `/subscriptions/:id` | public | — | Détail abonnement |
| `GET` | `/reviews/subscription/:id` | public | — | Avis d'un abonnement |
| `POST` | `/reviews` | auth | USER | Créer un avis |
| `GET` | `/users/me` | auth | USER | Profil utilisateur complet |
| `PUT` | `/users/me` | auth | USER | Modifier profil |
| `PUT` | `/users/me/location` | auth | USER | Changer de ville |
| `PUT` | `/users/me/preferences` | auth | USER | Préférences alimentaires |
| `POST` | `/orders` | auth | USER | Créer une commande |
| `GET` | `/orders/me` | auth | USER | Mes commandes |
| `GET` | `/orders/:id` | auth | USER | Détail commande + QR |
| `DELETE` | `/orders/:id` | auth | USER | Annuler commande |
| `POST` | `/orders/:id/complete` | auth | USER | Valider retrait (QR) |
| `POST` | `/upload/:folder` | auth | — | Upload image |
| `POST` | `/providers/register` | auth | USER | Devenir prestataire |
| `GET` | `/providers/me` | auth | PROVIDER | Profil provider |
| `PUT` | `/providers/me` | auth | PROVIDER | Modifier profil provider |
| `POST` | `/subscriptions` | auth | PROVIDER | Créer abonnement |
| `GET` | `/subscriptions/me` | auth | PROVIDER | Mes abonnements |
| `PUT` | `/subscriptions/:id` | auth | PROVIDER | Modifier abonnement |
| `PUT` | `/subscriptions/:id/toggle` | auth | PROVIDER | Activer / désactiver |
| `PUT` | `/subscriptions/:id/public` | auth | PROVIDER | Publier / dépublier |
| `DELETE` | `/subscriptions/:id` | auth | PROVIDER | Supprimer abonnement |
| `POST` | `/meals` | auth | PROVIDER | Créer un plat |
| `GET` | `/meals/me` | auth | PROVIDER | Mes plats |
| `PUT` | `/meals/:id` | auth | PROVIDER | Modifier plat |
| `PUT` | `/meals/:id/toggle` | auth | PROVIDER | Activer / désactiver plat |
| `DELETE` | `/meals/:id` | auth | PROVIDER | Supprimer plat |
| `GET` | `/orders/provider/me` | auth | PROVIDER | Commandes reçues |
| `PUT` | `/orders/:id/activate` | auth | USER | Activer commande |
| `PUT` | `/orders/:id/qrcode` | auth | PROVIDER | Régénérer QR code |
| `POST` | `/orders/scan/:id/:qrCode` | public | — | Scanner QR code |
| `GET` | `/active-subscriptions/me` | auth | USER | Mes abonnements actifs |
| `GET` | `/active-subscriptions/check` | auth | USER | Vérifier abonnement actif |
| `GET` | `/active-subscriptions/provider/me` | auth | PROVIDER | Abonnements actifs de mes clients |
| `GET` | `/active-subscriptions/stats` | auth | ADMIN | Stats globaux |

---

## PARTIE 0 — GÉOGRAPHIE

### GET /countries

**Accès :** public

**Réponse 200 ✅ :**
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

### GET /countries/:code/cities

**Accès :** public

**Paramètre :** `code` = code ISO du pays (ex: `BJ`)

**Réponse 200 ✅ :**
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
    }
  ]
}
```

---

### GET /cities/:cityId/landmarks

**Accès :** public

**Paramètre :** `cityId` = UUID de la ville

**Réponse 200 ✅ :**
```json
{
  "success": true,
  "message": "Landmarks de la ville",
  "data": [
    {
      "id": "landmark-uuid",
      "name": "Étoile Rouge",
      "cityId": "city-uuid",
      "isActive": true,
      "createdAt": "2026-04-08T16:40:12.123Z"
    }
  ]
}
```

---

## PARTIE 1 — AUTHENTIFICATION

### POST /auth/register

**Accès :** public

**Body :**
```json
{
  "email": "user@example.com",
  "verifiedToken": "uuid-du-token-reçu-après-vérification-OTP",
  "password": "MotDePasse123",
  "name": "Jean Dupont",
  "phone": "+22997111111"
}
```

| Champ | Type | Obligatoire | Contraintes |
|-------|------|-------------|-------------|
| `email` | string | ✅ | Format email valide — doit correspondre à l'email vérifié par OTP |
| `verifiedToken` | string | ✅ | Token reçu après `POST /auth/verify-code` — valide 30 min |
| `password` | string | ✅ | Min 8 caractères · Au moins 1 majuscule · Au moins 1 chiffre · Max 128 caractères |
| `name` | string | ✅ | Min 2 caractères, max 100 |
| `phone` | string | ❌ | Chiffres, espaces, tirets et `+` acceptés. Stocké tel quel — ce champ n'est pas utilisé pour le paiement. |

> 🎨 **UX — Champ téléphone** : Ne pas afficher ce champ comme "optionnel" dans le formulaire. Présenter-le simplement sans mention obligatoire/optionnel pour encourager sa saisie.

> 🎨 **UX — Indicateur de force du mot de passe** : Afficher sous le champ mot de passe une liste de critères qui passent au vert en temps réel quand l'utilisateur tape :
> - ✅ Au moins 8 caractères
> - ✅ Au moins une lettre majuscule
> - ✅ Au moins un chiffre
>
> Chaque critère commence en gris avec une icône ✗, et passe en vert ✓ dès qu'il est satisfait. Cela évite à l'utilisateur de soumettre et recevoir une erreur sans savoir pourquoi.

**Réponse 201 ✅ :**
```json
{
  "success": true,
  "message": "Utilisateur créé avec succès",
  "data": {
    "user": {
      "id": "user-uuid",
      "email": "user@example.com",
      "name": "Jean Dupont",
      "phone": "+22997111111",
      "role": "USER",
      "isVerified": true,
      "isActive": true
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
      "expiresIn": 900
    },
    "isProfileComplete": false
  }
}
```

> `isVerified` est toujours `true` après inscription — l'email est vérifié avant la création du compte via le flow OTP.

**Réponses d'erreur :**
```json
{ "success": false, "message": ["Cet email est déjà utilisé"], "error": { "code": "EMAIL_ALREADY_EXISTS" } }
{ "success": false, "message": ["Ce numéro de téléphone est déjà utilisé"], "error": { "code": "PHONE_ALREADY_EXISTS" } }
{ "success": false, "message": ["Token de vérification invalide"], "error": { "code": "INVALID_TOKEN" } }
{ "success": false, "message": ["Minimum 8 caractères", "Le mot de passe doit contenir au moins une majuscule", "Le mot de passe doit contenir au moins un chiffre"], "error": { "code": "INVALID_INPUT" } }
```

> Ces messages de validation sont directement affichables à l'utilisateur. Lire `response.data.message` — c'est un **tableau** dans ce cas, itérer dessus pour afficher chaque erreur.

---

### POST /auth/login

**Accès :** public

**Body :**
```json
{
  "email": "user@example.com",
  "password": "Password123"
}
```

**Réponse 200 ✅ :**
```json
{
  "success": true,
  "message": "Connexion réussie",
  "data": {
    "user": {
      "id": "user-uuid",
      "email": "user@example.com",
      "name": "Jean Dupont",
      "role": "USER",
      "isActive": true
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
      "expiresIn": 900
    },
    "isProfileComplete": true
  }
}
```

**Réponses d'erreur :**
```json
{ "success": false, "message": "Email ou mot de passe incorrect", "error": { "code": "INVALID_CREDENTIALS" } }
{ "success": false, "message": "Compte suspendu ou banni", "error": { "code": "ACCOUNT_SUSPENDED" } }
```

---

### POST /auth/refresh

**Accès :** public

**Body :**
```json
{ "refreshToken": "eyJhbGciOiJIUzI1NiIs..." }
```

**Réponse 200 ✅ :**
```json
{
  "success": true,
  "data": { "accessToken": "eyJhbGciOiJIUzI1NiIs..." }
}
```

**Réponse 401 ❌ :**
```json
{ "success": false, "message": "Refresh token invalide ou expiré", "error": { "code": "INVALID_TOKEN" } }
```

---

### POST /auth/logout

**Accès :** auth

**Body :**
```json
{ "refreshToken": "eyJhbGciOiJIUzI1NiIs..." }
```

**Réponse 200 ✅ :**
```json
{ "success": true, "message": "Déconnexion réussie" }
```

---

### POST /auth/change-password

**Accès :** auth

**Body :**
```json
{
  "currentPassword": "AncienMotDePasse123",
  "newPassword": "NouveauMotDePasse456"
}
```

**Réponse 200 ✅ :**
```json
{ "success": true, "message": "Mot de passe modifié avec succès" }
```

**Réponse 401 ❌ :**
```json
{ "success": false, "message": "Mot de passe actuel incorrect", "error": { "code": "INVALID_PASSWORD" } }
```

---

## PARTIE 2 — PROFIL UTILISATEUR

### GET /users/me

**Accès :** auth

**Réponse 200 ✅ :**
```json
{
  "success": true,
  "message": "Profil récupéré avec succès",
  "data": {
    "id": "user-uuid",
    "email": "user@example.com",
    "name": "Jean Dupont",
    "phone": "+22961111111",
    "role": "USER",
    "isVerified": false,
    "isActive": true,
    "isProfileComplete": true,
    "profile": {
      "avatar": "https://res.cloudinary.com/...",
      "address": "Quartier Cadjehoun",
      "city": {
        "id": "city-uuid",
        "name": "Cotonou",
        "country": { "code": "BJ", "translations": { "fr": "Bénin", "en": "Benin" } }
      },
      "preferences": {
        "dietaryRestrictions": ["végétarien"],
        "favoriteCategories": ["africain"],
        "notifications": { "email": true, "push": true, "sms": false }
      }
    }
  }
}
```

> `profile.avatar` peut être `null` si l'utilisateur n'a pas uploadé de photo.
> `profile.city` peut être `null` si la ville n'a pas encore été définie.
> `isProfileComplete: true` uniquement si `cityId` est défini — le téléphone n'entre pas dans le calcul.

---

### PUT /users/me

**Accès :** auth

**Body :** (tous les champs optionnels)
```json
{
  "name": "Jean Dupont Jr",
  "phone": "+22962222222",
  "address": "Nouvelle adresse",
  "cityId": "city-uuid",
  "avatarUrl": "https://res.cloudinary.com/..."
}
```

> `avatarUrl` doit être l'URL obtenue après un upload via `POST /upload/avatars`. Ne pas envoyer `avatar` ou `avatarUrl` directement — toujours uploader d'abord, puis envoyer l'URL.

---

### PUT /users/me/location

**Accès :** auth

**Body :**
```json
{ "cityId": "city-uuid" }
```

**Réponse 200 ✅ :**
```json
{
  "success": true,
  "message": "Localisation mise à jour avec succès",
  "data": {
    "cityId": "city-uuid",
    "cityName": "Cotonou",
    "countryCode": "BJ"
  }
}
```

---

### PUT /users/me/preferences

**Accès :** auth

**Body :**
```json
{
  "dietaryRestrictions": ["végétarien", "halal"],
  "favoriteCategories": ["africain", "fusion"],
  "notifications": { "email": true, "push": false, "sms": true }
}
```

---

## PARTIE 3 — UPLOAD D'IMAGES

### POST /upload/:folder

**Accès :** auth

**Content-Type :** `multipart/form-data`

**Champ du fichier :** `image` — exactement ce nom, pas `file`, pas `avatar`, pas `photo`.

**Valeurs `:folder` acceptées :**

| Valeur | Usage |
|--------|-------|
| `avatars` | Photo de profil utilisateur |
| `providers` | Logo prestataire |
| `meals` | Photo d'un plat |
| `subscriptions` | Image d'un abonnement |
| `documents` | Documents justificatifs |

**Types MIME acceptés :** `image/jpeg`, `image/jpg`, `image/png`, `image/webp`

**Taille maximale :** 5 Mo

**Exemple :**
```
POST /api/v1/upload/avatars
Authorization: Bearer <token>
Content-Type: multipart/form-data

image: <fichier binaire>
```

**Réponse 201 ✅ :**
```json
{
  "success": true,
  "message": "Image uploadée avec succès",
  "data": {
    "url": "https://res.cloudinary.com/dm9561wpm/image/upload/v.../juna/avatars/xxxx.jpg",
    "publicId": "juna/avatars/xxxx",
    "folder": "avatars",
    "size": 123456,
    "mimetype": "image/jpeg"
  }
}
```

**Réponses d'erreur :**
```json
{ "success": false, "message": ["Aucun fichier fourni"], "error": { "code": "INVALID_INPUT" } }
{ "success": false, "message": ["Format non supporté. Formats acceptés : JPG, PNG, WEBP"], "error": { "code": "INVALID_INPUT" } }
{ "success": false, "message": ["Dossier invalide"], "error": { "code": "INVALID_INPUT" } }
```

---

## PARTIE 4 — DÉCOUVERTE (CONSOMMATEUR)

### GET /home

**Accès :** public

**Query params :**

| Param | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| `cityId` | UUID v4 | ✅ | ID de la ville sélectionnée |
| `limit` | number | ❌ | Items par section (défaut : 10, max : 50) |

**Réponse 200 ✅ :**
```json
{
  "success": true,
  "message": "Feed de la page d'accueil",
  "data": {
    "popular": [
      {
        "id": "sub-uuid",
        "name": "Abonnement Repas Africain",
        "description": "...",
        "price": 25000,
        "currency": "XOF",
        "category": "AFRICAN",
        "type": "LUNCH",
        "duration": "WORK_WEEK",
        "images": ["https://res.cloudinary.com/..."],
        "rating": 4.8,
        "reviewCount": 120,
        "isActive": true,
        "provider": {
          "id": "prov-uuid",
          "name": "Chez Mariam",
          "logo": "https://...",
          "isVerified": true
        }
      }
    ],
    "recent": [ /* même structure que popular */ ],
    "providers": [
      {
        "id": "prov-uuid",
        "name": "Chez Mariam",
        "logo": "https://...",
        "isVerified": true,
        "city": "Cotonou",
        "subscriptionCount": 3,
        "rating": 4.6
      }
    ]
  }
}
```

> Score `popular` : `(rating × 0.3) + (log(reviewCount+1) × 0.2) + (log(orderCount+1) × 0.4) + (isVerified ? 0.1 : 0)`

---

### GET /subscriptions

**Accès :** public

**Query params :**

| Param | Type | Défaut | Description |
|-------|------|--------|-------------|
| `cityId` | UUID v4 | — | Ville (recommandé) |
| `sort` | string | `popular` | Voir tableau ci-dessous |
| `page` | number | `1` | Numéro de page — coercé automatiquement depuis string |
| `limit` | number | `20` | Items par page (max 100) — coercé automatiquement |
| `category` | string | — | `AFRICAN` `EUROPEAN` `ASIAN` `AMERICAN` `FUSION` `VEGETARIAN` `VEGAN` `HALAL` `OTHER` |
| `type` | string | — | `BREAKFAST` `LUNCH` `DINNER` `SNACK` `BREAKFAST_LUNCH` `BREAKFAST_DINNER` `LUNCH_DINNER` `FULL_DAY` `CUSTOM` |
| `duration` | string | — | `DAY` `THREE_DAYS` `WEEK` `TWO_WEEKS` `MONTH` `WORK_WEEK` `WORK_WEEK_2` `WORK_MONTH` `WEEKEND` |
| `landmarkId` | UUID v4 | — | Filtrage par zone |
| `search` | string | — | Recherche texte (nom, description) |
| `minPrice` | number | — | Prix minimum |
| `maxPrice` | number | — | Prix maximum |

**Valeurs `sort` :**

| Valeur | Comportement |
|--------|-------------|
| `popular` *(défaut)* | Score pondéré : rating × 0.3 + log(reviews+1) × 0.2 + log(orders+1) × 0.4 + isVerified × 0.1 |
| `recent` | Plus récents en premier (`createdAt DESC`) |
| `rating` | Mieux notés en premier (`rating DESC`) |
| `price_asc` | Prix croissant |
| `price_desc` | Prix décroissant |

> Les abonnements `isActive: false` sont **toujours filtrés côté serveur** — jamais retournés.

**Réponse 200 ✅ :**
```json
{
  "success": true,
  "message": "Abonnements récupérés avec succès",
  "data": {
    "subscriptions": [
      {
        "id": "sub-uuid",
        "name": "Abonnement Repas Africain",
        "description": "...",
        "price": 25000,
        "currency": "XOF",
        "type": "LUNCH",
        "category": "AFRICAN",
        "duration": "WORK_WEEK",
        "mealCount": 5,
        "images": ["https://res.cloudinary.com/..."],
        "rating": 4.8,
        "reviewCount": 120,
        "isActive": true,
        "provider": {
          "id": "prov-uuid",
          "name": "Chez Mariam",
          "logo": "https://...",
          "isVerified": true
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 245,
      "totalPages": 13
    }
  }
}
```

---

### GET /subscriptions/:id

**Accès :** public

**Paramètre :** `id` = UUID v4 de l'abonnement

**Réponse 200 ✅ :**
```json
{
  "success": true,
  "message": "Abonnement récupéré avec succès",
  "data": {
    "id": "sub-uuid",
    "name": "Abonnement Repas Africain",
    "description": "Description complète...",
    "price": 25000,
    "currency": "XOF",
    "type": "LUNCH",
    "category": "AFRICAN",
    "duration": "WORK_WEEK",
    "mealCount": 5,
    "images": ["https://res.cloudinary.com/..."],
    "rating": 4.8,
    "reviewCount": 120,
    "isActive": true,
    "provider": {
      "id": "prov-uuid",
      "name": "Chez Mariam",
      "logo": "https://...",
      "isVerified": true,
      "description": "Restaurant spécialisé en cuisine africaine...",
      "rating": 4.6,
      "reviewCount": 87,
      "acceptsDelivery": true,
      "acceptsPickup": true,
      "businessAddress": "Rue 234, Quartier Cadjehoun",
      "city": {
        "id": "city-uuid",
        "name": "Cotonou"
      }
    },
    "meals": [
      {
        "id": "meal-uuid",
        "name": "Riz sauce graine",
        "description": "Riz basmati avec sauce graine maison...",
        "imageUrl": "https://..."
      }
    ],
    "deliveryZones": ["Plateau", "Akpakpa", "Cadjehoun"],
    "pickupPoints": ["Rue 234, Cadjehoun"], // Simplifié : adresse du provider
    "providerSubscriptions": [
      {
        "id": "sub-uuid-2",
        "name": "Abonnement Petit-déjeuner",
        "price": 15000,
        "currency": "XOF",
        "type": "BREAKFAST",
        "category": "AFRICAN",
        "duration": "WORK_WEEK",
        "images": ["https://res.cloudinary.com/..."],
        "rating": 4.5,
        "reviewCount": 32,
        "isActive": true
      }
    ]
  }
}
```

> `meals[].price` n'est pas retourné — uniquement le prix global de l'abonnement.
> `provider.description` peut être `null`.
> `provider.city` peut être `null`.
> `meals[].imageUrl` peut être `null`.
> `providerSubscriptions` : 6 derniers abonnements actifs et publics du même provider, hors abonnement courant. Tableau vide `[]` si le provider n'a pas d'autres abonnements.

---

### GET /reviews/subscription/:subscriptionId

**Accès :** public

**Query params :**

| Param | Type | Défaut | Description |
|-------|------|--------|-------------|
| `page` | number | `1` | Coercé automatiquement depuis string |
| `limit` | number | `10` | Max 50, coercé automatiquement |

**Réponse 200 ✅ :**
```json
{
  "success": true,
  "message": "Avis récupérés avec succès",
  "data": {
    "reviews": [
      {
        "id": "review-uuid",
        "rating": 5,
        "comment": "Excellente cuisine, je recommande !",
        "createdAt": "2024-12-15T10:30:00Z",
        "user": {
          "name": "Adjoua D.",
          "avatar": "https://res.cloudinary.com/..."
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 120,
      "totalPages": 12
    }
  }
}
```

> `user.avatar` peut être `null` — prévoir un affichage avec initiales.
> `comment` peut être `null` — seule la note est obligatoire lors de la création.

---

## PARTIE 5 — COMMANDES (CHECKOUT)

### POST /orders — Créer une commande

**Accès :** auth (USER)

**Body :**

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| `subscriptionId` | UUID v4 | ✅ | Abonnement commandé |
| `deliveryMethod` | string | ✅ | `DELIVERY` ou `PICKUP` |
| `deliveryAddress` | string | ❌ | Adresse de livraison (requis si `DELIVERY`) |
| `deliveryCity` | string | ❌ | Ville de livraison (requis si `DELIVERY`) |
| `pickupLocation` | string | ❌ | Adresse du provider (auto-rempli si `PICKUP`) |
| `startAsap` | boolean | ❌* | Démarrer dès que possible |
| `requestedStartDate` | string (ISO 8601) | ❌* | Date de début souhaitée |

> *`startAsap` OU `requestedStartDate` est obligatoire — l'un ou l'autre.
> Si `requestedStartDate`, la date doit respecter le délai de préparation du prestataire (`preparationHours`).
> **Simplification MVP :** Pour `PICKUP`, `pickupLocation` est automatiquement l'adresse du provider (`businessAddress`).

**Réponse 201 ✅ :**
```json
{
  "success": true,
  "message": "Commande créée avec succès",
  "data": {
    "id": "order-uuid",
    "orderNumber": "JUNA-0001",
    "status": "PENDING",
    "amount": 25000,
    "deliveryCost": 0,
    "deliveryMethod": "DELIVERY",
    "deliveryAddress": "Quartier Cadjehoun",
    "deliveryCity": "Cotonou",
    "scheduledFor": "2026-04-20T08:00:00Z",
    "qrCode": "JUNA-A1B2C3D4",
    "createdAt": "2026-04-19T10:00:00Z"
  }
}
```

> `amount` = prix abonnement uniquement (frais de livraison négociés séparément).
> `deliveryCost` = 0 (estimation affichée, négociation directe avec le provider).
> `qrCode` est généré automatiquement à la création.

---

### **🎯 VERSION WEB : Modal d'information livraison**

**Sur la page web de commande**, lorsqu'un utilisateur choisit le mode "LIVRAISON" :

#### **Afficher un modal d'information obligatoire :**

```
┌─────────────────────────────────────────────────┐
│  ℹ️  Information importante sur la livraison     │
│                                                 │
│  Les prix de livraison affichés sont des        │
│  estimations basées sur des moyennes dans       │
│  cette zone géographique.                       │
│                                                 │
│  Le prestataire vous contactera directement     │
│  en ce qui concerne les frais de livraisons    │
│  et les modalités de paiement.                  │
│                                                 │
│       [ J'ai compris ]  ← bouton orange         │
└─────────────────────────────────────────────────┘
```

**Règles d'affichage :**
- Modal s'affiche automatiquement quand `deliveryMethod = "DELIVERY"`
- Bouton "J'ai compris" obligatoire pour continuer
- Texte en français, ton informatif et rassurant
- Pas de possibilité de fermer le modal sans accepter

**Impact UX :**
- ✅ Transparence sur les prix estimés
- ✅ Gestion des attentes réalistes
- ✅ Préparation à la négociation directe

---

**Réponses d'erreur :**
```json
{ "success": false, "message": "Cet abonnement n'est pas disponible", "error": { "code": "INVALID_INPUT" } }
{ "success": false, "message": "Ce prestataire ne propose pas la livraison", "error": { "code": "INVALID_INPUT" } }
```

---

### GET /orders/me — Mes commandes

**Accès :** auth (USER)

**Réponse 200 ✅ :**
```json
{
  "success": true,
  "message": "Commandes récupérées avec succès",
  "data": [
    {
      "id": "order-uuid",
      "orderNumber": "JUNA-0001",
      "status": "CONFIRMED",
      "amount": 25500,
      "deliveryMethod": "DELIVERY",
      "scheduledFor": "2026-04-20T08:00:00Z",
      "createdAt": "2026-04-19T10:00:00Z",
      "subscription": {
        "id": "sub-uuid",
        "name": "Abonnement Repas Africain"
      }
    }
  ]
}
```

---

### GET /orders/:id — Détail commande

**Accès :** auth

**Réponse 200 ✅ :**
```json
{
  "success": true,
  "data": {
    "id": "order-uuid",
    "orderNumber": "JUNA-0001",
    "status": "CONFIRMED",
    "amount": 25000,
    "deliveryCost": 0,
    "deliveryMethod": "DELIVERY",
    "deliveryAddress": "Quartier Cadjehoun",
    "deliveryCity": "Cotonou",
    "scheduledFor": "2026-04-20T08:00:00Z",
    "qrCode": "JUNA-A1B2C3D4",
    "completedAt": null,
    "createdAt": "2026-04-19T10:00:00Z",
    "subscription": {
      "id": "sub-uuid",
      "name": "Abonnement Repas Africain",
      "provider": { "id": "prov-uuid", "businessName": "Chez Mariam" }
    }
  }
}
```

> `completedAt` est `null` tant que la commande n'est pas livrée/retirée.

---

### DELETE /orders/:id — Annuler commande

**Accès :** auth (USER ou ADMIN)

**Annulation possible uniquement si status :** `PENDING` ou `CONFIRMED`

**Réponse 200 ✅ :**
```json
{ "success": true, "message": "Commande annulée avec succès", "data": { "id": "...", "status": "CANCELLED" } }
```

**Réponse 409 ❌ :**
```json
{ "success": false, "message": "Cette commande ne peut plus être annulée", "error": { "code": "ORDER_CANNOT_BE_CANCELLED" } }
```

---

### POST /orders/:id/complete — Valider retrait via QR

**Accès :** auth (USER)

**Body :**
```json
{ "qrCode": "JUNA-A1B2C3D4" }
```

**Résultat selon `deliveryMethod` :**
- `PICKUP` → status devient `COMPLETED`
- `DELIVERY` → status devient `DELIVERED`

---

### POST /orders/scan/:id/:qrCode — Scanner QR (public)

**Accès :** public (scan par prestataire via interface web)

**Paramètres URL :** `id` = UUID commande, `qrCode` = valeur du QR

**Réponse 200 ✅ :** même structure que `GET /orders/:id` avec status mis à jour

**Réponse 400 ❌ :**
```json
{ "success": false, "message": "QR code invalide", "error": { "code": "QR_CODE_INVALID" } }
{ "success": false, "message": "QR code déjà utilisé", "error": { "code": "QR_CODE_ALREADY_USED" } }
```

---

## PARTIE 6 — AVIS

### POST /reviews — Créer un avis

**Accès :** auth (USER)

**Body :**

| Champ | Type | Obligatoire | Contraintes |
|-------|------|-------------|-------------|
| `orderId` | UUID v4 | ✅ | La commande doit appartenir à l'utilisateur |
| `subscriptionId` | UUID v4 | ✅ | Doit correspondre à l'abonnement de la commande |
| `rating` | number | ✅ | Entier entre 1 et 5 |
| `comment` | string | ❌ | Texte libre |

```json
{
  "orderId": "order-uuid",
  "subscriptionId": "sub-uuid",
  "rating": 5,
  "comment": "Excellente cuisine !"
}
```

> La commande doit avoir un status autre que `PENDING` (doit être confirmée ou plus).
> Un seul avis par commande.
> Les avis sont publiés après modération (`status: PENDING` → `APPROVED`).

**Réponses d'erreur :**
```json
{ "success": false, "message": "Un avis existe déjà pour cette commande", "error": { "code": "REVIEW_ALREADY_EXISTS" } }
{ "success": false, "message": "Vous ne pouvez donner un avis que sur une commande confirmée", "error": { "code": "INVALID_INPUT" } }
```

---

## PARTIE 6 — ABONNEMENTS ACTIFS

### GET /active-subscriptions/me — Mes abonnements actifs

**Accès :** auth (USER)

**Utilisation :** Afficher les abonnements actifs dans le profil utilisateur ou dashboard

**Réponse 200 ✅ :**
```json
{
  "success": true,
  "message": "Abonnements actifs récupérés",
  "data": [
    {
      "id": "active-sub-uuid",
      "userId": "user-uuid",
      "orderId": "order-uuid",
      "subscriptionId": "sub-uuid",
      "startedAt": "2026-04-15T08:00:00Z",
      "endsAt": "2026-04-22T08:00:00Z",
      "duration": "WORK_WEEK",
      "subscription": {
        "id": "sub-uuid",
        "name": "Abonnement Repas Africain",
        "category": "AFRICAN",
        "type": "LUNCH",
        "provider": {
          "id": "prov-uuid",
          "businessName": "Chez Mariam"
        }
      }
    }
  ]
}
```

---

### GET /active-subscriptions/check — Vérifier abonnement actif

**Accès :** auth (USER)

**Query params :**
- `category` : AFRICAN, EUROPEAN, etc. (optionnel)
- `type` : BREAKFAST, LUNCH, etc. (optionnel)

**Utilisation :** Vérifier si l'utilisateur a accès à certains contenus/fonctionnalités (ex: contenu premium, accès à des features)

**Exemples d'utilisation frontend :**
- Afficher un badge "Premium" si abonnement actif
- Débloquer des fonctionnalités spécifiques
- Personnaliser l'interface selon les abonnements

**Réponse 200 ✅ :**
```json
{
  "success": true,
  "data": {
    "hasActive": true
  }
}
```

**Exemple :** `GET /api/v1/active-subscriptions/check?category=AFRICAN&type=LUNCH`
- Retourne `true` si l'utilisateur a un abonnement africain pour le déjeuner actif

---

### GET /active-subscriptions/provider/me — Abonnements actifs de mes clients

**Accès :** auth (PROVIDER approuvé)

**Utilisation :** Dashboard provider pour voir tous les abonnements actifs de ses clients

**Réponse 200 ✅ :**
```json
{
  "success": true,
  "message": "Abonnements actifs récupérés",
  "data": [
    {
      "id": "active-sub-uuid",
      "userId": "user-uuid",
      "orderId": "order-uuid",
      "subscriptionId": "sub-uuid",
      "startedAt": "2026-04-15T08:00:00Z",
      "endsAt": "2026-04-22T08:00:00Z",
      "duration": "WORK_WEEK",
      "subscription": {
        "id": "sub-uuid",
        "name": "Abonnement Repas Africain",
        "category": "AFRICAN",
        "type": "LUNCH",
        "price": 25000,
        "provider": {
          "id": "prov-uuid",
          "businessName": "Chez Mariam"
        }
      },
      "user": {
        "id": "user-uuid",
        "name": "Jean Dupont",
        "email": "jean@example.com",
        "phone": "+22961111111"
      },
      "order": {
        "id": "order-uuid",
        "orderNumber": "JUNA-0001",
        "scheduledFor": "2026-04-15T08:00:00Z",
        "deliveryMethod": "PICKUP",
        "deliveryAddress": "Quartier Cadjehoun",
        "deliveryCity": "Cotonou"
      }
    }
  ]
}
```

**Utilisation frontend :**
- Afficher le nombre total d'abonnés actifs dans le dashboard
- Lister les clients actifs avec leurs détails
- Voir les dates d'expiration pour planifier les renouvellements
- Calculer les revenus actifs

---

### GET /active-subscriptions/stats — Statistiques (admin)

**Accès :** auth (ADMIN)

**Utilisation :** Dashboard admin pour voir les métriques des abonnements actifs

**Réponse 200 ✅ :**
```json
{
  "success": true,
  "data": {
    "activeSubscriptionsCount": 145
  }
}
```

---

### Flux complet : De la commande à l'abonnement actif

1. **Création de commande** → `POST /orders`
2. **Confirmation par provider** → Commande passe à `CONFIRMED`
3. **Activation par user** → `PUT /orders/:id/activate`
   - Déclenche la création automatique de l'abonnement actif
   - Paiement versé au provider
4. **Utilisation** → `GET /active-subscriptions/me` pour voir ses abonnements actifs
5. **Vérification** → `GET /active-subscriptions/check` pour contrôles d'accès

**Expiration automatique :** Les abonnements expirés sont supprimés automatiquement par un job cron.

---

## PARTIE 7 — DEVENIR PRESTATAIRE

### Notes importantes — questions fréquentes

**`deliveryZones.city` — champ informatif**
Valeur libre pour indiquer les zones desservies (`"Cotonou"`, `"Akpakpa"`…). Plus utilisé pour le calcul automatique des frais (négociation directe avec les clients). `country` = code ISO 2 lettres (`"BJ"`, `"CI"`…).

**`documentUrl` — optionnel, conseillé**
L'admin le voit dans la fiche du prestataire mais il n'y a pas de validation automatique. Inclure le champ dans le formulaire (upload via `POST /upload/documents`) en le rendant facultatif côté UX.

**`landmarkIds` — pour filtrage géographique**
Les landmarks servent à filtrer les prestataires dans `GET /home` (section `providers`) — seuls les prestataires avec au moins un landmark dans la ville demandée apparaissent. **Simplification MVP :** Pour le retrait, l'utilisateur récupère toujours à l'adresse principale du provider (`businessAddress`).

**Rôle après inscription — le `role` reste `USER` jusqu'à validation admin**
À la soumission de `POST /providers/register`, le rôle dans le JWT reste `USER`. C'est uniquement quand l'admin approuve que le rôle passe à `PROVIDER` en base. Le provider devra se **reconnecter** (ou faire `POST /auth/refresh`) après approbation pour obtenir un token avec `role: "PROVIDER"`. Prévoir un écran "En attente de validation" et inviter l'utilisateur à se reconnecter une fois approuvé.

**Notification approbation — pas de mécanisme automatique**
Aucun webhook ni email ni push déclenché à l'approbation pour l'instant. Le provider vérifie son statut via `GET /providers/me` → champ `status`. Implémenter un polling sur cette route ou un bouton "Vérifier le statut de ma demande".

---

### POST /providers/register

**Accès :** auth (USER avec compte existant)

**Body :**

| Champ | Type | Obligatoire | Contraintes |
|-------|------|-------------|-------------|
| `businessName` | string | ✅ | Min 2 caractères |
| `description` | string | ❌ | Description libre |
| `businessAddress` | string | ✅ | Min 3 caractères |
| `logo` | string (URL) | ✅ | URL Cloudinary (upload préalable via `POST /upload/providers`) |
| `cityId` | UUID v4 | ✅ | Ville principale de l'établissement |
| `acceptsDelivery` | boolean | ✅ | Propose la livraison |
| `acceptsPickup` | boolean | ✅ | Accepte le retrait sur place |
| `deliveryZones` | array | ❌* | Requis si `acceptsDelivery: true` |
| `landmarkIds` | UUID[] | ❌ | Points de retrait (landmarks enregistrés) |
| `documentUrl` | string (URL) | ❌ | Document justificatif |

> Au moins `acceptsDelivery` ou `acceptsPickup` doit être `true`.

**Format `deliveryZones` :**
```json
[
  { "city": "Cotonou", "country": "BJ", "cost": 500 },
  { "city": "Abomey-Calavi", "country": "BJ", "cost": 800 }
]
```

**Body complet exemple :**
```json
{
  "businessName": "Chez Mariam",
  "description": "Restaurant spécialisé en cuisine africaine traditionnelle",
  "businessAddress": "Rue 234, Quartier Cadjehoun",
  "logo": "https://res.cloudinary.com/...",
  "cityId": "city-uuid",
  "acceptsDelivery": true,
  "acceptsPickup": true,
  "deliveryZones": [
    { "city": "Cotonou", "country": "BJ", "cost": 500 }
  ],
  "landmarkIds": ["landmark-uuid-1", "landmark-uuid-2"],
  "documentUrl": "https://res.cloudinary.com/..."
}
```

**Réponse 201 ✅ :**
```json
{
  "success": true,
  "message": "Fournisseur enregistré avec succès",
  "data": {
    "id": "prov-uuid",
    "businessName": "Chez Mariam",
    "status": "PENDING",
    "message": "Votre demande a été enregistrée. En attente de validation par l'admin."
  }
}
```

**Réponse 409 ❌ :**
```json
{ "success": false, "message": "Vous êtes déjà enregistré comme fournisseur", "error": { "code": "PROVIDER_EXISTS" } }
```

---

## PARTIE 8 — DASHBOARD PROVIDER

> Tous les endpoints de cette section nécessitent `Authorization: Bearer {accessToken}` avec le rôle `PROVIDER` et un compte prestataire approuvé (`status: APPROVED`), sauf `GET /providers/me` et `PUT /providers/me` qui restent accessibles en `PENDING`.

---

### GET /providers/me — Profil provider

**Accès :** auth (PROVIDER)

**Réponse 200 ✅ :**
```json
{
  "success": true,
  "message": "Profil fournisseur récupéré avec succès",
  "data": {
    "id": "prov-uuid",
    "businessName": "Chez Mariam",
    "description": "Restaurant spécialisé...",
    "businessAddress": "Rue 234, Cadjehoun",
    "logo": "https://res.cloudinary.com/...",
    "status": "APPROVED",
    "acceptsDelivery": true,
    "acceptsPickup": true,
    "deliveryZones": [
      { "city": "Cotonou", "country": "BJ", "cost": 500 }
    ],
    "rating": 4.6,
    "totalReviews": 87,
    "city": {
      "id": "city-uuid",
      "name": "Cotonou",
      "country": { "code": "BJ", "translations": { "fr": "Bénin" } }
    },
    "landmarks": [
      { "landmark": { "id": "lm-uuid", "name": "Étoile Rouge", "cityId": "city-uuid" } }
    ],
    "subscriptions": [ /* liste des abonnements du provider */ ]
  }
}
```

> `status` : `PENDING` | `APPROVED` | `REJECTED` | `SUSPENDED`
> `description` peut être `null`.

---

### PUT /providers/me — Modifier profil provider

**Accès :** auth (PROVIDER)

**Body :** (tous les champs optionnels)

| Champ | Type | Contraintes |
|-------|------|-------------|
| `businessName` | string | Min 2 caractères |
| `description` | string | — |
| `businessAddress` | string | Min 3 caractères |
| `logo` | string (URL) | URL Cloudinary |
| `cityId` | UUID v4 | — |
| `acceptsDelivery` | boolean | — |
| `acceptsPickup` | boolean | — |
| `deliveryZones` | array | Requis si `acceptsDelivery: true` |
| `landmarkIds` | UUID[] | Remplace tous les landmarks existants |
| `documentUrl` | string (URL) | — |

---

### POST /subscriptions — Créer un abonnement

**Accès :** auth (PROVIDER approuvé)

**Body :**

| Champ | Type | Obligatoire | Contraintes |
|-------|------|-------------|-------------|
| `name` | string | ✅ | 3–100 caractères |
| `description` | string | ✅ | 10–1000 caractères |
| `price` | number | ✅ | Min 100 XOF |
| `type` | string | ✅ | Voir valeurs ci-dessous |
| `category` | string | ✅ | Voir valeurs ci-dessous |
| `duration` | string | ✅ | Voir valeurs ci-dessous |
| `imageUrl` | string (URL) | ✅ | URL Cloudinary (`POST /upload/subscriptions`) |
| `mealIds` | UUID[] | ✅ | Min 1 repas (doit exister dans `GET /meals/me`) |
| `isPublic` | boolean | ❌ | Défaut : `false` — publier manuellement |
| `isImmediate` | boolean | ❌ | Défaut : `true` — disponible immédiatement |
| `preparationHours` | number | ❌* | Requis si `isImmediate: false` |
| `junaCommissionPercent` | number | ❌ | Défaut : `10` (0–100) |

**Valeurs `type` :** `BREAKFAST` `LUNCH` `DINNER` `SNACK` `BREAKFAST_LUNCH` `BREAKFAST_DINNER` `LUNCH_DINNER` `FULL_DAY` `CUSTOM`

**Valeurs `category` :** `AFRICAN` `EUROPEAN` `ASIAN` `AMERICAN` `FUSION` `VEGETARIAN` `VEGAN` `HALAL` `OTHER`

**Valeurs `duration` :** `DAY` `THREE_DAYS` `WEEK` `TWO_WEEKS` `MONTH` `WORK_WEEK` `WORK_WEEK_2` `WORK_MONTH` `WEEKEND`

**Réponse 201 ✅ :**
```json
{
  "success": true,
  "message": "Abonnement créé avec succès",
  "data": {
    "id": "sub-uuid",
    "name": "Abonnement Repas Africain",
    "price": 25000,
    "type": "LUNCH",
    "category": "AFRICAN",
    "duration": "WORK_WEEK",
    "isActive": true,
    "isPublic": false,
    "createdAt": "2026-04-19T10:00:00Z"
  }
}
```

**Réponse 403 ❌ :**
```json
{ "success": false, "message": "Votre compte fournisseur doit être approuvé avant de créer des abonnements", "error": { "code": "PROVIDER_NOT_APPROVED" } }
```

---

### GET /subscriptions/me — Mes abonnements

**Accès :** auth (PROVIDER)

**Réponse 200 ✅ :**
```json
{
  "success": true,
  "data": [
    {
      "id": "sub-uuid",
      "name": "Abonnement Repas Africain",
      "price": 25000,
      "type": "LUNCH",
      "category": "AFRICAN",
      "duration": "WORK_WEEK",
      "isActive": true,
      "isPublic": true,
      "rating": 4.8,
      "totalReviews": 120,
      "subscriberCount": 45,
      "createdAt": "2026-04-01T10:00:00Z"
    }
  ]
}
```

---

### PUT /subscriptions/:id — Modifier un abonnement

**Accès :** auth (PROVIDER propriétaire)

**Body :** (tous les champs optionnels, mêmes contraintes que la création)

```json
{
  "name": "Nouveau nom",
  "price": 28000,
  "description": "Nouvelle description",
  "mealIds": ["meal-uuid-1", "meal-uuid-2"]
}
```

> Envoyer `mealIds` remplace entièrement la liste des repas associés.

---

### PUT /subscriptions/:id/toggle — Activer / désactiver

**Accès :** auth (PROVIDER propriétaire)

**Pas de body.** Inverse le statut `isActive` de l'abonnement.

**Réponse 200 ✅ :**
```json
{ "success": true, "message": "Statut de l'abonnement mis à jour", "data": { "id": "...", "isActive": false } }
```

---

### PUT /subscriptions/:id/public — Publier / dépublier

**Accès :** auth (PROVIDER propriétaire)

**Pas de body.** Inverse le statut `isPublic`. Un abonnement non public n'apparaît pas dans `GET /subscriptions` ni dans `/home`.

---

### DELETE /subscriptions/:id — Supprimer un abonnement

**Accès :** auth (PROVIDER propriétaire)

> Impossible si `subscriberCount > 0`.

**Réponse 409 ❌ :**
```json
{ "success": false, "message": "Impossible de supprimer un abonnement avec des abonnés", "error": { "code": "SUBSCRIPTION_IN_USE" } }
```

---

### POST /meals — Créer un plat

**Accès :** auth (PROVIDER)

**Body :**

| Champ | Type | Obligatoire | Contraintes |
|-------|------|-------------|-------------|
| `name` | string | ✅ | 2–100 caractères |
| `description` | string | ✅ | 5–500 caractères |
| `price` | number | ✅ | Min 100 XOF |
| `imageUrl` | string (URL) | ✅ | URL Cloudinary (`POST /upload/meals`) |
| `mealType` | string | ✅ | `BREAKFAST` `LUNCH` `DINNER` `SNACK` |

**Réponse 201 ✅ :**
```json
{
  "success": true,
  "message": "Repas créé avec succès",
  "data": {
    "id": "meal-uuid",
    "name": "Riz sauce graine",
    "description": "Riz basmati avec sauce graine maison...",
    "price": 2500,
    "imageUrl": "https://res.cloudinary.com/...",
    "mealType": "LUNCH",
    "isActive": true,
    "createdAt": "2026-04-19T10:00:00Z"
  }
}
```

---

### GET /meals/me — Mes plats

**Accès :** auth (PROVIDER)

**Réponse 200 ✅ :**
```json
{
  "success": true,
  "data": [
    {
      "id": "meal-uuid",
      "name": "Riz sauce graine",
      "price": 2500,
      "mealType": "LUNCH",
      "isActive": true,
      "imageUrl": "https://..."
    }
  ]
}
```

---

### PUT /meals/:id — Modifier un plat

**Accès :** auth (PROVIDER propriétaire)

**Body :** (tous les champs optionnels, mêmes contraintes que la création + `isActive: boolean`)

---

### PUT /meals/:id/toggle — Activer / désactiver un plat

**Accès :** auth (PROVIDER propriétaire)

**Pas de body.** Inverse `isActive`.

---

### DELETE /meals/:id — Supprimer un plat

**Accès :** auth (PROVIDER propriétaire)

---

### GET /orders/provider/me — Commandes reçues

**Accès :** auth (PROVIDER)

**Réponse 200 ✅ :**
```json
{
  "success": true,
  "data": [
    {
      "id": "order-uuid",
      "orderNumber": "JUNA-0001",
      "status": "PENDING",
      "amount": 25500,
      "deliveryMethod": "PICKUP",
      "scheduledFor": "2026-04-20T08:00:00Z",
      "qrCode": "JUNA-A1B2C3D4",
      "createdAt": "2026-04-19T10:00:00Z",
      "user": { "id": "user-uuid", "name": "Jean Dupont" },
      "subscription": { "id": "sub-uuid", "name": "Abonnement Repas Africain" }
    }
  ]
}
```

---

### PUT /orders/:id/activate — Activer une commande

**Accès :** auth (USER propriétaire)

**Pas de body.** L'utilisateur active sa commande pour déclencher le paiement au provider.

**Actions :**
- Passe la commande de `CONFIRMED` → `ACTIVE`
- Déclenche automatiquement le paiement au provider
- **Crée automatiquement l'abonnement actif** (voir `GET /active-subscriptions/me`)
- Génère/envoie une notification au provider

**Utilisation frontend :**
- Bouton "Activer mon abonnement" dans la page de confirmation de commande
- Après activation, rediriger vers le profil utilisateur ou afficher un message de succès
- Mettre à jour l'état local pour refléter l'abonnement actif
- Rafraîchir les données d'abonnements actifs avec `GET /active-subscriptions/me`

**Réponse 200 ✅ :**
```json
{
  "success": true,
  "message": "Commande activée avec succès",
  "data": {
    "id": "order-uuid",
    "status": "ACTIVE",
    "message": "Le paiement a été versé au prestataire. Vous pouvez maintenant récupérer votre commande."
  }
}
```

**Réponse 409 ❌ :**
```json
{ "success": false, "message": "Cette commande ne peut pas être activée", "error": { "code": "INVALID_INPUT" } }
```

---

### PUT /orders/:id/qrcode — Régénérer le QR code

**Accès :** auth (PROVIDER)

**Pas de body.** Génère un nouveau QR code pour la commande (en cas de perte).

**Réponse 200 ✅ :**
```json
{
  "success": true,
  "data": { "id": "order-uuid", "qrCode": "JUNA-E5F6G7H8" }
}
```

---

## Cycle de vie d'une commande

```
PENDING
  │
  ├── Annulation user/admin → CANCELLED
  │
  └── Confirmation provider
        │
        └── CONFIRMED
              │
              ├── Annulation user/admin → CANCELLED
              │
              └── Prêt provider
                    │
                    └── READY
                          │
                          └── Scan QR
                                │
                                ├── DELIVERY → DELIVERED
                                └── PICKUP  → COMPLETED
```

---

## Codes d'erreur

| Code | Status HTTP | Description |
|------|-------------|-------------|
| `INVALID_CREDENTIALS` | 401 | Email/mot de passe incorrect |
| `INVALID_TOKEN` | 401 | Token invalide ou expiré |
| `TOKEN_EXPIRED` | 401 | Refresh token expiré |
| `ACCOUNT_SUSPENDED` | 403 | Compte suspendu |
| `FORBIDDEN` | 403 | Action non autorisée |
| `INSUFFICIENT_PERMISSIONS` | 403 | Rôle insuffisant |
| `USER_NOT_FOUND` | 404 | Utilisateur introuvable |
| `PROVIDER_NOT_FOUND` | 404 | Prestataire introuvable |
| `SUBSCRIPTION_NOT_FOUND` | 404 | Abonnement introuvable |
| `ORDER_NOT_FOUND` | 404 | Commande introuvable |
| `RESOURCE_NOT_FOUND` | 404 | Ressource introuvable |
| `EMAIL_ALREADY_EXISTS` | 409 | Email déjà utilisé |
| `PHONE_ALREADY_EXISTS` | 409 | Téléphone déjà utilisé |
| `PROVIDER_EXISTS` | 409 | Déjà enregistré comme prestataire |
| `SUBSCRIPTION_ALREADY_EXISTS` | 409 | Abonnement avec ce nom existe déjà |
| `SUBSCRIPTION_IN_USE` | 409 | Abonnement avec des abonnés actifs |
| `REVIEW_ALREADY_EXISTS` | 409 | Avis déjà soumis pour cette commande |
| `ORDER_CANNOT_BE_CANCELLED` | 409 | Commande non annulable (trop avancée) |
| `QR_CODE_INVALID` | 400 | QR code incorrect |
| `QR_CODE_ALREADY_USED` | 409 | QR code déjà scanné |
| `PROVIDER_NOT_APPROVED` | 403 | Compte prestataire non approuvé |
| `INVALID_INPUT` | 400 | Données invalides (voir `message[]`) |
| `RATE_LIMIT_EXCEEDED` | 429 | Trop de requêtes (auth : 5/15min) |

---

*Pour la documentation mobile uniquement (parcours consommateur), voir `mobile-api-documentation.md`.*
*Pour la documentation du panel admin, voir `admin-api-documentation.md`.*
