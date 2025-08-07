import React, { useEffect, useState } from 'react';
import { realAuthService } from '../services/RealAuthService';
import axios from 'axios';

interface Task {
  id: number;
  task: string;
  completed: boolean;
  created_at: string;
  user_id: number;
}

/**
 * Component that demonstrates fetching data from Neon database using authenticated role
 * This is a client-side component that calls a serverless function
 */
const NeonDataExample: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [newTask, setNewTask] = useState<string>('');

  // Fetch tasks from our serverless function
  const fetchTasks = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get the authentication token
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('You must be logged in to view tasks');
        setIsLoading(false);
        return;
      }
      
      // Call our serverless function with the auth token
      const response = await axios.get('/.netlify/functions/user-tasks', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setTasks(response.data.data || []);
      } else {
        setError(response.data.message || 'Failed to fetch tasks');
      }
    } catch (err: any) {
      console.error('Error fetching tasks:', err);
      setError(err.message || 'An error occurred while fetching tasks');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Add a new task
  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('You must be logged in to add tasks');
        return;
      }
      
      const response = await axios.post('/.netlify/functions/add-task', {
        task: newTask
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setNewTask('');
        fetchTasks(); // Refresh tasks
      } else {
        setError(response.data.message || 'Failed to add task');
      }
    } catch (err: any) {
      console.error('Error adding task:', err);
      setError(err.message || 'An error occurred while adding task');
    }
  };
  
  useEffect(() => {
    fetchTasks();
  }, []);
  
  return (
    <div className="p-6 max-w-lg mx-auto bg-white rounded-xl shadow-md">
      <h2 className="text-xl font-bold mb-4">Your Tasks</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={addTask} className="mb-4 flex">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          className="flex-grow px-3 py-2 border rounded-l focus:outline-none"
          placeholder="Add a new task..."
        />
        <button 
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600"
        >
          Add
        </button>
      </form>
      
      {isLoading ? (
        <p className="text-gray-500">Loading tasks...</p>
      ) : tasks.length > 0 ? (
        <ul className="space-y-2">
          {tasks.map((task) => (
            <li key={task.id} className="p-2 border-b flex items-center">
              <span className={task.completed ? 'line-through text-gray-500' : ''}>
                {task.task}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">No tasks found. Add one to get started!</p>
      )}
    </div>
  );
};

export default NeonDataExample;
