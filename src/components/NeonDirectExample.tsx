import React, { useState, useEffect } from 'react';
import neonClient from '../services/NeonClient';

const NeonDirectExample: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'connected' | 'error'>('idle');
  const [testResult, setTestResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const testConnection = async () => {
    setStatus('loading');
    setErrorMessage(null);
    
    try {
      // Test if we can establish a connection
      const success = await neonClient.testConnection();
      
      if (success) {
        setStatus('connected');
        
        // Try to run a simple query if connected
        const sql = await neonClient.createSqlExecutor();
        if (sql) {
          // This query will be protected by Row Level Security
          const result = await sql`SELECT current_user, current_timestamp`;
          setTestResult(result);
        }
      } else {
        setStatus('error');
        setErrorMessage('Connection test failed');
      }
    } catch (error: any) {
      setStatus('error');
      setErrorMessage(error.message || 'An error occurred during connection test');
      console.error('Connection test error:', error);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto bg-white rounded-xl shadow-md">
      <h2 className="text-xl font-bold mb-4">Neon Direct Connection Example</h2>
      <p className="mb-4 text-gray-600">
        This example demonstrates secure client-side connections to Neon using Row Level Security.
      </p>
      
      <button 
        onClick={testConnection}
        disabled={status === 'loading'}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
      >
        {status === 'loading' ? 'Testing...' : 'Test Connection'}
      </button>
      
      {status === 'connected' && (
        <div className="mt-4 p-3 bg-green-100 text-green-800 rounded">
          ✅ Connection successful!
          {testResult && (
            <div className="mt-2">
              <p>User: {testResult[0]?.current_user || 'Unknown'}</p>
              <p>Timestamp: {testResult[0]?.current_timestamp?.toString() || 'Unknown'}</p>
            </div>
          )}
        </div>
      )}
      
      {status === 'error' && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
          ❌ Connection failed: {errorMessage || 'Unknown error'}
        </div>
      )}
      
      <div className="mt-6">
        <h3 className="font-semibold">Important Security Notes:</h3>
        <ul className="list-disc pl-5 mt-2 text-sm text-gray-700">
          <li>The database host is fetched securely from the server</li>
          <li>Authentication uses your JWT token</li>
          <li>Row Level Security protects data at the database level</li>
          <li>Full connection credentials are never exposed to the client</li>
        </ul>
      </div>
    </div>
  );
};

export default NeonDirectExample;
