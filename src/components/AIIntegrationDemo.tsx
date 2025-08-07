import React from 'react';
import NewOpenAIService from '../services/NewOpenAIService';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface AIIntegrationDemoProps {
  className?: string;
}

const AIIntegrationDemo: React.FC<AIIntegrationDemoProps> = ({ className = '' }) => {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [inputValue, setInputValue] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const addMessage = (role: 'user' | 'assistant', content: string, isStreaming = false): string => {
    const message: Message = {
      id: Date.now().toString() + Math.random(),
      role,
      content,
      timestamp: new Date(),
      isStreaming
    };
    setMessages(prev => [...prev, message]);
    return message.id;
  };

  const updateMessage = (id: string, content: string, isStreaming = false) => {
    setMessages(prev => prev.map(msg => 
      msg.id === id ? { ...msg, content, isStreaming } : msg
    ));
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setError(null);
    setIsLoading(true);

    // Add user message
    addMessage('user', userMessage);

    try {
      // Show loading state
      const assistantMessageId = addMessage('assistant', '🤔 Thinking...', true);

      // Call AI service
      const response = await NewOpenAIService.chat(userMessage);

      // Update with actual response
      updateMessage(assistantMessageId, response.response, false);

      if (response.source === 'fallback') {
        setError('Using fallback response - AI service may be unavailable');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get AI response');
      // Add error message
      addMessage('assistant', 'Sorry, I encountered an error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetFocusSuggestions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const assistantMessageId = addMessage('assistant', '💡 Generating focus suggestions...', true);

      // Mock current tasks for demo
      const mockTasks = [
        { id: '1', title: 'Complete project proposal', priority: 'high', estimated_duration: 120 },
        { id: '2', title: 'Review code changes', priority: 'medium', estimated_duration: 45 },
        { id: '3', title: 'Update documentation', priority: 'low', estimated_duration: 30 }
      ];

      const response = await NewOpenAIService.getFocusSuggestions(mockTasks);
      
      const suggestionsText = `Here are personalized focus suggestions:\n\n${
        response.suggestions.map((suggestion, index) => `${index + 1}. ${suggestion}`).join('\n')
      }`;

      updateMessage(assistantMessageId, suggestionsText, false);

      if (response.source === 'fallback') {
        setError('Using fallback suggestions - AI service may be unavailable');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get focus suggestions');
      addMessage('assistant', 'Sorry, I couldn\'t generate focus suggestions right now.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyzeJournal = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const assistantMessageId = addMessage('assistant', '📝 Analyzing journal entries...', true);

      // Mock journal entries for demo
      const mockEntries = [
        "Today was productive. Completed 3 tasks and felt focused during the morning.",
        "Struggled with distractions in the afternoon. Need better environment setup.",
        "Great flow state during coding session. The Pomodoro technique really helped."
      ];

      const response = await NewOpenAIService.analyzeJournal(mockEntries);
      
      const analysisText = `**Journal Analysis:**\n\n${response.insights}\n\n**Suggestions for improvement:**\n${
        response.suggestions.map((suggestion, index) => `${index + 1}. ${suggestion}`).join('\n')
      }`;

      updateMessage(assistantMessageId, analysisText, false);

      if (response.source === 'fallback') {
        setError('Using fallback analysis - AI service may be unavailable');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze journal');
      addMessage('assistant', 'Sorry, I couldn\'t analyze your journal entries right now.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
  };

  return (
    <div className={`flex flex-col h-full bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-lg">
        <h3 className="text-lg font-semibold text-gray-900">AI Assistant</h3>
        <div className="flex gap-2">
          <button
            onClick={handleGetFocusSuggestions}
            disabled={isLoading}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 disabled:opacity-50"
          >
            💡 Focus Tips
          </button>
          <button
            onClick={handleAnalyzeJournal}
            disabled={isLoading}
            className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 disabled:opacity-50"
          >
            📝 Analyze Journal
          </button>
          <button
            onClick={clearChat}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-yellow-50 border-b border-yellow-200">
          <p className="text-sm text-yellow-800">⚠️ {error}</p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <p className="text-lg">👋 Hello! I'm your AI assistant.</p>
            <p className="text-sm mt-2">Ask me anything or try the quick actions above!</p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <div className="whitespace-pre-wrap text-sm">
                {message.content}
              </div>
              {message.isStreaming && (
                <div className="mt-1">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce animate-bounce-delay-1"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce animate-bounce-delay-2"></div>
                  </div>
                </div>
              )}
              <div className="text-xs opacity-70 mt-1">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-center">
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span className="text-sm text-gray-600">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-gray-50 rounded-b-lg">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask me anything..."
            disabled={isLoading}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIIntegrationDemo;
