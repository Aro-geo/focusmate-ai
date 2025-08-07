import React from 'react';
import axios from 'axios';
import { neon } from '@neondatabase/serverless';

// Define Todo interface
export interface Todo {
  id: number;
  task: string;
  completed: boolean;
  user_id: number;
  created_at: string;
}

interface UseTodosReturn {
  todos: Todo[];
  loading: boolean;
  error: string | null;
  addTodo: (task: string) => Promise<void>;
  toggleTodo: (id: number, currentStatus: boolean) => Promise<void>;
  deleteTodo: (id: number) => Promise<void>;
  refreshTodos: () => Promise<void>;
}

interface DbHostResponse {
  success: boolean;
  data: {
    host: string;
    ttl: number;
  };
  message?: string;
}

// Custom hook for Todo operations
export function useTodos(): UseTodosReturn {
  const [todos, setTodos] = React.useState<Todo[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [sql, setSql] = React.useState<any>(null);

  // Initialize connection to Neon database
  const initConnection = React.useCallback(async () => {
    try {
      // Get auth token from storage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated. Please login first.');
      }

      // Get database host from secure endpoint
      const hostResponse = await axios.get<DbHostResponse>('/.netlify/functions/get-db-host', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!hostResponse.data.success || !hostResponse.data.data.host) {
        throw new Error(hostResponse.data.message || 'Failed to get database host');
      }

      // Generate connection string with host
      const baseUrl = process.env.REACT_APP_DATABASE_URL_PLACEHOLDER;
      if (!baseUrl) {
        throw new Error('Database URL placeholder not configured');
      }

      const connectionString = baseUrl.replace(
        '@/',
        `@${hostResponse.data.data.host}/`
      );

      // Create neon client with JWT for auth
      const neonSql = neon(connectionString, { authToken: token });
      setSql(neonSql);
      return neonSql;
    } catch (err: any) {
      console.error('Database connection initialization error:', err);
      setError(err.message || 'Failed to connect to database');
      return null;
    }
  }, []);

  // Fetch todos from database
  const fetchTodos = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const connection = sql || await initConnection();
      if (!connection) return;

      // Query todos with RLS filtering by user_id
      const result = await connection('SELECT * FROM todos ORDER BY created_at DESC');
      setTodos(result as Todo[]);
    } catch (err: any) {
      console.error('Error fetching todos:', err);
      setError(err.message || 'Failed to load todos');
    } finally {
      setLoading(false);
    }
  }, [sql, initConnection]);

  // Add a new todo
  const addTodo = React.useCallback(async (task: string) => {
    if (!task.trim()) return;

    try {
      const connection = sql || await initConnection();
      if (!connection) return;

      await connection(
        'INSERT INTO todos (task, completed, user_id) VALUES ($1, false, auth.user_id())',
        [task.trim()]
      );
      await fetchTodos();
    } catch (err: any) {
      console.error('Error adding todo:', err);
      setError(err.message || 'Failed to add task');
    }
  }, [sql, initConnection, fetchTodos]);

  // Toggle todo completion status
  const toggleTodo = React.useCallback(async (id: number, currentStatus: boolean) => {
    try {
      const connection = sql || await initConnection();
      if (!connection) return;

      await connection(
        'UPDATE todos SET completed = $1 WHERE id = $2 AND user_id = auth.user_id()',
        [!currentStatus, id]
      );
      await fetchTodos();
    } catch (err: any) {
      console.error('Error toggling todo:', err);
      setError(err.message || 'Failed to update task');
    }
  }, [sql, initConnection, fetchTodos]);

  // Delete a todo
  const deleteTodo = React.useCallback(async (id: number) => {
    try {
      const connection = sql || await initConnection();
      if (!connection) return;

      await connection(
        'DELETE FROM todos WHERE id = $1 AND user_id = auth.user_id()',
        [id]
      );
      await fetchTodos();
    } catch (err: any) {
      console.error('Error deleting todo:', err);
      setError(err.message || 'Failed to delete task');
    }
  }, [sql, initConnection, fetchTodos]);

  // Initialize on component mount
  React.useEffect(() => {
    if (!sql) {
      initConnection()
        .then(connection => {
          if (connection) {
            fetchTodos();
          }
        })
        .catch(err => {
          console.error('Error during initialization:', err);
          setError(err.message || 'Failed to initialize');
          setLoading(false);
        });
    } else {
      fetchTodos();
    }
  }, [sql, initConnection, fetchTodos]);

  return {
    todos,
    loading,
    error,
    addTodo,
    toggleTodo,
    deleteTodo,
    refreshTodos: fetchTodos
  };
}
