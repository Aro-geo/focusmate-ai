import React, { createContext, useContext, ReactNode } from 'react';
import { UserService } from '../services/UserService';
import { TaskService } from '../services/TaskService';
import { PomodoroService } from '../services/PomodoroService';
import { JournalService } from '../services/JournalService';

// Define the shape of our data context
interface DataContextType {
  users: typeof UserService;
  tasks: typeof TaskService;
  pomodoro: typeof PomodoroService;
  journal: typeof JournalService;
}

// Create the context with default values
const DataContext = createContext<DataContextType>({
  users: UserService,
  tasks: TaskService,
  pomodoro: PomodoroService,
  journal: JournalService
});

// Provider component
interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  // We could add state here if needed, e.g., for caching or optimistic updates

  // The value that will be provided to consumers
  const value = {
    users: UserService,
    tasks: TaskService,
    pomodoro: PomodoroService,
    journal: JournalService
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

// Custom hook for using the data context
export const useData = () => useContext(DataContext);

export default DataContext;
