# Nouveaux changements API — App Web

> Ce fichier recense tous les changements API récents qui impactent l'app web.
> Chaque section correspond à une feature ou un correctif. Les plus récents sont en haut.

---

## [2026-06-30] Nouvelle feature — Propositions d'abonnement (consumer → provider)

### Contexte

Un consumer peut désormais composer une proposition d'abonnement personnalisé à partir du catalogue de plats d'**un provider précis** (depuis sa page profil public). Le provider reçoit la proposition, peut l'ajuster, fixe librement le prix final, puis l'approuve ou la rejette.

À l'approbation, un **nouvel abonnement public** est créé automatiquement (`isPublic: true`) et ajouté au catalogue du provider, comme n'importe quel autre abonnement. Ce n'est pas un abonnement privé réservé au demandeur.

Côté web, ça concerne potentiellement deux surfaces : le **Dashboard Provider** (réception/traitement des propositions) et une éventuelle vue **Consumer** si l'app web expose la création de proposition (sinon cette partie est gérée côté mobile uniquement — à confirmer selon vos écrans).

### Toutes les routes nécessitent une authentification (`Authorization: Bearer <token>`)

| Méthode | Route | Rôle | Usage |
|--------|-------|------|-------|
| `POST` | `/api/v1/subscription-proposals` | Consumer | Créer une proposition |
| `GET` | `/api/v1/subscription-proposals/me` | Consumer | Mes propositions envoyées (paginé) |
| `GET` | `/api/v1/subscription-proposals/received` | Provider | Propositions reçues (paginé) — **Dashboard Provider** |
| `GET` | `/api/v1/subscription-proposals/:id` | Les deux | Détail (accessible par l'auteur OU le provider ciblé) |
| `POST` | `/api/v1/subscription-proposals/:id/approve` | Provider | Approuver → crée l'abonnement public |
| `POST` | `/api/v1/subscription-proposals/:id/reject` | Provider | Rejeter avec motif |

### Créer une proposition — `POST /api/v1/subscription-proposals`

```json
{
  "providerId": "uuid",
  "type": "LUNCH",
  "category": "AFRICAN",
  "duration": "WORK_WEEK",
  "message": "Tous les midis du lundi au vendredi svp",
  "meals": [
    { "mealId": "uuid", "quantity": 1 },
    { "mealId": "uuid", "mealPricingLabel": "Demi", "quantity": 1 }
  ]
}
```

- `meals` : 1 à 20 plats. Chaque plat doit appartenir au provider ciblé et être actif.
- `mealPricingLabel` : **obligatoire** si le plat a `priceType: "MULTIPLE"` (ex: "Demi", "Entier" — doit correspondre à une variante existante du plat), **interdit** sinon.
- Réponse `201` avec la proposition complète (voir structure ci-dessous).

### Structure d'une proposition (réponse)

```json
{
  "id": "uuid",
  "userId": "uuid",
  "providerId": "uuid",
  "type": "LUNCH",
  "category": "AFRICAN",
  "duration": "WORK_WEEK",
  "message": "Tous les midis du lundi au vendredi svp",
  "status": "PENDING",
  "rejectionReason": null,
  "resultingSubscriptionId": null,
  "respondedAt": null,
  "createdAt": "...",
  "updatedAt": "...",
  "user": { "id": "uuid", "name": "...", "email": "..." },
  "provider": { "id": "uuid", "businessName": "...", "logo": "..." },
  "resultingSubscription": null,
  "meals": [
    {
      "id": "uuid",
      "mealId": "uuid",
      "mealPricingLabel": "Demi",
      "quantity": 1,
      "meal": {
        "id": "uuid",
        "name": "Poulet braisé",
        "imageUrl": "https://...",
        "mealType": "LUNCH",
        "priceType": "MULTIPLE",
        "price": 1500,
        "isActive": true
      }
    }
  ]
}
```

`status` vaut `PENDING`, `APPROVED` ou `REJECTED`.

### Listes paginées — `GET /me` et `GET /received`

Query params : `?status=PENDING&page=1&limit=20` (tous optionnels, `status` filtre sur `PENDING`/`APPROVED`/`REJECTED`).

```json
{
  "data": [ /* tableau de propositions, même structure que ci-dessus */ ],
  "total": 12,
  "page": 1,
  "totalPages": 1
}
```

### Approuver — `POST /api/v1/subscription-proposals/:id/approve` (Provider)

Le provider fixe **librement** tous les détails finaux de l'abonnement créé (le prix n'est PAS calculé automatiquement à partir des plats proposés) :

