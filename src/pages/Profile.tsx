import React, { useState, useEffect } from 'react';
import { Bell, Edit, Save, Award, Sparkles, LogOut } from 'lucide-react';
import { useData } from '../context/DataContext';
import AvatarUploader from '../components/profile/AvatarUploader';
import AchievementBadge from '../components/profile/AchievementBadge';
import ToggleSwitch from '../components/profile/ToggleSwitch';

const Profile: React.FC = () => {
  const { users, tasks, pomodoro, journal } = useData();
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editableData, setEditableData] = useState({
    name: '',
    email: '',
    bio: ''
  });
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    focusTime: 0,
    journalEntries: 0,
  });
  const [aiFeedback, setAiFeedback] = useState('');
  const [notificationPreferences, setNotificationPreferences] = useState({
    emailDigest: true,
    taskReminders: true,
    pomodoroAlerts: true,
    weeklyReports: false,
  });

  // Load real user data from database
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setIsLoading(true);
        const currentUser = await users.getCurrentUser();
        
        if (currentUser) {
          setUserData(currentUser);
          setEditableData({
            name: currentUser.username,
            email: currentUser.email,
            bio: ''
          });
        } else {
          window.location.href = '/login';
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        window.location.href = '/login';
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [users]);

  // Fetch real user statistics
  useEffect(() => {
    const fetchUserStats = async () => {
      if (!userData) return;
      
      try {
        // Get real statistics from services
        const userTasks = await tasks.getAllForUser(userData.id);
        const completedTasks = userTasks.filter(task => task.completed || task.status === 'completed');
        const pomodoroStats = await pomodoro.getStatistics(userData.id);
        
        setStats({
          totalTasks: userTasks.length,
          completedTasks: completedTasks.length,
          focusTime: pomodoroStats.totalMinutes / 60, // Convert to hours
          journalEntries: 0, // TODO: Implement journal service
        });

        // Generate AI feedback based on real data
        const completionRate = userTasks.length > 0 ? (completedTasks.length / userTasks.length) * 100 : 0;
        const focusHours = pomodoroStats.totalMinutes / 60;
        
        setAiFeedback(
          `Great progress, ${userData.username}! You've completed ${completionRate.toFixed(0)}% of your tasks ` +
          `and logged ${focusHours.toFixed(1)} hours of focused work. ` +
          `${completionRate > 80 ? "You're crushing your goals!" : "Keep pushing - you're on the right track!"}`
        );
      } catch (error) {
        console.error('Error fetching user statistics:', error);
        setAiFeedback('Welcome! Start adding tasks and focus sessions to see your progress here.');
      }
    };

    fetchUserStats();
  }, [userData, tasks, pomodoro]);

  // Handle save profile edits
  const handleSaveProfile = async () => {
    if (!userData) return;
    
    try {
      const updatedUser = await users.updateProfile({
        username: editableData.name,
        email: editableData.email
      });
      
      if (updatedUser) {
        setUserData(updatedUser);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    }
  };

  // Define type for notification preference keys
  type NotificationKey = 'emailDigest' | 'taskReminders' | 'pomodoroAlerts' | 'weeklyReports';
  
  // Handle notification preferences change
  const handleNotificationChange = (key: NotificationKey) => {
    setUserData({
      ...userData,
      notificationPreferences: {
        ...userData.notificationPreferences,
        [key]: !userData.notificationPreferences[key],
      },
    });
    // In a real app: users.updatePreferences(userData.id, { [key]: !userData.notificationPreferences[key] });
  };

  // Handle logout
  const handleLogout = () => {
    // Implementation would depend on your authentication system
    alert('Logout functionality would go here');
    // Example: authService.logout();
    // window.location.href = '/login';
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Profile</h1>

      {/* Profile Header Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <AvatarUploader
              currentUrl={userData.avatarUrl}
              onAvatarChange={(url) => setEditableData({ ...editableData, avatarUrl: url })}
              size="lg"
              editable={isEditing}
            />
            <div>
              {isEditing ? (
                <input
                  type="text"
                  value={editableData.name}
                  onChange={(e) => setEditableData({ ...editableData, name: e.target.value })}
                  className="border border-gray-300 rounded px-2 py-1 mb-1 text-xl font-semibold"
                  aria-label="Name"
                  placeholder="Your Name"
                />
              ) : (
                <h2 className="text-xl font-semibold">{userData.name}</h2>
              )}
              <p className="text-gray-600">{userData.email}</p>
              <div className="flex items-center mt-1">
                <Award size={16} className="text-indigo-600 mr-1" />
                <span className="text-sm">{userData.role} since {new Date(userData.joinDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div>
            {isEditing ? (
              <button 
                onClick={handleSaveProfile} 
                className="flex items-center px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                <Save size={16} className="mr-1" /> Save
              </button>
            ) : (
              <button 
                onClick={() => setIsEditing(true)} 
                className="flex items-center px-3 py-2 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                <Edit size={16} className="mr-1" /> Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Bio Section */}
        <div className="mt-6">
          <h3 className="text-md font-semibold mb-2">About Me</h3>
          {isEditing ? (
            <div>
              <label htmlFor="bio-textarea" className="sr-only">About Me</label>
              <textarea
                id="bio-textarea"
                value={editableData.bio}
                onChange={(e) => setEditableData({ ...editableData, bio: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 h-24"
                placeholder="Tell us about yourself"
                aria-label="Biography"
              />
            </div>
          ) : (
            <p className="text-gray-700">{userData.bio}</p>
          )}
        </div>
      </div>

      {/* Statistics Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Productivity Stats</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-indigo-50 p-4 rounded-lg">
              <p className="text-sm text-indigo-600 font-medium">Tasks Completed</p>
              <p className="text-2xl font-bold">{stats.completedTasks} <span className="text-sm text-gray-500">/ {stats.totalTasks}</span></p>
              <p className="text-xs text-gray-500 mt-1">
                {Math.round(stats.completedTasks / stats.totalTasks * 100)}% completion rate
              </p>
            </div>
            <div className="bg-indigo-50 p-4 rounded-lg">
              <p className="text-sm text-indigo-600 font-medium">Focus Time</p>
              <p className="text-2xl font-bold">{stats.focusTime} <span className="text-sm text-gray-500">hours</span></p>
              <p className="text-xs text-gray-500 mt-1">
                Across {Math.round(stats.focusTime * 2)} sessions
              </p>
            </div>
            <div className="bg-indigo-50 p-4 rounded-lg">
              <p className="text-sm text-indigo-600 font-medium">Journal Entries</p>
              <p className="text-2xl font-bold">{stats.journalEntries}</p>
              <p className="text-xs text-gray-500 mt-1">
                {Math.round(stats.journalEntries / 30 * 100)}% daily journaling
              </p>
            </div>
            <div className="bg-indigo-50 p-4 rounded-lg">
              <p className="text-sm text-indigo-600 font-medium">Avg. Focus</p>
              <p className="text-2xl font-bold">28 <span className="text-sm text-gray-500">min</span></p>
              <p className="text-xs text-gray-500 mt-1">
                Per session
              </p>
            </div>
          </div>
          <div className="mt-4">
            <a href="/stats" className="text-indigo-600 text-sm hover:underline">
              View detailed stats →
            </a>
          </div>
        </div>
        
        {/* AI Feedback */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <Sparkles className="text-indigo-600 mr-2" size={20} />
            <h2 className="text-lg font-semibold">AI Insights</h2>
          </div>
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-lg">
            <p className="text-gray-700">{aiFeedback}</p>
          </div>
          <div className="mt-6">
            <h3 className="text-md font-semibold mb-3">Recent Achievements</h3>
            <div className="flex flex-wrap gap-2">
              <AchievementBadge type="streak" label="7-Day Streak" color="yellow" />
              <AchievementBadge type="focus" label="Focus Master" color="blue" />
              <AchievementBadge type="journal" label="Journal Pro" color="purple" />
              <AchievementBadge type="completion" label="Task Champion" color="green" value="10+" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Notifications & Tasks Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Notification Preferences */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <Bell className="text-indigo-600 mr-2" size={20} />
            <h2 className="text-lg font-semibold">Notification Preferences</h2>
          </div>
          <div className="space-y-3">
            {Object.entries(userData.notificationPreferences).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <ToggleSwitch
                  id={key}
                  checked={value}
                  onChange={() => handleNotificationChange(key as NotificationKey)}
                  label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                />
              </div>
            ))}
          </div>
        </div>
        
        {/* Recent Tasks */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Tasks</h2>
          <ul className="space-y-3">
            <li className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked 
                    className="mr-3" 
                    disabled 
                    aria-label="Update portfolio website task"
                  />
                  <span className="line-through text-gray-500">Update portfolio website</span>
                </label>
              </div>
              <span className="text-xs text-gray-400">2 days ago</span>
            </li>
            <li className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked 
                    className="mr-3" 
                    disabled 
                    aria-label="Research project ideas task"
                  />
                  <span className="line-through text-gray-500">Research project ideas</span>
                </label>
              </div>
              <span className="text-xs text-gray-400">Yesterday</span>
            </li>
            <li className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    className="mr-3" 
                    disabled 
                    aria-label="Complete FocusMate project task"
                  />
                  <span>Complete FocusMate project</span>
                </label>
              </div>
              <span className="text-xs text-gray-400">Today</span>
            </li>
          </ul>
          <div className="mt-4">
            <a href="/dashboard" className="text-indigo-600 text-sm hover:underline">
              View all tasks →
            </a>
          </div>
        </div>
      </div>

      {/* Account Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Account Actions</h2>
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={handleLogout}
            className="flex items-center px-4 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100"
          >
            <LogOut size={16} className="mr-2" /> 
            Logout
          </button>
          <button className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">
            Change Password
          </button>
          <button className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">
            Export Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
