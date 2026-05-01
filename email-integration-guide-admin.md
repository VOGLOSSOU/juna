# Guide d'intégration — Système Email
**Pour le développeur Admin**
**Version : 1.0 — Mai 2026**

---

## Contexte

Le backend Juna envoie maintenant des emails automatiques aux prestataires lorsqu'un admin approuve ou rejette leur dossier. Ce guide explique ce qui est automatique, ce qui a changé, et ce qu'il y a à faire (ou ne pas faire) côté panel admin.

---

## PARTIE 1 — Ce qui est entièrement automatique

### Approbation d'un prestataire

Quand l'admin appelle l'endpoint d'approbation :

**`POST /api/v1/admin/providers/:id/approve`**

```json
// Request body
{
  "message": "Votre dossier a été validé, bienvenue !"  // optionnel
}
```

Le backend fait automatiquement, dans l'ordre :
1. Met le statut du provider à `APPROVED`
2. Met le rôle de l'utilisateur à `PROVIDER`
3. **Envoie un email au prestataire** — objet : *"Félicitations — Votre compte prestataire est approuvé !"*

L'email contient :
- Le nom du prestataire
- Le nom du business
- Un bouton pour accéder à son espace prestataire
- Un message de bienvenue

> **Rien à faire côté UI admin.** L'email part automatiquement dès que l'approbation est enregistrée.

---

### Rejet d'un prestataire

Quand l'admin appelle l'endpoint de rejet :

**`POST /api/v1/admin/providers/:id/reject`**

```json
// Request body
{
  "reason": "Documents fournis incomplets ou illisibles."  // obligatoire
}
```

Le backend fait automatiquement :
1. Met le statut du provider à `REJECTED`
2. **Envoie un email au prestataire** avec le motif de rejet — objet : *"Mise à jour de votre demande prestataire — Juna"*

L'email contient :
- Le motif de rejet (exactement ce qui est passé dans `reason`)
- Une invitation à soumettre une nouvelle demande si le prestataire pense à une erreur

> **Important :** Le champ `reason` dans le body devient le contenu de l'email de rejet. Rédige-le de manière claire et professionnelle — le prestataire le lira tel quel.

---

## PARTIE 2 — Ce qui n'a PAS changé côté admin

Les endpoints admin restent identiques :

| Endpoint | Changement |
|---|---|
| `POST /admin/providers/:id/approve` | Aucun changement dans le body/response — l'email part en arrière-plan |
| `POST /admin/providers/:id/reject` | Aucun changement dans le body/response — l'email part en arrière-plan |
| Tous les autres endpoints admin | Inchangés |

---

## PARTIE 3 — Ce qu'il faudrait améliorer dans l'UI admin (recommandations)

Ces éléments ne bloquent rien, mais amélioreraient l'expérience admin :

### 1. Badge de confirmation d'email dans la liste des providers

Dans la liste des prestataires en attente, afficher si leur email est vérifié (`isVerified: true/false`). Un prestataire avec `isVerified: false` ne peut de toute façon pas candidater (le backend bloque), mais ça peut aider à comprendre certains cas.

> `isVerified` est disponible dans l'objet `user` retourné par les endpoints admin qui listent les providers.

### 2. Prévisualisation du motif de rejet

Avant de soumettre un rejet, afficher un aperçu du message qui sera envoyé par email au prestataire. Ça évite d'envoyer un motif trop court ou mal formulé.

### 3. Confirmation visuelle d'envoi d'email

Après approbation ou rejet, afficher un indicateur dans l'UI : *"Email envoyé au prestataire"*. Techniquement, le backend envoie toujours l'email — c'est juste un feedback visuel pour rassurer l'admin.

---

## PARTIE 4 — Emails envoyés par le système (référence complète)

Pour information, voici tous les emails que le backend envoie automatiquement, avec leurs déclencheurs :

| Déclencheur | Destinataire | Email envoyé |
|---|---|---|
| User demande un code OTP | User | Code à 6 chiffres pour vérifier son email |
| Inscription réussie | User | Email de bienvenue sur Juna |
| Mot de passe oublié | User | Lien de réinitialisation (valable 1h) |
| Paiement confirmé | User | Récapitulatif de la commande |
| Paiement confirmé | **Prestataire** | Notification nouvelle commande |
| **Admin approuve un provider** | **Prestataire** | Email d'approbation ✅ |
| **Admin rejette un provider** | **Prestataire** | Email de rejet avec motif ✅ |

Les lignes en gras sont celles qui concernent directement le panel admin.

---

## PARTIE 5 — En cas de problème d'email

Si un prestataire signale ne pas avoir reçu l'email d'approbation ou de rejet :

1. Vérifier que son adresse email est correcte dans le panel
2. Lui demander de vérifier ses spams
3. Le backend logge les erreurs d'envoi — consulter les logs Railway si besoin
4. Si l'email est incorrect, la seule solution est de le corriger directement en base (pas d'endpoint admin pour modifier l'email d'un user pour l'instant)

> Les emails sont envoyés via **Brevo** (ex-Sendinblue). En cas de problème persistant, vérifier le tableau de bord Brevo pour voir l'historique des envois.
