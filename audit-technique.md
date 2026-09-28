# Audit technique — Juna Backend

> Audit approfondi du code (lecture seule) réalisé le 2026-08-12, couvrant : couche données/Prisma, sécurité/auth, logique métier critique (commandes/paiements/abonnements), modules secondaires et transverses.
> Légende : 🔴 CRITIQUE — impact direct argent/sécurité/données, à traiter avant toute mise en prod sérieuse · 🟠 IMPORTANT — bug réel ou dette qui va faire mal à l'échelle · 🟡 MINEUR — qualité, cohérence, dette technique

---

## Top priorités (à lire en premier)

1. 🔴 **Le webhook PawaPay accepte les paiements sans vérifier la signature si l'appel à l'API de clé publique échoue** — un attaquant peut créditer un paiement sans payer. Confirmé indépendamment par 2 audits différents.
2. 🔴 **`Order.orderNumber` peut entrer en collision sous charge concurrente** (génération par `count()` non atomique) — commandes qui échouent en pleine affluence.
3. 🔴 **Aucune génération de commandes par occurrence pour les abonnements multi-jours** — un abonnement d'une semaine se retrouve entièrement "consommé" (COMPLETED) dès le premier scan QR. C'est potentiellement le bug le plus grave du produit : le mécanisme central de l'abonnement ne fonctionne pas comme attendu.
4. 🔴 **Aucun remboursement réel n'existe** — annuler une commande payée change juste un statut, l'argent n'est jamais rendu ni tracé.
5. 🔴 **`GET /orders/:id` et le scan QR (`/orders/scan/:id/:qrCode`, public, sans auth) n'ont aucun contrôle de propriétaire** — IDOR direct, et un client peut auto-valider sa propre commande sans jamais la présenter au prestataire.
6. 🔴 **Tous les montants (prix, commandes, paiements) sont en `Float`**, pas `Decimal`/`Int` — risque d'erreurs d'arrondi sur de l'argent réel.
7. 🔴 **La suite de tests est cassée** (`tests/setup.ts` manquant) — `npm test` échoue avant même de lancer un test. Aucune régression n'est détectée par CI depuis un moment.
8. 🔴 **Script `create-admin.js` avec identifiants par défaut en clair** (`superadmin@juna.app` / `Admin123!`) commité au dépôt, capable de réinitialiser un compte SUPER_ADMIN.

---

## 1. Sécurité & authentification

### Paiement PawaPay
- 🔴 `src/middlewares/pawapay-webhook.middleware.ts:41-45` — si `fetchPawaPayPublicKey()` échoue (panne réseau, token expiré, race au démarrage), le middleware **laisse passer le webhook sans vérifier la signature** (`console.warn(...); next();`). Un attaquant qui initie un paiement, récupère son `depositId`, peut alors POSTer directement `{depositId, status: "COMPLETED"}` sur `/payments/webhook/deposit` et faire créditer une commande sans payer, si l'API de clé publique est temporairement indisponible — un mode de panne tout à fait réaliste en prod.
- 🟡 `src/services/payment.service.ts:165-179` — le webhook ne recroise jamais montant/devise reçus avec ceux stockés côté serveur avant de marquer `SUCCESS` (défense en profondeur manquante).
- 🟡 `src/utils/pawapay-signature.util.ts:51-108` — pas de vérification de fraîcheur de signature (anti-rejeu). Impact limité sur `/webhook/deposit` (idempotent), mais `payoutCallback`/`refundCallback` n'ont aucune logique métier actuellement, à sécuriser avant implémentation.

