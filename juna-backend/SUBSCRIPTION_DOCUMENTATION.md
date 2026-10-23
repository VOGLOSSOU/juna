# Module Abonnement JUNA - Architecture Définitive

> **Version** : 3.0.0
> **Date** : 2025-01-11
> **Status** : VALIDÉ

---

##  Principe Fondamental

> **IMPORTANT** : La plateforme JUNA ne vend que des **abonnements**. Même un fournisseur avec un seul plat doit créer un abonnement pour le vendre.

---

## ENTITÉ : MEAL (Repas)

### Définition
Un **Meal** représente un plat individuel publié par un fournisseur. Chaque meal a un **MealType** qui identifie son type.

### Structure Prisma
```prisma
model Meal {
  id          String    @id @default(uuid())
  providerId  String
  name        String
  description String    @db.Text
  price       Float     // Prix unitaire (référence interne uniquement)
  imageUrl    String?
  mealType    MealType  // BREAKFAST, LUNCH, DINNER, SNACK
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  // Relations
  provider    Provider              @relation(fields: [providerId], references: [id], onDelete: Cascade)
  mealsInSubscriptions SubscriptionMeal[]
}
```

### Caractéristiques
- **MealType** identifie le type de repas (BREAKFAST, LUNCH, DINNER, SNACK)
- Prix unitaire = **référence interne uniquement**
- Pas facturé séparément lors d'une souscription
- Utilisé pour composer les abonnements

---

## 📦 ENTITÉ : SUBSCRIPTION (Abonnement)

### Définition
Un **Subscription** est un pack proposé par un fournisseur contenant 1 ou plusieurs meals selon son **Type**.

### Structure Prisma
```prisma
model Subscription {
  id               String    @id @default(uuid())
  providerId       String
  name             String
  description      String    @db.Text
  price           Float     // Prix global de l'abonnement (facturé)
  type             SubscriptionType  // Type d'abonnement (BREAKFAST, LUNCH, etc.)
  category         SubscriptionCategory  // Cuisine (AFRICAN, EUROPEAN, etc.)
  frequency        SubscriptionFrequency
  isActive         Boolean   @default(true)
  isPublic         Boolean   @default(true)
  deliveryZones    Json?     // Zones de livraison
  pickupLocations  Json?     // Points de retrait
  imageUrl         String?
  subscriberCount   Int       @default(0)
  rating           Float     @default(0)
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  // Relations
  provider         Provider              @relation(fields: [providerId], references: [id], onDelete: Cascade)
  mealsInSubscriptions SubscriptionMeal[]
  orders           Order[]
}
```

### Table de liaison : SubscriptionMeal
```prisma
model SubscriptionMeal {
  id             String      @id @default(uuid())
  subscriptionId String
  mealId         String
  quantity       Int         @default(1)

  // Relations
  subscription   Subscription @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)
  meal           Meal        @relation(fields: [mealId], references: [id], onDelete: Cascade)

  @@unique([subscriptionId, mealId])
}
```

---

## 📋 Énumérations

### MealType (pour les Meals)
```typescript
enum MealType {
  BREAKFAST  // Petit-déjeuner
  LUNCH      // Déjeuner
  DINNER     // Dîner
  SNACK      // Collation
}
```

### SubscriptionType (Type d'abonnement)
```typescript
enum SubscriptionType {
  // Types simples
  BREAKFAST         // Meals Breakfast uniquement
  LUNCH             // Meals Lunch uniquement
  DINNER            // Meals Dinner uniquement
  SNACK             // Meals Snack uniquement
  
  // Combinaisons
  BREAKFAST_LUNCH   // Breakfast + Lunch
  BREAKFAST_DINNER  // Breakfast + Dinner
  LUNCH_DINNER      // Lunch + Dinner
  FULL_DAY          // Breakfast + Lunch + Dinner
  
  // Spécial
  CUSTOM            // Combinaison flexible définie par le fournisseur
}
```

