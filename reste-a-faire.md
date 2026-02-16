#  ROADMAP COMPLÈTE JUNA - ÉTAT ACTUEL DÉTAILLÉ

---

##  **RÉSUMÉ DE L'ÉTAT ACTUEL**

**✅ TERMINÉ (Fonctionnel) :**
- Module AUTH complet (register, login, refresh, logout)
- Module PROVIDER complet (register, me) - TESTÉ ✅
- Module ADMIN complet (approbation fournisseurs) - TESTÉ ✅
- Infrastructure technique (Prisma, Redis, middlewares, utils)
- Architecture Controllers → Services → Repositories
- **Database SCHEMA (PHASE 1) : Meal, SubscriptionMeal, SubscriptionType** ✅

**🔄 PROCHAINES ÉTAPES CRITIQUES :**
1. **Module MEAL** (repas) - À faire avant SUBSCRIPTION
2. **Module SUBSCRIPTION** (abonnements) - Cœur du business
3. **Module ORDER** (souscription) - Revenue stream
4. **Module PAYMENT** (paiements)

**📊 Progression :** ~25% terminé, AUTH + PROVIDER + ADMIN testés ✅, Database SCHEMA créé

---

##  **GUIDE DE DÉVELOPPEMENT - ÉTAPES PRATIQUES**

### **Étape 1 : Tester AUTH (Déjà fait)**
```bash
# Démarrer le serveur
npx ts-node -r module-alias/register src/server.ts

# Tester register
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123456","name":"Test User"}'

# Tester login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123456"}'
```

### **Étape 2 : Module USER (Priorité 1)**
```bash
# Fichiers à implémenter dans l'ordre :
1. src/services/user.service.ts (utiliser user.repository.ts existant)
2. src/controllers/user.controller.ts
3. src/routes/user.routes.ts (compléter user.validator.ts si besoin)
```

### **Étape 3 : Module PROVIDER (Priorité 2)**
```bash
# Logique métier importante :
# 1. USER s'inscrit comme fournisseur → crée Provider avec status=PENDING
# 2. ADMIN valide → status=APPROVED + user.role = PROVIDER
# 3. Maintenant le user peut créer des subscriptions
```

### **Étape 4 : Module SUBSCRIPTION (Priorité 3)**
```bash
# Points clés :
# - Seuls les PROVIDER peuvent créer des subscriptions
# - Les USER peuvent voir et souscrire aux subscriptions
# - Logique de recherche et filtrage importante
```

---

##  **MÉTHODOLOGIE RECOMMANDÉE**

### **Pour chaque module, suivre cet ordre :**
1. **Repository** : Méthodes Prisma (CRUD + queries spécifiques)
2. **Service** : Logique métier, validation, appels repository
3. **Controller** : Gestion HTTP, réponses, appels service
4. **Routes** : Définition des endpoints, middlewares
5. **Validators** : Compléter la validation Zod
6. **Tests** : Unitaires + intégration

### **Bonnes pratiques :**
- ✅ Utiliser les types TypeScript existants
- ✅ Respecter le pattern Controllers → Services → Repositories
- ✅ Gestion d'erreurs avec les classes existantes
- ✅ Validation avec Zod (validators existants)
- ✅ Logging avec Winston
- ✅ Tests avec Jest + Supertest

---

## ✅ **CE QUI EST VRAIMENT TERMINÉ (TESTÉ ET FONCTIONNEL)**

### **🔐 Module AUTH - 100% COMPLET**
- ✅ `src/controllers/auth.controller.ts` - Tous les endpoints implémentés
- ✅ `src/services/auth.service.ts` - Logique métier complète
- ✅ `src/repositories/user.repository.ts` - Toutes les méthodes Prisma
- ✅ `src/routes/auth.routes.ts` - Routes configurées avec middlewares
- ✅ `src/validators/auth.validator.ts` - Validation Zod complète
- ✅ `src/types/auth.types.ts` - Types TypeScript définis
- ✅ Tests fonctionnels : register, login, refresh, logout, change-password

