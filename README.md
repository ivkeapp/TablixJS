# TablixJS

TablixJS is a modern, lightweight, and dependency-free JavaScript library for building powerful, responsive data tables with comprehensive features. Built with ES6 modules and designed for performance, TablixJS provides advanced pagination, selection, sorting, filtering, search, and data management capabilities with both client-side and server-side support.

## Why TablixJS?

- **Zero Dependencies** - Pure JavaScript with no external libraries required, optional jQuery/React integrations available
- **Modular Architecture** - Clean separation of concerns with dedicated managers
- **Performance Focused** - Optimized for large datasets with virtual scrolling support
- **Framework Agnostic** - Works with vanilla JS, React, jQuery, and other frameworks (all optional)
- **TypeScript Ready** - ES6 modules with full IDE support
- **Highly Customizable** - Extensive theming system and plugin architecture
- **Accessible** - ARIA labels, keyboard navigation, and screen reader support

## Core Features

### **📄 Pagination System**
- **Client & Server Modes** - Efficient pagination for both local and remote data sources
- **Automatic Controls** - Auto-generated pagination controls with zero configuration
- **Smart Page Navigation** - Intelligent page number display with ellipsis for large datasets  
- **Page Size Management** - Dynamic page size selection with customizable options
- **Performance Optimized** - Efficient data slicing and memory management
- **Event Hooks** - Complete pagination event system for custom integrations

### **🔍 Search & Filtering**
- **Global Search** - Real-time search across all columns with customizable debounce
- **Advanced Column Filtering** - Value-based and condition-based filtering per column
- **Filter UI Components** - Rich dropdown interfaces with multi-select capabilities
- **Server-side Support** - Async filtering with custom filter functions
- **Filter Persistence** - Maintain filters across pagination and data updates
- **Visual Indicators** - Clear filter status with badges and tooltips

### **📊 Sorting Capabilities**
- **Multi-column Sorting** - Sort by multiple columns with priority indicators
- **Data Type Aware** - Intelligent sorting for strings, numbers, dates, and custom types
- **Client & Server Modes** - Local sorting or async server-side sorting
- **Custom Sort Functions** - Define custom sorting logic per column
- **Visual Feedback** - Clear sort direction indicators and hover effects
- **Stable Sorting** - Consistent sort results across operations

### **✅ Selection Features**
- **Single & Multi-Row Selection** - Choose between single or multiple row selection modes
- **Advanced Interaction** - Ctrl+click for toggle, Shift+click for range selection
- **Drag Selection** - Click and drag to select multiple consecutive rows (multi mode)
- **Stable Selection** - Selection preserved across pagination, filtering, and sorting
- **Visual Feedback** - Real-time hover effects and drag overlays during selection
- **Event System** - `beforeSelect` and `afterSelect` events for custom validation
- **Programmatic API** - Complete selection management through code
- **Theme Integration** - Consistent selection styling across all themes

### **🔄 Async Data Loading**
- **Multiple Loading Methods** - Direct arrays, URL endpoints, or custom async functions
- **Loading States** - Built-in loading indicators and error handling
- **Data Transformation** - Transform server responses to match table format
- **Authentication Support** - Custom headers and request configuration
- **Error Recovery** - Graceful error handling with user feedback
- **Event Hooks** - `beforeLoad`, `afterLoad`, and `loadError` events

### **🎨 Theming & Styling**
- **CSS Custom Properties** - Extensive theming with CSS variables
- **Built-in Themes** - Light and dark themes included
- **Responsive Design** - Mobile-friendly controls and layouts
- **Component Styling** - Modular CSS for easy customization
- **Framework Integration** - Works seamlessly with existing CSS frameworks

### **🌍 Localization System** ⭐ **NEW**
- **Built-in Multi-language Support** - English, French, and Spanish translations included
- **Dynamic Language Switching** - Change languages without table recreation
- **Fallback System** - Missing translations automatically fall back to English
- **Plugin-friendly** - Easy for plugin developers to add their own translations
- **Number & Date Formatting** - Locale-aware formatting using native `Intl` APIs
- **Zero Dependencies** - No external i18n libraries required

### **⚡ Performance Features**
- **Virtual Scrolling** - Handle thousands of rows with smooth scrolling
- **Lazy Loading** - Load data on demand for better performance
- **Memory Optimization** - Efficient DOM management and data handling
- **Debounced Operations** - Smart debouncing for search and filter operations
- **Optimized Rendering** - Minimal DOM updates and reflows

## Quick Start

### **Installation**

#### **Option 1: Install via npm (Recommended)**

```bash
npm install tablixjs
```

#### **Option 2: Direct Download**

```bash
# Clone the repository
git clone https://github.com/ivkeapp/TablixJS.git

# Or download and include the files directly
```

### **Basic Usage**