### SubscriptionCategory (Cuisine)
```typescript
enum SubscriptionCategory {
  AFRICAN    // Cuisine africaine
  EUROPEAN   // Cuisine européenne
  ASIAN      // Cuisine asiatique
  AMERICAN   // Cuisine américaine
  FUSION     // Cuisine fusion
  VEGETARIAN // Végétarien
  VEGAN      // Végan
  HALAL      // Halal
  OTHER      // Autre
}
```

### SubscriptionFrequency (Fréquence)
```typescript
enum SubscriptionFrequency {
  DAILY
  THREE_PER_WEEK
  WEEKLY
  BIWEEKLY
  MONTHLY
}
```

---

## 📋 RÈGLES DE VALIDATION

### Règle Générale
> **Un abonnement de type T ne peut contenir que des meals de type T**

| Subscription.type | Meals Autorisés |
|-------------------|-----------------|
| BREAKFAST | Meals BREAKFAST uniquement |
| LUNCH | Meals LUNCH uniquement |
| DINNER | Meals DINNER uniquement |
| SNACK | Meals SNACK uniquement |
| BREAKFAST_LUNCH | Meals BREAKFAST + Meals LUNCH |
| BREAKFAST_DINNER | Meals BREAKFAST + Meals DINNER |
| LUNCH_DINNER | Meals LUNCH + Meals DINNER |
| FULL_DAY | 1 BREAKFAST + 1 LUNCH + 1 DINNER |
| CUSTOM | Tous types mélangés (selon définition provider) |

### Exemples Valides
```
Subscription(type: LUNCH) → 2 meals LUNCH
Subscription(type: FULL_DAY) → 1 BREAKFAST + 1 LUNCH + 1 DINNER
Subscription(type: CUSTOM) → Mix libre défini par provider
```

### Exemples Invalides
```
❌ Subscription(type: LUNCH) + meal BREAKFAST
❌ Subscription(type: FULL_DAY) avec 2 DINNER
```

---

## ✅ VALIDATION OBLIGATOIRE (avant publication)

Un abonnement **NE PEUT PAS** être publié si :

| Condition | Description |
|-----------|-------------|
| ❌ 0 meals | Au moins 1 meal requis |
| ❌ Prix non défini | `price` doit être > 0 |
| ❌ Fréquence non configurée | `frequency` requis |
| ❌ Composition invalide | Les meals doivent correspondre au `type` |

---

## 💰 MODÈLE DE TARIFICATION

### Principe
- **Prix du meal** : Référence interne (non facturé)
- **Prix de l'abonnement** : Prix global fixé par le fournisseur

### Exemple : Restaurant sénégalais (Category: AFRICAN)

| Subscription.type | Meal inclus | Fréquence | Prix |
|------------------|-------------|-----------|------|
| LUNCH | 1 Thieboudienne | DAILY | 2 500 XOF |
| LUNCH_DINNER | 1 Thieboudienne + 1 Yassa | WEEKLY | 10 000 XOF |
| FULL_DAY | 3 repas variés | WEEKLY | 15 000 XOF |

---

## 🔄 WORKFLOW COMPLET

### 1. Provider publie des Meals
```
POST /providers/me/meals
[
  {
    "name": "Thieboudienne",
    "description": "Plat sénégalais au poisson",
    "price": 2500,
    "mealType": "LUNCH"
  },
  {
    "name": "Yassa Poulet",
    "description": "Poulet mariné aux oignons",
    "price": 2500,
    "mealType": "LUNCH"
  },
  {
    "name": "Soupou Fonda",
    "description": "Soupou au poisson fumé",
    "price": 2000,
    "mealType": "DINNER"
  }
]
```

### 2. Provider crée un Abonnement
```
POST /providers/me/subscriptions
{
  "name": "Pack Senegalais Complet",
  "description": "Découvrez la cuisine sénégalaise : Thieboudienne, Yassa, et plus encore",
  "price": 15000,
  "type": "FULL_DAY",
  "category": "AFRICAN",
  "frequency": "WEEKLY",
  "meals": [
    {"mealId": "uuid-thieboudienne", "quantity": 1},
    {"mealId": "uuid-yassa", "quantity": 1},
    {"mealId": "uuid-soupou", "quantity": 1}
  ]
}
```

