import { renderHook, act } from '@testing-library/react';
import { WhitelabelProvider, useWhitelabel } from '../contexts/WhitelabelContext';
import { DEFAULT_WHITELABEL_CONFIG } from '../types/whitelabel';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock URL
Object.defineProperty(window, 'location', {
  value: { search: '' },
  writable: true,
});

describe('WhitelabelContext', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();
  });

  it('should provide default config when no saved config exists', () => {
    localStorageMock.getItem.mockReturnValue(null);

    const { result } = renderHook(() => useWhitelabel(), {
      wrapper: WhitelabelProvider,
    });

    expect(result.current.config).toEqual(DEFAULT_WHITELABEL_CONFIG);
  });

  it('should load config from localStorage', () => {
    const savedConfig = { ...DEFAULT_WHITELABEL_CONFIG, companyName: 'Test Company' };
    localStorageMock.getItem.mockReturnValue(JSON.stringify(savedConfig));

    const { result } = renderHook(() => useWhitelabel(), {
      wrapper: WhitelabelProvider,
    });

    expect(result.current.config.companyName).toBe('Test Company');
  });

  it('should update config and save to localStorage', () => {
    localStorageMock.getItem.mockReturnValue(null);

    const { result } = renderHook(() => useWhitelabel(), {
      wrapper: WhitelabelProvider,
    });

    act(() => {
      result.current.updateConfig({ companyName: 'Updated Company' });
    });

    expect(result.current.config.companyName).toBe('Updated Company');
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'whitelabel_config',
      expect.stringContaining('"companyName":"Updated Company"')
    );
  });

  it('should reset to default config', () => {
    localStorageMock.getItem.mockReturnValue(null);

    const { result } = renderHook(() => useWhitelabel(), {
      wrapper: WhitelabelProvider,
    });

    act(() => {
      result.current.updateConfig({ companyName: 'Modified' });
    });

    act(() => {
      result.current.resetToDefault();
    });

    expect(result.current.config).toEqual(DEFAULT_WHITELABEL_CONFIG);
  });

  it('should export config as base64 string', () => {
    localStorageMock.getItem.mockReturnValue(null);

    const { result } = renderHook(() => useWhitelabel(), {
      wrapper: WhitelabelProvider,
    });

    const exported = result.current.exportConfig();
    expect(typeof exported).toBe('string');

    // Should be valid base64
    const decoded = JSON.parse(atob(exported));
    expect(decoded).toEqual(DEFAULT_WHITELABEL_CONFIG);
  });

  it('should import config from base64 string', () => {
    localStorageMock.getItem.mockReturnValue(null);

    const { result } = renderHook(() => useWhitelabel(), {
      wrapper: WhitelabelProvider,
    });

    const importData = { ...DEFAULT_WHITELABEL_CONFIG, companyName: 'Imported Company' };
    const importString = btoa(JSON.stringify(importData));

    act(() => {
      result.current.importConfig(importString);
    });

    expect(result.current.config.companyName).toBe('Imported Company');
  });

  it('should throw error on invalid import data', () => {
    localStorageMock.getItem.mockReturnValue(null);

    const { result } = renderHook(() => useWhitelabel(), {
      wrapper: WhitelabelProvider,
    });

    expect(() => {
      result.current.importConfig('invalid-json');
    }).toThrow('Invalid configuration format');
  });
});
