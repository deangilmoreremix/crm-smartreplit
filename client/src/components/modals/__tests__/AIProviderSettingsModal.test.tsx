import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../../aiIntegration/AIApiKeySettings', () => ({
  default: (props: any) =>
    props.open ? <button onClick={() => props.onOpenChange(false)}>close-dialog</button> : null,
}));

import AIProviderSettingsModal from '../AIProviderSettingsModal';

describe('AIProviderSettingsModal', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('delegates to the server-backed key dialog and never touches localStorage', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const onClose = vi.fn();
    render(<AIProviderSettingsModal isOpen onClose={onClose} />);
    screen.getByText('close-dialog').click();
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(setItem).not.toHaveBeenCalled();
    expect(localStorage.getItem('smartcrm_api_keys')).toBeNull();
  });

  it('renders nothing when closed', () => {
    render(<AIProviderSettingsModal isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByText('close-dialog')).toBeNull();
  });
});
