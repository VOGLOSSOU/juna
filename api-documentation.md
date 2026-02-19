# Documentation API JUNA

## Base URL
```
http://localhost:5000/api/v1
```

---

## AUTH - Authentication

### POST /auth/register - Créer un compte

```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "Password123",
    "name": "John Doe",
    "phone": "+22961234567"
  }'
```

**Response (201) - ✅ TEST 1.1:**
```json
{
  "success": true,
  "message": "Compte créé avec succès",
  "data": {
    "user": {
      "id": "a647c4fd-5659-4955-87f0-038f99366bd0",
      "email": "john.doe@example.com",
      "name": "John Doe",
      "phone": "+22961234567",
      "role": "USER",
      "isVerified": false,
      "isActive": true,
      "createdAt": "2026-02-17T17:46:04.751Z",
      "updatedAt": "2026-02-17T17:46:04.751Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhNjQ3YzRmZC01NjU5LTQ5NTUtODdmMC0wMzhmOTkzNjZiZDAiLCJlbWFpbCI6ImpvaG4uZG9lQGV4YW1wbGUuY29tIiwicm9sZSI6IlVTRVIiLCJpYXQiOjE3NzEzNTAzNjQsImV4cCI6MTc3MTM1MTI2NH0.zOJ3gAYxzbYDPExLc88qqMj1jZTHyTT_KcO1EdhuFY4",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhNjQ3YzRmZC01NjU5LTQ5NTUtODdmMC0wMzhmOTkzNjZiZDAiLCJlbWFpbCI6ImpvaG4uZG9lQGV4YW1wbGUuY29tIiwicm9sZSI6IlVTRVIiLCJpYXQiOjE3NzEzNTAzNjQsImV4cCI6MTc3MTk1NTE2NH0.YNpDeh9xj2ihG5zA4dyZqK88lPa9Amc8uElFQ3kCyj0"
    }
  }
}
```

---

### POST /auth/register - Erreur: Email déjà utilisé (409)

```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "Password999",
    "name": "Duplicate User"
  }'
```

**Response (409) - ✅ TEST 1.3:**
```json
{
  "success": false,
  "message": "Cet email est déjà utilisé",
  "error": {
    "code": "EMAIL_ALREADY_EXISTS"
  }
}
```

---

### POST /auth/register - Erreur: Email invalide (400)

```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "not-an-email",
    "password": "Password123",
    "name": "Invalid Email"
  }'
```

**Response (400) - ✅ TEST 1.4:**
```json
{
  "success": false,
  "message": "Validation failed: [{\"field\":\"email\",\"message\":\"Email invalide\"}]",
  "error": {
    "code": "VALIDATION_ERROR"
  }
}
```

---

### POST /auth/register - Erreur: Password faible (400)

```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "weak@example.com",
    "password": "123",
    "name": "Weak Password"
  }'
```

**Response (400) - ✅ TEST 1.5:**
```json
{
  "success": false,
  "message": "Validation failed: [{\"field\":\"password\",\"message\":\"Minimum 8 caractères\"},{\"field\":\"password\",\"message\":\"Le mot de passe doit contenir au moins une majuscule\"}]",
  "error": {
    "code": "VALIDATION_ERROR"
  }
}
```

---

### POST /auth/login - Connexion

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "Password123"
  }'
```

**Response (200) - ✅ TEST 1.6:**
```json
{
  "success": true,
  "message": "Connexion réussie",
  "data": {
    "user": {
      "id": "a647c4fd-5659-4955-87f0-038f99366bd0",
      "email": "john.doe@example.com",
      "name": "John Doe",
      "phone": "+22961234567",
      "role": "USER",
      "isVerified": false,
      "isActive": true,
      "createdAt": "2026-02-17T17:46:04.751Z",
      "updatedAt": "2026-02-17T17:46:04.751Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhNjQ3YzRmZC01NjU5LTQ5NTUtODdmMC0wMzhmOTkzNjZiZDAiLCJlbWFpbCI6ImpvaG4uZG9lQGV4YW1wbGUuY29tIiwicm9sZSI6IlVTRVIiLCJpYXQiOjE3NzEzNTEyMDYsImV4cCI6MTc3MTM1MjEwNn0.bdsSFDhuY8rfRqzdgDej86QcFeL-9pbw4m57HhCQqHk",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhNjQ3YzRmZC01NjU5LTQ5NTUtODdmMC0wMzhmOTkzNjZiZDAiLCJlbWFpbCI6ImpvaG4uZG9lQGV4YW1wbGUuY29tIiwicm9sZSI6IlVTRVIiLCJpYXQiOjE3NzEzNTEyMDYsImV4cCI6MTc3MTk1NjAwNn0._dbEPFqUYsOanBOPqgBJLpZeexNkc6DPzhPLV-qQMLk"
    }
  }
}
```

---

### POST /auth/login - Erreur: Mauvais mot de passe (401)

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "WrongPassword"
  }'
```

