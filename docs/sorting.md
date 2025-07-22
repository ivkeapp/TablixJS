# TablixJS Sorting Feature Documentation

## Overview

TablixJS now includes a comprehensive sorting system that supports both client-side and server-side sorting with advanced features like multi-column sorting, custom sort functions, and full accessibility support.

## Features

### ✨ Core Features
- **Interactive Headers**: Click column headers to cycle through sort states (ascending → descending → unsorted)
- **Multi-column Sorting**: Hold Ctrl/Cmd while clicking headers to sort by multiple columns
- **Custom Sort Functions**: Define custom sorting logic per column for complex data types
- **Auto-detection**: Automatically detects data types (string, number, date, boolean)
- **Visual Indicators**: Sort arrows with order numbers for multi-column sorting
- **Server-side Ready**: Infrastructure for backend sorting integration
- **Accessibility**: Full keyboard support and ARIA labels
- **Event System**: beforeSort and afterSort events with detailed information

### 🎯 Sorting States
Each column can be in one of three states:
1. **Ascending** (↑): Data sorted A-Z, 0-9, oldest-newest
2. **Descending** (↓): Data sorted Z-A, 9-0, newest-oldest  
3. **Unsorted**: No sorting applied to this column

## Basic Usage

### Simple Table with Sorting

```javascript
import Table from './src/core/Table.js';

const table = new Table('#myTable', {
  data: employees,
  columns: [
    { name: 'name', title: 'Employee Name' },
    { name: 'age', title: 'Age', sortType: 'number' },
    { name: 'salary', title: 'Salary', sortType: 'number' },
    { name: 'department', title: 'Department' }
  ],
  sorting: {
    enabled: true,
    multiColumn: true,
    defaultSortType: 'auto'
  }
});
```

### Column Configuration Options

```javascript
columns: [
  {
    name: 'name',
    title: 'Name',
    sortable: true,          // Enable/disable sorting for this column
    sortType: 'string'       // 'auto', 'string', 'number', 'date', 'boolean'
  },
  {
    name: 'salary', 
    title: 'Salary',
    sortType: 'number',
    sortFunction: (a, b) => {
      // Custom sort function
      return parseFloat(a) - parseFloat(b);
    }
  },
  {
    name: 'joinDate',
    title: 'Join Date', 
    sortType: 'date',
    sortFunction: (a, b) => new Date(a) - new Date(b)
  },
  {
    name: 'status',
    title: 'Status',
    sortable: false          // Disable sorting for this column
  }
]
```

## API Reference

### Table Methods

#### `sort(columnName, direction, addToExisting)`
Sort by a specific column programmatically.

```javascript
// Sort by name ascending
await table.sort('name', 'asc');

// Sort by salary descending  
await table.sort('salary', 'desc');

// Clear sort for a column
await table.sort('name', null);

// Multi-column sort: add to existing sorts
await table.sort('department', 'asc', false);  // Primary sort
await table.sort('salary', 'desc', true);      // Add secondary sort
```

**Parameters:**
- `columnName` (string): Column to sort by
- `direction` (string|null): 'asc', 'desc', or null for unsorted
- `addToExisting` (boolean): Add to existing sorts vs replace all

#### `toggleSort(columnName, addToExisting)`
Toggle sort state for a column (mimics header click).

```javascript
// Toggle sort for name column
await table.toggleSort('name');

// Toggle with multi-column support
await table.toggleSort('salary', true);
```

#### `clearSorting()`
Clear all sorting and return to original data order.

```javascript
await table.clearSorting();
```

#### `getSortState()`
Get current sort state information.

```javascript
const sortState = table.getSortState();
console.log(sortState);
// Output: {
//   sorts: [
//     { column: 'department', direction: 'asc' },
//     { column: 'salary', direction: 'desc' }
//   ],
//   mode: 'client',
//   multiColumn: true
// }
```

### Sorting Configuration

```javascript
sorting: {
  enabled: true,              // Enable/disable sorting
  mode: 'client',            // 'client' or 'server'
  multiColumn: true,         // Allow multi-column sorting
  serverSortLoader: null,    // Function for server-side sorting
  defaultSortType: 'auto',   // Default sort type
  caseSensitive: false,      // String comparison case sensitivity
  nullsFirst: false         // Put null values first or last
}
```

## Custom Sort Functions

### Date Sorting
```javascript
{
  name: 'createdAt',
  title: 'Created Date',
  sortFunction: (a, b) => {
    return new Date(a) - new Date(b);
  }
}
```

### Custom Priority Sorting
```javascript
{
  name: 'priority',
  title: 'Priority', 
  sortFunction: (a, b) => {
    const priorities = { 'High': 3, 'Medium': 2, 'Low': 1 };
    return (priorities[b] || 0) - (priorities[a] || 0);
  }
}
```

