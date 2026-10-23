# Nouveaux changements API — Panel Admin

## [2026-10-23] Instructions facultatives des abonnements

Le champ `instructions` contient les précisions libres du prestataire propres à une formule. Il ne modifie pas le prix.

- Accepté dans `POST /api/v1/subscriptions`, `PUT /api/v1/subscriptions/:id` et `POST /api/v1/subscription-proposals/:id/approve`.
- Type : texte facultatif ou `null`, maximum 2 000 caractères après suppression des espaces aux extrémités.
- À la création, un champ omis vaut `null`. À la modification, l’omettre conserve la valeur ; envoyer `null` efface la valeur. Une chaîne vide est également acceptée.
- Renvoyé sur les abonnements (détails, listes publiques, accueil, profil prestataire, administration) et dans l’abonnement associé aux commandes et abonnements actifs.
- Les interfaces peuvent afficher ce texte s’il est renseigné et masquer le bloc sinon. Aucun texte par défaut n’est fourni.

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