### IDOR / contrôle d'accès
- 🔴 `src/controllers/order.controller.ts:35-43` + `order.service.ts:138-144` — `GET /orders/:id` n'a que `authenticate`, aucune vérification `order.userId === req.user.id` (contrairement aux autres endpoints du même fichier). N'importe quel user authentifié connaissant un `orderId` peut voir les infos privées (nom, téléphone, montant) d'une commande d'un tiers.
- 🟠 `src/routes/order.routes.ts:46-51,87-90` + `order.service.ts:275-307` (`complete`) — `POST /:id/complete` (authentifié, pas de vérif provider) et `POST /scan/:id/:qrCode` (**public, sans auth du tout**) ne vérifient jamais que l'appelant est le prestataire. Un client connaissant son propre QR code peut auto-valider sa commande comme "retirée/livrée" sans jamais la présenter physiquement.
- 🟡 `src/services/review.service.ts:109-111` via `GET /reviews/order/:orderId` (public) — pas de filtre `status = APPROVED`, un avis en attente ou rejeté est exposé publiquement.
- 🟡 `src/repositories/notification.repository.ts:34-39` (`markAsRead`) — ne prend pas `userId`, ne vérifie pas que la notification appartient à l'appelant (dépend entièrement de la couche service).

### Secrets
- 🔴 `create-admin.js:9-12` — identifiants SUPER_ADMIN par défaut en clair (`superadmin@juna.app` / `Admin123!`), committés, via `upsert` (peut écraser un compte existant). Exécution accidentelle contre la prod = compte SUPER_ADMIN avec mot de passe public.

### Rate limiting & validation
- 🟡 `src/routes/auth.routes.ts:110-114` — `/reset-password` sans rate limiter (contrairement à login/register/forgot-password).
- 🟡 `/refresh` et `/logout` — seul le rate limiter global (100 req/15min) s'applique.
- 🟠 `src/routes/admin.routes.ts:125-140,187-206,233-248` — `/suspend`, `/users/:id/suspend`, `/users/:id/ban` lisent `req.body.reason` sans middleware `validate()`, aucune contrainte de type/longueur.
- 🟡 `src/routes/review.routes.ts:102-108` — `PUT /:id/moderate` sans validation de `{status, reason}` → 500 non maîtrisée si valeur enum invalide au lieu d'un 400 propre.

### Rôles & granularité
- 🟡 `src/constants/roles.ts:15-97` — `hasPermission()`/`ROLE_PERMISSIONS` fins (SUPER_ADMIN only) définis mais **jamais utilisés** ; toutes les routes utilisent `requireRole(ADMIN)`, qui autorise indifféremment ADMIN et SUPER_ADMIN. Pas exploitable aujourd'hui (aucune feature SUPER_ADMIN-only n'existe côté routes) mais le modèle de permission est décoratif.
- 🟡 `src/routes/upload.routes.ts:14-19` — un simple USER peut uploader vers les dossiers `providers`/`documents`.
- 🟡 `src/routes/subscription.routes.ts`, `meal.routes.ts` — commentaires "rôle PROVIDER requis" mais pas de `authorize([PROVIDER])` réel ; protection reposant uniquement sur des checks au niveau service (solide aujourd'hui, mais incohérent avec le pattern explicite utilisé ailleurs).

### JWT / divers
- 🟡 `src/utils/jwt.util.ts:31-54` — `jwt.verify()` n'épingle pas `algorithms: ['HS256']` (bonne pratique OWASP anti confusion d'algorithme).
- 🟡 `src/middlewares/upload.middleware.ts:8-14` — filtre de type de fichier basé seulement sur le `mimetype` déclaré par le client, pas les octets réels (Cloudinary revalide en aval, donc risque réduit).

---

## 2. Logique métier critique (argent, commandes, abonnements)

### Machine à états
- 🔴 `src/routes/order.routes.ts:87-90` — voir IDOR ci-dessus : le scan QR public sans vérification d'appartenance permet de faire transitionner n'importe quelle commande vers COMPLETED.
- 🟡 `order.service.ts:359-362` — commentaire "max 3 régénérations de QR" jamais réellement appliqué, aucune limite.
- 🟡 `provider.service.ts:319-334` — `suspend()` ne vérifie pas le statut courant avant transition (contrairement à `approve()`/`reject()`), et le `reason` fourni n'est jamais persisté ni notifié — perdu silencieusement.

