import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  CheckCircle, 
  Smile, 
  Meh, 
  Frown,
  Brain,
  Plus,
  ChevronDown,
  Timer,
  Target,
  Zap,
  Clock,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import FloatingAssistant from '../components/FloatingAssistant';
import { openAIService } from '../services/OpenAIService';

// Types
type PomodoroMode = 'work' | 'shortBreak' | 'longBreak';
type MoodType = 'great' | 'okay' | 'tired' | null;

interface Task {
  id: number;
  text: string;
}

interface Session {
  task: string | null;
  startTime: Date;
  endTime: Date | null;
  duration: number;
  mode: PomodoroMode;
  mood: MoodType;
  feedback: string | null;
  completed: boolean;
}

const Pomodoro: React.FC = () => {
  const { darkMode } = useTheme();
  
  // Configuration
  const workDuration = 25 * 60; // 25 minutes in seconds
  const shortBreakDuration = 5 * 60; // 5 minutes
  const longBreakDuration = 15 * 60; // 15 minutes
  const sessionsBeforeLongBreak = 4;

  // State
  const [timeRemaining, setTimeRemaining] = useState<number>(workDuration);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [mode, setMode] = useState<PomodoroMode>('work');
  const [completedSessions, setCompletedSessions] = useState<number>(0);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, text: "Project proposal" },
    { id: 2, text: "Client meeting" },
    { id: 3, text: "Documentation" },
    { id: 4, text: "Code review" }
  ]);
  const [customTask, setCustomTask] = useState<string>("");
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showFeedback, setShowFeedback] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [mood, setMood] = useState<MoodType>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [showSessionComplete, setShowSessionComplete] = useState<boolean>(false);
  const [showTaskDropdown, setShowTaskDropdown] = useState<boolean>(false);
  
  // AI Assistant state
  const [aiMessage, setAiMessage] = useState<string>("Ready to focus? Select a task and let's get started with a productive Pomodoro session!");
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiChatInput, setAiChatInput] = useState<string>('');
  
  // Refs
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Effects
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Timer effect
  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            completeSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, [isActive]);

  // Mode change effect
  useEffect(() => {
    if (mode === 'work') {
      setTimeRemaining(workDuration);
    } else if (mode === 'shortBreak') {
      setTimeRemaining(shortBreakDuration);
    } else {
      setTimeRemaining(longBreakDuration);
    }
    setIsActive(false);
  }, [mode, workDuration, shortBreakDuration, longBreakDuration]);

  // Functions
  const toggleTimer = () => {
    if (!isActive && timeRemaining === workDuration && mode === 'work') {
      // Starting a new session
      const newSession: Session = {
        task: selectedTask,
        startTime: new Date(),
        endTime: null,
        duration: 0,
        mode: mode,
        mood: null,
        feedback: null,
        completed: false
      };
      setCurrentSession(newSession);
    }
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    if (mode === 'work') {
      setTimeRemaining(workDuration);
    } else if (mode === 'shortBreak') {
      setTimeRemaining(shortBreakDuration);
    } else {
      setTimeRemaining(longBreakDuration);
    }
  };

  const skipToBreak = () => {
    if (mode === 'work') {
      completeSession();
    }
  };

  const completeSession = useCallback(() => {
    setIsActive(false);

    // Play sound if enabled
    if (soundEnabled) {
      // Create and play a simple notification sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.2);
    }

    if (mode === 'work') {
      // Complete work session
      const sessionsCount = completedSessions + 1;
      setCompletedSessions(sessionsCount);

      // Update current session
      if (currentSession) {
        const updatedSession: Session = {
          ...currentSession,
          endTime: new Date(),
          duration: workDuration - timeRemaining
        };
        setCurrentSession(updatedSession);

        // Add to sessions history
        setSessions(prev => [...prev, updatedSession]);
      }

      // Determine next break type
      if (sessionsCount % sessionsBeforeLongBreak === 0) {
        setMode('longBreak');
      } else {
        setMode('shortBreak');
      }
    } else {
      // Complete break
      setMode('work');
    }
  }, [completedSessions, currentSession, mode, soundEnabled, timeRemaining, workDuration, sessionsBeforeLongBreak]);

  const generateAIFeedback = async (session: Session) => {
    try {
      setIsAiLoading(true);
      const prompt = `A user just completed a ${session.duration / 60} minute focus session working on "${session.task}". 
      Provide a brief, encouraging feedback message about their productivity. Keep it under 50 words and be motivational.`;
      
      const response = await openAIService.sendMessage(prompt);
      setFeedback(response.content);
    } catch (error) {
      console.error('Failed to generate AI feedback:', error);
      setFeedback("Great job completing this focus session! You're building excellent productivity habits.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const sendAIMessage = async () => {
    if (!aiChatInput.trim()) return;
    
    try {
      setIsAiLoading(true);
      const response = await openAIService.sendMessage(aiChatInput);
      setAiMessage(response.content);
      setAiChatInput('');
    } catch (error) {
      console.error('Failed to send AI message:', error);
      setAiMessage("I'm having trouble connecting right now, but I'm here to help you stay focused!");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAskAI = () => {
    sendAIMessage();
  };

  const handleGetTip = async () => {
    try {
      setIsAiLoading(true);
      const response = await openAIService.sendMessage("Give me a quick productivity tip for staying focused during work sessions.");
      setAiMessage(response.content);
    } catch (error) {
      console.error('Failed to get tip:', error);
      setAiMessage("💡 Tip: Try the 2-minute rule - if something takes less than 2 minutes, do it now!");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleTaskSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    if (value === "custom") {
      setSelectedTask(null);
    } else {
      setSelectedTask(value);
      setCustomTask("");
    }
  };

  const addCustomTask = () => {
    if (customTask.trim()) {
      const newTask = { id: Date.now(), text: customTask.trim() };
      setTasks([...tasks, newTask]);
      setSelectedTask(customTask.trim());
      setCustomTask("");
    }
  };

  // Quick start functions for different durations
  const quickStart = (minutes: number) => {
    setIsActive(false);
    const seconds = minutes * 60;
    setTimeRemaining(seconds);
    setMode('work');
    setTimeout(() => {
      setIsActive(true);
    }, 100);
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getModeText = (): string => {
    switch (mode) {
      case 'work': return 'Focus Time';
      case 'shortBreak': return 'Short Break';
      case 'longBreak': return 'Long Break';
      default: return 'Focus Time';
    }
  };

  const getModeColor = (): string => {
    switch (mode) {
      case 'work': return 'text-red-600 dark:text-red-400';
      case 'shortBreak': return 'text-green-600 dark:text-green-400';
      case 'longBreak': return 'text-blue-600 dark:text-blue-400';
      default: return 'text-red-600 dark:text-red-400';
    }
  };

  const calculateProgress = (): number => {
    let totalTime: number;
    if (mode === 'work') {
      totalTime = workDuration;
    } else if (mode === 'shortBreak') {
      totalTime = shortBreakDuration;
    } else {
      totalTime = longBreakDuration;
    }

    return ((totalTime - timeRemaining) / totalTime) * 100;
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-blue-50 via-white to-indigo-50'
    }`}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className={`text-4xl font-bold mb-4 ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Pomodoro Timer
          </h1>
          <p className={`text-lg ${
            darkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Focus • Work • Achieve
          </p>
        </motion.div>

        {/* Main Layout - Responsive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-8 max-w-7xl mx-auto">
          
          {/* Left Column - Timer and Controls (70% on desktop) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Quick Focus Buttons */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`rounded-2xl p-6 ${
                darkMode 
                  ? 'bg-gray-800/50 border border-gray-700' 
                  : 'bg-white/70 border border-white/20 shadow-lg backdrop-blur-sm'
              }`}
            >
              <h2 className={`text-xl font-semibold mb-4 flex items-center ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                <Zap className="mr-2" size={20} />
                Quick Focus
              </h2>
              <div className="flex flex-wrap gap-3">
                {[15, 25, 50].map((minutes) => (
                  <motion.button
                    key={minutes}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => quickStart(minutes)}
                    className={`px-6 py-3 rounded-xl font-medium transition-all ${
                      darkMode
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    } shadow-lg hover:shadow-xl`}
                  >
                    <Clock className="inline mr-2" size={16} />
                    {minutes}m
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Timer Display */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`rounded-2xl p-8 text-center ${
                darkMode 
                  ? 'bg-gray-800/50 border border-gray-700' 
                  : 'bg-white/70 border border-white/20 shadow-lg backdrop-blur-sm'
              }`}
            >
              <div className={`text-sm font-medium mb-4 ${getModeColor()}`}>
                {getModeText()}
              </div>
              
              {/* Circular Progress */}
              <div className="relative w-64 h-64 mx-auto mb-8">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke={darkMode ? "#374151" : "#E5E7EB"}
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke={mode === 'work' ? "#EF4444" : mode === 'shortBreak' ? "#10B981" : "#3B82F6"}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 45}`}
                    strokeDashoffset={`${2 * Math.PI * 45 * (1 - calculateProgress() / 100)}`}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className={`text-5xl font-bold ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {formatTime(timeRemaining)}
                  </div>
                </div>
              </div>

              {/* Timer Controls */}
              <div className="flex justify-center space-x-4 mb-6">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleTimer}
                  className={`p-4 rounded-full ${
                    darkMode
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  } shadow-lg transition-colors`}
                >
                  {isActive ? <Pause size={24} /> : <Play size={24} />}
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={resetTimer}
                  className={`p-4 rounded-full ${
                    darkMode
                      ? 'bg-gray-600 hover:bg-gray-700 text-white'
                      : 'bg-gray-500 hover:bg-gray-600 text-white'
                  } shadow-lg transition-colors`}
                >
                  <RotateCcw size={24} />
                </motion.button>

                {mode === 'work' && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={skipToBreak}
                    className={`p-4 rounded-full ${
                      darkMode
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    } shadow-lg transition-colors`}
                  >
                    <SkipForward size={24} />
                  </motion.button>
                )}

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`p-4 rounded-full ${
                    soundEnabled 
                      ? (darkMode ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-yellow-500 hover:bg-yellow-600')
                      : (darkMode ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-500 hover:bg-gray-600')
                  } text-white shadow-lg transition-colors`}
                >
                  {soundEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
                </motion.button>
              </div>

              {/* Task Selection */}
              <div className="max-w-md mx-auto">
                <div className="relative">
                  <select
                    value={selectedTask || ""}
                    onChange={handleTaskSelect}
                    className={`w-full p-3 rounded-xl border ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  >
                    <option value="">Select a task...</option>
                    {tasks.map(task => (
                      <option key={task.id} value={task.text}>
                        {task.text}
                      </option>
                    ))}
                    <option value="custom">+ Add custom task</option>
                  </select>
                </div>

                {/* Custom Task Input */}
                <AnimatePresence>
                  {selectedTask === null && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 flex space-x-2"
                    >
                      <input
                        type="text"
                        value={customTask}
                        onChange={(e) => setCustomTask(e.target.value)}
                        placeholder="Enter custom task..."
                        className={`flex-1 p-3 rounded-xl border ${
                          darkMode
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                        onKeyPress={(e) => e.key === 'Enter' && addCustomTask()}
                      />
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={addCustomTask}
                        className={`px-4 py-3 rounded-xl ${
                          darkMode
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                        } shadow-lg transition-colors`}
                      >
                        <Plus size={20} />
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Session Stats */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl p-6 ${
                darkMode 
                  ? 'bg-gray-800/50 border border-gray-700' 
                  : 'bg-white/70 border border-white/20 shadow-lg backdrop-blur-sm'
              }`}
            >
              <h3 className={`text-lg font-semibold mb-4 flex items-center ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                <Target className="mr-2" size={20} />
                Today's Progress
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${
                    darkMode ? 'text-blue-400' : 'text-blue-600'
                  }`}>
                    {completedSessions}
                  </div>
                  <div className={`text-sm ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Sessions Completed
                  </div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${
                    darkMode ? 'text-green-400' : 'text-green-600'
                  }`}>
                    {Math.floor(completedSessions * 25 / 60)}h {(completedSessions * 25) % 60}m
                  </div>
                  <div className={`text-sm ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Focus Time
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column - AI Assistant (30% on desktop) */}
          <div className="lg:col-span-3">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`rounded-2xl p-6 h-full ${
                darkMode 
                  ? 'bg-gray-800/50 border border-gray-700' 
                  : 'bg-white/70 border border-white/20 shadow-lg backdrop-blur-sm'
              }`}
            >
              <h3 className={`text-lg font-semibold mb-4 flex items-center ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                <Brain className="mr-2" size={20} />
                AI Focus Coach
              </h3>
              
              <div className={`p-4 rounded-xl mb-4 ${
                darkMode ? 'bg-gray-700/50' : 'bg-gray-50'
              }`}>
                <p className={`text-sm leading-relaxed ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {aiMessage}
                </p>
              </div>

              <div className="flex space-x-2">
                <input
                  type="text"
                  value={aiChatInput}
                  onChange={(e) => setAiChatInput(e.target.value)}
                  placeholder="Ask for focus tips..."
                  className={`flex-1 p-3 rounded-xl border text-sm ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  onKeyPress={(e) => e.key === 'Enter' && sendAIMessage()}
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={sendAIMessage}
                  disabled={isAiLoading}
                  className={`px-4 py-3 rounded-xl ${
                    darkMode
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  } shadow-lg transition-colors disabled:opacity-50`}
                >
                  <span className="flex items-center justify-center">
                    {isAiLoading ? (
                      <Loader2 size={16} className="mr-2 animate-spin" />
                    ) : (
                      <Zap size={16} className="mr-2" />
                    )}
                  </span>
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Floating AI Assistant */}
      <FloatingAssistant
        isAiLoading={isAiLoading}
        aiMessage={aiMessage}
        aiChatInput={aiChatInput}
        setAiChatInput={setAiChatInput}
        onAskAI={handleAskAI}
        onGetTip={handleGetTip}
      />
    </div>
  );
};

export default Pomodoro;