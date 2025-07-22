// TablixJS Sorting Feature - Usage Examples

import Table from './src/core/Table.js';

// Sample data for demonstrations
const employees = [
  { id: 1, name: 'Alice Johnson', department: 'Engineering', salary: 95000, joinDate: '2022-03-15', active: true },
  { id: 2, name: 'Bob Smith', department: 'Marketing', salary: 72000, joinDate: '2021-08-22', active: true },
  { id: 3, name: 'Charlie Brown', department: 'Engineering', salary: 88000, joinDate: '2023-01-10', active: false },
  { id: 4, name: 'Diana Prince', department: 'Sales', salary: 79000, joinDate: '2020-11-05', active: true },
  { id: 5, name: 'Eve Davis', department: 'HR', salary: 65000, joinDate: '2022-07-18', active: true }
];

// =============================================================================
// 1. BASIC SORTING SETUP
// =============================================================================

const basicTable = new Table('#basicTable', {
  data: employees,
  columns: [
    { name: 'name', title: 'Employee Name' },
    { name: 'department', title: 'Department' },
    { name: 'salary', title: 'Salary', sortType: 'number', renderer: (cell) => `$${cell.toLocaleString()}` }
  ],
  sorting: {
    enabled: true,
    defaultSortType: 'auto'
  }
});

// Default sort - Click headers or use API
await basicTable.sort('name', 'asc');
console.log('✅ Default sort by name applied');

// =============================================================================
// 2. CUSTOM SORT CALLBACKS
// =============================================================================

const customTable = new Table('#customTable', {
  data: employees,
  columns: [
    { name: 'name', title: 'Name' },
    {
      name: 'joinDate',
      title: 'Join Date',
      renderer: (cell) => new Date(cell).toLocaleDateString(),
      sortFunction: (a, b) => {
        // Custom date sorting
        return new Date(a) - new Date(b);
      }
    },
    {
      name: 'department',
      title: 'Department',
      sortFunction: (a, b) => {
        // Custom priority order: Engineering > Sales > Marketing > HR
        const priority = { 'Engineering': 4, 'Sales': 3, 'Marketing': 2, 'HR': 1 };
        return (priority[b] || 0) - (priority[a] || 0);
      }
    },
    {
      name: 'active',
      title: 'Status',
      renderer: (cell) => cell ? '✅ Active' : '❌ Inactive',
      sortFunction: (a, b) => {
        // Active employees first
        return b - a; // true (1) comes before false (0)
      }
    }
  ],
  sorting: {
    enabled: true
  }
});

console.log('✅ Custom sort functions configured');

// =============================================================================
// 3. PROGRAMMATIC SORTING
// =============================================================================

async function demonstrateProgrammaticSorting() {
  console.log('🔄 Demonstrating programmatic sorting...');
  
  // Single column sort
  await customTable.sort('salary', 'desc');
  console.log('💰 Sorted by salary (highest first)');
  
  // Sort by department
  await customTable.sort('department', 'asc');
  console.log('📊 Sorted by department (Engineering first)');
  
  // Toggle sort (cycles through asc → desc → null)
  await customTable.toggleSort('joinDate');
  console.log('📅 Toggled join date sort');
  
  // Get current sort state
  const sortState = customTable.getSortState();
  console.log('📈 Current sort state:', sortState);
  
  // Clear all sorting
  await customTable.clearSorting();
  console.log('🧹 All sorting cleared');
}

// =============================================================================
// 4. EVENT HANDLING
// =============================================================================

// Listen for sort events
customTable.on('beforeSort', (data) => {
  console.log('⏳ About to sort:', {
    column: data.columnName,
    direction: data.direction
  });
  
  // Example: Show loading indicator
  // showLoadingIndicator();
});

customTable.on('afterSort', (data) => {
  console.log('✅ Sort completed:', {
    column: data.columnName,
    direction: data.direction,
    currentSort: data.currentSort
  });
  
  // Example: Update URL or save state
  const sortParam = data.currentSort ? `${data.currentSort.column}:${data.currentSort.direction}` : '';
  // updateURL({ sort: sortParam });
  
  // Example: Analytics tracking
  // analytics.track('table_sorted', { column: data.columnName, direction: data.direction });
});

// =============================================================================
// 5. SERVER-SIDE SORTING EXAMPLE
// =============================================================================

const serverTable = new Table('#serverTable', {
  columns: [
    { name: 'name', title: 'Employee Name' },
    { name: 'department', title: 'Department' },
    { name: 'salary', title: 'Salary', sortType: 'number' },
    { name: 'joinDate', title: 'Join Date', sortType: 'date' }
  ],
  sorting: {
    enabled: true,
    mode: 'server',
    serverSortLoader: async (params) => {
      console.log('📡 Server sort request:', params);
      
      try {
        // Example server request
        const response = await fetch('/api/employees', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sort: params.sort,
            filters: params.filters,
            page: params.page,
            pageSize: params.pageSize
          })
        });
        
        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }
        
        const result = await response.json();
        
        return {
          data: result.employees,
          totalRows: result.totalCount
        };
      } catch (error) {
        console.error('❌ Server sort failed:', error);
        throw error;
      }
    }
  },
  pagination: {
    enabled: true,
    mode: 'server',
    pageSize: 10
  }
});

