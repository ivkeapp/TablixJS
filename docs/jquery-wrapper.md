# TablixJS jQuery Wrapper

The TablixJS jQuery wrapper provides a familiar jQuery plugin interface for initializing and interacting with TablixJS tables.

## Installation

### Via npm

```bash
npm install tablixjs
```

### Via CDN

```html
<!-- Include jQuery first -->
<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>

<!-- Include TablixJS and jQuery wrapper -->
<script src="https://unpkg.com/tablixjs@latest/dist/tablix.jquery.min.js"></script>

<!-- Include TablixJS CSS -->
<link rel="stylesheet" href="https://unpkg.com/tablixjs@latest/dist/tablix.css">
```

### Manual Download

Download the `tablix.jquery.js` and `tablix.css` files from the [releases page](https://github.com/ivkeapp/TablixJS/releases) and include them in your project.

## Basic Usage

### Initialization

Initialize a TablixJS table using jQuery:

```javascript
$('#myTable').tablixJS({
  data: [
    { id: 1, name: 'John Doe', email: 'john@example.com', age: 30 },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', age: 25 },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', age: 35 }
  ],
  columns: [
    { name: 'id', title: 'ID' },
    { name: 'name', title: 'Full Name' },
    { name: 'email', title: 'Email Address' },
    { name: 'age', title: 'Age' }
  ]
});
```

### Alternative Initialization Syntax

You can also use a nested options structure:

```javascript
$('#myTable').tablixJS({
  data: myData,
  columns: myColumns,
  options: {
    pagination: { pageSize: 20 },
    sorting: { enabled: true },
    filtering: { enabled: true },
    selection: { enabled: true, mode: 'multi' }
  }
});
```

## Configuration Options

The wrapper accepts all the same options as the core TablixJS library. Here are some common configurations:

### Basic Table with Pagination

```javascript
$('#myTable').tablixJS({
  data: myData,
  columns: myColumns,
  pagination: {
    enabled: true,
    pageSize: 10,
    showPageNumbers: true,
    showPageSizes: true,
    pageSizeOptions: [5, 10, 25, 50]
  }
});
```

### Table with Sorting and Filtering

```javascript
$('#myTable').tablixJS({
  data: myData,
  columns: myColumns,
  sorting: {
    enabled: true,
    mode: 'client'
  },
  filtering: {
    enabled: true,
    showBadges: true
  },
  search: {
    enabled: true,
    placeholder: 'Search records...'
  }
});
```

### Table with Row Selection

```javascript
$('#myTable').tablixJS({
  data: myData,
  columns: myColumns,
  selection: {
    enabled: true,
    mode: 'multi', // 'single' or 'multi'
    dataIdKey: 'id'
  }
});
```

### Table with Virtual Scrolling

```javascript
$('#myTable').tablixJS({
  data: largeDataSet,
  columns: myColumns,
  virtualScroll: {
    enabled: true,
    containerHeight: 400,
    buffer: 5
  }
});
```

## Method Calls

Once initialized, you can call methods on the TablixJS instance:

### Data Management

```javascript
// Reload table with new data
$('#myTable').tablixJS('loadData', newDataArray);

// Alternative reload method
$('#myTable').tablixJS('reload', newDataArray);

// Refresh table with current data
$('#myTable').tablixJS('refresh');

// Get current data
var currentData = $('#myTable').tablixJS('getData');

// Get original unfiltered data
var originalData = $('#myTable').tablixJS('getOriginalData');
```

### Selection Methods

```javascript
// Get selected row data
var selectedData = $('#myTable').tablixJS('getSelectedData');

// Get selected row IDs
var selectedIds = $('#myTable').tablixJS('getSelectedIds');

// Select rows by ID
$('#myTable').tablixJS('selectRows', [1, 2, 3]);

// Deselect rows by ID
$('#myTable').tablixJS('deselectRows', [1, 2]);

// Clear all selections
$('#myTable').tablixJS('clearSelection');

// Select all visible rows
var selectedCount = $('#myTable').tablixJS('selectAllRows');
```

### Filtering Methods

```javascript
// Apply simple filter
$('#myTable').tablixJS('filter', { name: 'John' });

// Apply advanced column filter
$('#myTable').tablixJS('applyFilter', 'status', {
  type: 'value',
  values: ['Active', 'Pending']
});

// Clear specific column filter
$('#myTable').tablixJS('clearFilter', 'status');

// Clear all filters
$('#myTable').tablixJS('clearAllFilters');
```

### Sorting Methods

```javascript
// Sort by column
$('#myTable').tablixJS('sort', 'name', 'asc'); // or 'desc'

// Toggle sort for a column
$('#myTable').tablixJS('toggleSort', 'name');

// Clear all sorting
$('#myTable').tablixJS('clearSorting');
```

### Search Methods

```javascript
// Set search term
$('#myTable').tablixJS('setSearchTerm', 'john');

// Clear search
$('#myTable').tablixJS('clearSearch');
```

### Pagination Methods

```javascript
// Navigate pages
$('#myTable').tablixJS('nextPage');
$('#myTable').tablixJS('prevPage');
$('#myTable').tablixJS('firstPage');
$('#myTable').tablixJS('lastPage');

// Go to specific page
$('#myTable').tablixJS('goToPage', 3);

// Change page size
$('#myTable').tablixJS('changePageSize', 25);

// Get pagination info
var pageInfo = $('#myTable').tablixJS('getPaginationInfo');
```

### Localization Methods

```javascript
// Set language
$('#myTable').tablixJS('setLanguage', 'fr');

// Get current language
var currentLang = $('#myTable').tablixJS('getCurrentLanguage');

// Get available languages
var availableLangs = $('#myTable').tablixJS('getAvailableLanguages');
```

### Configuration Methods

```javascript
// Update options
$('#myTable').tablixJS('setOptions', {
  pagination: { pageSize: 20 }
});

// Get current options
var options = $('#myTable').tablixJS('getOptions');
```

### Event Handling

```javascript
// Add event listener
$('#myTable').tablixJS('on', 'afterLoad', function(data) {
  console.log('Data loaded:', data);
});

// Remove event listener
$('#myTable').tablixJS('off', 'afterLoad', handlerFunction);

// Trigger custom event
$('#myTable').tablixJS('trigger', 'customEvent', customData);
```

### Instance Management

```javascript
// Get the underlying TablixJS instance
var tablixInstance = $('#myTable').tablixJS('getInstance');

// Destroy the table
$('#myTable').tablixJS('destroy');
```

## jQuery Events

The wrapper automatically forwards TablixJS events as jQuery events with the `tablixjs:` prefix:

```javascript
$('#myTable')
  .on('tablixjs:afterLoad', function(event, data, instance) {
    console.log('Table loaded with data:', data);
  })
  .on('tablixjs:selectionChanged', function(event, selectionData, instance) {
    console.log('Selection changed:', selectionData);
  })
  .on('tablixjs:afterFilter', function(event, filterData, instance) {
    console.log('Table filtered:', filterData);
  })
  .on('tablixjs:afterSort', function(event, sortData, instance) {
    console.log('Table sorted:', sortData);
  })
  .on('tablixjs:afterPageChange', function(event, pageInfo, instance) {
    console.log('Page changed:', pageInfo);
  });
```

### Available jQuery Events

- `tablixjs:afterLoad` - Fired after data is loaded
- `tablixjs:beforeLoad` - Fired before data loading starts
- `tablixjs:loadError` - Fired when data loading fails
- `tablixjs:afterFilter` - Fired after filtering is applied
- `tablixjs:afterSort` - Fired after sorting is applied
- `tablixjs:afterPageChange` - Fired after page navigation
- `tablixjs:afterSearch` - Fired after search is performed
- `tablixjs:selectionChanged` - Fired when row selection changes
- `tablixjs:selectAll` - Fired when all rows are selected
- `tablixjs:rowSelected` - Fired when a row is selected
- `tablixjs:rowDeselected` - Fired when a row is deselected

## Static Methods

The wrapper provides some static utility methods:

```javascript
// Get TablixJS instance from any element
var instance = $.fn.tablixJS.getInstance('#myTable');

// Check if element has TablixJS initialized
var isInitialized = $.fn.tablixJS.isInitialized('#myTable');

// Destroy all TablixJS instances on the page
$.fn.tablixJS.destroyAll();

// Get wrapper version
console.log('TablixJS jQuery Wrapper version:', $.fn.tablixJS.version);
```

## Multiple Tables

You can initialize multiple tables on the same page:

```javascript
// Initialize multiple tables
$('.data-table').tablixJS({
  pagination: { pageSize: 10 },
  sorting: { enabled: true }
});

// Call methods on specific tables
$('#table1').tablixJS('loadData', data1);
$('#table2').tablixJS('loadData', data2);

// Or call methods on all tables
$('.data-table').tablixJS('clearSearch');
```

## Integration with Existing jQuery Code

The wrapper integrates seamlessly with existing jQuery workflows:

```javascript
// Chain with other jQuery methods
$('#myTable')
  .tablixJS(tableOptions)
  .addClass('my-custom-class')
  .on('tablixjs:afterLoad', handleDataLoad);

// Use in jQuery document ready
$(document).ready(function() {
  $('#myTable').tablixJS({
    data: myData,
    columns: myColumns
  });
});

// Dynamic initialization based on data attributes
$('[data-tablix]').each(function() {
  var $table = $(this);
  var config = $table.data('tablix-config');
  $table.tablixJS(config);
});
```

## Error Handling

The wrapper includes error handling for common scenarios:

```javascript
try {
  $('#myTable').tablixJS({
    data: invalidData,
    columns: myColumns
  });
} catch (error) {
  console.error('Failed to initialize table:', error);
}

// Handle load errors with events
$('#myTable').on('tablixjs:loadError', function(event, errorInfo) {
  console.error('Data loading failed:', errorInfo.error);
  // Show user-friendly error message
  alert('Failed to load table data. Please try again.');
});
```

## Performance Tips

1. **Batch Updates**: When making multiple changes, consider destroying and reinitializing rather than multiple method calls.

2. **Event Debouncing**: For frequently triggered events, consider debouncing your handlers:

```javascript
let searchTimeout;
$('#searchInput').on('input', function() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    $('#myTable').tablixJS('setSearchTerm', $(this).val());
  }, 300);
});
```

3. **Virtual Scrolling**: For large datasets, enable virtual scrolling:

```javascript
$('#myTable').tablixJS({
  data: largeDataSet,
  columns: myColumns,
  virtualScroll: { enabled: true }
});
```

## Migration from Other Table Libraries

### From DataTables

```javascript
// DataTables initialization
$('#myTable').DataTable({
  data: myData,
  columns: myColumns
});

// TablixJS equivalent
$('#myTable').tablixJS({
  data: myData,
  columns: myColumns,
  pagination: { enabled: true },
  sorting: { enabled: true },
  search: { enabled: true }
});
```

### From jQuery Table Plugins

Most jQuery table plugins follow similar patterns. Replace the plugin name and adjust the options structure:

```javascript
// Generic jQuery table plugin
$('#myTable').someTablePlugin({
  data: myData,
  pagination: true,
  sorting: true
});

// TablixJS equivalent
$('#myTable').tablixJS({
  data: myData,
  pagination: { enabled: true },
  sorting: { enabled: true }
});
```

## Browser Support

The jQuery wrapper supports the same browsers as the core TablixJS library:

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+
- Internet Explorer 11 (with polyfills)

## Troubleshooting

### Common Issues

1. **jQuery not loaded**: Ensure jQuery is loaded before the TablixJS wrapper.
2. **CSS not included**: Make sure to include the TablixJS CSS file.
3. **Method not found**: Check that the table is initialized before calling methods.
4. **Data not displaying**: Verify that your data array contains objects with properties matching column names.

### Debugging

Enable debugging mode to get more detailed console output:

```javascript
$('#myTable').tablixJS({
  data: myData,
  columns: myColumns,
  debug: true
});
```

Or check if the table is properly initialized:

```javascript
if ($.fn.tablixJS.isInitialized('#myTable')) {
  console.log('Table is initialized');
} else {
  console.log('Table is not initialized');
}
```