### Calculs financiers
- 🟠 `order.service.ts:248-249` + `payment.controller.ts:34-37` — le versement au provider n'est **jamais implémenté** (`// TODO: Déclencher le paiement au provider ici`). `junaCommissionPercent` existe sur `Subscription` mais n'est utilisé **nulle part** dans un calcul réel — tout reversement doit être fait manuellement hors système.
- 🟡 `payment.service.ts:115` vs `:125` — `Payment.amount` stocké = montant non arrondi, alors que le montant réellement transmis à PawaPay est arrondi (`Math.round`). Écart possible en réconciliation comptable.
- 🟡 `order.validator.ts` — en mode `DELIVERY`, seul `deliveryCity` est obligatoire, `deliveryAddress` reste optionnel : une commande livraison peut être créée sans adresse précise.

### Concurrence
- 🔴 `order.repository.ts:317-322` (`getNextOrderNumber`) — `prisma.order.count()` puis `ORD-YYYYMM-{count+1}`, sans transaction ni verrou, alors que `orderNumber` est `@unique`. Deux commandes créées simultanément → collision → une des deux échoue en pleine transaction de checkout.
- 🟠 `payment.service.ts:21-84,165-179,188-203` — le check de statut avant `applyFinalStatus()` n'est pas atomique avec l'écriture. Un webhook et un poll client simultanés peuvent tous deux passer le check → double email de confirmation, double notification.
- 🟡 `order.service.ts:114-130,334-337` — création (+incrément subscriberCount) et annulation (+décrément) en deux appels séparés hors `$transaction` : désynchronisation possible du compteur si le 2e appel échoue.
- 🟠 (déjà repéré côté données) `meal.repository.ts:70-77`, `subscription.repository.ts:235-260` (`toggleActive`/`togglePublic`) — lecture puis écriture non atomiques, race condition possible sur double-bascule.
- 🟠 `subscription.repository.ts:460-480` (`updateRating`) — calcul de moyenne en JS non transactionnel ; deux avis créés en concurrence peuvent produire une moyenne erronée et un `totalReviews` sous-compté.

