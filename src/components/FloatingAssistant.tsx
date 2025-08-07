import React, { useState, useRef, useEffect } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { 
  Brain, 
  MessageCircle, 
  Lightbulb, 
  Minimize2, 
  Maximize2, 
  X,
  Loader,
  Send
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface FloatingAssistantProps {
  isAiLoading: boolean;
  aiMessage: string;
  aiChatInput: string;
  setAiChatInput: (value: string) => void;
  onAskAI: () => void;
  onGetTip: () => void;
}

const FloatingAssistant: React.FC<FloatingAssistantProps> = ({
  isAiLoading,
  aiMessage,
  aiChatInput,
  setAiChatInput,
  onAskAI,
  onGetTip
}) => {
  // Debug: Component mount
  console.log('[FloatingAssistant] Rendered');
  // Debug: Props
  console.log('[FloatingAssistant] Props:', { isAiLoading, aiMessage, aiChatInput, setAiChatInput, onAskAI, onGetTip });
  const { darkMode } = useTheme();
  // Debug: Theme
  console.log('[FloatingAssistant] darkMode:', darkMode);
  const [isMinimized, setIsMinimized] = useState(false); // Start expanded for visibility
  const [showChat, setShowChat] = useState(true); // Start with chat open for visibility
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  // Debug: State
  console.log('[FloatingAssistant] State:', { isMinimized, showChat, position, isDragging });

  // Initialize position to bottom-right corner
  useEffect(() => {
    const updatePosition = () => {
      const margin = 20;
      const assistantWidth = isMinimized ? 60 : 320;
      const assistantHeight = isMinimized ? 60 : (showChat ? 400 : 280);
      const newPos = {
        x: window.innerWidth - assistantWidth - margin,
        y: window.innerHeight - assistantHeight - margin
      };
      setPosition(newPos);
      // Debug: Position update
      console.log('[FloatingAssistant] updatePosition:', newPos);
    };

    // Set initial position
    updatePosition();
    // Update position on window resize
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [isMinimized, showChat]);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    // Keep within viewport bounds
    const margin = 10;
    const assistantWidth = isMinimized ? 60 : 320;
    const assistantHeight = isMinimized ? 60 : (showChat ? 400 : 280);
    const newX = Math.max(margin, Math.min(window.innerWidth - assistantWidth - margin, position.x + info.offset.x));
    const newY = Math.max(margin, Math.min(window.innerHeight - assistantHeight - margin, position.y + info.offset.y));
    setPosition({ x: newX, y: newY });
    // Debug: Drag end
    console.log('[FloatingAssistant] handleDragEnd:', { newX, newY });
  };

  const handleSendMessage = () => {
    if (aiChatInput.trim() && !isAiLoading) {
      onAskAI();
    }
  };

  if (isMinimized) {
    return (
      <motion.div
        ref={containerRef}
        drag
        dragMomentum={false}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        animate={{ 
          x: position.x, 
          y: position.y,
          scale: isDragging ? 1.05 : 1
        }}
        whileHover={{ scale: 1.1 }}
        className="fixed z-50 cursor-grab active:cursor-grabbing floating-assistant-size"
        initial={{ opacity: 0, scale: 0 }}
        exit={{ opacity: 0, scale: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        data-debug="FloatingAssistant-minimized"
      >
        {/* Debug overlay */}
        <div className="debug-indicator-red">
          Debug: Minimized
        </div>
        <motion.button
          onClick={() => setIsMinimized(false)}
          className={`w-full h-full rounded-full shadow-lg flex items-center justify-center transition-all duration-200 ${
            darkMode 
              ? 'bg-gray-800 hover:bg-gray-700 text-white shadow-gray-900/50' 
              : 'bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-xl'
          }`}
          whileTap={{ scale: 0.95 }}
        >
          <Brain className="w-6 h-6" />
          {isAiLoading && (
            <motion.div
              className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </motion.div>
          )}
        </motion.button>
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={containerRef}
      drag
      dragMomentum={false}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={handleDragEnd}
      animate={{ 
        x: position.x, 
        y: position.y,
        scale: isDragging ? 1.02 : 1
      }}
      className={`fixed z-50 cursor-grab active:cursor-grabbing ${showChat ? 'floating-assistant-expanded-chat' : 'floating-assistant-expanded'}`}
      initial={{ opacity: 0, scale: 0.8, y: 50 }}
      exit={{ opacity: 0, scale: 0.8, y: 50 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      data-debug="FloatingAssistant-main"
    >
      {/* Debug overlay */}
      <div className="debug-indicator-green">
        Debug: Main<br/>
        isMinimized: {String(isMinimized)}<br/>
        showChat: {String(showChat)}<br/>
        position: {JSON.stringify(position)}<br/>
        darkMode: {String(darkMode)}
      </div>
      <div className={`w-full h-full rounded-xl shadow-2xl overflow-hidden transition-all duration-300 ${
        darkMode 
          ? 'bg-gray-800 border border-gray-700 shadow-black/50' 
          : 'bg-white border border-gray-200 shadow-xl'
      }`}>
        {/* Header */}
        <div className={`px-4 py-3 border-b cursor-grab active:cursor-grabbing ${
          darkMode ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-gray-50/50'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <motion.div
                animate={isAiLoading ? { rotate: 360 } : {}}
                transition={{ duration: 2, repeat: isAiLoading ? Infinity : 0, ease: "linear" }}
              >
                <Brain className={`w-5 h-5 ${darkMode ? 'text-purple-400' : 'text-indigo-600'}`} />
              </motion.div>
              <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                AI Assistant
              </h3>
              {isAiLoading && (
                <Loader className={`w-4 h-4 animate-spin ${darkMode ? 'text-purple-400' : 'text-indigo-600'}`} />
              )}
            </div>
            <div className="flex items-center space-x-1">
              <motion.button
                onClick={() => setIsMinimized(true)}
                className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
                  darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Minimize2 className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col p-4">
          {/* AI Message */}
          <div className={`flex-1 mb-4 p-3 rounded-lg ${
            darkMode ? 'bg-gray-700/50' : 'bg-gray-50'
          }`}>
            <motion.p 
              className={`text-sm leading-relaxed ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}
              key={aiMessage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {isAiLoading ? (
                <span className="flex items-center space-x-2">
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Thinking...</span>
                </span>
              ) : (
                aiMessage || "Hi! I'm here to help you stay focused and productive. Ask me anything or get a quick tip!"
              )}
            </motion.p>
          </div>

          {/* Chat Input */}
          {showChat && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4"
            >
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={aiChatInput}
                  onChange={(e) => setAiChatInput(e.target.value)}
                  placeholder="Ask me anything..."
                  className={`flex-1 px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 transition-all ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-purple-500 focus:border-purple-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-indigo-500 focus:border-indigo-500'
                  }`}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  disabled={isAiLoading}
                />
                <motion.button
                  onClick={handleSendMessage}
                  disabled={isAiLoading || !aiChatInput.trim()}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    darkMode
                      ? 'bg-purple-600 hover:bg-purple-700 text-white'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Send className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <motion.button 
              onClick={() => setShowChat(!showChat)}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center space-x-2 ${
                showChat 
                  ? (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')
                  : (darkMode ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white')
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isAiLoading}
            >
              <MessageCircle className="w-4 h-4" />
              <span>{showChat ? 'Hide Chat' : 'Chat'}</span>
            </motion.button>
            <motion.button 
              onClick={onGetTip}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center space-x-2 ${
                darkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isAiLoading}
            >
              <Lightbulb className="w-4 h-4" />
              <span>Get Tip</span>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default FloatingAssistant;
