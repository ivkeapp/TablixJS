// TablixJS Column Formatting System - Usage Examples

import Table from '../src/core/Table.js';

// =============================================================================
// SAMPLE DATA FOR EXAMPLES
// =============================================================================

const employees = [
  { 
    id: 1, 
    name: 'Alice Johnson', 
    department: 'Engineering', 
    salary: 95000, 
    joinDate: '2022-03-15T10:30:00Z', 
    active: true,
    bonus: 0.15,
    rating: 4.8,
    projects: 12
  },
  { 
    id: 2, 
    name: 'Bob Smith', 
    department: 'Marketing', 
    salary: 72000, 
    joinDate: '2021-08-22T09:15:00Z', 
    active: true,
    bonus: 0.12,
    rating: 4.2,
    projects: 8
  },
  { 
    id: 3, 
    name: 'Charlie Brown', 
    department: 'Engineering', 
    salary: 88000, 
    joinDate: '2023-01-10T11:45:00Z', 
    active: false,
    bonus: 0.18,
    rating: 4.6,
    projects: 15
  },
  { 
    id: 4, 
    name: 'Diana Prince', 
    department: 'Sales', 
    salary: 79000, 
    joinDate: '2020-11-05T14:20:00Z', 
    active: true,
    bonus: 0.22,
    rating: 4.9,
    projects: 20
  },
  { 
    id: 5, 
    name: 'Eve Davis', 
    department: 'HR', 
    salary: 65000, 
    joinDate: '2022-07-18T08:00:00Z', 
    active: true,
    bonus: 0.08,
    rating: 4.1,
    projects: 5
  }
];

// =============================================================================
// 1. BASIC FORMATTING EXAMPLES
// =============================================================================

console.log('📊 TablixJS Column Formatting Examples');

// Basic text formatting (explicit)
const basicTextTable = new Table('#basicText', {
  data: employees,
  columns: [
    { name: 'id', title: 'ID' }, // No format = raw value
    { name: 'name', title: 'Employee Name', format: 'text' }, // Explicit text format
    { name: 'department', title: 'Department' } // No format = raw value
  ],
  pagination: { enabled: false }
});

console.log('✅ Basic text formatting table created');

// =============================================================================
// 2. NUMBER FORMATTING WITH OPTIONS
// =============================================================================

const numberFormattingTable = new Table('#numberFormatting', {
  data: employees,
  columns: [
    { name: 'name', title: 'Employee' },
    { 
      name: 'salary', 
      title: 'Salary (Basic)', 
      format: 'number' 
    },
    { 
      name: 'salary', 
      title: 'Salary (2 Decimals)', 
      format: 'number',
      formatOptions: { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      }
    },
    { 
      name: 'rating', 
      title: 'Rating', 
      format: 'number',
      formatOptions: { 
        minimumFractionDigits: 1, 
        maximumFractionDigits: 1 
      }
    }
  ],
  pagination: { enabled: false }
});

console.log('✅ Number formatting table created');

// =============================================================================
// 3. CURRENCY FORMATTING EXAMPLES
// =============================================================================

const currencyTable = new Table('#currencyFormatting', {
  data: employees,
  columns: [
    { name: 'name', title: 'Employee' },
    { 
      name: 'salary', 
      title: 'USD (Default)', 
      format: 'currency',
      currency: 'USD'
    },
    { 
      name: 'salary', 
      title: 'EUR (German)', 
      format: 'currency',
      currency: 'EUR',
      locale: 'de-DE'
    },
    { 
      name: 'salary', 
      title: 'GBP (No Decimals)', 
      format: 'currency',
      currency: 'GBP',
      locale: 'en-GB',
      formatOptions: { minimumFractionDigits: 0, maximumFractionDigits: 0 }
    }
  ],
  pagination: { enabled: false }
});

console.log('✅ Currency formatting table created');

// =============================================================================
// 4. DATE FORMATTING EXAMPLES
// =============================================================================

