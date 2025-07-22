# TablixJS Sorting Feature

TablixJS provides a simple, intuitive sorting feature that allows users to sort table data by clicking column headers. The sorting feature has been designed for simplicity and ease of use.

## Basic Usage

### Enable Sorting

```javascript
const table = new Table('#table', {
  data: data,
  columns: columns,
  sorting: {
    enabled: true // Enable sorting (default: true)
  }
});
```

### Make Columns Sortable

```javascript
const columns = [
  { name: 'name', title: 'Name', sortable: true },
  { name: 'age', title: 'Age', sortable: true, sortType: 'number' },
  { name: 'date', title: 'Date', sortable: true, sortType: 'date' },
  { name: 'status', title: 'Status', sortable: false } // Not sortable
];
```

## User Interaction

### Header Clicking
- **Click** any sortable column header to sort by that column
- **Click again** to reverse the sort order: ascending → descending → unsorted
- Only one column can be sorted at a time (single-column sorting)

### Keyboard Navigation
- Use **Tab** to navigate to sortable headers
- Press **Enter** or **Space** to toggle sorting

## API Methods

### Programmatic Sorting

```javascript
// Sort by a column
await table.sort('name', 'asc');   // Sort name ascending
await table.sort('age', 'desc');   // Sort age descending
await table.sort('status', null);  // Remove sorting

// Toggle sort for a column (cycles through asc → desc → null)
await table.toggleSort('name');

// Clear all sorting
await table.clearSorting();

// Get current sort state
const sortState = table.getSortState();
console.log(sortState); // { sort: { column: 'name', direction: 'asc' }, mode: 'client' }
```

## Configuration Options

```javascript
const table = new Table('#table', {
  sorting: {
    enabled: true,              // Enable/disable sorting
    mode: 'client',             // 'client' or 'server'
    serverSortLoader: null,     // Function for server-side sorting
    defaultSortType: 'auto',    // Default sort type
    caseSensitive: false,       // Case-sensitive string sorting
    nullsFirst: false          // Whether null values appear first
  }
});
```

## Sort Types

### Built-in Sort Types

- **`auto`** - Auto-detect type (numbers, dates, strings)
- **`string`** - String comparison
- **`number`** - Numeric comparison
- **`date`** - Date comparison
- **`boolean`** - Boolean comparison

### Custom Sort Functions

```javascript
const columns = [
  {
    name: 'priority',
    title: 'Priority',
    sortable: true,
    sortFunction: (a, b) => {
      const order = { 'High': 3, 'Medium': 2, 'Low': 1 };
      return order[b] - order[a]; // Reverse order (High to Low)
    }
  }
];
```

## Server-Side Sorting

```javascript
const table = new Table('#table', {
  sorting: {
    enabled: true,
    mode: 'server',
    serverSortLoader: async ({ sort, page, pageSize, filters }) => {
      const response = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sort, page, pageSize, filters })
      });
      
      return await response.json(); // { data: [...], totalRows: 100 }
    }
  }
});
```

## Events

```javascript
// Listen for sorting events
table.on('beforeSort', (data) => {
  console.log('About to sort:', data);
});

table.on('afterSort', (data) => {
  console.log('Sort completed:', data);
});
```

## Styling

### CSS Classes

The sorting feature uses these CSS classes for styling:

- `.tablix-sortable` - Sortable column headers
- `.tablix-sorted` - Currently sorted column
- `.tablix-sorted-asc` - Ascending sort
- `.tablix-sorted-desc` - Descending sort
- `.tablix-sort-indicator` - Sort indicator container
- `.tablix-sort-arrow` - Sort direction arrow

### Visual Indicators

- **↕** - Column is sortable but not currently sorted
- **↑** - Column is sorted ascending
- **↓** - Column is sorted descending

## Examples

### Basic Client-Side Sorting

```javascript
const data = [
  { id: 1, name: 'Alice', age: 30, department: 'Engineering' },
  { id: 2, name: 'Bob', age: 25, department: 'Marketing' },
  { id: 3, name: 'Charlie', age: 35, department: 'Sales' }
];

const columns = [
  { name: 'name', title: 'Name', sortable: true },
  { name: 'age', title: 'Age', sortable: true, sortType: 'number' },
  { name: 'department', title: 'Department', sortable: true }
];

const table = new Table('#table', {
  data: data,
  columns: columns,
  sorting: { enabled: true }
});
```

### Custom Sort with Renderer

```javascript
const columns = [
  {
    name: 'status',
    title: 'Status',
    sortable: true,
    renderer: (cell) => {
      const colors = { 'Active': 'green', 'Inactive': 'red' };
      return `<span style="color: ${colors[cell]}">${cell}</span>`;
    },
    sortFunction: (a, b) => {
      const order = { 'Active': 2, 'Inactive': 1 };
      return order[b] - order[a];
    }
  }
];
```

## Migration from Multi-Column Sorting

If you were using multi-column sorting in previous versions, the API has been simplified:

### Before (Multi-Column)
```javascript
// Old multi-column API
await table.sort('name', 'asc', false);  // Replace existing sorts
await table.sort('age', 'desc', true);   // Add to existing sorts
const sorts = table.getSortState().sorts; // Array of sorts
```

### Now (Single-Column)
```javascript
// New simplified API
await table.sort('name', 'asc');  // Sort by name (replaces any existing sort)
await table.sort('age', 'desc');  // Sort by age (replaces name sort)
const sort = table.getSortState().sort; // Single sort object or null
```

This simplification makes the sorting feature more intuitive and easier to use while maintaining all the core functionality.
