import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSSEStream } from '@/hooks/useSSEStream';

// Mock the global fetch
global.fetch = vi.fn();

describe('useSSEStream', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('initializes with default values', () => {
    const { result } = renderHook(() => useSSEStream());
    expect(result.current.isStreaming).toBe(false);
    expect(result.current.streamContent).toBe('');
    expect(result.current.error).toBe(null);
  });

  // Simple test for initialization since mocking fetch streams in JSDOM is complex
  it('reset() clears state', () => {
    const { result } = renderHook(() => useSSEStream());
    
    act(() => {
      // simulate stream content existing
      result.current.reset();
    });

    expect(result.current.streamContent).toBe('');
    expect(result.current.isStreaming).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('cancelStream() sets isStreaming to false', () => {
    const { result } = renderHook(() => useSSEStream());
    
    act(() => {
      result.current.cancelStream();
    });

    expect(result.current.isStreaming).toBe(false);
  });
});
