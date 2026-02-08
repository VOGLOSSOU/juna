#  Juna - Backend API

## Présentation

**Juna** est une plateforme permettant aux utilisateurs de souscrire à des abonnements de nourriture préétablis ou personnalisés, géolocalisés et adaptés à leurs besoins. Le projet intègre la suggestion, la validation, la souscription, le paiement, la livraison ou le retrait, les avis et le service client.

###  Objectifs du Backend

- Fournir une API REST robuste, scalable et sécurisée
- Gérer l'authentification et les autorisations des utilisateurs
- Orchestrer les abonnements, paiements et livraisons
- Gérer les propositions d'abonnements personnalisés
- Fournir un système d'avis et de support client
- Offrir un back-office complet pour l'administration

---

## Stack Technique

### Core Backend
- **Runtime** : Node.js v18+ (LTS)
- **Framework** : Express.js
- **Langage** : TypeScript
- **ORM** : Prisma

### Bases de données
- **Principal** : PostgreSQL (données relationnelles)
- **Cache & Queue** : Redis (sessions, cache, jobs)

### Sécurité & Auth
- **JWT** : jsonwebtoken (Access + Refresh tokens)
- **Hash** : bcrypt (mots de passe)
- **Headers** : helmet (sécurité HTTP)
- **CORS** : cors (origines autorisées)
- **Rate Limiting** : express-rate-limit

### Validation & Qualité
- **Validation** : Zod (schémas de validation)
- **Logging** : Winston (logs structurés)
- **Tests** : Jest + Supertest
- **Linting** : ESLint + Prettier

### Jobs Asynchrones
- **Queue** : Bull (Redis-based)

### Documentation
- **API Docs** : Swagger UI + swagger-jsdoc

### DevOps
- **Conteneurisation** : Docker + Docker Compose
- **CI/CD** : GitHub Actions
- **Environnements** : dotenv

---

##  Architecture

### Pattern : Architecture en Couches

```
┌─────────────────────────────────────────────────┐
│                   ROUTES                        │
│          (Définition des endpoints)             │
└───────────────────┬─────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│                MIDDLEWARES                      │
│    (Auth, Validation, Rate Limit, Errors)       │
└───────────────────┬─────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│                CONTROLLERS                      │
│     (Gestion des requêtes/réponses HTTP)        │
└───────────────────┬─────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│                 SERVICES                        │
│          (Logique métier pure)                  │
└───────────────────┬─────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│               REPOSITORIES                      │
│        (Accès données via Prisma)               │
└───────────────────┬─────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│              PostgreSQL / Redis                 │
└─────────────────────────────────────────────────┘
```

### Principe de Séparation des Responsabilités

- **Routes** : Définissent les endpoints et appliquent les middlewares
- **Middlewares** : Authentification, validation, gestion d'erreurs
- **Controllers** : Reçoivent la requête → appellent le service → renvoient la réponse
- **Services** : Contiennent toute la logique métier
- **Repositories** : Interagissent avec la base de données via Prisma

---

## Installation & Setup

### Prérequis

- Node.js v18+ (LTS)
- PostgreSQL 14+
- Redis 7+
- npm

### Installation

```bash
# Cloner le repository
git clone https://github.com/VOGLOSSOU/juna.git
cd juna

# Installer les dépendances
npm install

# Copier le fichier d'environnement
cp .env.example .env

# Configurer les variables d'environnement (voir section suivante)
nano .env
```

### Variables d'Environnement

Créer un fichier `.env` à la racine du projet :

```env
# Application
NODE_ENV=development
PORT=5000
API_VERSION=v1

# Database (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/juna_db?schema=public"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_ACCESS_SECRET=your_super_secret_access_key_here
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# CORS
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info

# À ajouter plus tard :
# STRIPE_SECRET_KEY=
# CLOUDINARY_CLOUD_NAME=
# CLOUDINARY_API_KEY=
# CLOUDINARY_API_SECRET=
# SENDGRID_API_KEY=
# GOOGLE_MAPS_API_KEY=
```

### Setup de la Base de Données

```bash
# Générer le client Prisma
npx prisma generate

# Créer et appliquer les migrations
npx prisma migrate dev --name init

# (Optionnel) Seed la DB avec des données de test
npx prisma db seed
```

### Lancer l'Application

```bash
# Mode développement (avec hot reload)
npm run dev

# Mode production
npm run build
npm start
```

### Avec Docker

```bash
# Lancer tous les services (API, PostgreSQL, Redis)
docker-compose up -d

# Voir les logs
docker-compose logs -f api

# Arrêter les services
docker-compose down
```

