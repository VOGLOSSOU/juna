# Guide d'intégration du paiement — JUNA

> Ce document est destiné aux équipes frontend (web et mobile).
> Il décrit le flux complet de paiement via PawaPay Mobile Money,
> du déclenchement jusqu'à la confirmation de commande.

---

## Vue d'ensemble

JUNA utilise **PawaPay** comme passerelle de paiement Mobile Money.
Le paiement est **asynchrone** : on initie, l'opérateur envoie une notification de confirmation à notre backend, et notre backend met à jour la commande.

**Opérateurs supportés :** MTN MoMo, Moov Money, Orange Money.

**Flux global :**

```
[User] → POST /payments/initiate → [Backend JUNA] → PawaPay
                                                          ↓
                                              (user reçoit une demande PIN sur son téléphone)
                                                          ↓
                                              (user valide ou refuse)
                                                          ↓
                                         PawaPay → POST /payments/webhook/deposit → [Backend JUNA]
                                                          ↓
                                              (commande passe à CONFIRMED)
                                                          ↓
[Frontend] → GET /payments/:id/status ← polling jusqu'à statut final
```

---

## Base URL

**Production :**
```
https://juna-app.up.railway.app/api/v1
```

**Local :**
```
http://localhost:5000/api/v1
```

Tous les endpoints protégés nécessitent : `Authorization: Bearer {accessToken}`

---

## Les 3 endpoints de paiement

### 1. `POST /payments/initiate` — Initier un paiement

**Auth requise :** oui (user connecté)

**Quand l'appeler :** quand l'utilisateur clique sur "Payer" après avoir sélectionné son abonnement et avoir une commande créée.

**Body :**
```json
{
  "orderId": "uuid-de-la-commande",
  "phoneNumber": "22997123456",
  "provider": "MTN_MOMO_BEN"
}
```

| Champ | Type | Requis | Description |
|---|---|---|---|
| `orderId` | UUID | ✅ | ID de la commande à payer (créée via `POST /orders`) |
| `phoneNumber` | string | ✅ | Numéro Mobile Money du payeur (avec ou sans indicatif) |
| `provider` | string | ❌ | Code opérateur (ex: `MTN_MOMO_BEN`, `MOOV_BEN`). Si omis, détecté automatiquement depuis le numéro |

> **Tip :** Ne pas envoyer `provider` si vous laissez l'utilisateur taper seulement son numéro. Le backend prédit l'opérateur automatiquement.

**Réponse succès (200) :**
```json
{
  "success": true,
  "data": {
    "paymentId": "uuid-du-paiement",
    "depositId": "uuid-pawapay",
    "status": "PROCESSING",
    "message": "Paiement initié. Veuillez valider sur votre téléphone."
  }
}
```

**Que faire après :** sauvegarder le `paymentId` et démarrer le **polling** sur `GET /payments/:id/status`.

---

### 2. `GET /payments/:id/status` — Vérifier le statut

**Auth requise :** oui

**Quand l'appeler :** en polling régulier après avoir initié le paiement, jusqu'à obtenir un statut final.

**Exemple :**
```
GET /payments/uuid-du-paiement/status
```

**Réponse (200) :**
```json
{
  "success": true,
  "data": {
    "id": "uuid-du-paiement",
    "orderId": "uuid-de-la-commande",
    "amount": 5000,
    "currency": "XOF",
    "method": "MOBILE_MONEY_MTN",
    "status": "PROCESSING",
    "paidAt": null,
    "createdAt": "2025-05-15T10:00:00.000Z"
  }
}
```

**Valeurs possibles du champ `status` :**

| Valeur | Signification | Action frontend |
|---|---|---|
| `PROCESSING` | En attente de validation PIN par le user | Afficher un écran d'attente, continuer le polling |
| `SUCCESS` | Paiement validé, commande confirmée | Arrêter le polling, afficher confirmation |
| `FAILED` | Paiement échoué (refus, solde insuffisant…) | Arrêter le polling, afficher erreur avec option de réessayer |

---

### 3. `POST /payments/webhook/deposit` — Webhook (backend only)

**Auth requise :** non

Cet endpoint est appelé **directement par PawaPay**, pas par le frontend. Vous n'avez pas à l'intégrer. Il est documenté ici pour information.

---

## Erreurs possibles sur `POST /payments/initiate`

| Code HTTP | `error.code` | Cause | Que faire |
|---|---|---|---|
| 404 | `ORDER_NOT_FOUND` | L'`orderId` n'existe pas | Vérifier l'ID de commande |
| 403 | `FORBIDDEN` | La commande n'appartient pas au user connecté | Ne devrait pas arriver normalement |
| 409 | `PAYMENT_ALREADY_PROCESSED` | Commande déjà payée ou paiement déjà en cours | Rediriger vers le statut existant |
| 400 | `PAYMENT_FAILED` | PawaPay a rejeté immédiatement (numéro invalide, provider indisponible…) | Afficher le message d'erreur, laisser réessayer |
| 503 | `PAWAPAY_ERROR` | PawaPay est indisponible | Afficher un message "service momentanément indisponible" |
| 422 | `VALIDATION_ERROR` | Champs manquants ou invalides | Corriger le formulaire |

---

