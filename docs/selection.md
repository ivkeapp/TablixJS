# Row Selection Guide

TablixJS provides comprehensive row selection functionality with support for both single and multi-row selection modes. This guide covers all aspects of implementing and customizing row selection in your tables.

## Table of Contents

1. [Basic Setup](#basic-setup)
2. [Selection Modes](#selection-modes)
3. [User Interactions](#user-interactions)
4. [Programmatic API](#programmatic-api)
5. [Event System](#event-system)
6. [Integration with Other Features](#integration-with-other-features)
7. [Styling and Theming](#styling-and-theming)
8. [Advanced Usage](#advanced-usage)
9. [Best Practices](#best-practices)

## Basic Setup

To enable row selection, add the `selection` configuration to your table options:

```javascript
const table = new Table('#container', {
  selection: {
    enabled: false,       // Default: selection is disabled
    mode: 'single',       // 'single' or 'multi'
    dataIdKey: 'id'       // Key to use as stable row identifier
  }
});
```

### Selection Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | Boolean | `false` | Enable/disable row selection |
| `mode` | String | `'single'` | Selection mode: `'single'` or `'multi'` |
| `dataIdKey` | String | `'id'` | Data property to use as stable row identifier |

## User Interactions

### Single Mode
- **Click**: Select the clicked row (clears previous selection)

### Multi Mode
- **Click**: Select the clicked row (clears other selections)
- **Ctrl+Click** (Cmd+Click on Mac): Add/remove individual rows
- **Shift+Click**: Select range from last selected row to clicked row

## Events

### beforeSelect
Fired before a selection changes.

```javascript
table.eventManager.on('beforeSelect', (event) => {
  console.log('Before select:', event);
  // event contains: { rowData, rowId, currentSelection, isCtrlClick, isShiftClick }
});
```

### afterSelect
Fired after a selection changes.

```javascript
table.eventManager.on('afterSelect', (event) => {
  console.log('After select:', event);
  // event contains: { rowData, rowId, selectedRows, selectedData }
});
```

## API Methods

### Getting Selection

#### `getSelectedData()`
Returns array of selected row data objects.

```javascript
const selectedRows = table.getSelectedData();
console.log('Selected rows:', selectedRows);
```

#### `getSelectedIds()`
Returns array of selected row IDs.

```javascript
const selectedIds = table.getSelectedIds();
console.log('Selected IDs:', selectedIds);
```

#### `getSelectionCount()`
Returns number of selected rows.

```javascript
const count = table.getSelectionCount();
console.log(`${count} rows selected`);
```

#### `isRowSelected(rowId)`
Checks if a specific row is selected.

```javascript
if (table.isRowSelected('123')) {
  console.log('Row 123 is selected');
}
```

### Modifying Selection

#### `selectRows(rowIds)`
Programmatically select rows by ID(s).

```javascript
// Select single row
table.selectRows('123');

// Select multiple rows
table.selectRows(['123', '456', '789']);
```

#### `deselectRows(rowIds)`
Programmatically deselect rows by ID(s).

```javascript
// Deselect single row
table.deselectRows('123');

// Deselect multiple rows
table.deselectRows(['123', '456']);
```

#### `clearSelection()`
Clear all selections.

```javascript
table.clearSelection();
```

### Configuration Control

#### `enableSelection()`
Enable selection functionality.

```javascript
table.enableSelection();
```

#### `disableSelection()`
Disable selection functionality.

```javascript
table.disableSelection();
```

#### `setSelectionMode(mode)`
Change selection mode.

```javascript
table.setSelectionMode('multi');  // or 'single'
```

## Behavior with Table Features

### Pagination
- Selection is preserved for rows that remain visible
- Rows hidden by pagination keep their selection state
- Selection works across different pages

### Filtering & Search
- Rows hidden by filters/search are automatically deselected
- Selection state is preserved for visible rows
- Filtering triggers `afterSelect` event if selection changes

### Sorting
- Selection is preserved using stable row IDs
- Visual selection updates after sorting
- No selection state is lost during sorting operations

## CSS Customization

Selection styles can be customized using CSS variables:

```css
:root {
  /* Regular selected row */
  --tablix-row-selected-bg: #e3f2fd;
  --tablix-row-selected-hover-bg: #bbdefb;
  
  /* Last selected row (in multi-mode) */
  --tablix-row-last-selected-bg: #abd5f8; /* will change */
  --tablix-row-last-selected-color: #ffffff;
  --tablix-row-last-selected-hover-bg: #9ec0e0; /* will change */
  
  /* Selection indicator */
  --tablix-selection-indicator-color: #9ec0e0; /* will change */
}
```

## Examples

### Single Selection
```javascript
const table = new Table('#container', {
  data: users,
  columns: columns,
  selection: {
    enabled: true,
    mode: 'single'
  }
});

table.eventManager.on('afterSelect', (event) => {
  const selected = event.selectedData[0];
  if (selected) {
    console.log('Selected user:', selected.name);
  }
});
```

### Multi Selection with Event Handling
```javascript
const table = new Table('#container', {
  data: users,
  columns: columns,
  selection: {
    enabled: true,
    mode: 'multi',
    dataIdKey: 'userId'
  }
});

// Handle selection changes
table.eventManager.on('afterSelect', (event) => {
  const count = event.selectedData.length;
  document.getElementById('selectedCount').textContent = 
    `${count} users selected`;
});

// Programmatically select specific users
document.getElementById('selectAdmins').addEventListener('click', () => {
  const adminIds = users
    .filter(user => user.role === 'admin')
    .map(user => user.userId);
  table.selectRows(adminIds);
});
```

### Dynamic Selection Control
```javascript
// Toggle selection mode
function toggleSelectionMode() {
  const currentMode = table.selectionManager.options.mode;
  const newMode = currentMode === 'single' ? 'multi' : 'single';
  table.setSelectionMode(newMode);
}

// Bulk operations
function deleteSelected() {
  const selectedIds = table.getSelectedIds();
  if (selectedIds.length === 0) {
    alert('No rows selected');
    return;
  }
  
  if (confirm(`Delete ${selectedIds.length} selected items?`)) {
    // Perform delete operation
    selectedIds.forEach(id => deleteUser(id));
    
    // Refresh table data
    table.loadData(updatedData);
  }
}
```

## Best Practices

1. **Stable Row IDs**: Always use a stable, unique identifier for `dataIdKey` (like database IDs)
2. **Event Handling**: Use `afterSelect` event for UI updates and actions
3. **User Feedback**: Provide clear visual feedback for selection states
4. **Accessibility**: Selection works with keyboard navigation (Enter/Space on rows)
5. **Performance**: Selection state is efficiently managed using Sets for O(1) lookups

## Limitations & Considerations

- Selection is based on data IDs, not row indexes
- Filtered-out rows are automatically deselected
- Server-side pagination requires careful handling of selection persistence
- Maximum selection size is limited by browser memory (typically thousands of rows)