#### **Using npm Package in Node.js/Browser**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link rel="stylesheet" href="./node_modules/tablixjs/dist/tablixjs.css">
</head>
<body>
  <div id="my-table"></div>
  
  <!-- UMD Build for Browser -->
  <script src="./node_modules/tablixjs/dist/tablixjs.umd.min.js"></script>
  <script>
    const table = new TablixJS.Table('#my-table', {
      data: [
        { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User' },
        { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'Editor' }
      ],
      columns: [
        { name: 'id', title: 'ID', width: '60px' },
        { name: 'name', title: 'Full Name' },
        { name: 'email', title: 'Email Address' },
        { 
          name: 'role', 
          title: 'User Role',
          renderer: (value) => `<span class="role-badge role-${value.toLowerCase()}">${value}</span>`
        }
      ]
    });
  </script>
</body>
</html>
```

#### **Using ES Modules**

```javascript
// For modern bundlers (Webpack, Vite, etc.)
import TablixJS from 'tablixjs';

const table = new TablixJS('#my-table', {
  data: [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
  ],
  columns: [
    { name: 'id', title: 'ID' },
    { name: 'name', title: 'Full Name' },
    { name: 'email', title: 'Email' }
  ]
});
```

#### **Using CommonJS (Node.js)**

```javascript
const { Table } = require('tablixjs');

// Note: TablixJS requires a DOM environment
// Use with jsdom or similar for server-side rendering
```

#### **Direct Source Usage (Development)**

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="./src/styles/tablix.css">
</head>
<body>
  <div id="my-table"></div>
  
  <script type="module">
    import Table from './src/core/Table.js';
    
    const table = new Table('#my-table', {
      data: [
        { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User' },
        { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'Editor' }
      ],
      columns: [
        { name: 'id', title: 'ID', width: '60px' },
        { name: 'name', title: 'Full Name' },
        { name: 'email', title: 'Email Address' },
        { 
          name: 'role', 
          title: 'User Role',
          renderer: (value) => `<span class="role-badge role-${value.toLowerCase()}">${value}</span>`
        }
      ]
    });
  </script>
</body>
</html>
```

### **Available Builds**

TablixJS provides multiple build formats:

- **`dist/tablixjs.umd.min.js`** - Minified UMD build for browsers (global `TablixJS`)
- **`dist/tablixjs.esm.js`** - ES Module build for modern bundlers
- **`dist/tablixjs.cjs.js`** - CommonJS build for Node.js
- **`dist/tablix.jquery.js`** - TablixJS + jQuery wrapper bundled (requires jQuery)
- **`dist/tablix-jquery-plugin.js`** - jQuery plugin only (requires TablixJS + jQuery loaded separately)
- **`dist/tablixjs.css`** - Complete CSS with all styles
- **`dist/tablixjs-theme-dark.css`** - Dark theme
- **`dist/tablixjs-theme-default.css`** - Default theme

### **jQuery Integration Options**

TablixJS provides **multiple jQuery integration patterns** while maintaining its **dependency-free core**:

#### **Option 1: Bundled jQuery Wrapper (Easiest)**

Single file containing both TablixJS and jQuery wrapper:

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="node_modules/tablixjs/dist/tablixjs.css">
</head>
<body>
  <div id="myTable"></div>
  
  <!-- Include jQuery -->
  <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
  
  <!-- Include TablixJS with jQuery wrapper bundled -->
  <script src="node_modules/tablixjs/dist/tablix.jquery.min.js"></script>
  
  <script>
    $(document).ready(function() {
      $('#myTable').tablixjs({
        data: [
          { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin' },
          { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User' }
        ],
        columns: [
          { name: 'id', title: 'ID' },
          { name: 'name', title: 'Full Name' },
          { name: 'email', title: 'Email Address' },
          { name: 'role', title: 'User Role' }
        ],
        pagination: { enabled: true, pageSize: 10 },
        sorting: { enabled: true },
        filtering: { enabled: true },
        selection: { enabled: true, mode: 'multi' }
      });
    });
```

#### **Option 2: Standalone Plugin (Maximum Flexibility)**

Load TablixJS core and jQuery plugin separately:

```html
<!-- Include jQuery -->
<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>

<!-- Include TablixJS core -->
<script src="node_modules/tablixjs/dist/tablixjs.umd.min.js"></script>

<!-- Include jQuery plugin -->
<script src="node_modules/tablixjs/dist/tablix-jquery-plugin.min.js"></script>

<script>
  // Use jQuery API
  $('#myTable').tablixjs(options);
  
  // Or mix with vanilla API
  const table = new TablixJS.Table('#otherTable', options);
</script>
```

#### **Option 3: NPM Import**

```javascript
// Import bundled jQuery version
import 'tablixjs/jquery';

// Use jQuery as normal
$('#myTable').tablixjs(options);

// Access the instance
const tableInstance = $('#myTable').data('tablixjs');
  </script>
</body>
</html>
```

#### **jQuery Method Calls**

```javascript
// Load new data
$('#myTable').tablixJS('loadData', newDataArray);

// Get current data
var currentData = $('#myTable').tablixJS('getData');

// Get selected rows
var selectedData = $('#myTable').tablixJS('getSelectedData');
var selectedIds = $('#myTable').tablixJS('getSelectedIds');

// Selection methods
$('#myTable').tablixJS('selectRows', [1, 2, 3]);
$('#myTable').tablixJS('selectAllRows');
$('#myTable').tablixJS('clearSelection');

// Filtering and search
$('#myTable').tablixJS('applyFilter', 'status', { type: 'value', values: ['Active'] });
$('#myTable').tablixJS('setSearchTerm', 'john');
$('#myTable').tablixJS('clearAllFilters');

// Pagination
$('#myTable').tablixJS('nextPage');
$('#myTable').tablixJS('goToPage', 3);
$('#myTable').tablixJS('changePageSize', 25);

// Destroy table
$('#myTable').tablixJS('destroy');
```

#### **jQuery Events**

```javascript
$('#myTable')
  .on('tablixjs:afterLoad', function(event, data) {
    console.log('Data loaded:', data);
  })
  .on('tablixjs:selectionChanged', function(event, selectionData) {
    console.log('Selection changed:', selectionData.selectedIds);
  })
  .on('tablixjs:afterFilter', function(event, filterData) {
    console.log('Filter applied');
  });
```

> **See also:** [jQuery Wrapper Documentation](docs/jquery-wrapper.md) | [jQuery Example Demo](examples/jquery-wrapper.html)

### **Advanced Configuration**

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
  selection: {
    enabled: true,            // Enable row selection
    mode: 'multi',           // 'single' or 'multi'
    dataIdKey: 'id'          // Key to use as stable row identifier
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

TablixJS follows a modular architecture with dedicated managers for each major feature area. This design ensures clean separation of concerns, easy testing, and extensibility.

### **Core Components**

| Component | Purpose | Status |
|-----------|---------|--------|
| **Table.js** | Main orchestrator and public API | ✅ Complete |
| **DataManager.js** | Data management, filtering, and transformation | ✅ Complete |
| **PaginationManager.js** | Client/server pagination implementation | ✅ Complete |
| **SortingManager.js** | Column sorting with multi-column support | ✅ Complete |
| **SelectionManager.js** | Row selection with single/multi modes | ✅ Complete |
| **FilterManager.js** | Advanced filtering logic and conditions | ✅ Complete |
| **FilterUI.js** | Filter UI components and interactions | ✅ Complete |
| **SearchManager.js** | Global search functionality | ✅ Complete |
| **Renderer.js** | DOM rendering and control generation | ✅ Complete |
| **EventManager.js** | Event system for state tracking | ✅ Complete |
| **ColumnManager.js** | Column configuration and management | ✅ Complete |
| **VirtualScroll.js** | Virtual scrolling for large datasets | ✅ Complete |

### **Framework Wrappers**

| Wrapper | Purpose | Status |
|---------|---------|--------|
| **tablixjs-jquery.js** | jQuery plugin wrapper | ✅ Complete |
| **TableReact.jsx** | React component wrapper | 🔄 In Progress |
| **Vue Integration** | Vue.js component | 📋 Planned |
| **Angular Integration** | Angular component | 📋 Planned |

### **Project Structure**

```
TablixJS/
├── src/
│   ├── core/                    # Core table functionality
│   │   ├── Table.js            # Main API and orchestrator
│   │   ├── DataManager.js      # Data management & operations
│   │   ├── PaginationManager.js # Pagination logic
│   │   ├── SortingManager.js   # Column sorting
│   │   ├── SelectionManager.js # Row selection
│   │   ├── FilterManager.js    # Data filtering
│   │   ├── FilterUI.js         # Filter interface components
│   │   ├── SearchManager.js    # Global search
│   │   ├── Renderer.js         # DOM rendering
│   │   ├── EventManager.js     # Event system
│   │   ├── ColumnManager.js    # Column management
│   │   └── VirtualScroll.js    # Virtual scrolling
│   ├── styles/                 # CSS stylesheets
│   │   ├── tablix.css         # Main stylesheet (imports all)
│   │   ├── table-core.css     # Base table styles
│   │   ├── pagination-core.css # Pagination controls
│   │   ├── selection-core.css  # Selection styling
│   │   ├── sorting-core.css    # Sorting indicators
│   │   ├── filtering-core.css  # Filter UI styles
│   │   ├── search-core.css     # Search component
│   │   ├── virtual-scroll-core.css # Virtual scroll
│   │   └── themes/            # Theme variations
│   │       ├── default.css    # Default light theme
│   │       └── dark.css       # Dark theme
│   ├── jquery/                # jQuery wrapper
│   │   ├── index.js           # jQuery wrapper entry point
│   │   └── tablixjs-jquery.js # jQuery plugin implementation
│   └── react/                 # React wrapper
│       └── TableReact.jsx     # React component
├── examples/                  # Usage examples and demos
├── docs/                     # Documentation files
├── LICENSE                   # MIT license
├── package.json             # Project configuration
└── README.md               # This file
```

## Usage Examples

### **Client-side Pagination**
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
    enabled: true,
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

### **Column Sorting**
```javascript
const table = new Table('#sortableTable', {
  data: employees,
  columns: [
    { name: 'name', title: 'Name', sortable: true },
    { name: 'age', title: 'Age', sortable: true, sortType: 'number' },
    { name: 'joinDate', title: 'Join Date', sortable: true, sortType: 'date' },
    { name: 'salary', title: 'Salary', sortable: true, sortType: 'number' }
  ],
  sorting: {
    enabled: true,
    mode: 'client', // or 'server'
    multiColumn: true // Allow sorting by multiple columns
  }
});

// Programmatic sorting
table.sortBy('name', 'asc');
table.sortBy([
  { column: 'department', direction: 'asc' },
  { column: 'salary', direction: 'desc' }
]);
```

### **Advanced Filtering**
```javascript
const table = new Table('#filterableTable', {
  data: employees,
  columns: [
    { name: 'name', title: 'Name', filterable: true },
    { name: 'department', title: 'Department', filterable: true },
    { name: 'salary', title: 'Salary', filterable: true, filterType: 'number' }
  ],
  filtering: {
    enabled: true,
    mode: 'client',
    showBadges: true,
    showTooltips: true
  }
});

// Programmatic filtering
table.applyFilter('department', { type: 'value', values: ['IT', 'Engineering'] });
table.applyFilter('salary', { 
  type: 'condition', 
  operator: 'gte', 
  value: 50000 
});
```

### **Global Search**
```javascript
const table = new Table('#searchableTable', {
  data: employees,
  columns: [...],
  search: {
    enabled: true,
    placeholder: 'Search employees...',
    searchDelay: 300,
    caseSensitive: false
  },
  controls: {
    search: true,
    position: 'top'
  }
});

// Programmatic search
table.search('john doe');
table.clearSearch();
```

> For sorting examples, see [Sorting Demo](examples/sorting-demo.html) and [Sorting Usage Examples](examples/sorting-usage-examples.js).

## Async Data Loading

TablixJS supports flexible asynchronous data loading with multiple approaches while maintaining full backwards compatibility.

### **Loading Methods**

#### **1. Direct Array Loading** (Standard)
```javascript
// Load data directly from an array
const data = [
  { id: 1, name: 'John Doe', email: 'john@example.com' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
];
await table.loadData(data);
```

#### **2. URL-based Loading** (Async)
```javascript
// Load data from a REST API endpoint
await table.loadData('https://api.example.com/users');

// The API should return a JSON array:
// [
//   { "id": 1, "name": "John Doe", "email": "john@example.com" },
//   { "id": 2, "name": "Jane Smith", "email": "jane@example.com" }
// ]
```

#### **3. Custom Async Function Loading** (Advanced)
```javascript
// Load with custom async function for complex scenarios
const customLoader = async () => {
  const response = await fetch('/api/users', {
    headers: { 'Authorization': 'Bearer ' + authToken }
  });
  const data = await response.json();
  return data.users; // Transform if needed
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

### **Loading Event Hooks**
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

> **Learn More:** See [Async Data Loading Guide](docs/async-data-loading.md) for complete documentation and [live demo](examples/async-data-loading-demo.html).

### **Localization with Multiple Languages**

```javascript
import { frenchTranslations } from './src/locales/fr.js';
import { spanishTranslations } from './src/locales/es.js';

const table = new Table('#multiLangTable', {
  data: employees,
  columns: [...],
  language: 'fr',
  translations: {
    fr: frenchTranslations,
    es: spanishTranslations
  },
  pagination: {
    enabled: true,
    pageSize: 10
  },
  selection: {
    enabled: true,
    mode: 'multi'
  }
});

// Dynamic language switching
table.setLanguage('es'); // Switch to Spanish
table.setLanguage('fr'); // Switch to French

// Add custom translations
table.addTranslations('de', {
  'pagination.next': 'Nächste',
  'pagination.previous': 'Vorherige',
  'search.placeholder': 'Suchen...'
});

// Use translations in your code
console.log(table.t('pagination.next')); // "Suivant" in French
console.log(table.t('pagination.showingRecords', {
  startRow: 1, endRow: 10, totalRows: 100
})); // "Affichage de 1 à 10 sur 100 enregistrements"

// Format numbers with locale
const price = table.formatNumber(1234.56, { style: 'currency', currency: 'EUR' });
console.log(price); // "1 234,56 €" in French locale
```
```javascript
### **Event System**
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

// Search events
table.on('afterSearch', ({ query, results }) => {
  console.log(`Search for "${query}" returned ${results.length} results`);
});

// Sorting events
table.on('afterSort', ({ column, direction }) => {
  console.log(`Sorted by ${column} in ${direction} order`);
});
```

> **Learn More:** For filtering examples, see [Filtering Demo](examples/filtering-demo.html) and [Filtering Usage Examples](examples/filtering-usage-examples.js).

## Row Selection

TablixJS includes powerful row selection functionality with support for both single and multi-row selection modes.

### **Selection Setup**

```javascript
const table = new Table('#tableContainer', {
  data: employees,
  columns: [...],
  selection: {
    enabled: true,        // Enable selection (default: false)
    mode: 'multi',       // 'single' or 'multi' (default: 'single')
    dataIdKey: 'id'      // Key to use as stable row identifier
  }
});
```

### **Selection Modes**

#### **Single Mode**
- Click any row to select it
- Previous selection is automatically cleared
- Click selected row to deselect it

#### **Multi Mode**
- **Normal click**: Select row (clears other selections)
- **Ctrl+Click**: Toggle individual row selection
- **Shift+Click**: Select range from last selected row
- **Drag Selection**: Click and drag to select multiple consecutive rows
- **Click selected row**: Deselect if it's the only selected row

### **Selection API**

```javascript
// Get selection information
const selectedData = table.getSelectedData();     // Array of row objects
const selectedIds = table.getSelectedIds();       // Array of row IDs
const count = table.getSelectionCount();          // Number of selected rows

// Check if specific row is selected
const isSelected = table.isRowSelected('123');

// Programmatic selection
table.selectRows(['1', '3', '5']);    // Select specific rows by ID
table.selectRows('2');                // Select single row
table.deselectRows(['1', '3']);       // Deselect specific rows
table.clearSelection();               // Clear all selections

// Enable/disable selection
table.enableSelection();
table.disableSelection();
table.setSelectionMode('single');     // Change mode dynamically
```

### **Selection Events**

```javascript
// Before selection changes
table.eventManager.on('beforeSelect', (event) => {
  console.log('About to select:', event.rowData);
  console.log('Current selection:', event.currentSelection);
  
  // Optionally prevent selection by throwing an error
  // if (event.rowData.locked) throw new Error('Row is locked');
});

// After selection changes
table.eventManager.on('afterSelect', (event) => {
  console.log('Selected rows:', event.selectedRows);
  console.log('Selected data:', event.selectedData);
  
  // Update UI based on selection
  updateToolbar(event.selectedData);
});
```

### **Selection with Other Features**

Selection automatically works with all table features:

- **Pagination**: Selection persists across page changes
- **Filtering**: Rows hidden by filters are automatically deselected
- **Sorting**: Selection follows the data (uses stable row IDs)
- **Data Updates**: Selection is preserved when data is reloaded

> **Learn More:** For a complete interactive demo, see [Selection Demo](examples/selection-demo.html) and [Selection Usage Examples](examples/selection-usage-examples.js).

## Examples

- **[Basic Usage](examples/vanilla.html)** - Simple client-side pagination
- **[Async Data Loading Demo](examples/async-data-loading-demo.html)** - Asynchronous data loading examples
- **[Column Formatting Demo](examples/column-formatting-demo.html)** - Custom column formatting
- **[Complete Pagination Demo](examples/complete-pagination-demo.html)** - All pagination features
- **[Filtering Demo](examples/filtering-demo.html)** - Data filtering capabilities
- **[Selection Demo](examples/selection-demo.html)** - Row selection functionality 🆕
- **[Drag Selection Demo](examples/drag-selection-demo.html)** - Advanced drag-to-select functionality 🔥
- **[Localization Demo](examples/localization-demo.html)** - Multi-language support and dynamic language switching ⭐
- **[Auto Controls](examples/auto-controls.html)** - Automatic control generation
- **[Theme Demo](examples/theme-demo.html)** - Theming and styling examples
- **[Sorting Demo](examples/sorting-demo.html)** - Column sorting functionality
- **[Pagination Samples](examples/pagination-samples.js)** - Implementation patterns
- **[jQuery Integration](examples/jquery-wrapper.html)** - jQuery wrapper usage
- **[React Integration](examples/react.html)** - React component usage

## Styling & Theming

TablixJS comes with a comprehensive theming system built on CSS custom properties, making it easy to customize the appearance while maintaining consistency.

### **Quick Setup**

Include the main stylesheet in your HTML:
```html
<link rel="stylesheet" href="./src/styles/tablix.css">
```

### **Theme System**

#### **Built-in Themes**

**Light Theme (Default)**
```html
<html data-theme="light">
<!-- or -->
<div class="tablix-wrapper light">
```

**Dark Theme**
```html
<html data-theme="dark">
<!-- or -->
<div class="tablix-wrapper dark">
```

#### **Custom Themes**

Create custom themes using CSS custom properties:

```css
.my-custom-theme {
  /* Table colors */
  --tablix-bg: #f8f9fa;
  --tablix-border-color: #dee2e6;
  --tablix-text-color: #212529;
  
  /* Header styling */
  --tablix-header-bg: #e9ecef;
  --tablix-header-text-color: #495057;
  --tablix-header-border-color: #adb5bd;
  
  /* Row styling */
  --tablix-row-even-bg: #ffffff;
  --tablix-row-odd-bg: #f8f9fa;
  --tablix-row-hover-bg: #e3f2fd;
  
  /* Selection colors */
  --tablix-row-selected-bg: #cce5ff;
  --tablix-row-selected-hover-bg: #b3d9ff;
  --tablix-row-last-selected-bg: #007bff;
  --tablix-row-last-selected-color: #ffffff;
  
  /* Control styling */
  --tablix-btn-bg: #007bff;
  --tablix-btn-text-color: #ffffff;
  --tablix-btn-hover-bg: #0056b3;
  --tablix-btn-disabled-bg: #6c757d;
  
  /* Sort indicators */
  --tablix-sort-indicator-color: #6c757d;
  --tablix-sort-active-color: #007bff;
}
```

#### **Component-Specific Styling**

**Pagination Controls**
```css
.tablix-pagination {
  --tablix-pagination-gap: 0.5rem;
  --tablix-pagination-btn-padding: 0.375rem 0.75rem;
  --tablix-pagination-btn-border-radius: 0.25rem;
}
```

**Filter UI**
```css
.tablix-filter-dropdown {
  --tablix-filter-dropdown-bg: #ffffff;
  --tablix-filter-dropdown-border: 1px solid #ced4da;
  --tablix-filter-dropdown-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
}
```

**Search Component**
```css
.tablix-search {
  --tablix-search-input-bg: #ffffff;
  --tablix-search-input-border: 1px solid #ced4da;
  --tablix-search-input-focus-border: #007bff;
}
```

### **Responsive Design**

TablixJS includes responsive breakpoints for mobile-friendly tables:

```css
/* Mobile styles (< 768px) */
@media (max-width: 767.98px) {
  .tablix-wrapper {
    --tablix-font-size: 0.875rem;
    --tablix-cell-padding: 0.5rem;
  }
  
  .tablix-pagination {
    --tablix-pagination-gap: 0.25rem;
    --tablix-pagination-btn-padding: 0.25rem 0.5rem;
  }
}

/* Tablet styles (768px - 991.98px) */
@media (min-width: 768px) and (max-width: 991.98px) {
  .tablix-wrapper {
    --tablix-font-size: 0.9375rem;
  }
}
```

### **Advanced Customization**

#### **Custom CSS Classes**

Add custom classes through configuration:

```javascript
const table = new Table('#table', {
  // ... other options
  cssClasses: {
    wrapper: ['my-table-wrapper', 'custom-theme'],
    table: ['my-table'],
    headerRow: ['my-header'],
    dataRow: ['my-row'],
    selectedRow: ['my-selected-row']
  }
});
```

#### **Dynamic Theme Switching**

```javascript
// Switch themes programmatically
function switchTheme(themeName) {
  document.documentElement.setAttribute('data-theme', themeName);
  
  // Or update CSS classes
  const wrapper = document.querySelector('.tablix-wrapper');
  wrapper.className = `tablix-wrapper ${themeName}`;
}

// Theme switcher UI
const themeSelector = document.getElementById('theme-selector');
themeSelector.addEventListener('change', (e) => {
  switchTheme(e.target.value);
});
```

> **Learn More:** See the [Theming Guide](docs/theming.md) for complete customization options and the [Theme Demo](examples/theme-demo.html) for interactive examples.

## Getting Started

### **Development Setup**

```bash
# Clone the repository
git clone https://github.com/ivkeapp/TablixJS.git
cd TablixJS

# Start development server (requires Node.js)
npm run dev

# Open your browser to:
# http://localhost:5174
```

### **Quick Links**
- **🏠 [Example Index](examples/index.html)** - Main examples page with all demos
- **⚡ [Basic Demo](examples/vanilla.html)** - Start here for basic usage
- **🎯 [Complete Demo](examples/complete-pagination-demo.html)** - Full feature showcase
- **🎮 [Playground](examples/playground.html)** - Interactive configuration tool

### **Production Usage**

For production, simply include the files directly (no build process required):

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="path/to/tablix/src/styles/tablix.css">
</head>
<body>
  <div id="my-table"></div>
  
  <script type="module">
    import Table from 'path/to/tablix/src/core/Table.js';
    // Your table code here...
  </script>
</body>
</html>
```

## Examples & Demos

### **Core Features**
- **[Basic Usage](examples/vanilla.html)** - Simple client-side pagination setup
- **[Auto Controls](examples/auto-controls.html)** - Automatic control generation
- **[Complete Pagination](examples/complete-pagination-demo.html)** - All pagination features

### **Data Management**
- **[Async Data Loading](examples/async-data-loading-demo.html)** - Asynchronous data loading examples
- **[Server-side Integration](examples/pagination.html)** - Server-side pagination and filtering

### **User Interaction**
- **[Row Selection](examples/selection-demo.html)** - Single and multi-row selection 🆕
- **[Drag Selection](examples/drag-selection-demo.html)** - Advanced drag-to-select functionality ⭐
- **[Sorting](examples/sorting-demo.html)** - Column sorting with multi-column support
- **[Filtering](examples/filtering-demo.html)** - Advanced filtering capabilities
- **[Search](examples/search-test.html)** - Global search functionality

### **Customization**
- **[Column Formatting](examples/column-formatting-demo.html)** - Custom column formatting and renderers
- **[Theme Demo](examples/theme-demo.html)** - Theming and styling examples
- **[Localization Demo](examples/localization-demo.html)** - Multi-language support with language switching ⭐

### **Performance**
- **[Virtual Scrolling](examples/virtual-scroll-demo.html)** - Handle large datasets efficiently
- **[Virtual Scroll Test Suite](examples/virtual-scroll-test-suite.html)** - Performance testing

### **Framework Integration**
- **[jQuery Integration](examples/jquery-wrapper.html)** - jQuery wrapper usage
- **[React Integration](examples/react.html)** - React component usage

### **Testing & Development**
- **[Async Loading Test](examples/async-loading-test.html)** - Async functionality testing
- **[Virtual Scroll Bugfix Test](examples/virtual-scroll-bugfix-test.html)** - Bug testing scenarios

## Documentation

### **API Documentation**
- **[Pagination API](docs/pagination.md)** - Complete pagination guide with examples
- **[Async Data Loading](docs/async-data-loading.md)** - Asynchronous data loading patterns
- **[Selection Guide](docs/selection.md)** - Row selection functionality and API
- **[Filtering](docs/filtering.md)** - Advanced data filtering documentation
- **[Sorting](docs/sorting.md)** - Column sorting with multi-column support
- **[Simple Sorting](docs/sorting-simple.md)** - Basic sorting implementation
- **[Virtual Scrolling](docs/virtual-scrolling.md)** - Virtual scrolling for large datasets
- **[Virtual Scroll Bugfixes](docs/virtual-scrolling-bugfixes.md)** - Known issues and fixes
- **[Localization System](docs/localization.md)** - Comprehensive internationalization guide ⭐

### **Customization Guides**
- **[Theming Guide](docs/theming.md)** - CSS customization and theme system
- **[Column Formatting](docs/column-formatting.md)** - Custom column formatting and renderers
- **[Plugin Architecture](docs/plugin-architecture.md)** - Extending TablixJS functionality

## 🧪 Testing & Examples

### **Built Version Test**
Test the production-ready built version with our comprehensive example:

```bash
# Build the library
npm run build

# Start local server
npm run dev

# Navigate to: http://localhost:5174/examples/built-version-test.html
```

**Features Tested:**
- ✅ All module formats (ESM, CJS, UMD)
- ✅ Data loading (static & async)
- ✅ Pagination with dynamic page sizes
- ✅ Multi-column sorting
- ✅ Advanced filtering and search
- ✅ Row selection (single & multi)
- ✅ Virtual scrolling with 10K+ rows
- ✅ Theme switching (default & dark)
- ✅ Performance monitoring
- ✅ Event system validation

### **Development Examples**
Explore individual features with focused examples:
- **[Complete Features Demo](examples/built-version-test.html)** - All features in production build
- **[Pagination Examples](examples/pagination.html)** - Advanced pagination patterns
- **[Selection Demo](examples/selection-demo.html)** - Interactive selection modes
- **[Virtual Scrolling](examples/virtual-scroll-demo.html)** - Large dataset performance
- **[Filtering Demo](examples/filtering-demo.html)** - Advanced filtering UI
- **[Theming Demo](examples/theme-demo.html)** - Theme customization

> **💡 Pro Tip:** Use `examples/built-version-test.html` to verify everything works after making changes to the library!

### **API Reference**

#### **Table Class**
```javascript
// Constructor
new Table(container, options)

// Data methods
table.loadData(data)              // Load data (array, URL, or function)
table.getData()                   // Get current data
table.getFilteredData()           // Get filtered data
table.refreshData()               // Reload data from source

// Pagination methods
table.nextPage()                  // Go to next page
table.prevPage()                  // Go to previous page
table.goToPage(page)              // Go to specific page
table.changePageSize(size)        // Change page size
table.getPaginationInfo()         // Get pagination state

// Selection methods
table.selectRows(ids)             // Select rows by ID
table.deselectRows(ids)           // Deselect rows by ID
table.clearSelection()            // Clear all selections
table.getSelectedData()           // Get selected row data
table.getSelectedIds()            // Get selected row IDs
table.getSelectionCount()         // Get selection count

// Sorting methods
table.sortBy(column, direction)   // Sort by column
table.clearSort()                 // Clear sorting
table.getSortState()              // Get current sort state

// Filtering methods
table.applyFilter(column, filter) // Apply column filter
table.clearFilter(column)         // Clear column filter
table.clearAllFilters()           // Clear all filters
table.getFilterState()            // Get current filter state

// Search methods
table.search(query)               // Apply global search
table.clearSearch()               // Clear search
table.getSearchQuery()            // Get current search query

// Localization methods
table.t(key, params)              // Get translated string
table.setLanguage(language)       // Change current language
table.addTranslations(lang, obj)  // Add language translations
table.getCurrentLanguage()        // Get current language
table.formatNumber(num, options)  // Format number with locale
table.formatDate(date, options)   // Format date with locale

// Event methods
table.on(event, callback)         // Add event listener
table.off(event, callback)        // Remove event listener
table.emit(event, data)           // Emit custom event
```

## ⚡ Performance

### **Benchmarks**

| Feature | Small Dataset (< 1,000 rows) | Medium Dataset (1,000-10,000 rows) | Large Dataset (10,000+ rows) |
|---------|-------------------------------|-------------------------------------|-------------------------------|
| **Client-side Pagination** | Instant | < 100ms | Use Virtual Scrolling |
| **Server-side Pagination** | Instant | Instant | Instant |
| **Column Sorting** | < 50ms | < 200ms | < 500ms |
| **Global Search** | < 10ms | < 100ms | < 300ms |
| **Row Selection** | Instant | Instant | Instant |
| **Virtual Scrolling** | N/A | < 50ms | < 100ms |

### **Optimization Tips**

- **Use Server-side Pagination** for datasets larger than 10,000 rows
- **Enable Virtual Scrolling** for client-side tables with 1,000+ rows
- **Debounce Search** to reduce unnecessary filtering operations
- **Use Row IDs** for stable selection across data operations
- **Lazy Load Data** when possible to reduce initial page load time
- **Optimize Renderers** to avoid complex DOM operations in cell renderers

### **Memory Usage**

- **Client-side Mode**: Keeps all data in memory for fast operations
- **Server-side Mode**: Only current page data in memory
- **Virtual Scrolling**: Renders only visible rows + buffer
- **Selection State**: Minimal memory footprint using row IDs

---

## Troubleshooting

### **Installation & Setup Issues**

#### **"TablixJS is not defined" (Browser)**
**Problem**: Global `TablixJS` object is not available when using UMD build.
```bash
ReferenceError: TablixJS is not defined
```
**Solution**: 
- Ensure correct script tag order and file paths
- Add charset declaration to prevent encoding issues
```html
<meta charset="UTF-8">
<script src="./node_modules/tablixjs/dist/tablixjs.umd.min.js"></script>
<script>
  const table = new TablixJS.Table('#container', options);
</script>
```

#### **"exports is not defined" (Node.js)**
**Problem**: CommonJS/ESM module conflicts in Node.js.
```bash
ReferenceError: exports is not defined
```
**Solution**:
- Use ES modules with `import` for `"type": "module"` packages
- Use CommonJS with `require()` for standard packages
```javascript
// ESM (when "type": "module" in package.json)
import TablixJS from 'tablixjs';

// CommonJS (standard Node.js)
const { Table } = require('tablixjs');
```

#### **"document is not defined" (Node.js)**
**Problem**: TablixJS requires DOM environment, not available in Node.js.
```bash
ReferenceError: document is not defined
```
**Solution**: TablixJS is browser-focused. For Node.js testing:
```bash
npm install jsdom
```
```javascript
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!DOCTYPE html><div id="table"></div>');
global.document = dom.window.document;
global.window = dom.window;
```

#### **npm Package-Lock Issues**
**Problem**: CI/CD failing with `npm ci` requiring package-lock.json.
```bash
npm error The `npm ci` command can only install with an existing package-lock.json
```
**Solution**:
- Remove `package-lock.json` from `.gitignore`
- Commit `package-lock.json` to repository
- Regenerate if needed: `rm package-lock.json && npm install`

### **Build & Development Issues**

#### **Cross-Platform Build Failures**
**Problem**: PowerShell commands failing in Linux CI environments.
```bash
sh: 1: powershell: not found
```
**Solution**: Use cross-platform Node.js commands:
```json
{
  "scripts": {
    "copy:types": "node -e "require('fs').copyFileSync('src/index.d.ts', 'dist/index.d.ts')"",
    "clean": "node -e "require('fs').rmSync('dist', {recursive: true, force: true})""
  }
}
```

#### **GitHub Actions Deprecated Warnings**
**Problem**: Using outdated action versions.
```bash
Error: This request has been automatically failed because it uses a deprecated version of `actions/upload-artifact: v3`
```
**Solution**: Update to latest versions:
```yaml
- uses: actions/upload-artifact@v4  # not v3
- uses: actions/checkout@v4         # not v3
```

### **Runtime Issues**

#### **Character Encoding Problems**
**Problem**: Unicode characters displaying as garbled text (âŸ³ instead of ⟳).
**Solution**: Add proper charset declaration:
```html
<meta charset="UTF-8">
```

#### **Container Element Issues**
**Problem**: "querySelector is not a function" errors.
```bash
TypeError: this.table.container.querySelector is not a function
```
**Solution**: Ensure container parameter is correct:
```javascript
// Correct API
new TablixJS.Table('#container', options);  // selector string
new TablixJS.Table(document.getElementById('container'), options);  // DOM element

// Incorrect
new TablixJS.Table({ container: '#container', ...options });  // wrong structure
```

#### **Column Configuration Errors**
**Problem**: "Column must have a 'name' property" error.
```bash
Error: TablixJS: Column must have a "name" property
```
**Solution**: Use `name` property, not `key`:
```javascript
// Correct
columns: [
  { name: 'id', title: 'ID' },      // ✓ 'name'
  { name: 'email', title: 'Email' } // ✓ 'name'
]

// Incorrect
columns: [
  { key: 'id', title: 'ID' },       // ✗ 'key' 
  { key: 'email', title: 'Email' }  // ✗ 'key'
]
```

### **Feature-Specific Issues**

#### **Pagination Not Rebuilding Properly**
**Problem**: Disabled pagination still shows controls, table doesn't show all data.
**Solution**: Re-initialize table when changing pagination state:
```javascript
function togglePagination() {
  paginationEnabled = !paginationEnabled;
  const currentData = table.getOriginalData();
  initializeTable(currentData, {
    pagination: { enabled: paginationEnabled }
  });
}
```

#### **Virtual Scroll vs Pagination Conflicts**
**Problem**: Both virtual scrolling and pagination active simultaneously.
**Solution**: Make features mutually exclusive:
```javascript
if (paginationEnabled && virtualScrollEnabled) {
  virtualScrollEnabled = false;  // Disable conflicting feature
}
```

#### **Theme Switching Not Working**
**Problem**: Dark theme not applying properly.
**Solution**: Apply `data-theme` attribute for CSS custom properties:
```javascript
function switchTheme(theme) {
  document.body.removeAttribute('data-theme');
  if (theme !== 'default') {
    document.body.setAttribute('data-theme', theme);
  }
  // Load theme CSS file...
}
```

#### **Selection Controls Active When Disabled**
**Problem**: Selection buttons clickable when selection is disabled.
**Solution**: Update control states and disable buttons:
```javascript
function updateControlStates() {
  const selectAllBtn = document.querySelector('[onclick="selectAll()"]');
  if (selectAllBtn) {
    selectAllBtn.disabled = !selectionEnabled;
    selectAllBtn.className = selectionEnabled ? 'secondary' : 'secondary disabled';
  }
}
```

### **Performance Issues**

#### **Large Dataset Rendering Slow**
**Problem**: Browser freezing with 1000+ rows.
**Solution**: Enable virtual scrolling:
```javascript
const table = new TablixJS.Table('#container', {
  data: largeDataset,
  virtualScroll: {
    enabled: true,
    buffer: 10,
    containerHeight: 400
  },
  pagination: { enabled: false }  // Disable for virtual scroll
});
```

#### **Search/Filter Lag**
**Problem**: Typing causes performance issues.
**Solution**: Increase debounce delay:
```javascript
search: {
  enabled: true,
  searchDelay: 500  // Increase from default 300ms
}
```

### **Development Environment Issues**

#### **Local Development Server**
**Problem**: Examples not loading properly.
**Solution**: Use proper development server:
```bash
# Method 1: Project dev server
npm run dev

# Method 2: Static file server
npx serve . -l 8080

# Method 3: Python (if available)
python -m http.server 8000
```

#### **Module Loading Issues**
**Problem**: ES modules not loading in browser.
**Solution**: Ensure proper server setup and file extensions:
```html
<!-- Use type="module" for ES modules -->
<script type="module">
  import Table from './src/core/Table.js';  // Include .js extension
</script>
```

### **Getting Help**

When reporting issues, please include:
- Browser version and operating system
- Node.js version (for build issues)
- Complete error messages from browser console
- Minimal code example that reproduces the issue
- TablixJS version being used

**Useful debugging commands:**
```bash
# Check build output
npm run build
ls -la dist/

# Verify package contents
npm pack --dry-run

# Check for console errors
# Open browser DevTools → Console tab

# Performance debugging
# DevTools → Performance tab → Record
```

---

## 🤝 Contributing

We welcome contributions to TablixJS! Here's how you can help:

### **Getting Started**

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/TablixJS.git
   cd TablixJS
   ```
3. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

### **Development Guidelines**

- **Follow the modular architecture** - each feature should have its own manager
- **Write comprehensive tests** for new functionality
- **Update documentation** for any API changes
- **Ensure examples work** with your changes
- **Follow ES6+ standards** and use modern JavaScript features
- **Maintain backwards compatibility** when possible

### **Testing**

```bash
# Start the development server
npm run dev

# Test your changes in the browser
open http://localhost:5174/examples/
```

### **Submitting Changes**

1. **Test thoroughly** - verify all examples work
2. **Update documentation** if needed
3. **Commit your changes** with descriptive messages
4. **Push to your fork** and create a Pull Request
5. **Describe your changes** in the PR description

### **Feature Requests & Bug Reports**

- **Issues**: Use GitHub Issues for bug reports and feature requests
- **Discussions**: Use GitHub Discussions for questions and ideas
- **Security**: Report security issues privately via email

---

## 📄 License

TablixJS is released under the **MIT License**. See [LICENSE](LICENSE) file for details.

---

## Roadmap

### **Current Version: 0.1.0**
- ✅ Core table functionality with pagination
- ✅ Row selection (single/multi modes)
- ✅ Column sorting and filtering
- ✅ Global search functionality
- ✅ Async data loading
- ✅ Theming system
- ✅ Virtual scrolling
- ✅ Localization system with multi-language support

### **Next Major Release: 0.2.0**
- 🔄 Enhanced jQuery wrapper
- 🔄 Complete React component
- 📋 Vue.js integration
- 📋 Angular component wrapper
- 📋 TypeScript definitions
- 📋 Export functionality (CSV, Excel, PDF)
- 📋 Column reordering via drag & drop
- 📋 Inline editing capabilities

### **Future Releases**
- **Plugin System**: Extensible plugin architecture
- **Advanced Filtering**: Date ranges, regex, custom operators
- **Column Groups**: Grouped column headers
- **Row Grouping**: Hierarchical data grouping
- **Frozen Columns**: Pin columns to left/right
- **Accessibility**: Enhanced ARIA support and keyboard navigation
- **Performance**: Web Workers for large dataset operations

---

**🌟 Star us on GitHub if TablixJS helps your project!**

Built with ❤️ by [Ivan Zarkovic](https://github.com/ivkeapp), AI and contributors.