const dateTable = new Table('#dateFormatting', {
  data: employees,
  columns: [
    { name: 'name', title: 'Employee' },
    { 
      name: 'joinDate', 
      title: 'Default Date', 
      format: 'date'
    },
    { 
      name: 'joinDate', 
      title: 'Short Date (US)', 
      format: 'date',
      locale: 'en-US',
      formatOptions: { dateStyle: 'short' }
    },
    { 
      name: 'joinDate', 
      title: 'Long Date (French)', 
      format: 'date',
      locale: 'fr-FR',
      formatOptions: { dateStyle: 'long' }
    },
    { 
      name: 'joinDate', 
      title: 'Custom Format', 
      format: 'date',
      formatOptions: { 
        year: 'numeric', 
        month: 'short', 
        day: '2-digit',
        weekday: 'short'
      }
    }
  ],
  pagination: { enabled: false }
});

console.log('✅ Date formatting table created');

// =============================================================================
// 5. PERCENTAGE FORMATTING
// =============================================================================

const percentTable = new Table('#percentFormatting', {
  data: employees,
  columns: [
    { name: 'name', title: 'Employee' },
    { 
      name: 'bonus', 
      title: 'Bonus (Default)', 
      format: 'percent'
    },
    { 
      name: 'bonus', 
      title: 'Bonus (2 Decimals)', 
      format: 'percent',
      formatOptions: { minimumFractionDigits: 2 }
    },
    { 
      name: 'bonus', 
      title: 'Bonus (German)', 
      format: 'percent',
      locale: 'de-DE',
      formatOptions: { minimumFractionDigits: 1 }
    }
  ],
  pagination: { enabled: false }
});

console.log('✅ Percentage formatting table created');

// =============================================================================
// 6. CUSTOM RENDERERS WITH FORMATTING
// =============================================================================

const customRendererTable = new Table('#customRenderer', {
  data: employees,
  columns: [
    { name: 'name', title: 'Employee' },
    { 
      name: 'salary', 
      title: 'Salary Badge', 
      format: 'currency',
      currency: 'USD',
      renderer: (value, row, formattedValue) => {
        // Custom renderer receives: raw value, full row, and formatted value
        const color = value >= 85000 ? '#28a745' : value >= 75000 ? '#ffc107' : '#dc3545';
        return `<span style="background: ${color}; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">${formattedValue}</span>`;
      }
    },
    { 
      name: 'rating', 
      title: 'Star Rating',
      format: 'number',
      formatOptions: { minimumFractionDigits: 1, maximumFractionDigits: 1 },
      renderer: (value, row, formattedValue) => {
        const stars = '⭐'.repeat(Math.floor(value));
        return `${stars} ${formattedValue}`;
      }
    },
    { 
      name: 'active', 
      title: 'Status',
      // No format, just custom renderer
      renderer: (value) => {
        return value ? 
          '<span style="color: green;">✅ Active</span>' : 
          '<span style="color: red;">❌ Inactive</span>';
      }
    }
  ],
  pagination: { enabled: false }
});

console.log('✅ Custom renderer table created');

// =============================================================================
// 7. MIXED FORMATTING (REAL-WORLD EXAMPLE)
// =============================================================================

const realWorldTable = new Table('#realWorld', {
  data: employees,
  columns: [
    { name: 'id', title: 'ID' }, // Raw number
    { name: 'name', title: 'Name' }, // Raw text
    { name: 'department', title: 'Dept' }, // Raw text
    { 
      name: 'salary', 
      title: 'Annual Salary', 
      format: 'currency',
      currency: 'USD',
      formatOptions: { minimumFractionDigits: 0 }
    },
    { 
      name: 'bonus', 
      title: 'Bonus %', 
      format: 'percent',
      formatOptions: { minimumFractionDigits: 1 }
    },
    { 
      name: 'joinDate', 
      title: 'Hire Date', 
      format: 'date',
      formatOptions: { 
        year: 'numeric', 
        month: 'short', 
        day: '2-digit' 
      }
    },
    { 
      name: 'projects', 
      title: 'Projects',
      format: 'number'
    }
  ],
  pagination: { enabled: true, pageSize: 3 },
  sorting: { enabled: true }
});

console.log('✅ Real-world example table created');

// =============================================================================
// 8. ERROR HANDLING DEMONSTRATIONS
// =============================================================================

console.log('🔍 Testing error handling...');

