import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { readFileSync } from 'fs';
import { resolve } from 'path';

vi.mock('../../../services/geminiService', () => ({
  useGemini: () => ({ generateText: vi.fn(), generateContent: vi.fn() }),
}));

import RealTimeFormValidation from '../RealTimeFormValidation';

describe('RealTimeFormValidation', () => {
  it('shows validation errors on invalid submit and never alerts a fake success', async () => {
    const alertSpy = vi.fn();
    vi.stubGlobal('alert', alertSpy);
    const onDone = vi.fn();
    const { container } = render(<RealTimeFormValidation onValidationComplete={onDone} />);
    fireEvent.submit(container.querySelector('form')!);
    await waitFor(() => expect(onDone).toHaveBeenCalledWith(false));
    expect(alertSpy).not.toHaveBeenCalled();
    expect(screen.queryByText(/submitted successfully/i)).toBeNull();
  });

  it('source contains no simulated submission', () => {
    const src = readFileSync(resolve(__dirname, '../RealTimeFormValidation.tsx'), 'utf8');
    expect(src).not.toContain('Form submitted successfully');
    expect(src).not.toMatch(/alert\(/);
  });
});
