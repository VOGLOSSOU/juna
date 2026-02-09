# Architecture du Projet JUNA

## Table des matieres

1. [Vue d'ensemble](#vue-densemble)
2. [La Base de Donnees](#la-base-de-donnees)
3. [Le Flux d'une Requete](#le-flux-dune-requete)
4. [Structure des Fichiers](#structure-des-fichiers)
5. [Les Entites et leurs Relations](#les-entites-et-leurs-relations)
6. [Explication Detaillee](#explication-detaillee)

---

## Vue d'ensemble

JUNA est une plateforme food delivery pour l'Afrique avec une architecture **Node.js + Express + TypeScript + PostgreSQL**.

```
┌─────────────────────────────────────────────────────────────┐
│                        JUNA APP                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐            │
│   │   User   │    │ Provider │    │   Admin   │            │
│   └────┬─────┘    └────┬─────┘    └────┬─────┘            │
│        │               │               │                    │
│        └───────────────┼───────────────┘                    │
│                        │                                    │
│                   Subscribe                                 │
│                        │                                    │
│        ┌───────────────┼───────────────┐                    │
│        │               │               │                    │
│   ┌────┴─────┐   ┌────┴─────┐   ┌────┴─────┐             │
│   │Order     │   │Payment   │   │Review     │             │
│   └──────────┘   └──────────┘   └──────────┘             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## La Base de Donnees

### Ou se trouve-t-elle ?

- **PostgreSQL** : Base de donnees relationnelle
- **Emplacement** : Ta machine locale (localhost) ou serveur distant
- **Connexion** : Configuree dans `juna-backend/.env`
  ```
  DATABASE_URL="postgresql://user:password@localhost:5432/juna_db"
  ```

### Les Tables (Entites)

| Table | Description |
|-------|-------------|
| **users** | Tous les utilisateurs (role: USER, PROVIDER, ADMIN) |
| **user_profiles** | Infos supplementaires (adresse, preferences) |
| **providers** | Infos business des fournisseurs |
| **subscriptions** | Abonnements repas |
| **orders** | Commandes |
| **payments** | Transactions |
| **reviews** | Avis |
| **tickets** | Support client |
| **notifications** | Notifications |
| **refresh_tokens** | Tokens JWT |
| **referrals** | Parrainage |
| **proposals** | Propositions personalisees |
| **admins** | Permissions admin |

### Visualisation des Relations

```
users (1)──────(1) user_profiles
   │
   ├──(1)──────(N) orders
   │
   ├──(1)──────(1) providers
   │
   ├──(1)──────(N) reviews
   │
   ├──(1)──────(N) tickets
   │
   └──(1)──────(N) notifications

providers (1)──────(N) subscriptions

subscriptions (1)──────(N) orders
                     (N) reviews

orders (1)──────(1) payments
```

---

## Le Flux d'une Requete

Quand tu fais une requete comme `GET /users/me`, voici ce qui se passe :

```
1. ROUTE              2. CONTROLLER         3. SERVICE
    │                     │                    │
    ▼                     ▼                    ▼
┌─────────┐          ┌──────────┐       ┌──────────┐
│ Recevoir│ ───────► │  Appeler │ ────► │  Logique │
│ requete │          │ service  │       │ business │
└─────────┘          └──────────┘       └──────────┘
                                                │
                                                ▼
4. REPOSITORY                            ┌──────────┐
    │                                    │   DB     │
    ▼                                    │ PostgreSQL
┌──────────┐                            └──────────┘
│  Prisma  │ ◄──────────────────────────────────────
│   ORM    │
└──────────┘
    │
    ▼
5. RESPONSE
┌──────────┐
│   Renvoi │ ◄──────────────────────────────────────
│  JSON    │
└──────────┘
```

### Exemple concret : PUT /users/me

```
curl -X PUT http://localhost:5000/api/v1/users/me \
  -H "Authorization: Bearer eyJhbG..." \
  -H "Content-Type: application/json" \
  -d '{"name": "Nathan V."}'

    │
    ▼
┌─────────────────────────────┐
│ 1. ROUTE (user.routes.ts)   │
│ ─────────────────────────── │
│ Match: PUT /users/me        │
│ Middleware: authenticate    │
│ Validation: updateProfileSchema
│ Controller: updateProfile() │
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│ 2. CONTROLLER (user.controller.ts)
│ ─────────────────────────── │
│ - Recupere userId du token │
│ - Appelle userService.updateProfile(userId, data)
│ - Renvoie la reponse JSON
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│ 3. SERVICE (user.service.ts)│
│ ─────────────────────────── │
│ - Verifie que user existe  │
│ - Valide les donnees       │
│ - Appelle userRepository.update()
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│ 4. REPOSITORY (user.repository.ts)
│ ─────────────────────────── │
│ - Prisma: prisma.user.update()
│ - SQL: UPDATE users SET ...
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│ 5. BASE DE DONNEES         │
│ ─────────────────────────── │
│ Mise a jour dans PostgreSQL│
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│ 6. RESPONSE                │
│ ─────────────────────────── │
│ {"success": true, ...}     │
└─────────────────────────────┘
```

---

## Structure des Fichiers

```
juna-backend/
├── prisma/
│   ├── schema.prisma       # DEFINITION DE LA BASE DE DONNEES
│   └── migrations/         # Historique des modifications
│
├── src/
│   ├── app.ts              # Configuration Express
│   ├── server.ts           # Point d'entree (npm start)
│   │
│   ├── config/
│   │   ├── database.ts     # Connexion Prisma
│   │   ├── redis.ts        # Connexion Redis (cache)
│   │   └── env.ts          # Variables d'environnement
│   │
│   ├── routes/             # DEFINITION DES ROUTES
│   │   ├── index.ts        # Mount toutes les routes
│   │   ├── auth.routes.ts  # POST /auth/register, /auth/login
│   │   └── user.routes.ts  # GET/PUT/DELETE /users/me
│   │
│   ├── controllers/        # GESTION DES REQUETES HTTP
│   │   ├── auth.controller.ts
│   │   └── user.controller.ts
│   │
│   ├── services/           # LOGIQUE METIER
│   │   ├── auth.service.ts
│   │   └── user.service.ts
│   │
│   ├── repositories/       # ACCES A LA BASE DE DONNEES
│   │   ├── user.repository.ts
│   │   └── ...
│   │
│   ├── validators/         # VALIDATION DES DONNEES (Zod)
│   │   ├── auth.validator.ts
│   │   └── user.validator.ts
│   │
│   ├── types/              # TYPES TYPESCRIPT
│   │   ├── auth.types.ts
│   │   └── user.types.ts
│   │
│   ├── middlewares/        # FONCTIONS INTERMEDIAIRES
│   │   ├── auth.middleware.ts    # Verifie le token JWT
│   │   ├── validation.middleware.ts # Valide avec Zod
│   │   └── error.middleware.ts   # Gestion erreurs
│   │
│   ├── utils/             # FONCTIONS UTILITAIRES
│   │   ├── jwt.util.ts           # Sign/verify tokens
│   │   ├── hash.util.ts          # bcrypt passwords
│   │   └── response.util.ts      # Format reponse JSON
│   │
│   └── constants/          # CONSTANTES
│       ├── errors.ts       # Codes d'erreurs
│       ├── messages.ts     # Messages de succes
│       └── roles.ts        # USER, PROVIDER, ADMIN
│
├── .env                    # Variables sensibles (PAS commit)
└── package.json            # Dependances du projet
```

---

## Les Entites et leurs Relations

### USER (Utilisateur)

**Fichier** : `prisma/schema.prisma`

```
users
├── id: UUID
├── email: String (unique)
├── password: String (hashed)
├── name: String
├── phone: String (unique, optional)
├── role: USER | PROVIDER | ADMIN
├── isVerified: Boolean
├── isActive: Boolean
└── createdAt, updatedAt: DateTime

Relations:
- 1 user → 1 user_profile (informations supplementaires)
- 1 user → N orders (commandes passees)
- 1 user → N reviews (avis donnes)
- 1 user → N tickets (support)
- 1 user → 1 provider (si role = PROVIDER)
- 1 user → N notifications (recu)
```

### PROVIDER (Fournisseur)

```
providers
├── id: UUID
├── userId: UUID (lien vers users)
├── businessName: String
├── description: Text
├── businessAddress: String
├── documentUrl: String (registre de commerce)
├── status: PENDING | APPROVED | REJECTED
├── rating: Float (note moyenne)
└── createdAt, updatedAt: DateTime

Workflow:
1. USER fait POST /providers/register
2. Provider cree avec status = PENDING
3. ADMIN valide (PUT /admin/providers/:id/approve)
4. status = APPROVED + user.role = PROVIDER
```

### SUBSCRIPTION (Abonnement)

```
subscriptions
├── id: UUID
├── providerId: UUID
├── name: String
├── description: Text
├── category: AFRICAN | EUROPEAN | ASIAN...
├── cuisine: String
├── price: Float
├── frequency: DAILY | WEEKLY | MONTHLY...
├── mealType: BREAKFAST | LUNCH | DINNER
├── isActive: Boolean
├── isPublic: Boolean
└── deliveryZones, pickupLocations: JSON
```

### ORDER (Commande)

```
orders
├── id: UUID
├── userId: UUID
├── subscriptionId: UUID
├── orderNumber: String (unique, ex: ORD-2025-001)
├── amount: Float
├── status: PENDING | CONFIRMED | PREPARING | READY | DELIVERED | COMPLETED | CANCELLED
├── deliveryMethod: DELIVERY | PICKUP
├── deliveryAddress: String
├── qrCode: String (unique, pour retrait)
└── scheduledFor: DateTime
```

---

## Explication Detaillee

### 1. Les ROUTES (Ou ?)

**Fichier** : `src/routes/*.routes.ts`

Les routes definissent :
- L'URL de l'endpoint
- La methode HTTP (GET, POST, PUT, DELETE)
- Les middlewares a appliquer
- Le controller a appeler

```typescript
// src/routes/user.routes.ts
router.put(
  '/me',                                    // URL: PUT /users/me
  authenticate,                            // Middleware: verifier token
  validate(updateProfileSchema),             // Middleware: valider donnees
  userController.updateProfile.bind(userController)  // Controller
);
```

### 2. Les CONTROLLERS (Qui ?)

**Fichier** : `src/controllers/*.controller.ts`

Le controller :
- Recupere les donnees de la requete (req.body, req.params)
- Appelle le service approprie
- Gere les erreurs avec try/catch
- Renvoie la reponse JSON

```typescript
// src/controllers/user.controller.ts
async updateProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user!.id;        // Du token JWT
    const data = req.body;                        // Du body JSON
    const result = await userService.updateProfile(userId, data);
    sendSuccess(res, SUCCESS_MESSAGES.PROFILE_UPDATED, result);
  } catch (error) {
    next(error);                                  // Au middleware d'erreur
  }
}
```

### 3. Les SERVICES (Quoi ?)

**Fichier** : `src/services/*.service.ts`

Le service contient la **logique metier** :
- Validation des regles de gestion
- Appels au repository
- Transformations de donnees

```typescript
// src/services/user.service.ts
async updateProfile(userId: string, data: UpdateProfileDTO) {
  // 1. Verifier que l'utilisateur existe
  const user = await userRepository.findById(userId);
  if (!user) throw new NotFoundError('User not found');

  // 2. Verifier telephone unique (si change)
  if (data.phone && data.phone !== user.phone) {
    const phoneExists = await userRepository.findByPhone(data.phone);
    if (phoneExists) throw new ConflictError('Phone already used');
  }

  // 3. Mettre a jour
  await userRepository.update(userId, { name: data.name, phone: data.phone });

  // 4. Retourner le profil mis a jour
  return this.getProfile(userId);
}
```

### 4. Les REPOSITORIES (Comment ?)

**Fichier** : `src/repositories/*.repository.ts`

Le repository est la **couche d'acces a la base de donnees** :
- Utilise Prisma ORM
- Execute les requetes SQL
- Retourne les donnees brutes

```typescript
// src/repositories/user.repository.ts
async update(id: string, data: Prisma.UserUpdateInput) {
  return prisma.user.update({
    where: { id },
    data,
  });
}
```

### 5. Les VALIDATORS (Validation)

**Fichier** : `src/validators/*.validator.ts`

Les validators utilisent **Zod** pour valider les entrees :

```typescript
// src/validators/user.validator.ts
export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
});
```

### 6. Les MIDDLEWARES

**Fichier** : `src/middlewares/`

| Middleware | Role |
|------------|------|
| **auth.middleware.ts** | Verifie le token JWT, recupere le user |
| **validation.middleware.ts** | Valide le body avec Zod |
| **error.middleware.ts** | Capture les erreurs, renvoie JSON |
| **rateLimiter.middleware.ts** | Limite le nombre de requetes |
| **logger.middleware.ts** | Log chaque requete |

```typescript
// src/middlewares/auth.middleware.ts
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  const payload = verifyToken(token);  // jwt.util.ts
  (req as any).user = payload;        // Ajoute user a la requete
  next();
};
```

---

## Resume du Flux Complet

```
┌────────────────────────────────────────────────────────────────┐
│                        CLIENT (curl, Postman, Frontend)        │
└──────────────────────────┬─────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────────┐
│  1. ROUTER (Express)                                           │
│  - Reconnait l'URL et la methode                               │
│  - Applique les middlewares                                    │
└──────────────────────────┬─────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────────┐
│  2. MIDDLEWARE AUTH                                            │
│  - Verifie le token JWT                                        │
│  - Extrait userId du token                                     │
└──────────────────────────┬─────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────────┐
│  3. MIDDLEWARE VALIDATION                                      │
│  - Valide le body avec Zod                                     │
│  - Renvoie 400 si invalide                                     │
└──────────────────────────┬─────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────────┐
│  4. CONTROLLER                                                 │
│  - Appelle le service                                          │
│  - Gere les erreurs (try/catch)                                │
└──────────────────────────┬─────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────────┐
│  5. SERVICE                                                     │
│  - Logique metier                                              │
│  - Appelle le repository                                       │
└──────────────────────────┬─────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────────┐
│  6. REPOSITORY                                                  │
│  - Prisma ORM                                                   │
│  - Execute les requetes SQL                                    │
└──────────────────────────┬─────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────────┐
│  7. BASE DE DONNEES (PostgreSQL)                               │
│  -INSERT / UPDATE / SELECT / DELETE                            │
└──────────────────────────┬─────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────────┐
│  8. RESPONSE (JSON)                                            │
│  - { "success": true, "data": ... }                           │
└────────────────────────────────────────────────────────────────┘
```

---

## Demarrer et Gerer la Base de Donnees

### 1. Demarrer PostgreSQL

**Si tu utilises Docker :**
```bash
docker-compose up -d
```

**Si PostgreSQL est installe localement :**
```bash
# Sur Linux (systemd)
sudo systemctl start postgresql

# Sur macOS
brew services start postgresql
```

### 2. Voir la Base de Donnees dans le Navigateur

```bash
cd juna-backend
npx prisma studio
```

Cela ouvre une interface graphique a l'adresse :
```
http://localhost:5555
```

Tu peux :
- Voir toutes les tables
- Explorer les donnees
- Modifier des enregistrements
- Executer des requetes

### 3. Commandes Prisma Utiles

```bash
# Appliquer les migrations (creer les tables)
npx prisma migrate dev

# Reinitialiser la base de donnees (ATTENTION: supprime tout)
npx prisma migrate reset

# Generer le client Prisma
npx prisma generate

# Voir les requetes SQL dans les logs
npx prisma migrate deploy --preview-feature
```

### 4. Demarrer le Serveur API

Dans un autre terminal :
```bash
cd juna-backend
npm run dev
```

Le serveur tourne sur : `http://localhost:5000`

---

## Commandes Utiles (Rappel)

```bash
# Demarrer le serveur
npm run dev

# Appliquer les migrations DB
npx prisma migrate dev

# Voir la base de donnees (GUI)
npx prisma studio

# Verifier les types TypeScript
npx tsc --noEmit

# Lancer les tests
npm test
```

---

## Prochaines Etapes

| Module | Status |
|--------|--------|
| AUTH | ✅ Termine |
| USER | ✅ Termine |
| PROVIDER | ✅ Termine | TESTÉ ✅
| SUBSCRIPTION | A faire |
| ORDER | A faire |
| PAYMENT | A faire |
| ADMIN | Prochaine etape |
