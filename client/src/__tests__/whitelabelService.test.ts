import { describe, it, expect, vi, beforeEach } from 'vitest';

const rpc = vi.fn();
const from = vi.fn();
const getSession = vi.fn();
const invoke = vi.fn();

vi.mock('../lib/supabase', () => ({
  supabase: { rpc: (...a: unknown[]) => rpc(...a), from: (...a: unknown[]) => from(...a), auth: { getSession: () => getSession() }, functions: { invoke: (...a: unknown[]) => invoke(...a) } },
}));

import {
  fetchBrandingForHost,
  fetchOwnBranding,
  saveOwnBranding,
  requestDomain,
  verifyDomain,
  removeDomain,
  isOwnHost,
} from '../services/whitelabelService';

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('isOwnHost', () => {
  it('recognises built-in hosts', () => {
    expect(isOwnHost('app.smartcrm.vip')).toBe(true);
    expect(isOwnHost('localhost')).toBe(true);
    expect(isOwnHost('crm.acme.com')).toBe(false);
  });
});

describe('fetchBrandingForHost', () => {
  it('skips the RPC for own hosts', async () => {
    expect(await fetchBrandingForHost('app.smartcrm.vip')).toBeNull();
    expect(rpc).not.toHaveBeenCalled();
  });
  it('lower-cases and returns branding for custom hosts', async () => {
    rpc.mockResolvedValue({ data: { companyName: 'Acme' }, error: null });
    expect(await fetchBrandingForHost('CRM.Acme.com')).toEqual({ companyName: 'Acme' });
    expect(rpc).toHaveBeenCalledWith('get_branding_for_host', { p_host: 'crm.acme.com' });
  });
  it('returns null on error or empty data', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'boom' } });
    expect(await fetchBrandingForHost('crm.acme.com')).toBeNull();
    rpc.mockResolvedValue({ data: null, error: null });
    expect(await fetchBrandingForHost('crm.acme.com')).toBeNull();
  });
});

describe('own branding', () => {
  it('returns null / false when signed out', async () => {
    getSession.mockResolvedValue({ data: { session: null } });
    expect(await fetchOwnBranding()).toBeNull();
    expect(await saveOwnBranding({} as never)).toBe(false);
    expect(from).not.toHaveBeenCalled();
  });
  it('loads config for the signed-in owner', async () => {
    getSession.mockResolvedValue({ data: { session: { user: { id: 'u1' } } } });
    const eq = vi.fn().mockReturnValue({ maybeSingle: () => Promise.resolve({ data: { config: { companyName: 'X' } }, error: null }) });
    from.mockReturnValue({ select: () => ({ eq }) });
    expect(await fetchOwnBranding()).toEqual({ companyName: 'X' });
    expect(eq).toHaveBeenCalledWith('owner_id', 'u1');
  });
  it('upserts on owner_id', async () => {
    getSession.mockResolvedValue({ data: { session: { user: { id: 'u1' } } } });
    const upsert = vi.fn().mockResolvedValue({ error: null });
    from.mockReturnValue({ upsert });
    expect(await saveOwnBranding({ companyName: 'X' } as never)).toBe(true);
    expect(upsert).toHaveBeenCalledWith({ owner_id: 'u1', config: { companyName: 'X' } }, { onConflict: 'owner_id' });
  });
});

describe('domains', () => {
  it('maps RPC error codes to readable messages', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'invalid_hostname' } });
    await expect(requestDomain('nope')).rejects.toThrow(/valid hostname/);
  });
  it('returns the created row', async () => {
    rpc.mockResolvedValue({ data: { id: 'd1' }, error: null });
    expect(await requestDomain('crm.acme.com')).toEqual({ id: 'd1' });
    expect(rpc).toHaveBeenCalledWith('request_domain', { p_domain: 'crm.acme.com' });
  });
  it('invokes verify-domain with the domain id', async () => {
    invoke.mockResolvedValue({ data: { verified: true, domain: { id: 'd1' } }, error: null });
    expect((await verifyDomain('d1')).verified).toBe(true);
    expect(invoke).toHaveBeenCalledWith('verify-domain', { body: { domain_id: 'd1' } });
  });
  it('throws when removal fails', async () => {
    from.mockReturnValue({ delete: () => ({ eq: () => Promise.resolve({ error: { message: 'denied' } }) }) });
    await expect(removeDomain('d1')).rejects.toThrow('denied');
  });
});
