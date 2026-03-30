# Juna — Backend API

## Présentation

**Juna** est une plateforme d'abonnement repas en Afrique de l'Ouest. Les utilisateurs souscrivent à des plans repas proposés par des prestataires locaux (cuisinières, restaurants), avec livraison à domicile ou retrait sur place.

---

## Stack Technique

| Catégorie | Technologie |
|-----------|-------------|
| Runtime | Node.js v18+ |
| Framework | Express.js |
| Langage | TypeScript |
| ORM | Prisma |
| Base de données | PostgreSQL |
| Cache | Redis |
| Auth | JWT (Access 15min + Refresh 7j) |
| Hash | bcrypt |
| Validation | Zod |
| Upload | Cloudinary |
| Logging | Winston |
| Tests | Jest + Supertest |

---

## Architecture

```
Routes → Middlewares → Controllers → Services → Repositories → PostgreSQL
```

- **Routes** : endpoints + middlewares
- **Middlewares** : auth, validation, rate limit, erreurs
- **Controllers** : gestion HTTP
- **Services** : logique métier
- **Repositories** : accès données via Prisma

---

## Installation

### Prérequis

- Node.js v18+
- PostgreSQL 14+
- Redis 7+

### Setup

```bash
# Installer les dépendances
cd juna-backend
npm install

# Copier et configurer les variables d'environnement
cp .env.example .env

# Appliquer le schéma en base
npx prisma db push

# Créer le compte admin
npx ts-node -r tsconfig-paths/register prisma/seed.ts
```

### Lancer le serveur

```bash
# Développement
npm run dev

# Production
npm run build && npm start
```

---

## Variables d'Environnement

```env
# App
NODE_ENV=development
PORT=5000
API_VERSION=v1

# Base de données
DATABASE_URL="postgresql://user:password@localhost:5432/juna_db?schema=public"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Cloudinary (upload images)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Admin (seed)
ADMIN_EMAIL=admin@juna.app
ADMIN_PASSWORD=ChangeMe123!

# CORS
CORS_ORIGIN=http://localhost:3000

# Upload
MAX_FILE_SIZE=5242880
```

---

## Authentification

Flux JWT standard :

1. `POST /api/v1/auth/register` — Créer un compte
2. `POST /api/v1/auth/login` — Connexion → Access Token (15min) + Refresh Token (7j)
3. `POST /api/v1/auth/refresh` — Renouveler l'Access Token
4. `POST /api/v1/auth/logout` — Révoquer le Refresh Token

Rôles : `USER` · `PROVIDER` · `ADMIN` · `SUPER_ADMIN`

---

## Format des Réponses

```json
// Succès
{ "success": true, "message": "...", "data": { } }

// Erreur
{ "success": false, "message": "...", "error": { "code": "ERROR_CODE" } }
```

---

## Documentation API

La documentation complète de tous les endpoints (avec exemples de requêtes et réponses réelles) est dans :

```
api-documentation.md
```

---

## État du Projet

### Modules fonctionnels (testés)

| Module | Endpoints |
|--------|-----------|
| Auth | register, login, refresh, logout, me, change-password |
| Profil user | update, localisation |
| Provider | register, profil, update |
| Admin | approve, reject, suspend, list providers, list users |
| Repas | CRUD complet |
| Abonnements | CRUD complet |
| Découverte | list public, filtres, get by ID |
| Commandes | create, confirm, ready, delivered, cancel |
| Reviews | create, update, delete, list, moderate |
| Upload | Cloudinary (avatars, meals, providers, subscriptions, documents) |

### Reste à faire

Voir [reste-a-faire.md](reste-a-faire.md)

---

## Sécurité

- Helmet (headers HTTP)
- CORS configuré
- Rate limiting
- JWT à expiration courte
- bcrypt (cost factor 10)
- Validation Zod sur toutes les entrées
- Prisma (protection injection SQL)

Ne jamais commiter le fichier `.env`.

---

## Licence

Nathan VOGLOSSOU
