import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { ChatbotProvider, useChatbot } from '../contexts/ChatbotContext';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('ChatbotContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with welcome message', () => {
    const { result } = renderHook(() => useChatbot(), {
      wrapper: ChatbotProvider
    });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].text).toContain('Welcome');
    expect(result.current.messages[0].isUser).toBe(false);
  });

  it('should send user message and receive bot response', async () => {
    const { result } = renderHook(() => useChatbot(), {
      wrapper: ChatbotProvider
    });

    await act(async () => {
      await result.current.sendMessage('How do contacts work?');
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0].text).toBe('How do contacts work?');
    expect(result.current.messages[0].isUser).toBe(true);
    expect(result.current.messages[1].isUser).toBe(false);
    expect(result.current.messages[1].text).toContain('Contacts are your customer database');
  });

  it('should handle contact-related questions', async () => {
    const { result } = renderHook(() => useChatbot(), {
      wrapper: ChatbotProvider
    });

    // Test "add contact" question
    await act(async () => {
      await result.current.sendMessage('How do I add a contact?');
    });

    expect(result.current.messages[1].text).toContain('To add a contact:');
    expect(result.current.messages[1].text).toContain('1. Tap the Contacts tab');
    expect(result.current.messages[1].text).toContain('2. Press the + button');
  });

  it('should handle deal-related questions', async () => {
    const { result } = renderHook(() => useChatbot(), {
      wrapper: ChatbotProvider
    });

    // Test deal creation question
    await act(async () => {
      await result.current.sendMessage('How to create a deal?');
    });

    expect(result.current.messages[1].text).toContain('To create a deal:');
    expect(result.current.messages[1].text).toContain('1. Go to Deals tab');
    expect(result.current.messages[1].text).toContain('2. Tap + button');
  });

  it('should handle dashboard questions', async () => {
    const { result } = renderHook(() => useChatbot(), {
      wrapper: ChatbotProvider
    });

    await act(async () => {
      await result.current.sendMessage('What is the dashboard?');
    });

    expect(result.current.messages[1].text).toContain('The Dashboard shows your key metrics');
    expect(result.current.messages[1].text).toContain('Overview cards show key metrics');
  });

  it('should handle settings questions', async () => {
    const { result } = renderHook(() => useChatbot(), {
      wrapper: ChatbotProvider
    });

    await act(async () => {
      await result.current.sendMessage('How to change theme?');
    });

    expect(result.current.messages[1].text).toContain('To change theme:');
    expect(result.current.messages[1].text).toContain('Go to Settings tab');
  });

  it('should handle authentication questions', async () => {
    const { result } = renderHook(() => useChatbot(), {
      wrapper: ChatbotProvider
    });

    await act(async () => {
      await result.current.sendMessage('How do I sign in?');
    });

    expect(result.current.messages[1].text).toContain('To sign in:');
    expect(result.current.messages[1].text).toContain('Enter your email address');
  });

  it('should handle general help questions', async () => {
    const { result } = renderHook(() => useChatbot(), {
      wrapper: ChatbotProvider
    });

    await act(async () => {
      await result.current.sendMessage('What can you help with?');
    });

    expect(result.current.messages[1].text).toContain('I can teach you about:');
    expect(result.current.messages[1].text).toContain('Contacts');
    expect(result.current.messages[1].text).toContain('Deals');
    expect(result.current.messages[1].text).toContain('Dashboard');
  });

  it('should handle greetings', async () => {
    const { result } = renderHook(() => useChatbot(), {
      wrapper: ChatbotProvider
    });

    await act(async () => {
      await result.current.sendMessage('Hello');
    });

    expect(result.current.messages[1].text).toContain('Hello');
    expect(result.current.messages[1].text).toContain('get the most of your CRM');
  });

  it('should handle thank you messages', async () => {
    const { result } = renderHook(() => useChatbot(), {
      wrapper: ChatbotProvider
    });

    await act(async () => {
      await result.current.sendMessage('Thank you');
    });

    expect(result.current.messages[1].text).toContain("You're welcome");
    expect(result.current.messages[1].text).toContain('always here');
  });

  it('should provide fallback response for unknown questions', async () => {
    const { result } = renderHook(() => useChatbot(), {
      wrapper: ChatbotProvider
    });

    await act(async () => {
      await result.current.sendMessage('What is the meaning of life?');
    });

    expect(result.current.messages[1].text).toContain('I can explain');
    expect(result.current.messages[1].text).toContain('manage contacts');
    expect(result.current.messages[1].text).toContain('creating and tracking deals');
  });

  it('should show and hide chatbot', () => {
    const { result } = renderHook(() => useChatbot(), {
      wrapper: ChatbotProvider
    });

    expect(result.current.isVisible).toBe(false);

    act(() => {
      result.current.showChatbot();
    });

    expect(result.current.isVisible).toBe(true);

    act(() => {
      result.current.hideChatbot();
    });

    expect(result.current.isVisible).toBe(false);
  });

  it('should clear chat history', () => {
    const { result } = renderHook(() => useChatbot(), {
      wrapper: ChatbotProvider
    });

    act(() => {
      result.current.clearChat();
    });

    expect(result.current.messages).toHaveLength(1); // Only welcome message remains
    expect(result.current.messages[0].text).toContain('Welcome');
  });

  it('should handle multiple messages in sequence', async () => {
    const { result } = renderHook(() => useChatbot(), {
      wrapper: ChatbotProvider
    });

    await act(async () => {
      await result.current.sendMessage('Hi');
    });

    expect(result.current.messages).toHaveLength(2);

    await act(async () => {
      await result.current.sendMessage('Tell me about contacts');
    });

    expect(result.current.messages).toHaveLength(4);
    expect(result.current.messages[3].text).toContain('Contacts are your customer database');
  });
});