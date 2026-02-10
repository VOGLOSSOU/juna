# Module SUBSCRIPTION - Documentation Complète

##  Vue d'ensemble

Le module **SUBSCRIPTION** (Abonnement) est le cœur du business JUNA. Il permet aux fournisseurs (restaurants) de proposer des formules de repas que les utilisateurs peuvent acheter.

---

##  Structure de la Table `subscriptions`

```prisma
model Subscription {
  id               String                  @id @default(uuid())
  providerId       String                  // Lien vers le fournisseur
  name             String                  // Nom de l'abonnement (ex: "Pack Journalier")
  description      String                  @db.Text  // Description détaillée
  category         SubscriptionCategory    // Type de cuisine (AFRICAN, EUROPEAN, etc.)
  cuisine          String?                 // Spécificité (ex: "Sénégalaise", "Italienne")
  price            Float                   // Prix en XOF (Franc CFA)
  frequency        SubscriptionFrequency   // FRéquence (DAILY, WEEKLY, etc.)
  mealType         MealType               // Type de repas (BREAKFAST, LUNCH, DINNER)
  isActive         Boolean @default(true)  // Si false, l'abonnement n'est plus dispo
  isPublic         Boolean @default(true)  // Si false, seulement sur invitation
  deliveryZones    Json?                   // Zones de livraison couvertes
  pickupLocations  Json?                   // Points de retrait disponibles
  imageUrl         String?                 // URL de la photo
  subscriberCount  Int @default(0)        // Nombre d'abonnés
  rating           Float @default(0)       // Note moyenne
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  // Relations
  provider         Provider @relation(...)
  orders           Order[]
  reviews          Review[]
}
```

---

## 📊 Énumérations

### SubscriptionCategory (Type de cuisine)
```typescript
AFRICAN    // Cuisine africaine traditionnelle
EUROPEAN   // Cuisine européenne
ASIAN      // Cuisine asiatique
AMERICAN   // Cuisine américaine
FUSION     // Cuisine fusion
VEGETARIAN // Végétarien
VEGAN      // Végan
HALAL      // Halal
OTHER      // Autre
```

### SubscriptionFrequency (Fréquence)
```typescript
DAILY          // Tous les jours
THREE_PER_WEEK // 3 fois par semaine
WEEKLY         // Hebdomadaire
BIWEEKLY       // Bi-hebdomadaire
MONTHLY        // Mensuel
```

### MealType (Type de repas)
```typescript
BREAKFAST  // Petit-déjeuner
LUNCH      // Déjeuner
DINNER     // Dîner
SNACK      // Collation
FULL_DAY   // Plein jour (tous les repas)
```

---

## 🔄 Workflow COMPLET

### Scénario 1 : Provider crée un abonnement

```
1. PROVIDER se connecte
2. POST /providers/me/subscriptions
3. Données envoyées :
   {
     "name": "Pack Déjeuner Africain",
     "description": "Déjeuner sénégalais variés",
     "category": "AFRICAN",
     "cuisine": "Sénégalaise",
     "price": 2000,
     "frequency": "DAILY",
     "mealType": "LUNCH",
     "pickupLocations": [
       {"name": "Restaurant", "address": "Cotonou Centre", "lat": 6.36, "lng": 2.42}
     ]
   }
4. Abonnement créé avec isActive: true
```

### Scénario 2 : Utilisateur parcourt les abonnements

```
1. USER consulte GET /subscriptions
2. Filtres possibles :
   - category: AFRICAN
   - city: Cotonou
   - priceMin: 1000
   - priceMax: 5000
   - mealType: LUNCH
3. Résultat : Liste des abonnements publics et actifs
```

### Scénario 3 : Utilisateur souscrit à un abonnement

```
1. USER sélectionne un abonnement
2. POST /orders
3. Données :
   {
     "subscriptionId": "uuid-du-subscription",
     "deliveryMethod": "PICKUP", // ou DELIVERY
     "scheduledFor": "2025-01-15T12:00:00Z"
   }
4. Ordre créé avec status: PENDING
5. Paiement requis (module PAYMENT)
6. Après paiement, QR code généré pour retrait
```

### Scénario 4 : Retrait du repas

```
1. Provider scanne le QR code de l'utilisateur
2. PUT /orders/:id/complete
3. Status passe à : COMPLETED
4. Utilisateur reçoit son repas
```

---

## Attributs Détaillés

