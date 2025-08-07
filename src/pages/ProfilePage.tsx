import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Camera, 
  Bell, 
  Moon, 
  Sun, 
  LogOut, 
  Target, 
  Flame, 
  Clock,
  Lightbulb
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

// Card Component
const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = "" 
}) => (
  <motion.div
    className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 ${className}`}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    {children}
  </motion.div>
);

// StatItem Component
const StatItem: React.FC<{
  icon: React.ReactNode;
  value: string;
  label: string;
  color?: string;
}> = ({ icon, value, label, color = "text-indigo-600 dark:text-indigo-400" }) => (
  <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
    <div className={`${color} flex-shrink-0`}>
      {icon}
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
    </div>
  </div>
);

// ToggleSwitch Component
const ToggleSwitch: React.FC<{
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label: string;
  description?: string;
}> = ({ enabled, onChange, label, description }) => (
  <div className="flex items-center justify-between py-3">
    <div>
      <h3 className="text-sm font-medium text-gray-900 dark:text-white">{label}</h3>
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
      )}
    </div>
    <motion.button
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
        enabled ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-600'
      }`}
      onClick={() => onChange(!enabled)}
      whileTap={{ scale: 0.95 }}
    >
      <motion.span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
        layout
      />
    </motion.button>
  </div>
);

// Mood Emoji Component
const MoodTracker: React.FC = () => {
  const recentMoods = ['😊', '🎯', '💪']; // Last 3 moods
  
  return (
    <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Recent Mood</h3>
      <div className="flex space-x-2">
        {recentMoods.map((mood, index) => (
          <motion.div
            key={index}
            className="w-10 h-10 bg-white dark:bg-gray-700 rounded-full flex items-center justify-center shadow-sm"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <span className="text-lg">{mood}</span>
          </motion.div>
        ))}
      </div>
    </Card>
  );
};

// AI Tip Card Component
const AITipCard: React.FC = () => (
  <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20">
    <div className="flex items-start space-x-3">
      <div className="flex-shrink-0">
        <Lightbulb className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">Daily AI Tip</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Try the 25-5 rule: Focus for 25 minutes, then take a 5-minute break to boost productivity.
        </p>
      </div>
    </div>
  </Card>
);

const ProfilePage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(true);
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);

  // Dummy user data
  const userData = {
    name: "George Okullo",
    email: "geokullo@gmail.com",
    avatar: "", // No avatar URL for placeholder
    stats: {
      sessionsThisWeek: 12,
      currentStreak: 5,
      avgDailyFocus: "3.2h"
    }
  };

  const handleLogout = () => {
    // Navigate to login page
    navigate('/login');
  };

  const handleAvatarEdit = () => {
    setIsEditingAvatar(true);
    // In a real app, this would open a file picker or camera
    setTimeout(() => setIsEditingAvatar(false), 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-['Inter'] py-6 px-4">
      <div className="max-w-md mx-auto lg:max-w-2xl">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Profile</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your FocusMate AI experience</p>
        </motion.div>

        {/* User Info Section */}
        <Card className="text-center mb-6">
          <div className="relative inline-block mb-4">
            {userData.avatar ? (
              <img
                src={userData.avatar}
                alt={userData.name}
                className="w-24 h-24 rounded-full border-4 border-indigo-100 dark:border-indigo-800"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold border-4 border-indigo-100 dark:border-indigo-800">
                {userData.name.charAt(0).toUpperCase()}
              </div>
            )}
            <motion.button
              className="absolute bottom-0 right-0 w-8 h-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-lg"
              onClick={handleAvatarEdit}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              disabled={isEditingAvatar}
            >
              {isEditingAvatar ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </motion.button>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
            {userData.name}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">{userData.email}</p>
        </Card>

        {/* Quick Stats */}
        <Card className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Stats</h3>
          <div className="space-y-4">
            <StatItem
              icon={<Target className="w-6 h-6" />}
              value={userData.stats.sessionsThisWeek.toString()}
              label="Sessions this week"
            />
            <StatItem
              icon={<Flame className="w-6 h-6" />}
              value={`${userData.stats.currentStreak} days`}
              label="Current streak"
              color="text-orange-600 dark:text-orange-400"
            />
            <StatItem
              icon={<Clock className="w-6 h-6" />}
              value={userData.stats.avgDailyFocus}
              label="Avg daily focus time"
              color="text-green-600 dark:text-green-400"
            />
          </div>
        </Card>

        {/* Mood Tracker */}
        <div className="mb-6">
          <MoodTracker />
        </div>

        {/* Settings */}
        <Card className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Settings</h3>
          <div className="space-y-1">
            <ToggleSwitch
              enabled={theme === 'dark'}
              onChange={toggleTheme}
              label={theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
              description="Switch between light and dark themes"
            />
            <div className="border-t border-gray-100 dark:border-gray-700"></div>
            <ToggleSwitch
              enabled={notifications}
              onChange={setNotifications}
              label="Notifications"
              description="Receive focus session reminders"
            />
          </div>
        </Card>

        {/* AI Tip Card */}
        <div className="mb-6">
          <AITipCard />
        </div>

        {/* Logout Button */}
        <motion.button
          className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-xl shadow-lg flex items-center justify-center space-x-2 transition-colors"
          onClick={handleLogout}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <LogOut className="w-5 h-5" />
          <span>Log Out</span>
        </motion.button>

        {/* Bottom Spacing */}
        <div className="h-6"></div>
      </div>
    </div>
  );
};

export default ProfilePage;
