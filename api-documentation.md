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
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "Restaurant Le Bon Goût",
    "description": "Spécialités africaines",
    "businessAddress": "Cotonou, Benin"
  }'
```

**Response (201):**
```json
{
  "success": true,
  "message": "Demande soumise, en attente de validation",
  "data": {
    "id": "702a3a2d-05cc-448a-a0ba-49ceee1fc616",
    "businessName": "Restaurant Le Bon Goût",
    "description": "Spécialités africaines",
    "businessAddress": "Cotonou, Benin",
    "status": "PENDING",
    "createdAt": "2026-02-09T18:42:30.832Z"
  }
}
```

---

### GET /providers/me - Obtenir mon profil fournisseur

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

**Pour se connecter en tant qu'admin :**
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@juna.app","password":"Admin123!"}'
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
curl -X PUT http://localhost:5000/api/v1/admin/providers/702a3a2d-05cc-448a-a0ba-49ceee1fc616/approve \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"message": "Bienvenue sur JUNA!"}'
```

**Response (200):**
```json
{
  "success": true,
  "message": "Fournisseur approuve avec succes",
  "data": {
    "success": true,
    "message": "Fournisseur approuve avec succes",
    "provider": {
      "id": "702a3a2d-05cc-448a-a0ba-49ceee1fc616",
      "businessName": "Restaurant Le Bon Goût",
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

