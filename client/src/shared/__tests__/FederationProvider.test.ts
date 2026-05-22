// Tests for FederationProvider
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { 
  FederationProvider, 
  useFederation, 
  useFeatureFlags, 
  useSharedState 
} from '../federation/FederationProvider';

// Test component that uses federation context
function TestComponent() {
  const { featureFlags, sharedState, updateFeatureFlags, updateSharedState } = useFederation();
  
  return (
    <div>
      <span data-testid="enableAI">{featureFlags.enableAI.toString()}</span>
      <span data-testid="selectedContact">
        {sharedState.selectedContact?.name || 'none'}
      </span>
      <button 
        data-testid="toggleAI"
        onClick={() => updateFeatureFlags({ enableAI: !featureFlags.enableAI })}
      >
        Toggle AI
      </button>
      <button 
        data-testid="setContact"
        onClick={() => updateSharedState({ selectedContact: { id: '1', name: 'Test' } })}
      >
        Set Contact
      </button>
    </div>
  );
}

describe('FederationProvider', () => {
  it('provides default feature flags', () => {
    render(
      <FederationProvider>
        <TestComponent />
      </FederationProvider>
    );
    
    expect(screen.getByTestId('enableAI')).toHaveTextContent('true');
  });

  it('allows updating feature flags', () => {
    render(
      <FederationProvider>
        <TestComponent />
      </FederationProvider>
    );
    
    act(() => {
      screen.getByTestId('toggleAI').click();
    });
    
    expect(screen.getByTestId('enableAI')).toHaveTextContent('false');
  });

  it('allows setting shared state', () => {
    render(
      <FederationProvider>
        <TestComponent />
      </FederationProvider>
    );
    
    act(() => {
      screen.getByTestId('setContact').click();
    });
    
    expect(screen.getByTestId('selectedContact')).toHaveTextContent('Test');
  });

  it('throws error when used outside provider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useFederation must be used within FederationProvider');
    
    consoleError.mockRestore();
  });
});

describe('useFeatureFlags', () => {
  function FlagsComponent() {
    const flags = useFeatureFlags();
    return <span data-testid="scoring">{flags.enableScoring.toString()}</span>;
  }

  it('returns feature flags', () => {
    render(
      <FederationProvider>
        <FlagsComponent />
      </FederationProvider>
    );
    
    expect(screen.getByTestId('scoring')).toHaveTextContent('true');
  });
});

describe('useSharedState', () => {
  function StateComponent() {
    const state = useSharedState();
    return <span data-testid="tenant">{state.currentTenant || 'default'}</span>;
  }

  it('returns shared state', () => {
    render(
      <FederationProvider>
        <StateComponent />
      </FederationProvider>
    );
    
    expect(screen.getByTestId('tenant')).toHaveTextContent('default');
  });
});