### Numeric String Sorting
```javascript
{
  name: 'version',
  title: 'Version',
  sortFunction: (a, b) => {
    const parseVersion = (v) => v.split('.').map(n => parseInt(n) || 0);
    const aVersion = parseVersion(a);
    const bVersion = parseVersion(b);
    
    for (let i = 0; i < Math.max(aVersion.length, bVersion.length); i++) {
      const aPart = aVersion[i] || 0;
      const bPart = bVersion[i] || 0;
      if (aPart !== bPart) return aPart - bPart;
    }
    return 0;
  }
}
```

## Event Handling

### Sort Events
```javascript
table.on('beforeSort', (data) => {
  console.log('About to sort:', {
    columnName: data.columnName,
    direction: data.direction, 
    addToExisting: data.addToExisting,
    currentSorts: data.currentSorts
  });
});

table.on('afterSort', (data) => {
  console.log('Sort completed:', {
    columnName: data.columnName,
    direction: data.direction,
    currentSorts: data.currentSorts
  });
  
  // Update external UI or save state
  localStorage.setItem('tableSortState', JSON.stringify(data.currentSorts));
});
```

## Server-side Sorting

For large datasets, implement server-side sorting:

```javascript
const table = new Table('#myTable', {
  columns: [...],
  sorting: {
    enabled: true,
    mode: 'server',
    serverSortLoader: async (params) => {
      // params contains: { sorts, filters, page, pageSize }
      const response = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      
      const result = await response.json();
      
      return {
        data: result.items,
        totalRows: result.totalCount
      };
    }
  }
});
```

### Server Request Format
```javascript
{
  sorts: [
    { column: 'name', direction: 'asc' },
    { column: 'salary', direction: 'desc' }
  ],
  filters: { department: 'Engineering' },
  page: 1,
  pageSize: 10
}
```

## User Interaction

### Mouse Interactions
- **Single Click**: Toggle sort for column (asc → desc → null)
- **Ctrl/Cmd + Click**: Add column to multi-column sort
- **Header Hover**: Visual feedback shows sortable columns

### Keyboard Interactions
- **Tab**: Navigate to sortable headers
- **Enter/Space**: Toggle sort for focused column
- **Ctrl/Cmd + Enter**: Add to multi-column sort

### Visual Indicators
- **↑**: Ascending sort
- **↓**: Descending sort  
- **↕**: No sort (hover state)
- **Numbers**: Sort order for multi-column (1, 2, 3...)

## CSS Customization

### Sort Arrow Styling
```css
:root {
  --tablix-sort-active-color: #007acc;
  --tablix-sort-inactive-color: #ccc;
  --tablix-sort-arrow-size: 12px;
  --tablix-header-hover-bg: rgba(0, 0, 0, 0.05);
  --tablix-sorted-header-bg: rgba(0, 122, 204, 0.05);
}
```

### Custom Sort Indicators
```css
.tablix-sort-asc::before {
  content: '▲';
}

.tablix-sort-desc::before {
  content: '▼';
}

.tablix-sort-none {
  opacity: 0.3;
}
```

## Integration with Pagination & Filtering

Sorting automatically integrates with other table features:

```javascript
// Sorting resets pagination to page 1
await table.sort('name', 'asc');
console.log(table.getPaginationInfo().currentPage); // 1

// Sorting works with filtered data
await table.filter({ department: 'Engineering' });
await table.sort('salary', 'desc'); // Sorts only filtered results
```

## Performance Considerations

### Client-side Performance
- Sorting is performed on filtered data, not full dataset
- Large datasets (>10,000 rows) should consider server-side sorting
- Custom sort functions should be optimized for repeated calls

### Server-side Benefits
- Handles unlimited data sizes
- Reduces client memory usage
- Allows database-level optimization
- Supports complex sorting logic

## Browser Support

- Modern browsers with ES6 modules
- Full keyboard navigation support
- Screen reader compatible with ARIA labels
- Touch-friendly on mobile devices

## Migration from Legacy Code

If updating from a basic sorting implementation:

```javascript
// OLD: Basic array-based sorting
await table.sort([{ column: 'name', direction: 'asc' }]);

// NEW: Enhanced single-column sorting
await table.sort('name', 'asc');

// OLD: Manual sort state management
table.sortState = [...];

// NEW: Built-in sort state
const state = table.getSortState();
```

## Troubleshooting

### Common Issues

**Sort not working**: Check if `sortable: false` is set on column
**Custom sort not applied**: Ensure `sortFunction` returns -1, 0, or 1
**Server sort errors**: Verify `serverSortLoader` returns correct format
**Performance issues**: Consider server-side sorting for large datasets

### Debug Helpers
```javascript
// Check if sorting is enabled
console.log(table.sortingManager?.options);

// View current sort state
console.log(table.getSortState());

// Test sort function
const column = table.options.columns.find(c => c.name === 'salary');
console.log(column.sortFunction?.(100, 200)); // Should return -100
```

## Examples

See the included examples for working demonstrations:
- `examples/sorting-test.html` - Basic sorting functionality
- `examples/sorting-demo.html` - Comprehensive feature showcase
- `examples/server-sorting.html` - Server-side sorting example

The sorting feature is now ready for production use and provides a solid foundation for future enhancements like advanced filtering integration and custom sort controls.
