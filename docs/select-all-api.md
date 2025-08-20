# selectAllRows() API

The `selectAllRows()` method has been added to the TablixJS Table class to provide a convenient way to select all currently visible/filtered rows.

## Method Signature

```javascript
table.selectAllRows(): number
```

## Parameters

None

## Returns

- **Type:** `number`
- **Description:** The number of rows that were selected

## Behavior

- Selects all rows that are currently visible based on:
  - Applied filters (column filters)
  - Active search terms
  - Current pagination view (selects across all pages, not just current page)
- Respects the `dataIdKey` option specified during table initialization
- Only works when selection is enabled (`selection.enabled: true`)
- Works with both `single` and `multi` selection modes
- Triggers a custom `selectAll` event

## Events

The method triggers a custom `selectAll` event with the following payload:

```javascript
{
  selectedIds: string[],    // Array of selected row IDs
  selectedData: object[],   // Array of selected row data objects  
  count: number            // Number of rows selected
}
```

## Usage Examples

### Basic Usage

```javascript
// Select all visible rows
const selectedCount = table.selectAllRows();
console.log(`Selected ${selectedCount} rows`);
```

### With Event Listener

```javascript
// Listen for selectAll events
table.eventManager.on('selectAll', (event) => {
  console.log(`Selected ${event.count} rows:`, event.selectedData);
});

// Trigger selection
table.selectAllRows();
```

### With Keyboard Shortcut

```javascript
document.addEventListener('keydown', (e) => {
  if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    table.selectAllRows();
  }
});
```

### Respecting Filters

```javascript
// Apply a filter first
await table.applyFilter('department', { 
  type: 'value', 
  values: ['Engineering'] 
});

// Select all filtered rows (only Engineering employees)
const count = table.selectAllRows();
console.log(`Selected ${count} Engineering employees`);
```

## Error Handling

The method includes built-in warnings for common issues:

- **Selection disabled:** Logs warning if `selection.enabled` is false
- **No data available:** Logs warning if no rows are available to select
- **Returns 0** in both error cases

## Compatibility

- **Minimum Version:** TablixJS v1.0.0 (with this enhancement)
- **Browser Support:** All modern browsers
- **Dependencies:** Requires SelectionManager to be initialized

## Related Methods

- `table.getSelectedData()` - Get selected row objects
- `table.getSelectedIds()` - Get selected row IDs  
- `table.getSelectionCount()` - Get count of selected rows
- `table.clearSelection()` - Clear all selections
- `table.selectRows(ids)` - Select specific rows by ID
- `table.deselectRows(ids)` - Deselect specific rows by ID

## Migration Notes

If you were previously using a custom `selectAllRows()` implementation like:

```javascript
// Old custom implementation
function selectAllRows() {
  const allData = table.getData();
  const allIds = allData.map(row => row.id.toString());
  table.selectRows(allIds);
}
```

You can now replace it with the built-in method:

```javascript
// New built-in API
const count = table.selectAllRows();
```

The built-in method provides better error handling, event triggering, and return value for improved developer experience.
