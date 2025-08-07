import React, { useState } from 'react';
import { CheckCircle, Target, Brain, TrendingUp, Clock, Star } from 'lucide-react';
import { openAIService, AIResponse } from '../services/OpenAIService';

interface SessionData {
  id: string;
  duration: number;
  taskMode: 'work' | 'moving' | 'anything';
  startTime: Date;
  endTime: Date;
  goal?: string;
  mood?: 'great' | 'good' | 'okay' | 'tired';
  completed: boolean;
}

interface PostSessionAnalyticsProps {
  sessionData: SessionData;
  onClose: () => void;
  onSaveReflection: (reflection: string) => void;
}

const PostSessionAnalytics: React.FC<PostSessionAnalyticsProps> = ({
  sessionData,
  onClose,
  onSaveReflection
}) => {
  const [selectedMood, setSelectedMood] = useState<'great' | 'good' | 'okay' | 'tired' | null>(null);
  const [accomplishment, setAccomplishment] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [aiInsights, setAiInsights] = useState<AIResponse | null>(null);
  const [generatingInsights, setGeneratingInsights] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);

  const moods = [
    { value: 'great', emoji: '🚀', label: 'Excellent!', color: 'bg-green-100 text-green-700' },
    { value: 'good', emoji: '😊', label: 'Good', color: 'bg-blue-100 text-blue-700' },
    { value: 'okay', emoji: '😐', label: 'Okay', color: 'bg-yellow-100 text-yellow-700' },
    { value: 'tired', emoji: '😴', label: 'Tired', color: 'bg-gray-100 text-gray-700' }
  ];

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const generateAIInsights = async () => {
    if (!accomplishment.trim()) return;

    setGeneratingInsights(true);
    try {
      const insights = await openAIService.generateSessionSummary({
        duration: sessionData.duration,
        task: accomplishment,
        mood: selectedMood || 'okay',
        mode: sessionData.taskMode
      });
      setAiInsights(insights);
      setShowAiPanel(true);
    } catch (error) {
      console.error('Error generating insights:', error);
    } finally {
      setGeneratingInsights(false);
    }
  };

  const handleComplete = () => {
    const reflection = {
      mood: selectedMood,
      accomplishment,
      nextAction,
      sessionData
    };
    onSaveReflection(JSON.stringify(reflection));
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Session Complete!</h2>
                <p className="text-green-100">Great work on your focus session</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Session Summary */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Session Summary
            </h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{formatDuration(sessionData.duration)}</div>
                <div className="text-sm text-gray-600">Duration</div>
              </div>
              <div>
                <div className="text-2xl">{sessionData.taskMode === 'work' ? '💻' : sessionData.taskMode === 'moving' ? '🚶' : '✨'}</div>
                <div className="text-sm text-gray-600 capitalize">{sessionData.taskMode}</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {sessionData.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="text-sm text-gray-600">Started</div>
              </div>
            </div>
          </div>

          {/* Mood Selection */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Star className="w-5 h-5" />
              How did that session feel?
            </h3>
            <div className="grid grid-cols-4 gap-3">
              {moods.map((mood) => (
                <button
                  key={mood.value}
                  onClick={() => setSelectedMood(mood.value as any)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedMood === mood.value
                      ? 'border-blue-500 ' + mood.color
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{mood.emoji}</div>
                  <div className="text-sm font-medium">{mood.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Accomplishment Input */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Target className="w-5 h-5" />
              What did you work on?
            </h3>
            <textarea
              value={accomplishment}
              onChange={(e) => setAccomplishment(e.target.value)}
              placeholder="Describe what you accomplished in this session..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
            />
          </div>

          {/* Next Action */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">What's your next step?</h3>
            <input
              type="text"
              value={nextAction}
              onChange={(e) => setNextAction(e.target.value)}
              placeholder="Next action or task..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* AI Insights Button */}
          <div className="text-center">
            <button
              onClick={generateAIInsights}
              disabled={!accomplishment.trim() || generatingInsights}
              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 flex items-center gap-2 mx-auto"
            >
              <Brain className="w-5 h-5" />
              {generatingInsights ? 'Generating Insights...' : 'Get AI Insights'}
            </button>
          </div>

          {/* AI Insights Panel */}
          {showAiPanel && aiInsights && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-600" />
                AI Insights & Suggestions
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-purple-700 mb-2">Summary</h4>
                  <p className="text-gray-700 text-sm">{aiInsights.summary}</p>
                </div>
                {aiInsights.suggestions && aiInsights.suggestions.length > 0 && (
                  <div>
                    <h4 className="font-medium text-purple-700 mb-2">Suggestions</h4>
                    <ul className="space-y-1">
                      {aiInsights.suggestions.map((suggestion, index) => (
                        <li key={index} className="text-gray-700 text-sm flex items-start gap-2">
                          <span className="text-purple-500 mt-1">•</span>
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-all"
            >
              Skip Reflection
            </button>
            <button
              onClick={handleComplete}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200"
            >
              Save & Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostSessionAnalytics;
