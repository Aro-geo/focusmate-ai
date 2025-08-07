import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  CheckCircle2, 
  Circle, 
  Play, 
  Pause, 
  Brain, 
  Lightbulb,
  Smile,
  Meh,
  Frown,
  Coffee,
  Target,
  Clock,
  TrendingUp,
  BookOpen,
  MessageCircle,
  Loader,
  RefreshCw
} from 'lucide-react';
import AnimatedPage from '../components/AnimatedPage';
import FloatingCard from '../components/FloatingCard';
import StaggeredList from '../components/StaggeredList';
import FloatingAssistant from '../components/FloatingAssistant';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { openAIService } from '../services/OpenAIService';
import { UserDataService, userDataService } from '../services/UserDataService';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const { userData, isLoading, error, refreshUserData, getGreeting } = useUser();
  
  const [newTask, setNewTask] = React.useState('');
  const [pomodoroActive, setPomodoroActive] = React.useState(false);
  const [pomodoroTime, setPomodoroTime] = React.useState(25 * 60); // 25 minutes in seconds
  const [selectedMood, setSelectedMood] = React.useState<string | null>(null);
  
  // AI Assistant states
  const [aiMessage, setAiMessage] = React.useState("Welcome! I'm here to help you stay focused and productive.");
  const [isAiLoading, setIsAiLoading] = React.useState(false);
  const [aiChatInput, setAiChatInput] = React.useState('');

  const moods = [
    { id: 'great', icon: Smile, label: 'Great', color: 'text-green-500' },
    { id: 'okay', icon: Meh, label: 'Okay', color: 'text-yellow-500' },
    { id: 'tired', icon: Frown, label: 'Tired', color: 'text-red-500' },
  ];

  // Load initial AI message when user data is available
  React.useEffect(() => {
    if (userData && !isLoading) {
      const incompleteTasks = userData.tasks.filter(task => task.status === 'pending');
      if (incompleteTasks.length > 0) {
        setAiMessage(`${getGreeting()}! You have ${incompleteTasks.length} pending tasks. Let's tackle them one by one!`);
      } else {
        setAiMessage(`${getGreeting()}! Great job on completing your tasks. Ready for something new?`);
      }
    }
  }, [userData, isLoading, getGreeting]);

  const addTask = async () => {
    if (newTask.trim()) {
      try {
        const result = await userDataService.addTask(newTask.trim());
        if (result.success) {
          setNewTask('');
          // Refresh user data to get updated tasks
          await refreshUserData();
          setAiMessage(`Great! I added "${newTask}" to your tasks. Let's get it done!`);
        } else {
          setAiMessage(`Sorry, I couldn't add that task: ${result.message}`);
        }
      } catch (error) {
        console.error('Error adding task:', error);
        setAiMessage('Sorry, there was an error adding that task. Please try again.');
      }
    }
  };

  const toggleTask = async (taskId: number) => {
    try {
      const result = await userDataService.toggleTask(taskId);
      if (result.success) {
        // Refresh user data to get updated tasks
        await refreshUserData();
        const task = userData?.tasks.find(t => t.id === taskId);
        if (task) {
          const newStatus = task.status === 'completed' ? 'pending' : 'completed';
          setAiMessage(newStatus === 'completed' 
            ? `Excellent! You completed "${task.title}". Keep up the great work!`
            : `Task "${task.title}" marked as pending. You can do it!`);
        }
      } else {
        setAiMessage(`Sorry, I couldn't update that task: ${result.message}`);
      }
    } catch (error) {
      console.error('Error toggling task:', error);
      setAiMessage('Sorry, there was an error updating that task. Please try again.');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // AI Assistant functions
  const handleAskAI = async () => {
    if (!aiChatInput.trim() || !userData) return;
    
    setIsAiLoading(true);
    try {
      const incompleteTasks = userData.tasks.filter(task => task.status === 'pending');
      const context = `User: ${userData.username}. Current tasks: ${incompleteTasks.map(t => t.title).join(', ')}. Completed: ${userData.stats.completedTasks}/${userData.stats.totalTasks} tasks. Mood: ${selectedMood || 'not set'}.`;
      
      const response = await openAIService.chat(aiChatInput, context);
      setAiMessage(response);
      setAiChatInput('');
    } catch (error) {
      console.error('AI chat error:', error);
      setAiMessage("I'm having trouble connecting right now. Try taking a short break and then let's tackle your tasks together!");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleGetTip = async () => {
    if (!userData) return;
    
    setIsAiLoading(true);
    try {
      const incompleteTasks = userData.tasks.filter(task => task.status === 'pending');
      const highPriorityTasks = incompleteTasks.filter(task => task.priority === 'high');
      
      let tipContext = `User has ${incompleteTasks.length} remaining tasks`;
      if (highPriorityTasks.length > 0) {
        tipContext += ` with ${highPriorityTasks.length} high priority tasks: ${highPriorityTasks.map(t => t.title).join(', ')}`;
      }
      if (selectedMood) {
        tipContext += `. Current mood: ${selectedMood}`;
      }
      
      const suggestions = await openAIService.getFocusSuggestions(
        incompleteTasks.length > 0 ? incompleteTasks[0].title : 'general productivity',
        pomodoroTime / 60,
        selectedMood === 'tired' ? 'fatigue' : undefined
      );
      
      setAiMessage(suggestions.length > 0 ? suggestions[0] : "Focus on one task at a time and take regular breaks!");
    } catch (error) {
      console.error('AI tip error:', error);
      setAiMessage("Here's a quick tip: Break your next task into smaller 15-minute chunks for better focus!");
    } finally {
      setIsAiLoading(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <AnimatedPage>
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900/20 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center space-y-4"
          >
            <Loader className="w-8 h-8 animate-spin text-indigo-600" />
            <p className="text-gray-600 dark:text-gray-300">Loading your dashboard...</p>
          </motion.div>
        </div>
      </AnimatedPage>
    );
  }

  // Error state
  if (error) {
    return (
      <AnimatedPage>
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900/20 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center space-y-4 text-center max-w-md"
          >
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <span className="text-red-600 text-2xl">⚠️</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Something went wrong</h2>
            <p className="text-gray-600 dark:text-gray-300">{error}</p>
            <button
              onClick={refreshUserData}
              className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Try Again</span>
            </button>
          </motion.div>
        </div>
      </AnimatedPage>
    );
  }

  // No user data
  if (!userData) {
    return null;
  }

  const userDisplayName = UserDataService.formatUserDisplayName(userData);
  const greeting = getGreeting();
  const pendingTasks = userData.tasks.filter(task => task.status === 'pending');
  const completedTasks = userData.stats.completedTasks;
  const totalTasks = userData.stats.totalTasks;

  return (
    <AnimatedPage>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900/20">
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-100 dark:border-gray-700 px-8 py-6"
        >
          <div className="flex justify-between items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                {greeting}, {userDisplayName}!
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                {pendingTasks.length > 0 
                  ? `You have ${pendingTasks.length} tasks to complete today.`
                  : "All caught up! Ready for something new?"
                }
              </p>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex items-center space-x-4"
            >
              <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400">Today's Progress</p>
                <motion.p 
                  className="text-2xl font-bold text-indigo-600 dark:text-indigo-400"
                  key={`${completedTasks}-${totalTasks}`}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {completedTasks}/{totalTasks}
                </motion.p>
              </div>
            </motion.div>
          </div>
        </motion.header>

        {/* Main Dashboard Content */}
        <div className="p-8">
          <div className="grid grid-cols-2 gap-8">
            
            {/* Left Column - Daily Tasks & Pomodoro */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <FloatingCard 
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700"
                delay={0.1}
              >
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Today's Overview</h3>
                <div className="grid grid-cols-2 gap-4">
                  <motion.div 
                    className="text-center p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Target className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mx-auto mb-2" />
                    <motion.p 
                      className="text-2xl font-bold text-indigo-600 dark:text-indigo-400"
                      key={completedTasks}
                      initial={{ scale: 1.2 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {completedTasks}
                    </motion.p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Completed</p>
                  </motion.div>
                  <motion.div 
                    className="text-center p-4 bg-purple-50 dark:bg-purple-900/30 rounded-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                    <motion.p 
                      className="text-2xl font-bold text-purple-600 dark:text-purple-400"
                      key={userData?.focusTime || 0}
                      initial={{ scale: 1.2 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {userData?.focusTime || '0m'}
                    </motion.p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Focused</p>
                  </motion.div>
                </div>
              </FloatingCard>

              {/* Daily Tasks */}
              <FloatingCard 
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700"
                delay={0.2}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Daily Tasks</h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{completedTasks}/{totalTasks} completed</span>
                </div>
                
                {/* Add new task */}
                <motion.div 
                  className="flex space-x-2 mb-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <input
                    type="text"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    placeholder="Add a new task..."
                    className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    onKeyPress={(e) => e.key === 'Enter' && addTask()}
                  />
                  <motion.button
                    onClick={addTask}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    title="Add task"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Plus size={18} />
                  </motion.button>
                </motion.div>

                {/* Task list */}
                <StaggeredList className="space-y-3" staggerDelay={0.05}>
                  {userData?.tasks?.map((task) => (
                    <motion.div
                      key={task.id}
                      className={`flex items-center space-x-3 p-3 rounded-lg border transition-all ${
                        task.status === 'completed'
                          ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700'
                          : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                      whileHover={{ x: 5 }}
                      layout
                    >
                      <motion.button
                        onClick={() => toggleTask(task.id)}
                        className={`transition-colors ${
                        task.status === 'completed' ? 'text-green-600 dark:text-green-400' : 'text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                      }`}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {task.status === 'completed' ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                    </motion.button>
                    <span
                      className={`flex-1 ${
                        task.status === 'completed' ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-700 dark:text-gray-200'
                      }`}
                    >
                      {task.title}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        task.priority === 'high'
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                          : task.priority === 'medium'
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {task.priority}
                    </span>
                  </motion.div>
                  )) || []}
                </StaggeredList>
              </FloatingCard>

              {/* Pomodoro Timer */}
              <FloatingCard 
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700"
                delay={0.4}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Pomodoro Timer</h3>
                  <Coffee className="w-5 h-5 text-gray-400" />
                </div>
                
                <div className="text-center">
                  <motion.div 
                    className="text-4xl font-bold text-gray-800 dark:text-white mb-4"
                    key={pomodoroTime}
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {formatTime(pomodoroTime)}
                  </motion.div>
                  
                  <div className="flex justify-center space-x-4 mb-4">
                    <motion.button
                      onClick={() => setPomodoroActive(!pomodoroActive)}
                      className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                        pomodoroActive
                          ? 'bg-red-500 text-white hover:bg-red-600'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {pomodoroActive ? (
                        <>
                          <Pause className="w-4 h-4 inline mr-2" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 inline mr-2" />
                          Start
                        </>
                      )}
                    </motion.button>
                    <motion.button
                      onClick={() => {
                        setPomodoroTime(25 * 60);
                        setPomodoroActive(false);
                      }}
                      className="px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Reset
                    </motion.button>
                  </div>

                  <div className="flex justify-center space-x-2">
                    {[25, 15, 5].map((minutes) => (
                      <motion.button
                        key={minutes}
                        onClick={() => setPomodoroTime(minutes * 60)}
                        className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {minutes}m
                      </motion.button>
                    ))}
                  </div>
                </div>
              </FloatingCard>

              {/* Productivity Tip */}
              <FloatingCard 
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700"
                delay={0.5}
              >
                <motion.div 
                  className="flex items-center space-x-3 mb-3"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Today's Tip</h3>
                </motion.div>
                <motion.p 
                  className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  Try the 2-minute rule: If a task takes less than 2 minutes, do it immediately 
                  instead of adding it to your to-do list. This prevents small tasks from accumulating.
                </motion.p>
              </FloatingCard>
            </div>

            {/* Right Column - Mood & Quick Actions */}
            <div className="space-y-6">
              {/* Mood Selector */}
              <FloatingCard 
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700"
                delay={0.6}
              >
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">How are you feeling?</h3>
                <StaggeredList className="grid grid-cols-1 gap-3" staggerDelay={0.1}>
                  {moods.map((mood) => (
                    <motion.button
                      key={mood.id}
                      onClick={() => setSelectedMood(mood.id)}
                      className={`flex items-center space-x-3 p-3 rounded-lg border transition-all ${
                        selectedMood === mood.id
                          ? 'border-indigo-300 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                      whileHover={{ scale: 1.02, x: 5 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <mood.icon className={`w-6 h-6 ${mood.color}`} />
                      <span className="font-medium text-gray-700 dark:text-gray-200">{mood.label}</span>
                    </motion.button>
                  ))}
                </StaggeredList>
              </FloatingCard>

              {/* Quick Actions */}
              <FloatingCard 
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700"
                delay={0.7}
              >
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Quick Actions</h3>
                <StaggeredList className="space-y-3" staggerDelay={0.1}>
                  <motion.button 
                    className="w-full flex items-center space-x-3 p-3 text-left bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all"
                    whileHover={{ scale: 1.02, x: 5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/app/journal')}
                  >
                    <BookOpen className="w-5 h-5" />
                    <span>New Journal Entry</span>
                  </motion.button>
                  <motion.button 
                    className="w-full flex items-center space-x-3 p-3 text-left bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    whileHover={{ scale: 1.02, x: 5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/app/stats')}
                  >
                    <TrendingUp className="w-5 h-5" />
                    <span>View Analytics</span>
                  </motion.button>
                  <motion.button 
                    className="w-full flex items-center space-x-3 p-3 text-left bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    whileHover={{ scale: 1.02, x: 5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/app/profile')}
                  >
                    <Target className="w-5 h-5" />
                    <span>Set Goals</span>
                  </motion.button>
                </StaggeredList>
              </FloatingCard>

              {/* Weekly Progress */}
              <FloatingCard 
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700"
                delay={0.8}
              >
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">This Week</h3>
                <div className="space-y-4">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.0 }}
                  >
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <span>Tasks Completed</span>
                      <span>12/15</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <motion.div 
                        className="bg-indigo-600 dark:bg-indigo-500 h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: "80%" }}
                        transition={{ delay: 1.2, duration: 1, ease: "easeOut" }}
                      ></motion.div>
                    </div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.1 }}
                  >
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <span>Focus Time</span>
                      <span>18h / 25h</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <motion.div 
                        className="bg-purple-600 dark:bg-purple-500 h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: "75%" }}
                        transition={{ delay: 1.3, duration: 1, ease: "easeOut" }}
                      ></motion.div>
                    </div>
                  </motion.div>
                </div>
              </FloatingCard>
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
    </AnimatedPage>
  );
};

export default Dashboard;
