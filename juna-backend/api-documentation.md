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

**Response (201):**
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
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
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

**Response (409):**
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

**Response (400):**
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

**Response (400):**
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

**Response (200):**
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
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
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

**Response (401):**
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

### POST /auth/login - Erreur: Mauvais password (401)

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "WrongPassword"
  }'
```

**Response (401):**
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

### POST /auth/logout - Déconnexion

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
  "message": "Déconnexion réussie"
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
  "message": "Profil récupéré avec succès",
  "data": {
    "id": "a647c4fd-5659-4955-87f0-038f99366bd0",
    "email": "john.doe@example.com",
    "name": "John Doe",
    "phone": "+22961234567",
    "role": "USER",
    "isVerified": false,
    "isActive": true,
    "createdAt": "2026-02-17T17:46:04.751Z",
    "updatedAt": "2026-02-17T17:46:04.751Z",
    "profile": {
      "avatar": null,
      "address": null,
      "city": null,
      "country": null,
      "latitude": null,
      "longitude": null,
      "preferences": null
    }
  }
}
```

---

### PUT /users/me - Mettre à jour le profil

```bash
curl -X PUT http://localhost:5000/api/v1/users/me \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe Updated",
    "phone": "+22961234567",
    "address": "Nouvelle adresse",
    "city": "Cotonou",
    "country": "Benin"
  }'
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profil mis à jour avec succès",
  "data": {
    "id": "a647c4fd-5659-4955-87f0-038f99366bd0",
    "email": "john.doe@example.com",
    "name": "John Doe Updated",
    "phone": "+22961234567",
    "role": "USER",
    "isVerified": false,
    "isActive": true,
    "createdAt": "2026-02-17T17:46:04.751Z",
    "updatedAt": "2026-02-17T17:48:00.000Z"
  }
}
```

**Body Parameters:**
| Paramètre | Type | Description |
|-----------|------|-------------|
| name | string | Nom complet |
| phone | string | Numéro de téléphone |
| address | string | Adresse |
| city | string | Ville |
| country | string | Pays |
| latitude | number | Latitude GPS |
| longitude | number | Longitude GPS |

---

### PUT /users/me/preferences - Mettre à jour les préférences

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
  "message": "Préférences mises à jour avec succès",
  "data": {
    "message": "Préférences mises à jour avec succès"
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

- Tous les endpoints sensibles nécessitent un token JWT
- Le token doit être dans le header: `Authorization: Bearer <TOKEN>`
- Le token expire après 15 minutes
- Utilisez le refresh token pour obtenir un nouveau access token

---

## Error Responses

**400 - Bad Request:**
```json
{
  "success": false,
  "message": "Validation failed: [...]",
  "error": {
    "code": "VALIDATION_ERROR"
  }
}
```

**401 - Unauthorized:**
```json
{
  "success": false,
  "message": "Token invalide ou expiré",
  "error": {
    "code": "UNAUTHORIZED"
  }
}
```

**409 - Conflict:**
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
    "businessName": "John's Kitchen",
    "description": "Restaurant spécialités africaines",
    "businessAddress": "Rue de la Paix, Cotonou"
  }'
```

**Response (201):**
```json
{
  "success": true,
  "message": "Demande soumise, en attente de validation",
  "data": {
    "id": "702a3a2d-05cc-448a-a0ba-49ceee1fc616",
    "businessName": "John's Kitchen",
    "description": "Restaurant spécialités africaines",
    "businessAddress": "Rue de la Paix, Cotonou",
    "status": "PENDING",
    "rating": 0,
    "totalReviews": 0,
    "createdAt": "2026-02-17T17:50:00.000Z"
  }
}
```

**Note:** Le status `PENDING` signifie en attente d'approbation par l'admin.

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
  "message": "Profil fournisseur récupéré avec succès",
  "data": {
    "id": "702a3a2d-05cc-448a-a0ba-49ceee1fc616",
    "businessName": "John's Kitchen",
    "description": "Restaurant spécialités africaines",
    "businessAddress": "Rue de la Paix, Cotonou",
    "status": "PENDING",
    "rating": 0,
    "totalReviews": 0,
    "createdAt": "2026-02-17T17:50:00.000Z",
    "subscriptions": [],
    "meals": []
  }
}
```

---

### PUT /providers/me - Mettre à jour le profil fournisseur

```bash
curl -X PUT http://localhost:5000/api/v1/providers/me \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "John's Kitchen Updated",
    "description": "Nouvelles spécialités",
    "businessAddress": "Nouvelle adresse"
  }'
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
📧 Email: admin@juna.app
🔐 Mot de passe: ChangeMe123!
```

