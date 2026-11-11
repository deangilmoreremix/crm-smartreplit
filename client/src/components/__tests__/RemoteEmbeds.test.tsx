import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';

vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({ isDark: false, toggleTheme: vi.fn() }),
}));

import RemoteWhiteLabelLoader, { GatedWhiteLabelSection } from '../RemoteWhiteLabelLoader';
import RemoteProductResearchLoader, { PRODUCT_RESEARCH_URL } from '../RemoteProductResearchLoader';
import { EntitlementContext } from '../../contexts/EntitlementContext';
import { buildRefreshUrl, remoteAppManager } from '../../utils/remoteAppManager';

const WL_ORIGIN = 'https://white-label.smartcrm.vip';

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

const advance = (ms: number) => act(() => void vi.advanceTimersByTime(ms));
const post = (origin: string, source: Window | null, data: unknown = { type: 'IFRAME_READY' }) =>
  act(() => {
    window.dispatchEvent(new MessageEvent('message', { origin, data, source }));
  });

describe('RemoteWhiteLabelLoader', () => {
  it('shows the fallback card with Retry / Open in new tab after the load timeout', () => {
    render(<RemoteWhiteLabelLoader />);
    expect(screen.queryByTestId('remote-embed-fallback')).toBeNull();
    advance(14_999);
    expect(screen.queryByTestId('remote-embed-fallback')).toBeNull();
    advance(2);
    expect(screen.getByTestId('remote-embed-fallback')).toBeTruthy();
    expect(screen.getByText('Retry')).toBeTruthy();
    const link = screen.getByText('Open in new tab') as HTMLAnchorElement;
    expect(link.href).toContain('white-label.smartcrm.vip');
    // Retry goes back to loading and remounts the iframe
    fireEvent.click(screen.getByText('Retry'));
    expect(screen.queryByTestId('remote-embed-fallback')).toBeNull();
  });

  it('honours VITE_REMOTE_LOAD_TIMEOUT_MS', () => {
    vi.stubEnv('VITE_REMOTE_LOAD_TIMEOUT_MS', '2000');
    render(<RemoteWhiteLabelLoader />);
    advance(2_001);
    expect(screen.getByTestId('remote-embed-fallback')).toBeTruthy();
  });

  it('load alone is not "Connected": it becomes "Loaded (not confirmed)" after the 3s handshake window', () => {
    const { container } = render(<RemoteWhiteLabelLoader />);
    fireEvent.load(container.querySelector('iframe')!);
    expect(screen.queryByText('Connected')).toBeNull();
    advance(3_100);
    expect(screen.getByText('Loaded (not confirmed)')).toBeTruthy();
    expect(screen.queryByTestId('remote-embed-fallback')).toBeNull();
  });

  it('a postMessage from the expected origin confirms the connection', () => {
    const { container } = render(<RemoteWhiteLabelLoader />);
    const iframe = container.querySelector('iframe')!;
    fireEvent.load(iframe);
    post(WL_ORIGIN, iframe.contentWindow);
    expect(screen.getByText('Connected')).toBeTruthy();
    advance(20_000);
    expect(screen.getByText('Connected')).toBeTruthy();
  });

  it('ignores messages from other origins', () => {
    const { container } = render(<RemoteWhiteLabelLoader />);
    const iframe = container.querySelector('iframe')!;
    fireEvent.load(iframe);
    post('https://evil.example', iframe.contentWindow);
    expect(screen.queryByText('Connected')).toBeNull();
  });

  it('does not auto-refresh and does not rewrite the iframe src over time', () => {
    const { container } = render(<RemoteWhiteLabelLoader />);
    const iframe = container.querySelector('iframe')!;
    const src = iframe.getAttribute('src');
    expect(src).toContain('theme=light');
    expect(remoteAppManager.getActiveRefreshCount()).toBe(0);
    fireEvent.load(iframe);
    post(WL_ORIGIN, iframe.contentWindow);
    advance(10 * 60_000);
    expect(container.querySelector('iframe')!.getAttribute('src')).toBe(src);
    expect(remoteAppManager.getActiveRefreshCount()).toBe(0);
  });
});