### **🏗️ Infrastructure Technique - 100% COMPLETE**
- ✅ Configuration TypeScript, ESLint, Prettier
- ✅ Base de données PostgreSQL + Prisma (13 entités, migrations)
- ✅ Redis configuré (optionnel pour développement)
- ✅ Tous les utils : JWT, hash, logger, validation, errors, response
- ✅ Tous les constants : errors, roles, status, messages
- ✅ Tous les types TypeScript définis
- ✅ Tous les middlewares : auth, validation, error, rate limiter, logger
- ✅ Architecture Controllers → Services → Repositories
- ✅ Gestion d'erreurs centralisée
- ✅ Logging structuré (Winston)
- ✅ Rate limiting configuré

---

## 🔴 **CE QUI RESTE À FAIRE - ÉTAT ACTUEL DÉTAILLÉ**

### **PHASE 1 : MODULES CORE (Priorité HAUTE)**

#### **1. Module USER** 👤 (Priorité Moyenne - Repository existe)
**État actuel :**
- ✅ `src/repositories/user.repository.ts` - **COMPLET** (toutes les méthodes Prisma)
- ✅ `src/types/user.types.ts` - **EXISTE**
- ✅ `src/validators/user.validator.ts` - **EXISTE** mais à compléter
- ❌ `src/controllers/user.controller.ts` - **VIDE** (0 lignes)
- ❌ `src/services/user.service.ts` - **VIDE** (0 lignes)
- ❌ `src/routes/user.routes.ts` - **VIDE** (0 lignes)

**Endpoints à implémenter :**
- `GET /users/me` - Obtenir mon profil complet
- `PUT /users/me` - Mettre à jour mon profil
- `PUT /users/me/preferences` - Mettre à jour mes préférences
- `POST /users/me/avatar` - Upload avatar (Cloudinary v2)
- `DELETE /users/me` - Supprimer mon compte

**Priorité :** Moyenne (repository existe déjà)

---

#### **2. Module PROVIDER** 🏢 (Priorité Élevée - Business Critical) ✅ TERMINÉ
**État actuel :**
- ✅ `src/types/provider.types.ts` - **EXISTE**
- ✅ `src/validators/provider.validator.ts` - **COMPLET**
- ✅ `src/repositories/provider.repository.ts` - **COMPLET**
- ✅ `src/services/provider.service.ts` - **COMPLET**
- ✅ `src/controllers/provider.controller.ts` - **COMPLET**
- ✅ `src/routes/provider.routes.ts` - **COMPLET**

**Endpoints implémentés :**
- ✅ `POST /providers/register` - USER demande à devenir fournisseur
- ✅ `GET /providers/me` - Mon profil fournisseur

**Testé et fonctionnel :** ✅

**Prochaine étape :** Module ADMIN pour approuver les demandes

**Workflow critique :**
1. `POST /providers/register` - USER demande à devenir fournisseur
2. Crée `Provider` avec `status=PENDING`
3. ADMIN valide → `status=APPROVED` + `user.role = PROVIDER`
4. Fournisseur peut maintenant créer des abonnements

---

#### **3. Module SUBSCRIPTION** 📦 (Priorité Élevée - Cœur du Business)

> **NOUVEAU MODÈLE DE DONNÉES (Décembre 2025)** :
> - `Subscription.type` utilise maintenant `SubscriptionType` (BREAKFAST, LUNCH, DINNER, SNACK, BREAKFAST_LUNCH, FULL_DAY, CUSTOM)
> - `Subscription.mealType` supprimé, remplacé par `type`
> - `Subscription.cuisine` supprimé (remplacé par `category`)
> - Nouvelle table `meals` pour les repas individuels
> - Nouvelle table `subscription_meals` pour la liaison many-to-many

