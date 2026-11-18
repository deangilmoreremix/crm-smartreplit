/**
 * Guards server-side requests to user-supplied URLs (SSRF protection).
 * A URL is allowed only if it is https, its host is not a local/internal name, every address it resolves
 * to is public, and (when an allowlist is configured) its host is on the allowlist.
 */
import { lookup } from 'dns/promises';
import { isIP } from 'net';

/** True for loopback, private, link-local, CGNAT, multicast, reserved and cloud-metadata addresses. */
export function isPrivateAddress(address: string): boolean {
  const ip = address.toLowerCase().replace(/^\[|\]$/g, '');

  if (isIP(ip) === 4) {
    const [a, b] = ip.split('.').map(Number);
    return (
      a === 0 || // "this" network
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) || // CGNAT
      (a === 169 && b === 254) || // link-local incl. 169.254.169.254 metadata
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 192 && b === 0) ||
      (a === 198 && (b === 18 || b === 19)) || // benchmarking
      a >= 224 // multicast and reserved
    );
  }

  if (isIP(ip) === 6) {
    if (ip === '::' || ip === '::1') return true;
    const mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateAddress(mapped[1]);
    return (
      ip.startsWith('fc') ||
      ip.startsWith('fd') || // unique local
      /^fe[89ab]/.test(ip) || // link-local
      ip.startsWith('ff') // multicast
    );
  }

  return true; // not an IP address: treat as unsafe
}

const BLOCKED_HOSTNAMES = ['localhost', 'metadata.google.internal'];
const BLOCKED_SUFFIXES = ['.localhost', '.local', '.internal', '.lan', '.home'];

export interface SafeUrlOptions {
  /** If non-empty, the URL's host must be one of these (exact, case-insensitive). */
  allowedHosts?: string[];
  /** DNS resolver, injectable for tests. */
  resolve?: (host: string) => Promise<string[]>;
}

const defaultResolve = async (host: string) =>
  (await lookup(host, { all: true, verbatim: true })).map((r) => r.address);

/** Resolve whether a user-supplied URL is safe for the server to call. */
export async function isSafeExternalUrl(rawUrl: string, options: SafeUrlOptions = {}): Promise<boolean> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:' || url.username || url.password) return false;

  const host = url.hostname.toLowerCase().replace(/\.$/, '');
  if (!host || BLOCKED_HOSTNAMES.includes(host) || BLOCKED_SUFFIXES.some((s) => host.endsWith(s))) {
    return false;
  }

  const allowed = (options.allowedHosts || []).map((h) => h.trim().toLowerCase()).filter(Boolean);
  if (allowed.length > 0 && !allowed.includes(host)) return false;

  if (isIP(host.replace(/^\[|\]$/g, ''))) return !isPrivateAddress(host);

  try {
    const addresses = await (options.resolve || defaultResolve)(host);
    return addresses.length > 0 && addresses.every((a) => !isPrivateAddress(a));
  } catch {
    return false;
  }
}
