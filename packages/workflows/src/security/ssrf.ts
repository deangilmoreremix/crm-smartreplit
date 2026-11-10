import { lookup as dnsLookup } from 'node:dns/promises';
import { isIP } from 'node:net';

/** True for loopback, private, link-local, CGNAT, multicast, unspecified and mapped-private addresses. */
export function isPrivateAddress(address: string): boolean {
  let ip = address.trim().toLowerCase().replace(/^\[|\]$/g, '');
  const zone = ip.indexOf('%');
  if (zone >= 0) ip = ip.slice(0, zone);

  // IPv4-mapped IPv6 (::ffff:a.b.c.d or ::ffff:7f00:1)
  const mapped = ip.match(/^::ffff:(.+)$/);
  if (mapped) {
    const rest = mapped[1];
    if (isIP(rest) === 4) return isPrivateAddress(rest);
    const hex = rest.match(/^([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
    if (hex) {
      const hi = parseInt(hex[1], 16);
      const lo = parseInt(hex[2], 16);
      return isPrivateAddress(`${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`);
    }
    return true;
  }

  if (isIP(ip) === 4) {
    const [a, b] = ip.split('.').map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 192 && b === 0) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224
    );
  }
  if (isIP(ip) === 6) {
    return (
      ip === '::' ||
      ip === '::1' ||
      /^fe[89ab]/.test(ip) ||
      /^f[cd]/.test(ip) ||
      /^ff/.test(ip) ||
      /^64:ff9b:/.test(ip)
    );
  }
  return false;
}

/**
 * Syntactic SSRF guard: https only, no localhost/internal names, no private IP literals.
 * Error messages are part of the public contract (tests assert on them).
 */
export function assertPublicHttps(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`Invalid webhook url: ${raw}`);
  }
  if (url.protocol !== 'https:') throw new Error('Webhook url must use https');
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.endsWith('.internal') ||
    host.endsWith('.local') ||
    isPrivateAddress(host)
  ) {
    throw new Error('Webhook url must not target a private or local address');
  }
  return url;
}

export type HostLookup = (host: string) => Promise<Array<{ address: string }>>;

const defaultLookup: HostLookup = (host) => dnsLookup(host, { all: true });

/** assertPublicHttps + resolve the hostname and reject if ANY address is private. */
export async function assertPublicResolved(
  raw: string,
  lookup: HostLookup = defaultLookup
): Promise<URL> {
  const url = assertPublicHttps(raw);
  const host = url.hostname.replace(/^\[|\]$/g, '');
  if (isIP(host)) return url;
  let addrs: Array<{ address: string }>;
  try {
    addrs = await lookup(host);
  } catch {
    throw new Error(`Could not resolve host ${host}`);
  }
  if (!addrs.length || addrs.some((a) => isPrivateAddress(a.address))) {
    throw new Error('Webhook url must not target a private or local address');
  }
  return url;
}