**État actuel :**
- ✅ `prisma/schema.prisma` - **MISE À JOUR** (Meal, SubscriptionMeal, SubscriptionType)
- ✅ Base de données - **MISE À JOUR** avec `prisma db push --force-reset`
- ✅ `src/types/subscription.types.ts` - **EXISTE** (à mettre à jour avec SubscriptionType)
- ✅ `src/validators/subscription.validator.ts` - **EXISTE** mais à compléter
- ❌ `src/repositories/subscription.repository.ts` - **VIDE** (0 lignes)
- ❌ `src/services/subscription.service.ts` - **VIDE** (0 lignes)
- ❌ `src/controllers/subscription.controller.ts` - **VIDE** (0 lignes)
- ❌ `src/routes/subscription.routes.ts` - **VIDE** (0 lignes)

**Endpoints à implémenter :**
- `POST /providers/me/subscriptions` - Créer abonnement (PROVIDER uniquement)
- `GET /subscriptions` - Lister abonnements (public)
- `GET /subscriptions/:id` - Détails abonnement
- `PUT /providers/me/subscriptions/:id` - Modifier abonnement
- `PUT /providers/me/subscriptions/:id/toggle` - Activer/Désactiver

**Priorité :** Élevée (cœur du business)

---

#### **3.1. Module MEAL** 🍽️ (Repas - NOUVEAU)
**Fichiers à créer :**
- `src/repositories/meal.repository.ts`
- `src/services/meal.service.ts`
- `src/controllers/meal.controller.ts`
- `src/routes/meal.routes.ts`

**Endpoints à implémenter :**
- `POST /providers/me/meals` - Créer un repas (PROVIDER uniquement)
- `GET /providers/me/meals` - Lister mes repas
- `GET /meals/:id` - Détails d'un repas
- `PUT /providers/me/meals/:id` - Modifier un repas
- `DELETE /providers/me/meals/:id` - Supprimer un repas
- `PUT /providers/me/meals/:id/toggle` - Activer/Désactiver

---

#### **3. Module ORDER** 🛒
**Fichiers à créer :**
- `src/validators/order.validator.ts`
- `src/repositories/order.repository.ts`
- `src/services/order.service.ts`
- `src/controllers/order.controller.ts`
- `src/routes/order.routes.ts`

**Endpoints à implémenter :**
- `POST /orders` - Créer une commande (souscrire)
- `GET /orders/me` - Mes commandes
- `GET /orders/:id` - Détails d'une commande
- `PUT /orders/:id/cancel` - Annuler une commande
- `GET /orders/:id/qr-code` - Télécharger QR code
- `POST /orders/:id/regenerate-qr` - Régénérer QR code

---

#### **4. Module PAYMENT** 💳
**Fichiers à créer :**
- `src/services/payment.service.ts`
- `src/controllers/payment.controller.ts`
- `src/routes/payment.routes.ts`

**Endpoints à implémenter :**
- `GET /payments/:id` - Détails d'un paiement
- `GET /payments/:id/status` - Statut d'un paiement
- `POST /payments/webhook/:provider` - Webhooks (Stripe, Wave, MTN, etc.)

**Intégrations à faire :**
- ⚠️ **Stripe** (cartes internationales)
- ⚠️ **Wave API** (Mobile Money Bénin)
- ⚠️ **MTN Mobile Money**
- ⚠️ **Moov Money**
- ⚠️ **Orange Money**

---

#### **5. Module PROPOSAL (Propositions personnalisées)** 💡
**Fichiers à créer :**
- `src/validators/proposal.validator.ts`
- `src/repositories/proposal.repository.ts`
- `src/services/proposal.service.ts`
- `src/controllers/proposal.controller.ts`
- `src/routes/proposal.routes.ts`

**Endpoints à implémenter :**
- `POST /proposals` - Créer une proposition
- `GET /proposals/me` - Mes propositions
- `GET /proposals/:id` - Détails d'une proposition
- `PUT /proposals/:id` - Modifier une proposition (si rejetée)
- `DELETE /proposals/:id` - Supprimer une proposition

---

#### **6. Module REVIEW** ⭐
**Fichiers à créer :**
- `src/validators/review.validator.ts`
- `src/repositories/review.repository.ts`
- `src/services/review.service.ts`
- `src/controllers/review.controller.ts`
- `src/routes/review.routes.ts`

