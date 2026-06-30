# Nouveaux changements API — Panel Admin

> Ce fichier recense tous les changements API récents qui impactent le panel admin Juna.
> Chaque section correspond à une feature ou un correctif. Les plus récents sont en haut.

---

## [2026-06-29] Prix flexibles sur les plats

### Contexte
Le modèle `Meal` supporte désormais trois types de prix.
Côté admin, le changement est en **lecture seule** : superviser les plats des providers avec leurs structures de prix.

### Routes impactées

| Méthode | Route | Usage |
|--------|-------|-------|
| `GET` | `/api/v1/meals` | Lister tous les plats |
| `GET` | `/api/v1/meals/:id` | Détail d'un plat |

### Nouveaux champs sur un plat

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
  ],
  "provider": {
    "id": "uuid",
    "businessName": "Restaurant Chez Maman"
  }
}
```

### Résumé des types

| `priceType` | Champs pertinents | `pricings` |
|-------------|------------------|------------|
| `FIXED` | `price` | `[]` |
| `MULTIPLE` | `price` (= min auto), `pricings` | Liste des variantes |
| `RANGE` | `priceMin`, `priceMax` | `[]` |

### Notes

- Les plats existants avant cette mise à jour ont automatiquement `priceType: FIXED` — aucune rupture.
- La supervision se fait en lecture seule. La modification reste réservée aux providers.