### Paiement (suite)
- 🔴 `payment.repository.ts:5-26` + `payment.service.ts:100-119` — `Payment.orderId` est `@unique`, et un nouvel essai n'est bloqué que si le paiement existant est `PROCESSING`/`SUCCESS`, pas `FAILED`. **Un utilisateur dont le premier paiement échoue ne peut plus jamais repayer la même commande** — toute nouvelle tentative viole la contrainte unique. Il doit annuler et recréer entièrement sa commande.
- 🟠 Aucun job de réconciliation ne balaie les paiements bloqués en `PROCESSING`/commandes en `PENDING` (les queues Bull sont vides, cron jobs n'en font pas). Si le webhook n'arrive jamais et que le client ne revient pas consulter le statut, la commande reste bloquée indéfiniment.

### Abonnements actifs — bug produit central
- 🔴 `active-subscription.service.ts` (fichier entier) + `order.service.ts:275-307` — **il n'existe aucune génération de commande par occurrence** (jour/repas) pour les abonnements WEEK/MONTH. Un seul `Order`/`qrCode` existe par souscription, et `complete()` le passe en statut terminal dès le **premier** scan. Un abonnement d'une semaine (7 jours de repas) est donc entièrement "consommé" administrativement au premier retrait, alors qu'il reste 6 jours de repas dus. Aucune trace ne permet de valider les scans suivants.
- 🟠 `order.service.ts:216-270` (`activate`) et `provider.service.ts:319-334` (`suspend`) — la suspension d'un provider n'a aucun effet sur les engagements déjà payés en cours (aucune notification, aucun blocage des retraits).

### Annulation / remboursement
- 🔴 `order.service.ts:312-340` (`cancel`) + `payment.controller.ts:39-42` — `cancel()` change juste le statut de la commande, aucune interaction avec `Payment`, aucun appel de remboursement PawaPay (la méthode n'existe même pas dans `pawapay.service.ts`). Le webhook `/webhook/refund` ne fait rien de fonctionnel — `PaymentStatus.REFUNDED` n'est **jamais** écrit nulle part dans le code. Un user qui annule une commande payée ne sera jamais remboursé automatiquement, ni même tracé comme "à rembourser".

---

## 3. Couche données / Prisma

### Soft-delete — incohérences et cascades
- 🔴 `user.service.ts:148` / `user.repository.ts:72-76` — `deleteAccount()` (suppression de compte) fait un vrai `prisma.user.delete()`. Or `orders_userId_fkey` est en `ON DELETE RESTRICT` → **tout user ayant déjà passé une commande ne peut jamais supprimer son compte**, échec en 400 générique sans message clair.
- 🔴 `provider.repository.ts:272-276` — `delete()` est du code mort (jamais appelé), mais s'il l'était un jour sur un provider ayant eu ne serait-ce qu'une commande, il percuterait la même contrainte `RESTRICT` en pleine cascade → état incohérent. "Attractive nuisance" pour le prochain dev qui voudra implémenter "supprimer un provider".
- 🟠 `geography.repository.ts` — `cityRepository.updateStatus`, `countryRepository.delete`, `landmarkRepository.delete` ne vérifient jamais l'existence de providers/villes/landmarks actifs rattachés avant de désactiver le parent.
- 🟠 `schema.prisma:235-264` — `Provider` n'a pas de champ `isActive` (contrairement à User/Meal/Subscription/City/Country/Landmark) ; il utilise `status: ProviderStatus`. Convention de désactivation différente et non documentée, qui coexiste avec un `delete()` hard jamais utilisé — deux façons contradictoires de "retirer" un provider.
- 🟡 `order.repository.ts:268-272` — `delete()` hard jamais appelé mais détruirait en cascade Payment/Review/ActiveSubscription (perte de données comptables) s'il l'était un jour.
- 🟠 `active-subscription.repository.ts:54-62` (`deleteExpired`) — suppression physique des abonnements expirés : perte définitive de l'historique ("qui a été abonné à quoi, quand"), problématique pour un futur écran d'historique ou un litige.

### Contraintes d'intégrité
- 🟠 `schema.prisma:184` — `User.email @unique` sensible à la casse (pas de `citext`, pas de normalisation `.toLowerCase()` côté code) : `Test@x.com` et `test@x.com` créent deux comptes distincts.
- 🟠 `schema.prisma:693-703` (`ProviderLandmark`) — pas d'`@@index([landmarkId])` alors que `subscription.repository.ts:308` filtre dessus dans la recherche publique d'abonnements → scan séquentiel à mesure que la table grossit.
- 🟡 `Meal.priceMin/priceMax` — aucune contrainte `CHECK` garantissant `priceMin <= priceMax`.

### Performance / N+1
- 🟠 `subscription.repository.ts:342-346` — le tri "popular" charge **tout** le catalogue public en mémoire Node (pas de `skip`/`take` avant tri JS) sur l'endpoint probablement le plus fréquenté du site.
- 🟡 `review.repository.ts:254-265` — moyenne/distribution des notes calculées en JS au lieu d'un `groupBy`/`_avg` Prisma.

### Champs monétaires
- 🔴 **Tous** les champs monétaires (`Meal.price`, `Subscription.price`, `Order.amount`, `Payment.amount`, etc.) sont en `Float`/`DOUBLE PRECISION`, pas `Decimal` ni `Int` en centimes. Risque réel d'erreurs d'arrondi cumulées sur des commissions et rapprochements avec les montants mobile money réels.

### Autres
- 🟠 `meal.repository.ts:106-113` (`replacePricings`) — `deleteMany` puis `createMany` en deux appels **hors transaction** : un crash entre les deux fait perdre silencieusement tous les prix d'un repas MULTIPLE/RANGE.
- 🟠 4 modèles Prisma complets (FK, cascades, index) sans aucun repository fonctionnel : `CustomProposal`, `Referral`, `SupportTicket`, `TicketMessage` — tables migrées en prod, jamais alimentées (voir section 4).

---

## 4. Modules secondaires & transverse

### Tests — cassés
- 🔴 `jest.config.js:34` — référence `tests/setup.ts`, **inexistant**. `npm test`/`test:watch`/`test:integration` échouent immédiatement, avant de lancer le moindre test. Confirmé en exécutant `npx jest --coverage`. Le seuil de couverture 70% défini dans le même fichier n'a jamais été vérifié.
- 🟠 Aucun test unitaire pour 10 des 12 services audités : notification, ticket, review, referral, geography, upload, email, admin, home, meal. Seuls auth et user sont couverts.
- 🟠 Aucun test d'intégration pour admin, review, notification, geography, upload, meal, provider, order, payment, proposal, subscription-proposal, active-subscription.

### Bugs fonctionnels confirmés
- 🔴 `admin.service.ts:240` (`getDetailedStats`) — filtre les paiements par `status: 'COMPLETED'`, valeur qui **n'existe pas** dans l'enum `PaymentStatus` (seul `SUCCESS` existe). Le revenu par période du dashboard admin est **toujours à 0**, alors que `getDashboardStats()` (même fichier, ligne 70) utilise correctement `SUCCESS`. Le `as any` masque l'erreur au compilateur.
- 🔴 `review.service.ts:231` (`moderate`) — ne recalcule la note moyenne que quand le nouveau statut est `APPROVED`. Si un admin **rejette a posteriori** un avis déjà approuvé, le rating stocké sur Subscription/Provider reste gonflé indéfiniment.
- 🟠 `upload.middleware.ts:8` — le `fileFilter` de multer rejette via une `Error` générique non typée `AppError` → le error handler renvoie un **500** au lieu d'un 400 propre quand un user uploade un format non supporté.

### Endpoints CRUD incomplets
- 🟠 `geography.service.ts:26` — comme pour City (déjà corrigé), **Country et Landmark** n'ont ni UPDATE ni réactivation. Une désactivation par erreur de pays/landmark est irréversible sans intervention DB directe.
- 🟡 `geography.service.ts:16,50,89` — les conflits de création (nom déjà pris) réutilisent `ERROR_CODES.EMAIL_ALREADY_EXISTS` par manque de code générique — un frontend qui gère cette erreur pour l'inscription affichera "cet email est déjà utilisé" pour un doublon de nom de ville.

### Fonctionnalités documentées jamais implémentées
- 🟠 **Tickets support** — `ticket.service.ts`, `.controller.ts`, `.routes.ts`, `.repository.ts` tous vides (0 octet), route commentée dans `routes/index.ts`. Le modèle Prisma `SupportTicket`/`TicketMessage` existe pourtant intégralement en base, avec les DTOs (`ticket.types.ts`).
- 🟠 **Parrainage (referral)** — même constat exact : tous les fichiers vides, route commentée, modèle `Referral` + enum `ReferralStatus` présents en base sans jamais être exploités.
- 🟠 `admin.controller.ts` — fichier **totalement vide** : toute la logique admin (fournisseurs, users, dashboard) est écrite en handlers inline dans `admin.routes.ts`, seul module à casser le pattern route→controller→service. Rend la couche admin impossible à tester unitairement.

### Cohérence du format API
- 🟠 `admin.routes.ts:67,159,179,201,221,243,262,282` — plusieurs endpoints répondent `res.json({success, data})` **sans le champ `message`**, pourtant obligatoire dans `ApiResponse` et présent partout ailleurs via `sendSuccess()`. Un frontend qui affiche `response.message` en toast affichera "undefined" sur ces routes admin.
- 🟠 `response.util.ts:70` — `sendPaginated()`/`calculatePagination()` sont définis pour standardiser la pagination mais **ne sont utilisés nulle part**. Chaque service réinvente sa forme : review (`{page, limit, total, totalPages}`), subscription (idem, ad hoc), notification (`{notifications, unreadCount, page, limit}` — **sans total ni totalPages**, un client ne peut même pas savoir s'il reste des pages).
- 🟡 `home.controller.ts:8` — seul controller à parser un schéma Zod inline au lieu de passer par un fichier `validators/home.validator.ts` comme partout ailleurs.

### Validators incohérents
- 🟠 `common.validator.ts` — censé mutualiser les schémas partagés, **complètement vide**. Résultat : 3 règles de téléphone différentes coexistent entre `auth.validator.ts` (espaces/tirets acceptés, 8 car. min), `user.validator.ts` (E.164 strict, aucun espace) et `payment.validator.ts` (`min(8)` sans regex). Un user peut s'inscrire avec un numéro contenant des espaces, puis ne plus pouvoir l'enregistrer sur son profil car rejeté par une règle différente.

### Code mort
- 🟡 `upload.service.ts:52` (`deleteImage`) — jamais appelé : aucune route ne supprime une image, aucun nettoyage Cloudinary au remplacement d'un avatar/logo/photo. Coût de stockage qui augmente indéfiniment.
- 🟡 `config/redis.ts:35` (`cacheHelper`) — jamais utilisé. Redis est connecté sans aucun usage de cache, et le rate-limiter utilise le `MemoryStore` par défaut (pas Redis) — en cas de scaling horizontal, le rate-limiting devient per-instance et inefficace, alors que la dépendance existe justement pour ça.
- 🟡 `queues/*.ts` — tous vides malgré la dépendance `bull` en `package.json`. Les cron jobs utilisent `node-cron` directement à la place.

### Sécurité des données — emails
- 🟠 `email.service.ts` (lignes 190, 249, 274, 298, 334, 398...) — les templates d'emails transactionnels interpolent des chaînes fournies par l'utilisateur (nom, businessName, rejectionReason...) **sans échappement HTML**. Un nom d'inscription contenant `<a href=phishing.com>` finit tel quel dans un email envoyé depuis le domaine officiel Juna Eats.

### package.json
- 🟠 Script `start` : `npx prisma db push --accept-data-loss && node dist/server.js` — exécuté à **chaque démarrage en production**, au lieu de `prisma migrate deploy` (qui existe pourtant en script séparé, jamais utilisé). Autorise explicitement la perte de données pour appliquer un changement de schéma incompatible, sans migration versionnée ni confirmation.
- 🟡 Dépendances mortes confirmées par grep : `bull`, `uuid` (le code utilise `crypto.randomUUID()`), `multer-storage-cloudinary` (upload géré manuellement via data URI), `module-alias` (non utilisé au runtime, `tsc-alias` fait déjà le travail au build).
- 🟡 `@types/multer` en `dependencies` au lieu de `devDependencies`.

### Documentation
- 🟡 Aucune configuration Swagger/OpenAPI malgré 18+ modules de routes — toute connaissance des contrats d'API repose uniquement sur la lecture du code source.

---

## Synthèse par sévérité

| Sévérité | Nombre | Zones les plus touchées |
|---|---|---|
| 🔴 CRITIQUE | 14 | Paiement/PawaPay, abonnements, remboursement, comptes/soft-delete, montants Float, tests cassés |
| 🟠 IMPORTANT | 28 | Concurrence, endpoints incomplets, features non implémentées, cohérence API |
| 🟡 MINEUR | 20 | Validation, rate limiting, dépendances, documentation |

## Recommandation d'ordre de traitement

1. **Webhook PawaPay** (fail-open sur signature) — c'est une faille de vol d'argent, à corriger immédiatement (fail-closed : si la clé publique est indisponible, rejeter le webhook, pas l'accepter).
2. **Génération de commandes par occurrence pour les abonnements multi-jours** — sans ça, le produit ne fait pas ce qu'il prétend faire pour tout abonnement > 1 jour.
3. **Remboursement réel** — au minimum, tracer `REFUNDED` et bloquer/notifier manuellement, avant d'automatiser via PawaPay.
4. **`getNextOrderNumber` atomique** (transaction ou séquence Postgres) — corrige un bug qui va se déclencher tout seul dès qu'il y a un peu de trafic simultané.
5. **IDOR sur `/orders/:id` et le scan QR public** — ajouter la vérification de propriétaire, c'est une correction rapide à fort impact.
6. **Réparer la suite de tests** (`tests/setup.ts`) — sans ça, tout le reste des corrections se fait à l'aveugle.
7. Le reste (Float→Decimal, soft-delete cohérent, features vides à assumer ou supprimer, dépendances mortes) peut suivre par ordre de priorité produit.
