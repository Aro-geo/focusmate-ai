import React, { useState, useCallback } from 'react';

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
  progress?: number;
}

export interface ApiState<T> extends LoadingState {
  data: T | null;
}

/**
 * Hook for managing API call states with loading, error, and data
 */
export function useApiState<T = any>(initialData: T | null = null): {
  state: ApiState<T>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setData: (data: T | null) => void;
  setProgress: (progress: number) => void;
  reset: () => void;
  execute: <R = T>(apiCall: () => Promise<R>) => Promise<R | null>;
} {
  const [state, setState] = useState<ApiState<T>>({
    isLoading: false,
    error: null,
    data: initialData,
    progress: 0
  });

  const setLoading = useCallback((isLoading: boolean) => {
    setState(prev => ({ ...prev, isLoading, error: isLoading ? null : prev.error }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error, isLoading: false }));
  }, []);

  const setData = useCallback((data: T | null) => {
    setState(prev => ({ ...prev, data, isLoading: false, error: null }));
  }, []);

  const setProgress = useCallback((progress: number) => {
    setState(prev => ({ ...prev, progress }));
  }, []);

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      data: initialData,
      progress: 0
    });
  }, [initialData]);

  const execute = useCallback(async <R = T>(apiCall: () => Promise<R>): Promise<R | null> => {
    setLoading(true);
    setProgress(0);

    try {
      const result = await apiCall();
      setData(result as unknown as T);
      setProgress(100);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setError(errorMessage);
      return null;
    }
  }, [setLoading, setData, setError, setProgress]);

  return {
    state,
    setLoading,
    setError,
    setData,
    setProgress,
    reset,
    execute
  };
}

/**
 * Hook specifically for AI chat interactions with streaming support
 */
export function useAIChat() {
  const [messages, setMessages] = useState<Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    isStreaming?: boolean;
  }>>([]);

  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addUserMessage = useCallback((content: string) => {
    const message = {
      id: Date.now().toString(),
      role: 'user' as const,
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, message]);
    return message.id;
  }, []);

  const addAssistantMessage = useCallback((content: string, isStreaming = false) => {
    const message = {
      id: Date.now().toString(),
      role: 'assistant' as const,
      content,
      timestamp: new Date(),
      isStreaming
    };
    setMessages(prev => [...prev, message]);
    return message.id;
  }, []);

  const updateAssistantMessage = useCallback((id: string, content: string, isStreaming = false) => {
    setMessages(prev => prev.map(msg => 
      msg.id === id 
        ? { ...msg, content, isStreaming }
        : msg
    ));
  }, []);

  const startStreaming = useCallback((initialContent = '') => {
    setIsTyping(true);
    return addAssistantMessage(initialContent, true);
  }, [addAssistantMessage]);

  const appendToStream = useCallback((messageId: string, chunk: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, content: msg.content + chunk }
        : msg
    ));
  }, []);

  const endStreaming = useCallback((messageId: string) => {
    setIsTyping(false);
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, isStreaming: false }
        : msg
    ));
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    setIsTyping(false);
  }, []);

  const setTypingIndicator = useCallback((typing: boolean) => {
    setIsTyping(typing);
  }, []);

  return {
    messages,
    isTyping,
    error,
    addUserMessage,
    addAssistantMessage,
    updateAssistantMessage,
    startStreaming,
    appendToStream,
    endStreaming,
    clearMessages,
    setTypingIndicator,
    setError
  };
}

/**
 * Hook for managing form submission with loading states
 */
export function useFormSubmission<T = any>() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const submit = useCallback(async (
    submitFn: () => Promise<T>,
    onSuccess?: (result: T) => void,
    onError?: (error: string) => void
  ): Promise<T | null> => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await submitFn();
      setSuccess(true);
      onSuccess?.(result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Submission failed';
      setError(errorMessage);
      onError?.(errorMessage);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const reset = useCallback(() => {
    setIsSubmitting(false);
    setError(null);
    setSuccess(false);
  }, []);

  return {
    isSubmitting,
    error,
    success,
    submit,
    reset,
    setError
  };
}

export default useApiState;
