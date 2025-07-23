// TablixJS Advanced Filtering - Usage Examples

// Basic table initialization with filtering enabled
const table = new Table('#myTable', {
  data: myData,
  columns: myColumns,
  filtering: {
    enabled: true,
    mode: 'client', // or 'server'
    showBadges: true,
    showTooltips: true,
    debounceDelay: 300
  }
});

// ===========================================
// PROGRAMMATIC FILTERING EXAMPLES
// ===========================================

// 1. Value-based filtering (checkbox selection)
await table.applyFilter('status', {
  type: 'value',
  values: ['Active', 'Pending']
});

// 2. Condition-based filtering
await table.applyFilter('name', {
  type: 'condition',
  conditions: [
    { operator: 'beginsWith', value: 'A' },
    { operator: 'contains', value: 'son' }
  ]
});

// 3. Complex condition examples
await table.applyFilter('salary', {
  type: 'condition',
  conditions: [
    { operator: 'equals', value: '75000' }
  ]
});

await table.applyFilter('email', {
  type: 'condition',
  conditions: [
    { operator: 'endsWith', value: '@company.com' },
    { operator: 'notContains', value: 'temp' }
  ]
});

// 4. Empty/Not empty filters
await table.applyFilter('description', {
  type: 'condition',
  conditions: [
    { operator: 'isNotEmpty' }
  ]
});

// 5. Clear specific column filter
await table.clearFilter('status');

// 6. Clear all filters
await table.clearAllFilters();

// 7. Get current filter state
const activeFilters = table.getActiveFilters();
console.log('Current filters:', activeFilters);

// 8. Get filter for specific column
const statusFilter = table.getColumnFilter('status');
console.log('Status filter:', statusFilter);

// ===========================================
// EVENT HANDLING
// ===========================================

// Listen for filter events
table.eventManager.on('beforeFilter', (data) => {
  console.log('About to apply filter:', data);
  // data.columnName, data.filterConfig, data.currentFilters
});

table.eventManager.on('afterFilter', (data) => {
  console.log('Filter applied:', data);
  // data.columnName, data.filterConfig, data.filteredData, data.activeFilters
  
  // Update UI based on filtered results
  updateStatusBar(data.filteredData.length);
});

// ===========================================
// SERVER-SIDE FILTERING
// ===========================================

const serverTable = new Table('#serverTable', {
  filtering: {
    enabled: true,
    mode: 'server',
    serverFilterLoader: async (params) => {
      // params contains: filters, sort, page, pageSize
      const response = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      
      const result = await response.json();
      
      // Must return { data: [...], totalRows: number }
      return {
        data: result.items,
        totalRows: result.totalCount
      };
    }
  }
});

// ===========================================
// CUSTOM OPERATORS
// ===========================================

// Register custom filter operator
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
  conditions: [
    { operator: 'isEven' }
  ]
});

// ===========================================
// FILTER COMBINATIONS
// ===========================================

// Apply multiple filters across columns
await table.applyFilter('department', {
  type: 'value',
  values: ['Engineering', 'Marketing']
});

await table.applyFilter('status', {
  type: 'value',
  values: ['Active']
});

await table.applyFilter('salary', {
  type: 'condition',
  conditions: [
    { operator: 'contains', value: '7' } // Salary contains '7'
  ]
});

// ===========================================
// INTEGRATION WITH OTHER FEATURES
// ===========================================

// Filtering works seamlessly with sorting and pagination
await table.sort('name', 'asc');  // Sort after filtering
await table.goToPage(2);          // Navigate through filtered results

// ===========================================
// UI CUSTOMIZATION
// ===========================================

// Access FilterUI for advanced customization
const filterUI = table.filterUI;

// Close all dropdowns programmatically
filterUI.closeAllDropdowns();

// Get available operators
const operators = table.filterManager.getOperators();
console.log('Available operators:', Object.keys(operators));

// ===========================================
// ADVANCED SCENARIOS
// ===========================================

// 1. Filter with dynamic data
table.eventManager.on('afterLoad', async () => {
  // Reapply filters after new data is loaded
  const currentFilters = table.getActiveFilters();
  if (Object.keys(currentFilters).length > 0) {
    // Filters are automatically preserved and reapplied
    console.log('Filters maintained after data reload');
  }
});

// 2. Conditional filter UI
const shouldShowFilters = (columnName) => {
  return ['status', 'department', 'name'].includes(columnName);
};

// Custom column configuration
const advancedColumns = [
  { 
    name: 'id', 
    title: 'ID',
    filterable: false  // Could be used for custom logic
  },
  { 
    name: 'name', 
    title: 'Full Name',
    filterable: true
  }
  // ... more columns
];

// 3. Batch filter operations
const batchApplyFilters = async (filterConfigs) => {
  for (const [columnName, config] of Object.entries(filterConfigs)) {
    await table.applyFilter(columnName, config);
  }
};

await batchApplyFilters({
  status: { type: 'value', values: ['Active'] },
  department: { type: 'value', values: ['Engineering'] }
});

// ===========================================
// ERROR HANDLING
// ===========================================

try {
  await table.applyFilter('invalidColumn', {
    type: 'condition',
    conditions: [{ operator: 'unknownOp', value: 'test' }]
  });
} catch (error) {
  console.error('Filter error:', error);
}

// ===========================================
// PERFORMANCE CONSIDERATIONS
// ===========================================

// For large datasets, consider:
// 1. Server-side filtering for 10,000+ rows
// 2. Debounce user input in condition filters
// 3. Limit the number of unique values in value filters

// Debounced filter application example
let filterTimeout;
const debouncedFilter = (columnName, filterConfig) => {
  clearTimeout(filterTimeout);
  filterTimeout = setTimeout(async () => {
    await table.applyFilter(columnName, filterConfig);
  }, 300);
};

export {
  // Export examples for documentation
  table,
  serverTable,
  batchApplyFilters,
  debouncedFilter
};
