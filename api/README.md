# Dispatch App API Client

This directory contains the centralized HTTP API client for the Dispatch App, providing typed API methods for all backend endpoints.

## Overview

The API client is built with the following features:

- **Centralized HTTP Client**: Single axios instance with consistent configuration
- **Automatic Token Management**: JWT token attachment and refresh logic
- **Network Error Handling**: Retry mechanisms with exponential backoff
- **Type Safety**: Full TypeScript support with typed API methods
- **Request/Response Logging**: Development logging for debugging
- **Offline Detection**: Network status monitoring and error handling

## Architecture

```
api/
├── client.ts          # Core ApiClient class with axios configuration
├── auth.ts           # Authentication API methods
├── submissions.ts    # Submission management API methods
├── comments.ts       # Comment system API methods
├── users.ts          # User management API methods
├── companies.ts      # Company management API methods
├── index.ts          # Main export file
└── README.md         # This documentation
```

## Usage

### Basic Usage

```typescript
import { api } from '../api';

// Authentication
const loginResult = await api.auth.login({
  username: 'user@example.com',
  password: 'password123'
});

// Submissions
const submissions = await api.submissions.getSubmissions({
  page: 1,
  limit: 10,
  status: 'submitted'
});

// Create submission
const newSubmission = await api.submissions.createSubmission({
  date: '2024-01-15',
  startTime: '09:00',
  endTime: '17:00',
  companyId: 'company-id',
  status: 'submitted'
});
```

### Direct Client Usage

```typescript
import { apiClient } from '../api/client';

// Direct HTTP methods
const response = await apiClient.get('/custom-endpoint');
const result = await apiClient.post('/custom-endpoint', data);

// Token management
const token = await apiClient.getAuthToken();
await apiClient.setAuthToken('new-token');
await apiClient.clearAuthToken();

// Network status
const isOnline = apiClient.getNetworkStatus();
```

## Features

### Automatic Token Refresh

The client automatically handles JWT token refresh when receiving 401 responses:

```typescript
// Token refresh happens automatically
const data = await api.users.getCurrentUser();
// If token is expired, it will be refreshed automatically and request retried
```

### Error Handling

All API methods provide consistent error handling:

```typescript
try {
  const submissions = await api.submissions.getSubmissions();
} catch (error) {
  if (error.isNetworkError) {
    // Handle network connectivity issues
  } else if (error.response?.status === 401) {
    // Handle authentication errors
  } else {
    // Handle other API errors
  }
}
```

### Network Status Monitoring

The client monitors network connectivity and provides offline indicators:

```typescript
import { apiClient } from '../api/client';

const isOnline = apiClient.isOnlineStatus();
if (!isOnline) {
  // Show offline message to user
}
```

### Request Retry Logic

Network errors and server errors (5xx) are automatically retried with exponential backoff:

- Retry attempts: 3 (configurable)
- Retry delay: 1s, 2s, 4s (exponential backoff)
- Client errors (4xx) are not retried

## Configuration

API configuration is managed in `config/api.ts`:

```typescript
export const API_CONFIG = {
  BASE_URL: isDev 
    ? 'http://localhost:3001/api'  // Development
    : 'https://api.dispatch-app.com/api',  // Production
  TIMEOUT: 10000,
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

export const ENV_CONFIG = {
  enableApiLogging: isDev,
  retryAttempts: 3,
  retryDelay: 1000,
};
```

## API Methods

### Authentication (`api.auth`)

- `login(credentials)` - Login with username/password
- `logout()` - Logout current user
- `refreshToken()` - Refresh JWT token
- `isAuthenticated()` - Check authentication status

### Submissions (`api.submissions`)

- `getSubmissions(params?)` - Get paginated submissions
- `getSubmission(id)` - Get single submission
- `createSubmission(data)` - Create new submission
- `updateSubmission(id, data)` - Update existing submission
- `deleteSubmission(id)` - Delete submission
- `submitSubmission(id)` - Submit draft submission
- `saveDraft(data)` - Save as draft

### Comments (`api.comments`)

- `getComments(submissionId)` - Get submission comments
- `addComment(data)` - Add new comment
- `replyToComment(submissionId, parentId, content)` - Reply to comment
- `updateComment(id, content)` - Update comment
- `deleteComment(id)` - Delete comment

### Users (`api.users`)

- `getUsers(params?)` - Get paginated users
- `searchUsers(query, params?)` - Search users
- `getUser(id)` - Get single user
- `getCurrentUser()` - Get current user profile
- `updateUser(id, data)` - Update user
- `updateCurrentUser(data)` - Update current user profile
- `getUsersByRole(role, params?)` - Get users by role
- `getActiveUsers(params?)` - Get active users only

### Companies (`api.companies`)

- `getCompanies(params?)` - Get paginated companies
- `searchCompanies(query, params?)` - Search companies
- `getCompany(id)` - Get single company
- `createCompany(data)` - Create new company
- `updateCompany(id, data)` - Update company
- `deleteCompany(id)` - Delete company
- `getActiveCompanies(params?)` - Get active companies only
- `getAllCompanies()` - Get all companies (for dropdowns)

## Testing

The API client includes comprehensive tests:

```bash
npm test -- __tests__/api --forceExit
```

Test coverage includes:
- HTTP client functionality
- Token management
- Error handling
- Network status monitoring
- All API method implementations
- Integration testing

## Development

### Adding New API Methods

1. Add the method to the appropriate API module (e.g., `users.ts`)
2. Add TypeScript types to `types/api.ts`
3. Add endpoint configuration to `config/api.ts`
4. Write tests in `__tests__/api/`
5. Update this documentation

### Debugging

Enable API logging in development:

```typescript
// In config/api.ts
export const ENV_CONFIG = {
  enableApiLogging: true, // Enable request/response logging
};
```

This will log all API requests and responses to the console for debugging.