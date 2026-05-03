import { BrevoClient } from '@getbrevo/brevo';

const brevo = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY ?? '',
});

const SENDER = {
  name: process.env.BREVO_SENDER_NAME ?? 'Juna',
  email: process.env.BREVO_SENDER_EMAIL ?? 'noreply@juna.app',
};

const APP_URL = process.env.APP_URL ?? 'https://junaeats.com';
const LOGO_URL = 'https://junaeats.com/juna-logo.png';

// Palette
const C = {
  orange:    '#FF6B35',
  orangeDark:'#E85A25',
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
            <td align="center" style="background-color:${C.orange};padding:32px 40px;">
              <img src="${LOGO_URL}" alt="Juna" height="44" style="display:block;height:44px;width:auto;border:0;" />
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;color:${C.body};font-size:15px;line-height:1.7;">
              ${content}
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px;background-color:${C.border};"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:24px 40px;color:${C.muted};font-size:12px;line-height:1.6;">
              &copy; ${year} Juna &mdash; Abonnements de nourriture<br/>
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

function notice(icon: string, text: string, bg: string, borderColor: string) {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
    <tr>
      <td style="background-color:${bg};border-left:4px solid ${borderColor};border-radius:8px;padding:14px 16px;font-size:14px;color:${C.body};line-height:1.6;">
        <strong style="color:${C.navy};">${icon}&nbsp;&nbsp;</strong>${text}
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
  const digits = code.split('').map(d =>
    `<td style="width:44px;height:52px;text-align:center;vertical-align:middle;background-color:${C.bg};border:2px solid ${C.border};border-radius:10px;font-size:26px;font-weight:800;color:${C.orange};">${d}</td>
     <td style="width:8px;"></td>`
  ).join('');

  return `
  <table cellpadding="0" cellspacing="0" border="0" style="margin:28px auto;">
    <tr>${digits}</tr>
  </table>`;
}

// ─── Emails ───────────────────────────────────────────────────────────────────

export async function sendVerificationCodeEmail(email: string, code: string) {
  const html = layout('Votre code de vérification — Juna', `
    ${heading('Vérifiez votre adresse email')}
    ${paragraph('Entrez le code ci-dessous dans l\'application pour confirmer votre adresse email.')}
    ${otpBox(code)}
    ${notice('⏱', 'Ce code est valable <strong>10 minutes</strong>. Ne le partagez avec personne.', C.warnBg, C.warning)}
    <p style="margin:16px 0 0;color:${C.muted};font-size:13px;text-align:center;">Vous n'avez pas demandé ce code ? Ignorez cet email.</p>
  `);
  await send({ email }, 'Votre code de vérification Juna', html);
}

export async function sendWelcomeEmail(email: string, name: string) {
  const html = layout('Bienvenue sur Juna !', `
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
    ${button('Découvrir Juna', APP_URL)}
  `);
  await send({ email, name }, 'Bienvenue sur Juna — Votre compte est actif !', html);
}

export async function sendPasswordResetEmail(email: string, name: string, token: string) {
  const link = `${APP_URL}/auth/reset-password?token=${token}`;
  const html = layout('Réinitialisation de mot de passe — Juna', `
    ${heading('Réinitialisez votre mot de passe')}
    ${paragraph(`Bonjour <strong>${name}</strong>, nous avons reçu une demande de réinitialisation de mot de passe pour votre compte.`)}
    ${paragraph('Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe :')}
    ${button('Réinitialiser mon mot de passe', link)}
    ${notice('⏱', 'Ce lien est valable <strong>1 heure</strong> uniquement.', C.warnBg, C.warning)}
    <p style="margin:16px 0 0;color:${C.muted};font-size:13px;">Si vous n'avez pas demandé cette réinitialisation, ignorez cet email — votre mot de passe reste inchangé.</p>
    <p style="margin:12px 0 0;color:${C.muted};font-size:12px;word-break:break-all;">Lien : <a href="${link}" style="color:${C.orange};">${link}</a></p>
  `);
  await send({ email, name }, 'Réinitialisation de votre mot de passe — Juna', html);
}

export async function sendOrderConfirmedEmail(
  email: string,
  name: string,
  order: { orderNumber: string; subscriptionName: string; amount: number; currency?: string }
) {
  const html = layout('Commande confirmée — Juna', `
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
    ${button('Voir ma commande', APP_URL)}
  `);
  await send({ email, name }, `Commande confirmée #${order.orderNumber} — Juna`, html);
}

export async function sendProviderApprovedEmail(email: string, name: string, businessName: string) {
  const html = layout('Candidature approuvée — Juna', `
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
    ${button('Accéder à mon espace prestataire', APP_URL)}
    ${paragraph('Bienvenue dans la famille Juna !')}
  `);
  await send({ email, name }, 'Félicitations — Votre compte prestataire est approuvé !', html);
}

export async function sendProviderRejectedEmail(
  email: string,
  name: string,
  businessName: string,
  reason: string
) {
  const html = layout('Mise à jour de votre candidature — Juna', `
    ${heading('Mise à jour de votre candidature')}
    ${paragraph(`Bonjour <strong>${name}</strong>, après examen de votre dossier pour <strong>${businessName}</strong>, nous ne sommes pas en mesure de donner suite à votre candidature pour le motif suivant :`)}
    ${notice('📋', reason, C.warnBg, C.warning)}
    ${paragraph('Si vous pensez qu\'il s\'agit d\'une erreur ou si vous souhaitez soumettre une nouvelle candidature avec des informations corrigées, vous pouvez soumettre une nouvelle demande depuis l\'application.')}
    ${paragraph('Merci de votre compréhension.')}
  `);
  await send({ email, name }, 'Mise à jour de votre candidature prestataire — Juna', html);
}

export async function sendProviderNewOrderEmail(
  email: string,
  name: string,
  order: { orderNumber: string; subscriptionName: string; customerName: string }
) {
  const html = layout('Nouvelle commande — Juna', `
    ${heading('Vous avez une nouvelle commande ! 🍽️')}
    ${paragraph(`Bonjour <strong>${name}</strong>, une nouvelle commande vient d'être confirmée pour votre abonnement <strong>${order.subscriptionName}</strong>.`)}
    ${infoTable(
      infoRow('Numéro de commande', `#${order.orderNumber}`) +
      infoRow('Client', order.customerName)
    )}
    ${notice('ℹ️', 'Le client activera sa commande depuis l\'application. Vous recevrez sa confirmation au moment de l\'activation.', C.bg, C.border)}
  `);
  await send({ email, name }, `Nouvelle commande #${order.orderNumber} — Juna`, html);
}