// =============================================================================
// 6. ADVANCED FEATURES DEMO
// =============================================================================

async function demonstrateAdvancedFeatures() {
  console.log('🎛️ Demonstrating advanced features...');
  
  // Single-column sorting with visual feedback
  await customTable.sort('department', 'asc');
  console.log('🎯 Sort by department (Engineering first)');
  
  await customTable.sort('salary', 'desc');
  console.log('💰 Sort by salary (highest first)');
  
  // Sorting with custom data types
  const complexData = [
    { version: '1.2.3', priority: 'High', tags: ['urgent', 'bug'] },
    { version: '2.0.1', priority: 'Low', tags: ['feature'] },
    { version: '1.10.0', priority: 'Medium', tags: ['enhancement', 'ui'] }
  ];
  
  const complexTable = new Table('#complexTable', {
    data: complexData,
    columns: [
      {
        name: 'version',
        title: 'Version',
        sortFunction: (a, b) => {
          // Semantic version sorting
          const parseVersion = v => v.split('.').map(Number);
          const [aMajor, aMinor, aPatch] = parseVersion(a);
          const [bMajor, bMinor, bPatch] = parseVersion(b);
          
          if (aMajor !== bMajor) return aMajor - bMajor;
          if (aMinor !== bMinor) return aMinor - bMinor;
          return aPatch - bPatch;
        }
      },
      {
        name: 'priority', 
        title: 'Priority',
        sortFunction: (a, b) => {
          const levels = { 'High': 3, 'Medium': 2, 'Low': 1 };
          return (levels[b] || 0) - (levels[a] || 0);
        }
      },
      {
        name: 'tags',
        title: 'Tags',
        renderer: (cell) => cell.join(', '),
        sortFunction: (a, b) => {
          // Sort by number of tags, then alphabetically
          if (a.length !== b.length) return b.length - a.length;
          return a.join('').localeCompare(b.join(''));
        }
      }
    ],
    sorting: { enabled: true }
  });
  
  await complexTable.sort('version', 'desc');
  console.log('📦 Semantic version sorting applied');
}

// =============================================================================
// 7. INTEGRATION WITH FILTERING & PAGINATION
// =============================================================================

async function demonstrateIntegration() {
  console.log('🔗 Demonstrating integration with other features...');
  
  // Filter then sort
  await customTable.filter({ department: 'Engineering' });
  await customTable.sort('salary', 'desc');
  console.log('🎯 Filtered to Engineering, then sorted by salary');
  
  // Sort state persists through pagination
  const paginatedTable = new Table('#paginatedTable', {
    data: Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      name: `Employee ${i + 1}`,
      salary: Math.floor(Math.random() * 100000) + 40000
    })),
    columns: [
      { name: 'id', title: 'ID' },
      { name: 'name', title: 'Name' },
      { name: 'salary', title: 'Salary', sortType: 'number' }
    ],
    sorting: { enabled: true },
    pagination: { 
      enabled: true,
      pageSize: 10,
      showPageNumbers: true 
    }
  });
  
  await paginatedTable.sort('salary', 'desc');
  console.log('📄 Sorted data paginated correctly');
}

// =============================================================================
// 8. ACCESSIBILITY & KEYBOARD NAVIGATION
// =============================================================================

function demonstrateAccessibility() {
  console.log('♿ Accessibility features enabled:');
  console.log('  - Tab navigation to sortable headers');
  console.log('  - Enter/Space keys to sort');  
  console.log('  - ARIA labels for screen readers');
  console.log('  - Visual focus indicators');
  console.log('  - High contrast mode support');
}

// =============================================================================
// 9. UTILITY FUNCTIONS FOR TESTING
// =============================================================================

window.sortingExamples = {
  basicTable,
  customTable,
  serverTable,
  
  // Quick test functions
  testBasicSort: () => basicTable.sort('name', 'asc'),
  testCustomSort: () => customTable.sort('joinDate', 'desc'),
  testMultiSort: async () => {
    await customTable.sort('department', 'asc', false);
    await customTable.sort('salary', 'desc', true);
  },
  testToggle: () => customTable.toggleSort('name'),
  testClear: () => customTable.clearSorting(),
  
  // State inspection
  getBasicState: () => basicTable.getSortState(),
  getCustomState: () => customTable.getSortState(),
  
  // Demo functions
  runAdvancedDemo: demonstrateAdvancedFeatures,
  runIntegrationDemo: demonstrateIntegration,
  runProgrammaticDemo: demonstrateProgrammaticSorting
};

// Run demonstrations
console.log('🚀 TablixJS Sorting Examples Loaded!');
console.log('Available in window.sortingExamples object');
console.log('Try: sortingExamples.testMultiSort()');

// Auto-run basic demonstration
setTimeout(() => {
  demonstrateProgrammaticSorting();
  demonstrateAccessibility();
}, 1000);
