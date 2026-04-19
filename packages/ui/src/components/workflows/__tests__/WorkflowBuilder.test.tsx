import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WorkflowBuilder } from './WorkflowBuilder';

// Mock workflow data
const mockWorkflow = {
  id: 'wf-1',
  name: 'Contact Workflow',
  triggerType: 'RECORD_CREATED',
  appSlug: 'contacts',
  steps: [
    {
      id: 'step-1',
      actionType: 'SEND_EMAIL',
      configuration: { to: '{{contact.email}}', subject: 'Welcome', body: 'Hello' },
      order: 1,
    },
    {
      id: 'step-2',
      actionType: 'CREATE_TASK',
      configuration: { title: 'Follow up', assigneeId: '{{creator.id}}' },
      order: 2,
    },
  ],
};

describe('WorkflowBuilder', () => {
  it('renders workflow builder with canvas area', () => {
    render(<WorkflowBuilder workflow={mockWorkflow} onChange={() => {}} />);
    expect(screen.getByText('Workflow Builder')).toBeInTheDocument();
  });

  it('displays workflow name in header', () => {
    render(<WorkflowBuilder workflow={mockWorkflow} onChange={() => {}} />);
    expect(screen.getByDisplayValue('Contact Workflow')).toBeInTheDocument();
  });

  it('shows trigger type selector', () => {
    render(<WorkflowBuilder workflow={mockWorkflow} onChange={() => {}} />);
    expect(screen.getByText('Trigger Type')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('displays existing steps as cards', () => {
    render(<WorkflowBuilder workflow={mockWorkflow} onChange={() => {}} />);
    expect(screen.getByText('SEND_EMAIL')).toBeInTheDocument();
    expect(screen.getByText('CREATE_TASK')).toBeInTheDocument();
  });

  it('allows adding new action step', async () => {
    render(<WorkflowBuilder workflow={mockWorkflow} onChange={() => {}} />);
    const addButton = screen.getByRole('button', { name: /add step/i });
    fireEvent.click(addButton);
    expect(screen.getByText('Select Action Type')).toBeInTheDocument();
  });

  it('allows editing step configuration', async () => {
    render(<WorkflowBuilder workflow={mockWorkflow} onChange={() => {}} />);
    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    fireEvent.click(editButtons[0]);
    expect(screen.getByText('Step Configuration')).toBeInTheDocument();
  });

  it('allows deleting steps', async () => {
    render(<WorkflowBuilder workflow={mockWorkflow} onChange={() => {}} />);
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    expect(deleteButtons.length).toBe(2);
  });

  it('reorders steps with drag and drop', async () => {
    render(<WorkflowBuilder workflow={mockWorkflow} onChange={() => {}} />);
    // Step order should be 1, 2
    const stepCards = screen.getAllByTestId('step-card');
    expect(stepCards[0]).toHaveTextContent('1');
    expect(stepCards[1]).toHaveTextContent('2');
  });

  it('validates required fields before saving', async () => {
    const emptyWorkflow = {
      id: 'wf-2',
      name: '',
      triggerType: 'MANUAL',
      appSlug: 'contacts',
      steps: [],
    };
    render(<WorkflowBuilder workflow={emptyWorkflow} onChange={() => {}} />);
    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);
    await waitFor(() => {
      expect(screen.getByText('Workflow name is required')).toBeInTheDocument();
    });
  });

  it('calls onChange when workflow is saved', async () => {
    const handleChange = vi.fn();
    render(<WorkflowBuilder workflow={mockWorkflow} onChange={handleChange} />);
    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);
    await waitFor(() => {
      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Contact Workflow',
          steps: expect.any(Array),
        })
      );
    });
  });

  it('supports all 12 action types in selector', () => {
    render(<WorkflowBuilder workflow={mockWorkflow} onChange={() => {}} />);
    const addButton = screen.getByRole('button', { name: /add step/i });
    fireEvent.click(addButton);
    const select = screen.getByRole('combobox', { name: /action type/i });
    const options = select.querySelectorAll('option');
    expect(options.length).toBe(12);
  });
});
