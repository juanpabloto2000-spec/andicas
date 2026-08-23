import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const INTEGRITY_SECRET = process.env.WOMPI_INTEGRITY_SECRET || 'test_integrity_4gB4WJpQ5Z2g68P9VqL8x2y1t9r8e7w6';
const EVENTS_SECRET = process.env.WOMPI_EVENTS_SECRET || 'test_events_7xK9pL2wQ8mR4tY1vN6bX5zC3aJ9hG8f';
const PUBLIC_KEY = process.env.WOMPI_PUBLIC_KEY || 'pub_test_X0zDA9xoKdePqbStbqlRoyBgAngTXdhb';

/**
 * Genera la firma criptográfica SHA-256 de integridad para Wompi Web Checkout
 * Fórmula Wompi: SHA256(reference + amount_in_cents + currency + integrity_secret)
 */
export function generateWompiIntegritySignature(reference, amountInCents, currency = 'COP') {
  const rawString = `${reference}${amountInCents}${currency}${INTEGRITY_SECRET}`;
  return crypto.createHash('sha256').update(rawString, 'utf8').digest('hex');
}

/**
 * Valida la firma del evento Webhook enviado por Wompi
 * Wompi concatena las propiedades indicadas en event.signature.properties con el EVENTS_SECRET
 */
export function verifyWompiWebhookSignature(body) {
  try {
    if (!body || !body.signature || !body.signature.properties || !body.signature.checksum) {
      return false;
    }

    const { properties, checksum } = body.signature;
    const { data } = body;

    if (!data || !data.transaction) return false;

    // Concatenar las propiedades especificadas
    let concatenatedString = '';
    for (const propPath of properties) {
      const parts = propPath.split('.');
      let val = data;
      for (const p of parts) {
        val = val ? val[p] : undefined;
      }
      concatenatedString += val !== undefined ? String(val) : '';
    }

    const timestamp = body.timestamp || '';
    const stringToHash = `${concatenatedString}${timestamp}${EVENTS_SECRET}`;
    const calculatedChecksum = crypto.createHash('sha256').update(stringToHash, 'utf8').digest('hex');

    return calculatedChecksum === checksum;
  } catch (err) {
    console.error('Error al verificar firma Wompi Webhook:', err);
    return false;
  }
}

export function getWompiPublicKey() {
  return PUBLIC_KEY;
}
