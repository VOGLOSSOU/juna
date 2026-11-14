# Intégrer la collecte Mobile Money FeexPay dans un backend

Guide de transmission à un développeur - version du 8 novembre 2026.

Ce document explique l'architecture et les étapes d'une intégration backend de
collecte d'argent avec FeexPay. Il s'appuie sur l'intégration Node.js, TypeScript,
Express et PostgreSQL de Juna Eats, testée avec ses clients web et mobile. Il peut
être transmis indépendamment du PDF fournisseur et adapté à un autre projet.

Le périmètre effectivement implémenté est le **payin Mobile Money au Bénin** :
MTN, Moov et Celtiis, en XOF. Les autres pays, les cartes, les payouts, les
reversements aux vendeurs et les remboursements nécessitent leur propre étude.
Un paiement collecté ne prouve pas qu'un vendeur a reçu un reversement.

Les valeurs commerciales, les réseaux et les contrats API doivent être revérifiés
avec FeexPay avant de réutiliser ce guide dans un autre pays ou à une autre date.
Les exemples ne contiennent aucun secret réel.

## Sommaire

1. Architecture et responsabilités
2. Compte FeexPay et configuration serveur
3. Routes et contrat avec les applications
4. Modèle de données et états
5. Adaptateur HTTP FeexPay
6. Initier une collecte sans double débit
7. Vérifier et finaliser un paiement
8. Recevoir et authentifier le webhook
9. Retrouver une réponse perdue et réconcilier
10. Expérience client et règles de relance
11. Notifications email facultatives
12. Remplacer PawaPay sans casser l'historique
13. Déploiement et exploitation
14. Tests, diagnostic et checklist
15. Références d'implémentation

## 1. Architecture et responsabilités

Le client transmet une commande, un numéro de téléphone et un opérateur à votre
backend. Le backend lit le montant de la commande, réserve une tentative en base,
puis demande à FeexPay de lancer la collecte.

La clé FeexPay reste uniquement sur le serveur. Le client ne fournit ni le prix
final, ni un statut de paiement faisant autorité, ni le code PIN Mobile Money.
Le PIN se saisit dans le parcours de l'opérateur, jamais dans votre application.

```mermaid
sequenceDiagram
    participant C as Client web ou mobile
    participant B as Backend
    participant D as PostgreSQL
    participant F as FeexPay
    C->>B: Initier pour une commande
    B->>D: Verrouiller la commande et réserver une tentative
    D-->>B: Réservation persistée
    B->>F: requesttopay avec callback_info unique
    F-->>B: Référence et état initial
    B->>D: Associer la référence à la tentative
    B-->>C: paymentId et état local
    F->>B: Webhook authentifié
    B->>F: Relire le statut avec la clé marchande
    F-->>B: Référence, montant et statut
    B->>D: Finaliser une seule fois
    C->>B: Lire le statut
    B-->>C: État vérifié
```

Trois mécanismes convergent vers la **même fonction de vérification/finalisation** :
le webhook, la consultation de statut par le client et un job de réconciliation.
Ils ne doivent pas chacun implémenter une logique différente de confirmation.

## 2. Compte FeexPay et configuration serveur

### Informations à obtenir

Préparer un compte marchand et une boutique autorisés pour les collectes et les
réseaux ciblés. Récupérer l'identifiant de boutique et le token API dans le compte
FeexPay. Confirmer les conditions d'activation et de test avec le fournisseur.

Créer en plus un secret de webhook propre à votre application :

```bash
openssl rand -hex 32
```

Ce secret est distinct du token API marchand et des tokens de connexion des
utilisateurs. Stocker les secrets dans le gestionnaire de variables de votre
hébergeur, pas dans Git, les applications clientes ou un document partagé.

### Variables d'environnement

```dotenv
FEEXPAY_BASE_URL=https://api-v2.feexpay.me/api
FEEXPAY_API_TOKEN=REMPLACER_PAR_LE_TOKEN_MARCHAND
FEEXPAY_SHOP_ID=REMPLACER_PAR_L_IDENTIFIANT_BOUTIQUE
FEEXPAY_WEBHOOK_SECRET=REMPLACER_PAR_UN_SECRET_DEDIE
```

Charger l'environnement **avant de construire le client HTTP FeexPay**. Dans une
application Node.js locale, charger `dotenv` au point d'entrée. En production,
vérifier les variables injectées dans le service qui exécute réellement l'API.
Faire échouer le démarrage de production si une variable indispensable manque.

Les environnements de test et de production doivent avoir leurs propres
identifiants et données. Ne pas supposer qu'un numéro ou un endpoint de test
existe : utiliser les modalités de sandbox confirmées pour votre compte.

### Configuration du webhook dans le dashboard

