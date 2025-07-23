# TablixJS

TablixJS is a lightweight, dependency-free JavaScript library for building powerful, responsive data tables with advanced pagination features. Focus on solid pagination implementation with both client-side and server-side support.

## ✨ Features

### **Pagination Core Features**
- **Modular Architecture** - Clean separation with dedicated PaginationManager
- **Client & Server Pagination** - Efficient pagination for both local and remote data
- **Automatic Controls** - Auto-generated pagination controls with zero HTML required
- **Page Size Management** - Dynamic page size selection with customizable options
- **Smart Page Numbers** - Intelligent page number display with ellipsis
- **Responsive Design** - Mobile-friendly pagination controls
- **Theming System** - CSS custom properties with modular styling
- **Performance Optimized** - Efficient data slicing and rendering
- **Extensible** - Event hooks and programmatic API

### **Control Features**
- Pagination controls (first, prev, next, last, page numbers)
- Page size selector with customizable options
- Refresh button for data reload
- Export functionality (CSV)
- Customizable control positioning (top/bottom/both)
- Loading states and error handling

### **Advanced Capabilities**
- **Async Data Loading** - URL-based loading, custom async functions, direct arrays
- Custom cell renderers with HTML support
- Comprehensive event system for state tracking
- Server-side data loading with async support
- Programmatic pagination API
- Responsive breakpoints for mobile
- Accessibility features (ARIA labels, keyboard support)

## Quick Start

```javascript
import Table from './src/core/Table.js';

const table = new Table('#tableContainer', {
  data: employees,
  columns: [
    { name: 'name', title: 'Employee Name' },
    { name: 'department', title: 'Department' },
    { name: 'salary', title: 'Salary', renderer: (cell) => `$${cell.toLocaleString()}` }
  ],
  pagination: {
    enabled: true,
    pageSize: 10,
    mode: 'client',           // or 'server'
    showPageSizes: true,
    pageSizeOptions: [5, 10, 25, 50]
  },
  controls: {
    enabled: true,            // Automatically generate controls
    pagination: true,         // Show pagination controls  
    pageSize: true,           // Show page size selector
    refresh: true,            // Show refresh button
    position: 'top'           // Controls position
  }
});
```

> For advanced column formatting examples, see [Column Formatting Demo](examples/column-formatting-demo.html) and [Column Formatting Usage](examples/column-formatting-usage.js).

## Architecture

### **Core Components**
- **Table.js** - Main orchestrator with pagination API
- **DataManager.js** - Data management and filtering
- **PaginationManager.js** - Complete client/server pagination implementation
- **Renderer.js** - DOM rendering with automatic control generation
- **EventManager.js** - Event system for state tracking and hooks

### **Project Structure**
```
src/
├── core/
│   ├── Table.js              ✅ Main API with pagination focus
│   ├── DataManager.js        ✅ Data management & filtering
│   ├── PaginationManager.js  ✅ Full pagination implementation
│   ├── Renderer.js           ✅ Auto controls & rendering
│   ├── EventManager.js       ✅ Complete event system
│   ├── ColumnManager.js      📋 Placeholder
│   ├── SelectionManager.js   📋 Removed (not core feature)
│   └── VirtualScroll.js      📋 Placeholder
├── styles/
│   ├── tablix.css           ✅ Main stylesheet
│   ├── table-core.css       ✅ Table styles  
│   ├── pagination-core.css  ✅ Pagination & controls
│   └── themes/
│       ├── default.css      ✅ Default theme variables
│       └── dark.css         ✅ Dark theme
├── jquery/                  📋 Planned wrapper
└── react/                   📋 Planned wrapper
```

## Quick Start

### **Basic Client-side Pagination**
```javascript
import Table from './src/core/Table.js';

const table = new Table('#myTable', {
  data: [
    { id: 1, name: 'John Doe', department: 'IT', salary: 75000 },
    { id: 2, name: 'Jane Smith', department: 'HR', salary: 65000 },
    // ... more data
  ],
  columns: [
    { name: 'id', title: 'ID' },
    { name: 'name', title: 'Name' },
    { name: 'department', title: 'Department' },
    { name: 'salary', title: 'Salary', renderer: (cell) => `$${cell.toLocaleString()}` }
  ],
  pagination: {
    pageSize: 10,
    showPageNumbers: true,
    showPageSizes: true,
    pageSizeOptions: [5, 10, 25, 50]
  }
});

// Navigation API
await table.nextPage();
await table.prevPage();
await table.goToPage(3);
await table.changePageSize(25);

// Get pagination info
const info = table.getPaginationInfo();
console.log(`Page ${info.currentPage} of ${info.totalPages}`);
```

### **Server-side Pagination**
```javascript
async function loadDataFromServer({ page, pageSize, filters, sorts }) {
  const response = await fetch(`/api/data?page=${page}&size=${pageSize}`);
  const result = await response.json();
  
  return {
    data: result.items,
    totalRows: result.total
  };
}

const serverTable = new Table('#serverTable', {
  columns: [...],
  pagination: {
    mode: 'server',
    pageSize: 20,
    serverDataLoader: loadDataFromServer,
    showPageNumbers: true,
    showFirstLast: true
  }
});
```

> For sorting examples, see [Sorting Demo](examples/sorting-demo.html) and [Sorting Usage Examples](examples/sorting-usage-examples.js).

## Async Data Loading

TablixJS supports flexible asynchronous data loading with three different approaches while maintaining full backwards compatibility.

### **Direct Array Loading** (Existing)
```javascript
// Load data directly from an array
const data = [
  { id: 1, name: 'John Doe', email: 'john@example.com' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
];
await table.loadData(data);
```

