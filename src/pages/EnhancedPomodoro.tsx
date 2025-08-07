import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Settings, Volume2, VolumeX, MessageCircle } from 'lucide-react';
import FocusNowButton from '../components/FocusNowButton';
import SessionChat from '../components/SessionChat';

const EnhancedPomodoro: React.FC = () => {
  // Timer state
  const [workDuration, setWorkDuration] = useState(25);
  const [shortBreakDuration, setShortBreakDuration] = useState(5);
  const [longBreakDuration, setLongBreakDuration] = useState(15);
  const [currentTime, setCurrentTime] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'work' | 'shortBreak' | 'longBreak'>('work');
  const [cycles, setCycles] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  
  // Session state
  const [sessionMode, setSessionMode] = useState<'work' | 'moving' | 'anything'>('work');
  const [quietMode, setQuietMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [chatMinimized, setChatMinimized] = useState(true);
  
  // Mock user data
  const currentUser = { id: 'user-1', name: 'You' };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const completeSession = useCallback(() => {
    if (soundEnabled) {
      console.log('🔔 Session completed!');
    }
    
    if (mode === 'work') {
      setCycles(prev => prev + 1);
      const nextMode = cycles > 0 && (cycles + 1) % 4 === 0 ? 'longBreak' : 'shortBreak';
      setMode(nextMode);
      setCurrentTime(nextMode === 'longBreak' ? longBreakDuration * 60 : shortBreakDuration * 60);
    } else {
      setMode('work');
      setCurrentTime(workDuration * 60);
    }
    setIsActive(false);
  }, [mode, cycles, workDuration, shortBreakDuration, longBreakDuration, soundEnabled]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isActive && currentTime > 0) {
      interval = setInterval(() => {
        setCurrentTime(currentTime => currentTime - 1);
      }, 1000);
    } else if (currentTime === 0) {
      completeSession();
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, currentTime, completeSession]);

  // Duration effect
  useEffect(() => {
    if (!isActive) {
      if (mode === 'work') {
        setCurrentTime(workDuration * 60);
      } else if (mode === 'shortBreak') {
        setCurrentTime(shortBreakDuration * 60);
      } else {
        setCurrentTime(longBreakDuration * 60);
      }
    }
  }, [workDuration, shortBreakDuration, longBreakDuration, mode, isActive]);

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    if (mode === 'work') {
      setCurrentTime(workDuration * 60);
    } else if (mode === 'shortBreak') {
      setCurrentTime(shortBreakDuration * 60);
    } else {
      setCurrentTime(longBreakDuration * 60);
    }
  };

  const startCustomSession = useCallback((duration: number, taskMode: string) => {
    setWorkDuration(duration);
    setSessionMode(taskMode as 'work' | 'moving' | 'anything');
    setCurrentTime(duration * 60);
    setMode('work');
    setIsActive(true);
    setShowChat(true);
    setChatMinimized(false);
  }, []);

  const getTimerColor = () => {
    if (mode === 'work') return 'text-red-500';
    if (mode === 'shortBreak') return 'text-green-500';
    return 'text-blue-500';
  };

  const getBackgroundColor = () => {
    if (mode === 'work') return 'from-red-50 to-red-100';
    if (mode === 'shortBreak') return 'from-green-50 to-green-100';
    return 'from-blue-50 to-blue-100';
  };

  const sessionModeIcons = {
    work: '💻',
    moving: '🚶',
    anything: '✨'
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${getBackgroundColor()} p-6 transition-all duration-1000`}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Enhanced Focus Timer
          </h1>
          <p className="text-gray-600">
            {mode === 'work' ? 'Time to focus!' : mode === 'shortBreak' ? 'Take a short break' : 'Long break time!'}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Timer Section */}
          <div className="bg-white rounded-3xl shadow-xl p-8">
            {/* Session Info */}
            {isActive && (
              <div className="text-center mb-6 p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-2xl">{sessionModeIcons[sessionMode]}</span>
                  <span className="text-sm font-medium text-gray-600 capitalize">
                    {sessionMode} Session
                  </span>
                  {quietMode && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">Quiet Mode</span>}
                </div>
                <button
                  onClick={() => setShowChat(true)}
                  className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded-full flex items-center gap-1 mx-auto"
                >
                  <MessageCircle className="w-3 h-3" />
                  Open Session Chat
                </button>
              </div>
            )}

            <div className="text-center mb-8">
              <div className={`text-8xl font-mono font-bold ${getTimerColor()} mb-4`}>
                {formatTime(currentTime)}
              </div>
              <div className="text-lg text-gray-600 capitalize">
                {mode === 'shortBreak' ? 'Short Break' : mode === 'longBreak' ? 'Long Break' : 'Work Time'}
              </div>
              <div className="text-sm text-gray-500 mt-2">
                Cycle {cycles + 1}
              </div>
            </div>

            <div className="flex justify-center gap-4 mb-6">
              <button
                onClick={toggleTimer}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                  isActive
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                {isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                {isActive ? 'Pause' : 'Start'}
              </button>
              <button
                onClick={resetTimer}
                className="flex items-center gap-2 px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-semibold transition-all"
              >
                <RotateCcw className="w-5 h-5" />
                Reset
              </button>
            </div>

            {/* Quick Controls */}
            <div className="flex justify-center gap-4 mb-6">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-3 rounded-lg transition-all ${
                  soundEnabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                }`}
                title={soundEnabled ? 'Disable sounds' : 'Enable sounds'}
              >
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setQuietMode(!quietMode)}
                className={`px-4 py-2 rounded-lg transition-all text-sm font-medium ${
                  quietMode ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {quietMode ? '🤫 Quiet' : '🎤 Voice'}
              </button>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-all"
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>

            {/* Settings Panel */}
            {showSettings && (
              <div className="bg-gray-50 rounded-xl p-6 mt-6">
                <h3 className="font-semibold text-gray-800 mb-4">Timer Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Work Duration: {workDuration} minutes
                    </label>
                    <input
                      type="range"
                      min="15"
                      max="90"
                      step="5"
                      value={workDuration}
                      onChange={(e) => setWorkDuration(Number(e.target.value))}
                      className="w-full"
                      aria-label="Work duration in minutes"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Short Break: {shortBreakDuration} minutes
                    </label>
                    <input
                      type="range"
                      min="3"
                      max="15"
                      value={shortBreakDuration}
                      onChange={(e) => setShortBreakDuration(Number(e.target.value))}
                      className="w-full"
                      aria-label="Short break duration in minutes"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Long Break: {longBreakDuration} minutes
                    </label>
                    <input
                      type="range"
                      min="15"
                      max="30"
                      value={longBreakDuration}
                      onChange={(e) => setLongBreakDuration(Number(e.target.value))}
                      className="w-full"
                      aria-label="Long break duration in minutes"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Focus Now Section */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                Quick Start
              </h2>
              <FocusNowButton onStartSession={startCustomSession} />
              
              {/* Session Stats */}
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-xl">
                  <div className="text-2xl font-bold text-blue-600">{cycles}</div>
                  <div className="text-sm text-blue-600">Completed</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-xl">
                  <div className="text-2xl font-bold text-green-600">
                    {Math.floor((cycles * workDuration) / 60)}h {(cycles * workDuration) % 60}m
                  </div>
                  <div className="text-sm text-green-600">Focus Time</div>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-semibold text-gray-800 mb-4">💡 Focus Tips</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Remove distractions from your workspace</li>
                <li>• Have water and snacks ready</li>
                <li>• Set a specific goal for each session</li>
                <li>• Use breaks to stretch and move</li>
                <li>• Share your goal with your focus partner</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Session Chat */}
      {showChat && (
        <SessionChat
          sessionId="current-session"
          currentUser={currentUser}
          isMinimized={chatMinimized}
          onToggleMinimize={() => setChatMinimized(!chatMinimized)}
        />
      )}
    </div>
  );
};

export default EnhancedPomodoro;
