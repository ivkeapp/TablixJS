# TablixJS Column Formatting System

The TablixJS Column Formatting System provides a flexible, lightweight, and fully optional way to format cell values using the modern Intl APIs. This system is inspired by Handsontable cell formats but designed to be more flexible and lightweight.

## Overview

### Key Features
- **Flexible formatting**: Text, date, currency, number, and percentage formats
- **Optional locale support**: Uses browser default or specify custom locale
- **Intl API integration**: Leverages native browser formatting capabilities
- **Custom renderer priority**: User renderers can override or use formatted values
- **Performance optimized**: Formatters are compiled and cached once per column
- **Graceful error handling**: Invalid data doesn't break the table
- **No defaults**: Pure behavior - values unchanged unless explicitly formatted
- **Extensible design**: Ready for future custom format types

## Quick Start

```javascript
import Table from './src/core/Table.js';

const table = new Table('#container', {
  data: [
    { name: 'Alice', salary: 95000, joinDate: '2022-03-15', bonus: 0.15 }
  ],
  columns: [
    { name: 'name', title: 'Employee' }, // Raw value
    { name: 'salary', title: 'Salary', format: 'currency', currency: 'USD' },
    { name: 'joinDate', title: 'Join Date', format: 'date' },
    { name: 'bonus', title: 'Bonus', format: 'percent' }
  ]
});
```

## Column Configuration

### Basic Structure
```javascript
{
  name: 'columnName',        // Required: data property name
  title: 'Display Name',     // Optional: header display text
  format: 'formatType',      // Optional: format type
  locale: 'en-US',           // Optional: locale for formatting
  formatOptions: { ... },    // Optional: Intl API options
  currency: 'USD',           // Required for currency format
  renderer: (value, row, formattedValue) => { ... } // Optional: custom renderer
}
```

### Format Types

#### 1. Text Format
Basic string conversion with null/undefined handling.

```javascript
{ name: 'description', title: 'Description', format: 'text' }
```

#### 2. Number Format
Uses `Intl.NumberFormat` for numeric values.

```javascript
// Basic number
{ name: 'rating', format: 'number' }

// With decimal places
{ 
  name: 'score', 
  format: 'number',
  formatOptions: { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  }
}

// With locale
{ 
  name: 'population', 
  format: 'number',
  locale: 'de-DE',
  formatOptions: { useGrouping: true }
}
```

#### 3. Currency Format
Uses `Intl.NumberFormat` with currency style.

```javascript
// Basic USD currency
{ 
  name: 'salary', 
  format: 'currency', 
  currency: 'USD' 
}

// EUR with German locale
{ 
  name: 'price', 
  format: 'currency', 
  currency: 'EUR', 
  locale: 'de-DE' 
}

// Custom options
{ 
  name: 'budget', 
  format: 'currency', 
  currency: 'GBP',
  locale: 'en-GB',
  formatOptions: { 
    minimumFractionDigits: 0,
    maximumFractionDigits: 0 
  }
}
```

#### 4. Date Format
Uses `Intl.DateTimeFormat` for date/time values.

```javascript
// Basic date
{ name: 'joinDate', format: 'date' }

// Short date style
{ 
  name: 'createdAt', 
  format: 'date',
  formatOptions: { dateStyle: 'short' }
}

// Custom format
{ 
  name: 'updatedAt', 
  format: 'date',
  locale: 'fr-FR',
  formatOptions: { 
    year: 'numeric', 
    month: 'long', 
    day: '2-digit',
    weekday: 'long'
  }
}

// Date and time
{ 
  name: 'timestamp', 
  format: 'date',
  formatOptions: { 
    dateStyle: 'short',
    timeStyle: 'medium'
  }
}
```

#### 5. Percentage Format
Uses `Intl.NumberFormat` with percent style.

```javascript
// Basic percentage (0.15 → 15%)
{ name: 'bonus', format: 'percent' }

// With decimals
{ 
  name: 'commission', 
  format: 'percent',
  formatOptions: { minimumFractionDigits: 2 }
}

// With locale
{ 
  name: 'growth', 
  format: 'percent',
  locale: 'de-DE',
  formatOptions: { signDisplay: 'always' }
}
```

## Custom Renderers

Custom renderers have priority over formatting but can use formatted values.

### Renderer Function Signature
```javascript
renderer: (value, row, formattedValue) => {
  // value: raw cell value
  // row: complete row object
  // formattedValue: formatted value (if format is specified)
  
  return 'HTML string or text';
}
```

### Examples

#### Using Formatted Value
```javascript
{
  name: 'salary',
  format: 'currency',
  currency: 'USD',
  renderer: (value, row, formattedValue) => {
    const color = value >= 80000 ? 'green' : 'red';
    return `<span style="color: ${color}">${formattedValue}</span>`;
  }
}
```

#### Completely Custom
```javascript
{
  name: 'status',
  renderer: (value) => {
    return value ? 'Active' : 'Inactive';
  }
}
```

#### Using Row Context
```javascript
{
  name: 'fullName',
  renderer: (value, row) => {
    return `${row.firstName} ${row.lastName}`;
  }
}
```

## Internationalization

