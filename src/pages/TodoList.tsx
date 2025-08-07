import React from 'react';
import TodoManager from '../components/TodoManager';

export default function TodoList() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center">Todo List</h1>
      <p className="mb-6 text-center text-gray-600">
        This page demonstrates secure client-side database connections using Neon Serverless.
      </p>
      <TodoManager />
    </div>
  );
}