**Response (401) - ✅ TEST 1.7:**
```json
{
  "success": false,
  "message": "Email ou mot de passe incorrect",
  "error": {
    "code": "INVALID_CREDENTIALS"
  }
}
```

---

### POST /auth/login - Erreur: Email inexistant (401)

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nonexistent@example.com",
    "password": "Password123"
  }'
```

**Response (401) - ✅ TEST 1.8:**
```json
{
  "success": false,
  "message": "Email ou mot de passe incorrect",
  "error": {
    "code": "INVALID_CREDENTIALS"
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

---

## PROVIDER - Gestion des Fournisseurs

**Headers requis pour tous les endpoints PROVIDER:**
```
Authorization: Bearer <ACCESS_TOKEN>
```

---

### POST /providers/register - S'inscrire comme fournisseur

```bash
curl -X POST http://localhost:5000/api/v1/providers/register \
  -H "Authorization: Bearer <USER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "Another Business",
    "description": "Description du restaurant",
    "businessAddress": "Cotonou, Benin"
  }'
```

**Response (201) - ✅ TEST 3.2:**
```json
{
  "success": true,
  "message": "Demande soumise, en attente de validation",
  "data": {
    "id": "b1f4ae83-2e36-4f28-b626-2f74ae82f1aa",
    "businessName": "Another Business",
    "status": "PENDING",
    "message": "Votre demande a été enregistrée. En attente de validation par l'admin."
  }
}
```

**Note:** Le status `PENDING` signifie en attente d'approbation par l'admin.

---

### POST /providers/register - Erreur: Token manquant (401)

```bash
curl -X POST http://localhost:5000/api/v1/providers/register \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "Test Business",
    "description": "Description"
  }'
```

**Response (401) - ✅ TEST 3.3:**
```json
{
  "success": false,
  "message": "Token manquant",
  "error": {
    "code": "UNAUTHORIZED"
  }
}
```

```bash
curl -X GET http://localhost:5000/api/v1/providers/me \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profil fournisseur recupere avec succes",
  "data": {
    "id": "702a3a2d-05cc-448a-a0ba-49ceee1fc616",
    "businessName": "Restaurant Le Bon Goût",
    "description": "Spécialités africaines",
    "businessAddress": "Cotonou, Benin",
    "status": "PENDING",
    "rating": 0,
    "totalReviews": 0,
    "createdAt": "2026-02-09T18:42:30.832Z",
    "subscriptions": []
  }
}
```

**Note:** Le status `PENDING` signifie en attente d'approbation par l'admin.

---

## Testing Providers

```bash
# S'inscrire comme fournisseur:
curl -X POST http://localhost:5000/api/v1/providers/register \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"businessName":"Mon Restaurant","description":"Bon","businessAddress":"Cotonou"}'

# Voir mon profil fournisseur:
curl -X GET http://localhost:5000/api/v1/providers/me \
  -H "Authorization: Bearer <TOKEN>"
```

---

## ADMIN - Administration

**Headers requis pour tous les endpoints ADMIN:**
```
Authorization: Bearer <ACCESS_TOKEN> (doit être ADMIN ou SUPER_ADMIN)
```

---

### ⚠️ COMPTE ADMIN CRÉÉ !

Un compte administrateur a été créé et est prêt à être utilisé :

```
📧 Email: superadmin@juna.app
🔐 Mot de passe: Admin123!
👤 ID: 4da90b25-ed3e-4d3e-8fe7-f87b21f71387
```

**Pour se connecter en tant qu'admin (✅ TEST 2.1):**
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@juna.app","password":"Admin123!"}'
```

**Response (200):**
```json
{
  "success": true,
  "message": "Connexion réussie",
  "data": {
    "user": {
      "id": "4da90b25-ed3e-4d3e-8fe7-f87b21f71387",
      "email": "superadmin@juna.app",
      "name": "Super Admin",
      "phone": "+22990000000",
      "role": "SUPER_ADMIN",
      "isVerified": true,
      "isActive": true,
      "createdAt": "2026-02-17T18:30:09.187Z",
      "updatedAt": "2026-02-17T18:30:09.187Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI0ZGE5MGIyNS1lZDNlLTRkM2UtOGZlNy1mODdiMjFmNzEzODciLCJlbWFpbCI6InN1cGVyYWRtaW5AanVuYS5hcHAiLCJyb2xlIjoiU1VQRVJfQURNSU4iLCJpYXQiOjE3NzE0NTIxODYsImV4cCI6MTc3MTQ1MzA4Nn0.kwFIGb5I4bPVdm7jksWpAqeOzCibgGJSiZMLM4o6leU",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI0ZGE5MGIyNS1lZDNlLTRkM2UtOGZlNy1mODdiMjFmNzEzODciLCJlbWFpbCI6InN1cGVyYWRtaW5AanVuYS5hcHAiLCJyb2xlIjoiU1VQRVJfQURNSU4iLCJpYXQiOjE3NzE0NTIxODYsImV4cCI6MTc3MjA1Njk4Nn0.3dKGRlwLrO7c-UpISj2tY0uQXDKh0gvG-9EReAsPF4A"
    }
  }
}
```

---

### Créer un admin via script

Si tu as besoin de créer un nouvel admin, utilise le script :

```bash
# Dans le dossier juna-backend/
node create-admin.js [email] [password] [name]

# Exemples :
node create-admin.js "admin2@juna.app" "Password123!" "Admin Secondaire"
node create-admin.js  # Défaut: superadmin@juna.app / Admin123!
```

**⚠️ IMPORTANT :** Changez le mot de passe après la première connexion !

---

### GET /admin/providers/pending - Lister les demandes en attente

```bash
curl -X GET http://localhost:5000/api/v1/admin/providers/pending \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

**Response (200):**
```json
{
  "success": true,
  "message": "Fournisseurs en attente",
  "data": [
    {
      "id": "702a3a2d-05cc-448a-a0ba-49ceee1fc616",
      "businessName": "Restaurant Le Bon Goût",
      "description": "Spécialités africaines",
      "businessAddress": "Cotonou, Benin",
      "status": "PENDING",
      "rating": 0,
      "totalReviews": 0,
      "createdAt": "2026-02-09T18:42:30.832Z"
    }
  ]
}
```

---

### PUT /admin/providers/:id/approve - Approuver un fournisseur

```bash
curl -X PUT http://localhost:5000/api/v1/admin/providers/b1f4ae83-2e36-4f28-b626-2f74ae82f1aa/approve \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"message": "Bienvenue sur JUNA!"}'
```

**Response (200) - ✅ TEST 3.4:**
```json
{
  "success": true,
  "message": "Fournisseur approuve avec succes",
  "data": {
    "success": true,
    "message": "Fournisseur approuve avec succes",
    "provider": {
      "id": "b1f4ae83-2e36-4f28-b626-2f74ae82f1aa",
      "businessName": "Another Business",
      "status": "APPROVED"
    }
  }
}
```

---

### PUT /admin/providers/:id/reject - Rejeter un fournisseur

```bash
curl -X PUT http://localhost:5000/api/v1/admin/providers/702a3a2d-05cc-448a-a0ba-49ceee1fc616/reject \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Documents incomplets, registre de commerce manquant"}'
```

**Response (200):**
```json
{
  "success": true,
  "message": "Fournisseur rejete",
  "data": {
    "success": true,
    "message": "Fournisseur rejete",
    "provider": {
      "id": "702a3a2d-05cc-448a-a0ba-49ceee1fc616",
      "businessName": "Restaurant Le Bon Goût",
      "status": "REJECTED"
    }
  }
}
```

---

### GET /admin/dashboard - Statistiques du dashboard

```bash
curl -X GET http://localhost:5000/api/v1/admin/dashboard \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalUsers": 150,
      "totalProviders": 25,
      "pendingProviders": 5,
      "totalOrders": 1200,
      "completedOrders": 1100,
      "pendingOrders": 50,
      "totalRevenue": 1500000
    }
  }
}
```

---

### GET /admin/users - Lister les utilisateurs

```bash
curl -X GET "http://localhost:5000/api/v1/admin/users?role=USER&isActive=true" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

---

## Testing Admin

```bash
# Créer un admin (seeding requis)
# Note: Seul SUPER_ADMIN peut créer des admins

# Lister les fournisseurs en attente:
curl -X GET http://localhost:5000/api/v1/admin/providers/pending \
  -H "Authorization: Bearer <ADMIN_TOKEN>"

# Approuver un fournisseur:
curl -X PUT http://localhost:5000/api/v1/admin/providers/<ID>/approve \
  -H "Authorization: Bearer <ADMIN_TOKEN>"

# Voir le dashboard:
curl -X GET http://localhost:5000/api/v1/admin/dashboard \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

**Note:** Pour tester les endpoints admin, suivez les instructions ci-dessous pour créer un compte admin.

---

## 🛠️ GUIDE DE CONFIGURATION - CRÉER UN ADMIN

### Méthode 1 : Via le seed (recommandé)

**Étape 1 : Configurer le fichier .env**
```bash
cd juna-backend

# Éditer .env et ajouter/mettre à jour :
ADMIN_EMAIL=admin@votre-email.com
ADMIN_PASSWORD=VotreMotDePasseSécurisé123!
```

**Étape 2 : Exécuter le seed**
```bash
npx ts-node -r tsconfig-paths/register prisma/seed.ts
```

**Résultat attendu :**
```
🌱 Starting seed...
✅ Admin created successfully!
   Email: admin@votre-email.com
   Role: ADMIN
```

**Étape 3 : Se connecter avec l'admin**
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@votre-email.com","password":"VotreMotDePasseSécurisé123!"}'
```

---

### Méthode 2 : Via Prisma Studio (manuel)

```bash
npx prisma studio
```

Dans l'interface :
1. Cliquer sur "users"
2. Cliquer sur "Add record"
3. Remplir les champs :
   - email: admin@votre-email.com
   - password: (mot de passe hashé bcrypt)
   - name: Administrateur
   - role: ADMIN
   - isVerified: true
   - isActive: true
4. Cliquer sur "Save 1 Record"

---

## 🔄 WORKFLOW COMPLET - APPROBATION D'UN FOURNISSEUR

### Étape 1 : Un utilisateur s'inscrit comme fournisseur

```bash
curl -X POST http://localhost:5000/api/v1/providers/register \
  -H "Authorization: Bearer <USER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "Restaurant Le Bon Goût",
    "description": "Spécialités africaines",
    "businessAddress": "Cotonou, Benin"
  }'
```

**Résultat :** Le provider est créé avec `status: "PENDING"`

---

### Étape 2 : L'admin liste les demandes en attente

```bash
curl -X GET http://localhost:5000/api/v1/admin/providers/pending \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

**Résultat :** Liste des providers en attente d'approbation

---

### Étape 3 : L'admin approuve le fournisseur

```bash
curl -X PUT http://localhost:5000/api/v1/admin/providers/<PROVIDER_ID>/approve \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"message": "Bienvenue sur JUNA!"}'
```

**Ce qui se passe en backend :**
1. Le status du provider passe de `PENDING` à `APPROVED`
2. Le role de l'utilisateur passe de `USER` à `PROVIDER`
3. Le fournisseur peut maintenant créer des abonnements

---

### Étape 4 : (Optionnel) L'admin rejette le fournisseur

```bash
curl -X PUT http://localhost:5000/api/v1/admin/providers/<PROVIDER_ID>/reject \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Documents incomplets"}'
```

**Ce qui se passe :**
- Le status du provider passe à `REJECTED`
- L'utilisateur garde son role `USER`

---

## 📋 RÉSUMÉ DES ENDPOINTS ADMIN

---

## MEAL - Gestion des Repas

**Headers requis pour tous les endpoints MEAL:**
```
Authorization: Bearer <ACCESS_TOKEN> (doit être PROVIDER APPROVED)
```

---

### POST /meals - Créer un repas

```bash
curl -X POST http://localhost:5000/api/v1/meals \
  -H "Authorization: Bearer <PROVIDER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Poulet Rôti",
    "description": "Poulet rôti aux épices africaines",
    "price": 2500,
    "mealType": "LUNCH",
    "imageUrl": "https://example.com/poulet.jpg"
  }'
```

**Response (201) - ✅ TEST 4.1/4.3:**
```json
{
  "success": true,
  "message": "Repas créé avec succès",
  "data": {
    "id": "5d111e6c-cced-4f75-b381-e7b88f595f8e",
    "providerId": "b1f4ae83-2e36-4f28-b626-2f74ae82f1aa",
    "name": "Beignet",
    "description": "Beignets traditionnels",
    "price": 500,
    "imageUrl": "https://example.com/beignet.jpg",
    "mealType": "SNACK",
    "isActive": true,
    "createdAt": "2026-02-18T23:04:39.172Z",
    "updatedAt": "2026-02-18T23:04:39.172Z"
  }
}
```

**Body Parameters:**
| Paramètre | Type | Description |
|-----------|------|-------------|
| name | string | Nom du repas (required, 2-100 chars) |
| description | string | Description (required, 5-500 chars) |
| price | number | Prix en XOF (required, min 100) |
| imageUrl | string | URL de l'image (required) |
| mealType | enum | BREAKFAST, LUNCH, DINNER, SNACK |

---

### POST /meals - Erreur: User non-provider (401)

```bash
curl -X POST http://localhost:5000/api/v1/meals \
  -H "Authorization: Bearer <USER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Unauthorized Meal",
    "description": "This should fail",
    "price": 1000,
    "mealType": "LUNCH",
    "imageUrl": "https://example.com/unauthorized.jpg"
  }'
```

**Response (401) - ✅ TEST 4.9:**
```json
{
  "success": false,
  "message": "Token manquant",
  "error": {
    "code": "UNAUTHORIZED"
  }
}
```

---

### POST /meals - Erreur: Nom dupliqué (409)

```bash
curl -X POST http://localhost:5000/api/v1/meals \
  -H "Authorization: Bearer <PROVIDER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Poulet Rôti",
    "description": "Duplicate name test",
    "price": 2000,
    "mealType": "DINNER",
    "imageUrl": "https://example.com/poulet2.jpg"
  }'
```

**Response (409) - ✅ TEST 4.10:**
```json
{
  "success": false,
  "message": "Un repas avec ce nom existe déjà",
  "error": {
    "code": "MEAL_ALREADY_EXISTS"
  }
}
```

---

### POST /meals - Erreur: User non-connecté (401)

```bash
curl -X POST http://localhost:5000/api/v1/meals \
  -H "Content-Type: application/json" \
  -d '{
    "name": "No Auth Meal",
    "description": "Should fail",
    "price": 1000,
    "mealType": "LUNCH",
    "imageUrl": "https://example.com/noauth.jpg"
  }'
```

**Response (401) - ✅ TEST 4.11:**
```json
{
  "success": false,
  "message": "Token manquant",
  "error": {
    "code": "UNAUTHORIZED"
  }
}
```

```bash
curl -X POST http://localhost:5000/api/v1/meals \
  -H "Authorization: Bearer <PROVIDER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Poulet Rôti",
    "description": "Duplicate name test",
    "price": 2000,
    "mealType": "DINNER",
    "imageUrl": "https://example.com/poulet2.jpg"
  }'
```

**Response (409) - ✅ TEST 4.5:**
```json
{
  "success": false,
  "message": "Un repas avec ce nom existe déjà",
  "error": {
    "code": "MEAL_ALREADY_EXISTS"
  }
}
```

---

### GET /meals/me - Liste mes repas (provider)

```bash
curl -X GET http://localhost:5000/api/v1/meals/me \
  -H "Authorization: Bearer <PROVIDER_TOKEN>"
```

**Response (200) - ✅ TEST 4.12:**
```json
{
  "success": true,
  "message": "Repas récupérés avec succès",
  "data": [
    {
      "id": "d6358c4e-625e-4fd7-9b26-a070162a8f07",
      "providerId": "317f10f2-134d-4109-a087-6c4691f0f7fa",
      "name": "Chips",
      "description": "Chips de pommes de terre naturelles",
      "price": 400,
      "imageUrl": "https://example.com/chips.jpg",
      "mealType": "SNACK",
      "isActive": true,
      "createdAt": "2026-02-19T18:45:55.913Z",
      "updatedAt": "2026-02-19T18:45:55.913Z"
    },
    {
      "id": "37aa74a9-1e5f-4e5a-9245-60d06619573d",
      "providerId": "317f10f2-134d-4109-a087-6c4691f0f7fa",
      "name": "Pates Carbonara",
      "description": "Pates avec creme, lardons et parmesan",
      "price": 2800,
      "imageUrl": "https://example.com/carbonara.jpg",
      "mealType": "DINNER",
      "isActive": true,
      "createdAt": "2026-02-19T18:45:50.187Z",
      "updatedAt": "2026-02-19T18:45:50.187Z"
    }
  ]
}
```

---

### GET /meals - Liste meals publics

```bash
curl -X GET http://localhost:5000/api/v1/meals
```

**Response (200) - ✅ TEST 4.13:**
```json
{
  "success": true,
  "message": "Repas récupérés avec succès",
  "data": [
    {
      "id": "5d111e6c-cced-4f75-b381-e7b88f595f8e",
      "providerId": "b1f4ae83-2e36-4f28-b626-2f74ae82f1aa",
      "name": "Beignet",
      "description": "Beignets traditionnels",
      "price": 500,
      "imageUrl": "https://example.com/beignet.jpg",
      "mealType": "SNACK",
      "isActive": true,
      "createdAt": "2026-02-18T23:04:39.172Z",
      "updatedAt": "2026-02-18T23:04:39.172Z",
      "provider": {
        "id": "b1f4ae83-2e36-4f28-b626-2f74ae82f1aa",
        "businessName": "Another Business"
      }
    }
  ]
}
```

**Note:** La liste publique inclut les informations du provider.

---

### GET /meals/:id - Détails d'un repas

```bash
curl -X GET http://localhost:5000/api/v1/meals/{{mealId}}
```

---

### PUT /meals/:id - Modifier un repas

```bash
curl -X PUT http://localhost:5000/api/v1/meals/8101a51c-5752-4367-ba88-7405a1ccff68 \
  -H "Authorization: Bearer <PROVIDER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Poulet Rôti Updated",
    "price": 2800
  }'
```

**Response (200) - ✅ TEST 4.14:**
```json
{
  "success": true,
  "message": "Repas mis à jour avec succès",
  "data": {
    "id": "8101a51c-5752-4367-ba88-7405a1ccff68",
    "providerId": "b1f4ae83-2e36-4f28-b626-2f74ae82f1aa",
    "name": "Poulet Rôti Updated",
    "description": "Poulet rôti aux épices africaines",
    "price": 2800,
    "imageUrl": "https://example.com/poulet.jpg",
    "mealType": "LUNCH",
    "isActive": true,
    "createdAt": "2026-02-18T22:41:31.935Z",
    "updatedAt": "2026-02-18T23:38:52.044Z"
  }
}
```

---

### PUT /meals/:id/toggle - Activer/Désactiver un repas

```bash
curl -X PUT http://localhost:5000/api/v1/meals/8101a51c-5752-4367-ba88-7405a1ccff68/toggle \
  -H "Authorization: Bearer <PROVIDER_TOKEN>"
```

**Response (200) - ✅ TEST 4.15:**
```json
{
  "success": true,
  "message": "Statut du repas mis à jour",
  "data": {
    "id": "8101a51c-5752-4367-ba88-7405a1ccff68",
    "providerId": "b1f4ae83-2e36-4f28-b626-2f74ae82f1aa",
    "name": "Poulet Rôti Updated",
    "description": "Poulet rôti aux épices africaines",
    "price": 2800,
    "imageUrl": "https://example.com/poulet.jpg",
    "mealType": "LUNCH",
    "isActive": false,
    "createdAt": "2026-02-18T22:41:31.935Z",
    "updatedAt": "2026-02-18T23:39:21.018Z"
  }
}
```

---

### DELETE /meals/:id - Supprimer un repas

```bash
curl -X DELETE http://localhost:5000/api/v1/meals/8101a51c-5752-4367-ba88-7405a1ccff68 \
  -H "Authorization: Bearer <PROVIDER_TOKEN>"
```

**Response (200) - ✅ TEST 4.16:**
```json
{
  "success": true,
  "message": "Repas supprimé avec succès"
}
```

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/admin/providers/pending` | Lister les demandes en attente |
| GET | `/admin/providers` | Lister tous les fournisseurs |
| GET | `/admin/providers/:id` | Détails d'un fournisseur |
| PUT | `/admin/providers/:id/approve` | Approuver un fournisseur |
| PUT | `/admin/providers/:id/reject` | Rejeter un fournisseur |
| PUT | `/admin/providers/:id/suspend` | Suspendre un fournisseur |
| GET | `/admin/users` | Lister les utilisateurs |
| GET | `/admin/users/:id` | Détails d'un utilisateur |
| PUT | `/admin/users/:id/suspend` | Suspendre un utilisateur |
| PUT | `/admin/users/:id/activate` | Réactiver un utilisateur |
| GET | `/admin/dashboard` | Statistiques du dashboard |

---

## SUBSCRIPTION - Gestion des Abonnements

Les abonnements permettent aux clients de souscrire à des repas récurrents. Un abonnement est défini par :
- **type** : BREAKFAST, LUNCH, DINNER, SNACK, BREAKFAST_LUNCH, LUNCH_DINNER, FULL_DAY, CUSTOM
- **duration** : DAY (1 jour), THREE_DAYS (3 jours), WEEK (7 jours), TWO_WEEKS (14 jours), MONTH (30 jours)
- **category** : AFRICAN, EUROPEAN, ASIAN, AMERICAN, FUSION, VEGETARIAN, VEGAN, HALAL, OTHER

### Types d'abonnements disponibles

| Type | Description | Repas inclus |
|------|-------------|---------------|
| BREAKFAST | Petit-déjeuner | 1 repas breakfast |
| LUNCH | Déjeuner | 1 repas lunch |
| DINNER | Dîner | 1 repas dinner |
| SNACK | Collation | 1 repas snack |
| BREAKFAST_LUNCH | Formule matinale | 1 breakfast + 1 lunch |
| LUNCH_DINNER | Formule midi-soir | 1 lunch + 1 dinner |
| FULL_DAY | Journée complète | 1 breakfast + 1 lunch + 1 dinner |
| CUSTOM | Personnalisé | Au choix |

### Durées disponibles

| Durée | Jours | Utilisation |
|-------|-------|--------------|
| DAY | 1 | Test, jour unique |
| THREE_DAYS | 3 | Weekend |
| WEEK | 7 | Semaine |
| TWO_WEEKS | 14 | Deux semaines |
| MONTH | 30 | Mensuel |

---

### POST /subscriptions - Créer un abonnement

**Prérequis :** Être provider approuvé

```bash
curl -X POST http://localhost:5000/api/v1/subscriptions \
  -H "Authorization: Bearer <PROVIDER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Menu Lunch Hebdomadaire",
    "description": "Un lunch par jour pendant une semaine",
    "price": 15000,
    "type": "LUNCH",
    "category": "AFRICAN",
    "duration": "WEEK",
    "imageUrl": "https://example.com/subscription-lunch.jpg",
    "isPublic": true,
    "mealIds": ["<MEAL_ID_1>", "<MEAL_ID_2>"]
  }'