**Endpoints à implémenter :**
- `POST /reviews` - Créer un avis
- `GET /reviews/me` - Mes avis
- `GET /subscriptions/:id/reviews` - Avis d'un abonnement
- `PUT /reviews/:id` - Modifier un avis
- `DELETE /reviews/:id` - Supprimer un avis
- `POST /reviews/:id/report` - Signaler un avis

---

#### **7. Module TICKET (Support)** 🎫
**Fichiers à créer :**
- `src/validators/ticket.validator.ts`
- `src/repositories/ticket.repository.ts`
- `src/services/ticket.service.ts`
- `src/controllers/ticket.controller.ts`
- `src/routes/ticket.routes.ts`

**Endpoints à implémenter :**
- `POST /tickets` - Créer un ticket
- `GET /tickets/me` - Mes tickets
- `GET /tickets/:id` - Détails d'un ticket
- `POST /tickets/:id/messages` - Répondre à un ticket
- `PUT /tickets/:id/close` - Clôturer un ticket

---

#### **8. Module NOTIFICATION** 🔔
**Fichiers à créer :**
- `src/repositories/notification.repository.ts`
- `src/services/notification.service.ts`
- `src/controllers/notification.controller.ts`
- `src/routes/notification.routes.ts`

**Endpoints à implémenter :**
- `GET /notifications/me` - Mes notifications
- `PUT /notifications/:id/read` - Marquer comme lu
- `PUT /notifications/read-all` - Tout marquer comme lu
- `DELETE /notifications/:id` - Supprimer une notification

---

#### **9. Module PROVIDER** 🏢
**Fichiers à créer :**
- `src/validators/provider.validator.ts`
- `src/repositories/provider.repository.ts`
- `src/services/provider.service.ts`
- `src/controllers/provider.controller.ts`
- `src/routes/provider.routes.ts`

**Endpoints à implémenter :**
- `POST /providers/register` - Inscription fournisseur
- `GET /providers/me` - Mon profil fournisseur
- `PUT /providers/me` - Mettre à jour profil
- `POST /providers/me/subscriptions` - Créer un abonnement
- `PUT /providers/me/subscriptions/:id` - Modifier un abonnement
- `PUT /providers/me/subscriptions/:id/toggle` - Activer/Désactiver
- `GET /providers/me/orders` - Mes commandes (fournisseur)
- `PUT /providers/me/orders/:id/status` - Mettre à jour statut
- `POST /providers/me/scan-qr` - Scanner QR code
- `GET /providers/me/stats` - Statistiques fournisseur

---

#### **10. Module ADMIN** 👨‍💼 ✅ TERMINÉ
**Statut :** COMPLET ET TESTÉ ✅

**Fichiers créés :**
- ✅ `src/services/admin.service.ts`
- ✅ `src/routes/admin.routes.ts`
- ✅ `prisma/seed.ts` (création admin)

**Endpoints implémentés :**
- ✅ `GET /admin/providers/pending` - Lister demandes en attente
- ✅ `PUT /admin/providers/:id/approve` - Approuver fournisseur
- ✅ `PUT /admin/providers/:id/reject` - Rejeter fournisseur
- ✅ `PUT /admin/providers/:id/suspend` - Suspendre fournisseur
- ✅ `GET /admin/providers` - Lister tous les fournisseurs
- ✅ `GET /admin/users` - Lister utilisateurs
- ✅ `PUT /admin/users/:id/suspend` - Suspendre utilisateur
- ✅ `PUT /admin/users/:id/activate` - Réactiver utilisateur
- ✅ `GET /admin/dashboard` - Dashboard stats

**Comment créer un admin :**
```bash
cd juna-backend
# Configurer .env avec ADMIN_EMAIL et ADMIN_PASSWORD
npx ts-node -r tsconfig-paths/register prisma/seed.ts
```

---