| Champ | Valeur à configurer |
|---|---|
| URL | `https://api.votre-domaine.example/api/v1/payments/webhook/feexpay` |
| Header type | `Bearer` |
| Header value | La valeur brute de `FEEXPAY_WEBHOOK_SECRET` |
| Événements | Les événements de succès et d'échec des collectes, selon les libellés du dashboard |

Dans « Header value », ne pas ajouter soi-même le préfixe `Bearer`, ni des
espaces ou des guillemets. Le header reçu par l'API doit être :

```http
Authorization: Bearer VOTRE_SECRET_WEBHOOK
Content-Type: application/json
```

Dans Juna Eats, « All events » a été conservé. Cela ne rend pas tous les événements
compatibles avec notre endpoint : il valide un payload de **transaction**, pas un
résultat d'export d'historique. Pour un nouveau projet, préférer une sélection
ciblée ou ajouter un routage explicite des types d'événements non transactionnels.
Ne pas convertir un événement inconnu en paiement réussi.

## 3. Routes et contrat avec les applications

Les chemins ci-dessous sont ceux choisis pour notre API. Ce ne sont pas des
routes imposées par FeexPay.

| Route de votre backend | Authentification | Rôle |
|---|---|---|
| `POST /api/v1/payments/initiate` | Session/JWT utilisateur | Réserver et lancer ou reprendre un paiement |
| `GET /api/v1/payments/:id/status` | Session/JWT utilisateur | Retourner un état local, éventuellement rafraîchi auprès de FeexPay |
| `POST /api/v1/payments/webhook/feexpay` | Bearer webhook dédié | Recevoir le signal fournisseur et vérifier la transaction |
| `GET /api/v1/orders/:id` | Propriétaire de la commande | Retrouver le paiement après une réponse d'initiation perdue |

### Demande du client

```json
{
  "orderId": "00000000-0000-4000-8000-000000000001",
  "phoneNumber": "2290166000000",
  "provider": "MTN"
}
```

Le serveur vérifie la propriété de la commande, son état et son montant en base.
Ne pas ajouter un champ `amount` fourni par le client comme source de vérité.
Valider l'identifiant UUID, le téléphone et l'opérateur avant tout appel financier.

### Réponse d'initiation

```json
{
  "success": true,
  "data": {
    "paymentId": "00000000-0000-4000-8000-000000000002",
    "reference": "REFERENCE_RETOURNEE_PAR_FEEXPAY",
    "status": "PROCESSING",
    "message": "Paiement en cours. Validez sur votre téléphone."
  }
}
```

`reference` peut être `null` si la tentative est persistée mais que la réponse
FeexPay est perdue. Un HTTP 200 et un `paymentId` ne signifient pas que le client
a payé. L'état peut aussi être immédiatement `SUCCESS` ou `FAILED`.
L'ancien alias `depositId` de Juna n'est pas nécessaire dans un projet neuf.

La consultation de statut retourne notamment `id`, `orderId`, `amount`,
`currency`, `method`, `status`, `paidAt` et `createdAt`. Vérifier que le paiement
appartient à l'utilisateur authentifié avant de retourner ces données.

La commande doit exposer explicitement `payment: null` lorsqu'aucun paiement
n'existe. Un champ absent, une réponse mal formée ou une erreur réseau ne
constituent pas une preuve d'absence de paiement.

## 4. Modèle de données et états

Distinguer la commande, le paiement métier et ses tentatives.

| Entité | Informations principales | Contraintes importantes |
|---|---|---|
| Commande | Propriétaire, montant calculé, devise, statut | Identifiant stable pendant les reprises |
| Paiement | `orderId`, `userId`, montant, devise, méthode, statut, passerelle, référence courante, `paidAt` | Un paiement métier par commande ; référence fournisseur unique lorsqu'elle existe |
| Tentative | `paymentId`, `callbackInfo`, opérateur, téléphone, montant figé, référence, statut, réponse, dates de contrôle, motif de revue | Nouvelle tentative après échec final ; référence unique |

Dans Juna : `Payment.orderId` est unique ; `Payment.transactionId` et
`PaymentAttempt.reference` sont uniques et acceptent `null`. La tentative utilise
un UUID aléatoire, réutilisé comme `callback_info` envoyé à FeexPay.

Après un échec confirmé, le paiement métier garde le même identifiant mais une
**nouvelle tentative** est créée. Les anciennes tentatives restent consultables.
Cela permet de rattacher un vieux webhook à la bonne tentative.

### Correspondance des états

| État reçu de FeexPay | Traitement local |
|---|---|
| `PENDING` | Rester en cours |
| `IN PENDING STATE` | Rester en cours |
| `SUCCESSFUL` | Passer à `SUCCESS` après vérification des données |
| `FAILED` | Passer à `FAILED` après traitement vérifié |
| Statut inconnu ou réponse illisible | Erreur technique ou résultat incertain, jamais succès ni échec supposé |