### 3. Validation (automatique)
```
✓ Type: FULL_DAY
✓ Meals: 1 BREAKFAST + 1 LUNCH + 1 DINNER → OK
✓ Prix défini (15000) → OK
✓ Fréquence configurée (WEEKLY) → OK
→ Abonnement publié avec succès
```

### 4. Details affichés à l'User
```
Pack Senegalais Complet
Type: FULL_DAY | Category: AFRICAN | Prix: 15 000 XOF/semaine

Inclus :
- Thieboudienne (LUNCH)
- Yassa Poulet (LUNCH)
- Soupou Fonda (DINNER)
```

---

## 📡 ENDPOINTS API

### Meals (Provider)
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/providers/me/meals` | Créer un meal |
| GET | `/providers/me/meals` | Lister mes meals |
| GET | `/providers/me/meals/:id` | Détails d'un meal |
| PUT | `/providers/me/meals/:id` | Modifier un meal |
| DELETE | `/providers/me/meals/:id` | Supprimer un meal |

### Subscriptions (Provider)
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/providers/me/subscriptions` | Créer un abonnement |
| GET | `/providers/me/subscriptions` | Lister mes abonnements |
| GET | `/providers/me/subscriptions/:id` | Détails avec meals |
| PUT | `/providers/me/subscriptions/:id` | Modifier |
| DELETE | `/providers/me/subscriptions/:id` | Supprimer |
| PUT | `/providers/me/subscriptions/:id/toggle` | Activer/Désactiver |

### Subscriptions (Public)
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/subscriptions` | Lister avec filtres (category, type, price) |
| GET | `/subscriptions/:id` | Détails avec meals |
| GET | `/subscriptions/featured` | En vedette |
| GET | `/subscriptions/search` | Recherche |

---

## 📊 RÉSUMÉ DE L'ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                         MEAL                                 │
├─────────────────────────────────────────────────────────────┤
│ • id, name, description, price, imageUrl                     │
│ • mealType: BREAKFAST | LUNCH | DINNER | SNACK             │
│ • relations: provider, subscriptionMeals                     │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
┌───────────────┐  ┌─────────────────────┐  ┌───────────────┐
│ Subscription  │  │  SubscriptionMeal   │  │    Order      │
├───────────────┤  ├─────────────────────┤  ├───────────────┤
│ • name        │◄─┤ • subscriptionId    │  │ • orderNumber │
│ • description │  │ • mealId           │  │ • status      │
│ • price       │  │ • quantity         │  │ • qrCode      │
│ • type        │  └─────────────────────┘  │ • amount      │
│ • category    │                            └───────────────┘
│ • frequency   │
│ • meals[]     │◄──────────────────────────────┐
└───────────────┘                                 │
              │                                  │
              └──────────────┬───────────────────┘
                             ▼
                    ┌───────────────┐
                    │    Provider   │
                    ├───────────────┤
                    │ • businessName│
                    │ • category    │
                    └───────────────┘
```

---

## 🔗 SCHÉMA PRISMA COMPLET

