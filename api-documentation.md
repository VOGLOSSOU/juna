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

## PARTIE 1 — AUTH

### POST /auth/register — Créer un compte

Crée un nouveau compte utilisateur. Le `phone` est optionnel à l'inscription mais **obligatoire pour accéder à l'app** (voir `isProfileComplete`).

**Body :**
```json
{
  "email": "kofi.mensah@gmail.com",     // requis — doit être unique
  "password": "Password123",            // requis — min 8 car., 1 majuscule, 1 chiffre
  "name": "Kofi Mensah",               // requis — min 2 caractères
  "phone": "+22961111111"              // optionnel — doit être unique si fourni
}
```

**Réponse 201 ✅ — TEST 1.1 :**
```json
{
  "success": true,
  "message": "Compte créé avec succès",
  "data": {
    "user": {
      "id": "3928ed13-1887-4e27-b498-6246123218ab",
      "email": "kofi.mensah@gmail.com",
      "name": "Kofi Mensah",
      "phone": "+22961111111",
      "role": "USER",
      "isVerified": false,
      "isActive": true,
      "createdAt": "2026-03-28T17:06:35.443Z",
      "updatedAt": "2026-03-28T17:06:35.443Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    },
    "isProfileComplete": true
  }
}
```

> **`isProfileComplete`** — flag critique pour l'app mobile :
> - `true` → le numéro de téléphone est renseigné, l'user a accès complet à l'app
> - `false` → le numéro est manquant, **afficher obligatoirement l'écran de complétion de profil** avant tout accès. L'user ne peut pas bypasser cet écran.

