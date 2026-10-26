# API des abonnements favoris

## Principe

Les favoris sont liés au compte authentifié. Toutes les routes `/api/v1/favorites` exigent `Authorization: Bearer <accessToken>`. Le client ne doit jamais fournir de `userId` : le serveur utilise exclusivement le compte du token. Les comptes suspendus ou désactivés sont refusés.

## Ajouter

`POST /api/v1/favorites`

```json
{ "subscriptionId": "UUID-abonnement" }
```

Réponse HTTP 200, y compris si déjà enregistré :

```json
{
  "success": true,
  "message": "Abonnement ajouté aux favoris",
  "data": { "subscriptionId": "UUID-abonnement", "isFavorite": true }
}
```

Seuls les abonnements publics et actifs, proposés par un prestataire approuvé dont le compte est actif, peuvent être ajoutés. Un abonnement absent ou indisponible retourne HTTP 404 avec `SUBSCRIPTION_NOT_FOUND`. Un favori déjà enregistré peut être ajouté à nouveau même si l'abonnement est devenu indisponible : la requête reste sans effet et réussit.

Une contrainte composée en base et un `INSERT ... ON CONFLICT DO NOTHING` empêchent les doublons, y compris lors de requêtes simultanées. Une nouvelle requête sur un favori existant ne change pas sa date d'ajout.

## Retirer

`DELETE /api/v1/favorites/:subscriptionId`

Réponse HTTP 200 :

```json
{
  "success": true,
  "message": "Abonnement retiré des favoris",
  "data": { "subscriptionId": "UUID-abonnement", "isFavorite": false }
}
```

Le retrait réussit aussi si le favori est déjà absent, ou si l'abonnement a été supprimé. Il ne peut retirer le favori d'un autre compte.

## Lister

`GET /api/v1/favorites?page=1&limit=20`

- `page` : entier de 1 à 1 000 000 ; défaut 1.
- `limit` : entier de 1 à 100 ; défaut 20.
- Ordre : date d'ajout décroissante, puis ID d'abonnement croissant en cas d'égalité.
- Une page vide renvoie un tableau vide, pas une erreur.

```json
{
  "success": true,
  "message": "Vos abonnements favoris",
  "data": {
    "favorites": [
      {
        "id": "UUID-abonnement",
        "name": "Formule déjeuner",
        "description": "Description de la formule",
        "instructions": null,
        "price": 1111,
        "currency": "XOF",
        "type": "LUNCH",
        "category": "AFRICAN",
        "duration": "WEEK",
        "imageUrl": "https://example.com/meal.jpg",
        "images": ["https://example.com/meal.jpg"],
        "rating": 4.5,
        "reviewCount": 8,
        "mealCount": 2,
        "isActive": true,
        "isPublic": true,
        "isImmediate": true,
        "preparationHours": 0,
        "isAvailable": true,
        "isFavorite": true,
        "addedAt": "2026-10-26T10:00:00.000Z",
        "provider": {
          "id": "UUID-prestataire",
          "name": "Nom du prestataire",
          "logo": "https://example.com/logo.jpg",
          "isVerified": true
        }
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }
  }
}
```

Le prix est le prix client actuel, commission comprise, comme dans le catalogue. Un favori ne réserve ni repas ni prix.

## Indisponibilité et suppression

Un abonnement désactivé, dépublié, ou dont le prestataire n'est plus approuvé/actif reste dans les favoris avec `isAvailable: false`. Le client peut l'afficher comme indisponible et permettre son retrait, sans proposer de souscription.

La suppression définitive d'un abonnement ou d'un compte supprime ses favoris par cascade. Les données renvoyées sont les informations actuelles de l'abonnement, pas une copie historique.

## État du cœur dans la découverte

`isFavorite` est ajouté à chaque abonnement dans :

- `GET /api/v1/home` : `data.popular` et `data.recent`.
- `GET /api/v1/subscriptions` : `data.subscriptions`.
- `GET /api/v1/subscriptions/:id` : l'abonnement et `data.providerSubscriptions`.
- `GET /api/v1/providers/:id` : `data.subscriptions`.

Ces routes restent publiques. Sans token valide, `isFavorite` vaut `false`. Avec un token valide, il correspond uniquement au compte connecté. Les résultats personnalisés utilisent `Cache-Control: private, no-store` et les routes de découverte varient sur `Authorization`.

## Intégration mobile et web

1. Lire `isFavorite` pour afficher l'état initial du cœur.
2. Inviter le visiteur à se connecter avant toute mutation.
3. Appeler POST ou DELETE ; bloquer les clics répétés pendant la requête.
4. En cas d'erreur, conserver ou restaurer l'état précédent.
5. Après réussite, mettre à jour le cœur dans toutes les vues et invalider les caches du catalogue, du détail, du profil prestataire et de « Mes favoris ».
6. Séparer les caches par compte et les vider à la déconnexion/changement de compte. Les en-têtes HTTP seuls n'invalident pas les caches applicatifs persistants.
7. « Mes favoris » utilise la pagination renvoyée par GET, pas seulement les abonnements présents en mémoire.

## Erreurs

- 400 : UUID, pagination ou propriétés supplémentaires invalides.
- 401 : token absent/invalide/expiré ou compte supprimé.
- 403 : compte suspendu/désactivé.
- 404 : abonnement absent ou indisponible lors d'un nouvel ajout.

Les réponses suivent le format existant `{ success, message, data }` ou `{ success: false, message, error }`.

## Déploiement et tests

La migration `20261026000000_add_favorites` crée uniquement la table `favorites`, ses index et ses clés étrangères. Elle ne modifie pas les abonnements existants. Appliquer les migrations dans l'environnement cible avant d'y utiliser les nouvelles routes, puis régénérer le client Prisma et compiler le backend.

```bash
cd juna-backend
npm run prisma:migrate:deploy
npm run prisma:generate
npm run build
```

Une suite dédiée peut être exécutée sur une base PostgreSQL locale réservée, nommée `*_favorites_test`, avec le schéma à jour :

```bash
FAVORITES_TEST_DATABASE_URL='postgresql://USER:PASSWORD@127.0.0.1:5432/juna_favorites_test?schema=public' npm run test:favorites
```

La suite refuse les serveurs distants et les noms de base ne respectant pas cette convention. Elle utilise une configuration Jest dédiée car la configuration historique référence un `tests/setup.ts` absent. Les tests créent et suppriment uniquement leurs propres données.
