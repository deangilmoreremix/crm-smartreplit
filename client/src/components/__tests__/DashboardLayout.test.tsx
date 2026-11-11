import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import React from 'react';

vi.mock('../../contexts/ThemeContext', () => ({ useTheme: () => ({ isDark: false }) }));
const authState = vi.hoisted(() => ({ user: null as null | { id: string } }));
vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: authState.user }) }));
vi.mock('../../lib/supabase', () => {
  const chain: any = {
    select: () => chain,
    eq: () => chain,
    maybeSingle: () => new Promise(() => {}), // never resolves: stays loading
    upsert: async () => ({ error: null }),
  };
  return { supabase: { from: () => chain } };
});

import {
  DashboardLayoutProvider,
  defaultSectionOrder,
  sectionConfigs,
  useDashboardLayout,
} from '../../contexts/DashboardLayoutContext';
import DashboardLayoutControls, { NON_RENDERING_SECTIONS } from '../DashboardLayoutControls';
import DraggableSection from '../DraggableSection';
import LayoutWidgetSettings from '../dashboard/LayoutWidgetSettings';

beforeEach(() => {
  localStorage.clear();
  authState.user = null;
});

const openPanel = () => fireEvent.click(screen.getByTitle('Dashboard Layout Settings'));

describe('DashboardLayoutControls', () => {
  it('lists every renderable section id (including ones missing from the old hard-coded list)', () => {
    render(
      <DashboardLayoutProvider>
        <DashboardLayoutControls />
      </DashboardLayoutProvider>
    );
    openPanel();
    for (const id of [
      'openclaw-chat-section',
      'white-label-section',
      'product-research-section',
      'ai-analytics-section',
      'charts-section',
      'unified-activity',
    ]) {
      expect(screen.getByLabelText(`Show ${sectionConfigs[id].title}`)).toBeTruthy();
    }
    for (const id of defaultSectionOrder) {
      expect(screen.getByLabelText(`Show ${sectionConfigs[id].title}`)).toBeTruthy();
    }
    // null-rendering sections stay out
    for (const id of NON_RENDERING_SECTIONS) {
      expect(screen.queryByLabelText(`Show ${sectionConfigs[id].title}`)).toBeNull();
    }
  });

  it('a hidden section can be re-shown from the panel (row button)', () => {
    const Probe = () => {
      const { isSectionVisible, toggleSection } = useDashboardLayout();
      return (
        <>
          <span data-testid="vis">{String(isSectionVisible('ai-analytics-section'))}</span>
          <button onClick={() => toggleSection('ai-analytics-section')}>hide-it</button>
        </>
      );
    };
    render(
      <DashboardLayoutProvider>
        <Probe />
        <DashboardLayoutControls />
      </DashboardLayoutProvider>
    );
    fireEvent.click(screen.getByText('hide-it'));
    expect(screen.getByTestId('vis').textContent).toBe('false');
    openPanel();
    const checkbox = screen.getByLabelText('Show AI Analytics Dashboard');
    const row = checkbox.closest('div[draggable]') as HTMLElement;
    fireEvent.click(within(row).getByTitle('Show Section'));
    expect(screen.getByTestId('vis').textContent).toBe('true');
  });

  it('sets drag data on dragstart (Firefox) and labels the preview toggle "Show order"', () => {
    render(
      <DashboardLayoutProvider>
        <DashboardLayoutControls />
      </DashboardLayoutProvider>
    );
    openPanel();
    expect(screen.getByText('Show order')).toBeTruthy();
    expect(screen.queryByText('Drag & Drop Mode')).toBeNull();
    const row = screen.getByLabelText('Show Automations').closest('div[draggable]') as HTMLElement;
    const setData = vi.fn();
    fireEvent.dragStart(row, { dataTransfer: { setData, effectAllowed: '' } });
    expect(setData).toHaveBeenCalledWith('text/plain', 'automations-section');
  });

  it('shows a skeleton while the Supabase copy loads', () => {
    authState.user = { id: 'u1' };
    render(
      <DashboardLayoutProvider>
        <DashboardLayoutControls />
      </DashboardLayoutProvider>
    );
    openPanel();
    expect(screen.getByTestId('layout-skeleton')).toBeTruthy();
    expect(screen.queryByLabelText('Show Automations')).toBeNull();
  });

  it('closes on Escape and on click outside', () => {
    render(
      <div>
        <button>outside</button>
        <DashboardLayoutProvider>
          <DashboardLayoutControls />
        </DashboardLayoutProvider>
      </div>
    );
    openPanel();
    expect(screen.getByText('Layout Settings')).toBeTruthy();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByText('Layout Settings')).toBeNull();
    openPanel();
    fireEvent.mouseDown(screen.getByText('outside'));
    expect(screen.queryByText('Layout Settings')).toBeNull();
  });

  it('Reset Layout asks to confirm, restores the built-in default and can clear widget settings', () => {
    const Probe = () => {
      const { sectionOrder, setSectionOrder, widgetSettings, setWidgetSettings } = useDashboardLayout();
      return (
        <>
          <span data-testid="first">{sectionOrder[0]}</span>
          <span data-testid="ws">{JSON.stringify(widgetSettings)}</span>
          <button onClick={() => setSectionOrder([...sectionOrder].reverse())}>reverse</button>
          <button onClick={() => setWidgetSettings('charts-section', { rangeDays: 7 })}>ws</button>
        </>
      );
    };
    render(
      <DashboardLayoutProvider>
        <Probe />
        <DashboardLayoutControls />
      </DashboardLayoutProvider>
    );
    fireEvent.click(screen.getByText('reverse'));
    fireEvent.click(screen.getByText('ws'));
    expect(screen.getByTestId('first').textContent).not.toBe(defaultSectionOrder[0]);
    openPanel();
    fireEvent.click(screen.getByText('Reset Layout'));
    // nothing changed yet
    expect(screen.getByTestId('first').textContent).not.toBe(defaultSectionOrder[0]);
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.getByTestId('first').textContent).not.toBe(defaultSectionOrder[0]);

    fireEvent.click(screen.getByText('Reset Layout'));
    fireEvent.click(screen.getByLabelText(/Also clear widget settings/));
    fireEvent.click(screen.getByText('Confirm reset'));
    expect(screen.getByTestId('first').textContent).toBe(defaultSectionOrder[0]);
    expect(screen.getByTestId('ws').textContent).toBe('{}');
  });
});