```

**Response (201) - ✅ TEST 5.2:**
```json
{
  "success": true,
  "message": "Abonnement créé avec succès",
  "data": {
    "id": "abc123-def456-ghi789",
    "providerId": "provider-uuid",
    "name": "Menu Lunch Hebdomadaire",
    "description": "Un lunch par jour pendant une semaine",
    "price": 15000,
    "type": "LUNCH",
    "category": "AFRICAN",
    "duration": "WEEK",
    "isPublic": true,
    "mealIds": ["meal-uuid-1", "meal-uuid-2"],
    "createdAt": "2026-02-19T12:00:00.000Z",
    "updatedAt": "2026-02-19T12:00:00.000Z"
  }
}
```

**Body Parameters:**
| Paramètre | Type | Description |
|-----------|------|-------------|
| name | string | Nom de l'abonnement (required, 3-100 chars) |
| description | string | Description (required, 10-1000 chars) |
| price | number | Prix en XOF (required, min 100) |
| type | enum | BREAKFAST, LUNCH, DINNER, SNACK, BREAKFAST_LUNCH, LUNCH_DINNER, FULL_DAY, CUSTOM |
| category | enum | AFRICAN, EUROPEAN, ASIAN, AMERICAN, FUSION, VEGETARIAN, VEGAN, HALAL, OTHER |
| duration | enum | DAY, THREE_DAYS, WEEK, TWO_WEEKS, MONTH |
| imageUrl | string | URL de l'image (required) |
| isPublic | boolean | Visible publiquement (optional) |
| mealIds | array | IDs des repas inclus (optional) |

---

### GET /subscriptions - Liste des abonnements publics

```bash
curl -X GET http://localhost:5000/api/v1/subscriptions
```

**Response (200) - ✅ TEST 5.12:**
```json
{
  "success": true,
  "message": "Abonnements récupérés avec succès",
  "data": [
    {
      "id": "abc123-def456-ghi789",
      "name": "Menu Lunch Hebdomadaire",
      "description": "Un lunch par jour pendant une semaine",
      "price": 15000,
      "type": "LUNCH",
      "category": "AFRICAN",
      "duration": "WEEK",
      "isPublic": true,
      "provider": {
        "businessName": "John's Kitchen"
      }
    }
  ]
}
```

---

### GET /subscriptions/me - Abonnements du provider

```bash
curl -X GET http://localhost:5000/api/v1/subscriptions/me \
  -H "Authorization: Bearer <PROVIDER_TOKEN>"
