# Paiements Juna avec FeexPay

Le backend gère les collectes Mobile Money au Bénin : MTN, Moov et Celtiis.
La clé FeexPay reste exclusivement sur le serveur. Les commandes ci-dessous sont
à exécuter depuis le dossier `juna-backend`.

## Configuration

Variables serveur :

```dotenv
FEEXPAY_BASE_URL=https://api-v2.feexpay.me/api
FEEXPAY_API_TOKEN=
FEEXPAY_SHOP_ID=
FEEXPAY_WEBHOOK_SECRET=
```

Le token API, le shop et le secret webhook sont obligatoires en production. Renseigner les secrets
sur l'hébergeur, sans les envoyer au frontend ni les committer.

Dans le dashboard FeexPay, configurer une URL publique HTTPS :

```text
https://VOTRE-DOMAINE-API/api/v1/payments/webhook/feexpay
```

Choisir **Bearer** dans le dashboard. Dans **Header value**, coller uniquement la
valeur de `FEEXPAY_WEBHOOK_SECRET`, sans guillemets ni préfixe `Bearer`. FeexPay doit
ainsi envoyer `Authorization: Bearer <secret>`. Renseigner la même valeur sur
l'hébergeur avant le déploiement. Utiliser un secret dédié, distinct de la clé API.

Choisir **Select events**, puis les événements de transaction réussie et échouée
(`transaction.successful` et `transaction.failed`, selon les libellés du dashboard).
Éviter **All events**, qui inclut des notifications sans rapport avec les collectes.
Cette route accepte les POST JSON sans JWT utilisateur, avec le Bearer dédié. Elle est exemptée du quota global partagé des clients.
L'extrait de documentation fourni ne définit pas de signature de webhook : le backend
ne considère donc pas le corps reçu comme une preuve. Il consulte FeexPay avec sa
clé serveur et contrôle référence, montant et callback avant toute confirmation.
Les secrets de signature ne doivent pas être inventés ou confondus avec la clé API.

## Flux et historique

1. Le client crée une commande, puis appelle `POST /api/v1/payments/initiate`.
2. Le backend verrouille la commande en base et réserve une tentative avant tout
   appel de collecte. Les instances de l'API partagent ce verrou PostgreSQL.
3. Un paiement principal reste associé à la commande. Chaque essai possède une
   entrée `PaymentAttempt` conservée dans l'historique. Le `paymentId` reste stable
   lors des nouvelles tentatives.
4. `callback_info` contient l'UUID de la tentative, et non la commande. Le champ
   `order_id` envoyé par FeexPay correspond à sa référence, pas à l'ID Juna.
5. Le backend enregistre la référence générée par FeexPay. Un succès immédiat est
   également vérifié via l'API statut ; un échec explicite est enregistré immédiatement.
6. Webhook, consultation du client et réconciliation appliquent le même traitement.
   Une tentative terminée reste terminée. Les confirmations répétées ne réécrivent
   ni `paidAt` ni les états de commande et ne renvoient pas les notifications.
7. Les emails sont envoyés au mieux après validation en base. Une panne email ne
   transforme pas un paiement confirmé en échec ; leur livraison n'est pas garantie
   en cas d'arrêt du processus juste après le commit.

Montants : entiers XOF, entre 100 et 2 000 000. Le montant arrondi est conservé dans
la commande, le paiement et la tentative, et correspond au montant demandé.

### Lancement

```http
POST /api/v1/payments/initiate
Authorization: Bearer <JWT utilisateur>
Content-Type: application/json
```

```json
{
  "orderId": "UUID-COMMANDE",
  "phoneNumber": "2290166000000",
  "provider": "MTN"
}
```

`provider` est obligatoire : `MTN`, `MOOV` ou `CELTIIS`. Les anciens codes béninois
`MTN_MOMO_BEN`, `MTN_BEN`, `MOOV_BEN`, `CELTIIS_BJ` et `CELTIIS_BEN` restent acceptés.
Les autres pays/opérateurs sont rejetés, sans bascule implicite vers MTN.
Numéros : 10 chiffres commençant par `01`, avec ou sans préfixe `229` ; les espaces
et signes de présentation habituels sont normalisés.

```json
{
  "success": true,
  "data": {
    "paymentId": "UUID-PAIEMENT",
    "reference": "REFERENCE-FEEXPAY",
    "depositId": "REFERENCE-FEEXPAY",
    "status": "PROCESSING",
    "message": "Paiement en cours. Validez sur votre téléphone et ne relancez pas la demande."
  }
}
```

`depositId` est un alias de compatibilité. La référence peut être `null` si la
réponse de lancement est perdue. L'API fournit quand même `paymentId` pour le suivi.
Le statut peut être immédiatement `SUCCESS` ou `FAILED` : les clients doivent le
traiter avant d'ouvrir l'attente. Répéter le lancement pendant une tentative en cours
renvoie son paiement, sans nouvel appel de collecte.

