# Plan de renommage : frequency → duration

## Objectif
Renommer l'attribut `frequency` en `duration` dans le modèle Subscription pour mieux refléter sa signification (durée de validité de l'abonnement).

## Étapes à suivre

### Étape 1 : Modifier le schéma Prisma
**Fichier :** `juna-backend/prisma/schema.prisma`

```prisma
// AVANT
enum SubscriptionFrequency {
  DAILY
  THREE_PER_WEEK
  WEEKLY
  BIWEEKLY
  MONTHLY
}

// APRÈS
enum SubscriptionDuration {
  DAY         // 1 jour
  THREE_DAYS  // 3 jours
  WEEK        // 7 jours
  TWO_WEEKS   // 14 jours
  MONTH       // 30 jours
}
```

Puis remplacer :
```prisma
frequency SubscriptionFrequency
```
par :
```prisma
duration SubscriptionDuration
```

### Étape 2 : Mettre à jour les types TypeScript
**Fichier :** `juna-backend/src/types/subscription.types.ts`

- Remplacer `SubscriptionFrequency` par `SubscriptionDuration`
- Remplacer `frequency` par `duration`

### Étape 3 : Mettre à jour les validateurs
**Fichier :** `juna-backend/src/validators/subscription.validator.ts`

- Remplacer `subscriptionFrequencyEnum` par `subscriptionDurationEnum`
- Remplacer toutes les références à `frequency`

### Étape 4 : Mettre à jour les repositories
**Fichier :** `juna-backend/src/repositories/subscription.repository.ts`

- Remplacer toutes les références à `frequency` par `duration`

### Étape 5 : Mettre à jour les services
**Fichier :** `juna-backend/src/services/subscription.service.ts`

- Remplacer toutes les références à `frequency` par `duration`

### Étape 6 : Mettre à jour les controllers
**Fichier :** `juna-backend/src/controllers/subscription.controller.ts`

- Remplacer toutes les références à `frequency` par `duration`

### Étape 7 : Appliquer les changements en base de données

```bash
cd juna-backend

# Option A : Recréer la base (si pas de données importantes)
npx prisma db push --force-reset

# Option B : Créer une migration
npx prisma migrate dev --name rename_frequency_to_duration
```

### Étape 8 : Mettre à jour les fichiers de test
**Fichier :** `juna-backend/test.rest`

- Remplacer `"frequency": "WEEKLY"` par `"duration": "WEEKLY"`
- etc.

### Étape 9 : Mettre à jour la documentation
**Fichier :** `api-documentation.md`

- Mettre à jour tous les exemples avec `duration` au lieu de `frequency`

---

## Commandes à exécuter dans l'ordre

```bash
# 1. Modifier prisma/schema.prisma
# 2. Modifier src/types/subscription.types.ts
# 3. Modifier src/validators/subscription.validator.ts
# 4. Modifier src/repositories/subscription.repository.ts
# 5. Modifier src/services/subscription.service.ts
# 6. Modifier src/controllers/subscription.controller.ts

# 7. Appliquer les changements Prisma
cd juna-backend
npx prisma db push --force-reset

# 8. Redémarrer le serveur
npm run dev
```

---

## Notes

- Cette modification est backwards-breaking si l'API est déjà en production
- Tous les tests devront être mis à jour avec le nouveau champ `duration`
- La documentation API devra être mise à jour