```prisma
// ============================================
// ENUMS
// ============================================

enum MealType {
  BREAKFAST
  LUNCH
  DINNER
  SNACK
}

enum SubscriptionType {
  BREAKFAST
  LUNCH
  DINNER
  SNACK
  BREAKFAST_LUNCH
  BREAKFAST_DINNER
  LUNCH_DINNER
  FULL_DAY
  CUSTOM
}

enum SubscriptionCategory {
  AFRICAN
  EUROPEAN
  ASIAN
  AMERICAN
  FUSION
  VEGETARIAN
  VEGAN
  HALAL
  OTHER
}

enum SubscriptionFrequency {
  DAILY
  THREE_PER_WEEK
  WEEKLY
  BIWEEKLY
  MONTHLY
}

// ============================================
// MODELS
// ============================================

model Meal {
  id          String    @id @default(uuid())
  providerId  String
  name        String
  description String    @db.Text
  price       Float
  imageUrl    String?
  mealType    MealType
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  // Relations
  provider    Provider              @relation(fields: [providerId], references: [id], onDelete: Cascade)
  mealsInSubscriptions SubscriptionMeal[]

  @@index([providerId])
  @@index([mealType])
  @@map("meals")
}

model Subscription {
  id               String    @id @default(uuid())
  providerId       String
  name             String
  description      String    @db.Text
  price           Float
  type             SubscriptionType
  category         SubscriptionCategory
  frequency        SubscriptionFrequency
  isActive         Boolean   @default(true)
  isPublic         Boolean   @default(true)
  deliveryZones    Json?
  pickupLocations  Json?
  imageUrl         String?
  subscriberCount  Int       @default(0)
  rating           Float     @default(0)
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  // Relations
  provider         Provider              @relation(fields: [providerId], references: [id], onDelete: Cascade)
  mealsInSubscriptions SubscriptionMeal[]
  orders           Order[]

  @@index([providerId])
  @@index([type])
  @@index([category])
  @@index([frequency])
  @@index([isActive])
  @@map("subscriptions")
}

model SubscriptionMeal {
  id             String      @id @default(uuid())
  subscriptionId String
  mealId         String
  quantity       Int         @default(1)

  // Relations
  subscription   Subscription @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)
  meal           Meal        @relation(fields: [mealId], references: [id], onDelete: Cascade)

  @@unique([subscriptionId, mealId])
  @@map("subscription_meals")
}
```

---

## 📋 PLAN D'IMPLÉMENTATION DÉTAILLÉ

### PHASE 1 : BASE DE DONNÉES

**1.1 Créer la migration Prisma**
```bash
cd juna-backend
npx prisma migrate dev --name add_meal_tables
```

**1.2 Créer la migration SQL manuellement**
```sql
-- Créer table meals
CREATE TABLE "meals" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "providerId" UUID NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT NOT NULL,
  "price" DOUBLE PRECISION NOT NULL,
  "imageUrl" TEXT,
  "mealType" TEXT NOT NULL,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Créer table subscription_meals (liaison)
CREATE TABLE "subscription_meals" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "subscriptionId" UUID NOT NULL,
  "mealId" UUID NOT NULL,
  "quantity" INTEGER DEFAULT 1,
  UNIQUE("subscriptionId", "mealId")
);

-- Créer types.enums
CREATE TYPE "MealType" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK');
CREATE TYPE "SubscriptionType" AS ENUM 
  ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK', 
   'BREAKFAST_LUNCH', 'BREAKFAST_DINNER', 'LUNCH_DINNER', 'FULL_DAY', 'CUSTOM');
CREATE TYPE "SubscriptionCategory" AS ENUM 
  ('AFRICAN', 'EUROPEAN', 'ASIAN', 'AMERICAN', 'FUSION', 
   'VEGETARIAN', 'VEGAN', 'HALAL', 'OTHER');

-- Créer index
CREATE INDEX ON "meals"("providerId");
CREATE INDEX ON "meals"("mealType");
CREATE INDEX ON "subscription_meals"("subscriptionId");
CREATE INDEX ON "subscription_meals"("mealId");
CREATE INDEX ON "subscriptions"("type");
CREATE INDEX ON "subscriptions"("category");

-- Ajouter clés étrangères
ALTER TABLE "meals" ADD FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE CASCADE;
ALTER TABLE "subscription_meals" ADD FOREIGN KEY ("subscriptionId") 
  REFERENCES "subscriptions"("id") ON DELETE CASCADE;
ALTER TABLE "subscription_meals" ADD FOREIGN KEY ("mealId") 
  REFERENCES "meals"("id") ON DELETE CASCADE;
```

