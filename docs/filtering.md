# TablixJS Advanced Filtering

TablixJS provides powerful column filtering capabilities with support for multiple filter types, custom operators, and both client-side and server-side filtering.

## Features

- **Multi-column filtering** with independent filter states
- **Two filter types**: Value-based (checkbox selection) and Condition-based (operators)
- **Multiple conditions** per column with AND logic
- **Built-in operators**: equals, contains, begins with, ends with, empty checks, etc.
- **Custom operators** for extensibility
- **Client-side and server-side** filtering modes
- **Visual indicators** with optional badges and tooltips
- **Event hooks** for `beforeFilter` and `afterFilter`
- **Integration** with sorting and pagination

## Basic Setup

```javascript
const table = new Table('#myTable', {
  data: myData,
  columns: myColumns,
  filtering: {
    enabled: true,
    mode: 'client', // 'client' or 'server'
    showBadges: true,
    showTooltips: true,
    debounceDelay: 300
  }
});
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | `true` | Enable/disable filtering |
| `mode` | string | `'client'` | Filtering mode: 'client' or 'server' |
| `serverFilterLoader` | function | `null` | Function for server-side filtering |
| `debounceDelay` | number | `300` | Debounce delay for input filters (ms) |
| `showBadges` | boolean | `true` | Show filter count badges |
| `showTooltips` | boolean | `true` | Show filter summary tooltips |

## User Interface

### Filter Icons
Filter icons (🞃) appear in column headers next to sort indicators. Clicking opens a dropdown with filtering options.

### Filter Dropdown
The dropdown provides two tabs:
- **Filter by Value**: Checkbox list of unique column values
- **Filter by Condition**: Condition builder with operators and values

### Visual Indicators
- **Active filters**: Filter icon changes color and shows badge
- **Filter badges**: Show count of selected values or active conditions
- **Column highlighting**: Filtered columns are visually distinguished

## API Reference

### Table Methods

#### `applyFilter(columnName, filterConfig)`
Apply a filter to a specific column.

```javascript
// Value filter
await table.applyFilter('status', {
  type: 'value',
  values: ['Active', 'Pending']
});

// Condition filter
await table.applyFilter('name', {
  type: 'condition',
  conditions: [
    { operator: 'beginsWith', value: 'A' },
    { operator: 'contains', value: 'son' }
  ]
});
```

#### `clearFilter(columnName)`
Clear filter for a specific column.

```javascript
await table.clearFilter('status');
```

#### `clearAllFilters()`
Clear all active filters.

```javascript
await table.clearAllFilters();
```

#### `getActiveFilters()`
Get all active filters.

```javascript
const filters = table.getActiveFilters();
// Returns: { columnName: filterConfig, ... }
```

#### `getColumnFilter(columnName)`
Get filter state for a specific column.

```javascript
const filter = table.getColumnFilter('status');
// Returns: { type, config, isActive } or null
```

## Filter Types

### Value Filter
Allows users to select/deselect specific values from the column.

```javascript
{
  type: 'value',
  values: ['Active', 'Pending', 'Inactive']
}
```

### Condition Filter
Allows users to create conditions using operators.

```javascript
{
  type: 'condition',
  conditions: [
    { operator: 'beginsWith', value: 'A' },
    { operator: 'contains', value: 'manager' }
  ]
}
```

## Built-in Operators

| Operator | Label | Description | Requires Value |
|----------|-------|-------------|----------------|
| `none` | None | No filtering | No |
| `isEmpty` | Is empty | Field is empty/null | No |
| `isNotEmpty` | Is not empty | Field has value | No |
| `equals` | Is equal to | Exact match | Yes |
| `notEquals` | Is not equal to | Does not match | Yes |
| `beginsWith` | Begins with | Starts with value | Yes |
| `endsWith` | Ends with | Ends with value | Yes |
| `contains` | Contains | Contains value | Yes |
| `notContains` | Does not contain | Does not contain value | Yes |

## Custom Operators

Register custom operators for specialized filtering:

```javascript
table.filterManager.registerOperator('isEven', {
  label: 'Is even number',
  apply: (value) => {
    const num = parseInt(value);
    return !isNaN(num) && num % 2 === 0;
  }
});