| Attribut | Type | Required | Description |
|----------|------|----------|-------------|
| `providerId` | UUID | ✅ | ID du fournisseur (自动 depuis le token) |
| `name` | String | ✅ | Nom attractif du pack |
| `description` | Text | ✅ | Détails du contenu |
| `category` | Enum | ✅ | Type de cuisine |
| `cuisine` | String | ❌ | Spécificité régionale |
| `price` | Float | ✅ | Prix en XOF |
| `frequency` | Enum | ✅ | Fréquence de livraison |
| `mealType` | Enum ✅ | Type de repas |
| `isActive` | Boolean | ✅ | Par défaut true |
| `isPublic` | Boolean | ✅ | Par défaut true |
| `deliveryZones` | JSON | ❌ | Zones de livraison |
| `pickupLocations` | JSON | ❌ | Points de retrait |
| `imageUrl` | String | ❌ | Photo du repas |

### Format JSON pour `deliveryZones`
```json
[
  {
    "city": "Cotonou",
    "zones": ["Akpakpa", "Cadjehoun", "Houéyiho"],
    "deliveryFee": 500
  },
  {
    "city": "Abomey-Calavi",
    "zones": ["Godomey", "Kpanroun"],
    "deliveryFee": 800
  }
]
```

### Format JSON pour `pickupLocations`
```json
[
  {
    "name": "Restaurant Principal",
    "address": "Rue 112, Cotonou",
    "latitude": 6.366666,
    "longitude": 2.433333,
    "openingHours": "11:00-14:00"
  }
]
```

---

##  Relations avec autres tables

```
User (PROVIDER) ──────► Provider ──────► Subscription ──────► Order ──────► Payment
                               │                │
                               │                ▼
                               │             Review
                               │
                               ▼
                            Review (pour noter le subscription)
```

---

##  Endpoints API

### Endpoints Provider (CRUD sur ses abonnements)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/providers/me/subscriptions` | Lister mes abonnements |
| `POST` | `/providers/me/subscriptions` | Créer un abonnement |
| `GET` | `/providers/me/subscriptions/:id` | Détails d'un abonnement |
| `PUT` | `/providers/me/subscriptions/:id` | Modifier un abonnement |
| `DELETE` | `/providers/me/subscriptions/:id` | Supprimer un abonnement |
| `PUT` | `/providers/me/subscriptions/:id/toggle` | Activer/Désactiver |
| `GET` | `/providers/me/subscriptions/:id/subscribers` | Liste des abonnés |

### Endpoints Public (pour les utilisateurs)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/subscriptions` | Lister tous (avec filtres) |
| `GET` | `/subscriptions/:id` | Détails d'un abonnement |
| `GET` | `/subscriptions/featured` | Abonnements en vedette |
| `GET` | `/subscriptions/search` | Recherche avec filtres |

---

##  Règles de Validation

### Pour créer un abonnement :
1. L'utilisateur doit avoir le rôle `PROVIDER`
2. Son statut provider doit être `APPROVED`
3. Le prix doit être > 0
4. La fréquence doit être valide

### Pour voir un abonnement :
- Si `isPublic: true` → Accessible à tous
- Si `isPublic: false` → Accès restreint

---

##  Exemples de Cas d'Usage

### Cas 1 : Restaurant de cuisine sénégalaise
```json
{
  "name": "Déjeuner Thiéboudienne",
  "category": "AFRICAN",
  "cuisine": "Sénégalaise",
  "price": 2500,
  "frequency": "DAILY",
  "mealType": "LUNCH"
}
```

### Cas 2 : Restaurant végétarien bio
```json
{
  "name": "Menu Végan",
  "category": "VEGAN",
  "cuisine": "Bio",
  "price": 3000,
  "frequency": "THREE_PER_WEEK",
  "mealType": "LUNCH"
}
```

### Cas 3 : Brunch dominical
```json
{
  "name": "Brunch du Dimanche",
  "category": "EUROPEAN",
  "cuisine": "Française",
  "price": 5000,
  "frequency": "WEEKLY",
  "mealType": "BREAKFAST"
}
```

---

##  Points d'attention

1. **Validation du provider** : Seul un provider APPROVED peut créer
2. **Gestion des zones** : Si delivery, vérifier que la zone de l'user est couverte
3. **Images** : Intégration Cloudinary pour les photos
4. **Prix** : Toujours en Franc CFA (XOF)
5. **Géolocalisation** : Pour filtrer par proximité

---

##  Métriques à suivre

- `subscriberCount` : Incrémenté à chaque nouvelle souscription
- `rating` : Moyenne des avis (1-5 étoiles)
- `totalRevenue` : Calculé via les orders complétées
