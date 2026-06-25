import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { verifyCallbackSignature } from '@/utils/pawapay-signature.util';

let cachedPublicKey: string | null = null;

async function fetchPawaPayPublicKey(): Promise<string | null> {
  if (cachedPublicKey) return cachedPublicKey;

  const baseURL = process.env.PAWAPAY_BASE_URL ?? 'https://api.pawapay.io';
  const token = process.env.PAWAPAY_API_TOKEN ?? '';

  try {
    const { data } = await axios.get(`${baseURL}/public-keys`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 10000,
    });
    // La réponse peut être un tableau ou un objet selon la version de l'API
    const entry = Array.isArray(data) ? data[0] : data;
    const key = entry?.key ?? entry?.publicKey ?? (typeof entry === 'string' ? entry : null);
    if (key) {
      cachedPublicKey = key;
      console.log('[PawaPay] Clé publique récupérée et mise en cache');
    }
    return key ?? null;
  } catch (err: any) {
    console.error('[PawaPay] Impossible de récupérer la clé publique:', err?.message);
    return null;
  }
}

export async function verifyPawaPaySignature(req: Request, res: Response, next: NextFunction) {
  const signatureHeader = req.headers['signature'] as string;
  const signatureInput = req.headers['signature-input'] as string;

  if (!signatureHeader || !signatureInput) {
    console.warn('[PawaPay] Webhook reçu sans signature — rejeté');
    return res.status(401).json({ message: 'Signature manquante' });
  }

  const publicKey = await fetchPawaPayPublicKey();
  if (!publicKey) {
    console.warn('[PawaPay] Clé publique indisponible — webhook accepté avec warning');
    return next();
  }

  const rawBody = (req as any).rawBody ?? JSON.stringify(req.body);
  const headers = Object.fromEntries(
    Object.entries(req.headers).map(([k, v]) => [k, Array.isArray(v) ? v[0]! : (v ?? '')])
  );

  const isValid = verifyCallbackSignature(req.method, req.path, rawBody, headers, publicKey);

  if (!isValid) {
    console.warn('[PawaPay] Signature invalide sur webhook — rejeté');
    return res.status(401).json({ message: 'Signature invalide' });
  }

  next();
}