```

**Response (200) - ✅ TEST 5.13:**
```json
{
  "success": true,
  "message": "Abonnements récupérés avec succès",
  "data": [
    {
      "id": "abc123-def456-ghi789",
      "name": "Menu Lunch Hebdomadaire",
      "price": 15000,
      "type": "LUNCH",
      "duration": "WEEK",
      "isPublic": true
    }
  ]
}
```

---

### GET /subscriptions/:id - Détails d'un abonnement

```bash
curl -X GET http://localhost:5000/api/v1/subscriptions/<SUBSCRIPTION_ID>
```

**Response (200) - ✅ TEST 5.14:**
```json
{
  "success": true,
  "message": "Abonnement récupéré avec succès",
  "data": {
    "id": "abc123-def456-ghi789",
    "name": "Menu Lunch Hebdomadaire",
    "description": "Un lunch par jour pendant une semaine",
    "price": 15000,
    "type": "LUNCH",
    "category": "AFRICAN",
    "duration": "WEEK",
    "isPublic": true,
    "meals": [
      {
        "id": "meal-uuid-1",
        "name": "Poulet Roti",
        "mealType": "LUNCH"
      }
    ]
  }
}
```

---

### PUT /subscriptions/:id - Modifier un abonnement

```bash
curl -X PUT http://localhost:5000/api/v1/subscriptions/<SUBSCRIPTION_ID> \
  -H "Authorization: Bearer <PROVIDER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Menu Lunch Premium",
    "price": 4000
  }'