#### **11. Module SUBSCRIPTION** 📦 (Prochaine étape)
**Fichiers à créer :**
- `src/repositories/referral.repository.ts`
- `src/services/referral.service.ts`
- `src/controllers/referral.controller.ts`
- `src/routes/referral.routes.ts`

**Endpoints à implémenter :**
- `GET /referrals/me/code` - Mon code de parrainage
- `GET /referrals/me` - Mes parrainages
- `POST /referrals/validate` - Valider un code

---

#### **12. Module SEARCH** 🔍
**Fichiers à créer :**
- `src/services/search.service.ts`
- `src/controllers/search.controller.ts`
- `src/routes/search.routes.ts`

**Endpoints à implémenter :**
- `GET /search` - Recherche globale
- `GET /search/autocomplete` - Autocomplétion
- `GET /search/filters` - Filtres disponibles

---

### **PHASE 2 : FONCTIONNALITÉS AVANCÉES (Priorité MOYENNE)**

#### **1. Email Service** ✉️
**À faire :**
- Intégrer SendGrid ou Mailgun
- Créer templates d'emails :
  - Email de bienvenue
  - Vérification d'email
  - Réinitialisation mot de passe
  - Confirmation de commande
  - Notifications diverses

**Fichier à compléter :**
- `src/services/email.service.ts`

---

#### **2. Queue Jobs (Bull)** ⚙️
**À implémenter dans :**
- `src/queues/email.queue.ts` - Jobs d'envoi d'emails
- `src/queues/notification.queue.ts` - Jobs de notifications
- `src/queues/subscription.queue.ts` - Renouvellements auto

**Jobs à créer :**
- Envoi emails en masse
- Notifications push
- Renouvellement abonnements
- Nettoyage tokens expirés
- Génération de rapports

---

#### **3. Upload de Fichiers** 📁
**À faire :**
- Intégrer Cloudinary (ou AWS S3)
- Créer middleware upload
- Gérer avatars, photos abonnements, documents

**Fichier à créer :**
- `src/middlewares/upload.middleware.ts` (déjà créé mais vide)
- `src/utils/upload.util.ts`

---

#### **4. Géolocalisation** 📍
**À faire :**
- Intégrer Google Maps API ou Mapbox
- Calcul de distances
- Zones de livraison
- Suggestion d'adresses

**Fichier à créer :**
- `src/utils/geolocation.util.ts`

---

#### **5. QR Code (amélioration)** 📱
**À faire :**
- Génération d'images QR code (lib `qrcode`)
- Stockage sur CDN
- Scanner côté fournisseur (app mobile)

**Fichier à améliorer :**
- `src/utils/qrcode.util.ts` (déjà créé mais basique)

---

### **PHASE 3 : TESTS & QUALITÉ (Priorité HAUTE)**

#### **1. Tests Unitaires** 🧪
**À créer :**
- `tests/unit/services/auth.service.test.ts`
- `tests/unit/services/user.service.test.ts`
- `tests/unit/utils/jwt.util.test.ts`
- `tests/unit/utils/hash.util.test.ts`
- Etc. pour chaque service et util

**Objectif :** Coverage > 70%

---

#### **2. Tests d'Intégration** 🧪
**À créer :**
- `tests/integration/api/auth.test.ts`
- `tests/integration/api/user.test.ts`
- `tests/integration/api/subscription.test.ts`
- Etc. pour chaque endpoint

---

#### **3. Tests de Charge** ⚡
**À faire :**
- Utiliser Artillery ou k6
- Tester scalabilité
- Identifier bottlenecks

---

### **PHASE 4 : DOCUMENTATION & DEVOPS**

#### **1. Documentation API (Swagger)** 📚
**À faire :**
- Configurer Swagger UI
- Documenter tous les endpoints
- Ajouter exemples de requêtes/réponses

**Fichier à créer :**
- `src/config/swagger.ts`

---

#### **2. Seed de la Base de Données** 🌱
**À faire :**
- Créer données de test
- Users, providers, subscriptions, orders

**Fichier à compléter :**
- `prisma/seed.ts`

---

