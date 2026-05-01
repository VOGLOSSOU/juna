import { BrevoClient } from '@getbrevo/brevo';

const brevo = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY ?? '',
});

const SENDER = {
  name: process.env.BREVO_SENDER_NAME ?? 'Juna',
  email: process.env.BREVO_SENDER_EMAIL ?? 'noreply@juna.app',
};

const APP_URL = process.env.APP_URL ?? 'https://juna.app';

async function send(to: { email: string; name?: string }, subject: string, htmlContent: string) {
  if (!process.env.BREVO_API_KEY) {
    console.warn('[email] BREVO_API_KEY not set — email skipped');
    return;
  }
  try {
    await brevo.transactionalEmails.sendTransacEmail({
      sender: SENDER,
      to: [{ email: to.email, name: to.name }],
      subject,
      htmlContent,
    });
  } catch (err) {
    console.error('[email] Failed to send email:', err);
  }
}

// ─── Templates ────────────────────────────────────────────────────────────────

function layout(title: string, body: string) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background: #f5f5f5; font-family: Arial, sans-serif; }
    .wrapper { max-width: 600px; margin: 32px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: #FF6B35; padding: 24px 32px; text-align: center; }
    .header h1 { margin: 0; color: #ffffff; font-size: 28px; letter-spacing: 2px; }
    .body { padding: 32px; color: #333333; line-height: 1.6; }
    .body h2 { color: #FF6B35; margin-top: 0; }
    .btn { display: inline-block; margin: 24px 0; padding: 14px 32px; background: #FF6B35; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold; }
    .footer { padding: 16px 32px; background: #f9f9f9; text-align: center; color: #999999; font-size: 12px; border-top: 1px solid #eeeeee; }
    .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px 16px; border-radius: 4px; margin-top: 16px; font-size: 14px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header"><h1>JUNA</h1></div>
    <div class="body">${body}</div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Juna — Abonnements de nourriture<br/>
      Si vous n'êtes pas à l'origine de cette action, ignorez cet email.
    </div>
  </div>
</body>
</html>`;
}

// ─── Public methods ────────────────────────────────────────────────────────────

export async function sendVerificationCodeEmail(email: string, code: string) {
  const html = layout(
    'Votre code de vérification — Juna',
    `<h2>Vérifiez votre adresse email</h2>
    <p>Utilisez le code ci-dessous pour vérifier votre adresse email :</p>
    <div style="text-align:center;margin:32px 0;">
      <div style="display:inline-block;background:#f5f5f5;border:2px dashed #FF6B35;border-radius:12px;padding:20px 40px;">
        <span style="font-size:40px;font-weight:bold;letter-spacing:10px;color:#FF6B35;">${code}</span>
      </div>
    </div>
    <div class="warning">Ce code est valable <strong>10 minutes</strong> uniquement. Ne le partagez avec personne.</div>
    <p style="margin-top:24px;font-size:13px;color:#888;">Si vous n'avez pas demandé ce code, ignorez cet email.</p>`
  );
  await send({ email }, 'Votre code de vérification Juna', html);
}

export async function sendWelcomeEmail(email: string, name: string) {
  const html = layout(
    'Compte vérifié — Bienvenue sur Juna !',
    `<h2>Félicitations, ${name} !</h2>
    <p>Votre compte est maintenant <strong>vérifié et actif</strong>. Vous pouvez dès maintenant explorer nos abonnements repas et commander auprès de nos prestataires.</p>
    <a href="${APP_URL}" class="btn">Découvrir Juna</a>
    <p style="margin-top:24px;">Bon appétit ! 🍽️</p>`
  );
  await send({ email, name }, 'Bienvenue sur Juna — Votre compte est actif !', html);
}

export async function sendPasswordResetEmail(email: string, name: string, token: string) {
  const link = `${APP_URL}/auth/reset-password?token=${token}`;
  const html = layout(
    'Réinitialisation de mot de passe — Juna',
    `<h2>Réinitialisation de mot de passe</h2>
    <p>Bonjour <strong>${name}</strong>,</p>
    <p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe :</p>
    <a href="${link}" class="btn">Réinitialiser mon mot de passe</a>
    <div class="warning">Ce lien est valable <strong>1 heure</strong> uniquement.</div>
    <p style="margin-top:24px;font-size:13px;color:#888;">Si vous n'avez pas demandé cette réinitialisation, ignorez cet email — votre mot de passe ne sera pas modifié.</p>`
  );
  await send({ email, name }, 'Réinitialisation de votre mot de passe — Juna', html);
}

export async function sendOrderConfirmedEmail(
  email: string,
  name: string,
  order: { orderNumber: string; subscriptionName: string; amount: number; currency?: string }
) {
  const html = layout(
    'Commande confirmée — Juna',
    `<h2>Votre commande est confirmée !</h2>
    <p>Bonjour <strong>${name}</strong>,</p>
    <p>Votre paiement a bien été reçu. Voici le récapitulatif de votre commande :</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <tr><td style="padding:8px 0;color:#666;">Numéro de commande</td><td style="padding:8px 0;font-weight:bold;">${order.orderNumber}</td></tr>
      <tr><td style="padding:8px 0;color:#666;">Abonnement</td><td style="padding:8px 0;">${order.subscriptionName}</td></tr>
      <tr><td style="padding:8px 0;color:#666;">Montant payé</td><td style="padding:8px 0;font-weight:bold;color:#FF6B35;">${order.amount.toLocaleString('fr-FR')} ${order.currency ?? 'FCFA'}</td></tr>
    </table>
    <p>Pour activer votre abonnement et démarrer votre repas, rendez-vous dans l'application et activez votre commande.</p>
    <a href="${APP_URL}" class="btn">Voir ma commande</a>`
  );
  await send({ email, name }, `Commande confirmée #${order.orderNumber} — Juna`, html);
}

export async function sendProviderApprovedEmail(email: string, name: string, businessName: string) {
  const html = layout(
    'Demande prestataire approuvée — Juna',
    `<h2>Votre demande a été approuvée !</h2>
    <p>Bonjour <strong>${name}</strong>,</p>
    <p>Nous avons le plaisir de vous informer que votre demande pour enregistrer <strong>${businessName}</strong> en tant que prestataire sur Juna a été <strong>approuvée</strong>.</p>
    <p>Vous pouvez désormais :</p>
    <ul>
      <li>Créer et publier vos abonnements repas</li>
      <li>Gérer vos plats et menus</li>
      <li>Recevoir des commandes et des paiements</li>
    </ul>
    <a href="${APP_URL}" class="btn">Accéder à mon espace prestataire</a>
    <p style="margin-top:24px;">Bienvenue dans la famille Juna !</p>`
  );
  await send({ email, name }, 'Félicitations — Votre compte prestataire est approuvé !', html);
}

export async function sendProviderRejectedEmail(
  email: string,
  name: string,
  businessName: string,
  reason: string
) {
  const html = layout(
    'Demande prestataire non approuvée — Juna',
    `<h2>Mise à jour de votre demande</h2>
    <p>Bonjour <strong>${name}</strong>,</p>
    <p>Après examen, nous ne pouvons pas approuver votre demande pour <strong>${businessName}</strong> pour la raison suivante :</p>
    <div class="warning">${reason}</div>
    <p style="margin-top:24px;">Si vous pensez qu'il s'agit d'une erreur ou souhaitez soumettre une nouvelle demande avec des informations corrigées, n'hésitez pas à nous contacter ou à soumettre une nouvelle demande.</p>
    <p>Merci de votre compréhension.</p>`
  );
  await send({ email, name }, 'Mise à jour de votre demande prestataire — Juna', html);
}

export async function sendProviderNewOrderEmail(
  email: string,
  name: string,
  order: { orderNumber: string; subscriptionName: string; customerName: string }
) {
  const html = layout(
    'Nouvelle commande — Juna',
    `<h2>Vous avez une nouvelle commande !</h2>
    <p>Bonjour <strong>${name}</strong>,</p>
    <p>Une nouvelle commande vient d'être confirmée pour votre abonnement <strong>${order.subscriptionName}</strong>.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <tr><td style="padding:8px 0;color:#666;">Numéro de commande</td><td style="padding:8px 0;font-weight:bold;">${order.orderNumber}</td></tr>
      <tr><td style="padding:8px 0;color:#666;">Client</td><td style="padding:8px 0;">${order.customerName}</td></tr>
    </table>
    <p>Préparez-vous à accueillir votre client. Il activera sa commande depuis l'application.</p>`
  );
  await send({ email, name }, `Nouvelle commande #${order.orderNumber} — Juna`, html);
}