`PROCESSING` est un état local : il n'est pas le nom du succès fournisseur.
`REFUNDED` peut exister dans votre métier, mais ce guide n'implémente pas une API
de remboursement FeexPay.

Le paiement et la commande ont des cycles distincts. Dans notre projet, un
paiement réussi confirme la commande ; l'activation de l'abonnement intervient
ensuite selon le parcours métier. Ne pas confondre ces deux opérations.

## 5. Adaptateur HTTP FeexPay

Notre intégration utilise l'API v2 en HTTP, pas un SDK de paiement côté client.
Dans un projet Node.js/TypeScript existant :

```bash
npm install axios zod
```

Les autres dépendances de notre architecture sont Express, Prisma/PostgreSQL et
`node-cron`. Les imports et types de votre projet doivent être adaptés.

### Initialisation du client

Extrait réutilisable, à placer dans un module chargé après l'environnement :

```ts
import axios from 'axios';
import { z } from 'zod';

const token = process.env.FEEXPAY_API_TOKEN;
const shop = process.env.FEEXPAY_SHOP_ID;
if (!token || !shop) throw new Error('Configuration FeexPay incomplète');

const http = axios.create({
  baseURL: process.env.FEEXPAY_BASE_URL || 'https://api-v2.feexpay.me/api',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  timeout: 30_000,
});

const referenceSchema = z.string().min(1).max(160).regex(/^[a-zA-Z0-9_-]+$/);
const responseSchema = z.object({
  reference: referenceSchema,
  status: z.enum(['PENDING', 'IN PENDING STATE', 'SUCCESSFUL', 'FAILED']),
  amount: z.coerce.number().finite().positive().optional(),
  callback_info: z.union([z.string(), z.record(z.unknown())]).nullable().optional(),
}).passthrough();

async function requestToPay(
  network: 'mtn' | 'moov' | 'celtiis_bj',
  payload: { phoneNumber: string; amount: number; description: string; callback_info: string },
) {
  const response = await http.post(`/transactions/public/requesttopay/${network}`, {
    ...payload,
    shop,
  });
  return responseSchema.parse(response.data);
}

async function getVerifiedStatus(reference: string) {
  const safe = referenceSchema.parse(reference);
  const response = await http.get(
    `/transactions/public/single/status/${encodeURIComponent(safe)}`,
  );
  return responseSchema.extend({ amount: z.coerce.number().finite().positive() })
    .parse(response.data);
}
```

Cet extrait illustre le transport et la validation. Il ne remplace pas les
transactions, la réservation en base, l'authentification et la classification
d'erreurs des sections suivantes. Aucun mécanisme de retry automatique du POST
de collecte ne doit être ajouté par un intercepteur HTTP ou un proxy.

### Codes opérateurs

| Choix de l'utilisateur | Suffixe de l'endpoint FeexPay |
|---|---|
| MTN Bénin | `mtn` |
| Moov Bénin | `moov` |
| Celtiis Bénin | `celtiis_bj` |

Utiliser une liste blanche. Notre code accepte aussi certains anciens alias
comme `MTN_MOMO_BEN`, mais ils ne sont pas nécessaires à une intégration neuve.
L'orthographe du code réseau FeexPay est indépendante de celle de votre enum local.

### Numéros et montants

Pour le Bénin, notre normalisation accepte `01` suivi de huit chiffres, avec ou
sans l'indicatif `229`, et retire espaces, parenthèses, points, tirets et `+`.
La valeur envoyée est `229` suivi du numéro local à dix chiffres.
Rejeter les formats ambigus plutôt qu'inventer un préfixe.

Le montant provient de la commande. Notre service l'arrondit à l'entier XOF et
utilise le même entier dans la commande, le paiement, la tentative et FeexPay.
Il applique une borne de 100 à 2 000 000 XOF, issue de la documentation fournie.
Revérifier ces bornes pour le contrat marchand ciblé. Dans un projet neuf,
stocker les montants dans un type entier ou décimal approprié et définir
explicitement la règle d'arrondi.

La description de notre collecte est un libellé court construit côté serveur,
par exemple `Commande COMMANDE_001`, normalisé aux caractères autorisés par
l'intégration. Éviter les données sensibles et les descriptions libres du client.

## 6. Initier une collecte sans double débit

### Réservation atomique avant l'appel réseau

L'algorithme suivant constitue la logique de service, pas un simple contrôleur :

1. Ouvrir une transaction PostgreSQL.
2. Verrouiller la ligne de commande avec `SELECT ... FOR UPDATE`.
3. Vérifier propriétaire, statut encore payable, montant et devise.
4. Chercher le paiement existant et ses tentatives.
5. Si une tentative FeexPay est encore en cours, la reprendre sans nouvelle collecte.
6. Refuser une nouvelle tentative si le paiement est déjà réussi, remboursé,
   incertain ou marqué pour contrôle.