// Invalid date handling
const errorData = [
  { name: 'Test User 1', badDate: 'invalid-date', salary: 'not-a-number', bonus: null },
  { name: 'Test User 2', badDate: null, salary: 50000, bonus: 0.1 },
  { name: 'Test User 3', badDate: '2023-12-25', salary: undefined, bonus: 'invalid' }
];

const errorHandlingTable = new Table('#errorHandling', {
  data: errorData,
  columns: [
    { name: 'name', title: 'Name' },
    { 
      name: 'badDate', 
      title: 'Bad Date', 
      format: 'date' // Will gracefully handle invalid dates
    },
    { 
      name: 'salary', 
      title: 'Salary', 
      format: 'currency',
      currency: 'USD' // Will handle non-numeric values
    },
    { 
      name: 'bonus', 
      title: 'Bonus', 
      format: 'percent' // Will handle null/undefined/invalid values
    }
  ],
  pagination: { enabled: false }
});

console.log('✅ Error handling table created');

// =============================================================================
// 9. EXTENSIBILITY EXAMPLE (FUTURE)
// =============================================================================

// This shows how the system could be extended in the future
console.log('🔮 Future extensibility preview...');

/*
// Example of future custom format registration:
const table = new Table('#container', { ... });

table.columnManager.registerFormat('filesize', (column) => {
  return (value) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (value === 0) return '0 B';
    const i = Math.floor(Math.log(value) / Math.log(1024));
    return Math.round(value / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };
});

// Then use: { name: 'fileSize', format: 'filesize' }
*/

// =============================================================================
// 10. PERFORMANCE TEST
// =============================================================================

console.log('⚡ Performance test with large dataset...');

// Generate large dataset for performance testing
const largeData = Array.from({ length: 1000 }, (_, i) => ({
  id: i + 1,
  name: `Employee ${i + 1}`,
  salary: Math.floor(Math.random() * 100000) + 30000,
  joinDate: new Date(2020 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
  bonus: Math.random() * 0.3,
  active: Math.random() > 0.1
}));

const performanceStart = performance.now();

const largeTable = new Table('#performance', {
  data: largeData,
  columns: [
    { name: 'id', title: 'ID' },
    { name: 'name', title: 'Name' },
    { 
      name: 'salary', 
      title: 'Salary', 
      format: 'currency',
      currency: 'USD'
    },
    { 
      name: 'joinDate', 
      title: 'Join Date', 
      format: 'date',
      formatOptions: { dateStyle: 'short' }
    },
    { 
      name: 'bonus', 
      title: 'Bonus', 
      format: 'percent'
    }
  ],
  pagination: { enabled: true, pageSize: 20 }
});

const performanceEnd = performance.now();
console.log(`✅ Large table (1000 rows) with formatting created in ${(performanceEnd - performanceStart).toFixed(2)}ms`);

// =============================================================================
// SUMMARY
// =============================================================================

console.log(`
🎯 TablixJS Column Formatting System - Usage Summary:

📋 Supported Formats:
   • text - Basic string conversion
   • number - Numeric formatting with Intl.NumberFormat
   • currency - Currency formatting (requires currency property)
   • date - Date formatting with Intl.DateTimeFormat  
   • percent - Percentage formatting

🌍 Internationalization:
   • Optional locale parameter (defaults to browser locale)
   • Optional formatOptions object passed to Intl APIs
   • Examples: 'en-US', 'de-DE', 'fr-FR', 'ja-JP'

⚙️ Key Features:
   • No default values - only formats when explicitly specified
   • Custom renderers have priority over formatting
   • Formatters are cached for performance
   • Graceful error handling for invalid data
   • Extensible design for future custom formats

💡 Usage Patterns:
   • Basic: { name: 'field', format: 'currency', currency: 'USD' }
   • With locale: { name: 'field', format: 'date', locale: 'fr-FR' }
   • With options: { name: 'field', format: 'number', formatOptions: { minimumFractionDigits: 2 } }
   • Mixed: Some columns formatted, others raw values
   • Custom renderer: Receives (value, row, formattedValue) parameters
`);

export {
  employees,
  basicTextTable,
  numberFormattingTable,
  currencyTable,
  dateTable,
  percentTable,
  customRendererTable,
  realWorldTable,
  errorHandlingTable,
  largeTable
};