### Locale Support
- **Default**: Uses browser's default locale
- **Custom**: Specify any valid locale string
- **Examples**: `'en-US'`, `'de-DE'`, `'fr-FR'`, `'ja-JP'`, `'ar-SA'`

### Format Options
All `formatOptions` are passed directly to the respective Intl API:

#### DateTimeFormat Options
```javascript
formatOptions: {
  dateStyle: 'full' | 'long' | 'medium' | 'short',
  timeStyle: 'full' | 'long' | 'medium' | 'short',
  year: 'numeric' | '2-digit',
  month: 'numeric' | '2-digit' | 'long' | 'short' | 'narrow',
  day: 'numeric' | '2-digit',
  weekday: 'long' | 'short' | 'narrow',
  hour: 'numeric' | '2-digit',
  minute: 'numeric' | '2-digit',
  second: 'numeric' | '2-digit',
  timeZone: 'UTC' | 'America/New_York' | ...
}
```

#### NumberFormat Options
```javascript
formatOptions: {
  minimumFractionDigits: 0,
  maximumFractionDigits: 3,
  minimumSignificantDigits: 1,
  maximumSignificantDigits: 21,
  useGrouping: true,
  signDisplay: 'auto' | 'never' | 'always' | 'exceptZero'
}
```

## Performance

### Optimization Features
- **Formatter Caching**: Compiled once per column, reused for all rows
- **Lazy Compilation**: Only creates formatters for columns with `format` specified
- **Error Resilience**: Invalid data doesn't break formatting for other cells

### Best Practices
1. **Use appropriate format types**: Don't use `currency` for simple numbers
2. **Minimize formatOptions**: Only specify needed options
3. **Cache heavy renderers**: For complex custom renderers, consider memoization
4. **Test with large datasets**: Verify performance with your expected data size

## Error Handling

The formatting system gracefully handles various error conditions:

### Invalid Data Types
```javascript
// These won't break the table:
{ date: 'invalid-date', number: 'not-a-number', currency: null }
```

### Unsupported Formats
```javascript
// Warns and falls back to raw value:
{ name: 'field', format: 'unsupported-format' }
```

### Missing Required Properties
```javascript
// Currency without currency code:
{ name: 'price', format: 'currency' } // Will show warning
```

## 🔮 Extensibility

The system is designed for future extension:

### Future Custom Formats (Conceptual)
```javascript
// Future API for custom formats:
table.columnManager.registerFormat('filesize', (column) => {
  return (value) => {
    // Custom formatting logic
    return formatFileSize(value);
  };
});

// Usage:
{ name: 'fileSize', format: 'filesize' }
```

### Plugin Architecture
The modular design allows for future plugins that could add:
- Custom format types
- Advanced formatting rules
- Conditional formatting
- Template-based formatting

## Real-World Examples

### Employee Table
```javascript
const employeeTable = new Table('#employees', {
  data: employees,
  columns: [
    { name: 'id', title: 'ID' },
    { name: 'name', title: 'Employee Name' },
    { name: 'department', title: 'Department' },
    { 
      name: 'salary', 
      title: 'Annual Salary', 
      format: 'currency',
      currency: 'USD',
      formatOptions: { minimumFractionDigits: 0 }
    },
    { 
      name: 'bonus', 
      title: 'Bonus Rate', 
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
      name: 'rating', 
      title: 'Performance', 
      format: 'number',
      formatOptions: { minimumFractionDigits: 1, maximumFractionDigits: 1 }
    }
  ]
});
```

### Financial Dashboard
```javascript
const financialTable = new Table('#financial', {
  data: transactions,
  columns: [
    { name: 'date', title: 'Date', format: 'date', formatOptions: { dateStyle: 'short' } },
    { name: 'description', title: 'Description' },
    { 
      name: 'amount', 
      title: 'Amount', 
      format: 'currency',
      currency: 'EUR',
      locale: 'de-DE',
      renderer: (value, row, formattedValue) => {
        const color = value >= 0 ? 'green' : 'red';
        return `<span style="color: ${color}">${formattedValue}</span>`;
      }
    },
    { 
      name: 'tax', 
      title: 'Tax Rate', 
      format: 'percent',
      locale: 'de-DE'
    }
  ]
});
```

## Testing

Test your formatting with various data types:

```javascript
const testData = [
  { value: 123.456, date: '2023-12-25', currency: 50000 },
  { value: null, date: null, currency: null },
  { value: 'invalid', date: 'invalid-date', currency: 'not-number' },
  { value: 0, date: new Date(), currency: 0 }
];
```

## API Reference

### ColumnManager Methods

#### `initializeColumns(columns)`
Initialize columns and compile formatters.

#### `formatCellValue(columnName, value, row)`
Format a cell value for display.

#### `getColumn(columnName)`
Get column definition by name.

#### `getColumns()`
Get all column definitions.

#### `getSupportedFormats()`
Get array of supported format types.

### Format-Specific Options

See the [Intl documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl) for complete options:
- [DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat)
- [NumberFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat)

---

*This formatting system integrates seamlessly with TablixJS's existing features including sorting, pagination, and event hooks.*
