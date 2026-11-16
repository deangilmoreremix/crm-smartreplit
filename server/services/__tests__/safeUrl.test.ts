import { describe, it, expect } from 'vitest';
import { isPrivateAddress, isSafeExternalUrl } from '../safeUrl';

const resolvesTo = (...addresses: string[]) => async () => addresses;

describe('isPrivateAddress', () => {
  it('flags internal IPv4 ranges and the cloud metadata address', () => {
    for (const ip of ['127.0.0.1', '10.1.2.3', '172.16.0.1', '172.31.255.255', '192.168.1.1', '169.254.169.254', '100.64.0.1', '0.0.0.0', '224.0.0.1']) {
      expect(isPrivateAddress(ip), ip).toBe(true);
    }
  });

  it('flags internal IPv6 ranges, including IPv4-mapped private addresses', () => {
    for (const ip of ['::1', '::', 'fd00::1', 'fe80::1', '::ffff:127.0.0.1']) {
      expect(isPrivateAddress(ip), ip).toBe(true);
    }
  });

  it('allows public addresses', () => {
    for (const ip of ['8.8.8.8', '172.32.0.1', '2606:4700:4700::1111', '::ffff:8.8.8.8']) {
      expect(isPrivateAddress(ip), ip).toBe(false);
    }
  });
});

describe('isSafeExternalUrl', () => {
  it('accepts an https URL that resolves to public addresses', async () => {
    expect(await isSafeExternalUrl('https://api.example.com/v1', { resolve: resolvesTo('93.184.216.34') })).toBe(true);
  });

  it('rejects non-https, credentials and malformed URLs', async () => {
    const resolve = resolvesTo('93.184.216.34');
    expect(await isSafeExternalUrl('http://api.example.com', { resolve })).toBe(false);
    expect(await isSafeExternalUrl('https://user:pass@api.example.com', { resolve })).toBe(false);
    expect(await isSafeExternalUrl('not a url', { resolve })).toBe(false);
  });

  it('rejects local hostnames and private IP literals', async () => {
    const resolve = resolvesTo('93.184.216.34');
    for (const url of ['https://localhost', 'https://db.internal', 'https://printer.local', 'https://127.0.0.1', 'https://169.254.169.254/latest/meta-data', 'https://[::1]']) {
      expect(await isSafeExternalUrl(url, { resolve }), url).toBe(false);
    }
  });

  it('rejects a public-looking host that resolves to a private address', async () => {
    expect(await isSafeExternalUrl('https://evil.example.com', { resolve: resolvesTo('93.184.216.34', '10.0.0.5') })).toBe(false);
  });

  it('rejects when DNS fails or returns nothing', async () => {
    expect(await isSafeExternalUrl('https://nx.example.com', { resolve: async () => { throw new Error('ENOTFOUND'); } })).toBe(false);
    expect(await isSafeExternalUrl('https://empty.example.com', { resolve: resolvesTo() })).toBe(false);
  });

  it('enforces the host allowlist when one is set', async () => {
    const resolve = resolvesTo('93.184.216.34');
    expect(await isSafeExternalUrl('https://claw.example.com', { allowedHosts: ['claw.example.com'], resolve })).toBe(true);
    expect(await isSafeExternalUrl('https://other.example.com', { allowedHosts: ['claw.example.com'], resolve })).toBe(false);
  });
});