---

## 📜 Scripts NPM

```json
{
  "scripts": {
    "dev": "nodemon --exec ts-node src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "jest --coverage",
    "test:watch": "jest --watch",
    "test:integration": "jest --testPathPattern=integration",
    "lint": "eslint . --ext .ts",
    "lint:fix": "eslint . --ext .ts --fix",
    "format": "prettier --write \"src/**/*.ts\"",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio",
    "prisma:seed": "ts-node prisma/seed.ts"
  }
}
```

---

## 🔐 Authentification & Autorisation

### Flux JWT

1. **Inscription** : `POST /api/v1/auth/register`
   - Hash du mot de passe avec bcrypt
   - Création du user en DB
   - Retourne Access Token + Refresh Token

2. **Connexion** : `POST /api/v1/auth/login`
   - Vérification email + mot de passe
   - Génération Access Token (15min) + Refresh Token (7j)
   - Refresh Token stocké en DB/Redis

3. **Refresh Token** : `POST /api/v1/auth/refresh`
   - Valide le Refresh Token
   - Génère un nouveau Access Token

4. **Déconnexion** : `POST /api/v1/auth/logout`
   - Révoque le Refresh Token

### Middleware d'Authentification

```typescript
// Utilisation dans les routes
router.get('/profile', authenticate, getUserProfile);
router.put('/profile', authenticate, updateUserProfile);

// Avec vérification de rôle
router.get('/admin/users', authenticate, authorize(['ADMIN']), getAllUsers);
```

### Rôles

- `USER` : Utilisateur standard
- `PROVIDER` : Fournisseur de repas
- `ADMIN` : Administrateur
- `SUPER_ADMIN` : Super administrateur

---

## ✅ Validation des Données

Toutes les données entrantes sont validées avec **Zod** avant traitement.

### Exemple de Schéma

```typescript
// src/validators/user.validator.ts
import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Email invalide'),
    password: z.string().min(8, 'Minimum 8 caractères'),
    name: z.string().min(2, 'Minimum 2 caractères'),
    phone: z.string().regex(/^[+]?[\d\s-]+$/, 'Numéro invalide')
  })
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    phone: z.string().regex(/^[+]?[\d\s-]+$/).optional(),
    address: z.string().optional()
  })
});
```

---

## 🛡️ Sécurité

### Mesures Implémentées

- **Helmet** : Headers HTTP sécurisés
- **CORS** : Origines autorisées configurables
- **Rate Limiting** : Protection contre brute force et spam
- **JWT** : Tokens avec expiration courte
- **Bcrypt** : Hash des mots de passe (cost factor 10)
- **Validation** : Toutes les entrées validées avec Zod
- **SQL Injection** : Protégé par Prisma (requêtes paramétrées)
- **XSS** : Sanitization des inputs

### Recommandations

- Ne JAMAIS commiter le fichier `.env`
- Utiliser des secrets forts pour JWT
- Implémenter 2FA pour les admins (v2)
- Logger tous les accès sensibles
- Auditer régulièrement les dépendances (`npm audit`)

---

## 📊 Logging

Logs structurés avec **Winston** :

```typescript
// Niveaux de logs
logger.error('Message d\'erreur', { context: 'auth', userId: 123 });
logger.warn('Tentative de connexion échouée', { email: 'user@example.com' });
logger.info('Nouvel abonnement créé', { subscriptionId: 456 });
logger.debug('Détails de la requête', { body: req.body });
```

### Format

```json
{
  "timestamp": "2025-12-20T10:30:00.000Z",
  "level": "info",
  "message": "Nouvel abonnement créé",
  "context": "subscription",
  "subscriptionId": 456
}
```

---

## 🧪 Tests

### Lancer les Tests

```bash
# Tous les tests
npm test

# Tests unitaires uniquement
npm run test:unit

# Tests d'intégration
npm run test:integration

# Mode watch (développement)
npm run test:watch

# Avec coverage
npm run test -- --coverage
```

### Structure des Tests

```typescript
// tests/unit/services/auth.service.test.ts
describe('AuthService', () => {
  describe('register', () => {
    it('devrait créer un nouvel utilisateur', async () => {
      // Arrange
      const userData = { email: 'test@example.com', password: '12345678' };
      
      // Act
      const result = await authService.register(userData);
      
      // Assert
      expect(result).toHaveProperty('id');
      expect(result.email).toBe(userData.email);
    });

    it('devrait lever une erreur si email existe déjà', async () => {
      // ...
    });
  });
});
```

### Objectif de Coverage