## Flux d'implémentation étape par étape

### Étape 1 — Créer la commande

Avant de payer, une commande doit exister. Si ce n'est pas encore fait :

```
POST /orders
{
  "subscriptionId": "...",
  "deliveryMethod": "DELIVERY" | "PICKUP",
  "deliveryAddress": "...",         // si DELIVERY
  "pickupLocation": "..."           // si PICKUP
}
```

Récupérer l'`orderId` dans la réponse.

---

### Étape 2 — Afficher le formulaire de paiement

Collecter auprès de l'utilisateur :
- Son **numéro Mobile Money** (avec l'indicatif du pays, ex: `22997123456`)
- Son **opérateur** (optionnel — vous pouvez laisser le backend le détecter)

> **Recommandation UX :** ne pas forcer l'utilisateur à choisir l'opérateur. Laissez le champ optionnel et laissez le backend prédire depuis le numéro. Affichez juste l'opérateur détecté pour confirmation.

---

### Étape 3 — Appeler `POST /payments/initiate`

```javascript
const response = await fetch('/api/v1/payments/initiate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`,
  },
  body: JSON.stringify({
    orderId,
    phoneNumber,
    // provider optionnel
  }),
});

const { data } = await response.json();
// Sauvegarder data.paymentId
```

En cas de succès, **afficher immédiatement un écran d'attente** en expliquant à l'utilisateur :

> "Une demande de confirmation a été envoyée sur votre téléphone. Veuillez saisir votre code PIN Mobile Money pour valider le paiement."

---

### Étape 4 — Polling sur `GET /payments/:id/status`

Démarrer un polling toutes les **5 secondes**, avec un timeout maximum de **3 minutes**.

```javascript
const POLL_INTERVAL = 5000;    // 5 secondes
const MAX_WAIT = 180000;       // 3 minutes
const startTime = Date.now();

async function pollPaymentStatus(paymentId) {
  while (Date.now() - startTime < MAX_WAIT) {
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));

    const res = await fetch(`/api/v1/payments/${paymentId}/status`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    const { data } = await res.json();

    if (data.status === 'SUCCESS') {
      // Paiement validé → aller vers la page de confirmation
      navigateTo(`/orders/${data.orderId}/confirmation`);
      return;
    }

    if (data.status === 'FAILED') {
      // Échec → afficher erreur et option de réessayer
      showError('Le paiement a échoué. Vérifiez votre solde et réessayez.');
      return;
    }

    // Sinon : status = PROCESSING → continuer le polling
  }

  // Timeout atteint → afficher message d'attente prolongée
  showError('Le paiement prend plus de temps que prévu. Vérifiez votre historique de transactions.');
}
```

---

### Étape 5 — Écrans à prévoir

**Écran en cours de paiement (PROCESSING) :**
- Spinner ou animation de chargement
- Message : "Validation en cours… Saisissez votre code PIN sur votre téléphone."
- Montant et opérateur affichés
- Bouton "Annuler" (ne fait pas d'appel API, redirige juste l'utilisateur vers ses commandes — le paiement reste en attente côté backend)

**Écran de succès (SUCCESS) :**
- Confirmation visuelle (checkmark, animation)
- Récapitulatif : abonnement, montant, date
- Bouton "Voir ma commande"

**Écran d'échec (FAILED) :**
- Message d'erreur clair
- Bouton "Réessayer" → relancer le formulaire de paiement avec le même `orderId`
- Bouton "Annuler" → retour à l'abonnement

---

## Codes opérateurs PawaPay (pays couverts)

| Opérateur | Code `provider` | Pays | Devise |
|---|---|---|---|
| MTN Mobile Money | `MTN_MOMO_BEN` | Bénin | XOF |
| Moov Money | `MOOV_BEN` | Bénin | XOF |
| MTN Mobile Money | `MTN_MOMO_CIV` | Côte d'Ivoire | XOF |
| Moov Money | `MOOV_CIV` | Côte d'Ivoire | XOF |
| Orange Money | `ORANGE_CIV` | Côte d'Ivoire | XOF |
| MTN Mobile Money | `MTN_MOMO_SEN` | Sénégal | XOF |
| Orange Money | `ORANGE_SEN` | Sénégal | XOF |

> La liste exacte des opérateurs actifs sur votre compte PawaPay est configurable depuis le dashboard PawaPay. Ce tableau couvre les marchés principaux de JUNA.

---

## Précautions importantes

**Ne jamais recréer une commande pour réessayer un paiement.** Si un paiement a échoué, réutiliser le même `orderId` dans un nouvel appel à `POST /payments/initiate`. Le backend gère la réinitialisation.

**Gérer le cas où le token expire pendant le polling.** Si le token JWT expire (15 min) pendant le polling, le refresh token doit être utilisé pour en obtenir un nouveau avant de continuer.

**Ne pas afficher le `depositId` à l'utilisateur.** C'est un identifiant interne PawaPay. Utiliser uniquement le `paymentId` JUNA pour les appels API.

**En environnement sandbox PawaPay :** les paiements sont automatiquement validés sans demande de PIN. Le callback arrive en quelques secondes. En production, l'utilisateur doit saisir son PIN sur son téléphone — le délai peut aller jusqu'à 1-2 minutes.
