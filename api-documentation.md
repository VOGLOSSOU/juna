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
      "id": "8778243d-c31e-4000-aa21-10ba8aa567d8",
      "email": "kofi.mensah@gmail.com",
      "name": "Kofi Mensah",
      "phone": "+22961111111",
      "role": "USER",
      "isVerified": false,
      "isActive": true,
      "createdAt": "2026-03-28T16:16:25.640Z",
      "updatedAt": "2026-03-28T16:16:25.640Z"
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
      "id": "8778243d-c31e-4000-aa21-10ba8aa567d8",
      "email": "kofi.mensah@gmail.com",
      "name": "Kofi Mensah",
      "phone": "+22961111111",
      "role": "USER",
      "isVerified": false,
      "isActive": true,
      "createdAt": "2026-03-28T16:16:25.640Z",
      "updatedAt": "2026-03-28T16:16:25.640Z"
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
    "id": "8778243d-c31e-4000-aa21-10ba8aa567d8",
    "email": "kofi.mensah@gmail.com",
    "name": "Kofi Mensah",
    "phone": "+22961111111",
    "role": "USER",
    "isVerified": false,
    "isActive": true,
    "createdAt": "2026-03-28T16:16:25.640Z",
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
    "id": "8778243d-c31e-4000-aa21-10ba8aa567d8",
    "email": "kofi.mensah@gmail.com",
    "name": "Kofi Mensah Junior",
    "phone": "+22961111111",
    "role": "USER",
    "isVerified": false,
    "isActive": true,
    "createdAt": "2026-03-28T16:16:25.640Z",
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
