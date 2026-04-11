import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const PII_REGEXES = {
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  phone: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
  address: /\d+\s+([a-zA-Z0-9\s,.]+)\s+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Court|Ct|Circle|Cir|Square|Sq)/gi,
  location: /(New York|London|Paris|Tokyo|Berlin|San Francisco|Los Angeles|Chicago|Seattle|Austin|Boston|Washington|Toronto|Sydney|Melbourne|Mumbai|Delhi|Shanghai|Beijing|Hong Kong|Singapore)/gi,
  name: /(Mr\.|Ms\.|Mrs\.|Dr\.)\s+[A-Z][a-z]+(\s+[A-Z][a-z]+)?/g
};

export function scrubPII(text: string): string {
  let scrubbed = text;
  scrubbed = scrubbed.replace(PII_REGEXES.email, "[EMAIL_REDACTED]");
  scrubbed = scrubbed.replace(PII_REGEXES.phone, "[PHONE_REDACTED]");
  scrubbed = scrubbed.replace(PII_REGEXES.address, "[ADDRESS_REDACTED]");
  scrubbed = scrubbed.replace(PII_REGEXES.location, "[LOCATION_REDACTED]");
  scrubbed = scrubbed.replace(PII_REGEXES.name, "[NAME_REDACTED]");
  return scrubbed;
}
