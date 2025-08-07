import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Pomodoro from './pages/Pomodoro';
import Journal from './pages/Journal';
import Stats from './pages/Stats';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import TodoList from './pages/TodoList';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import { DataProvider } from './context/DataContext';
import { ThemeProvider } from './context/ThemeContext';
import { UserProvider } from './context/UserContext';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <DataProvider>
        <Router>
          <UserProvider>
        <Routes>
          {/* Authentication Routes (no layout) */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          
          {/* Main App Routes (with layout) */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/app" element={<Layout><Navigate to="/app/dashboard" replace /></Layout>} />
          <Route path="/app/*" element={
            <Layout>
              <Routes>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="pomodoro" element={<Pomodoro />} />
                <Route path="journal" element={<Journal />} />
                <Route path="stats" element={<Stats />} />
                <Route path="todos" element={<TodoList />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Routes>
            </Layout>
          } />
          
          {/* Legacy routes redirect for backwards compatibility */}
          <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
          <Route path="/pomodoro" element={<Navigate to="/app/pomodoro" replace />} />
          <Route path="/journal" element={<Navigate to="/app/journal" replace />} />
          <Route path="/stats" element={<Navigate to="/app/stats" replace />} />
          <Route path="/profile" element={<Navigate to="/app/profile" replace />} />
          <Route path="/settings" element={<Navigate to="/app/settings" replace />} />
        </Routes>
          </UserProvider>
      </Router>
      </DataProvider>
    </ThemeProvider>
  );
}

export default App;
