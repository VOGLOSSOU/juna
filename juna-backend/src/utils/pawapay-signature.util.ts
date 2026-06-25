import { createSign, createVerify, createHash } from 'crypto';

const PRIVATE_KEY = (process.env.PAWAPAY_PRIVATE_KEY ?? '').replace(/\\n/g, '\n');
const KEY_ID = process.env.PAWAPAY_KEY_ID ?? 'juna-prod-1';
const BASE_URL = process.env.PAWAPAY_BASE_URL ?? 'https://api.pawapay.io';

/**
 * Construit les headers de signature pour une requête financière vers PawaPay (RFC-9421).
 */
export function buildSignedHeaders(method: string, path: string, body: object): Record<string, string> {
  const bodyStr = JSON.stringify(body);

  const bodyHash = createHash('sha512').update(bodyStr, 'utf8').digest('base64');
  const contentDigest = `sha-512=:${bodyHash}:`;
  const contentType = 'application/json';

  const now = new Date();
  const signatureDate = now.toISOString();
  const created = Math.floor(now.getTime() / 1000);
  const expires = created + 60;

  const authority = new URL(BASE_URL).hostname;
  const sigParams = `("@method" "@authority" "@path" "signature-date" "content-digest" "content-type");alg="ecdsa-p256-sha256";keyid="${KEY_ID}";created=${created};expires=${expires}`;

  const signatureBase = [
    `"@method": ${method.toUpperCase()}`,
    `"@authority": ${authority}`,
    `"@path": ${path}`,
    `"signature-date": ${signatureDate}`,
    `"content-digest": ${contentDigest}`,
    `"content-type": ${contentType}`,
    `"@signature-params": ${sigParams}`,
  ].join('\n');

  const signer = createSign('SHA256');
  signer.update(signatureBase, 'utf8');
  const signature = signer.sign(PRIVATE_KEY, 'base64');

  return {
    'Content-Type': contentType,
    'Content-Digest': contentDigest,
    'Signature-Date': signatureDate,
    'Signature-Input': `sig-pp=${sigParams}`,
    'Signature': `sig-pp=:${signature}:`,
  };
}

/**
 * Vérifie la signature d'un callback entrant de PawaPay (RFC-9421).
 */
export function verifyCallbackSignature(
  method: string,
  path: string,
  rawBody: string,
  headers: Record<string, string>,
  pawapayPublicKey: string
): boolean {
  const contentDigestHeader = headers['content-digest'];
  const signatureInputHeader = headers['signature-input'];
  const signatureHeader = headers['signature'];
  const signatureDate = headers['signature-date'];
  const contentType = (headers['content-type'] ?? 'application/json').split(';')[0].trim();
  const authority = headers['host'] ?? new URL(BASE_URL).hostname;

  if (!contentDigestHeader || !signatureInputHeader || !signatureHeader || !signatureDate) {
    return false;
  }

  // Vérifier le Content-Digest
  const algoMatch = contentDigestHeader.match(/^(sha-512|sha-256)=:/);
  if (!algoMatch) return false;
  const nodeAlgo = algoMatch[1] === 'sha-512' ? 'sha512' : 'sha256';
  const expectedHash = createHash(nodeAlgo).update(rawBody, 'utf8').digest('base64');
  const receivedHash = contentDigestHeader.replace(/^(sha-512|sha-256)=:/, '').replace(/:$/, '');
  if (expectedHash !== receivedHash) {
    console.warn('[PawaPay] Content-Digest invalide');
    return false;
  }

  // Extraire la valeur de la signature
  const sigMatch = signatureHeader.match(/sig-pp=:([^:]+):/);
  if (!sigMatch) return false;
  const sigValue = sigMatch[1];

  // Extraire les params de Signature-Input
  const sigInputMatch = signatureInputHeader.match(/sig-pp=(.*)/);
  if (!sigInputMatch) return false;
  const sigParams = sigInputMatch[1];

  // Reconstruire la base de signature
  const signatureBase = [
    `"@method": ${method.toUpperCase()}`,
    `"@authority": ${authority}`,
    `"@path": ${path}`,
    `"signature-date": ${signatureDate}`,
    `"content-digest": ${contentDigestHeader}`,
    `"content-type": ${contentType}`,
    `"@signature-params": ${sigParams}`,
  ].join('\n');

  try {
    const verifier = createVerify('SHA256');
    verifier.update(signatureBase, 'utf8');
    return verifier.verify(pawapayPublicKey, sigValue, 'base64');
  } catch {
    return false;
  }
}
