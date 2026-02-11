# Module Abonnement JUNA - Architecture Définitive

> **Version** : 3.0
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

## ✅ CHECKLIST D'IMPLÉMENTATION

- [ ] Créer migration Prisma (tables Meal, SubscriptionMeal)
- [ ] Mettre à jour Subscription (ajouter relations)
- [ ] Créer `MealRepository`
- [ ] Créer `MealService`
- [ ] Créer `MealController`
- [ ] Créer `MealValidator`
- [ ] Créer `MealRoutes`
- [ ] Mettre à jour `SubscriptionValidator` (validation type vs meals)
- [ ] Mettre à jour `SubscriptionService` (validation)
- [ ] Mettre à jour `SubscriptionRoutes`
- [ ] Créer seed pour tests
- [ ] Tester tous les endpoints

---

## 📌 Notes

- **Meal.mealType** identifie le type de chaque plat
- **Subscription.type** définit la composition de l'abonnement
- **Subscription.category** définit la cuisine du fournisseur
- **Validation** : Backend vérifie automatiquement cohérence type/meals