#### **3. CI/CD** 🔄
**À configurer :**
- GitHub Actions
- Pipeline : lint → test → build → deploy
- Environnements : dev, staging, prod

**Fichier à créer :**
- `.github/workflows/ci.yml`

---

#### **4. Déploiement** 🚀
**À faire :**
- Choisir hébergeur (Railway, Render, AWS, DigitalOcean)
- Configurer environnements
- Setup domaine + SSL
- Monitoring (Sentry, New Relic)

---

### **PHASE 5 : FEATURES v2 (Priorité BASSE)**

- Programme de fidélité
- Mode pause pour abonnements
- Chat en direct (WebSocket)
- Tracking livraison en temps réel
- Dashboard analytics avancé
- App mobile (React Native)
- Recommandations ML/AI
- Multi-devises
- Internationalisation (i18n)


---

##  **CONCLUSION - ACTIONS CONCRÈTES**

### ** PROCHAINES 3 HEURES :**
1. **Implémenter Module ADMIN** (suite logique du PROVIDER)
2. **Tester les endpoints ADMIN** avec Postman
3. **Commencer Module SUBSCRIPTION** (cœur du business)

### **📈 ORDRE PRIORITAIRE RECOMMANDÉ :**
1. ✅ **Module AUTH** - **TERMINÉ**
2. ✅ **Module PROVIDER** - **TERMINÉ** (testé ✅)
3. ✅ **Module ADMIN** - **TERMINÉ** (testé ✅)
4. 🔄 **Module SUBSCRIPTION** - Prochaine étape (cœur du business)
5. 🔄 **Module ORDER** - Puis (revenue stream)
6. 🔄 **Module PAYMENT** - Intégrations paiement
7. 🔄 **Modules restants** - Features avancées

### **💡 CONSEILS PRATIQUES :**
- **Commencer petit** : USER d'abord (facile)
- **Tester souvent** : Chaque endpoint avec Postman
- **Respecter l'architecture** : Repository → Service → Controller → Routes
- **Utiliser les types** : TypeScript strict pour éviter les bugs
- **Gérer les erreurs** : Classes d'erreur existantes

### **🎊 TON PROJET EST ARCHITECTURÉ COMME UN PRO !**
- Infrastructure solide ✅
- Authentification complète ✅
- Base de données optimisée ✅
- Architecture maintenable ✅

**Go build the next big thing in African food delivery! 🇧🇯🚀**

---

### **2. USER vs PROVIDER - LA CONFUSION**

Voilà comment ça fonctionne vraiment :

#### **UN SEUL MODÈLE : USER**

**Tout le monde est un `User`** avec un `role` différent :
- `USER` : Utilisateur normal (mange)
- `PROVIDER` : Fournisseur (crée des abonnements)
- `ADMIN` : Administrateur
- `SUPER_ADMIN` : Super admin

#### **LA TABLE `Provider` C'EST JUSTE DES INFOS SUPPLÉMENTAIRES**

Quand un `User` avec `role=USER` veut devenir fournisseur :
1. Il s'inscrit comme fournisseur (envoie documents, etc.)
2. On crée un enregistrement dans la table `Provider` (infos business)
3. Une fois validé par admin, son `role` passe à `PROVIDER`
4. Il peut maintenant créer des abonnements

**Donc :**
- `User` = table principale (tout le monde)
- `Provider` = extension pour les fournisseurs (infos business)
- `Admin` = extension pour les admins (permissions)

---

### **3. LE `role` MANQUANT DANS LA RÉPONSE**

Tu as remarqué que dans la réponse, il y a bien `"role": "USER"` ! Regarde :

```json
{
  "user": {
    "id": "804afb88-1477-41cc-b4b8-ff4a97fc71d4",
    "email": "nathan@juna.app",
    "name": "Nathan Voglossou",
    "phone": "+22997123456",
    "role": "USER",  // <-- LE RÔLE EST LÀ !
    "isVerified": false,
    "isActive": true,
    ...
  }
}
```

