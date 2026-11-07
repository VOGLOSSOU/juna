# Alertes de paiement FeexPay

Chaque paiement `FEEXPAY` dont le statut vérifié est `SUCCESS` donne lieu à une
alerte à `n969601@gmail.com`. Les échecs, paiements en cours, remboursements et
paiements historiques d'autres passerelles sont exclus.

L'email contient le montant, la devise, la date du paiement (heure du Bénin), la
commande, le client, l'abonnement, le prestataire et la référence FeexPay. Pour
une ancienne ligne sans `paidAt`, la date d'enregistrement est indiquée comme
telle, sans inventer une date de paiement.

## Déploiement Railway

- Déployer ce code. `npm start` exécute déjà `prisma migrate deploy` avant le serveur.
- Garder la configuration Brevo existante : `BREVO_API_KEY`,
  `BREVO_SENDER_EMAIL`, et éventuellement `BREVO_SENDER_NAME`.
- `NODE_ENV=production` active les alertes automatiquement.
- `PAYMENT_NOTIFICATION_EMAIL=n969601@gmail.com` permet de définir explicitement
  le destinataire (c'est aussi la valeur par défaut).
- `PAYMENT_NOTIFICATIONS_ENABLED=false` désactive l'envoi. La valeur `true`
  l'active explicitement, y compris hors production.

Au premier démarrage, le serveur rattrape les paiements FeexPay déjà réussis,
par lots de 20. Il poursuit chaque minute, sans modifier les commandes ni
redemander un paiement. Il n'est pas nécessaire de renvoyer les webhooks.

Les futurs succès déclenchent un envoi en arrière-plan après la validation du
paiement. Une interruption du processus est rattrapée par le même job.

## Fiabilité

Les champs `Payment.adminEmailSentAt`, `adminEmailClaimToken` et
`adminEmailNextAttemptAt` assurent le suivi durable, la réservation atomique entre
instances et une reprise après cinq minutes en cas d'échec ou de redémarrage.
Un email accepté par Brevo est marqué envoyé et n'est plus repris. Ce statut
signifie « accepté par Brevo », pas « arrivé dans la boîte principale ».

La clé d'idempotence Brevo réutilise l'identifiant UUID du paiement lors des
reprises. Sa fenêtre de déduplication est de 30 minutes : une panne entre
l'acceptation Brevo et la sauvegarde en base, prolongée au-delà de cette fenêtre,
peut exceptionnellement produire un doublon. Documentation :
https://developers.brevo.com/docs/heterogenous-versions-batch-emails

En développement et en test, les alertes sont désactivées par défaut, pour ne pas
envoyer d'alertes à partir des données locales. Les tests simulent Brevo et FeexPay.

La racine `GET /` renvoie maintenant un accueil JSON et les liens vers le site,
l'API, la santé du service et la version. Les routes inconnues restent en 404.