> **`role`** — détermine les permissions de l'user :
> - `USER` → client standard
> - `PROVIDER` → prestataire approuvé (après candidature validée par l'admin)
> - `ADMIN` / `SUPER_ADMIN` → administration

> **`isVerified`** — indique si l'email a été vérifié. Pour l'instant `false` par défaut. La vérification par email sera implémentée ultérieurement.

**Réponse 409 ❌ — Email déjà utilisé (TEST 1.4) :**
```json
{
  "success": false,
  "message": "Cet email est déjà utilisé",
  "error": {
    "code": "EMAIL_ALREADY_EXISTS"
  }
}
```

**Codes d'erreur possibles :**
| Code | HTTP | Description |
|------|------|-------------|
| `EMAIL_ALREADY_EXISTS` | 409 | Email déjà utilisé par un autre compte |
| `PHONE_ALREADY_EXISTS` | 409 | Numéro de téléphone déjà utilisé |
| `VALIDATION_ERROR` | 400 | Données invalides (format email, mot de passe trop faible, etc.) |

---

### POST /auth/login — Se connecter

**Body :**
```json
{
  "email": "kofi.mensah@gmail.com",   // requis
  "password": "Password123"           // requis
}
```

**Réponse 200 ✅ — TEST 1.5 :**
```json
{
  "success": true,
  "message": "Connexion réussie",
  "data": {
    "user": {
      "id": "3928ed13-1887-4e27-b498-6246123218ab",
      "email": "kofi.mensah@gmail.com",
      "name": "Kofi Mensah",
      "phone": "+22961111111",
      "role": "USER",
      "isVerified": false,
      "isActive": true,
      "createdAt": "2026-03-28T17:06:35.443Z",
      "updatedAt": "2026-03-28T17:06:35.443Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    },
    "isProfileComplete": true
  }
}
```

> **Gestion des tokens côté app mobile :**
> - Stocker le `accessToken` en mémoire (ou secure storage) — utilisé dans le header `Authorization: Bearer {accessToken}` de chaque requête protégée
> - Stocker le `refreshToken` en secure storage — utilisé pour renouveler le `accessToken` quand il expire (toutes les 15 minutes)
> - Vérifier `isProfileComplete` à chaque login — si `false`, rediriger vers l'écran de complétion de profil avant tout

**Réponse 401 ❌ — Mauvais mot de passe (TEST 1.8) :**
```json
{
  "success": false,
  "message": "Email ou mot de passe incorrect",
  "error": {
    "code": "INVALID_CREDENTIALS"
  }
}
```

> Note de sécurité : le message d'erreur est volontairement identique que ce soit l'email ou le mot de passe qui soit incorrect — pour ne pas indiquer à un attaquant si un email existe en base.

**Codes d'erreur possibles :**
| Code | HTTP | Description |
|------|------|-------------|
| `INVALID_CREDENTIALS` | 401 | Email ou mot de passe incorrect |
| `ACCOUNT_SUSPENDED` | 403 | Compte suspendu ou banni |
| `VALIDATION_ERROR` | 400 | Format des données invalide |

---

## PARTIE 2 — LOCALISATION USER

### PUT /users/me/location — Définir/mettre à jour la localisation

Endpoint appelé par l'app mobile à chaque démarrage pour enregistrer la position de l'user. L'app récupère la ville et le pays via le GPS du téléphone puis affiche un écran de confirmation à l'user avant d'appeler cet endpoint.

> **Quand appeler cet endpoint :**
> 1. Au premier lancement de l'app après connexion
> 2. À chaque démarrage si le GPS est activé et que la position a changé
> 3. Quand l'user modifie manuellement sa ville depuis les paramètres

**Headers requis :** `Authorization: Bearer {accessToken}`

**Body :**
```json
{
  "city": "Cotonou",      // requis — min 2 caractères
  "country": "BJ",        // requis — code ISO 2 lettres OBLIGATOIREMENT (ex: BJ, TG, CI, SN)
  "latitude": 6.3703,     // optionnel — coordonnées GPS
  "longitude": 2.3912     // optionnel — coordonnées GPS
}
```

> **Format du code pays :** toujours 2 lettres majuscules selon la norme ISO 3166-1 alpha-2.
> Exemples : `BJ` (Bénin), `TG` (Togo), `CI` (Côte d'Ivoire), `SN` (Sénégal), `NG` (Nigeria), `GH` (Ghana), `CM` (Cameroun)

**Réponse 200 ✅ — TEST 2.1 (Cotonou, BJ) :**
```json
{
  "success": true,
  "message": "Localisation mise à jour avec succès",
  "data": {
    "city": "Cotonou",
    "country": "BJ",
    "latitude": 6.3703,
    "longitude": 2.3912
  }
}
```

**Réponse 200 ✅ — TEST 2.2 (Lomé, TG) :**
```json
{
  "success": true,
  "message": "Localisation mise à jour avec succès",
  "data": {
    "city": "Lomé",
    "country": "TG",
    "latitude": 6.1375,
    "longitude": 1.2123
  }
}
```

**Réponse 400 ❌ — Code pays invalide (TEST 2.3) :**
```json
{
  "success": false,
  "message": "Validation failed: [{\"field\":\"country\",\"message\":\"Le code pays doit être en format ISO 2 lettres (ex: BJ)\"}]",
  "error": {
    "code": "VALIDATION_ERROR"
  }
}
```

**Réponse 401 ❌ — Sans token (TEST 2.4) :**
```json
{
  "success": false,
  "message": "Token manquant",
  "error": {
    "code": "UNAUTHORIZED"
  }
}
```

> **Utilisation de la localisation dans l'app :**
> Une fois enregistrée, cette valeur est utilisée pour filtrer les abonnements disponibles dans la ville de l'user (voir `GET /subscriptions?city=Cotonou&country=BJ`). C'est grâce à ça que l'user voit uniquement les prestataires proches de lui sur la page d'accueil.

**Codes d'erreur possibles :**
| Code | HTTP | Description |
|------|------|-------------|
| `VALIDATION_ERROR` | 400 | `country` invalide (pas 2 lettres ISO), `city` trop courte |
| `UNAUTHORIZED` | 401 | Token manquant ou expiré |
| `USER_NOT_FOUND` | 404 | Utilisateur introuvable |

---

## PARTIE 3 — PROFIL USER

### GET /users/me — Voir son profil

Retourne le profil complet de l'user connecté, incluant les infos de base et son profil détaillé (localisation, avatar, adresse, préférences).

**Headers requis :** `Authorization: Bearer {accessToken}`

**Réponse 200 ✅ — TEST 3.1 :**
```json
{
  "success": true,
  "message": "Profil récupéré avec succès",
  "data": {
    "id": "3928ed13-1887-4e27-b498-6246123218ab",
    "email": "kofi.mensah@gmail.com",
    "name": "Kofi Mensah",
    "phone": "+22961111111",
    "role": "USER",
    "isVerified": false,
    "isActive": true,
    "createdAt": "2026-03-28T17:06:35.443Z",
    "profile": {
      "avatar": null,          // null jusqu'à ce que l'user uploade une photo
      "address": null,         // adresse textuelle libre (ex: "Quartier Cadjehoun")
      "city": "Cotonou",       // définie via PUT /users/me/location
      "country": "BJ",         // code ISO 2 lettres
      "latitude": 6.3703,      // coordonnées GPS — null si non renseignées
      "longitude": 2.3912,
      "preferences": null      // préférences alimentaires — voir PUT /users/me/preferences
    }
  }
}
```

> **Structure du profil :**
> - Les champs du `profile` sont tous optionnels sauf `city` et `country` qui sont définis via `PUT /users/me/location`
> - `avatar` : URL Cloudinary de la photo de profil — `null` par défaut. Uploader d'abord via `POST /upload/avatars`, puis mettre à jour ici
> - `preferences` : objet JSON pour stocker les restrictions alimentaires, catégories favorites, préférences de notifications — géré via `PUT /users/me/preferences`

---

### PUT /users/me — Mettre à jour son profil

Permet de modifier le nom, le téléphone et/ou l'adresse. Tous les champs sont optionnels — envoyer uniquement ce qui doit être modifié.

**Headers requis :** `Authorization: Bearer {accessToken}`

**Body (tous les champs sont optionnels) :**
```json
{
  "name": "Kofi Mensah Junior",            // optionnel — min 2 caractères
  "phone": "+22961111112",                 // optionnel — doit être unique
  "address": "Quartier Cadjehoun, Cotonou" // optionnel — adresse textuelle libre
}
```

**Réponse 200 ✅ — TEST 3.2 :**
```json
{
  "success": true,
  "message": "Profil mis à jour avec succès",
  "data": {
    "id": "3928ed13-1887-4e27-b498-6246123218ab",
    "email": "kofi.mensah@gmail.com",
    "name": "Kofi Mensah Junior",
    "phone": "+22961111111",
    "role": "USER",
    "isVerified": false,
    "isActive": true,
    "createdAt": "2026-03-28T17:06:35.443Z",
    "profile": {
      "avatar": null,
      "address": "Quartier Cadjehoun, Cotonou",
      "city": "Cotonou",
      "country": "BJ",
      "latitude": 6.3703,
      "longitude": 2.3912,
      "preferences": null
    }
  }
}
```

**Codes d'erreur possibles :**
| Code | HTTP | Description |
|------|------|-------------|
| `UNAUTHORIZED` | 401 | Token manquant ou expiré |
| `PHONE_ALREADY_EXISTS` | 409 | Numéro de téléphone déjà utilisé par un autre compte |
| `VALIDATION_ERROR` | 400 | Données invalides |

---

## PARTIE 4 — ADMIN

> **Accès réservé :** tous les endpoints `/admin/*` nécessitent un token avec `role: ADMIN` ou `role: SUPER_ADMIN`. Un token USER ou PROVIDER retournera une erreur 403.

> **Compte admin par défaut :** créé via `npx ts-node prisma/seed.ts`. Email : `admin@juna.app`, mot de passe : `ChangeMe123!`. À changer en production via les variables d'env `ADMIN_EMAIL` et `ADMIN_PASSWORD`.

### POST /auth/login — Connexion admin

L'admin se connecte via le même endpoint que les users. Le `role` dans la réponse permet à l'app de détecter qu'il s'agit d'un admin et de l'orienter vers l'interface d'administration.

**Réponse 200 ✅ — TEST 4.1 :**
```json
{
  "success": true,
  "message": "Connexion réussie",
  "data": {
    "user": {
      "id": "921fed65-cf15-4cf6-a1ca-d208982ce48f",
      "email": "admin@juna.app",
      "name": "Administrateur JUNA",
      "phone": "+22900000000",
      "role": "ADMIN",
      "isVerified": true,
      "isActive": true,
      "createdAt": "2026-03-28T16:55:17.594Z",
      "updatedAt": "2026-03-28T16:55:17.594Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    },
    "isProfileComplete": true
  }
}
```

> **Gestion côté app :** vérifier le champ `role` après chaque login. Si `role === "ADMIN"` ou `role === "SUPER_ADMIN"`, rediriger vers l'interface admin. Les rôles possibles sont : `USER`, `PROVIDER`, `ADMIN`, `SUPER_ADMIN`.

---

### GET /admin/dashboard — Tableau de bord

Retourne une vue d'ensemble des métriques clés de la plateforme.

**Headers requis :** `Authorization: Bearer {adminToken}`

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

> **Champs `overview` :**
> - `totalUsers` : nombre total de comptes inscrits (tous rôles confondus, admin inclus)
> - `totalProviders` : providers dont le statut est `APPROVED`
> - `pendingProviders` : candidatures en attente de validation
> - `totalOrders` / `completedOrders` / `pendingOrders` : statistiques commandes
> - `totalRevenue` : revenus totaux — `0` tant que le paiement n'est pas implémenté

> **Champs `charts` :**
> - `ordersByDay` : évolution des commandes par jour (vide si aucune commande récente)
> - `subscriptionsByCategory` : répartition des abonnements par catégorie culinaire

---

### GET /admin/users — Lister tous les utilisateurs

Retourne tous les comptes de la plateforme, triés du plus récent au plus ancien.

**Headers requis :** `Authorization: Bearer {adminToken}`

**Réponse 200 ✅ — TEST 4.3 :**
```json
{
  "success": true,
  "data": [
    {
      "id": "bf58c88a-632d-4116-9a4e-9f8afe9079b6",
      "email": "sena.akpovi@gmail.com",
      "name": "Sena Akpovi",
      "phone": "+22963333333",
      "role": "USER",
      "isVerified": false,
      "isActive": true,
      "createdAt": "2026-03-28T17:13:33.028Z"
    },
    {
      "id": "827786ab-6518-403d-a32c-b51ac643e288",
      "email": "mariam.diallo@gmail.com",
      "name": "Mariam Diallo",
      "phone": "+22962222222",
      "role": "USER",
      "isVerified": false,
      "isActive": true,
      "createdAt": "2026-03-28T17:13:07.286Z"
    },
    {
      "id": "3928ed13-1887-4e27-b498-6246123218ab",
      "email": "kofi.mensah@gmail.com",
      "name": "Kofi Mensah Junior",
      "phone": "+22961111111",
      "role": "USER",
      "isVerified": false,
      "isActive": true,
      "createdAt": "2026-03-28T17:06:35.443Z"
    },
    {
      "id": "921fed65-cf15-4cf6-a1ca-d208982ce48f",
      "email": "admin@juna.app",
      "name": "Administrateur JUNA",
      "phone": "+22900000000",
      "role": "ADMIN",
      "isVerified": true,
      "isActive": true,
      "createdAt": "2026-03-28T16:55:17.594Z"
    }
  ]
}
```

> **Utilisation :** permet à l'admin de consulter tous les comptes, vérifier les rôles, et identifier les users à suspendre si nécessaire. Le champ `isActive: false` indique un compte suspendu — ces users ne peuvent plus se connecter (erreur `ACCOUNT_SUSPENDED`).

---

### GET /admin/providers/pending — Candidatures en attente

Retourne la liste des prestataires qui ont soumis une candidature et attendent validation.

**Headers requis :** `Authorization: Bearer {adminToken}`

**Réponse 200 ✅ — TEST 4.4 (aucune candidature pour l'instant) :**
```json
{
  "success": true,
  "message": "Fournisseurs en attente",
  "data": []
}
```

> Cet endpoint sera utilisé dans le flux de validation (Partie 5) : après qu'un user soumet sa candidature provider via `POST /providers/register`, elle apparaît ici avec le statut `PENDING`. L'admin peut ensuite approuver ou rejeter via les endpoints dédiés.

---

## PARTIE 5 — CANDIDATURE PROVIDER

Le flux complet pour qu'un user devienne provider se déroule en 3 étapes :
1. **L'user uploade son logo** via `POST /upload/providers` → récupère une URL Cloudinary
2. **L'user soumet sa candidature** via `POST /providers/register` avec le logo et toutes les infos
3. **L'admin valide** via `PUT /admin/providers/:id/approve` → le rôle de l'user passe de `USER` à `PROVIDER`

---

### POST /providers/register — Soumettre une candidature

**Headers requis :** `Authorization: Bearer {accessToken}` (rôle USER)

**Body :**
```json
{
  "businessName": "Chez Mariam",                           // requis — min 2 caractères
  "description": "Cuisine africaine authentique...",        // optionnel
  "businessAddress": "Rue du Port, Quartier Gbeto...",     // requis — min 3 caractères
  "logo": "https://res.cloudinary.com/...",                // requis — URL valide (upload préalable via POST /upload/providers)
  "city": "Cotonou",                                        // requis — min 2 caractères
  "country": "BJ",                                          // requis — code ISO 2 lettres
  "acceptsDelivery": true,                                  // requis — true/false
  "acceptsPickup": true,                                    // requis — true/false
  "deliveryZones": [                                        // requis si acceptsDelivery=true
    { "city": "Cotonou", "country": "BJ", "cost": 500 },
    { "city": "Abomey-Calavi", "country": "BJ", "cost": 800 },
    { "city": "Ouidah", "country": "BJ", "cost": 1500 }
  ]
}
```

> **Règles de validation :**
> - Au moins un mode de réception doit être activé (`acceptsDelivery` ou `acceptsPickup` à `true`)
> - Si `acceptsDelivery: true`, le tableau `deliveryZones` doit contenir au moins une zone
> - Le `logo` est **obligatoire** — uploader d'abord via `POST /upload/providers`, puis inclure l'URL ici
> - Le `cost` dans `deliveryZones` représente le coût de livraison **par jour** d'abonnement. Le coût total sera calculé à la commande : `cost × nombre_de_jours`

**Réponse 201 ✅ — TEST 5.1 :**
```json
{
  "success": true,
  "message": "Demande soumise, en attente de validation",
  "data": {
    "id": "673b79e0-25a7-4511-92a5-8ac2c2ad4ff4",
    "businessName": "Chez Mariam",
    "status": "PENDING",
    "message": "Votre demande a ete enregistree. En attente de validation par l'admin."
  }
}
```

> La candidature est créée avec le statut `PENDING`. L'user reste avec le rôle `USER` jusqu'à validation de l'admin. Son token actuel ne change pas — il devra se reconnecter après approbation pour obtenir un token avec le rôle `PROVIDER`.

**Réponse 400 ❌ — Logo manquant (TEST 5.2) :**
```json
{
  "success": false,
  "message": "Validation failed: [{\"field\":\"logo\",\"message\":\"Required\"}]",
  "error": {
    "code": "VALIDATION_ERROR"
  }
}
```

**Réponse 400 ❌ — Aucun mode de réception (TEST 5.3) :**
```json
{
  "success": false,
  "message": "Validation failed: [{\"field\":\"\",\"message\":\"Vous devez proposer au moins un mode de réception (livraison ou retrait sur place)\"}]",
  "error": {
    "code": "VALIDATION_ERROR"
  }
}
```

**Réponse 400 ❌ — Livraison activée sans zones (TEST 5.4) :**
```json
{
  "success": false,
  "message": "Validation failed: [{\"field\":\"\",\"message\":\"Vous devez définir au moins une zone de livraison si vous proposez la livraison\"}]",
  "error": {
    "code": "VALIDATION_ERROR"
  }
}
```

**Codes d'erreur possibles :**
| Code | HTTP | Description |
|------|------|-------------|
| `VALIDATION_ERROR` | 400 | Logo manquant, mode manquant, zones manquantes, données invalides |
| `UNAUTHORIZED` | 401 | Token manquant ou expiré |
| `PROVIDER_ALREADY_EXISTS` | 409 | Cet user a déjà soumis une candidature |

---

### GET /admin/providers/pending — Candidatures après soumission

Après soumission, la candidature apparaît ici avec toutes les infos nécessaires à l'admin pour prendre sa décision.

**Réponse 200 ✅ — TEST 5.5 :**
```json
{
  "success": true,
  "message": "Fournisseurs en attente",
  "data": [
    {
      "id": "673b79e0-25a7-4511-92a5-8ac2c2ad4ff4",
      "businessName": "Chez Mariam",
      "description": "Cuisine africaine authentique, faite maison avec des produits frais du marché.",
      "businessAddress": "Rue du Port, Quartier Gbeto, face à la pharmacie centrale",
      "logo": "https://res.cloudinary.com/dm9561wpm/image/upload/v1/juna/providers/logo_test.jpg",
      "city": "Cotonou",
      "country": "BJ",
      "acceptsDelivery": true,
      "acceptsPickup": true,
      "deliveryZones": [
        { "city": "Cotonou", "cost": 500, "country": "BJ" },
        { "city": "Abomey-Calavi", "cost": 800, "country": "BJ" },
        { "city": "Ouidah", "cost": 1500, "country": "BJ" }
      ],
      "documentUrl": null,
      "status": "PENDING",
      "rating": 0,
      "totalReviews": 0,
      "createdAt": "2026-03-28T17:29:57.680Z"
    }
  ]
}
```

---

### GET /admin/providers/:id — Détails complets d'un provider

Retourne toutes les informations du provider **plus les infos du compte user associé** — permet à l'admin de voir qui est derrière la candidature.

**Headers requis :** `Authorization: Bearer {adminToken}`

**Réponse 200 ✅ — TEST 5.6 :**
```json
{
  "success": true,
  "data": {
    "id": "673b79e0-25a7-4511-92a5-8ac2c2ad4ff4",
    "businessName": "Chez Mariam",
    "description": "Cuisine africaine authentique, faite maison avec des produits frais du marché.",
    "businessAddress": "Rue du Port, Quartier Gbeto, face à la pharmacie centrale",
    "logo": "https://res.cloudinary.com/dm9561wpm/image/upload/v1/juna/providers/logo_test.jpg",
    "city": "Cotonou",
    "country": "BJ",
    "acceptsDelivery": true,
    "acceptsPickup": true,
    "deliveryZones": [
      { "city": "Cotonou", "cost": 500, "country": "BJ" },
      { "city": "Abomey-Calavi", "cost": 800, "country": "BJ" },
      { "city": "Ouidah", "cost": 1500, "country": "BJ" }
    ],
    "documentUrl": null,
    "status": "PENDING",
    "rating": 0,
    "totalReviews": 0,
    "createdAt": "2026-03-28T17:29:57.680Z",
    "user": {
      "id": "827786ab-6518-403d-a32c-b51ac643e288",
      "email": "mariam.diallo@gmail.com",
      "name": "Mariam Diallo"
    }
  }
}
```

> **Différence avec `GET /admin/providers/pending` :** cet endpoint retourne un seul provider identifié par son `id`, et inclut le champ `user` avec les informations du compte associé. L'admin peut ainsi vérifier l'identité du candidat avant de valider.

---

### PUT /admin/providers/:id/approve — Approuver une candidature

**Headers requis :** `Authorization: Bearer {adminToken}`

**Body :**
```json
{
  "message": "Dossier complet, bienvenue sur Juna !"  // optionnel — message pour le provider
}
```

**Réponse 200 ✅ — TEST 5.7 :**
```json
{
  "success": true,
  "message": "Fournisseur approuve avec succes",
  "data": {
    "success": true,
    "message": "Dossier complet, bienvenue sur Juna !",
    "provider": {
      "id": "673b79e0-25a7-4511-92a5-8ac2c2ad4ff4",
      "businessName": "Chez Mariam",
      "status": "APPROVED"
    }
  }
}
```

> **Ce qui se passe en arrière-plan :**
> 1. Le statut du provider passe de `PENDING` à `APPROVED`
> 2. Le rôle de l'user associé passe de `USER` à `PROVIDER`
> 3. L'user doit **se reconnecter** pour obtenir un nouveau token avec le rôle `PROVIDER` — son token actuel reste `USER` jusqu'à expiration

---

### POST /auth/login — Reconnexion après approbation (TEST 5.8)

Après approbation par l'admin, Mariam se reconnecte. Le `role` dans la réponse est maintenant `PROVIDER`.

**Réponse 200 ✅ — TEST 5.8 :**
```json
{
  "success": true,
  "message": "Connexion réussie",
  "data": {
    "user": {
      "id": "827786ab-6518-403d-a32c-b51ac643e288",
      "email": "mariam.diallo@gmail.com",
      "name": "Mariam Diallo",
      "phone": "+22962222222",
      "role": "PROVIDER",
      "isVerified": false,
      "isActive": true,
      "createdAt": "2026-03-28T17:13:07.286Z",
      "updatedAt": "2026-03-28T17:36:33.332Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    },
    "isProfileComplete": true
  }
}
```

> Le champ `updatedAt` a changé par rapport à `createdAt` — c'est le moment où l'admin a approuvé la candidature et mis à jour le rôle. C'est le seul indicateur visible côté login que quelque chose a changé sur le compte.

---

### GET /providers/me — Voir son profil provider

Retourne le profil complet du provider connecté, incluant les zones de livraison, le statut et la liste de ses abonnements.

**Headers requis :** `Authorization: Bearer {providerToken}` (rôle PROVIDER)

**Réponse 200 ✅ — TEST 5.9 :**
```json
{
  "success": true,
  "message": "Profil fournisseur recupere avec succes",
  "data": {
    "id": "673b79e0-25a7-4511-92a5-8ac2c2ad4ff4",
    "businessName": "Chez Mariam",
    "description": "Cuisine africaine authentique, faite maison avec des produits frais du marché.",
    "businessAddress": "Rue du Port, Quartier Gbeto, face à la pharmacie centrale",
    "logo": "https://res.cloudinary.com/dm9561wpm/image/upload/v1/juna/providers/logo_test.jpg",
    "city": "Cotonou",
    "country": "BJ",
    "acceptsDelivery": true,
    "acceptsPickup": true,
    "deliveryZones": [
      { "city": "Cotonou", "cost": 500, "country": "BJ" },
      { "city": "Abomey-Calavi", "cost": 800, "country": "BJ" },
      { "city": "Ouidah", "cost": 1500, "country": "BJ" }
    ],
    "documentUrl": null,
    "status": "APPROVED",
    "rating": 0,
    "totalReviews": 0,
    "createdAt": "2026-03-28T17:29:57.680Z",
    "subscriptions": []
  }
}
```

> **Champs notables :**
> - `status: "APPROVED"` — le provider est actif et visible par les users
> - `subscriptions: []` — aucun abonnement créé pour l'instant. La liste se remplira après création via `POST /subscriptions`
> - `rating` et `totalReviews` — initialisés à `0`, mis à jour via le système de notation (non encore implémenté)
> - `documentUrl` — optionnel, pour attacher un document justificatif (RCCM, etc.)

---

## PARTIE 6 — GESTION DES REPAS (PROVIDER)

Les repas sont les plats proposés par le provider. Ils seront ensuite associés à des abonnements. Un repas appartient toujours à un seul provider — le `providerId` est automatiquement extrait du token, pas besoin de l'envoyer dans le body.

### POST /meals — Créer un repas

**Headers requis :** `Authorization: Bearer {providerToken}` (rôle PROVIDER)

**Body :**
```json
{
  "name": "Bouillie de mil avec beignets",   // requis — min 2 caractères
  "description": "Bouillie de mil sucrée...", // requis
  "price": 800,                               // requis — prix en FCFA
  "mealType": "BREAKFAST",                    // requis — voir types ci-dessous
  "imageUrl": "https://..."                   // optionnel — URL de la photo du plat
}
```

> **Types de repas (`mealType`) :**
> - `BREAKFAST` — petit-déjeuner
> - `LUNCH` — déjeuner
> - `DINNER` — dîner
> - `SNACK` — collation

**Réponse 201 ✅ — TEST 6.1 (petit-déjeuner) :**
```json
{
  "success": true,
  "message": "Repas créé avec succès",
  "data": {
    "id": "7c55e8ac-d08a-4bca-a05a-30aa470bfc4e",
    "providerId": "673b79e0-25a7-4511-92a5-8ac2c2ad4ff4",
    "name": "Bouillie de mil avec beignets",
    "description": "Bouillie de mil sucrée servie avec beignets frits dorés",
    "price": 800,
    "imageUrl": "https://images.unsplash.com/photo-1547592180-85f173990554",
    "mealType": "BREAKFAST",
    "isActive": true,
    "createdAt": "2026-03-28T18:23:04.016Z",
    "updatedAt": "2026-03-28T18:23:04.016Z"
  }
}
```

> **`isActive`** — par défaut `true`. Un repas inactif n'apparaît plus dans les abonnements mais les commandes existantes qui l'incluent ne sont pas affectées.

Les tests 6.2 et 6.3 ont créé les deux autres repas avec les mêmes champs :
- **TEST 6.2** — `id: b0b6b8bd-4053-47ae-9dfe-593d1182e03b` — Riz sauce graine + poisson — `LUNCH` — 1500 FCFA
- **TEST 6.3** — `id: 8aa1f0c4-6851-46dc-9394-1d96d96e6652` — Pâte de maïs sauce gombo — `DINNER` — 1200 FCFA

---

### GET /meals/me — Lister ses propres repas

Retourne tous les repas créés par le provider connecté, triés du plus récent au plus ancien.

**Headers requis :** `Authorization: Bearer {providerToken}`

**Réponse 200 ✅ — TEST 6.4 :**
```json
{
  "success": true,
  "message": "Repas récupérés avec succès",
  "data": [
    {
      "id": "8aa1f0c4-6851-46dc-9394-1d96d96e6652",
      "providerId": "673b79e0-25a7-4511-92a5-8ac2c2ad4ff4",
      "name": "Pâte de maïs sauce gombo",
      "description": "Pâte de maïs fraîche accompagnée de sauce gombo au poulet",
      "price": 1200,
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836",
      "mealType": "DINNER",
      "isActive": true,
      "createdAt": "2026-03-28T18:23:57.780Z",
      "updatedAt": "2026-03-28T18:23:57.780Z"
    },
    {
      "id": "b0b6b8bd-4053-47ae-9dfe-593d1182e03b",
      "providerId": "673b79e0-25a7-4511-92a5-8ac2c2ad4ff4",
      "name": "Riz sauce graine + poisson",
      "description": "Riz blanc avec sauce graine maison et poisson grillé",
      "price": 1500,
      "imageUrl": "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445",
      "mealType": "LUNCH",
      "isActive": true,
      "createdAt": "2026-03-28T18:23:33.359Z",
      "updatedAt": "2026-03-28T18:23:33.359Z"
    },
    {
      "id": "7c55e8ac-d08a-4bca-a05a-30aa470bfc4e",
      "providerId": "673b79e0-25a7-4511-92a5-8ac2c2ad4ff4",
      "name": "Bouillie de mil avec beignets",
      "description": "Bouillie de mil sucrée servie avec beignets frits dorés",
      "price": 800,
      "imageUrl": "https://images.unsplash.com/photo-1547592180-85f173990554",
      "mealType": "BREAKFAST",
      "isActive": true,
      "createdAt": "2026-03-28T18:23:04.016Z",
      "updatedAt": "2026-03-28T18:23:04.016Z"
    }
  ]
}
```

**Codes d'erreur possibles :**
| Code | HTTP | Description |
|------|------|-------------|
| `UNAUTHORIZED` | 401 | Token manquant ou expiré |
| `FORBIDDEN` | 403 | Token non PROVIDER |
| `VALIDATION_ERROR` | 400 | Données invalides (prix négatif, mealType inconnu, etc.) |

---

## PARTIE 7 — CRÉATION D'ABONNEMENTS (PROVIDER)

Un abonnement est une offre commerciale du provider : il regroupe des repas, une durée, un prix et des conditions de disponibilité. C'est ce que les users voient et achètent.

### POST /subscriptions — Créer un abonnement

**Headers requis :** `Authorization: Bearer {providerToken}` (rôle PROVIDER)

**Body :**
```json
{
  "name": "Formule Semaine Africaine",     // requis
  "description": "...",                    // requis
  "price": 25000,                          // requis — prix total en FCFA
  "junaCommissionPercent": 10,             // optionnel — % commission JUNA (défaut: 0)
  "type": "FULL_DAY",                      // requis — BREAKFAST | LUNCH | DINNER | FULL_DAY
  "category": "AFRICAN",                   // requis — catégorie culinaire
  "duration": "WORK_WEEK",                 // requis — durée de l'abonnement
  "isPublic": true,                        // optionnel — visible par les users (défaut: true)
  "isImmediate": false,                    // requis — true = dispo immédiatement, false = délai de préparation
  "preparationHours": 24,                  // requis si isImmediate=false — délai en heures avant le premier repas
  "imageUrl": "https://...",               // optionnel
  "mealIds": ["<uuid>", "<uuid>", "<uuid>"] // requis — IDs des repas inclus (doivent appartenir au provider)
}
```

> **Durées disponibles (`duration`) :**
> | Valeur | Jours couverts | Description |
> |--------|----------------|-------------|
> | `DAY` | 1 | Une journée |
> | `THREE_DAYS` | 3 | 3 jours |
> | `WORK_WEEK` | 5 | Semaine de travail (lun-ven) |
> | `WEEK` | 7 | Une semaine complète |
> | `TWO_WEEKS` | 14 | Deux semaines |
> | `WORK_WEEK_2` | 10 | Deux semaines de travail |
> | `WORK_MONTH` | 20 | Mois de travail |
> | `MONTH` | 30 | Un mois |
> | `WEEKEND` | 2 | Week-end |

> **`isImmediate` et `preparationHours` :**
> - `isImmediate: true` → l'abonnement peut démarrer immédiatement après commande. `preparationHours` est automatiquement mis à `0`
> - `isImmediate: false` → le provider a besoin d'un délai avant de commencer. `preparationHours` est obligatoire et doit être > 0
> - Ce délai impacte le calcul de `scheduledFor` à la commande : date de début = maintenant + `preparationHours`

**Réponse 201 ✅ — TEST 7.1 (`isImmediate: false`, 24h de délai) :**
```json
{
  "success": true,
  "message": "Abonnement créé avec succès",
  "data": {
    "id": "5a4fc4e7-84f0-4403-b1c2-34f67ef35821",
    "providerId": "673b79e0-25a7-4511-92a5-8ac2c2ad4ff4",
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
    "deliveryZones": null,
    "pickupLocations": null,
    "imageUrl": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1",
    "subscriberCount": 0,
    "rating": 0,
    "totalReviews": 0,
    "createdAt": "2026-03-28T18:28:14.481Z",
    "updatedAt": "2026-03-28T18:28:14.481Z"
  }
}
```

**Réponse 201 ✅ — TEST 7.1b (`isImmediate: true`) :**
```json
{
  "success": true,
  "message": "Abonnement créé avec succès",
  "data": {
    "id": "24d12a2a-f9a7-4206-be4b-0c5eec5261d9",
    "name": "Formule Express Déjeuner",
    "type": "LUNCH",
    "duration": "WORK_WEEK",
    "isImmediate": true,
    "preparationHours": 0,
    "price": 8000,
    "createdAt": "2026-03-28T18:29:09.003Z"
  }
}
```

> Quand `isImmediate: true`, le serveur force `preparationHours` à `0` même si une valeur est envoyée — le champ est ignoré.

**Réponse 400 ❌ — `isImmediate: false` sans `preparationHours` (TEST 7.1c) :**
```json
{
  "success": false,
  "message": "Validation failed: [{\"field\":\"preparationHours\",\"message\":\"Le délai de préparation est requis si l'abonnement n'est pas immédiat\"}]",
  "error": {
    "code": "VALIDATION_ERROR"
  }
}
```

**Réponse 400 ❌ — Aucun repas associé (TEST 7.2) :**
```json
{
  "success": false,
  "message": "Validation failed: [{\"field\":\"mealIds\",\"message\":\"Au moins un repas requis\"}]",
  "error": {
    "code": "VALIDATION_ERROR"
  }
}
```

**Codes d'erreur possibles :**
| Code | HTTP | Description |
|------|------|-------------|
| `VALIDATION_ERROR` | 400 | `preparationHours` manquant quand `isImmediate=false`, aucun repas, champs requis manquants |
| `UNAUTHORIZED` | 401 | Token manquant ou expiré |
| `FORBIDDEN` | 403 | Token non PROVIDER ou provider non approuvé |

---

### PUT /subscriptions/:id/public — Publier/dépublier un abonnement

Bascule la visibilité de l'abonnement. Un abonnement `isPublic: false` n'apparaît pas dans les résultats de recherche des users.

**Headers requis :** `Authorization: Bearer {providerToken}`

**Réponse 200 ✅ — TEST 7.3 :**
```json
{
  "success": true,
  "message": "Statut de l'abonnement mis à jour",
  "data": {
    "id": "5a4fc4e7-84f0-4403-b1c2-34f67ef35821",
    "isPublic": true,
    "updatedAt": "2026-03-28T18:33:35.416Z"
    // ... autres champs
  }
}
```

> Cet endpoint est un toggle — si `isPublic` était `true`, il passe à `false` et vice-versa. Utile quand le provider veut retirer temporairement une offre sans la supprimer.

---

### GET /subscriptions/me — Voir ses abonnements

Retourne tous les abonnements du provider connecté, actifs ou non, publics ou privés.

**Headers requis :** `Authorization: Bearer {providerToken}`

**Réponse 200 ✅ — TEST 7.4 :**
```json
{
  "success": true,
  "message": "Abonnements récupérés avec succès",
  "data": [
    {
      "id": "24d12a2a-f9a7-4206-be4b-0c5eec5261d9",
      "name": "Formule Express Déjeuner",
      "type": "LUNCH",
      "duration": "WORK_WEEK",
      "price": 8000,
      "isPublic": true,
      "isImmediate": true,
      "preparationHours": 0,
      "subscriberCount": 0,
      "createdAt": "2026-03-28T18:29:09.003Z"
    },
    {
      "id": "5a4fc4e7-84f0-4403-b1c2-34f67ef35821",
      "name": "Formule Semaine Africaine",
      "type": "FULL_DAY",
      "duration": "WORK_WEEK",
      "price": 25000,
      "isPublic": true,
      "isImmediate": false,
      "preparationHours": 24,
      "subscriberCount": 0,
      "createdAt": "2026-03-28T18:28:14.481Z",
      "updatedAt": "2026-03-28T18:33:35.416Z"
    }
  ]
}
```

---