7. Après un échec final sans tentative incertaine, créer une nouvelle tentative.
8. Persister le paiement en `PROCESSING`, le montant figé et l'UUID de tentative.
9. Valider la transaction.
10. Appeler FeexPay **uniquement si la réservation vient d'être créée**.

Exemple de verrou paramétré Prisma :

```ts
await tx.$queryRaw`
  SELECT id FROM orders WHERE id = ${orderId}::uuid FOR UPDATE
`;
```

Le verrou est partagé entre toutes les instances qui utilisent cette base.
Un booléen en mémoire ou un bouton désactivé côté client ne suffit pas.
La vérification d'annulation de commande doit prendre le même verrou et bloquer
une annulation ordinaire pendant un paiement en cours ou réussi.

Ne pas maintenir la transaction de réservation ouverte pendant l'appel HTTP.
On veut une trace persistée même si le processus s'arrête après le départ de la
requête. `callback_info` sert à retrouver cette tentative ; ce champ n'est pas,
à lui seul, une garantie d'idempotence fournie par FeexPay.

### Associer la référence reçue

Persister la référence FeexPay sur la tentative et le paiement sous verrou.
Si un webhook a déjà finalisé la tentative avant le retour du POST, ne pas
réécrire son statut final avec l'état initial de la réponse HTTP.

Si le POST annonce immédiatement `SUCCESSFUL`, notre implémentation relit aussi
le statut via l'API authentifiée avant confirmation. Une réponse immédiate
`FAILED` validée peut finaliser la tentative. Une réponse initiale en cours ne
constitue pas un paiement acquis.

### Distinguer refus certain et résultat incertain

| Résultat du POST FeexPay | Décision de notre adaptateur |
|---|---|
| HTTP 400, 401, 403, 404 ou 422 | Classé comme refus explicite de la demande |
| Timeout, absence de réponse, HTTP 5xx ou 429 | Résultat incertain, ne pas relancer automatiquement |
| Réponse HTTP avec JSON ou statut inattendu | Résultat incertain |

Cette liste est la politique de notre code, à confronter aux garanties du
fournisseur. Un refus de configuration comme 401 exige de corriger la clé ;
réessayer avec les mêmes paramètres n'y remédie pas.

Sur un refus certain, la tentative peut passer à `FAILED` si elle n'a pas déjà
été reliée à une transaction ou finalisée. Sur un résultat incertain, conserver
`PROCESSING` et lancer les mécanismes de récupération. Un timeout peut arriver
**après** l'acceptation de la demande par l'opérateur.

## 7. Vérifier et finaliser un paiement

### Vérifications de données

À partir d'une référence déjà connue, appeler le statut FeexPay avec la clé
marchande. Contrôler la référence exacte et le montant attendu.

Comparer également `callback_info` lorsqu'il est présent et exploitable. Notre
adaptateur reconnaît soit une chaîne, soit un objet contenant `order_id`.
Pour une référence déjà liée, FeexPay peut renvoyer un callback absent : notre
code contrôle alors la référence connue et le montant, sans inventer un callback.

Pour rattacher une **nouvelle référence** à une tentative dont la réponse a été
perdue, exiger un callback correspondant exactement à la tentative dans la
réponse de l'API marchande. Le callback du webhook seul ne suffit pas.

Les endpoints utilisés ici ne fournissent pas tous une devise dans le contrat
validé. Notre périmètre fixe donc XOF pour ces réseaux béninois ; ne pas prétendre
vérifier un champ de devise absent. Une intégration multidevise doit définir
son contrôle supplémentaire avec le fournisseur.

### Finalisation atomique et monotone

Dans une transaction avec verrou de commande :

- Recharger la tentative ; si elle est déjà finale, ne pas la rouvrir.
- En cas de montant, référence ou callback incohérent, marquer la tentative pour
  revue, conserver le blocage et ne pas livrer la prestation.
- Pour `SUCCESSFUL`, mettre le paiement à `SUCCESS` et renseigner `paidAt`.
- Pour `FAILED`, finaliser l'échec sans confirmer la commande.
- Mettre à jour la commande seulement si elle est encore `PENDING`.

Utiliser une mise à jour conditionnelle et son nombre de lignes modifiées pour
savoir quelle exécution a réellement confirmé la commande. Un webhook dupliqué,
un polling simultané et le job peuvent tous arriver au même moment.

Une commande déjà `ACTIVE` ou `COMPLETED` ne doit pas revenir à `CONFIRMED`.
Un succès tardif sur une commande annulée reste une réalité financière : conserver
la trace du paiement réussi, signaler le cas pour contrôle, sans réactiver la
commande ni inventer un remboursement.

Déclencher les effets métier et notifications après commit. Un échec d'email ne
doit pas faire apparaître un paiement confirmé comme échoué.