**1.3 Mettre à jour schema.prisma**
```prisma
// Ajouter enums
enum MealType {
  BREAKFAST
  LUNCH
  DINNER
  SNACK
}

enum SubscriptionType {
  BREAKFAST
  LUNCH
  DINNER
  SNACK
  BREAKFAST_LUNCH
  BREAKFAST_DINNER
  LUNCH_DINNER
  FULL_DAY
  CUSTOM
}

enum SubscriptionCategory {
  AFRICAN
  EUROPEAN
  ASIAN
  AMERICAN
  FUSION
  VEGETARIAN
  VEGAN
  HALAL
  OTHER
}

// Ajouter model Meal
model Meal {
  id          String    @id @default(uuid())
  providerId  String
  name        String
  description String    @db.Text
  price       Float
  imageUrl    String?
  mealType    MealType
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  provider    Provider              @relation(fields: [providerId], references: [id], onDelete: Cascade)
  mealsInSubscriptions SubscriptionMeal[]

  @@index([providerId])
  @@index([mealType])
  @@map("meals")
}

// Mettre à jour Subscription (remplacer mealType par type + category)
model Subscription {
  // ... autres champs
  type             SubscriptionType     // Remplace mealType
  category         SubscriptionCategory // Nouveau champ
  // ... relations
  mealsInSubscriptions SubscriptionMeal[]
}

// Ajouter SubscriptionMeal
model SubscriptionMeal {
  id             String      @id @default(uuid())
  subscriptionId String
  mealId         String
  quantity       Int         @default(1)

  subscription   Subscription @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)
  meal           Meal        @relation(fields: [mealId], references: [id], onDelete: Cascade)

  @@unique([subscriptionId, mealId])
  @@map("subscription_meals")
}
```

---

### PHASE 2 : REPOSITORIES

**2.1 Créer MealRepository** (`src/repositories/meal.repository.ts`)
```typescript
// Méthodes à implémenter :
- create(data: Prisma.MealCreateInput): Promise<Meal>
- findById(id: string): Promise<Meal | null>
- findByProviderId(providerId: string): Promise<Meal[]>
- findByProviderIdActive(providerId: string): Promise<Meal[]>
- findByIds(ids: string[]): Promise<Meal[]>
- update(id: string, data: Prisma.MealUpdateInput): Promise<Meal>
- delete(id: string): Promise<Meal>
```

**2.2 Mettre à jour SubscriptionRepository**
- Ajouter méthode pour findByIdWithMeals(id: string)
- Ajouter méthode pour createWithMeals(data, meals)
- Ajouter méthode pour updateMeals(id, meals)
```typescript
// Nouvelles méthodes :
- findByIdWithMeals(id: string): Promise<Subscription & { mealsInSubscriptions: any[] }>
- updateMeals(id: string, meals: { mealId: string, quantity: number }[]): Promise<void>
```

---

### PHASE 3 : TYPES

**3.1 Créer MealTypes** (`src/types/meal.types.ts`)
```typescript
export interface MealDTO {
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  mealType: MealType;
}

export interface MealResponse {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  mealType: MealType;
  isActive: boolean;
  createdAt: Date;
}
```

**3.2 Mettre à jour SubscriptionTypes**
```typescript
// Remplacer mealType par type
export interface SubscriptionDTO {
  name: string;
  description: string;
  price: number;
  type: SubscriptionType;  // Nouveau
  category: SubscriptionCategory; // Nouveau
  frequency: SubscriptionFrequency;
  meals: { mealId: string; quantity: number }[]; // Nouveau
}
```

---

### PHASE 4 : VALIDATORS

**4.1 Créer MealValidator** (`src/validators/meal.validator.ts`)
```typescript
import { z } from 'zod';

export const createMealSchema = z.object({
  name: z.string().min(2).trim(),
  description: z.string().min(10),
  price: z.number().positive(),
  imageUrl: z.string().url().optional(),
  mealType: z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']),
});

export const updateMealSchema = z.object({
  name: z.string().min(2).trim().optional(),
  description: z.string().min(10).optional(),
  price: z.number().positive().optional(),
  imageUrl: z.string().url().optional(),
  mealType: z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']).optional(),
  isActive: z.boolean().optional(),
});
```