describe('DraggableSection', () => {
  const Order = () => {
    const { sectionOrder } = useDashboardLayout();
    return <span data-testid="order">{sectionOrder.join(',')}</span>;
  };
  const Seed = ({ ids }: { ids: string[] }) => {
    const { setSectionOrder, sectionOrder } = useDashboardLayout();
    React.useEffect(() => {
      setSectionOrder(ids);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return (
      <>
        {sectionOrder.map((id, i) => (
          <DraggableSection key={id} sectionId={id} index={i}>
            <input aria-label={`input-${id}`} />
          </DraggableSection>
        ))}
      </>
    );
  };

  it('only the handle is draggable, not the whole section', () => {
    render(
      <DashboardLayoutProvider>
        <Seed ids={['a-sec', 'b-sec']} />
      </DashboardLayoutProvider>
    );
    const handle = screen.getByTestId('drag-handle-a-sec');
    expect(handle.getAttribute('draggable')).toBe('true');
    const input = screen.getByLabelText('input-a-sec');
    expect(input.closest('[draggable="true"]')).toBeNull();
  });

  it('handle dragstart sets data and the section container as drag image', () => {
    render(
      <DashboardLayoutProvider>
        <Seed ids={['a-sec', 'b-sec']} />
      </DashboardLayoutProvider>
    );
    const setData = vi.fn();
    const setDragImage = vi.fn();
    fireEvent.dragStart(screen.getByTestId('drag-handle-a-sec'), {
      dataTransfer: { setData, setDragImage, effectAllowed: '' },
    });
    expect(setData).toHaveBeenCalledWith('text/plain', 'a-sec');
    expect(setDragImage).toHaveBeenCalled();
    const container = setDragImage.mock.calls[0][0] as HTMLElement;
    expect(container.contains(screen.getByLabelText('input-a-sec'))).toBe(true);
  });

  it('keyboard-accessible move up/down buttons reorder sections', () => {
    render(
      <DashboardLayoutProvider>
        <Order />
        <Seed ids={['a-sec', 'b-sec', 'c-sec']} />
      </DashboardLayoutProvider>
    );
    expect(screen.getByTestId('order').textContent).toBe('a-sec,b-sec,c-sec');
    expect((screen.getByLabelText('Move a-sec up') as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByLabelText('Move b-sec up'));
    expect(screen.getByTestId('order').textContent).toBe('b-sec,a-sec,c-sec');
    fireEvent.click(screen.getByLabelText('Move b-sec down'));
    fireEvent.click(screen.getByLabelText('Move b-sec down'));
    expect(screen.getByTestId('order').textContent).toBe('a-sec,c-sec,b-sec');
    expect((screen.getByLabelText('Move b-sec down') as HTMLButtonElement).disabled).toBe(true);
  });
});

describe('LayoutWidgetSettings popover', () => {
  it('closes on Escape and click outside', () => {
    render(
      <DashboardLayoutProvider>
        <button>outside</button>
        <LayoutWidgetSettings sectionId="charts-section" />
      </DashboardLayoutProvider>
    );
    fireEvent.click(screen.getByLabelText('Widget settings'));
    expect(screen.getByText('Date range')).toBeTruthy();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByText('Date range')).toBeNull();
    fireEvent.click(screen.getByLabelText('Widget settings'));
    fireEvent.mouseDown(screen.getByText('outside'));
    expect(screen.queryByText('Date range')).toBeNull();
  });
});
