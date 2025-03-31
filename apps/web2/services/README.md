# Supabase Service Utility

This directory contains service utilities for interacting with external APIs and services.

## Supabase Service

The `supabaseService.ts` file provides utilities for interacting with a Supabase database using the service key for full access. This approach bypasses any security policies and should only be used in server-side code, never in client-side or browser code.

### Configuration

1. Update the `SUPABASE_URL` in `supabaseService.ts` with your actual Supabase project URL.
2. Replace the `SERVICE_KEY` value with your actual Supabase service key or use an environment variable.

### Available Functions

The utility provides the following functions:

#### `postToSupabase(tableName: string, data: any)`

Posts data to a specified Supabase table.

```typescript
import { postToSupabase } from '../services/supabaseService';

// Example usage
const newUser = {
  name: 'John Doe',
  email: 'john@example.com',
  role: 'user'
};

const result = await postToSupabase('users', newUser);
```

#### `updateInSupabase(tableName: string, id: string | number, data: any)`

Updates data in a specified Supabase table.

```typescript
import { updateInSupabase } from '../services/supabaseService';

// Example usage
const updatedData = {
  name: 'John Smith',
  role: 'admin'
};

const result = await updateInSupabase('users', 123, updatedData);
```

#### `deleteFromSupabase(tableName: string, id: string | number)`

Deletes data from a specified Supabase table.

```typescript
import { deleteFromSupabase } from '../services/supabaseService';

// Example usage
const result = await deleteFromSupabase('users', 123);
```

#### `fetchFromSupabase(tableName: string, query?: any)`

Fetches data from a specified Supabase table with optional query parameters.

```typescript
import { fetchFromSupabase } from '../services/supabaseService';

// Example usage: fetch all users
const allUsers = await fetchFromSupabase('users');

// Example usage: fetch users with filters
const adminUsers = await fetchFromSupabase('users', {
  filter: { role: 'admin' },
  limit: 10
});
```

### Direct Access to Supabase Client

You can also import the Supabase client directly for more complex operations:

```typescript
import { supabase } from '../services/supabaseService';

// Example of a more complex query
const { data, error } = await supabase
  .from('users')
  .select('id, name, email, profiles(avatar_url)')
  .eq('role', 'admin')
  .order('created_at', { ascending: false })
  .limit(5);
```

### Security Considerations

Remember that the service key has full access to your database, bypassing any security policies. Always use this utility in server-side code only, such as in API routes or server components in Next.js. 