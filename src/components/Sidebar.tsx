import React from 'react';
import { motion } from 'framer-motion';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Timer, 
  BookOpen, 
  BarChart3, 
  User,
  CheckSquare
} from 'lucide-react';
import StaggeredList from './StaggeredList';
import UserProfileDropdown from './UserProfileDropdown';
import { useTheme } from '../context/ThemeContext';

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  
  const navItems = [
    { to: '/app/dashboard', icon: Home, label: 'Dashboard' },
    { to: '/app/pomodoro', icon: Timer, label: 'Pomodoro' },
    { to: '/app/journal', icon: BookOpen, label: 'Journal' },
    { to: '/app/stats', icon: BarChart3, label: 'Stats' },
    { to: '/app/todos', icon: CheckSquare, label: 'Todos' },
  ];

  const handleLogout = () => {
    // In a real app, you would call your authentication service here
    // authService.logout();
    navigate('/login');
  };

  return (
    <motion.div 
      className="w-64 bg-white dark:bg-gray-900 shadow-lg h-screen flex flex-col border-r border-gray-200 dark:border-gray-700"
      initial={{ x: -260 }}
      animate={{ x: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
    >
      {/* Logo */}
      <motion.div 
        className="p-6 border-b border-gray-100 dark:border-gray-700"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center space-x-3">
          <motion.div 
            className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center"
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.5 }}
          >
            <span className="text-white font-bold text-sm">FM</span>
          </motion.div>
          <span className="text-xl font-bold text-gray-800 dark:text-white">FocusMate AI</span>
        </div>
      </motion.div>
      
      {/* Navigation */}
      <nav className="flex-1 p-4">
        <StaggeredList staggerDelay={0.1}>
          {navItems.map((item, index) => (
            <motion.div key={item.to} className="mb-2">
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 border-r-2 border-indigo-600'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-100'
                  }`
                }
              >
                {({ isActive }) => (
                  <motion.div 
                    className="flex items-center space-x-3 w-full"
                    whileHover={{ x: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <motion.div
                      animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <item.icon size={20} />
                    </motion.div>
                    <span className="font-medium">{item.label}</span>
                  </motion.div>
                )}
              </NavLink>
            </motion.div>
          ))}
        </StaggeredList>
      </nav>

      {/* User Profile at Bottom */}
      <motion.div
        className="border-t border-gray-100 dark:border-gray-700"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <UserProfileDropdown
          name="George Okullo"
          email="geokullo@gmail.com"
          onLogout={handleLogout}
          onThemeToggle={toggleTheme}
          isDarkMode={theme === 'dark'}
        />
      </motion.div>
    </motion.div>
  );
};

export default Sidebar;