- **Minimum** : 70%
- **Recommandé** : 80%+
- **Focus** : Services et utils (logique métier)

---

## 📚 Documentation API

### Swagger UI

Accessible à : `http://localhost:5000/api-docs`

### Format des Réponses

Toutes les réponses suivent ce format :

```typescript
// Succès
{
  "success": true,
  "message": "Opération réussie",
  "data": { /* ... */ }
}

// Erreur
{
  "success": false,
  "message": "Description de l'erreur",
  "error": {
    "code": "ERROR_CODE",
    "details": { /* ... */ }
  }
}
```

### Codes HTTP

- `200` : Succès (GET, PUT, PATCH)
- `201` : Créé (POST)
- `204` : Succès sans contenu (DELETE)
- `400` : Requête invalide (validation échouée)
- `401` : Non authentifié
- `403` : Non autorisé (permissions insuffisantes)
- `404` : Ressource non trouvée
- `409` : Conflit (ex: email déjà utilisé)
- `422` : Entité non traitable
- `429` : Trop de requêtes (rate limit)
- `500` : Erreur serveur

---

## 🔄 Jobs Asynchrones

Utilisation de **Bull** pour les tâches en arrière-plan :

### Exemples de Jobs

- Envoi d'emails de bienvenue
- Génération de tickets/QR codes
- Notifications push
- Renouvellement automatique des abonnements
- Génération de rapports

### Configuration

```typescript
// src/queues/email.queue.ts
import Queue from 'bull';

export const emailQueue = new Queue('email', {
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT)
  }
});

// Ajouter un job
await emailQueue.add('welcome-email', {
  to: user.email,
  name: user.name
});

// Processer le job
emailQueue.process('welcome-email', async (job) => {
  await sendEmail(job.data);
});
```

---

## 🔧 Conventions de Code

### Naming Conventions

- **Fichiers** : `kebab-case.ts` (ex: `user.service.ts`)
- **Classes** : `PascalCase` (ex: `UserService`)
- **Fonctions/Variables** : `camelCase` (ex: `getUserById`)
- **Constantes** : `UPPER_SNAKE_CASE` (ex: `MAX_LOGIN_ATTEMPTS`)
- **Interfaces** : `PascalCase` avec préfixe `I` (ex: `IUser`)
- **Types** : `PascalCase` (ex: `UserRole`)

### Structure des Fonctions

```typescript
// ✅ Bon
async function createSubscription(data: CreateSubscriptionDTO): Promise<Subscription> {
  // 1. Validation (déjà faite par middleware, mais double-check si besoin)
  
  // 2. Logique métier
  const subscription = await subscriptionRepository.create(data);
  
  // 3. Side effects (emails, notifications)
  await emailQueue.add('subscription-created', { subscriptionId: subscription.id });
  
  // 4. Return
  return subscription;
}
```

### Gestion des Erreurs

```typescript
// Utiliser des erreurs custom
throw new BadRequestError('Email déjà utilisé');
throw new UnauthorizedError('Token invalide');
throw new NotFoundError('Abonnement introuvable');
```

### Commits Git

Format : `type(scope): message`

Types :
- `feat` : Nouvelle fonctionnalité
- `fix` : Correction de bug
- `docs` : Documentation
- `style` : Formatage
- `refactor` : Refactorisation
- `test` : Tests
- `chore` : Tâches (dépendances, config...)

Exemples :
```
feat(auth): ajouter refresh token
fix(subscription): corriger calcul du prix
docs(readme): mettre à jour les instructions d'installation
```

---

## 🗺️ Roadmap

### Phase 1 : MVP 
- [x] Setup projet & architecture
- [ ] Authentification & gestion utilisateurs
- [ ] CRUD abonnements
- [ ] Système de propositions personnalisées
- [ ] Système d'avis
- [ ] Back-office admin basique

### Phase 2 : Paiements & Livraison 
- [ ] Intégration paiements (Stripe, Mobile Money)
- [ ] Gestion des commandes
- [ ] Génération tickets/QR codes
- [ ] Système de retrait sur place

### Phase 3 : Features Avancées 
- [ ] Géolocalisation & zones de livraison
- [ ] Upload de fichiers (photos)
- [ ] Notifications push & emails
- [ ] Système de suivi de livraison
- [ ] Dashboard fournisseurs

### Phase 4 : Optimisation & Scale (continu)
- [ ] Monitoring & analytics
- [ ] Optimisation performances
- [ ] Tests de charge
- [ ] Documentation exhaustive

---


##  Licence

Nathan VOGLOSSOU

---