```json
{
  "name": "Abonnement midi sur mesure",
  "description": "Repas chaud chaque midi du lundi au vendredi",
  "price": 27000,
  "imageUrl": "https://...",
  "junaCommissionPercent": 10,
  "preparationHours": 2,
  "isImmediate": true,
  "type": "LUNCH",
  "category": "AFRICAN",
  "duration": "WORK_WEEK",
  "meals": [
    { "mealId": "uuid", "quantity": 1 }
  ]
}
```

- `name`, `description`, `price`, `imageUrl` : requis.
- `type`, `category`, `duration` : optionnels — si omis, on reprend ceux proposés par le user.
- `meals` : optionnel — si omis, on reprend exactement les plats/quantités proposés par le user. Si fourni, **remplace entièrement** la liste (permet au provider d'ajuster avant de publier).
- Réponse `200` avec l'abonnement créé (objet `Subscription` standard, `isPublic: true`, `isActive: true`).

### Rejeter — `POST /api/v1/subscription-proposals/:id/reject` (Provider)

```json
{ "rejectionReason": "Pas assez de stock pour le moment" }
```

`rejectionReason` requis (5 à 500 caractères). Réponse `200`.

### Notifications

| Événement | Destinataire | `NotificationType` |
|-----------|--------------|---------------------|
| Proposition créée | Provider | `SUBSCRIPTION_PROPOSAL_RECEIVED` |
| Proposition approuvée | Consumer | `SUBSCRIPTION_PROPOSAL_APPROVED` |
| Proposition rejetée | Consumer | `SUBSCRIPTION_PROPOSAL_REJECTED` |

### Erreurs notables

| Cas | Code | Statut HTTP |
|-----|------|-------------|
| Provider non trouvé / non approuvé | `PROVIDER_NOT_FOUND` / `PROVIDER_NOT_APPROVED` | 404 / 403 |
| Plat invalide (hors catalogue, inactif, variante manquante/incorrecte) | `INVALID_INPUT` | 409 |
| Proposition introuvable | `SUBSCRIPTION_PROPOSAL_NOT_FOUND` | 404 |
| Pas l'auteur ni le provider ciblé | `FORBIDDEN` | 403 |
| Proposition déjà traitée (approve/reject sur une proposition non `PENDING`, y compris en cas de double clic concurrent) | `SUBSCRIPTION_PROPOSAL_ALREADY_PROCESSED` | 409 |

### Notes
- Un plat référencé par une proposition `PENDING` ne peut pas être supprimé par le provider (`DELETE /api/v1/meals/:id` renverra `409 MEAL_IN_PENDING_PROPOSAL`) — il reste cependant modifiable/désactivable normalement.
- L'approbation/le rejet sont protégés contre les doubles soumissions concurrentes (deux onglets, double clic) : un seul des deux appels réussit, l'autre reçoit `SUBSCRIPTION_PROPOSAL_ALREADY_PROCESSED`.

---

## [2026-06-30] Fix — `provider` incomplet sur les routes plats

### Routes concernées

**`GET /api/v1/meals/:id`** et **`GET /api/v1/meals`**

### Ce qui a changé

L'objet `provider` imbriqué ne contenait que `id` et `businessName`. Il inclut maintenant `logo` et `isVerified`, comme dans `GET /api/v1/subscriptions`.

```json
{
  "id": "uuid",
  "businessName": "K'foods",
  "logo": "https://...",
  "isVerified": true
}
```

Permet d'afficher la vraie photo de profil (au lieu des initiales) et le badge de certification sur la carte "Proposé par {provider}" de la page détail d'un plat.

---

## [2026-06-30] Fix — `isVerified` manquant sur le profil public d'un prestataire

### Route concernée

**`GET /api/v1/providers/:id`**

### Ce qui a changé

Le champ `isVerified` (boolean) était absent de la réponse. Il est maintenant inclus, au même niveau que `businessName`, `logo`, etc. — dérivé du statut du prestataire (`status === 'APPROVED'`).

```json
{
  "id": "uuid",
  "businessName": "K'foods",
  "isVerified": true,
  "logo": "https://...",
  "...": "..."
}
```

Permet d'afficher le badge de certification bleu sur la page profil public.

---

## [2026-06-29] Route home — prestataires de la ville désormais peuplés

### Route concernée

**`GET /api/v1/home?cityId=<uuid>`**

### Ce qui a changé

Le champ `providers` dans la réponse était retourné vide `[]`. Il est maintenant peuplé avec les prestataires approuvés de la ville demandée, triés par rating.

### Structure du champ `providers`

```json
{
  "providers": [
    {
      "id": "uuid",
      "name": "Restaurant Chez Maman",
      "logo": "https://...",
      "rating": 4.5,
      "isVerified": true,
      "city": "Cotonou"
    }
  ]
}
```

---

## [2026-06-29] Page publique d'un prestataire

### Nouvelle route

**`GET /api/v1/providers/:id`** — publique, sans authentification

Utilisée pour afficher la page de profil public d'un prestataire, accessible aussi bien depuis le côté **Consumer** (découverte) que depuis les liens partagés.

### Réponse complète

```json
{
  "id": "uuid",
  "businessName": "Restaurant Chez Maman",
  "description": "Le meilleur du terroir béninois",
  "logo": "https://...",
  "businessAddress": "Rue des Cocotiers, Cotonou",
  "rating": 4.5,
  "reviewCount": 38,
  "acceptsDelivery": true,
  "acceptsPickup": true,
  "deliveryZones": ["Fidjrossè", "Cadjehoun"],
  "memberSince": "2025-01-15T10:00:00Z",
  "city": {
    "id": "uuid",
    "name": "Cotonou",
    "country": {
      "id": "uuid",
      "code": "BJ",
      "translations": { "fr": "Bénin", "en": "Benin" }
    }
  },
  "pickupPoints": [
    { "id": "uuid", "name": "Marché Dantokpa" }
  ],
  "subscriptions": [
    {
      "id": "uuid",
      "name": "Abonnement midi semaine",
      "description": "Un repas chaud chaque midi du lundi au vendredi",
      "price": 25000,
      "type": "LUNCH",
      "category": "AFRICAN",
      "duration": "WORK_WEEK",
      "imageUrl": "https://...",
      "rating": 4.7,
      "reviewCount": 12,
      "preparationHours": 2,
      "meals": [
        {
          "id": "uuid",
          "name": "Riz au gras",
          "description": "Riz bien assaisonné",
          "imageUrl": "https://...",
          "mealType": "LUNCH",
          "priceType": "FIXED",
          "price": 1500,
          "priceMin": null,
          "priceMax": null,
          "priceGuideline": null,
          "pricings": []
        }
      ]
    }
  ],
  "meals": [
    {
      "id": "uuid",
      "name": "Poulet braisé",
      "description": "Poulet mariné grillé au charbon",
      "imageUrl": "https://...",
      "mealType": "LUNCH",
      "priceType": "MULTIPLE",
      "price": 1500,
      "priceMin": null,
      "priceMax": null,
      "priceGuideline": "La différence est la taille de la portion",
      "pricings": [
        { "id": "uuid", "label": "Quart", "price": 1500 },
        { "id": "uuid", "label": "Demi", "price": 2500 },
        { "id": "uuid", "label": "Entier", "price": 4500 }
      ]
    }
  ]
}
```

### Navigation depuis le profil

Chaque abonnement et chaque plat retournés contiennent un `id`. Le frontend peut naviguer vers les pages de détail :

| Cible | Route |
|-------|-------|
| Détail d'un abonnement | `GET /api/v1/subscriptions/:id` |
| Détail d'un plat | `GET /api/v1/meals/:id` |

Ces deux routes sont **publiques** (sans authentification). Le détail d'un plat inclut tous les champs de prix (`priceType`, `price`, `priceMin`, `priceMax`, `priceGuideline`, `pricings`).

### Notes
- Seuls les prestataires avec statut `APPROVED` sont accessibles via cette route.
- `subscriptions` ne contient que les abonnements `isActive: true` et `isPublic: true`, triés par rating.
- `meals` ne contient que les plats `isActive: true`.
- Si le prestataire n'existe pas ou n'est pas approuvé → `404`.

---

## [2026-06-29] Prix flexibles sur les plats

### Contexte
Le modèle `Meal` supporte désormais trois types de prix.
Sur l'app web, ce changement concerne le **Dashboard Provider** (création/gestion des plats) et la **vue Consumer** (affichage des plats dans les abonnements).

### Routes impactées

| Méthode | Route | Contexte |
|--------|-------|----------|
| `POST` | `/api/v1/meals` | Dashboard Provider — créer un plat |
| `PUT` | `/api/v1/meals/:id` | Dashboard Provider — modifier un plat |
| `GET` | `/api/v1/meals/me` | Dashboard Provider — liste de mes plats |
| `GET` | `/api/v1/meals/:id` | Public — détail d'un plat |
| `GET` | `/api/v1/meals` | Public — liste avec filtres |
| `GET` | `/api/v1/subscriptions/:id` | Public — détail abonnement (plats avec prix) |

### Formulaire création/édition de plat (Dashboard Provider)

Ajouter un sélecteur `priceType` avec affichage conditionnel :

**FIXED** → afficher un champ `price`
**MULTIPLE** → afficher une liste dynamique de variantes `{ label, price }` (min 2)
**RANGE** → afficher deux champs `priceMin` et `priceMax`
**Tous les types** → champ `priceGuideline` optionnel

### Payloads — `POST /api/v1/meals`

**FIXED**
```json
{
  "name": "Riz au gras",
  "description": "Riz bien assaisonné avec poulet",
  "mealType": "LUNCH",
  "imageUrl": "https://...",
  "priceType": "FIXED",
  "price": 1500,
  "priceGuideline": "Inclut une boisson"
}
```

**MULTIPLE**
```json
{
  "name": "Poulet braisé",
  "description": "Poulet mariné grillé au charbon",
  "mealType": "LUNCH",
  "imageUrl": "https://...",
  "priceType": "MULTIPLE",
  "pricings": [
    { "label": "Quart", "price": 1500 },
    { "label": "Demi", "price": 2500 },
    { "label": "Entier", "price": 4500 }
  ],
  "priceGuideline": "La différence est la taille de la portion"
}
```

**RANGE**
```json
{
  "name": "Plat du jour",
  "description": "Varie selon les arrivages",
  "mealType": "LUNCH",
  "imageUrl": "https://...",
  "priceType": "RANGE",
  "priceMin": 1000,
  "priceMax": 6000,
  "priceGuideline": "Le prix dépend des ingrédients du jour"
}
```

### Réponse d'un plat

```json
{
  "id": "uuid",
  "name": "Poulet braisé",
  "priceType": "MULTIPLE",
  "price": 1500,
  "priceMin": null,
  "priceMax": null,
  "priceGuideline": "La différence est la taille de la portion",
  "pricings": [
    { "id": "uuid", "label": "Quart", "price": 1500 },
    { "id": "uuid", "label": "Demi", "price": 2500 },
    { "id": "uuid", "label": "Entier", "price": 4500 }
  ]
}
```

### Affichage recommandé (vue Consumer)

| `priceType` | Affichage carte |
|-------------|----------------|
| `FIXED` | `1 500 FCFA` |
| `MULTIPLE` | `À partir de 1 500 FCFA` + badge variantes |
| `RANGE` | `1 000 – 6 000 FCFA` |

Si `priceGuideline` est renseigné, afficher un tooltip ou une note sous le prix.

### Comportement lors de la modification (`PUT /api/v1/meals/:id`)

- Changer de `MULTIPLE` vers `FIXED` ou `RANGE` → variantes supprimées automatiquement
- Changer vers `MULTIPLE` → nouvelles variantes remplacent les anciennes
- Modifier uniquement `priceGuideline` sans changer `priceType` → fonctionne normalement

### Règles de validation

| Condition | Erreur |
|-----------|--------|
| `FIXED` sans `price` | `"Le prix est requis"` |
| `MULTIPLE` avec moins de 2 variantes | `"Au moins 2 variantes de prix requises"` |
| `RANGE` sans `priceMin` ou `priceMax` | `"Prix minimum/maximum requis"` |
| `priceMax <= priceMin` | `"Le prix maximum doit être supérieur au prix minimum"` |
