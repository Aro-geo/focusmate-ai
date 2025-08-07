# Using Neon Serverless with Authentication

This guide explains how to use Neon's serverless driver with authentication in this project.

## Setup

1. **Environment Variables**

The project has two database connection strings:

```
# Database owner connection - for admin operations
DATABASE_URL=postgresql://neondb_owner:npg_s8ahEI0jtxTM@ep-summer-term-abunoc3n.eu-west-2.aws.neon.tech/neondb?sslmode=require

# Authenticated role connection - for user-specific operations
DATABASE_AUTHENTICATED_URL=postgresql://authenticated@ep-summer-term-abunoc3n.eu-west-2.aws.neon.tech/neondb?sslmode=require
```

2. **Row Level Security (RLS)**

The `db-setup-rls.js` serverless function sets up Row Level Security on the tasks table. This ensures users can only access their own data.

3. **Authentication Flow**

The authentication flow works as follows:

- User logs in and receives a JWT token
- Frontend stores this token in localStorage
- When accessing protected resources, the token is sent in the Authorization header
- Serverless functions validate the token and use it to authenticate with Neon
- Row Level Security policies ensure users can only access their own data

## Example Usage

### In Serverless Functions

```javascript
const { neon } = require('@neondatabase/serverless');

exports.handler = async (event, context) => {
  // Get token from Authorization header
  const authHeader = event.headers.authorization;
  const token = authHeader.substring(7); // Remove 'Bearer '
  
  // Initialize Neon with authentication
  const sql = neon(process.env.DATABASE_AUTHENTICATED_URL, {
    authToken: async () => token
  });
  
  // Query will automatically be scoped to the authenticated user
  // thanks to Row Level Security
  const tasks = await sql`SELECT * FROM tasks`;
  
  return {
    statusCode: 200,
    body: JSON.stringify({ tasks })
  };
};
```

### In React Components

```jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const TasksList = () => {
  const [tasks, setTasks] = useState([]);
  
  useEffect(() => {
    const fetchTasks = async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get('/.netlify/functions/user-tasks', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(response.data.data);
    };
    
    fetchTasks();
  }, []);
  
  return (
    <ul>
      {tasks.map(task => (
        <li key={task.id}>{task.task}</li>
      ))}
    </ul>
  );
};
```

## Security Considerations

- Never expose your `DATABASE_URL` on the client side
- Always validate JWTs on your serverless functions
- Use Row Level Security to ensure data isolation between users
- Consider implementing token refresh mechanisms for longer sessions
