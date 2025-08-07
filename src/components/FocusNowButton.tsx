import React, { useState } from 'react';
import { Play, Clock, Users } from 'lucide-react';

interface FocusNowButtonProps {
  onStartSession: (duration: number, mode: string) => void;
}

const FocusNowButton: React.FC<FocusNowButtonProps> = ({ onStartSession }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(25);
  const [selectedMode, setSelectedMode] = useState('work');

  const durations = [
    { value: 25, label: '25 min', description: 'Quick Focus' },
    { value: 50, label: '50 min', description: 'Deep Work' },
    { value: 75, label: '75 min', description: 'Deep Dive' }
  ];

  const modes = [
    { value: 'work', label: 'Desk Work', icon: '💻' },
    { value: 'moving', label: 'Moving Tasks', icon: '🚶' },
    { value: 'anything', label: 'Anything', icon: '✨' }
  ];

  const handleStartNow = () => {
    onStartSession(selectedDuration, selectedMode);
    setIsExpanded(false);
  };

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-3"
      >
        <Play className="w-6 h-6" />
        <span className="text-lg">Focus Now</span>
        <Users className="w-5 h-5 opacity-75" />
      </button>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <Play className="w-5 h-5 text-blue-500" />
          Start Instant Session
        </h3>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>

      {/* Duration Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          <Clock className="w-4 h-4 inline mr-2" />
          Session Duration
        </label>
        <div className="grid grid-cols-3 gap-3">
          {durations.map((duration) => (
            <button
              key={duration.value}
              onClick={() => setSelectedDuration(duration.value)}
              className={`p-3 rounded-lg border-2 transition-all ${
                selectedDuration === duration.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-lg font-semibold">{duration.label}</div>
              <div className="text-xs text-gray-500">{duration.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Mode Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Task Mode
        </label>
        <div className="grid grid-cols-3 gap-3">
          {modes.map((mode) => (
            <button
              key={mode.value}
              onClick={() => setSelectedMode(mode.value)}
              className={`p-3 rounded-lg border-2 transition-all ${
                selectedMode === mode.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-1">{mode.icon}</div>
              <div className="text-sm font-medium">{mode.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Start Button */}
      <button
        onClick={handleStartNow}
        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2"
      >
        <Play className="w-5 h-5" />
        Start {selectedDuration} min {modes.find(m => m.value === selectedMode)?.label} Session
      </button>

      <p className="text-xs text-gray-500 text-center mt-3">
        🤖 AI will match you with an available focus partner
      </p>
    </div>
  );
};

export default FocusNowButton;
