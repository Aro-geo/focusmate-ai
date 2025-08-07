# Neon Serverless with Client-Side Security

This guide explains how to securely use Neon's serverless driver from client-side code, while maintaining proper security boundaries.

## Security First Approach

Exposing a full database connection string in client-side code (even for an "authenticated" role) is not recommended. Our approach provides:

1. **Security**: Only the database host is exposed to authenticated clients
2. **Authorization**: JWT tokens are used for authentication
3. **Data protection**: Row Level Security ensures users only access their data
4. **Credentials protection**: Connection details are never fully exposed client-side

## Environment Variables

We use these environment variables:

```
# Server-side only - Full connection string
DATABASE_AUTHENTICATED_URL=postgresql://authenticated@ep-summer-term-abunoc3n.eu-west-2.aws.neon.tech/neondb?sslmode=require

# Client-side - Partial connection string (missing host)
REACT_APP_DATABASE_URL_PLACEHOLDER='postgresql://authenticated@/neondb?sslmode=require'
```

## Implementation

### 1. Server-side host provider

A serverless function (`get-db-host.js`) provides the database host to authenticated clients:

```javascript
exports.handler = async (event, context) => {
  // Authenticate the user
  const authResult = await authenticateUserWithStackAuth(authHeader);
  
  // Extract host from connection string
  const dbUrl = process.env.DATABASE_AUTHENTICATED_URL;
  const matches = dbUrl.match(/@([^/]+)\//);
  const host = matches[1];
  
  // Return only the host, not credentials
  return createSuccessResponse({ 
    host,
    ttl: 3600 
  });
};
```

### 2. Client-side secure connector

The `NeonClient` class:

1. Fetches the host information from the server
2. Combines it with the partial placeholder URL
3. Uses JWT token for authentication
4. Creates a secure connection

```typescript
const sql = neon(connectionString, {
  authToken: async () => token
});
```

### 3. Row Level Security

Database tables have RLS policies:

```sql
CREATE POLICY tasks_user_select ON tasks
  FOR SELECT
  USING (user_id = auth.user_id())
```

## Usage Example

### Using the NeonClient Service

```tsx
import neonClient from '../services/NeonClient';

async function fetchUserData() {
  const sql = await neonClient.createSqlExecutor();
  if (!sql) return [];
  
  // RLS ensures only user's own data is returned
  return await sql`SELECT * FROM tasks ORDER BY created_at DESC`;
}
```

### Using the Custom useTodos Hook

```tsx
import { useTodos } from '../hooks/useTodos';

function TodoComponent() {
  const { 
    todos, 
    loading, 
    error, 
    addTodo, 
    toggleTodo, 
    deleteTodo 
  } = useTodos();
  
  return (
    <div>
      {loading ? <p>Loading...</p> : (
        <ul>
          {todos.map(todo => (
            <li key={todo.id}>
              <input 
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleTodo(todo.id, todo.completed)}
              />
              {todo.task}
              <button onClick={() => deleteTodo(todo.id)}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

## Advantages of This Approach

1. **Security**: No database credentials in client-side code
2. **Developer experience**: Still allows direct client queries without proxy
3. **Performance**: Reduces API overhead for certain operations
4. **Defense in depth**: Multiple security layers (JWT, RLS, host isolation)
5. **Reusable components**: Custom hooks encapsulate database logic

## Implementation Components

Our implementation includes:

1. **`useTodos.ts`**: Custom React hook for Todo CRUD operations
2. **`TodoManager.tsx`**: React component using the hook
3. **`get-db-host.js`**: Secure serverless function for host information
4. **`db-setup-rls.js`**: Script that sets up the database schema and RLS policies
5. **`NeonClient.ts`**: Base client for database connections

## Important Security Considerations

1. Always verify JWT tokens before providing host information
2. Never expose database credentials in client-side code
3. Always use RLS to enforce data access boundaries
4. Regularly rotate JWT secrets
5. Implement rate limiting on the host information endpoint
6. Use this approach only for low-risk operations with proper Row Level Security configured on all tables
