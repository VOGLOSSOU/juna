# Documentation API JUNA

## Base URL
```
http://localhost:5000/api/v1
```

---

## AUTH - Authentication

### POST /auth/register - Creer un compte

```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nathan@juna.app",
    "password": "Password123",
    "name": "Nathan Voglossou",
    "phone": "+22997123456"
  }'
```

**Response (201):**
```json
{
  "success": true,
  "message": "Compte cree avec succes",
  "data": {
    "user": {
      "id": "804afb88-1477-41cc-b4b8-ff4a97fc71d4",
      "email": "nathan@juna.app",
      "name": "Nathan Voglossou",
      "phone": "+22997123456",
      "role": "USER",
      "isVerified": false,
      "isActive": true,
      "createdAt": "2025-12-22T06:11:42.518Z",
      "updatedAt": "2025-12-22T06:11:42.518Z"
    },
    "tokens": {
      "accessToken": "eyJhbG...",
      "refreshToken": "eyJhbG..."
    }
  }
}
```

---

### POST /auth/login - Connexion

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nathan@juna.app",
    "password": "Password123"
  }'
```

**Response (200):**
```json
{
  "success": true,
  "message": "Connexion reussie",
  "data": {
    "user": {
      "id": "804afb88-1477-41cc-b4b8-ff4a97fc71d4",
      "email": "nathan@juna.app",
      "name": "Nathan V.",
      "phone": "+22997654321",
      "role": "USER",
      "isVerified": false,
      "isActive": true,
      "createdAt": "2025-12-22T06:11:42.518Z",
      "updatedAt": "2025-12-22T06:11:42.518Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

---

### POST /auth/refresh - Rafraichir le token

```bash
curl -X POST http://localhost:5000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

---

### POST /auth/logout - Deconnexion

```bash
curl -X POST http://localhost:5000/api/v1/auth/logout \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

**Response (200):**
```json
{
  "success": true,
  "message": "Deconnexion reussie"
}
```

---

## USER - Gestion du Profil

**Headers requis pour tous les endpoints USER:**
```
Authorization: Bearer <ACCESS_TOKEN>
```

---

### GET /users/me - Obtenir mon profil

```bash
curl -X GET http://localhost:5000/api/v1/users/me \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profil recupere avec succes",
  "data": {
    "id": "804afb88-1477-41cc-b4b8-ff4a97fc71d4",
    "email": "nathan@juna.app",
    "name": "Nathan V.",
    "phone": "+22997654321",
    "role": "USER",
    "isVerified": false,
    "isActive": true,
    "createdAt": "2025-12-22T06:11:42.518Z",
    "profile": {
      "avatar": null,
      "address": "Cotonou, Benin",
      "city": "Cotonou",
      "country": "Benin",
      "latitude": null,
      "longitude": null,
      "preferences": {
        "notifications": {
          "sms": false,
          "push": true,
          "email": true
        },
        "favoriteCategories": ["AFRICAN", "ASIAN"],
        "dietaryRestrictions": ["halal", "vegetarian"]
      }
    }
  }
}
```

---

### PUT /users/me - Mettre a jour le profil

```bash
curl -X PUT http://localhost:5000/api/v1/users/me \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nathan V.",
    "phone": "+22997654321",
    "address": "Cotonou, Benin",
    "city": "Cotonou",
    "country": "Benin"
  }'
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profil mis a jour avec succes",
  "data": {
    "id": "804afb88-1477-41cc-b4b8-ff4a97fc71d4",
    "email": "nathan@juna.app",
    "name": "Nathan V.",
    "phone": "+22997654321",
    "role": "USER",
    "isVerified": false,
    "isActive": true,
    "createdAt": "2025-12-22T06:11:42.518Z",
    "profile": {
      "avatar": null,
      "address": "Cotonou, Benin",
      "city": "Cotonou",
      "country": "Benin",
      "latitude": null,
      "longitude": null,
      "preferences": null
    }
  }
}
```

**Body Parameters:**
| Parametre | Type | Description |
|-----------|------|-------------|
| name | string | Nom complet |
| phone | string | Numero de telephone |
| address | string | Adresse |
| city | string | Ville |
| country | string | Pays |
| latitude | number | Latitude GPS |
| longitude | number | Longitude GPS |

---

### PUT /users/me/preferences - Mettre a jour les preferences

```bash
curl -X PUT http://localhost:5000/api/v1/users/me/preferences \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "dietaryRestrictions": ["halal", "vegetarian"],
    "favoriteCategories": ["AFRICAN", "ASIAN"],
    "notifications": {
      "email": true,
      "push": true,
      "sms": false
    }
  }'
```

**Response (200):**
```json
{
  "success": true,
  "message": "Preferences mises a jour avec succes",
  "data": {
    "message": "Preferences mises a jour avec succes"
  }
}
```

---

### DELETE /users/me - Supprimer mon compte

```bash
curl -X DELETE http://localhost:5000/api/v1/users/me \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "password": "Password123"
  }'
```

---

## Security

- Tous les endpoints sensibles necessitent un token JWT
- Le token doit etre dans le header: `Authorization: Bearer <TOKEN>`
- Le token expire apres 1 heure
- Utilisez le refresh token pour obtenir un nouveau access token

---

## Error Responses

**400 - Bad Request:**
```json
{
  "success": false,
  "message": "Validation error",
  "error": {
    "code": "VALIDATION_ERROR"
  }
}
```

**401 - Unauthorized:**
```json
{
  "success": false,
  "message": "Token invalide ou expire",
  "error": {
    "code": "UNAUTHORIZED"
  }
}
```

---

## Testing

Pour tester, utilisez le token obtenu lors du login:

```bash
# Obtenir le profil:
curl -X GET http://localhost:5000/api/v1/users/me \
  -H "Authorization: Bearer <TOKEN>"

# Mettre a jour le profil:
curl -X PUT http://localhost:5000/api/v1/users/me \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Nouveau nom"}'

# Mettre a jour les preferences:
curl -X PUT http://localhost:5000/api/v1/users/me/preferences \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"notifications": {"email": true}}'
```

