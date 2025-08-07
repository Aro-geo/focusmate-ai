import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  Moon, 
  Sun, 
  Volume2, 
  VolumeX, 
  Shield, 
  User, 
  Settings as SettingsIcon,
  Save,
  ArrowLeft
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

// ToggleSwitch Component (reused from ProfilePage)
const ToggleSwitch: React.FC<{
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label: string;
  description?: string;
}> = ({ enabled, onChange, label, description }) => (
  <div className="flex items-center justify-between py-4">
    <div>
      <h3 className="text-sm font-medium text-gray-900 dark:text-white">{label}</h3>
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{description}</p>
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

const SettingsPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  // Settings state
  const [notifications, setNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [sessionReminders, setSessionReminders] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(true);
  const [autoSave, setAutoSave] = useState(true);

  const handleSave = () => {
    // In a real app, this would save to backend
    console.log('Settings saved');
  };

  const handleBack = () => {
    navigate('/app/profile');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-['Inter'] py-6 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center space-x-4">
            <motion.button
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={handleBack}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
              <p className="text-gray-600 dark:text-gray-400">Customize your FocusMate AI experience</p>
            </div>
          </div>
          
          <SettingsIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
        </motion.div>

        {/* Appearance Settings */}
        <Card className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            {theme === 'dark' ? <Moon className="w-5 h-5 mr-2" /> : <Sun className="w-5 h-5 mr-2" />}
            Appearance
          </h3>
          <ToggleSwitch
            enabled={theme === 'dark'}
            onChange={toggleTheme}
            label={theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
            description="Switch between light and dark themes"
          />
        </Card>

        {/* Notification Settings */}
        <Card className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Bell className="w-5 h-5 mr-2" />
            Notifications
          </h3>
          <div className="space-y-1 divide-y divide-gray-100 dark:divide-gray-700">
            <ToggleSwitch
              enabled={notifications}
              onChange={setNotifications}
              label="Push Notifications"
              description="Receive browser notifications for sessions"
            />
            <ToggleSwitch
              enabled={sessionReminders}
              onChange={setSessionReminders}
              label="Session Reminders"
              description="Get reminded when it's time to focus"
            />
            <ToggleSwitch
              enabled={emailNotifications}
              onChange={setEmailNotifications}
              label="Email Notifications"
              description="Receive weekly progress reports via email"
            />
            <ToggleSwitch
              enabled={weeklyReports}
              onChange={setWeeklyReports}
              label="Weekly Reports"
              description="Get detailed analytics every week"
            />
          </div>
        </Card>

        {/* Audio Settings */}
        <Card className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            {soundEnabled ? <Volume2 className="w-5 h-5 mr-2" /> : <VolumeX className="w-5 h-5 mr-2" />}
            Audio
          </h3>
          <ToggleSwitch
            enabled={soundEnabled}
            onChange={setSoundEnabled}
            label="Sound Effects"
            description="Play sounds for session start/end and breaks"
          />
        </Card>

        {/* Privacy Settings */}
        <Card className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Privacy & Data
          </h3>
          <div className="space-y-1 divide-y divide-gray-100 dark:divide-gray-700">
            <ToggleSwitch
              enabled={autoSave}
              onChange={setAutoSave}
              label="Auto-save Sessions"
              description="Automatically save your focus session data"
            />
            <div className="py-4">
              <button className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300">
                Export My Data
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Download all your focus session data
              </p>
            </div>
            <div className="py-4">
              <button className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300">
                Delete Account
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Permanently delete your account and data
              </p>
            </div>
          </div>
        </Card>

        {/* Account Settings */}
        <Card className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <User className="w-5 h-5 mr-2" />
            Account
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Display Name
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                defaultValue="George Okullo"
                placeholder="Enter your display name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                defaultValue="geokullo@gmail.com"
                placeholder="Enter your email address"
              />
            </div>
          </div>
        </Card>

        {/* Save Button */}
        <motion.button
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-xl shadow-lg flex items-center justify-center space-x-2 transition-colors"
          onClick={handleSave}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Save className="w-5 h-5" />
          <span>Save Settings</span>
        </motion.button>

        {/* Bottom Spacing */}
        <div className="h-6"></div>
      </div>
    </div>
  );
};

export default SettingsPage;