### **URL-based Loading** (New)
```javascript
// Load data from a REST API endpoint
await table.loadData('https://api.example.com/users');

// The API should return JSON array:
// [
//   { "id": 1, "name": "John Doe", "email": "john@example.com" },
//   { "id": 2, "name": "Jane Smith", "email": "jane@example.com" }
// ]
```

### **Custom Async Function Loading** (New)
```javascript
// Load with custom async function for complex scenarios
const customLoader = () => {
  return fetch('/api/users', {
    headers: { 'Authorization': 'Bearer ' + authToken }
  })
  .then(response => response.json())
  .then(data => data.users); // Transform if needed
};

await table.loadData(customLoader);

// Advanced example with error handling and transformation
const advancedLoader = async () => {
  try {
    const response = await fetch('/api/complex-data');
    const rawData = await response.json();
    
    // Transform data to match table columns
    return rawData.results.map(item => ({
      id: item.user_id,
      name: `${item.first_name} ${item.last_name}`,
      email: item.email_address,
      department: item.dept?.name || 'Unknown'
    }));
  } catch (error) {
    throw new Error('Failed to load user data');
  }
};

await table.loadData(advancedLoader);
```

### **Event Hooks for Loading**
```javascript
// Show loading indicators
table.on('beforeLoad', (payload) => {
  console.log('Loading started from:', typeof payload.source);
  if (typeof payload.source === 'string' || typeof payload.source === 'function') {
    showLoadingSpinner();
  }
});

// Handle successful loading
table.on('afterLoad', (payload) => {
  console.log(`Loaded ${payload.data.length} records`);
  hideLoadingSpinner();
});

// Handle loading errors
table.on('loadError', (payload) => {
  console.error('Loading failed:', payload.error.message);
  hideLoadingSpinner();
  showErrorMessage(payload.error.message);
});
```

See [Async Data Loading Guide](docs/async-data-loading.md) for complete documentation and [live demo](examples/async-data-loading-demo.html).

### **Event Handling**
```javascript
// Pagination events
table.on('afterPageChange', ({ oldPage, newPage }) => {
  console.log(`Navigated from page ${oldPage} to ${newPage}`);
});

table.on('beforePageLoad', ({ page, pageSize }) => {
  console.log('Loading data from server...');
});

// Filter integration
table.on('afterFilter', (criteria) => {
  console.log('Filtered, reset to page 1');
});
```

For more examples, see [Filtering Demo](examples/filtering-demo.html) and [Filtering Usage Examples](examples/filtering-usage-examples.js).

## Examples

- **[Basic Usage](examples/vanilla.html)** - Simple client-side pagination
- **[Async Data Loading Demo](examples/async-data-loading-demo.html)** - Asynchronous data loading examples
- **[Column Formatting Demo](examples/column-formatting-demo.html)** - Custom column formatting
- **[Complete Pagination Demo](examples/complete-pagination-demo.html)** - All pagination features
- **[Filtering Demo](examples/filtering-demo.html)** - Data filtering capabilities
- **[Auto Controls](examples/auto-controls.html)** - Automatic control generation
- **[Theme Demo](examples/theme-demo.html)** - Theming and styling examples
- **[Sorting Demo](examples/sorting-demo.html)** - Column sorting functionality
- **[Pagination Samples](examples/pagination-samples.js)** - Implementation patterns
- **[jQuery Integration](examples/jquery.html)** - jQuery wrapper usage
- **[React Integration](examples/react.html)** - React component usage

## Styling

Include the main stylesheet:
```html
<link rel="stylesheet" href="./src/styles/tablix.css">
```

### Custom Themes
Create custom themes using CSS custom properties:
```css
.my-theme {
  --tablix-btn-active-color: #28a745;
  --tablix-header-bg: #e8f5e9;
}
```

### Dark Theme
Enable dark theme with data attribute:
```html
<html data-theme="dark">
```

Or with CSS class:
```html
<div class="tablix-wrapper dark">
```

See **[Theming Guide](docs/theming.md)** for complete customization options.

## Getting Started

```bash
# Start development server
npm run dev  # Runs on http://localhost:5174

# View examples
open http://localhost:5174/examples/pagination.html
```

### Quick Links
- **[Example Index](examples/index.html)** - Main examples page
- **[Basic Demo](examples/vanilla.html)** - Start here for basic usage
- **[Complete Demo](examples/complete-pagination-demo.html)** - Full feature showcase

## Documentation

- **[Pagination API](docs/pagination.md)** - Complete pagination guide
- **[Async Data Loading](docs/async-data-loading.md)** - Asynchronous data loading documentation
- **[Column Formatting](docs/column-formatting.md)** - Custom column formatting guide
- **[Filtering](docs/filtering.md)** - Data filtering documentation
- **[Sorting](docs/sorting.md)** - Column sorting guide
- **[Simple Sorting](docs/sorting-simple.md)** - Basic sorting implementation
- **[Theming Guide](docs/theming.md)** - CSS customization and themes
- **[Plugin Architecture](docs/plugin-architecture.md)** - Extending TablixJS functionality

## Performance

- **Client-side**: Optimized for datasets up to 10,000 rows
- **Server-side**: Supports unlimited data with async loading
- **Memory efficient**: Only current page data in memory for server mode
- **Fast filtering**: Instant client-side filtering with pagination reset

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add comprehensive tests
4. Ensure examples work
5. Submit a pull request

---

**Next Major Release**: Row selection, column sorting, and React/jQuery wrappers
