import * as React from 'react';
import { useTodos, Todo } from '../hooks/useTodos';

// Create a TodoManager component that uses our custom hook
export default function TodoManager() {
  const { todos, loading, error: todoError, addTodo, toggleTodo, deleteTodo, refreshTodos } = useTodos();
  const [newTask, setNewTask] = React.useState('');
  const [error, setError] = React.useState<string | null>(todoError);
  
  // Update local error state when the hook's error changes
  React.useEffect(() => {
    setError(todoError);
  }, [todoError]);
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTask.trim()) {
      addTodo(newTask);
      setNewTask('');
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Todo List</h2>
      
      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
          <button 
            className="ml-2 text-red-500 font-bold"
            onClick={() => setError(null)}
          >
            ×
          </button>
        </div>
      )}
      
      {/* Add todo form */}
      <form onSubmit={handleSubmit} className="mb-6 flex">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Add a new task..."
          aria-label="New task"
          className="flex-grow p-2 border rounded-l"
        />
        <button 
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600"
        >
          Add
        </button>
      </form>
      
      {/* Todo list */}
      {loading ? (
        <div className="text-center py-4">Loading...</div>
      ) : todos.length === 0 ? (
        <div className="text-center py-4 text-gray-500">No tasks yet. Add one to get started!</div>
      ) : (
        <ul className="space-y-2">
          {todos.map((todo) => (
            <li key={todo.id} className="p-3 border rounded flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleTodo(todo.id, todo.completed)}
                  className="mr-3"
                  aria-label={`Mark "${todo.task}" as ${todo.completed ? 'incomplete' : 'complete'}`}
                />
                <span className={todo.completed ? 'line-through text-gray-500' : ''}>
                  {todo.task}
                </span>
              </div>
              <button
                onClick={() => deleteTodo(todo.id)}
                className="text-red-500 hover:text-red-700"
                aria-label={`Delete task "${todo.task}"`}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
