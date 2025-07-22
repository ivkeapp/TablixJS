# Async Data Loading

TablixJS supports flexible asynchronous data loading with three different approaches, while maintaining full backwards compatibility with existing synchronous array-based loading.

## Quick Start

```javascript
import Table from './src/core/Table.js';

const table = new Table('#myTable', {
  columns: [
    { name: 'id', title: 'ID' },
    { name: 'name', title: 'Name' },
    { name: 'email', title: 'Email' }
  ]
});

// Three ways to load data:

// 1. Direct array (existing behavior)
table.loadData([
  { id: 1, name: 'John', email: 'john@example.com' },
  { id: 2, name: 'Jane', email: 'jane@example.com' }
]);

// 2. From URL
table.loadData('https://api.example.com/users');

// 3. Custom async function
table.loadData(() => 
  fetch('https://api.example.com/users')
    .then(response => response.json())
    .then(data => data.users) // Transform if needed
);
```

## API Reference

### `table.loadData(source)`

Loads data from various sources into the table.

**Parameters:**
- `source` *(Array|string|Function)*: The data source
  - **Array**: Direct data array (synchronous)
  - **string**: URL to fetch data from (asynchronous)
  - **Function**: Custom async function that returns a Promise resolving to data array

**Returns:** 
- `Promise<void>`: Resolves when data is loaded and table is rendered

**Throws:**
- Error if data source is invalid
- Network errors for URL-based loading
- Any errors from custom async functions

## Data Source Types

### 1. Array Data (Synchronous)

Load data directly from an array - the original behavior, fully preserved.

```javascript
const data = [
  { id: 1, name: 'Alice', department: 'Engineering' },
  { id: 2, name: 'Bob', department: 'Sales' },
  { id: 3, name: 'Carol', department: 'Marketing' }
];

await table.loadData(data);
```

### 2. URL-based Loading

Fetch data from a REST API endpoint. TablixJS uses the native `fetch` API.

```javascript
// Simple GET request
await table.loadData('https://jsonplaceholder.typicode.com/users');

// The URL must return JSON data in array format
// Example API response:
// [
//   { "id": 1, "name": "John Doe", "email": "john@example.com" },
//   { "id": 2, "name": "Jane Smith", "email": "jane@example.com" }
// ]
```

**Requirements:**
- URL must return valid JSON
- Response must be an array of objects
- Endpoint must support CORS if loading from different domain
- Requires modern browser with `fetch` support

### 3. Custom Async Functions

For complex data loading scenarios, authentication, data transformation, or custom error handling.

```javascript
// Basic custom loader
const customLoader = () => {
  return fetch('/api/users', {
    headers: { 'Authorization': 'Bearer ' + authToken }
  })
  .then(response => response.json());
};

await table.loadData(customLoader);

// Advanced example with data transformation
const advancedLoader = async () => {
  try {
    const response = await fetch('/api/complex-data');
    const rawData = await response.json();
    
    // Transform the data to match table columns
    return rawData.results.map(item => ({
      id: item.user_id,
      name: `${item.first_name} ${item.last_name}`,
      email: item.email_address,
      department: item.dept?.name || 'Unknown'
    }));
  } catch (error) {
    console.log('Custom loader error:', error);
    throw new Error('Failed to load user data');
  }
};

await table.loadData(advancedLoader);

// With simulated delay for testing
const delayedLoader = () => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve([
        { id: 1, name: 'Delayed User', email: 'delayed@example.com' }
      ]);
    }, 2000);
  });
};

await table.loadData(delayedLoader);
```

## Event Hooks

TablixJS provides three event hooks for data loading operations:

### `beforeLoad`

Triggered before data loading starts. Useful for showing loading indicators.

```javascript
table.on('beforeLoad', (payload) => {
  console.log('Loading started:', payload);
  // payload.source contains the original source (URL, function, or array)
  
  // Show loading indicator
  if (typeof payload.source === 'string' || typeof payload.source === 'function') {
    showLoadingSpinner();
  }
});
```

### `afterLoad`

Triggered after data is successfully loaded and table is rendered.

```javascript
table.on('afterLoad', (payload) => {
  console.log('Loading completed:', payload);
  // payload.data contains the loaded data array
  // payload.source contains the original source
  
  hideLoadingSpinner();
  console.log(`Loaded ${payload.data.length} records`);
});
```