**4.2 Mettre à jour SubscriptionValidator**
```typescript
// Ajouter types de validation
export const subscriptionTypeSchema = z.enum([
  'BREAKFAST', 'LUNCH', 'DINNER', 'SNACK',
  'BREAKFAST_LUNCH', 'BREAKFAST_DINNER', 'LUNCH_DINNER', 'FULL_DAY', 'CUSTOM'
]);

export const subscriptionCategorySchema = z.enum([
  'AFRICAN', 'EUROPEAN', 'ASIAN', 'AMERICAN', 'FUSION',
  'VEGETARIAN', 'VEGAN', 'HALAL', 'OTHER'
]);

// Ajouter meals dans createSubscriptionSchema
export const createSubscriptionSchema = z.object({
  name: z.string().min(2).trim(),
  description: z.string().min(10),
  price: z.number().positive(),
  type: subscriptionTypeSchema,
  category: subscriptionCategorySchema,
  frequency: subscriptionFrequencySchema,
  meals: z.array(z.object({
    mealId: z.string().uuid(),
    quantity: z.number().int().positive().default(1),
  })).min(1),
});
```

---

### PHASE 5 : SERVICES

**5.1 Créer MealService** (`src/services/meal.service.ts`)
```typescript
class MealService {
  async create(providerId: string, data: CreateMealDTO): Promise<MealResponse>
  async getById(id: string): Promise<MealResponse>
  async getByProvider(providerId: string): Promise<MealResponse[]>
  async update(id: string, providerId: string, data: UpdateMealDTO): Promise<MealResponse>
  async delete(id: string, providerId: string): Promise<void>
  
  // Validation des meals
  async validateMealsExist(mealIds: string[]): Promise<Meal[]>
}
```

**5.2 Mettre à jour SubscriptionService**
- Valider que les meals correspondent au type de l'abonnement
- Valider que le provider possède les meals
```typescript
// Nouvelle méthode
async validateSubscriptionComposition(
  type: SubscriptionType,
  meals: { mealId: string; quantity: number }[]
): Promise<void> {
  // Vérifier que chaque meal a le bon mealType selon le type
  // Ex: type=LUNCH → tous les meals doivent avoir mealType=LUNCH
}
```

---

### PHASE 6 : CONTROLLERS

**6.1 Créer MealController** (`src/controllers/meal.controller.ts`)
```typescript
class MealController {
  async create(req: Request, res: Response): Promise<void>
  async getMyMeals(req: Request, res: Response): Promise<void>
  async getById(req: Request, res: Response): Promise<void>
  async update(req: Request, res: Response): Promise<void>
  async delete(req: Request, res: Response): Promise<void>
}
```

**6.2 Mettre à jour SubscriptionController**
- Modifier create pour accepter meals[]
- Ajouter getByIdWithMeals

---

### PHASE 7 : ROUTES

**7.1 Créer MealRoutes** (`src/routes/meal.routes.ts`)
```typescript
router.post('/', authenticate, requireRole(PROVIDER), validate(createMealSchema), controller.create);
router.get('/', authenticate, requireRole(PROVIDER), controller.getMyMeals);
router.get('/:id', authenticate, controller.getById);
router.put('/:id', authenticate, requireRole(PROVIDER), validate(updateMealSchema), controller.update);
router.delete('/:id', authenticate, requireRole(PROVIDER), controller.delete);
```

**7.2 Mettre à jour ProviderRoutes**
- Mount meal routes sous `/providers/me/meals`

**7.3 Mettre à jour SubscriptionRoutes**
- Modifier routes existantes pour retourner meals

---

### PHASE 8 : INDEX

**8.1 Monter les routes** (`src/routes/index.ts`)
```typescript
import mealRoutes from './meal.routes';

router.use('/providers/me/meals', mealRoutes);
```

---

### PHASE 9 : SEED & TESTS