describe('GatedWhiteLabelSection', () => {
  const ctx = (entitlement: any, isLoading = false) =>
    ({ entitlement, isLoading }) as any;

  it('shows an upgrade card (no iframe) without the white label entitlement', () => {
    const { container } = render(
      <EntitlementContext.Provider value={ctx({ package: 'no_access' })}>
        <GatedWhiteLabelSection />
      </EntitlementContext.Provider>
    );
    expect(screen.getByText('Upgrade to unlock').getAttribute('href')).toBe('/upgrade');
    expect(container.querySelector('iframe')).toBeNull();
  });

  it('renders the embed for super admins', () => {
    const { container } = render(
      <EntitlementContext.Provider value={ctx({ package: 'super_admin' })}>
        <GatedWhiteLabelSection />
      </EntitlementContext.Provider>
    );
    expect(container.querySelector('iframe')).toBeTruthy();
  });

  it('does not flash the iframe while entitlements load', () => {
    const { container } = render(
      <EntitlementContext.Provider value={ctx(null, true)}>
        <GatedWhiteLabelSection />
      </EntitlementContext.Provider>
    );
    expect(container.querySelector('iframe')).toBeNull();
    expect(screen.queryByText('Upgrade to unlock')).toBeNull();
  });
});

describe('RemoteProductResearchLoader', () => {
  it('defaults to the existing URL (overridable via VITE_PRODUCT_RESEARCH_URL)', () => {
    expect(PRODUCT_RESEARCH_URL).toBe('https://product-research-mod-uay0.bolt.host/');
  });

  it('times out into the fallback card, and handshake marks it Connected', () => {
    const { container, unmount } = render(<RemoteProductResearchLoader showHeader />);
    advance(15_001);
    expect(screen.getByTestId('remote-embed-fallback')).toBeTruthy();
    unmount();

    const r = render(<RemoteProductResearchLoader showHeader />);
    const iframe = r.container.querySelector('iframe')!;
    fireEvent.load(iframe);
    expect(screen.getByText('Connecting...')).toBeTruthy();
    post('https://product-research-mod-uay0.bolt.host', iframe.contentWindow);
    expect(screen.getByText('Connected')).toBeTruthy();
    void container;
  });
});

describe('buildRefreshUrl', () => {
  it('preserves existing query params (e.g. theme) and replaces refresh params', () => {
    const u = new URL(
      buildRefreshUrl('https://white-label.smartcrm.vip/?theme=dark&mode=light&_refresh=1&_nocache=2', 99, 0.5)
    );
    expect(u.searchParams.get('theme')).toBe('dark');
    expect(u.searchParams.get('mode')).toBe('light');
    expect(u.searchParams.get('_refresh')).toBe('99');
    expect(u.searchParams.get('_nocache')).toBe('0.5');
    expect(u.searchParams.getAll('_refresh')).toHaveLength(1);
  });

  it('refreshIframe keeps ?theme=', () => {
    const el = document.createElement('iframe');
    el.id = 'x-frame';
    el.src = 'https://example.com/app?theme=dark';
    document.body.appendChild(el);
    remoteAppManager.refreshIframe('x-frame');
    expect(new URL(el.src).searchParams.get('theme')).toBe('dark');
    el.remove();
  });
});

describe('ModuleFederationAnalytics fallback', () => {
  it('uses the embedded iframe when MFE is disabled, then the card if it never loads', async () => {
    const { default: Analytics } = await import('../ModuleFederationAnalytics');
    const { container } = render(<Analytics />);
    const iframe = container.querySelector('iframe')!;
    expect(iframe.getAttribute('src')).toBe('https://ai-analytics.smartcrm.vip?embedded=true');
    advance(15_001);
    expect(screen.getByText('Analytics Module Unavailable')).toBeTruthy();
    expect(screen.getByText('Retry')).toBeTruthy();
    expect(screen.getByText('Open in new tab')).toBeTruthy();
  });
});