### `loadError`

Triggered when data loading fails.

```javascript
table.on('loadError', (payload) => {
  console.error('Loading failed:', payload);
  // payload.error contains the error object
  // payload.source contains the original source that failed
  
  hideLoadingSpinner();
  showErrorMessage(payload.error.message);
});
```

## Error Handling

### Automatic Error Handling

TablixJS automatically handles common errors:

- **Network errors**: Connection issues, timeouts, CORS problems
- **HTTP errors**: 404, 500, etc. status codes
- **JSON parsing errors**: Invalid JSON responses
- **Data validation errors**: Non-array responses
- **Custom function errors**: Any errors thrown by custom loaders

### Error Display

When an error occurs:
1. The error is logged to the console
2. A `loadError` event is triggered
3. The table displays an error message in the container
4. The original error is re-thrown for custom handling

### Custom Error Handling

```javascript
try {
  await table.loadData('https://api.example.com/users');
} catch (error) {
  // Handle the error according to your app's needs
  if (error.message.includes('HTTP error! status: 401')) {
    redirectToLogin();
  } else {
    showUserFriendlyErrorMessage();
  }
}
```

## Best Practices

### 1. Loading Indicators

Always provide user feedback for async operations:

```javascript
table.on('beforeLoad', () => {
  document.getElementById('loading').style.display = 'block';
});

table.on('afterLoad', () => {
  document.getElementById('loading').style.display = 'none';
});

table.on('loadError', () => {
  document.getElementById('loading').style.display = 'none';
});
```

### 2. Error Recovery

Implement graceful error handling:

```javascript
table.on('loadError', (payload) => {
  // Log for debugging
  console.error('Data loading failed:', payload.error);
  
  // Show user-friendly message
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = 'Unable to load data. Please try again.';
  document.getElementById('errorContainer').appendChild(errorDiv);
  
  // Optionally retry after delay
  setTimeout(() => {
    table.loadData(payload.source);
  }, 5000);
});
```

### 3. Data Transformation

Use custom functions for data transformation:

```javascript
const loadUserData = () => {
  return fetch('/api/users')
    .then(response => response.json())
    .then(apiData => {
      // Transform API response to table format
      return apiData.map(user => ({
        id: user.id,
        name: user.fullName,
        email: user.emailAddress,
        status: user.isActive ? 'Active' : 'Inactive',
        lastLogin: user.lastLoginDate ? new Date(user.lastLoginDate).toLocaleDateString() : 'Never'
      }));
    });
};

table.loadData(loadUserData);
```

### 4. Authentication

Handle authenticated requests:

```javascript
const loadSecureData = () => {
  const token = localStorage.getItem('authToken');
  
  return fetch('/api/secure-data', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    if (response.status === 401) {
      throw new Error('Authentication required');
    }
    return response.json();
  });
};

table.loadData(loadSecureData);
```

## Testing

### Test Different Scenarios

```javascript
// Test data loading
async function testDataLoading() {
  try {
    // Test array loading
    await table.loadData([{id: 1, name: 'Test'}]);
    console.log('✓ Array loading works');
    
    // Test URL loading
    await table.loadData('https://jsonplaceholder.typicode.com/users');
    console.log('✓ URL loading works');
    
    // Test custom function
    await table.loadData(() => Promise.resolve([{id: 2, name: 'Custom'}]));
    console.log('✓ Custom function loading works');
    
  } catch (error) {
    console.error('✗ Test failed:', error);
  }
}
```

## Migration Guide

### From Previous Versions

The new async loading is fully backwards compatible. No changes needed for existing code:

```javascript
// This still works exactly as before
table.loadData([
  { id: 1, name: 'John' },
  { id: 2, name: 'Jane' }
]);
```

### Event Payload Changes

The `afterLoad` event now receives a payload object instead of direct data:

```javascript
// Old format (still supported for array data)
table.on('afterLoad', (data) => {
  console.log('Loaded data:', data);
});

// New format (recommended)
table.on('afterLoad', (payload) => {
  console.log('Loaded data:', payload.data);
  console.log('Source type:', typeof payload.source);
});
```

## Examples

See the `examples/async-data-loading-demo.html` file for a complete working demonstration of all async loading features.
