# Backend JUNA — Ce qui reste à faire

## Priorité 1 — Bloquant pour la prod

### Paiement
Aucune intégration de paiement n'existe. C'est le seul vrai bloquant — sans ça, personne ne peut payer.

**Endpoints à implémenter :**
- `POST /payments/initiate` — Initier un paiement pour une commande
- `POST /payments/webhook/:provider` — Recevoir les callbacks des opérateurs
- `GET /payments/:id/status` — Vérifier le statut d'un paiement

**Opérateurs à intégrer (par ordre de priorité) :**
- Wave (Bénin / Côte d'Ivoire)
- MTN Mobile Money
- Moov Money
- Orange Money

---

## Priorité 2 — Important

### Notifications in-app
Le modèle `Notification` existe en base mais les routes sont vides.

**Endpoints à implémenter :**
- `GET /notifications` — Mes notifications
- `PUT /notifications/:id/read` — Marquer comme lue
- `PUT /notifications/read-all` — Tout marquer comme lu
- `DELETE /notifications/:id` — Supprimer

**Déclencheurs à brancher :**
- Commande créée → notifier le provider
- Commande confirmée → notifier le user
- Commande prête → notifier le user

### Propositions custom
Un user peut proposer un repas personnalisé à un provider.

**Endpoints à implémenter :**
- `POST /proposals` — Créer une proposition
- `GET /proposals/me` — Mes propositions
- `GET /proposals/:id` — Détails
- `PUT /proposals/:id` — Modifier (si rejetée)
- `DELETE /proposals/:id` — Supprimer

---

## Priorité 3 — Utile

### Tickets support
**Endpoints à implémenter :**
- `POST /tickets` — Créer un ticket
- `GET /tickets/me` — Mes tickets
- `GET /tickets/:id` — Détails
- `POST /tickets/:id/messages` — Répondre
- `PUT /tickets/:id/close` — Clôturer

### Vérification email
Envoyer un email de confirmation à l'inscription et bloquer l'accès tant que l'email n'est pas vérifié.

---

## Priorité 4 — Bonus

### Parrainage (referral)
- `GET /referrals/me/code` — Mon code
- `GET /referrals/me` — Mes parrainages
- `POST /referrals/validate` — Valider un code

### Google OAuth
Connexion via compte Google. Complexe, pas critique pour le lancement.

---

## Ce qui est déjà fait (100% fonctionnel et testé)

| Module | Statut |
|--------|--------|
| Auth (register, login, refresh, logout, me) | ✅ |
| Profil user (update, localisation) | ✅ |
| Provider (register, profil, update) | ✅ |
| Admin (approve, reject, suspend, list) | ✅ |
| Repas (CRUD complet) | ✅ |
| Abonnements (CRUD complet) | ✅ |
| Découverte (list public, filtres) | ✅ |
| Commandes (create, confirm, ready, delivered, cancel) | ✅ |
| Reviews (create, update, delete, moderate) | ✅ |
| Upload Cloudinary | ✅ |
