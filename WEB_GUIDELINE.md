# JUNA — Web App Guideline

> Document de référence pour le développement de la version web de Juna.
> À fournir en contexte au début de chaque session de développement.
> Inspiré de MOBILE_GUIDELINE.md mais adapté au web.

---

## 1. Description du projet

**Juna** est une plateforme d'abonnement repas destinée au marché ouest-africain (Bénin et pays voisins).
Elle met en relation des utilisateurs avec des prestataires culinaires (restaurants, traiteurs, cuisiniers indépendants) qui proposent des formules d'abonnement repas : petit-déjeuner, déjeuner, dîner, journée complète, semaine de travail, etc.

### Problème résolu

En Afrique de l'Ouest, les travailleurs urbains perdent beaucoup de temps et d'argent à trouver un repas de qualité chaque jour. Juna leur permet de s'abonner à l'avance à un prestataire de confiance, de planifier leurs repas sur la semaine ou le mois, et de payer facilement via Mobile Money.

### Proposition de valeur

- **Pour l'utilisateur** : manger bien, sans stress, à prix maîtrisé, avec retrait sur place ou livraison.
- **Pour le prestataire** : avoir une clientèle fidèle, des revenus prévisibles, et une visibilité digitale.

### Marchés cibles

- Bénin (lancement), puis extension progressive vers le Togo, la Côte d'Ivoire, le Sénégal.
- Cible principale : travailleurs urbains, étudiants, entreprises (repas d'équipe).

**Spécificité web :** La version web sert de **vitrine SEO** et **complément mobile**. Elle permet la découverte via moteurs de recherche et conversions desktop.

---

## 2. Rôles dans l'app web

L'application web est destinée uniquement à deux types d'utilisateurs :

| Rôle | Description |
|------|-------------|
| `USER` | Utilisateur final — cherche, s'abonne, commande, reçoit, évalue |
| `PROVIDER` | Prestataire culinaire — crée ses menus, gère ses abonnements et commandes |

**Différence mobile :** La web app est plus orientée **découverte** et **gestion**, moins transactionnelle que l'app mobile.

---

## 3. Stack technique web

### Framework principal

| Choix | Technologie | Raison |
|-------|------------|--------|
| Framework | **Next.js 14** (App Router, React 18) | SSR/SSG pour SEO, App Router moderne, déploiement Vercel facile |
| Langage | **TypeScript** | Sécurité, autocomplétion, maintenabilité |
| Styling | **Tailwind CSS** | Cohérence avec mobile, utility-first, performant |
| State | **React Context + useState** | Suffisant pour web (pas besoin Redux) |
| API | **Axios** | Même que mobile pour cohérence |
| SEO | **Next.js Metadata API** | Meta tags, Open Graph, structured data |
| Analytics | **Google Analytics 4** | Suivi conversions web |

### Stack complète

| Couche | Package | Rôle |
|--------|---------|------|
| Framework | `next@14`, `react@18`, `react-dom@18` | Base Next.js |
| TypeScript | `typescript@5` | Type safety |
| Styling | `tailwindcss@3`, `@tailwindcss/typography` | Styles + prose |
| UI Components | `shadcn/ui` | Composants accessibles, cohérents avec mobile |
| Icons | `lucide-react` | Icônes cohérentes |
| HTTP Client | `axios@1` | API calls |
| Forms | `react-hook-form@7` + `zod@3` | Validation forms |
| State | React Context + `useState` | State management |
| Auth | `next-auth@4` | Gestion JWT, sessions |
| SEO | Built-in Next.js | Meta, sitemap, robots |
| PWA | `next-pwa@5` | Progressive Web App |
| Responsive | `tailwindcss` breakpoints | Mobile-first |
| Images | `next/image` | Optimisation automatique |

### Architecture du code

Pattern recommandé : **Feature-first + App Router**

```
web-app/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home page
│   ├── globals.css              # Global styles
│   └── (auth)/                   # Route groups
│       ├── login/
│       └── register/
├── components/                   # Shared components
│   ├── ui/                      # shadcn/ui components
│   ├── layout/                  # Header, Footer, Navigation
│   ├── forms/                   # Form components
│   └── common/                  # Reusable components
├── lib/                         # Utilities
│   ├── api/                     # API client, endpoints
│   ├── auth/                    # Auth utilities
│   ├── utils/                   # Helpers, formatters
│   └── validations/             # Zod schemas
├── features/                    # Feature-based organization
│   ├── auth/
│   │   ├── components/          # Feature components
│   │   ├── hooks/              # Custom hooks
│   │   └── types/              # Feature types
│   ├── home/
│   ├── subscriptions/
│   ├── orders/
│   └── profile/
├── public/                      # Static assets
│   ├── images/
│   └── icons/
├── styles/                      # Additional styles
├── types/                       # Global TypeScript types
└── middleware.ts                # Next.js middleware
```

---

## 4. Identité visuelle et Design System

### Couleurs officielles

**Même système que mobile :** Extraites directement des logos officiels de Juna.

**Philosophie :** Vert foncé + Blanc comme couleurs dominantes. Orange utilisé en accent rare et chirurgical.

```typescript
// lib/colors.ts
export const colors = {
  // === COULEURS PRINCIPALES ===
  primary: {
    50: '#EEF5F0',    // Vert très clair — backgrounds
    100: '#D4E8D7',
    500: '#1A5C2A',   // Vert principal — boutons, liens
    600: '#0F3D1A',   // Vert foncé — headers, hover
    700: '#0A2A12',
  },

  // === ACCENT (orange — utilisation rare) ===
  accent: '#F4521E',   // Orange Juna — CTA, prix, badges

  // === NEUTRES ===
  white: '#FFFFFF',
  gray: {
    50: '#F7F7F7',    // Background général
    100: '#F0F0F0',
    200: '#E5E5E5',
    500: '#6B6B6B',   // Texte secondaire
    900: '#1A1A1A',   // Texte principal
  },

  // === ÉTATS ===
  success: '#2E7D32',
  error: '#D32F2F',
  warning: '#F9A825',
  info: '#0277BD',
} as const;
```

### Typographie

**Police :** Plus Jakarta Sans (Google Fonts)

```typescript
// styles/globals.css
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

:root {
  --font-family: 'Plus Jakarta Sans', sans-serif;
}

// Classes Tailwind
.text-display-large { @apply text-4xl font-bold leading-tight; }
.text-headline-large { @apply text-3xl font-semibold; }
.text-title-large { @apply text-xl font-semibold; }
.text-body-large { @apply text-base font-normal; }
.text-label-large { @apply text-base font-medium; }
```

### Spacing & Breakpoints

```typescript
// lib/theme.ts
export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '0.75rem',   // 12px
  lg: '1rem',      // 16px
  xl: '1.5rem',    // 24px
  xxl: '2rem',     // 32px
  xxxl: '3rem',    // 48px
};

export const breakpoints = {
  sm: '640px',     // Mobile
  md: '768px',     // Tablet
  lg: '1024px',    // Desktop
  xl: '1280px',    // Large desktop
};
```

### Composants personnalisés

Créer ces composants réutilisables :

- `Button` — variantes : primary, secondary, outline, ghost
- `Card` — conteneurs avec ombre
- `Input` — champs de formulaire stylisés
- `Badge` — tags et indicateurs
- `Modal` — dialogs et overlays
- `Skeleton` — loading states
- `Toast` — notifications

---

## 5. Responsive Design & Breakpoints

### Approche Mobile-First

- **Base mobile** : Design optimisé pour mobile (320px+)
- **Tablet** : Améliorations pour 768px+
- **Desktop** : Optimisations pour 1024px+

### Layout Patterns

```typescript
// Composants responsive
<Container className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  <Grid className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {/* Content */}
  </Grid>
</Container>
```

### Navigation

- **Mobile** : Menu hamburger → drawer latéral
- **Desktop** : Navigation horizontale fixe

---

## 6. Parcours utilisateur (USER) - Version Web

---

### 6.1 Flux de démarrage

```
Accès au site web
       │
       ▼
  Page d'accueil (SEO optimisée)
       │
       ▼
  L'user veut s'abonner ?
   ├── OUI → Modal connexion/inscription → Flow commande
   └── NON → Continue exploration
```

**Différences web :**
- **Pas d'onboarding forcé** (contrairement mobile)
- **Modal d'auth** au moment de l'action
- **Focus SEO** : contenu découvrable sans compte

---

### 6.2 Header de navigation

**Desktop :**
```
┌─────────────────────────────────────────────────┐
│ 🏠 JUNA              [Explorer] [Abonnements] [Connexion] │
└─────────────────────────────────────────────────┘
```

**Mobile :**
- Menu hamburger ouvrant un drawer

**Éléments :**
- Logo Juna (lien home)
- Navigation principale
- Bouton connexion (devient profil quand connecté)
- Badge panier si commandes en cours

---

### 6.3 Page d'accueil — Structure détaillée

**Même logique que mobile mais adaptée web :**

#### HEADER (fixe)

**Desktop :**
```
┌─────────────────────────────────────────────────┐
│ 👋 Bonjour, Marcus          📍 Bénin, Cotonou ▾    🔔 (3) │
└─────────────────────────────────────────────────┘
```

**Mobile :** Collapsible, moins d'éléments

#### FILTRES (responsive)

**Desktop :** Chips horizontales + dropdown
**Mobile :** Accordéon ou modal

#### BODY — Sections abonnements

**Même sections que mobile :**
- Populaires près de chez vous
- Cuisine Africaine
- Formules semaine de travail
- Découvrir les prestataires

**Adaptations web :**
- **Grille responsive** au lieu de scroll horizontal
- **CTA plus visibles** : "Voir plus" → pages dédiées
- **Images optimisées** pour desktop (Next.js Image)

---

### 6.4 Authentification

**Modal centered** (pas de page dédiée) :

```
┌─────────────────────────────┐
│   Connexion à JUNA           │
│                             │
│  Email : [______________]    │
│  Mot de passe : [_______]    │
│                             │
│  [Se connecter]              │
│                             │
│  ───────── ou ─────────      │
│                             │
│  [Créer un compte]           │
│                             │
└─────────────────────────────┘
```

**Différences web :**
- **Modal** au lieu de page
- **Persistance** : session maintenue entre visites
- **Redirections** : après login → page précédente

---

### 6.5 Page Explorer

**Structure desktop :**
```
┌─────────────────────────────────────────────────┐
│  🔍  Rechercher un abonnement                   │
│                                               │
│  [ 🌍 Africain ][ ☪️ Halal ]...  ⚙️ Filtres (2) │
│                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │  card    │  │  card    │  │  card    │    │
│  └──────────┘  └──────────┘  └──────────┘    │
│                                               │
│  [1] [2] [3] ... [10]                         │
│                                               │
└─────────────────────────────────────────────────┘
```

**Responsive :**
- **Desktop** : grille 3 colonnes
- **Tablet** : grille 2 colonnes
- **Mobile** : grille 1 colonne

---

### 6.6 Flow de commande

**Même étapes que mobile mais :**

- **Étape 1** : Modal choix livraison (plus d'espace que mobile)
- **Étape 2** : Page récapitulatif (meilleure lisibilité desktop)
- **Étape 3** : Page paiement
- **Étape 4** : Page confirmation + QR

**Adaptations web :**
- **Plus d'espace** : étapes sur pages séparées au lieu de modals
- **Navigation** : breadcrumbs pour indiquer progression
- **Impression** : bouton "Imprimer récapitulatif"

---

### 6.7 Dashboard utilisateur

**Page dédiée** `/dashboard` :

```
┌─────────────────────────────────────────────────┐
│  Mon tableau de bord                           │
├─────────────────┬───────────────────────────────┤
│  Commandes      │  Abonnements actifs           │
│  en cours       │                               │
│                 │  ┌─────────────────────────┐  │
│  ● CONFIRMÉE    │  │ Abonnement Repas Africain │  │
│  Abonnement...  │  │ Par Chez Mariam           │  │
│                 │  └─────────────────────────┘  │
└─────────────────┴───────────────────────────────┘
```

**Fonctionnalités :**
- Vue d'ensemble commandes
- Gestion abonnements actifs
- Historique
- Profil et préférences

---

## 7. SEO & Performance

### SEO Essentiel

**Méta tags :**
```typescript
// app/layout.tsx
export const metadata: Metadata = {
  title: 'JUNA - Abonnements Repas | Bénin, Côte d\'Ivoire',
  description: 'Découvrez les meilleurs abonnements repas au Bénin. Cuisine africaine authentique, livraison ou retrait. Économisez du temps et de l\'argent.',
  keywords: ['abonnement repas', 'cuisine africaine', 'Bénin', 'Cotonou'],
  openGraph: {
    title: 'JUNA - Abonnements Repas',
    description: 'Mangez bien sans stress au Bénin',
    images: ['/og-image.jpg'],
  },
};
```

**Pages clés à optimiser :**
- `/` : Page d'accueil (rich snippets restaurants)
- `/explorer` : Page catalogue (filtrage faceted)
- `/abonnement/[id]` : Pages produit (structured data)

### Performance

**Optimisations Next.js :**
- **SSR/SSG** pour contenu statique
- **Image optimization** automatique
- **Code splitting** automatique
- **Caching** intelligent

**Métriques cibles :**
- **Lighthouse** : 90+ sur toutes métriques
- **Core Web Vitals** : bonnes notes
- **Mobile-friendly** : 100% responsive

---

## 8. PWA Features

### Fonctionnalités PWA

- **Installation** : Bouton "Installer l'app" sur desktop
- **Offline** : Cache des pages importantes
- **Notifications** : Push notifications (si permission)
- **Sync** : Synchronisation en background

### Service Worker

```typescript
// public/sw.js
self.addEventListener('install', (event) => {
  // Cache static assets
});

self.addEventListener('fetch', (event) => {
  // Network-first strategy for dynamic content
});
```

---

## 9. Analytics & Tracking

### Google Analytics 4

**Événements clés :**
- `view_subscription` : Consultation abonnement
- `initiate_checkout` : Démarrage commande
- `purchase` : Achat complété
- `user_registration` : Inscription
- `provider_registration` : Inscription prestataire

### Conversion Funnels

- **Découverte** : Page d'accueil → Explorer
- **Conversion** : Explorer → Détail → Commande → Paiement
- **Retention** : Commandes répétées, avis

---

## 10. Règles de développement

1. **SEO First** : Toujours penser référencement et performance
2. **Responsive First** : Design mobile-first, desktop optimisé
3. **Accessibilité** : WCAG AA minimum
4. **Performance** : Bundle size < 200KB, Lighthouse 90+
5. **TypeScript Strict** : Pas de `any`, types partout
6. **Component Reuse** : Maximum de composants partagés
7. **SEO Tags** : Metadata sur chaque page
8. **Loading States** : Skeletons partout, pas de flash blanc

---

## 11. Déploiement & Hosting

### Vercel (recommandé)

**Configuration :**
- **Build** : `next build`
- **Domains** : `juna.bj`, `juna.ci`, etc.
- **CDN** : Global edge network
- **Analytics** : Intégré

### Environment Variables

```
NEXT_PUBLIC_API_URL=https://juna-app.up.railway.app/api/v1
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=https://juna.bj
GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

---

*Ce document est vivant — il sera mis à jour au fur et à mesure que l'expérience web évolue.*</content>
<parameter name="filePath">WEB_GUIDELINE.md