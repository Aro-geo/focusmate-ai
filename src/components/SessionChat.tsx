import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, Target, CheckCircle } from 'lucide-react';

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: Date;
  type: 'goal' | 'update' | 'chat';
}

interface SessionChatProps {
  sessionId: string;
  currentUser: { id: string; name: string };
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

const SessionChat: React.FC<SessionChatProps> = ({ 
  sessionId, 
  currentUser, 
  isMinimized = false, 
  onToggleMinimize 
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      userId: 'partner-123',
      userName: 'Sarah M.',
      message: 'Working on quarterly presentation slides',
      timestamp: new Date(Date.now() - 5000),
      type: 'goal'
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [goalInput, setGoalInput] = useState('');
  const [showGoalInput, setShowGoalInput] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = (content: string, type: 'goal' | 'update' | 'chat' = 'chat') => {
    const message: ChatMessage = {
      id: Date.now().toString(),
      userId: currentUser.id,
      userName: currentUser.name,
      message: content,
      timestamp: new Date(),
      type
    };
    setMessages(prev => [...prev, message]);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      sendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  const handleSendGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (goalInput.trim()) {
      sendMessage(goalInput.trim(), 'goal');
      setGoalInput('');
      setShowGoalInput(false);
    }
  };

  const quickUpdates = [
    '✅ Task completed!',
    '⏳ Taking a 2-min break',
    '🎯 Switching to next task',
    '🔥 In deep focus mode'
  ];

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={onToggleMinimize}
          className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg"
        >
          <MessageCircle className="w-6 h-6" />
          {messages.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {messages.filter(m => m.userId !== currentUser.id).length}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-96 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-gray-800">Session Chat</h3>
        </div>
        <button
          onClick={onToggleMinimize}
          className="text-gray-400 hover:text-gray-600"
        >
          −
        </button>
      </div>

      {/* Quick Actions */}
      <div className="p-3 border-b border-gray-100 bg-gray-50">
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => setShowGoalInput(true)}
            className="flex-1 bg-green-100 hover:bg-green-200 text-green-700 text-xs py-2 px-3 rounded-md flex items-center gap-1"
          >
            <Target className="w-3 h-3" />
            Set Goal
          </button>
        </div>
        
        {showGoalInput && (
          <form onSubmit={handleSendGoal} className="mb-2">
            <input
              type="text"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              placeholder="What are you working on?"
              className="w-full text-xs p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </form>
        )}

        <div className="grid grid-cols-2 gap-1">
          {quickUpdates.map((update, index) => (
            <button
              key={index}
              onClick={() => sendMessage(update, 'update')}
              className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 py-1 px-2 rounded-md transition-colors"
            >
              {update}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[200px] max-h-[240px]">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.userId === currentUser.id ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-2 rounded-lg ${
                message.userId === currentUser.id
                  ? 'bg-blue-500 text-white'
                  : message.type === 'goal'
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : message.type === 'update'
                  ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {message.type === 'goal' && (
                <div className="flex items-center gap-1 mb-1">
                  <Target className="w-3 h-3" />
                  <span className="text-xs font-medium">Goal</span>
                </div>
              )}
              {message.type === 'update' && (
                <div className="flex items-center gap-1 mb-1">
                  <CheckCircle className="w-3 h-3" />
                  <span className="text-xs font-medium">Update</span>
                </div>
              )}
              <div className="text-sm">{message.message}</div>
              <div className="text-xs opacity-75 mt-1">
                {message.userName} • {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-200">
        <form onSubmit={handleSendChat} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 text-sm p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            title="Send message"
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white p-2 rounded-md transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default SessionChat;
