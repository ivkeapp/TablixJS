# TablixJS Pagination API Documentation

## Overview

TablixJS provides comprehensive pagination support for both client-side and server-side scenarios. The pagination system is designed to be performant, flexible, and easy to customize.

## Features

- **Client-side pagination**: Slice data locally for small to medium datasets
- **Server-side pagination**: Async data loading for large datasets
- **Consistent API**: Same methods work for both modes
- **Event hooks**: React to pagination changes
- **Customizable UI**: Style pagination controls with CSS
- **Keyboard navigation**: Accessible pagination controls
- **Page size controls**: Allow users to change records per page
- **Mobile responsive**: Adapts to smaller screens

## Basic Usage

### Client-side Pagination

```javascript
import Table from './src/core/Table.js';

const table = new Table('#myTable', {
  data: myDataArray,
  columns: [
    { name: 'id', title: 'ID' },
    { name: 'name', title: 'Name' }
  ],
  pagination: {
    enabled: true,
    pageSize: 10,
    mode: 'client'  // Default mode
  }
});
```

### Server-side Pagination

```javascript
// Define your server data loader
async function loadDataFromServer({ page, pageSize, filters, sorts }) {
  const response = await fetch(`/api/data?page=${page}&size=${pageSize}`);
  const result = await response.json();
  
  return {
    data: result.items,     // Array of records for current page
    totalRows: result.total // Total number of records
  };
}

const table = new Table('#myTable', {
  columns: [...],
  pagination: {
    enabled: true,
    pageSize: 25,
    mode: 'server',
    serverDataLoader: loadDataFromServer
  }
});
```

## Configuration Options

All pagination options are configured in the `pagination` object:

```javascript
pagination: {
  enabled: true,              // Enable/disable pagination
  pageSize: 10,              // Records per page
  mode: 'client',            // 'client' or 'server'
  
  // UI Display Options
  showPageNumbers: true,     // Show numbered page buttons
  maxPageNumbers: 5,         // Max page numbers to show before ellipsis
  showFirstLast: true,       // Show "First" and "Last" buttons
  showPrevNext: true,        // Show "Previous" and "Next" buttons
  showPageSizes: false,      // Show page size selector
  pageSizeOptions: [10, 25, 50, 100], // Available page sizes
  
  // Server-side Options
  serverDataLoader: null     // Function to load data from server
}
```

## API Methods

### Navigation Methods

```javascript
// Go to specific page (1-indexed)
await table.goToPage(3);

// Navigate relative to current page
await table.nextPage();
await table.prevPage();
await table.firstPage();
await table.lastPage();

// Change page size
await table.changePageSize(25);
```

### Information Methods

```javascript
// Get current pagination state
const info = table.getPaginationInfo();
console.log(info);
// Returns:
// {
//   currentPage: 2,
//   totalPages: 10,
//   pageSize: 10,
//   totalRows: 95,
//   startRow: 11,
//   endRow: 20,
//   hasNextPage: true,
//   hasPrevPage: true,
//   isLoading: false
// }
```

### Control Methods

```javascript
// Enable/disable pagination dynamically
await table.setPaginationEnabled(false);
await table.setPaginationEnabled(true);

// Switch between client and server mode
await table.setPaginationMode('server', myServerLoader);
await table.setPaginationMode('client');
```

## Events

Listen to pagination events to react to changes:

```javascript
// Page navigation events
table.on('beforePageChange', ({ oldPage, newPage, pageSize }) => {
  console.log(`Navigating from page ${oldPage} to ${newPage}`);
});

table.on('afterPageChange', ({ oldPage, newPage, pageSize }) => {
  console.log(`Now on page ${newPage}`);
});

// Page size change events
table.on('beforePageSizeChange', ({ oldPageSize, newPageSize }) => {
  console.log(`Changing page size from ${oldPageSize} to ${newPageSize}`);
});

table.on('afterPageSizeChange', ({ newPageSize, page }) => {
  console.log(`Page size changed to ${newPageSize}, now on page ${page}`);
});

// Server-side loading events
table.on('beforePageLoad', ({ page, pageSize }) => {
  console.log('Loading data from server...');
});

table.on('afterPageLoad', ({ page, pageSize, data, totalRows }) => {
  console.log(`Loaded ${data.length} records for page ${page}`);
});

table.on('pageLoadError', (error) => {
  console.error('Failed to load page data:', error);
});
```

## Server-side Data Loader

When using server-side pagination, your data loader function receives these parameters:

```javascript
async function serverDataLoader({
  page,      // Current page number (1-indexed)
  pageSize,  // Number of records per page
  filters,   // Current filter criteria object
  sorts      // Current sort criteria array
}) {
  // Your server request logic here
  const response = await fetch(`/api/data`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ page, pageSize, filters, sorts })
  });
  
  const result = await response.json();
  
  // Must return this structure:
  return {
    data: result.records,    // Array of records for this page
    totalRows: result.total  // Total number of records (for pagination calculation)
  };
}
```

## Integration with Filtering and Sorting

Pagination automatically integrates with filtering and sorting:

```javascript
// When filtering, pagination resets to page 1
await table.filter({ name: 'John' });
console.log(table.getPaginationInfo().currentPage); // 1

// When sorting, pagination resets to page 1
await table.sort([{ column: 'name', direction: 'asc' }]);
console.log(table.getPaginationInfo().currentPage); // 1
```

For server-side pagination, your data loader will receive the current filter and sort state.

## CSS Customization

The pagination controls use CSS classes that you can customize:

```css
/* Main pagination container */
.tablix-pagination { }

/* Information text */
.tablix-pagination-info { }

/* Page size selector */
.tablix-pagination-page-size { }
.tablix-page-size-select { }

/* Navigation controls */
.tablix-pagination-nav { }
.tablix-pagination-btn { }
.tablix-pagination-btn.active { }
.tablix-pagination-btn[disabled] { }

/* Ellipsis */
.tablix-pagination-ellipsis { }

/* Loading indicator */
.tablix-pagination-loading { }
```

## Performance Considerations

### Client-side Pagination
- Best for datasets up to 10,000 records
- All data is kept in memory
- Filtering and sorting happen instantly
- No network requests for navigation

### Server-side Pagination
- Best for large datasets (100,000+ records)
- Only current page data is kept in memory
- Network request required for each page
- Server handles filtering and sorting

## Examples

See the complete examples in:
- `examples/pagination.html` - Comprehensive pagination examples
- `examples/vanilla.html` - Basic usage example

## Migration from Legacy Code

If you're updating from a version without the pagination manager:

1. Update your table initialization to use the new options structure
2. Replace direct `getPageData()` calls with pagination methods
3. Add event listeners for pagination events
4. Update your CSS to use the new class names

```javascript
// OLD
const table = new Table('#table', {
  pagination: { pageSize: 10 }
});

// NEW
const table = new Table('#table', {
  pagination: {
    enabled: true,
    pageSize: 10,
    showPageNumbers: true,
    showPageSizes: true
  }
});
```
