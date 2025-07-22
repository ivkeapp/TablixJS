// TablixJS Async Data Loading Examples
// This file demonstrates various ways to load data asynchronously

import Table from '../src/core/Table.js';

// ===== EXAMPLE 1: Basic URL Loading =====
export function createTableWithUrlLoading() {
  const table = new Table('#table1', {
    columns: [
      { name: 'id', title: 'ID', width: '60px' },
      { name: 'name', title: 'Name' },
      { name: 'email', title: 'Email' },
      { name: 'phone', title: 'Phone' }
    ],
    pagination: { pageSize: 5 }
  });

  // Load data from JSONPlaceholder API
  table.loadData('https://jsonplaceholder.typicode.com/users')
    .then(() => console.log('Users loaded successfully'))
    .catch(error => console.error('Failed to load users:', error));

  return table;
}

// ===== EXAMPLE 2: Custom Async Function with Authentication =====
export function createTableWithAuthenticatedData() {
  const table = new Table('#table2', {
    columns: [
      { name: 'id', title: 'ID' },
      { name: 'title', title: 'Title' },
      { name: 'status', title: 'Status' }
    ]
  });

  // Custom loader with authentication and data transformation
  const loadAuthenticatedData = async () => {
    const token = localStorage.getItem('authToken') || 'demo-token';
    
    const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const posts = await response.json();
    
    // Transform data to match our table columns
    return posts.slice(0, 20).map(post => ({
      id: post.id,
      title: post.title.length > 50 ? post.title.substring(0, 50) + '...' : post.title,
      status: post.userId <= 5 ? 'Published' : 'Draft'
    }));
  };

  table.loadData(loadAuthenticatedData);
  return table;
}

// ===== EXAMPLE 3: Delayed Loading with Progress =====
export function createTableWithDelayedLoading() {
  const table = new Table('#table3', {
    columns: [
      { name: 'id', title: 'ID' },
      { name: 'name', title: 'Product Name' },
      { name: 'price', title: 'Price' },
      { name: 'category', title: 'Category' }
    ]
  });

  // Simulate slow API with progress updates
  const loadWithProgress = () => {
    return new Promise(resolve => {
      // Simulate API delay
      setTimeout(() => {
        resolve([
          { id: 1, name: 'Laptop', price: '$999', category: 'Electronics' },
          { id: 2, name: 'Mouse', price: '$25', category: 'Electronics' },
          { id: 3, name: 'Keyboard', price: '$75', category: 'Electronics' },
          { id: 4, name: 'Monitor', price: '$250', category: 'Electronics' },
          { id: 5, name: 'Desk Chair', price: '$150', category: 'Furniture' }
        ]);
      }, 3000); // 3 second delay
    });
  };

  // Set up progress indicator
  table.on('beforeLoad', () => {
    console.log('🔄 Loading products...');
  });

  table.on('afterLoad', (payload) => {
    console.log(`✅ Loaded ${payload.data.length} products`);
  });

  table.loadData(loadWithProgress);
  return table;
}

// ===== EXAMPLE 4: Error Handling and Retry =====
export function createTableWithRetryLogic() {
  const table = new Table('#table4', {
    columns: [
      { name: 'id', title: 'ID' },
      { name: 'message', title: 'Message' }
    ]
  });

  let retryCount = 0;
  const maxRetries = 3;

  const unreliableLoader = () => {
    return new Promise((resolve, reject) => {
      // Simulate random failures
      if (Math.random() < 0.7) { // 70% chance of failure
        reject(new Error(`Network error (attempt ${retryCount + 1})`));
      } else {
        resolve([
          { id: 1, message: 'Data loaded successfully!' },
          { id: 2, message: 'This was loaded after retry logic' }
        ]);
      }
    });
  };

  const loadWithRetry = async () => {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        retryCount = attempt;
        const data = await unreliableLoader();
        console.log(`✅ Data loaded on attempt ${attempt + 1}`);
        return data;
      } catch (error) {
        console.log(`❌ Attempt ${attempt + 1} failed: ${error.message}`);
        
        if (attempt === maxRetries) {
          throw new Error(`Failed after ${maxRetries + 1} attempts: ${error.message}`);
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  };

  table.on('loadError', (payload) => {
    console.error('🚨 Final load error:', payload.error.message);
  });

  table.loadData(loadWithRetry);
  return table;
}

// ===== EXAMPLE 5: Multiple Data Sources =====
export function createTableWithMultipleSources() {
  const table = new Table('#table5', {
    columns: [
      { name: 'id', title: 'ID' },
      { name: 'type', title: 'Type' },
      { name: 'name', title: 'Name' },
      { name: 'source', title: 'Source' }
    ]
  });

  const loadFromMultipleSources = async () => {
    try {
      // Load from multiple APIs and combine
      const [users, posts] = await Promise.all([
        fetch('https://jsonplaceholder.typicode.com/users').then(r => r.json()),
        fetch('https://jsonplaceholder.typicode.com/posts').then(r => r.json())
      ]);

      // Combine and transform data
      const combinedData = [
        ...users.slice(0, 5).map(user => ({
          id: `user-${user.id}`,
          type: 'User',
          name: user.name,
          source: 'Users API'
        })),
        ...posts.slice(0, 5).map(post => ({
          id: `post-${post.id}`,
          type: 'Post',
          name: post.title.substring(0, 30) + '...',
          source: 'Posts API'
        }))
      ];

      return combinedData;
    } catch (error) {
      throw new Error(`Failed to load from multiple sources: ${error.message}`);
    }
  };

  table.loadData(loadFromMultipleSources);
  return table;
}

// ===== EXAMPLE 6: Real-time Data Updates =====
export function createTableWithRealTimeUpdates() {
  const table = new Table('#table6', {
    columns: [
      { name: 'id', title: 'ID' },
      { name: 'timestamp', title: 'Timestamp' },
      { name: 'value', title: 'Value' },
      { name: 'status', title: 'Status' }
    ],
    pagination: { pageSize: 10 }
  });

  // Initial load
  const generateData = () => {
    const now = new Date();
    return Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      timestamp: new Date(now.getTime() - (19 - i) * 1000).toLocaleTimeString(),
      value: Math.floor(Math.random() * 100),
      status: Math.random() > 0.5 ? 'Active' : 'Inactive'
    }));
  };

  // Load initial data
  table.loadData(generateData());

  // Set up periodic updates
  const updateInterval = setInterval(() => {
    table.loadData(generateData());
  }, 5000); // Update every 5 seconds

  // Cleanup function
  table.stopUpdates = () => clearInterval(updateInterval);

  return table;
}

// ===== USAGE INSTRUCTIONS =====
/*
To use these examples:

1. Include this file in your HTML:
   <script type="module" src="async-data-loading-usage.js"></script>

2. Create containers in your HTML:
   <div id="table1"></div>
   <div id="table2"></div>
   <!-- etc. -->

3. Call the functions:
   import * as examples from './async-data-loading-usage.js';
   
   // Create tables
   const table1 = examples.createTableWithUrlLoading();
   const table2 = examples.createTableWithAuthenticatedData();
   // etc.

4. Set up event listeners for debugging:
   table1.on('beforeLoad', () => console.log('Loading started'));
   table1.on('afterLoad', (payload) => console.log('Loading completed', payload));
   table1.on('loadError', (payload) => console.error('Loading failed', payload));
*/