**9.1 Créer seed pour tests**
```typescript
// Créer des meals de test
const meals = await prisma.meal.createMany({
  data: [
    { providerId, name: 'Thieboudienne', price: 2500, mealType: 'LUNCH' },
    { providerId, name: 'Yassa Poulet', price: 2500, mealType: 'LUNCH' },
    { providerId, name: 'Soupou Fonda', price: 2000, mealType: 'DINNER' },
  ],
});

// Créer subscription de test
await prisma.subscription.create({
  data: {
    providerId,
    name: 'Pack Sénégalais',
    type: 'FULL_DAY',
    category: 'AFRICAN',
    price: 15000,
    mealsInSubscriptions: {
      create: [
        { mealId: meal1.id },
        { mealId: meal2.id },
        { mealId: meal3.id },
      ],
    },
  },
});
```

**9.2 Tester endpoints**
```bash
# Créer un meal
curl -X POST http://localhost:5000/api/v1/providers/me/meals \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Thieboudienne","description":"...","price":2500,"mealType":"LUNCH"}'

# Créer un abonnement avec meals
curl -X POST http://localhost:5000/api/v1/providers/me/subscriptions \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Pack Full Day","type":"FULL_DAY","category":"AFRICAN","price":15000,"frequency":"WEEKLY","meals":[{"mealId":"uuid1","quantity":1},{"mealId":"uuid2","quantity":1}]}'
```

---

## ✅ CHECKLIST D'IMPLÉMENTATION

### Base de Données
- [ ] Créer migration Prisma (tables Meal, SubscriptionMeal, enums)
- [ ] Mettre à jour schema.prisma
- [ ] Exécuter migration

### Repositories
- [ ] Créer `MealRepository`
- [ ] Mettre à jour `SubscriptionRepository`

### Types
- [ ] Créer `src/types/meal.types.ts`
- [ ] Mettre à jour `subscription.types.ts`

### Validators
- [ ] Créer `src/validators/meal.validator.ts`
- [ ] Mettre à jour `subscription.validator.ts`

### Services
- [ ] Créer `MealService`
- [ ] Mettre à jour `SubscriptionService`

### Controllers
- [ ] Créer `MealController`
- [ ] Mettre à jour `SubscriptionController`

### Routes
- [ ] Créer `src/routes/meal.routes.ts`
- [ ] Mettre à jour `src/routes/provider.routes.ts`
- [ ] Mettre à jour `src/routes/subscription.routes.ts`
- [ ] Mettre à jour `src/routes/index.ts`

### Tests
- [ ] Créer seed pour tests
- [ ] Tester création meal
- [ ] Tester création subscription avec meals
- [ ] Tester validation (type vs meals)

---

## 📌 Notes

- **Meal.mealType** identifie le type de chaque plat
- **Subscription.type** définit la composition de l'abonnement
- **Subscription.category** définit la cuisine du fournisseur
- **Validation** : Backend vérifie automatiquement cohérence type/meals


## [2026-10-23] Instructions facultatives des abonnements

Le champ `instructions` contient les précisions libres du prestataire propres à une formule. Il ne modifie pas le prix.

- Accepté dans `POST /api/v1/subscriptions`, `PUT /api/v1/subscriptions/:id` et `POST /api/v1/subscription-proposals/:id/approve`.
- Type : texte facultatif ou `null`, maximum 2 000 caractères après suppression des espaces aux extrémités.
- À la création, un champ omis vaut `null`. À la modification, l’omettre conserve la valeur ; envoyer `null` efface la valeur. Une chaîne vide est également acceptée.
- Renvoyé sur les abonnements (détails, listes publiques, accueil, profil prestataire, administration) et dans l’abonnement associé aux commandes et abonnements actifs.
- Les interfaces peuvent afficher ce texte s’il est renseigné et masquer le bloc sinon. Aucun texte par défaut n’est fourni.

### Migration de base de données

La migration `20261023000000_add_subscription_instructions` ajoute uniquement une colonne `TEXT` nullable à `subscriptions`. Les enregistrements existants restent inchangés, avec `instructions = null`.

Appliquer les migrations avec `npm run prisma:migrate:deploy` dans l’environnement cible, puis déployer le backend avec le client Prisma régénéré (`npm run prisma:generate`).
