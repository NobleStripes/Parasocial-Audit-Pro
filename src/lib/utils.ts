import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const PII_REGEXES = {
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  phone: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
  address: /\d+\s+([a-zA-Z0-9\s,.]+)\s+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Court|Ct|Circle|Cir|Square|Sq)/gi,
  location: /(New York|London|Paris|Tokyo|Berlin|San Francisco|Los Angeles|Chicago|Seattle|Austin|Boston|Washington|Toronto|Sydney|Melbourne|Mumbai|Delhi|Shanghai|Beijing|Hong Kong|Singapore|Dubai|Seoul|Bangkok|Istanbul|Rome|Madrid|Amsterdam|Vienna|Prague|Warsaw|Budapest|Athens|Lisbon|Dublin|Brussels|Stockholm|Oslo|Copenhagen|Helsinki|Moscow|Cairo|Johannesburg|Nairobi|Lagos|Mexico City|Sao Paulo|Buenos Aires|Santiago|Lima|Bogota|Caracas)/gi,
  name: /(Mr\.|Ms\.|Mrs\.|Dr\.|Prof\.|Hon\.)\s+[A-Z][a-z]+(\s+[A-Z][a-z]+)?/g,
  creditCard: /\b(?:\d[ -]*?){13,16}\b/g,
  ipAddress: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
  username: /@([a-zA-Z0-9_]{1,15})/g
};

export const PII_WARNING = "[SYSTEM_WARNING: Automated PII scrubbing is incomplete. Human review is required for full de-identification.]";

export function scrubPII(text: string): string {
  let scrubbed = text;
  scrubbed = scrubbed.replace(PII_REGEXES.email, "[EMAIL_REDACTED]");
  scrubbed = scrubbed.replace(PII_REGEXES.phone, "[PHONE_REDACTED]");
  scrubbed = scrubbed.replace(PII_REGEXES.address, "[ADDRESS_REDACTED]");
  scrubbed = scrubbed.replace(PII_REGEXES.location, "[LOCATION_REDACTED]");
  scrubbed = scrubbed.replace(PII_REGEXES.name, "[NAME_REDACTED]");
  scrubbed = scrubbed.replace(PII_REGEXES.creditCard, "[FINANCIAL_REDACTED]");
  scrubbed = scrubbed.replace(PII_REGEXES.ipAddress, "[NETWORK_REDACTED]");
  scrubbed = scrubbed.replace(PII_REGEXES.username, "[USERNAME_REDACTED]");
  
  return scrubbed + "\n\n" + PII_WARNING;
}

export async function generateSessionHash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataUint8 = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}