## 8. Recevoir et authentifier le webhook

Le webhook est un POST machine à machine. Monter sa route **avant** un éventuel
middleware global imposant une session utilisateur. Il utilise le Bearer dédié,
pas le JWT d'un client.

Extrait de middleware Express réutilisable :

```ts
import { createHash, timingSafeEqual } from 'node:crypto';
import type { RequestHandler } from 'express';

export const authenticateWebhook: RequestHandler = (req, res, next) => {
  const secret = process.env.FEEXPAY_WEBHOOK_SECRET;
  if (!secret || secret.trim() !== secret) {
    res.status(503).json({ success: false, message: 'Webhook non configuré' });
    return;
  }
  const match = /^Bearer ([^\s]+)$/i.exec(req.get('authorization') ?? '');
  if (!match) {
    res.status(401).json({ success: false, message: 'Authentification invalide' });
    return;
  }
  const digest = (value: string) => createHash('sha256').update(value).digest();
  if (!timingSafeEqual(digest(match[1]), digest(secret))) {
    res.status(401).json({ success: false, message: 'Authentification invalide' });
    return;
  }
  next();
};
```

Cette comparaison authentifie un secret de transport. Elle ne constitue pas
une signature cryptographique du payload. Notre intégration n'invente aucun
header de signature HMAC non défini dans la documentation utilisée.

Exemple illustratif de payload :

```json
{
  "reference": "REFERENCE_FEEXPAY",
  "status": "SUCCESSFUL",
  "amount": 3111,
  "callback_info": "00000000-0000-4000-8000-000000000003"
}
```

Valider le JSON, puis :

1. Trouver la tentative par référence connue.
2. À défaut, utiliser le callback comme indice pour chercher une tentative en
   cours, sans référence, dans votre base.
3. Rejeter une référence sans tentative identifiable.
4. Relire la transaction auprès de FeexPay avec le token marchand.
5. Vérifier référence et montant ; pour une nouvelle association, vérifier aussi
   le callback retourné par FeexPay.
6. Appeler la fonction de finalisation commune avec **la réponse relue**, pas le
   statut simplement annoncé dans le webhook.

Retourner 200 après traitement ou pour un doublon déjà finalisé. Sur panne de
vérification, retourner une erreur temporaire et garder le paiement en cours.
Notre code utilise 503 pour l'indisponibilité FeexPay, 401 pour un Bearer invalide,
400/409 pour des données incohérentes selon le contrôle et 404 pour une tentative
inconnue. Un corps mal formé n'est pas silencieusement accepté comme un succès.

Exclure ce callback du quota global partagé des utilisateurs. Garder les contrôles
propres au webhook : authentification, validation, bornes de payload et supervision.
Ne pas exempter toutes les routes de paiement des contrôles de sécurité.

Avec Express 4, transférer les rejets des handlers async à `next`, par exemple :

```ts
const handled = (fn: import('express').RequestHandler): import('express').RequestHandler =>
  (req, res, next) => { Promise.resolve(fn(req, res, next)).catch(next); };
```

## 9. Retrouver une réponse perdue et réconcilier

### Historique authentifié

Quand une tentative est persistée mais sans référence, rechercher son callback
exact dans l'historique marchand :

```http
POST https://api-v2.feexpay.me/api/transactions/history
Authorization: Bearer VOTRE_TOKEN_API
Content-Type: application/json
```

```json
{
  "start_date": "2026-11-01",
  "end_date": "2026-11-02",
  "shop": "VOTRE_SHOP_ID",
  "type": "PAYIN",
  "status": "ALL"
}
```

Le résultat attendu comporte `success: true` et un tableau `data`. Filtrer les
lignes par correspondance exacte de `callback_info`. Pour zéro correspondance,
conserver l'incertitude ; pour plusieurs correspondances, demander un contrôle.
Pour une correspondance unique, relire son statut et vérifier ses données avant
de l'appliquer.

La documentation PDF consultée borne une requête d'historique à 31 jours et à
500 transactions. Notre récupération utilise une fenêtre courte autour de la
création et cesse la recherche automatique au-delà de 30 jours. Ce mécanisme
peut donc manquer une ligne : son absence ne prouve jamais l'absence d'un débit.
Pour les gros volumes, prévoir avec FeexPay une stratégie d'historique ou d'export
adaptée, sans transformer un export asynchrone en webhook de paiement ordinaire.

### Job de réconciliation des paiements

Notre job s'exécute chaque minute et traite au maximum 50 tentatives FeexPay en
cours, vieilles d'au moins une minute et non vérifiées depuis au moins une minute.
Il limite les appels concurrents à cinq et isole les erreurs par tentative.
Il passe par la même logique que le polling et le webhook.

