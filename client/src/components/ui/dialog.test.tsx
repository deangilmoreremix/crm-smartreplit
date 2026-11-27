import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { Dialog, DialogContent, DialogTitle } from './dialog';

describe('Dialog', () => {
  it('renders a single backdrop so buttons inside the dialog are not covered', () => {
    const onClick = vi.fn();
    render(
      <Dialog open onOpenChange={() => {}}>
        <DialogContent>
          <DialogTitle>Hello</DialogTitle>
          <button onClick={onClick}>Go</button>
        </DialogContent>
      </Dialog>
    );
    expect(document.body.querySelectorAll('.fixed.inset-0.z-50')).toHaveLength(1);
    fireEvent.click(screen.getByText('Go'));
    expect(onClick).toHaveBeenCalled();
  });

  it('renders nothing when closed', () => {
    render(
      <Dialog open={false} onOpenChange={() => {}}>
        <DialogContent>
          <DialogTitle>Hidden</DialogTitle>
        </DialogContent>
      </Dialog>
    );
    expect(document.body.querySelectorAll('.fixed.inset-0.z-50')).toHaveLength(0);
  });

  it('closes on Escape and on backdrop click, but not on clicks inside the dialog', () => {
    const onOpenChange = vi.fn();
    render(
      <Dialog open onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogTitle>Close me</DialogTitle>
          <button>Inside</button>
        </DialogContent>
      </Dialog>
    );
    fireEvent.mouseDown(screen.getByText('Inside'));
    expect(onOpenChange).not.toHaveBeenCalled();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onOpenChange).toHaveBeenCalledWith(false);
    onOpenChange.mockClear();
    fireEvent.mouseDown(document.body.querySelector('.fixed.inset-0.z-50')!);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