**Pour se connecter en tant qu'admin :**
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@juna.app","password":"ChangeMe123!"}'
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
      "businessName": "John's Kitchen",
      "description": "Restaurant spécialités africaines",
      "businessAddress": "Rue de la Paix, Cotonou",
      "status": "PENDING",
      "rating": 0,
      "totalReviews": 0,
      "createdAt": "2026-02-17T17:50:00.000Z"
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
  "message": "Fournisseur approuvé avec succès",
  "data": {
    "success": true,
    "message": "Fournisseur approuvé avec succès",
    "provider": {
      "id": "702a3a2d-05cc-448a-a0ba-49ceee1fc616",
      "businessName": "John's Kitchen",
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
  -d '{"message": "Documents incomplets"}'
```

---

### GET /admin/providers - Lister tous les fournisseurs

```bash
curl -X GET http://localhost:5000/api/v1/admin/providers \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

---

### GET /admin/dashboard - Statistiques du dashboard

```bash
curl -X GET http://localhost:5000/api/v1/admin/dashboard \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

---

## MEAL - Gestion des Repas

**Headers requis pour tous les endpoints MEAL:**
```
Authorization: Bearer <ACCESS_TOKEN> (doit être PROVIDER)
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

**Response (201):**
```json
{
  "success": true,
  "message": "Repas créé avec succès",
  "data": {
    "id": "uuid",
    "providerId": "uuid",
    "name": "Poulet Rôti",
    "description": "Poulet rôti aux épices africaines",
    "price": 2500,
    "imageUrl": "https://example.com/poulet.jpg",
    "mealType": "LUNCH",
    "isActive": true,
    "createdAt": "2026-02-17T17:55:00.000Z",
    "updatedAt": "2026-02-17T17:55:00.000Z"
  }
}
```

**Body Parameters:**
| Paramètre | Type | Description |
|-----------|------|-------------|
| name | string | Nom du repas (required, 2-100 chars) |
| description | string | Description (required, 5-500 chars) |
| price | number | Prix en XOF (required, min 100) |
| mealType | enum | BREAKFAST, LUNCH, DINNER, SNACK |
| imageUrl | string | URL de l'image |

---

### POST /meals - Erreur: Non provider (403)

```bash
curl -X POST http://localhost:5000/api/v1/meals \
  -H "Authorization: Bearer <USER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Unauthorized Meal",
    "description": "This should fail",
    "price": 1000,
    "mealType": "LUNCH"
  }'
```

**Response (403):**
```json
{
  "success": false,
  "message": "Vous devez être approuvé pour accéder à cette ressource",
  "error": {
    "code": "PROVIDER_NOT_APPROVED"
  }
}
```

---

### POST /meals - Erreur: Nom déjà utilisé (409)

```bash
curl -X POST http://localhost:5000/api/v1/meals \
  -H "Authorization: Bearer <PROVIDER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Poulet Rôti",
    "description": "Duplicate name test",
    "price": 2000,
    "mealType": "DINNER"
  }'
```

**Response (409):**
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

---

### GET /meals - Liste meals publics

```bash
curl -X GET http://localhost:5000/api/v1/meals
```

---

### GET /meals/:id - Détails d'un repas

```bash
curl -X GET http://localhost:5000/api/v1/meals/{{mealId}}
```

---

### PUT /meals/:id - Modifier un repas

```bash
curl -X PUT http://localhost:5000/api/v1/meals/{{mealId}} \
  -H "Authorization: Bearer <PROVIDER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Poulet Rôti Updated",
    "price": 2800
  }'
```

---

### PUT /meals/:id/toggle - Activer/Désactiver un repas

```bash
curl -X PUT http://localhost:5000/api/v1/meals/{{mealId}}/toggle \
  -H "Authorization: Bearer <PROVIDER_TOKEN>"
```

---

### DELETE /meals/:id - Supprimer un repas

```bash
curl -X DELETE http://localhost:5000/api/v1/meals/{{mealId}} \
  -H "Authorization: Bearer <PROVIDER_TOKEN>"
```

---

## SUBSCRIPTION - Gestion des Abonnements

**Headers requis pour tous les endpoints SUBSCRIPTION:**
```
Authorization: Bearer <ACCESS_TOKEN> (doit être PROVIDER pour créer/modifier)
```

---

### POST /subscriptions - Créer un abonnement

```bash
curl -X POST http://localhost:5000/api/v1/subscriptions \
  -H "Authorization: Bearer <PROVIDER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Menu Lunch Standard",
    "description": "Un lunch complet avec entrée, plat et dessert",
    "price": 3500,
    "type": "LUNCH",
    "category": "AFRICAN",
    "frequency": "DAILY",
    "isPublic": true,
    "mealIds": ["{{mealId}}"]
  }'
```

**Response (201):**
```json
{
  "success": true,
  "message": "Abonnement créé avec succès",
  "data": {
    "id": "uuid",
    "providerId": "uuid",
    "name": "Menu Lunch Standard",
    "description": "Un lunch complet avec entrée, plat et dessert",
    "price": 3500,
    "type": "LUNCH",
    "category": "AFRICAN",
    "frequency": "DAILY",
    "isActive": true,
    "isPublic": true,
    "subscriberCount": 0,
    "rating": 0,
    "createdAt": "2026-02-17T18:00:00.000Z",
    "updatedAt": "2026-02-17T18:00:00.000Z"
  }
}
```

**Body Parameters:**
| Paramètre | Type | Description |
|-----------|------|-------------|
| name | string | Nom de l'abonnement (required) |
| description | string | Description (required) |
| price | number | Prix en XOF (required, min 100) |
| type | enum | BREAKFAST, LUNCH, DINNER, SNACK, BREAKFAST_LUNCH, BREAKFAST_DINNER, LUNCH_DINNER, FULL_DAY, CUSTOM |
| category | enum | AFRICAN, EUROPEAN, ASIAN, AMERICAN, FUSION, VEGETARIAN, VEGAN, HALAL, OTHER |
| frequency | enum | DAILY, THREE_PER_WEEK, WEEKLY, BIWEEKLY, MONTHLY |
| isPublic | boolean |visible par les utilisateurs |
| mealIds | array | IDs des repas à inclure |

---

### GET /subscriptions - Liste abonnements publics

```bash
curl -X GET http://localhost:5000/api/v1/subscriptions
```

**Filtres disponibles:**
- `?type=LUNCH`
- `?category=AFRICAN`
- `?frequency=DAILY`
- `?minPrice=1000`
- `?maxPrice=5000`
- `?providerId=uuid`

---

### GET /subscriptions/me - Liste mes abonnements (provider)

```bash
curl -X GET http://localhost:5000/api/v1/subscriptions/me \
  -H "Authorization: Bearer <PROVIDER_TOKEN>"
```

---

### GET /subscriptions/:id - Détails d'un abonnement

```bash
curl -X GET http://localhost:5000/api/v1/subscriptions/{{subscriptionId}}
```

---

### PUT /subscriptions/:id - Modifier un abonnement

```bash
curl -X PUT http://localhost:5000/api/v1/subscriptions/{{subscriptionId}} \
  -H "Authorization: Bearer <PROVIDER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Menu Lunch Premium",
    "price": 4000
  }'
```

---

### PUT /subscriptions/:id/public - Publier/Dé-publier

```bash
curl -X PUT http://localhost:5000/api/v1/subscriptions/{{subscriptionId}}/public \
  -H "Authorization: Bearer <PROVIDER_TOKEN>"
```

---

### PUT /subscriptions/:id/toggle - Activer/Désactiver

```bash
curl -X PUT http://localhost:5000/api/v1/subscriptions/{{subscriptionId}}/toggle \
  -H "Authorization: Bearer <PROVIDER_TOKEN>"
```

---

### DELETE /subscriptions/:id - Supprimer un abonnement

```bash
curl -X DELETE http://localhost:5000/api/v1/subscriptions/{{subscriptionId}} \
  -H "Authorization: Bearer <PROVIDER_TOKEN>"
```

---

## Enum Values

### UserRole
- USER
- PROVIDER
- ADMIN
- SUPER_ADMIN

### ProviderStatus
- PENDING
- APPROVED
- REJECTED
- SUSPENDED

### MealType
- BREAKFAST
- LUNCH
- DINNER
- SNACK

### SubscriptionType
- BREAKFAST
- LUNCH
- DINNER
- SNACK
- BREAKFAST_LUNCH
- BREAKFAST_DINNER
- LUNCH_DINNER
- FULL_DAY
- CUSTOM

### SubscriptionCategory
- AFRICAN
- EUROPEAN
- ASIAN
- AMERICAN
- FUSION
- VEGETARIAN
- VEGAN
- HALAL
- OTHER

### SubscriptionFrequency
- DAILY
- THREE_PER_WEEK
- WEEKLY
- BIWEEKLY
- MONTHLY

### OrderStatus
- PENDING
- CONFIRMED
- PREPARING
- READY
- IN_DELIVERY
- DELIVERED
- COMPLETED
- CANCELLED
- REFUNDED

### PaymentStatus
- PENDING
- PROCESSING
- SUCCESS
- FAILED
- REFUNDED

### DeliveryMethod
- DELIVERY
- PICKUP
