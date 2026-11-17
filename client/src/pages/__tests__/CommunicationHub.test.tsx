import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { readFileSync } from 'fs';
import { resolve } from 'path';

vi.mock('../../components/PageLayout', () => ({ default: ({ children }: any) => <div>{children}</div> }));
vi.mock('../VideoEmailDashboard', () => ({ default: () => <div /> }));
vi.mock('../PhoneSystemDashboard', () => ({ default: () => <div /> }));
vi.mock('../TextMessagingDashboard', () => ({ default: () => <div /> }));
vi.mock('../CircleProspectingDashboard', () => ({ default: () => <div /> }));
vi.mock('../InvoicingDashboard', () => ({ default: () => <div /> }));
vi.mock('../FormsSurveysDashboard', () => ({ default: () => <div /> }));
vi.mock('../../components/PersistentVideoCallButton', () => ({ default: () => <div /> }));

import CommunicationHub from '../CommunicationHub';

describe('CommunicationHub', () => {
  it('renders', () => {
    const { container } = render(<CommunicationHub />);
    expect(container).toBeTruthy();
  });

  it('takes message status from the send response and does not simulate delivery', () => {
    const src = readFileSync(resolve(__dirname, '../CommunicationHub.tsx'), 'utf8');
    expect(src).toContain('/api/messaging/send');
    expect(src).toContain('status: saved.status');
    expect(src).not.toContain('Simulate message delivery');
    expect(src).not.toMatch(/setTimeout/);
  });
});