// Use custom operator
await table.applyFilter('id', {
  type: 'condition',
  conditions: [{ operator: 'isEven' }]
});
```

### Custom Operator Structure
```javascript
{
  label: 'Display label',
  apply: (cellValue, filterValue) => boolean
}
```

## Server-Side Filtering

For large datasets, implement server-side filtering:

```javascript
const table = new Table('#myTable', {
  filtering: {
    enabled: true,
    mode: 'server',
    serverFilterLoader: async (params) => {
      // params: { filters, sort, page, pageSize }
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

### Server Parameters
The `serverFilterLoader` receives:
```javascript
{
  filters: {
    columnName: { type: 'value'|'condition', ... }
  },
  sort: { column: 'name', direction: 'asc' },
  page: 1,
  pageSize: 10
}
```

## Event Handling

Listen for filter events to respond to user actions:

```javascript
table.eventManager.on('beforeFilter', (data) => {
  console.log('About to filter:', data);
  // data: { columnName, filterConfig, currentFilters }
});

table.eventManager.on('afterFilter', (data) => {
  console.log('Filter applied:', data);
  // data: { columnName, filterConfig, filteredData, activeFilters }
});
```

## Integration with Other Features

### Sorting
Filters work seamlessly with sorting:
```javascript
await table.applyFilter('department', {
  type: 'value',
  values: ['Engineering']
});
await table.sort('name', 'asc'); // Sort filtered results
```

### Pagination
Pagination automatically resets to first page when filters change:
```javascript
await table.applyFilter('status', {
  type: 'value',
  values: ['Active']
});
// Pagination automatically goes to page 1
```

## Styling and Theming

Filtering uses CSS custom properties for theming:

```css
:root {
  --tablix-btn-active-color: #007bff;
  --tablix-dropdown-bg: white;
  --tablix-border-color: #dee2e6;
  /* ... more variables */
}

/* Dark theme support */
[data-theme="dark"] {
  --tablix-dropdown-bg: #343a40;
  --tablix-border-color: #495057;
  /* ... dark theme overrides */
}
```

## Performance Considerations

### Client-Side Filtering
- Efficient for datasets up to ~10,000 rows
- All filtering happens in memory
- Instant results with no network requests

### Server-Side Filtering
- Required for large datasets (10,000+ rows)
- Reduces memory usage
- Requires backend implementation

### Optimization Tips
1. Use server-side filtering for large datasets
2. Implement debouncing for condition filters
3. Consider limiting unique values in value filters
4. Use pagination to limit rendered rows

## Advanced Examples

### Batch Filter Application
```javascript
const batchApplyFilters = async (filterConfigs) => {
  for (const [columnName, config] of Object.entries(filterConfigs)) {
    await table.applyFilter(columnName, config);
  }
};

await batchApplyFilters({
  status: { type: 'value', values: ['Active'] },
  department: { type: 'value', values: ['Engineering'] },
  salary: { type: 'condition', conditions: [{ operator: 'contains', value: '7' }] }
});
```

### Dynamic Filter Management
```javascript
// Save current filter state
const currentFilters = table.getActiveFilters();
localStorage.setItem('tableFilters', JSON.stringify(currentFilters));

// Restore filter state
const savedFilters = JSON.parse(localStorage.getItem('tableFilters') || '{}');
for (const [columnName, config] of Object.entries(savedFilters)) {
  await table.applyFilter(columnName, config);
}
```

### Custom Filter UI
```javascript
// Access FilterUI for customization
const filterUI = table.filterUI;

// Extend with custom behaviors
filterUI.customMethod = function() {
  // Custom logic
};
```

## Browser Support

- Modern browsers with ES6+ support
- CSS custom properties support
- No external dependencies

## Migration from Legacy Filtering

If upgrading from the basic filtering in DataManager:

```javascript
// Old way (still supported)
await table.filter({ name: 'John' });

// New way (recommended)
await table.applyFilter('name', {
  type: 'condition',
  conditions: [{ operator: 'contains', value: 'John' }]
});
```

The legacy `filter()` method continues to work for backward compatibility.