Ce job sert quand l'application client est fermée ou qu'un webhook est perdu.
Il est **distinct du job de secours des emails**, qui s'exécute toutes les
15 minutes. Adapter la fréquence et les quotas au volume réel. Un verrou en
mémoire limite le chevauchement dans un processus ; plusieurs réplicas peuvent
encore lire le statut simultanément. Les transactions et conditions en base
protègent la finalisation ; un verrou distribué peut réduire ces lectures doubles.

Sans référence retrouvée après dix minutes, notre service marque
`needsReview: true` avec `INITIATION_OUTCOME_UNKNOWN`, sans déclarer un échec.
Il n'existe pas de délai local qui rend automatiquement un paiement FeexPay
certainement impossible. Si le fournisseur reste en cours, demander sa politique
d'expiration ou d'annulation avant d'autoriser un nouveau débit.

### Demander le renvoi d'un webhook

La documentation fournie décrit :

```http
GET https://api-v2.feexpay.me/api/transactions/resend-webhook/REFERENCE_FEEXPAY
Authorization: Bearer VOTRE_TOKEN_API
```

Cette opération concerne une transaction finale `SUCCESSFUL` ou `FAILED`.
Une transaction inconnue ou encore en cours entraîne une erreur 400 selon cette
documentation. La réponse d'acceptation du renvoi indique une mise en file, pas
que votre backend a déjà reçu le webhook. Ce renvoi ne doit jamais déclencher une
nouvelle collecte. Il s'agit d'un outil d'exploitation, pas d'une route publique
à exposer sans authentification dans votre projet.

## 10. Expérience client et règles de relance

Le frontend n'a besoin que des routes de votre backend et du statut local.
Notre parcours web/mobile suit ces règles :

- Conserver `orderId` et `paymentId` pour reprendre la même commande.
- Une réponse incertaine à l'initiation ouvre une vérification, pas un nouveau POST.
- Sérialiser les lectures de statut : une lecture lente ne doit pas s'empiler avec
  les suivantes.
- Arrêter le polling automatique intensif au bout d'environ trois minutes et
  proposer « Vérifier le paiement ». La fermeture de cet écran ne ferme pas le
  paiement financier.
- Autoriser une nouvelle tentative après un échec final confirmé par le serveur.
- Si aucun paiement n'a été créé, attendre la fenêtre d'initiation de 90 secondes,
  puis exiger une **nouvelle** réponse serveur avec `payment: null` avant de
  proposer « Relancer le paiement ».
- Au clic sur cette relance, relire encore la commande ; un paiement peut avoir
  été enregistré entre-temps. Réutiliser la même commande.
- Ne pas considérer un champ manquant, un 404 quelconque, un timeout ou une perte
  de réseau comme la preuve qu'aucun paiement n'existe.

La fenêtre de 90 secondes est un choix des clients Juna, pas une expiration
financière FeexPay. Nos timeouts sont 30 secondes pour l'adaptateur FeexPay,
90 secondes pour le POST client vers notre backend et 45 secondes pour certaines
lectures client de statut. Ce sont des délais HTTP, pas des statuts de paiement.

## 11. Notifications email facultatives

Les emails sont un effet secondaire. Dans Juna, un succès vérifié déclenche une
alerte administrateur Brevo après commit, en arrière-plan. Un suivi durable du
paiement permet de rattraper un envoi manqué au démarrage et toutes les 15 minutes.

```dotenv
BREVO_API_KEY=REMPLACER_PAR_LA_CLE_BREVO
BREVO_SENDER_EMAIL=expediteur-verifie@votre-domaine.example
BREVO_SENDER_NAME=Votre application
PAYMENT_NOTIFICATIONS_ENABLED=true
PAYMENT_NOTIFICATION_EMAIL=alertes@votre-domaine.example
```

Notre suivi comprend `adminEmailSentAt`, un token de réservation et une date de
prochaine tentative. La réservation atomique évite deux envois simultanés entre
instances ; un délai minimal de cinq minutes précède une reprise après erreur.
Le prochain passage du job peut intervenir plus tard. Un lot vide ne produit pas
de log de routine.

Ne pas coder l'adresse personnelle du destinataire d'un autre projet en dur.
Un statut « envoyé » signifie accepté par le prestataire email, pas nécessairement
livré dans la boîte principale. La protection par clé d'idempotence Brevo a une
fenêtre limitée ; ne pas promettre une livraison exactement une fois malgré
n'importe quelle durée de panne. Les notifications clients/prestataires de Juna
sont en partie en best effort : leur durabilité n'est pas celle du suivi email
administrateur. Utiliser un outbox durable si toutes doivent être garanties.

## 12. Remplacer PawaPay sans casser l'historique

La migration de passerelle ne consiste pas à renommer tous les anciens paiements.

