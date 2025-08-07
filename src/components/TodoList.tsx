'use client';

import React, { useEffect, useState } from 'react';
import { neon } from '@neondatabase/serverless';
import { realAuthService } from '../services/RealAuthService';

// Define Todo interface
interface Todo {
  id: number;
  task: string;
  completed: boolean;
  user_id: number;
  created_at: string;
}

// Create a function to get database connection with auth token
const getDb = (token: string) =>
  neon(process.env.REACT_APP_DATABASE_URL_PLACEHOLDER!, {
    authToken: token,
  });

export function TodoList() {
  const [todos, setTodos] = useState<Array<Todo>>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTodos() {
      setLoading(true);
      setError(null);
      
      try {
        // Get token from localStorage (where your auth service stores it)
        const token = localStorage.getItem('token');

        if (!token) {
          setError("Not authenticated. Please login first.");
          setLoading(false);
          return;
        }
        
        // Get host info from server (needed because we can't expose full connection string)
        const hostResponse = await fetch('/.netlify/functions/get-db-host', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!hostResponse.ok) {
          throw new Error('Failed to get database host information');
        }
        
        const hostData = await hostResponse.json();
        if (!hostData.success || !hostData.data.host) {
          throw new Error(hostData.message || 'Invalid host data received');
        }
        
        // Complete connection string with host
        const connectionString = process.env.REACT_APP_DATABASE_URL_PLACEHOLDER!.replace(
          '@/',
          `@${hostData.data.host}/`
        );
        
        // Create neon client with authentication
        const sql = neon(connectionString, {
          authToken: token
        });

        // Execute query (protected by Row Level Security)
        const todosResponse = await sql('select * from todos where user_id = auth.user_id()');
        
        // Update state with todos
        setTodos(todosResponse as Array<Todo>);
      } catch (err: any) {
        console.error('Error loading todos:', err);
        setError(err.message || 'Failed to load todos');
      } finally {
        setLoading(false);
      }
    }

    loadTodos();
  }, []);

  if (loading) {
    return <div className="p-4">Loading tasks...</div>;
  }
  
  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }
  
  if (todos.length === 0) {
    return <div className="p-4">No tasks found. Create one to get started!</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Your Tasks</h2>
      <ul className="space-y-2">
        {todos.map((todo) => (
          <li key={todo.id} className="p-2 border-b flex items-center">
            <input
              type="checkbox"
              checked={todo.completed}
              className="mr-2"
              readOnly
            />
            <span className={todo.completed ? 'line-through text-gray-500' : ''}>
              {todo.task}
            </span>
            <span className="text-xs text-gray-500 ml-2">
              {new Date(todo.created_at).toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TodoList;