### Suivi

```http
GET /api/v1/payments/:paymentId/status
Authorization: Bearer <JWT utilisateur>
```

Seul le propriétaire peut consulter ce paiement. Les statuts Juna restent
`PROCESSING`, `SUCCESS`, `FAILED` (et les statuts historiques du modèle).
Une indisponibilité FeexPay conserve le statut connu, sans annoncer un échec fictif.

### Webhook et récupération

Le corps inclut `reference`, `amount`, `status` et éventuellement `callback_info`.
Une référence inconnue est rejetée, sauf si elle peut être rapprochée d'une tentative
réservée grâce au callback, puis vérifiée via l'API FeexPay. Un callback fourni par
l'appelant ne suffit jamais à attacher une référence.

- `200` : événement traité ou doublon sans effet.
- `401` : Bearer webhook absent ou incorrect.
- `503` : secret webhook non configuré sur le serveur.
- `400` : corps mal formé ou notification incohérente.
- `404` : aucune tentative locale correspondante.
- `409` : incohérence avec le montant/callback de la tentative.
- `503` : vérification auprès de FeexPay indisponible ; rien n'est confirmé.
- Une panne de base provoque une erreur, pas un accusé de traitement réussi.

Toutes les minutes, le serveur vérifie jusqu'à 50 tentatives en attente, par groupes
de cinq. Si le lancement a perdu sa référence, il recherche son callback exact dans
l'historique authentifié FeexPay, puis consulte le statut de cette référence.
L'absence dans l'historique ne prouve pas un échec (limite de résultats ou retard).
Une tentative sans référence après dix minutes est marquée `needsReview`, reste en
cours et ne permet pas un nouveau débit. L'historique automatique est limité aux
30 derniers jours ; les cas non retrouvés nécessitent un contrôle du marchand.

Pour une transaction finale dont le webhook n'est pas arrivé, la documentation
FeexPay propose le renvoi depuis son API :

```text
GET https://api-v2.feexpay.me/api/transactions/resend-webhook/{reference}
```

Cette action est réservée à la récupération opérateur. Elle ne relance pas un paiement.
Aucune route Juna publique de renvoi n'est exposée.

## Annulations et contrôles manuels

Une commande avec paiement en cours ou reçu ne peut plus être annulée directement :
l'assistance doit traiter le cas. Aucun remboursement automatique n'est implémenté.
Un paiement tardif pour une ancienne commande annulée est enregistré comme reçu,
mais ne réactive pas la commande : la tentative porte `needsReview=true` et
`reviewReason=PAID_CANCELLED_ORDER`.

Les tentatives à contrôler sont consultables en base dans `payment_attempts` avec
`needsReview=true`. Il n'y a pas encore d'écran administrateur dédié.
Ne jamais transformer un paiement incertain en échec pour autoriser un nouvel essai
sans vérifier la transaction chez FeexPay.

## Migration et déploiement

Migration : `20261107200000_feexpay_payment_attempts`.

- Ajoute `Payment.gateway` et la table d'historique, sans supprimer les paiements.
- Reprend les transactions FeexPay identifiables par `gatewayResponse.reference`.
- Archive également les paiements PawaPay existants dans les tentatives, afin de
  conserver leur historique même après un nouvel essai FeexPay.
- Conserve les anciennes références et les lignes non identifiables comme `PAWAPAY`.
  Les anciens paiements en cours doivent être rapprochés manuellement chez PawaPay ;
  ils ne sont jamais interrogés chez FeexPay ni relancés automatiquement.
- Les anciens essais FeexPay dont la référence n'a jamais été enregistrée avant cette
  correction ne peuvent pas être reconstruits avec certitude : contrôler l'historique
  marchand avant d'autoriser un nouveau paiement pour ces commandes.

```bash
npm run build
npx prisma migrate deploy
npm start
```

Le build régénère le client Prisma. Le démarrage applique les migrations avant de
lancer l'API, et n'exécute plus `db push --accept-data-loss`.
Si la base de production a été créée uniquement avec `db push`, établir d'abord une
baseline de l'historique existant, avec sauvegarde et vérification du schéma. Ne pas
marquer toutes les migrations appliquées sans comparaison. Aucun changement n'a été
appliqué à une base de production pendant l'implémentation.

## Vérifications

`npm run test:payments` utilise exclusivement une base PostgreSQL locale dont le nom
se termine par `_payments_test`, configurée via `PAYMENTS_TEST_DATABASE_URL`.
La passerelle, les emails et les notifications sont simulés ; les verrous, contraintes
et transactions utilisent PostgreSQL réel. Ne jamais pointer ces tests vers une base
réelle du projet. Appliquer les migrations à la base de test avant leur lancement.

Avant publication : vérifier un succès et un échec par opérateur avec le compte de
test ou le mécanisme de test confirmé par FeexPay, un doublon de webhook, un webhook
arrivé avant la réponse de lancement et une fermeture de l'app pendant le paiement.
