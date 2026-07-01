import { BrevoClient } from '@getbrevo/brevo';

const brevo = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY ?? '',
});

const SENDER = {
  name: process.env.BREVO_SENDER_NAME ?? 'Juna Eats',
  email: process.env.BREVO_SENDER_EMAIL ?? 'noreply@juna.app',
};

const APP_URL = process.env.APP_URL ?? 'https://junaeats.com';
const LOGO_URL = 'https://junaeats.com/juna-logo.png';

// Palette
const C = {
  orange:    '#F4521E',
  orangeDark:'#D4420E',
  navy:      '#1A1A2E',
  body:      '#52526C',
  muted:     '#9090A8',
  border:    '#E8E8F0',
  bg:        '#F0F2F5',
  white:     '#FFFFFF',
  success:   '#22C55E',
  warning:   '#F59E0B',
  warnBg:    '#FFFBEB',
};

async function send(to: { email: string; name?: string }, subject: string, htmlContent: string) {
  if (!process.env.BREVO_API_KEY) {
    console.warn('[email] BREVO_API_KEY not set - email skipped');
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

// ─── Layout ───────────────────────────────────────────────────────────────────

function layout(title: string, content: string) {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${title}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:${C.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${C.bg};min-height:100vh;">
    <tr>
      <td align="center" style="padding:40px 16px;">

        <!-- Card -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background-color:${C.white};border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td align="center" style="background-color:${C.white};padding:32px 40px 24px;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="vertical-align:middle;padding-right:12px;">
                    <img src="${LOGO_URL}" alt="Juna Eats" height="36" style="display:block;height:36px;width:auto;border:0;" />
                  </td>
                  <td style="vertical-align:middle;">
                    <span style="font-size:22px;font-weight:800;color:${C.orange};letter-spacing:1px;">JUNA EATS</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Header divider -->
          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px;background-color:${C.border};"></div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;color:${C.body};font-size:15px;line-height:1.7;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:24px 40px;color:${C.muted};font-size:12px;line-height:1.6;">
              &copy; ${year} <strong style="color:${C.navy};">Juna Eats</strong> - Abonnements de nourriture<br/>
              <span style="color:${C.border};">&#9679;</span>&nbsp;
              Si vous n'êtes pas à l'origine de cette action, ignorez simplement cet email.
            </td>
          </tr>

        </table>
        <!-- /Card -->

      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Composants réutilisables ─────────────────────────────────────────────────

function heading(text: string) {
  return `<h1 style="margin:0 0 16px;color:${C.navy};font-size:22px;font-weight:700;line-height:1.3;">${text}</h1>`;
}

function paragraph(text: string) {
  return `<p style="margin:0 0 16px;color:${C.body};font-size:15px;line-height:1.7;">${text}</p>`;
}

function button(text: string, href: string) {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
    <tr>
      <td align="center">
        <a href="${href}" target="_blank"
          style="display:inline-block;background-color:${C.orange};color:${C.white};text-decoration:none;font-size:15px;font-weight:600;padding:14px 36px;border-radius:10px;letter-spacing:0.3px;">
          ${text}
        </a>
      </td>
    </tr>
  </table>`;
}

function notice(icon: string, text: string) {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
    <tr>
      <td style="background-color:${C.bg};border-radius:10px;padding:16px 20px;font-size:14px;color:${C.body};line-height:1.7;">
        ${icon}&nbsp; ${text}
      </td>
    </tr>
  </table>`;
}

function infoRow(label: string, value: string, highlight = false) {
  return `
  <tr>
    <td style="padding:12px 16px;border-bottom:1px solid ${C.border};color:${C.muted};font-size:14px;width:45%;">${label}</td>
    <td style="padding:12px 16px;border-bottom:1px solid ${C.border};color:${highlight ? C.orange : C.navy};font-size:14px;font-weight:${highlight ? '700' : '600'};">${value}</td>
  </tr>`;
}

function infoTable(rows: string) {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" border="0"
    style="margin:20px 0;border:1px solid ${C.border};border-radius:10px;overflow:hidden;border-collapse:separate;border-spacing:0;">
    ${rows}
  </table>`;
}

function otpBox(code: string) {
  const spaced = code.split('').join('  ');
  return `
  <div style="margin:28px auto;text-align:center;">
    <span style="display:inline-block;background-color:${C.bg};border:2px solid ${C.border};border-radius:12px;padding:16px 28px;font-size:26px;font-weight:800;color:${C.orange};white-space:nowrap;font-family:monospace;">${spaced}</span>
  </div>`;
}

// ─── Emails ───────────────────────────────────────────────────────────────────

export async function sendVerificationCodeEmail(email: string, code: string) {
  const html = layout('Votre code de confirmation - Juna Eats', `
    ${heading('Voici votre code de confirmation')}
    ${paragraph('Entrez ce code dans l\'application Juna Eats pour valider votre adresse et continuer.')}
    ${otpBox(code)}
    ${notice('⏱', 'Ce code est valable <strong>10 minutes</strong>. Ne le partagez avec personne.')}
    <p style="margin:16px 0 0;color:${C.muted};font-size:13px;text-align:center;">Vous n'avez pas demandé ce code ? Ignorez cet email.</p>
  `);
  await send({ email }, 'Votre code de confirmation Juna Eats', html);
}

export async function sendWelcomeEmail(email: string, name: string) {
  const html = layout('Bienvenue sur Juna Eats !', `
    ${heading(`Bienvenue, ${name} ! 🎉`)}
    ${paragraph('Votre compte est maintenant <strong>actif et vérifié</strong>. Vous pouvez dès à présent explorer nos abonnements repas et passer commande auprès de nos prestataires.')}
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
      <tr>
        <td style="background-color:${C.bg};border-radius:10px;padding:20px 24px;">
          <p style="margin:0 0 8px;color:${C.navy};font-size:14px;font-weight:700;">Que faire maintenant ?</p>
          <p style="margin:4px 0;color:${C.body};font-size:14px;">✓&nbsp; Complétez votre profil en ajoutant votre ville</p>
          <p style="margin:4px 0;color:${C.body};font-size:14px;">✓&nbsp; Explorez les abonnements disponibles près de chez vous</p>
          <p style="margin:4px 0;color:${C.body};font-size:14px;">✓&nbsp; Passez votre première commande</p>
        </td>
      </tr>
    </table>
    ${paragraph('Ouvrez l\'application Juna Eats pour découvrir les abonnements disponibles près de chez vous.')}
  `);
  await send({ email, name }, 'Bienvenue sur Juna Eats - Votre compte est actif !', html);
}

export async function sendPasswordResetEmail(email: string, name: string, token: string) {
  const link = `${APP_URL}/auth/reset-password?token=${token}`;
  const html = layout('Réinitialisation de mot de passe - Juna Eats', `
    ${heading('Réinitialisez votre mot de passe')}
    ${paragraph(`Bonjour <strong>${name}</strong>, nous avons reçu une demande de réinitialisation de mot de passe pour votre compte.`)}
    ${paragraph('Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe :')}
    ${button('Réinitialiser mon mot de passe', link)}
    ${notice('⏱', 'Ce lien est valable <strong>1 heure</strong> uniquement.')}
    <p style="margin:16px 0 0;color:${C.muted};font-size:13px;">Si vous n'avez pas demandé cette réinitialisation, ignorez cet email - votre mot de passe reste inchangé.</p>
    <p style="margin:12px 0 0;color:${C.muted};font-size:12px;word-break:break-all;">Lien : <a href="${link}" style="color:${C.orange};">${link}</a></p>
  `);
  await send({ email, name }, 'Réinitialisation de votre mot de passe - Juna Eats', html);
}

export async function sendOrderConfirmedEmail(
  email: string,
  name: string,
  order: { orderNumber: string; subscriptionName: string; amount: number; currency?: string }
) {
  const html = layout('Commande confirmée - Juna Eats', `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
      <tr>
        <td align="center" style="background-color:#F0FDF4;border-radius:50%;width:56px;height:56px;padding:0;">
          <div style="width:56px;height:56px;background-color:#DCFCE7;border-radius:50%;text-align:center;line-height:56px;font-size:28px;">✅</div>
        </td>
      </tr>
    </table>
    ${heading('Commande confirmée !')}
    ${paragraph(`Bonjour <strong>${name}</strong>, votre paiement a bien été reçu. Voici le récapitulatif :`)}
    ${infoTable(
      infoRow('Numéro de commande', `#${order.orderNumber}`) +
      infoRow('Abonnement', order.subscriptionName) +
      infoRow('Montant payé', `${order.amount.toLocaleString('fr-FR')} ${order.currency ?? 'FCFA'}`, true)
    )}
    ${paragraph('Pour démarrer votre abonnement, activez votre commande depuis l\'application.')}
  `);
  await send({ email, name }, `Commande confirmée #${order.orderNumber} - Juna Eats`, html);
}

export async function sendProviderApprovedEmail(email: string, name: string, businessName: string) {
  const html = layout('Candidature approuvée - Juna Eats', `
    ${heading('Félicitations, vous êtes prestataire ! 🎊')}
    ${paragraph(`Bonjour <strong>${name}</strong>, nous avons le plaisir de vous annoncer que votre candidature pour <strong>${businessName}</strong> a été <strong style="color:${C.success};">approuvée</strong>.`)}
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
      <tr>
        <td style="background-color:${C.bg};border-radius:10px;padding:20px 24px;">
          <p style="margin:0 0 10px;color:${C.navy};font-size:14px;font-weight:700;">Vous pouvez maintenant :</p>
          <p style="margin:5px 0;color:${C.body};font-size:14px;">✓&nbsp; Créer et publier vos abonnements repas</p>
          <p style="margin:5px 0;color:${C.body};font-size:14px;">✓&nbsp; Gérer vos plats et menus</p>
          <p style="margin:5px 0;color:${C.body};font-size:14px;">✓&nbsp; Recevoir des commandes et des paiements</p>
        </td>
      </tr>
    </table>
    ${paragraph('Connectez-vous à l\'application Juna Eats pour accéder à votre espace prestataire.')}
    ${paragraph('Bienvenue dans la famille Juna Eats !')}
  `);
  await send({ email, name }, 'Félicitations - Votre compte prestataire est approuvé !', html);
}

export async function sendProviderRejectedEmail(
  email: string,
  name: string,
  businessName: string,
  reason: string
) {
  const html = layout('Mise à jour de votre candidature - Juna Eats', `
    ${heading('Mise à jour de votre candidature')}
    ${paragraph(`Bonjour <strong>${name}</strong>, après examen de votre dossier pour <strong>${businessName}</strong>, nous ne sommes pas en mesure de donner suite à votre candidature pour le motif suivant :`)}
    ${notice('📋', reason)}
    ${paragraph('Si vous pensez qu\'il s\'agit d\'une erreur ou si vous souhaitez soumettre une nouvelle candidature avec des informations corrigées, vous pouvez soumettre une nouvelle demande depuis l\'application.')}
    ${paragraph('Merci de votre compréhension.')}
  `);
  await send({ email, name }, 'Mise à jour de votre candidature prestataire - Juna Eats', html);
}

export async function sendPasswordChangedEmail(email: string, name: string) {
  const html = layout('Mot de passe modifié - Juna Eats', `
    ${heading('Votre mot de passe a été modifié')}
    ${paragraph(`Bonjour <strong>${name}</strong>, votre mot de passe Juna Eats vient d'être réinitialisé avec succès.`)}
    ${notice('🔒', 'Si vous êtes à l\'origine de cette action, vous pouvez ignorer ce message. Sinon, contactez-nous immédiatement.')}
  `);
  await send({ email, name }, 'Votre mot de passe Juna Eats a été modifié', html);
}

export async function sendProviderNewOrderEmail(
  email: string,
  name: string,
  order: { orderNumber: string; subscriptionName: string; customerName: string }
) {
  const html = layout('Nouvelle commande - Juna Eats', `
    ${heading('Vous avez une nouvelle commande ! 🍽️')}
    ${paragraph(`Bonjour <strong>${name}</strong>, une nouvelle commande vient d'être confirmée pour votre abonnement <strong>${order.subscriptionName}</strong>.`)}
    ${infoTable(
      infoRow('Numéro de commande', `#${order.orderNumber}`) +
      infoRow('Client', order.customerName)
    )}
    ${notice('ℹ️', 'Le client activera sa commande depuis l\'application. Vous recevrez sa confirmation au moment de l\'activation.')}
  `);
  await send({ email, name }, `Nouvelle commande #${order.orderNumber} - Juna Eats`, html);
}

// ─── Proposition d'abonnement ─────────────────────────────────────────────────

export async function sendProposalCreatedToConsumer(
  email: string,
  name: string,
  data: { providerName: string; mealsCount: number }
) {
  const html = layout('Proposition envoyée - Juna Eats', `
    ${heading('Votre proposition a bien été envoyée ✅')}
    ${paragraph(`Bonjour <strong>${name}</strong>, votre proposition d'abonnement personnalisé a bien été transmise à <strong>${data.providerName}</strong>.`)}
    ${infoTable(
      infoRow('Prestataire', data.providerName) +
      infoRow('Nombre de plats proposés', `${data.mealsCount}`)
    )}
    ${notice('⏳', 'Le prestataire va examiner votre demande et vous répondra prochainement. Vous serez notifié par email dès qu\'une décision est prise.')}
  `);
  await send({ email, name }, `Proposition envoyée à ${data.providerName} - Juna Eats`, html);
}

export async function sendProposalReceivedToProvider(
  email: string,
  name: string,
  data: { businessName: string; consumerName: string; mealsCount: number }
) {
  const html = layout('Nouvelle proposition reçue - Juna Eats', `
    ${heading('Vous avez reçu une nouvelle proposition ! 📬')}
    ${paragraph(`Bonjour <strong>${name}</strong>, <strong>${data.consumerName}</strong> vous a envoyé une proposition d'abonnement personnalisé à partir de votre catalogue.`)}
    ${infoTable(
      infoRow('Client', data.consumerName) +
      infoRow('Nombre de plats sélectionnés', `${data.mealsCount}`)
    )}
    ${button('Voir la proposition sur mon dashboard', `${APP_URL}/dashboard`)}
    ${notice('⏱', 'Le client attend votre réponse. Approuvez ou rejetez la proposition depuis votre dashboard.')}
  `);
  await send({ email, name }, `Nouvelle proposition d'abonnement de ${data.consumerName} - Juna Eats`, html);
}

export async function sendProposalApprovedToConsumer(
  email: string,
  name: string,
  data: {
    businessName: string;
    subscriptionName: string;
    price: number;
    isImmediate: boolean;
    preparationHours: number;
  }
) {
  const disponibilite = data.isImmediate
    ? 'Immédiate'
    : `Délai de ${data.preparationHours} heure${data.preparationHours > 1 ? 's' : ''} après commande`;

  const html = layout('Proposition acceptée - Juna Eats', `
    ${heading('Votre proposition a été acceptée 🎉')}
    ${paragraph(`Bonjour <strong>${name}</strong>, excellente nouvelle ! <strong>${data.businessName}</strong> a accepté votre proposition d'abonnement.`)}
    ${infoTable(
      infoRow('Prestataire', data.businessName) +
      infoRow('Abonnement créé', data.subscriptionName) +
      infoRow('Prix', `${data.price.toLocaleString('fr-FR')} FCFA`, true) +
      infoRow('Disponibilité', disponibilite)
    )}
    ${paragraph('L\'abonnement est maintenant disponible dans le catalogue. Ouvrez l\'application Juna Eats pour le retrouver et passer commande.')}
  `);
  await send({ email, name }, `Votre proposition a été acceptée par ${data.businessName} 🎉 - Juna Eats`, html);
}

export async function sendProposalApprovedToProvider(
  email: string,
  name: string,
  data: { businessName: string; consumerName: string; subscriptionName: string }
) {
  const html = layout('Proposition approuvée - Juna Eats', `
    ${heading('Confirmation d\'approbation ✅')}
    ${paragraph(`Bonjour <strong>${name}</strong>, vous avez approuvé la proposition d'abonnement de <strong>${data.consumerName}</strong>.`)}
    ${infoTable(
      infoRow('Client', data.consumerName) +
      infoRow('Abonnement publié', data.subscriptionName)
    )}
    ${notice('📢', `L'abonnement <strong>${data.subscriptionName}</strong> est maintenant visible dans le catalogue de <strong>${data.businessName}</strong> et ouvert à tous les clients.`)}
  `);
  await send({ email, name }, `Abonnement "${data.subscriptionName}" publié - Juna Eats`, html);
}

export async function sendProposalRejectedToConsumer(
  email: string,
  name: string,
  data: { businessName: string; rejectionReason: string }
) {
  const html = layout('Mise à jour de votre proposition - Juna Eats', `
    ${heading('Réponse à votre proposition')}
    ${paragraph(`Bonjour <strong>${name}</strong>, <strong>${data.businessName}</strong> a examiné votre proposition d'abonnement et n'est pas en mesure de la retenir pour le moment.`)}
    ${notice('📋', `Motif communiqué par le prestataire : <em>${data.rejectionReason}</em>`)}
    ${paragraph('Vous pouvez soumettre une nouvelle proposition à ce prestataire ou explorer d\'autres prestataires disponibles dans l\'application Juna Eats.')}
  `);
  await send({ email, name }, `Mise à jour de votre proposition chez ${data.businessName} - Juna Eats`, html);
}

export async function sendProposalRejectedToProvider(
  email: string,
  name: string,
  data: { businessName: string; consumerName: string }
) {
  const html = layout('Proposition rejetée - Juna Eats', `
    ${heading('Confirmation de rejet')}
    ${paragraph(`Bonjour <strong>${name}</strong>, vous avez rejeté la proposition d'abonnement de <strong>${data.consumerName}</strong>. Le client en a été informé par email.`)}
    ${notice('ℹ️', 'Si vous changez d\'avis, le client peut soumettre une nouvelle proposition depuis l\'application.')}
  `);
  await send({ email, name }, `Proposition de ${data.consumerName} rejetée - Juna Eats`, html);
}
