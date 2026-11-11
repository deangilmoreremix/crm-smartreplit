import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';

const remote = vi.hoisted(() => ({
  value: { component: null as any, loading: true, error: null as any },
}));
const pipelineProps = vi.hoisted(() => ({ last: null as any }));

vi.mock('../utils/dynamicModuleFederation', () => ({
  useRemoteComponent: () => remote.value,
}));
vi.mock('../utils/moduleFederationOrchestrator', () => ({
  moduleFederationOrchestrator: {},
  useSharedModuleState: (sel: any) => sel({ sharedData: { shared: true } }),
}));
vi.mock('../store/dealStore', () => ({
  useDealStore: (sel: any) =>
    sel({ realDeals: [{ id: 'real-1' }], deals: [{ id: 'real-1' }, { id: 'demo-1' }] }),
}));

describe('Module Federation components hook order', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('VITE_ENABLE_MFE', 'true');
    remote.value = { component: null, loading: true, error: null };
  });

  it('Analytics: loading -> loaded does not throw', async () => {
    const { default: Analytics } = await import('./ModuleFederationAnalytics');
    const { rerender } = render(<Analytics />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    remote.value = { component: () => <div>Remote analytics</div>, loading: false, error: null };
    rerender(<Analytics />);
    expect(screen.getByText('Remote analytics')).toBeInTheDocument();
  });

  it('Analytics: error falls back to the iframe, then Retry and Open in new tab if it never loads', async () => {
    vi.useFakeTimers();
    try {
      remote.value = { component: null, loading: false, error: new Error('x') };
      const { default: Analytics } = await import('./ModuleFederationAnalytics');
      render(<Analytics />);
      expect(screen.getByTitle('Remote AI Analytics')).toBeInTheDocument();
      act(() => {
        vi.advanceTimersByTime(15_001);
      });
      expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Open in new tab' })).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('Pipeline: loading -> loaded does not throw and passes real deals only', async () => {
    const { default: Pipeline } = await import('./ModuleFederationPipeline');
    const Remote = (props: any) => {
      pipelineProps.last = props;
      return <div>Remote pipeline</div>;
    };
    const { rerender } = render(<Pipeline />);
    remote.value = { component: Remote, loading: false, error: null };
    rerender(<Pipeline />);
    expect(screen.getByText('Remote pipeline')).toBeInTheDocument();
    expect(pipelineProps.last.deals).toEqual([{ id: 'real-1' }]);
  });
});
