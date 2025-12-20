import crypto from 'crypto';

/**
 * Générer un QR code unique pour une commande
 * Note: Pour l'instant on génère juste une chaîne unique
 * Plus tard, on pourra utiliser une lib comme 'qrcode' pour générer l'image
 */
export const generateQRCode = (orderId: string, userId: string): string => {
  const timestamp = Date.now();
  const data = `${orderId}-${userId}-${timestamp}`;
  
  // Générer un hash SHA256
  const hash = crypto.createHash('sha256').update(data).digest('hex');
  
  // Prendre les 32 premiers caractères
  return hash.substring(0, 32).toUpperCase();
};

/**
 * Vérifier si un QR code est valide (format)
 */
export const isValidQRCode = (qrCode: string): boolean => {
  // Le QR code doit être une chaîne de 32 caractères hexadécimaux
  const qrCodeRegex = /^[A-F0-9]{32}$/;
  return qrCodeRegex.test(qrCode);
};

/**
 * Générer l'URL du QR code
 * Note: En production, ceci pointera vers un service de génération d'image QR
 */
export const getQRCodeUrl = (qrCode: string): string => {
  // Pour l'instant, on retourne juste une URL fictive
  // Plus tard, on pourra utiliser un service comme quickchart.io ou générer l'image nous-mêmes
  return `https://api.juna.app/qr/${qrCode}.png`;
};