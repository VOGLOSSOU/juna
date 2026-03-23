# JUNA — Mobile App Guideline

> Document de référence pour le développement de l'application mobile Juna.
> À fournir en contexte au début de chaque session de développement.

---

## 1. Description du projet

**Juna** est une plateforme d'abonnement repas destinée au marché ouest-africain (Bénin et pays voisins).
Elle met en relation des utilisateurs avec des prestataires culinaires (restaurants, traiteurs, cuisiniers indépendants) qui proposent des formules d'abonnement repas : petit-déjeuner, déjeuner, dîner, journée complète, semaine de travail, etc.

### Problème résolu

En Afrique de l'Ouest, les travailleurs urbains perdent beaucoup de temps et d'argent à trouver un repas de qualité chaque jour. Juna leur permet de s'abonner à l'avance à un prestataire de confiance, de planifier leurs repas sur la semaine ou le mois, et de payer facilement via Mobile Money.

### Proposition de valeur

- **Pour l'utilisateur** : manger bien, sans stress, à prix maîtrisé, avec retrait sur place ou livraison.
- **Pour le prestataire** : avoir une clientèle fidèle, des revenus prévisibles, et une visibilité digitale.
- **Pour Juna** : commission sur chaque abonnement souscrit via la plateforme (`junaCommissionPercent`).

### Marchés cibles