1. Inventorier variables, services, routes, SDK, formulaires et libellés PawaPay.
2. Conserver la passerelle d'origine sur chaque paiement historique.
3. Ajouter les nouvelles tentatives et références FeexPay sans perdre les anciennes.
4. N'identifier un ancien paiement comme FeexPay que sur une preuve cohérente dans
   les données enregistrées, par exemple une référence de réponse exactement égale
   à `transactionId`. Ne pas déduire le fournisseur de la seule longueur de l'ID.
5. Ne jamais interroger FeexPay avec une référence historique réellement PawaPay.
6. Si des paiements PawaPay sont encore en cours, définir leur suivi de transition
   avant de retirer les anciens callbacks et identifiants nécessaires.
7. Mettre les clients à jour : opérateurs pris en charge, noms d'états, références
   éventuellement nulles, reprise et messages d'attente.
8. Vérifier les tests et le déploiement avant de retirer les secrets inutilisés.

Dans Juna, le paiement courant possède un champ `gateway` et les tentatives ont
leur propre passerelle. L'historique n'est pas mélangé à la nouvelle collecte.
L'alerte email peut reconnaître certains succès FeexPay anciens sans réécrire
leur étiquette en base. Cela ne migre pas leurs tentatives ni leur suivi financier.

## 13. Déploiement et exploitation

### Base de données

Pour un projet neuf, utiliser des migrations versionnées puis :

```bash
npx prisma generate
npm run build
npx prisma migrate deploy
```

Ces commandes sont un schéma de déploiement à adapter à votre projet. Ne pas
exécuter une réinitialisation de base ou une acceptation automatique de perte de
données pour mettre un paiement en production.

**Retour d'expérience concret :** le `package.json` de Juna utilise
`prisma migrate deploy` au démarrage, mais son `Dockerfile` historique lance
encore `prisma db push --accept-data-loss`. Le Dockerfile est alors la commande
réellement exécutée sur Railway. Une base « synchronisée » par `db push` peut
avoir les colonnes attendues sans les rattrapages SQL des migrations.

Avant de passer une base existante aux migrations, inspecter son schéma et son
historique, établir une baseline et tester sur une copie. Ne pas lancer toutes
les anciennes migrations au hasard sur la production. Ce guide documente cette
limite existante ; il n'affirme pas que la baseline a déjà été établie.

### Réseau et application

Vérifier HTTPS public, méthode POST, parser JSON, absence de redirection et bonne
configuration du proxy. Une URL frontend, une page de connexion ou un endpoint
exigeant le JWT utilisateur ne peut pas recevoir ce webhook correctement.

Sur Express derrière Railway, configurer le proxy conformément au déploiement.
Éviter les logs complets d'erreurs Axios : ils peuvent contenir le header marchand.
Journaliser plutôt l'identifiant de tentative, la référence quand approprié,
le statut HTTP et un code d'erreur filtré. Limiter l'accès aux données de paiement.

Surveiller les paiements en cours, les tentatives sans référence, les motifs de
revue, les échecs de vérification et l'âge de la dernière réconciliation. Les
compteurs et un webhook acceptés ne remplacent pas une vérification de paiement.

### Diagnostic rapide

| Symptôme | Vérifications prioritaires |
|---|---|
| Configuration incomplète | Variables du service exécuté, chargement avant construction du client |
| HTTP 401/403 côté FeexPay | Token marchand et autorisations, environnement utilisé |
| Webhook 401 | Bearer dédié identique des deux côtés, sans double préfixe ni espaces |
| Webhook 404 | URL, version API et association référence/tentative |
| Webhook 503 | Configuration ou consultation FeexPay indisponible ; préserver l'état en cours |
| Paiement bloqué sans référence | Tentative durable, callback exact, historique borné et contrôle manuel |
| Paiement toujours en cours | Statut distant et politique d'expiration fournisseur ; pas de faux échec local |
| Email absent avec zéro paiement éligible | Il n'y a rien à envoyer ; ce n'est pas forcément une panne Brevo |
| Email refusé avec un lot non vide | Code/statut Brevo, clé, expéditeur et suivi d'envoi |
| Redis indisponible | Dans notre implémentation, collecte et alertes reposent sur PostgreSQL/HTTP, pas Redis |

## 14. Tests, diagnostic et checklist

Les tests automatiques doivent utiliser une base isolée et des doublures FeexPay,
pas de vrais numéros à débiter. Ne jamais exécuter une suite qui supprime ses
fixtures contre la base de production.

### Scénarios à automatiser