Le rôle est bien là ! Par défaut, tout nouveau user est `USER`.

---

## 📋 **ROADMAP CORRIGÉE (BON ORDRE)**

### **PHASE 1 : MODULES CORE**

#### **1. Module USER** 👤
Gestion du profil utilisateur (tous les rôles) :
- Mettre à jour profil
- Upload avatar
- Gérer préférences
- Supprimer compte

#### **2. Module PROVIDER** 🏢
Inscription et gestion fournisseurs :
- `POST /providers/register` - Un USER s'inscrit comme fournisseur
- `GET /providers/me` - Mon profil fournisseur
- `PUT /providers/me` - Modifier mon profil fournisseur

**Workflow :**
1. User normal s'inscrit (role=USER)
2. User demande à devenir fournisseur (`/providers/register`)
3. Crée un `Provider` avec `status=PENDING`
4. Admin valide → `status=APPROVED` + `user.role` passe à `PROVIDER`
5. Maintenant le user peut créer des subscriptions

#### **3. Module SUBSCRIPTION** 📦
Les PROVIDERS créent des abonnements :
- `POST /providers/me/subscriptions` - Créer abonnement (PROVIDER uniquement)
- `GET /subscriptions` - Lister abonnements (public)
- `GET /subscriptions/:id` - Détails (public)

#### **4. Module ORDER** 🛒
Les USERS souscrivent aux abonnements :
- `POST /orders` - Créer commande (USER)
- `GET /orders/me` - Mes commandes

#### **5. Module PAYMENT** 💳
Traiter les paiements

**Etc...**

---

## 🔄 **FLOW COMPLET**

### **Scénario : Nathan devient fournisseur**

**Étape 1 : Nathan s'inscrit comme utilisateur normal**
```bash
POST /auth/register
{
  "email": "nathan@juna.app",
  "password": "Password123",
  "name": "Nathan"
}
→ User créé avec role=USER
```

**Étape 2 : Nathan veut devenir fournisseur**
```bash
POST /providers/register (avec authentification)
{
  "businessName": "Restaurant Nathan",
  "businessAddress": "Cotonou",
  "documentUrl": "..."
}
→ Provider créé avec status=PENDING
→ Nathan reste USER pour l'instant
```

**Étape 3 : Admin valide la demande**
```bash
PUT /admin/providers/:id/approve (admin uniquement)
→ Provider.status = APPROVED
→ User.role = PROVIDER (changement automatique)
```

**Étape 4 : Nathan crée un abonnement**
```bash
POST /providers/me/subscriptions (PROVIDER uniquement)
{
  "name": "Petit-déjeuner béninois",
  "price": 2000,
  ...
}
→ Subscription créé avec providerId=nathan_provider_id
```

**Étape 5 : Alice (USER) souscrit**
```bash
POST /orders (USER)
{
  "subscriptionId": "..."
}
→ Order créé
→ Payment traité
```

---

## 🎯 **EN RÉSUMÉ**

### **Tu avais raison sur :**
1. ✅ Provider DOIT venir avant Subscription
2. ✅ USER et PROVIDER c'est géré par le même modèle avec `role`
3. ✅ Le `role` existe (il était dans la réponse)

### **Clarification :**
- `User` = Table principale (tout le monde)
- `Provider` = Extension (infos business pour fournisseurs)
- Un `User` peut devenir `Provider` (changement de role)
- Seuls les `PROVIDER` peuvent créer des `Subscription`

---

## 📋 **ROADMAP FINALE CORRIGÉE**

**BON ORDRE :**
1. ✅ Module AUTH
2. ✅ Module PROVIDER
3. ✅ Module ADMIN
4. 🔄 Module SUBSCRIPTION (prochaine étape)
5. 🔄 Module ORDER
6. 🔄 Module PAYMENT
7. 🔄 Module REVIEW
8. 🔄 Module PROPOSAL
9. 🔄 Module TICKET
10. 🔄 Module NOTIFICATION
11. 🔄 Module REFERRAL
12. 🔄 Module SEARCH