- Bénin (lancement), puis extension progressive vers le Togo, la Côte d'Ivoire, le Sénégal.
- Cible principale : travailleurs urbains, étudiants, entreprises (repas d'équipe).

---

## 2. Rôles dans le système

| Rôle | Description |
|------|-------------|
| `USER` | Utilisateur final — cherche, s'abonne, commande, reçoit, évalue |
| `PROVIDER` | Prestataire culinaire — crée ses menus, gère ses abonnements et commandes |
| `ADMIN` | Gestionnaire Juna — valide les prestataires, modère, suit les stats |
| `SUPER_ADMIN` | Accès complet à la plateforme |

---

## 3. Backend existant

Le backend est déjà développé en **Node.js / Express / TypeScript / Prisma / PostgreSQL**.

- **Base URL API :** `http://localhost:5000/api/v1` (dev) — à remplacer par l'URL de prod
- **Auth :** JWT (access token 15min + refresh token 7 jours)
- **Paiement :** Mobile Money (Wave, MTN, Moov, Orange) + Carte + Espèces
- **Devise :** XOF (Franc CFA)

La connexion backend ↔ mobile se fera dans une phase ultérieure, une fois l'app mobile à un niveau raisonnable.

---

## 4. Stack technique mobile recommandée

### Framework principal

| Choix | Technologie | Raison |
|-------|------------|--------|
| Framework | **Flutter** (Dart) | Contrôle pixel-perfect, performances natives, design bluffant |
| Langage | **Dart** | Typé, simple, compilé nativement |
| Cible | iOS + Android (+ Web si besoin) | Un seul codebase |

### Stack complète

| Couche | Package | Rôle |
|--------|---------|------|
| State Management | `riverpod` + `flutter_riverpod` | Gestion d'état robuste, scalable, testable |
| Navigation | `go_router` | Routing déclaratif, deep linking, typé |
| HTTP Client | `dio` + `retrofit` | Appels API REST, intercepteurs, gestion erreurs |
| Auth Storage | `flutter_secure_storage` | Stockage sécurisé des tokens JWT |
| Cache / Local DB | `isar` | Base locale rapide pour offline et cache |
| Variables d'env | `flutter_dotenv` | Gestion des environnements dev/prod |
| Animations | Flutter natif + `lottie` | Animations fluides 60/120fps |
| Images réseau | `cached_network_image` | Chargement et cache d'images distantes |
| Design System | Material 3 (custom theme) | Base solide, entièrement personnalisable |
| Formulaires | `reactive_forms` | Gestion propre des formulaires et validations |
| Injection de dépendances | `riverpod` (providers) | Intégré au state management |
| Gestion dates | `intl` | Formatage dates/heures en contexte africain |
| Connectivity | `connectivity_plus` | Détecter l'état réseau (important en Afrique) |
| Notifications | `firebase_messaging` | Push notifications |
| QR Code | `qr_flutter` + `mobile_scanner` | Affichage et scan des QR codes commandes |
| Maps (futur) | `flutter_map` + OpenStreetMap | Géolocalisation sans coût Google Maps |

### Architecture du code

Pattern recommandé : **Feature-first + Clean Architecture légère**

```
lib/
├── main.dart
├── app/
│   ├── router/           # Go Router — toutes les routes
│   ├── theme/            # Design system, couleurs, typographie
│   └── providers/        # Providers globaux Riverpod
├── core/
│   ├── api/              # Client Dio, intercepteurs, endpoints
│   ├── storage/          # Secure storage, cache local
│   ├── errors/           # Gestion des erreurs (AppException, etc.)
│   ├── utils/            # Helpers, formatters, extensions
│   └── widgets/          # Widgets réutilisables (boutons, cards, inputs...)
└── features/
    ├── auth/
    │   ├── data/         # Repository, datasource, modèles API
    │   ├── domain/       # Entités, use cases
    │   └── presentation/ # Screens, controllers (Riverpod), widgets
    ├── home/
    ├── subscriptions/
    ├── orders/
    ├── profile/
    ├── provider/         # Espace prestataire
    ├── reviews/
    ├── notifications/
    └── support/
```

---

## 5. Identité visuelle et design

### Principes fondamentaux

- Design **moderne, chaud, africain** — pas froid/corporate
- UI **épurée** avec des accents de couleurs riches (à définir avec le designer)
- Beaucoup d'**images food de qualité** — la nourriture doit faire saliver
- **Animations subtiles** sur les transitions, les loadings, les interactions
- Prise en compte du **réseau lent** — skeletons loaders partout, pas de blocage UI
- **Accessibilité** : textes lisibles, contrastes corrects, zones de tap suffisamment grandes

### Système de design à construire

- `AppColors` — palette primaire, secondaire, neutres, états (error, success, warning)
- `AppTypography` — famille de polices, tailles, graisses (Google Fonts recommandé)
- `AppSpacing` — system de spacing cohérent (4, 8, 12, 16, 24, 32, 48...)
- `AppBorderRadius` — coins arrondis standardisés
- `AppShadows` — ombres douces et modernes
- Composants : `JunaButton`, `JunaCard`, `JunaInput`, `JunaAvatar`, `JunaBadge`...

---

## 6. Parcours utilisateur (USER)

> *À compléter avec la description détaillée de la navigation — en cours*

### Écrans prévus (liste provisoire)

**Onboarding & Auth**
- Splash screen
- Onboarding (slides de présentation — 3 écrans max)
- Inscription
- Connexion
- Vérification email / téléphone

**Découverte**
- Home / Accueil (abonnements mis en avant, par catégorie)
- Recherche / Filtres (type de repas, catégorie, durée, prix, zone)
- Détail abonnement (photos, repas inclus, prestataire, avis)
- Profil prestataire

**Commande**
- Sélection formule + durée
- Choix livraison ou retrait
- Récapitulatif commande
- Paiement (Mobile Money, carte, espèces)
- Confirmation + QR Code

**Suivi**
- Mes commandes (liste + statut)
- Détail commande + QR Code
- Historique

**Communauté**
- Laisser un avis
- Mes avis

**Profil**
- Mon profil
- Préférences alimentaires
- Notifications
- Support / Tickets
- Propositions personnalisées
- Parrainage

---

## 7. Parcours prestataire (PROVIDER)

> *À compléter*

**Onboarding prestataire**
- Candidature (formulaire + documents)
- Attente validation Juna

**Tableau de bord**
- Commandes du jour
- Revenus / statistiques
- Alertes

**Gestion**
- Mes repas (CRUD)
- Mes abonnements (CRUD)
- Gestion commandes (confirmer, prêt, livrer)
- Scan QR Code client

---

## 8. Règles importantes à respecter

1. **Toujours utiliser le Design System** — jamais de couleur ou taille en dur dans les widgets
2. **Riverpod pour tout l'état** — pas de setState sauf pour l'UI locale simple
3. **Gestion offline** — les listes doivent fonctionner en cache si le réseau coupe
4. **Skeleton loaders** — jamais de spinner seul sur un écran vide
5. **Gestion des erreurs explicite** — toujours afficher un message clair à l'utilisateur
6. **Responsive** — tester sur petits écrans (4.7") et grands écrans (6.7")
7. **Tokens JWT** — refresh automatique transparent pour l'utilisateur
8. **Séparation stricte** data / domain / presentation — pas de logique dans les widgets

---

## 9. Ce qui reste à connecter (backend)

Les modules backend suivants sont prêts ou en cours et seront connectés à l'app mobile :

| Module | Statut backend |
|--------|---------------|
| Authentification | Complet |
| Profil utilisateur | Complet |
| Prestataires | Complet |
| Repas (Meals) | Complet |
| Abonnements | Complet |
| Commandes | Complet |
| Avis | Complet |
| Paiements | En cours |
| Notifications | En cours |
| Support tickets | En cours |
| Propositions custom | En cours |
| Parrainage | En cours |

---

*Ce document est vivant — il sera mis à jour au fur et à mesure que la navigation et les règles métier sont affinées.*