```

**Response (200) - ✅ TEST 5.15:**
```json
{
  "success": true,
  "message": "Abonnement mis à jour avec succès",
  "data": {
    "id": "abc123-def456-ghi789",
    "name": "Menu Lunch Premium",
    "price": 4000
  }
}
```

---

### PUT /subscriptions/:id/public - Publier/Dé-publier un abonnement

```bash
curl -X PUT http://localhost:5000/api/v1/subscriptions/<SUBSCRIPTION_ID>/public \
  -H "Authorization: Bearer <PROVIDER_TOKEN>"
```

**Response (200) - ✅ TEST 5.16:**
```json
{
  "success": true,
  "message": "Visibilité de l'abonnement mise à jour",
  "data": {
    "id": "abc123-def456-ghi789",
    "isPublic": false
  }
}
```

---

### DELETE /subscriptions/:id - Supprimer un abonnement

```bash
curl -X DELETE http://localhost:5000/api/v1/subscriptions/<SUBSCRIPTION_ID> \
  -H "Authorization: Bearer <PROVIDER_TOKEN>"
```

**Response (200) - ✅ TEST 5.17:**
```json
{
  "success": true,
  "message": "Abonnement supprimé avec succès"
}
```

---

### Erreurs possibles

| Code | Message | Cause |
|------|---------|-------|
| 400 | Validation failed | Données invalides |
| 401 | Non authentifié | Token manquant |
| 403 | Permissions insuffisantes | Pas provider ou non approuvé |
| 404 | Non trouvé | Subscription inexistante |
| 409 | Conflit | Abonnement avec le même nom existe déjà |

---

### POST /subscriptions - Erreur: Abonnement dupliqué (409)

```bash
curl -X POST http://localhost:5000/api/v1/subscriptions \
  -H "Authorization: Bearer <PROVIDER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Menu Lunch Hebdomadaire",
    "description": "Un lunch par jour pendant une semaine",
    "price": 15000,
    "type": "LUNCH",
    "category": "AFRICAN",
    "duration": "WEEK",
    "imageUrl": "https://example.com/sub-lunch.jpg",
    "isPublic": true,
    "mealIds": ["<MEAL_ID_1>"]
  }'
```

**Response (409) - ✅ TEST:**
```json
{
  "success": false,
  "message": "Un abonnement avec ce nom existe déjà",
  "error": {
    "code": "SUBSCRIPTION_ALREADY_EXISTS"
  }
}
```

---

### Résumé des endpoints SUBSCRIPTION

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/subscriptions` | Créer un abonnement |
| GET | `/subscriptions` | Liste publique des abonnements |
| GET | `/subscriptions/me` | Abonnements du provider |
| GET | `/subscriptions/:id` | Détails d'un abonnement |
| PUT | `/subscriptions/:id` | Modifier un abonnement |
| PUT | `/subscriptions/:id/public` | Publier/dé-publier |
| DELETE | `/subscriptions/:id` | Supprimer un abonnement |

