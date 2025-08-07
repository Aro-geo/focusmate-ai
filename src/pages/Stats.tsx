import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, Clock, Brain, Calendar, LineChart, PieChart, TrendingUp, 
  Flame, BarChart, CheckCircle, Smile, Meh, Frown, Zap, Lightbulb,
  Target, Award, Timer, Activity, Sun, Moon
} from 'lucide-react';
import AdvancedChart, { 
  createProductivityChartData, 
  createPomodoroChartData, 
  createMoodChartData, 
  createTasksChartData 
} from '../components/AdvancedChart';
import { FocusTimeBarChart, TaskDistributionChart } from '../components/Charts';
import { analyticsService, AnalyticsData } from '../services/AnalyticsService';
import { useTheme } from '../context/ThemeContext';
import FloatingAssistant from '../components/FloatingAssistant';
import AnimatedPage from '../components/AnimatedPage';

const Stats: React.FC = () => {
  const { darkMode, toggleTheme } = useTheme();
  const [timePeriod, setTimePeriod] = useState<'week' | 'month' | 'quarter'>('week');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'productivity' | 'focus' | 'mood'>('overview');

  // AI Assistant state
  const [aiMessage, setAiMessage] = useState<string>("Ready to analyze your productivity patterns! Ask me about your stats or request tips for improvement.");
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiChatInput, setAiChatInput] = useState<string>('');

  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);
      try {
        const data = await analyticsService.getAnalyticsData(timePeriod);
        setAnalyticsData(data);
      } catch (error) {
        console.error('Failed to load analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [timePeriod]);
  // Extract analytics data safely
  const dailyStats = analyticsData?.dailyStats || [];
  const totalCompletedTasks = analyticsData?.totalCompletedTasks || 0;
  const totalFocusMinutes = analyticsData?.totalFocusMinutes || 0;
  const totalSessions = analyticsData?.totalSessions || 0;
  const avgFocusMinutesPerDay = dailyStats.length > 0 ? (totalFocusMinutes / dailyStats.length) : 0;
  const avgTasksPerDay = dailyStats.length > 0 ? (totalCompletedTasks / dailyStats.length).toFixed(1) : '0.0';
  const taskCategories = analyticsData?.taskCategories || [];
  // Calculate productivity score (simple algorithm for demo)
  const productivityScore = dailyStats.length > 0 ? Math.min(100, Math.round((totalFocusMinutes / (dailyStats.length * 240)) * 100)) : 0;
  // Format minutes as hours and minutes
  const formatMinutes = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };
  // AI Assistant handlers
  const handleAskAI = async () => {
    if (!aiChatInput.trim()) return;
    
    setIsAiLoading(true);
    // Mock AI response based on stats
    setTimeout(() => {
      const responses = [
        `Based on your ${formatMinutes(totalFocusMinutes)} of focus time this ${timePeriod}, you're performing well! Your productivity score of ${productivityScore} shows consistent effort.`,
        `I notice you've completed ${totalCompletedTasks} tasks with ${totalSessions} focus sessions. Try to maintain this rhythm for optimal productivity.`,
        `Your average of ${avgTasksPerDay} tasks per day is solid. Consider setting a daily goal of ${Math.ceil(parseFloat(avgTasksPerDay) * 1.2)} tasks to challenge yourself.`,
        `Looking at your patterns, you seem most effective during morning hours. Try scheduling your most important work before 2PM for best results.`
      ];
      setAiMessage(responses[Math.floor(Math.random() * responses.length)]);
      setAiChatInput('');
      setIsAiLoading(false);
    }, 1500);
  };

  const handleGetTip = async () => {
    setIsAiLoading(true);
    setTimeout(() => {
      const tips = [
        "💡 Tip: Your most productive sessions last 25-45 minutes. Try the Pomodoro technique for optimal focus.",
        "🎯 Strategy: Batch similar tasks together. Your data shows 30% efficiency gains when you group development work.",
        "⏰ Timing: Your productivity peaks between 9-11 AM. Schedule your most challenging work during this window.",
        "🔄 Balance: Take 5-10 minute breaks between sessions. Your data shows this prevents afternoon productivity drops.",
        "📊 Progress: You're improving! Your focus time has increased by 15% compared to last period."
      ];
      setAiMessage(tips[Math.floor(Math.random() * tips.length)]);
      setIsAiLoading(false);
    }, 1000);
  };

  // Get max value for the chart scaling
  const maxFocusMinutes = dailyStats.length > 0 ? Math.max(...dailyStats.map((day: any) => day.focusMinutes)) : 0;
  
  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-indigo-50 via-white to-purple-50'
    }`}>
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`transition-colors shadow-sm border-b ${
          darkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-100'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-3xl font-bold transition-colors ${
                darkMode ? 'text-white' : 'text-gray-800'
              }`}>
                Productivity Statistics
              </h1>
              <p className={`mt-1 transition-colors ${
                darkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Track your progress and identify patterns in your work habits
              </p>
            </div>
            
            {/* Theme Toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className={`p-3 rounded-xl transition-all ${
                darkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-yellow-400'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}
              title={`Switch to ${darkMode ? 'light' : 'dark'} mode`}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Time Period Filter */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className={`inline-flex rounded-xl border transition-colors ${
            darkMode 
              ? 'border-gray-700 bg-gray-800' 
              : 'border-gray-200 bg-white'
          }`}>
            {(['week', 'month', 'quarter'] as const).map((period, index) => (
              <motion.button
                key={period}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setTimePeriod(period)}
                className={`px-6 py-3 text-sm font-medium transition-all ${
                  index === 0 ? 'rounded-l-xl' : index === 2 ? 'rounded-r-xl' : ''
                } ${
                  timePeriod === period 
                    ? (darkMode 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-indigo-600 text-white')
                    : (darkMode 
                        ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                        : 'bg-white text-gray-700 hover:bg-gray-50')
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Top Stats Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {/* Focus Time Card */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className={`rounded-xl shadow-sm p-6 border transition-all hover:shadow-lg ${
              darkMode 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm mb-1 transition-colors ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Focus Time
                </p>
                <h3 className={`text-2xl font-bold transition-colors ${
                  darkMode ? 'text-white' : 'text-gray-800'
                }`}>
                  {formatMinutes(totalFocusMinutes)}
                </h3>
                <p className="text-sm text-indigo-600 mt-1">
                  ~{formatMinutes(avgFocusMinutesPerDay)}/day
                </p>
              </div>
              <div className={`p-3 rounded-lg ${
                darkMode ? 'bg-indigo-600/20' : 'bg-indigo-50'
              }`}>
                <Clock className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </motion.div>
          
          {/* Focus Sessions Card */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className={`rounded-xl shadow-sm p-6 border transition-all hover:shadow-lg ${
              darkMode 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm mb-1 transition-colors ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Focus Sessions
                </p>
                <h3 className={`text-2xl font-bold transition-colors ${
                  darkMode ? 'text-white' : 'text-gray-800'
                }`}>
                  {totalSessions}
                </h3>
                <p className="text-sm text-green-600 mt-1">
                  ~{(totalSessions / Math.max(dailyStats.length, 1)).toFixed(1)}/day
                </p>
              </div>
              <div className={`p-3 rounded-lg ${
                darkMode ? 'bg-green-600/20' : 'bg-green-50'
              }`}>
                <BarChart className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </motion.div>
          
          {/* Tasks Completed Card */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className={`rounded-xl shadow-sm p-6 border transition-all hover:shadow-lg ${
              darkMode 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm mb-1 transition-colors ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Tasks Completed
                </p>
                <h3 className={`text-2xl font-bold transition-colors ${
                  darkMode ? 'text-white' : 'text-gray-800'
                }`}>
                  {totalCompletedTasks}
                </h3>
                <p className="text-sm text-purple-600 mt-1">
                  ~{avgTasksPerDay}/day
                </p>
              </div>
              <div className={`p-3 rounded-lg ${
                darkMode ? 'bg-purple-600/20' : 'bg-purple-50'
              }`}>
                <CheckCircle className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </motion.div>
          
          {/* Productivity Score Card */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className={`rounded-xl shadow-sm p-6 border transition-all hover:shadow-lg ${
              darkMode 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm mb-1 transition-colors ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Productivity Score
                </p>
                <h3 className={`text-2xl font-bold transition-colors ${
                  darkMode ? 'text-white' : 'text-gray-800'
                }`}>
                  {productivityScore}
                </h3>
                <p className="text-sm text-amber-600 mt-1">
                  {productivityScore >= 80 ? 'Excellent!' : productivityScore >= 60 ? 'Good progress!' : 'Keep going!'}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${
                darkMode ? 'bg-amber-600/20' : 'bg-amber-50'
              }`}>
                <Flame className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </motion.div>
        </motion.div>
        
        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          
          {/* Focus Time by Day Chart */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className={`rounded-xl shadow-sm p-6 border lg:col-span-2 transition-all hover:shadow-lg ${
              darkMode 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-100'
            }`}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-lg font-semibold flex items-center transition-colors ${
                darkMode ? 'text-white' : 'text-gray-800'
              }`}>
                <LineChart className="h-5 w-5 mr-2 text-indigo-600" />
                Focus Time by Day
              </h2>
            </div>
            
            <FocusTimeBarChart 
              data={dailyStats} 
              formatMinutes={formatMinutes} 
            />
          </motion.div>
          
          {/* Task Distribution Chart */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className={`rounded-xl shadow-sm p-6 border transition-all hover:shadow-lg ${
              darkMode 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-100'
            }`}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-lg font-semibold flex items-center transition-colors ${
                darkMode ? 'text-white' : 'text-gray-800'
              }`}>
                <PieChart className="h-5 w-5 mr-2 text-purple-600" />
                Task Distribution
              </h2>
            </div>
            
            <TaskDistributionChart data={taskCategories} />
          </motion.div>
        </div>

        {/* AI Insights Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`rounded-xl shadow-sm p-6 border mb-8 transition-all hover:shadow-lg ${
            darkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-100'
          }`}
        >
          <div className="flex items-center mb-6">
            <div className={`p-2 rounded-lg mr-3 ${
              darkMode ? 'bg-purple-600/20' : 'bg-purple-50'
            }`}>
              <Brain className="h-5 w-5 text-purple-600" />
            </div>
            <h2 className={`text-lg font-semibold transition-colors ${
              darkMode ? 'text-white' : 'text-gray-800'
            }`}>
              AI Productivity Insights
            </h2>
          </div>
          
          <div className={`transition-colors ${
            darkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            <p className="mb-4">Based on your productivity patterns:</p>
            <ul className="space-y-3">
              <li className="flex items-start">
                <span className="text-indigo-600 mr-3 mt-1">•</span>
                <span>Your most productive day is <span className="font-medium">Thursday</span>, with an average of 3 hours of focus time.</span>
              </li>
              <li className="flex items-start">
                <span className="text-indigo-600 mr-3 mt-1">•</span>
                <span>You complete the most tasks when you have at least 4 focus sessions per day.</span>
              </li>
              <li className="flex items-start">
                <span className="text-indigo-600 mr-3 mt-1">•</span>
                <span>Your productivity drops by 25% after 2PM - consider scheduling your most important work in the morning.</span>
              </li>
              <li className="flex items-start">
                <span className="text-indigo-600 mr-3 mt-1">•</span>
                <span>Taking a 15-minute break after 25 minutes of focus has improved your overall productivity by 15%.</span>
              </li>
              <li className="flex items-start">
                <span className="text-indigo-600 mr-3 mt-1">•</span>
                <span>Development tasks take up most of your focus time (42.7%). Consider batching similar tasks together for better efficiency.</span>
              </li>
            </ul>
          </div>
        </motion.div>
        
        {/* Mood & Energy Levels Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className={`rounded-xl shadow-sm p-6 border transition-all hover:shadow-lg ${
            darkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-100'
          }`}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className={`text-lg font-semibold flex items-center transition-colors ${
              darkMode ? 'text-white' : 'text-gray-800'
            }`}>
              <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
              Mood & Energy Levels
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <div className="min-w-max">
              {/* Days header */}
              <div className="flex space-x-4 mb-4">
                <div className="w-20"></div>
                {dailyStats.map((day: any, idx: number) => (
                  <div key={idx} className={`w-16 text-center text-sm font-medium transition-colors ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {day.date}
                  </div>
                ))}
              </div>
              
              {/* Mood row */}
              <div className={`flex space-x-4 items-center py-4 border-b transition-colors ${
                darkMode ? 'border-gray-700 odd:bg-gray-800/50' : 'border-gray-100 odd:bg-gray-50'
              }`}>
                <div className={`w-20 text-sm font-medium transition-colors ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Mood
                </div>
                {dailyStats.map((day: any, idx: number) => (
                  <div key={idx} className="w-16 flex justify-center">
                    {day.mood === 'productive' && (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        darkMode ? 'bg-green-600/20' : 'bg-green-100'
                      }`}>
                        <Smile className="h-5 w-5 text-green-600" />
                      </div>
                    )}
                    {day.mood === 'neutral' && (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        darkMode ? 'bg-blue-600/20' : 'bg-blue-100'
                      }`}>
                        <Meh className="h-5 w-5 text-blue-600" />
                      </div>
                    )}
                    {day.mood === 'tired' && (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        darkMode ? 'bg-red-600/20' : 'bg-red-100'
                      }`}>
                        <Frown className="h-5 w-5 text-red-600" />
                      </div>
                    )}
                    {day.mood === 'energetic' && (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        darkMode ? 'bg-amber-600/20' : 'bg-amber-100'
                      }`}>
                        <Zap className="h-5 w-5 text-amber-600" />
                      </div>
                    )}
                    {day.mood === 'creative' && (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        darkMode ? 'bg-purple-600/20' : 'bg-purple-100'
                      }`}>
                        <Lightbulb className="h-5 w-5 text-purple-600" />
                      </div>
                    )}
                    {day.mood === 'reflective' && (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        darkMode ? 'bg-cyan-600/20' : 'bg-cyan-100'
                      }`}>
                        <Brain className="h-5 w-5 text-cyan-600" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Sessions row */}
              <div className={`flex space-x-4 items-center py-4 border-b transition-colors ${
                darkMode ? 'border-gray-700 even:bg-gray-800/30' : 'border-gray-100 even:bg-gray-25'
              }`}>
                <div className={`w-20 text-sm font-medium transition-colors ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Sessions
                </div>
                {dailyStats.map((day: any, idx: number) => (
                  <div key={idx} className="w-16 text-center">
                    <span className={`text-sm font-medium transition-colors ${
                      darkMode ? 'text-gray-200' : 'text-gray-800'
                    }`}>
                      {day.sessions}
                    </span>
                  </div>
                ))}
              </div>
              
              {/* Tasks row */}
              <div className={`flex space-x-4 items-center py-4 transition-colors ${
                darkMode ? 'odd:bg-gray-800/50' : 'odd:bg-gray-50'
              }`}>
                <div className={`w-20 text-sm font-medium transition-colors ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Tasks
                </div>
                {dailyStats.map((day: any, idx: number) => (
                  <div key={idx} className="w-16 text-center">
                    <span className={`text-sm font-medium transition-colors ${
                      darkMode ? 'text-gray-200' : 'text-gray-800'
                    }`}>
                      {day.completedTasks}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Floating AI Assistant - Always Visible */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed bottom-6 right-6 z-highest"
      >
        <FloatingAssistant
          isAiLoading={isAiLoading}
          aiMessage={aiMessage}
          aiChatInput={aiChatInput}
          setAiChatInput={setAiChatInput}
          onAskAI={handleAskAI}
          onGetTip={handleGetTip}
        />
      </motion.div>
    </div>
  );
};

export default Stats;
