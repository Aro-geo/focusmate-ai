import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Settings, Moon, Sun, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UserProfileDropdownProps {
  name: string;
  email: string;
  avatarUrl?: string;
  onLogout: () => void;
  onThemeToggle: () => void;
  isDarkMode: boolean;
}

const UserProfileDropdown: React.FC<UserProfileDropdownProps> = ({
  name,
  email,
  avatarUrl,
  onLogout,
  onThemeToggle,
  isDarkMode
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleProfileClick = () => {
    navigate('/app/profile');
    setIsOpen(false);
  };

  const handleSettingsClick = () => {
    navigate('/app/settings');
    setIsOpen(false);
  };

  const handleThemeToggle = () => {
    onThemeToggle();
    setIsOpen(false);
  };

  const handleLogout = () => {
    onLogout();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.div 
        className="flex items-center p-4 cursor-pointer rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
        onClick={toggleDropdown}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex-shrink-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={name}
              className="w-10 h-10 rounded-full border-2 border-indigo-500"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="ml-3 overflow-hidden">
          <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{email}</p>
        </div>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute left-0 right-0 bottom-full mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
            onClick={(e) => e.stopPropagation()}
          >
            <ul className="py-2">
              <li>
                <motion.button
                  className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  whileHover={{ x: 2 }}
                  onClick={handleProfileClick}
                >
                  <User size={16} className="mr-2" />
                  <span>Profile</span>
                </motion.button>
              </li>
              <li>
                <motion.button
                  className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  whileHover={{ x: 2 }}
                  onClick={handleSettingsClick}
                >
                  <Settings size={16} className="mr-2" />
                  <span>Settings</span>
                </motion.button>
              </li>
              <li className="border-t border-gray-100 dark:border-gray-700">
                <motion.button
                  className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  whileHover={{ x: 2 }}
                  onClick={handleThemeToggle}
                >
                  {isDarkMode ? (
                    <Sun size={16} className="mr-2" />
                  ) : (
                    <Moon size={16} className="mr-2" />
                  )}
                  <span>Theme: {isDarkMode ? 'Light' : 'Dark'}</span>
                </motion.button>
              </li>
              <li className="border-t border-gray-100 dark:border-gray-700">
                <motion.button
                  className="w-full flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  whileHover={{ x: 2 }}
                  onClick={handleLogout}
                >
                  <LogOut size={16} className="mr-2" />
                  <span>Logout</span>
                </motion.button>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserProfileDropdown;
