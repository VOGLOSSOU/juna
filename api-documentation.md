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
