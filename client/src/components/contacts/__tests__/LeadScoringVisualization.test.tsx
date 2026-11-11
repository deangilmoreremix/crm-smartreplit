import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LeadScoringVisualization from '../LeadScoringVisualization';

describe('Lead Scoring Visualization Tests', () => {
  it('displays high score as a hot lead', () => {
    const { container } = render(<LeadScoringVisualization score={92} />);
    expect(screen.getByText('92')).toBeInTheDocument();
    expect(screen.getByText('Hot Lead')).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('text-green-600');
  });

  it('displays medium score as a warm lead', () => {
    const { container } = render(<LeadScoringVisualization score={65} />);
    expect(screen.getByText('65')).toBeInTheDocument();
    expect(screen.getByText('Warm Lead')).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('text-blue-600');
  });

  it('displays low score as a cold lead', () => {
    const { container } = render(<LeadScoringVisualization score={40} />);
    expect(screen.getByText('40')).toBeInTheDocument();
    expect(screen.getByText('Cold Lead')).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('text-yellow-600');
  });

  it('displays very low score as ice cold', () => {
    const { container } = render(<LeadScoringVisualization score={10} />);
    expect(screen.getByText('Ice Cold')).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('text-red-600');
  });

  it('uses score band boundaries correctly', () => {
    const { rerender } = render(<LeadScoringVisualization score={80} />);
    expect(screen.getByText('Hot Lead')).toBeInTheDocument();
    rerender(<LeadScoringVisualization score={79} />);
    expect(screen.getByText('Warm Lead')).toBeInTheDocument();
    rerender(<LeadScoringVisualization score={60} />);
    expect(screen.getByText('Warm Lead')).toBeInTheDocument();
    rerender(<LeadScoringVisualization score={59} />);
    expect(screen.getByText('Cold Lead')).toBeInTheDocument();
    rerender(<LeadScoringVisualization score={39} />);
    expect(screen.getByText('Ice Cold')).toBeInTheDocument();
  });

  it('prefers a custom label over the derived one', () => {
    render(<LeadScoringVisualization score={92} label="VIP" />);
    expect(screen.getByText('VIP')).toBeInTheDocument();
    expect(screen.queryByText('Hot Lead')).not.toBeInTheDocument();
  });

  it('can hide the label and the icon', () => {
    const { container } = render(
      <LeadScoringVisualization score={92} showLabel={false} showIcon={false} />
    );
    expect(screen.getByText('92')).toBeInTheDocument();
    expect(screen.queryByText('Hot Lead')).not.toBeInTheDocument();
    expect(container.querySelector('svg')).toBeNull();
  });

  it('applies size classes', () => {
    const { container, rerender } = render(<LeadScoringVisualization score={50} size="sm" />);
    expect(container.firstChild).toHaveClass('text-xs');
    rerender(<LeadScoringVisualization score={50} size="lg" />);
    expect(container.firstChild).toHaveClass('text-base');
  });

  it('updates when the score changes', () => {
    const { rerender } = render(<LeadScoringVisualization score={30} />);
    expect(screen.getByText('Ice Cold')).toBeInTheDocument();
    rerender(<LeadScoringVisualization score={90} />);
    expect(screen.getByText('Hot Lead')).toBeInTheDocument();
  });
});
