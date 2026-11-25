# Jours de repas inclus dans un abonnement

Le champ `serviceDaysCount` est un entier facultatif et nullable sur `Subscription`.
Il précise le nombre de jours de repas compris dans la formule. Il ne change ni
`duration`, ni le prix, ni la date d'expiration, ni le calendrier d'ouverture.
Une journée peut inclure plusieurs repas : ce nombre n'est pas un nombre de repas.

## API

Les routes existantes de création et de modification d'abonnement acceptent :

```json
{
  "duration": "WEEK",
  "serviceDaysCount": 6
}
```

Cet extrait complète le corps habituel de création (nom, description, prix,
repas, etc.). L'approbation d'une proposition accepte également ce champ pour
l'abonnement final créé par le prestataire.

- Champ omis à la création : valeur null, aucune supposition automatique.
- Champ omis à la modification : valeur conservée.
- Champ null à la modification : valeur effacée.
- Valeur fournie : entier entre 1 et 30 et inférieur ou égal à la durée existante.
- Une modification de durée vérifie aussi la valeur de jours déjà enregistrée.

Limites : DAY 1, THREE_DAYS 3, WEEK 7, TWO_WEEKS 14, MONTH 30,
WORK_WEEK 5, WORK_WEEK_2 10, WORK_MONTH 20, WEEKEND 2.
Ces limites suivent la durée d'expiration actuellement appliquée ; elles ne
calculent pas les jours d'ouverture des prestataires.

Le champ est transmis dans les abonnements des détails, listes, accueil,
prestataires, favoris et commandes, ainsi que les relations complètes
utilisées par les abonnements actifs.

## Affichage à brancher dans les clients

Si la valeur est connue : « 1 semaine - 6 jours de repas inclus ».
Si elle vaut null ou est absente : ne pas inventer un nombre de jours de repas.
Les anciens clients peuvent ignorer ce nouveau champ. Le formulaire prestataire
et l'affichage web/mobile doivent être adaptés séparément pour l'exploiter.

## Déploiement

Migration additive : `20261125090000_subscription_service_days`.
Les lignes existantes restent à null, sans recalcul des abonnements actifs.
Le client Prisma doit être régénéré pendant le build et la migration appliquée
avant la mise en service du nouveau backend.

Le Dockerfile actuel utilise `prisma db push` : cela ajoute la colonne mais
n'exécute pas le CHECK SQL de la migration. Les validations API et métier restent
actives. Pour une installation utilisant `prisma migrate deploy`, la migration
ajoute aussi la contrainte SQL 1 à 30. Ne pas changer le mécanisme de migration
d'une base existante sans vérifier son historique.

## Vérification locale

```sh
npx jest --config jest.service-days.config.js --runInBand
npx tsc --noEmit
```

Ces tests utilisent des repositories simulés : aucun appel à la base réelle,
aucun paiement, aucun email. Le calcul d'expiration n'est pas modifié.
