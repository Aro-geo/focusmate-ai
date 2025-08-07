import React, { useState } from 'react';
import { 
  Calendar, 
  FileText, 
  Save, 
  Trash2, 
  PlusCircle, 
  Brain, 
  Search,
  Download,
  Filter,
  TrendingUp,
  Lightbulb,
  Tag,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import FloatingAssistant from '../components/FloatingAssistant';

interface JournalEntry {
  id: string;
  date: string;
  content: string;
  mood: string;
  tags: string[];
  title?: string;
}

interface MoodData {
  date: string;
  mood: string;
  value: number; // 1-5 scale for graphing
}

const Journal: React.FC = () => {
  const { darkMode } = useTheme();

  // Mood emojis mapping
  const moodEmojis = {
    'excited': '🤩',
    'happy': '😊',
    'neutral': '😐',
    'tired': '😴',
    'frustrated': '😤',
    'sad': '😢',
    'productive': '💪',
    'creative': '🎨',
    'reflective': '🤔',
    'grateful': '🙏'
  };

  // Mock mood trend data (last 7 days)
  const moodTrendData: MoodData[] = [
    { date: '2024-01-20', mood: 'happy', value: 4 },
    { date: '2024-01-21', mood: 'productive', value: 5 },
    { date: '2024-01-22', mood: 'neutral', value: 3 },
    { date: '2024-01-23', mood: 'excited', value: 5 },
    { date: '2024-01-24', mood: 'tired', value: 2 },
    { date: '2024-01-25', mood: 'creative', value: 4 },
    { date: '2024-01-26', mood: 'grateful', value: 5 }
  ];

  // Auto-suggestions
  const autoSuggestions = [
    "What went well today?",
    "What could I improve tomorrow?",
    "What am I grateful for?",
    "What challenges did I face?",
    "What did I learn today?",
    "How did I feel during work sessions?",
    "What motivated me today?",
    "What distracted me the most?"
  ];

  // Sample entries with more data
  const [entries, setEntries] = useState<JournalEntry[]>([
    {
      id: '1',
      date: '2024-01-26',
      title: 'Productive Coding Session',
      content: 'Today I completed the dashboard component for the FocusMate AI app. I found myself getting into flow state after about 25 minutes of work. The Pomodoro technique helped me maintain focus throughout the session. Really excited about the progress!',
      mood: 'productive',
      tags: ['coding', 'react', 'productivity', 'flow-state']
    },
    {
      id: '2',
      date: '2024-01-25',
      title: 'Reflection on Challenges',
      content: 'I struggled with motivation today. After analyzing my patterns, I realized I need to start with smaller tasks to build momentum before tackling the larger project requirements. This insight will help me structure my work better.',
      mood: 'reflective',
      tags: ['challenges', 'planning', 'self-awareness', 'motivation']
    },
    {
      id: '3',
      date: '2024-01-24',
      title: 'Team Collaboration',
      content: 'Had a great brainstorming session with the team today. We came up with some innovative solutions for the user interface. Feeling grateful for having such creative colleagues to work with.',
      mood: 'grateful',
      tags: ['teamwork', 'creativity', 'brainstorming', 'ui-design']
    }
  ]);

  // State
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [currentEntry, setCurrentEntry] = useState<string>('');
  const [currentTitle, setCurrentTitle] = useState<string>('');
  const [currentMood, setCurrentMood] = useState<string>('neutral');
  const [currentTags, setCurrentTags] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedMoodFilter, setSelectedMoodFilter] = useState<string>('all');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('all');
  const [showCalendarFilter, setShowCalendarFilter] = useState<boolean>(false);
  const [aiInsight, setAiInsight] = useState<string>('');
  const [isGeneratingInsight, setIsGeneratingInsight] = useState<boolean>(false);

  // AI Assistant state
  const [aiMessage, setAiMessage] = useState<string>("Ready to help you reflect on your thoughts and experiences! Ask me about journaling techniques or insights.");
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiChatInput, setAiChatInput] = useState<string>('');

  // Filtered entries
  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesMood = selectedMoodFilter === 'all' || entry.mood === selectedMoodFilter;
    const matchesTag = selectedTagFilter === 'all' || entry.tags.includes(selectedTagFilter);
    
    return matchesSearch && matchesMood && matchesTag;
  });

  // Get unique tags for filter
  const allTags = Array.from(new Set(entries.flatMap(entry => entry.tags)));

  // Functions
  const handleSaveEntry = () => {
    if (!currentEntry.trim()) return;
    
    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      date: selectedDate,
      title: currentTitle.trim() || `Entry ${new Date(selectedDate).toLocaleDateString()}`,
      content: currentEntry,
      mood: currentMood,
      tags: currentTags.split(',').map(tag => tag.trim()).filter(tag => tag !== '')
    };
    
    setEntries([newEntry, ...entries]);
    
    // Reset form
    setCurrentEntry('');
    setCurrentTitle('');
    setCurrentMood('neutral');
    setCurrentTags('');
  };

  const handleDeleteEntry = (id: string) => {
    setEntries(entries.filter(entry => entry.id !== id));
  };

  const handleGenerateInsight = async () => {
    setIsGeneratingInsight(true);
    
    // Mock AI insight generation with realistic delay
    setTimeout(() => {
      const insights = [
        "Based on your recent entries, you seem most productive when you start with smaller tasks. Consider breaking larger projects into 25-minute focused sessions.",
        "Your mood patterns show higher satisfaction on days when you practice gratitude. Try incorporating more reflection on positive experiences.",
        "You mention 'flow state' frequently in productive sessions. Identifying your optimal work environment could help recreate these conditions.",
        "Your entries show a pattern of breakthrough insights during collaborative work. Consider scheduling more brainstorming sessions.",
        "You tend to be more reflective after challenging days. This self-awareness is a strength that helps you grow and improve."
      ];
      
      const randomInsight = insights[Math.floor(Math.random() * insights.length)];
      setAiInsight(randomInsight);
      setIsGeneratingInsight(false);
    }, 2000);
  };

  const handleExport = () => {
    // Mock export functionality
    console.log('Exporting journal entries...');
    alert('Journal exported successfully! (This is a demo)');
  };

  const addSuggestionToEntry = (suggestion: string) => {
    setCurrentEntry(prev => prev ? `${prev}\n\n${suggestion} ` : `${suggestion} `);
  };

  // AI Assistant handlers
  const handleAskAI = async () => {
    if (!aiChatInput.trim()) return;
    
    setIsAiLoading(true);
    // Mock AI response
    setTimeout(() => {
      const responses = [
        "That's a great question about journaling! Regular reflection can significantly improve self-awareness and goal achievement.",
        "I notice you're interested in improving your journaling practice. Try setting a consistent time each day for reflection.",
        "Based on journaling research, writing about both challenges and successes can lead to better emotional processing and problem-solving.",
        "Consider using the 'Three Good Things' technique - write about three positive experiences each day and why they were meaningful."
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
        "💡 Tip: Try the 'Morning Pages' technique - write three pages of stream-of-consciousness thoughts each morning.",
        "✨ Insight: End each entry with one thing you're grateful for to boost positive emotions.",
        "🎯 Strategy: Use the STAR method (Situation, Task, Action, Result) to structure problem-solving entries.",
        "🌱 Growth: Review your entries weekly to identify patterns and areas for improvement."
      ];
      setAiMessage(tips[Math.floor(Math.random() * tips.length)]);
      setIsAiLoading(false);
    }, 1000);
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
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8"
        >
          <div>
            <h1 className={`text-4xl font-bold mb-2 ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Reflection Journal
            </h1>
            <p className={`text-lg ${
              darkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Capture thoughts, track moods, and gain insights
            </p>
          </div>
          
          {/* Top-right actions */}
          <div className="flex items-center space-x-3 mt-4 lg:mt-0">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCalendarFilter(!showCalendarFilter)}
              className={`flex items-center px-4 py-2 rounded-xl border transition-all ${
                darkMode
                  ? 'bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Filter
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleExport}
              className={`flex items-center px-4 py-2 rounded-xl transition-all ${
                darkMode
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </motion.button>
          </div>
        </motion.div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Entry List (2/3 width on desktop) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Search and Filters */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`rounded-2xl p-6 ${
                darkMode 
                  ? 'bg-gray-800/50 border border-gray-700' 
                  : 'bg-white/70 border border-white/20 shadow-lg backdrop-blur-sm'
              }`}
            >
              {/* Search Bar */}
              <div className="relative mb-4">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search entries, tags, or content..."
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                  } focus:ring-2 focus:ring-blue-500/20 focus:outline-none`}
                />
              </div>

              {/* Filter Pills */}
              <div className="flex flex-wrap gap-3">
                {/* Mood Filter */}
                <select
                  value={selectedMoodFilter}
                  onChange={(e) => setSelectedMoodFilter(e.target.value)}
                  title="Filter by mood"
                  className={`px-3 py-2 rounded-lg border text-sm ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="all">All Moods</option>
                  {Object.keys(moodEmojis).map(mood => (
                    <option key={mood} value={mood}>
                      {moodEmojis[mood as keyof typeof moodEmojis]} {mood}
                    </option>
                  ))}
                </select>

                {/* Tag Filter */}
                <select
                  value={selectedTagFilter}
                  onChange={(e) => setSelectedTagFilter(e.target.value)}
                  title="Filter by tag"
                  className={`px-3 py-2 rounded-lg border text-sm ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="all">All Tags</option>
                  {allTags.map((tag: string) => (
                    <option key={tag} value={tag}>#{tag}</option>
                  ))}
                </select>

                {/* Clear Filters */}
                {(searchTerm || selectedMoodFilter !== 'all' || selectedTagFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedMoodFilter('all');
                      setSelectedTagFilter('all');
                    }}
                    className={`flex items-center px-3 py-2 rounded-lg text-sm transition-all ${
                      darkMode
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                    }`}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear
                  </button>
                )}
              </div>
            </motion.div>

            {/* Mood Trend Mini-Graph */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className={`rounded-2xl p-6 ${
                darkMode 
                  ? 'bg-gray-800/50 border border-gray-700' 
                  : 'bg-white/70 border border-white/20 shadow-lg backdrop-blur-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold flex items-center ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Mood Trend (7 Days)
                </h3>
              </div>
              
              <div className="flex items-end justify-between h-20 space-x-2">
                {moodTrendData.map((data, index) => {
                  const heightClass = data.value === 5 ? 'h-20' :
                                    data.value === 4 ? 'h-16' :
                                    data.value === 3 ? 'h-12' :
                                    data.value === 2 ? 'h-8' : 'h-4';
                  
                  return (
                    <div key={index} className="flex flex-col items-center flex-1">
                      <div 
                        className={`w-full rounded-t transition-all ${heightClass} ${
                          data.value >= 4 ? 'bg-green-500' :
                          data.value >= 3 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                      />
                      <div className="text-center mt-2">
                        <div className="text-lg">{moodEmojis[data.mood as keyof typeof moodEmojis]}</div>
                        <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {new Date(data.date).toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Entries List */}
            <div className="space-y-4">
              <AnimatePresence>
                {filteredEntries.map((entry, index) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                    className={`rounded-2xl p-6 transition-all hover:shadow-lg ${
                      darkMode 
                        ? 'bg-gray-800/50 border border-gray-700 hover:bg-gray-800/70' 
                        : 'bg-white/70 border border-white/20 shadow-lg backdrop-blur-sm hover:bg-white/90'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-2xl">{moodEmojis[entry.mood as keyof typeof moodEmojis]}</span>
                          <h3 className={`text-lg font-semibold ${
                            darkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {entry.title}
                          </h3>
                        </div>
                        <p className={`text-sm mb-2 ${
                          darkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {new Date(entry.date).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteEntry(entry.id)}
                        title="Delete entry"
                        className={`p-2 rounded-lg transition-all ${
                          darkMode
                            ? 'text-gray-400 hover:text-red-400 hover:bg-gray-700'
                            : 'text-gray-400 hover:text-red-500 hover:bg-gray-100'
                        }`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <p className={`mb-4 leading-relaxed ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {entry.content}
                    </p>
                    
                    {entry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {entry.tags.map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            className={`px-3 py-1 rounded-full text-sm ${
                              darkMode
                                ? 'bg-gray-700 text-gray-300'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {filteredEntries.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`text-center py-12 rounded-2xl ${
                    darkMode 
                      ? 'bg-gray-800/50 border border-gray-700' 
                      : 'bg-white/70 border border-white/20 shadow-lg backdrop-blur-sm'
                  }`}
                >
                  <FileText className={`w-12 h-12 mx-auto mb-4 ${
                    darkMode ? 'text-gray-500' : 'text-gray-400'
                  }`} />
                  <p className={`text-lg ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    No entries found. Start writing to capture your thoughts!
                  </p>
                </motion.div>
              )}
            </div>
          </div>

          {/* Right Column - Create Entry Form (1/3 width on desktop) */}
          <div className="space-y-6">
            
            {/* New Entry Form */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`rounded-2xl p-6 ${
                darkMode 
                  ? 'bg-gray-800/50 border border-gray-700' 
                  : 'bg-white/70 border border-white/20 shadow-lg backdrop-blur-sm'
              }`}
            >
              <h2 className={`text-xl font-semibold mb-6 flex items-center ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                <PlusCircle className="w-5 h-5 mr-2" />
                New Entry
              </h2>

              {/* Date Picker */}
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  title="Select date for journal entry"
                  className={`w-full p-3 rounded-xl border transition-all ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none`}
                />
              </div>

              {/* Title Input */}
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Title (Optional)
                </label>
                <input
                  type="text"
                  value={currentTitle}
                  onChange={(e) => setCurrentTitle(e.target.value)}
                  placeholder="Give your entry a title..."
                  className={`w-full p-3 rounded-xl border transition-all ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none`}
                />
              </div>

              {/* Mood Selection (Emoji) */}
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-3 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  How are you feeling?
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {Object.entries(moodEmojis).map(([mood, emoji]) => (
                    <button
                      key={mood}
                      onClick={() => setCurrentMood(mood)}
                      className={`p-3 rounded-xl text-2xl transition-all hover:scale-110 ${
                        currentMood === mood
                          ? (darkMode ? 'bg-blue-600 ring-2 ring-blue-400' : 'bg-blue-100 ring-2 ring-blue-500')
                          : (darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100')
                      }`}
                      title={mood}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <p className={`text-xs mt-2 text-center capitalize ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {currentMood}
                </p>
              </div>

              {/* Auto-suggestions */}
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-3 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  <Lightbulb className="w-4 h-4 inline mr-1" />
                  Writing Prompts
                </label>
                <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                  {autoSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => addSuggestionToEntry(suggestion)}
                      className={`text-left p-2 rounded-lg text-sm transition-all ${
                        darkMode
                          ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content Textarea */}
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Your thoughts
                </label>
                <textarea
                  value={currentEntry}
                  onChange={(e) => setCurrentEntry(e.target.value)}
                  placeholder="What's on your mind today? Reflect on your experiences, challenges, achievements, or insights..."
                  rows={8}
                  className={`w-full p-3 rounded-xl border transition-all resize-none ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none`}
                />
              </div>

              {/* Tags Input */}
              <div className="mb-6">
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  <Tag className="w-4 h-4 inline mr-1" />
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={currentTags}
                  onChange={(e) => setCurrentTags(e.target.value)}
                  placeholder="productivity, learning, challenges, growth..."
                  className={`w-full p-3 rounded-xl border transition-all ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none`}
                />
              </div>

              {/* Save Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSaveEntry}
                disabled={!currentEntry.trim()}
                className={`w-full py-3 rounded-xl font-medium transition-all ${
                  currentEntry.trim()
                    ? (darkMode 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'bg-blue-500 hover:bg-blue-600 text-white')
                    : (darkMode 
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed')
                }`}
              >
                <Save className="w-5 h-5 inline mr-2" />
                Save Entry
              </motion.button>
            </motion.div>

            {/* AI Insights Card */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className={`rounded-2xl p-6 ${
                darkMode 
                  ? 'bg-gray-800/50 border border-gray-700' 
                  : 'bg-white/70 border border-white/20 shadow-lg backdrop-blur-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold flex items-center ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  <Brain className="w-5 h-5 mr-2" />
                  AI Insights
                </h3>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleGenerateInsight}
                  disabled={isGeneratingInsight}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    darkMode
                      ? 'bg-purple-600 hover:bg-purple-700 text-white disabled:bg-gray-700'
                      : 'bg-purple-500 hover:bg-purple-600 text-white disabled:bg-gray-300'
                  } disabled:cursor-not-allowed`}
                >
                  {isGeneratingInsight ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating...
                    </div>
                  ) : (
                    'Generate Insight'
                  )}
                </motion.button>
              </div>

              {aiInsight ? (
                <div className={`p-4 rounded-xl ${
                  darkMode ? 'bg-gray-700/50' : 'bg-purple-50'
                }`}>
                  <p className={`leading-relaxed ${
                    darkMode ? 'text-gray-300' : 'text-purple-900'
                  }`}>
                    {aiInsight}
                  </p>
                </div>
              ) : (
                <p className={`text-sm ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Get AI-powered insights about your journaling patterns, mood trends, and personal growth opportunities.
                </p>
              )}
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

export default Journal;
