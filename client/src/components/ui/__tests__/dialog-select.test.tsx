import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Dialog, DialogContent, DialogTitle } from '../dialog';
import { Select, SelectTrigger, SelectValue } from '../select';

describe('Dialog', () => {
  it('renders a single overlay, so the content is not covered by a second blurred layer', () => {
    render(
      <Dialog open onOpenChange={() => {}}>
        <DialogContent>
          <DialogTitle>Create Campaign</DialogTitle>
        </DialogContent>
      </Dialog>
    );
    const overlays = document.body.querySelectorAll('.backdrop-blur-sm');
    expect(overlays).toHaveLength(1);
    expect(overlays[0]).toContainElement(screen.getByText('Create Campaign'));
    // nothing is stacked after the content's overlay
    expect(document.body.lastElementChild).toBe(overlays[0]);
  });

  it('renders nothing when closed', () => {
    render(
      <Dialog open={false}>
        <DialogContent>Hidden</DialogContent>
      </Dialog>
    );
    expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
  });
});

describe('SelectValue', () => {
  const renderValue = (value: string | undefined, children?: React.ReactNode) =>
    render(
      <Select value={value}>
        <SelectTrigger>
          <SelectValue placeholder="Choose one">{children}</SelectValue>
        </SelectTrigger>
      </Select>
    );

  it('shows the placeholder, then the raw value, when no label is given', () => {
    const { unmount } = renderValue(undefined);
    expect(screen.getByText('Choose one')).toBeInTheDocument();
    unmount();
    renderValue('nurture');
    expect(screen.getByText('nurture')).toBeInTheDocument();
  });

  it('shows a custom label instead of the raw value', () => {
    renderValue('1', 'Jane Doe — Acme');
    expect(screen.getByText('Jane Doe — Acme')).toBeInTheDocument();
    expect(screen.queryByText('1')).not.toBeInTheDocument();
  });
});