- Appel non authentifié et accès au paiement d'un autre compte refusés.
- Montant calculé côté serveur ; téléphone et opérateur invalides rejetés avant POST.
- Réservation visible en base avant que l'appel FeexPay ne se termine.
- Deux initiations concurrentes produisant une seule demande de collecte.
- Résultat immédiat, timeout, 429, 5xx et réponse mal formée.
- Réponse perdue récupérée par callback exact, sans nouveau débit.
- Webhook sans JWT utilisateur, Bearer absent/invalide et secret non configuré.
- Faux succès, montant incorrect, référence incorrecte et callback falsifié.
- Webhook arrivé avant la réponse d'initiation.
- Webhook et polling simultanés : une seule confirmation métier.
- Vieux webhook rejoué après une nouvelle tentative : aucun retour en arrière.
- Succès tardif sur une commande active, terminée ou annulée.
- Annulation concurrente avec initiation.
- Réconciliation sans client connecté ; panne d'une référence isolée du reste du lot.
- Échec email n'altérant pas le paiement ; reprise durable et protection des doublons.
- Client hors réseau : pas de fausse absence ; vraie absence confirmée après la fenêtre.

### Exécuter les tests de notre dépôt

Depuis `juna-backend`, préparer une base locale dédiée dont le nom termine par
`_payments_test`, puis appliquer le schéma exclusivement sur cette base de tests.
La suite refuse une cible distante ou un nom non conforme.

```bash
export PAYMENTS_TEST_DATABASE_URL='postgresql://UTILISATEUR:MOT_DE_PASSE@127.0.0.1:55441/projet_payments_test?schema=public'
npm run test:payments
```

L'utilisateur PostgreSQL doit pouvoir créer le schéma isolé utilisé par le test
de migration. Les identifiants ci-dessus sont des placeholders. Le schéma doit
être prêt avant le lancement ; la suite n'installe pas PostgreSQL elle-même.

### Recette réelle contrôlée

Après les tests simulés, avec accord du titulaire du wallet et le mode de test
confirmé par FeexPay, vérifier initiation, demande opérateur, succès, refus,
webhook, fermeture de l'application et reprise. Si une collecte réelle est
nécessaire à la recette, son montant et son autorisation doivent être explicites.
Ne pas utiliser un exemple de commande HTTP comme test financier automatique.

### Critères avant ouverture aux utilisateurs

- [ ] Secrets et boutique correctement configurés, aucune clé dans le frontend.
- [ ] Prix serveur, propriété des commandes et opérateurs contrôlés.
- [ ] Réservation durable et protection concurrente des initiations.
- [ ] Webhook dédié joignable et authentifié ; statut relu côté serveur.
- [ ] Finalisation atomique, idempotente et sans retour en arrière.
- [ ] Tentatives incertaines conservées et procédure de contrôle définie.
- [ ] Réconciliation fonctionnelle lorsque le client est absent.
- [ ] Relance proposée uniquement lorsque le serveur l'autorise.
- [ ] Migration de passerelle et commande réelle de démarrage vérifiées.
- [ ] Recette de bout en bout, supervision et accès aux logs disponibles.

## 15. Références d'implémentation

### Documentation fournisseur

- [Documentation officielle FeexPay](https://docs.feexpay.me/).
- Le PDF FeexPay transmis au projet, relu pour ce guide. Il est une référence de
  contrat, mais n'est pas requis pour comprendre l'architecture expliquée ici.
- [Idempotence email Brevo](https://developers.brevo.com/docs/heterogenous-versions-batch-emails)
  pour l'extension de notifications, indépendante de la collecte.

Les paramètres précis ci-dessus proviennent surtout de l'adaptateur backend et
du PDF fourni. Le portail officiel reste la source à consulter pour leurs mises
à jour ; ce guide ne prétend pas couvrir tous les produits FeexPay.

### Où retrouver le code Juna si le dépôt est accessible

| Fichier relatif au dépôt | Contenu |
|---|---|
| `juna-backend/src/services/feexpay.service.ts` | Client HTTP, réseaux, téléphone, schémas de réponse, historique |
| `juna-backend/src/services/payment.service.ts` | Réservation, association de référence, finalisation, webhook, réconciliation |
| `juna-backend/src/middlewares/feexpay-webhook.middleware.ts` | Authentification Bearer du webhook |
| `juna-backend/src/validators/payment.validator.ts` | Validation des entrées client et webhook |
| `juna-backend/src/routes/payment.routes.ts` | Routes et transfert des erreurs async Express 4 |
| `juna-backend/src/utils/payment-lock.util.ts` | Verrou PostgreSQL sur la commande |
| `juna-backend/prisma/schema.prisma` | Paiements, tentatives et suivi des alertes |
| `juna-backend/src/jobs/cron.jobs.ts` | Fréquences de réconciliation et de reprise email |
| `juna-backend/src/services/payment-email.service.ts` | Alertes durables et rattrapage des paiements réussis |
| `juna-backend/tests/payments/` | Tests de passerelle, sécurité, concurrence, migration et emails |

Les extraits de ce guide sont volontairement limités aux interfaces essentielles.
Pour réutiliser le service complet, reprendre aussi les transactions, contraintes,
classes d'erreur, validateurs et tests : recopier uniquement le POST HTTP ne
constitue pas une intégration de paiement complète.
