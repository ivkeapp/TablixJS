# TablixJS Plugin Architecture & Extensibility

This document explains how TablixJS is designed for extensibility and how to create plugins for additional functionality.

## Architecture Overview

TablixJS follows a modular architecture with clear separation of concerns:

```
Table (Core)
├── DataManager (Data handling)
├── EventManager (Event system)
├── ColumnManager (Column formatting)
├── Renderer (UI rendering)
├── PaginationManager (Pagination logic)
├── SortingManager (Sorting logic)
├── FilterManager (Filtering logic)
└── FilterUI (Filter interface)
```

## Plugin Development Guidelines

### 1. Manager Pattern
All major functionality is implemented as "Manager" classes that:
- Take the main `Table` instance as the first parameter
- Have their own configuration options
- Integrate via the EventManager for loose coupling
- Are conditionally initialized based on options

### 2. Event-Driven Architecture
Managers communicate through events:
```javascript
// Trigger events
this.table.eventManager.trigger('eventName', payload);

// Listen to events
this.table.eventManager.on('eventName', callback);
```

### 3. Renderer Integration
UI components integrate with the main Renderer:
```javascript
// In Renderer.renderTable()
if (this.table.filterUI) {
  this.table.filterUI.renderFilterIcons();
}
```

## Example: Creating a Column Resizing Plugin

Here's how to create a column resizing plugin following TablixJS patterns:

### Step 1: Create ResizeManager

```javascript
// src/core/ResizeManager.js
export default class ResizeManager {
  constructor(table, options = {}) {
    this.table = table;
    this.options = {
      enabled: true,
      minWidth: 50,
      maxWidth: 500,
      persistState: true,
      ...options
    };

    this.columnWidths = new Map();
    this.isResizing = false;
    this.resizeData = null;

    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);

    this.init();
  }

  init() {
    // Load saved column widths
    if (this.options.persistState) {
      this.loadColumnWidths();
    }

    // Listen for table render events
    this.table.eventManager.on('afterRender', () => {
      this.renderResizeHandles();
    });
  }

  renderResizeHandles() {
    const headers = this.table.container.querySelectorAll('.tablix-th');
    
    headers.forEach((header, index) => {
      // Skip if resize handle already exists
      if (header.querySelector('.tablix-resize-handle')) return;

      const resizeHandle = document.createElement('div');
      resizeHandle.className = 'tablix-resize-handle';
      resizeHandle.addEventListener('mousedown', (e) => {
        this.handleMouseDown(e, header, index);
      });

      header.style.position = 'relative';
      header.appendChild(resizeHandle);

      // Apply saved width if available
      const columnName = header.dataset.column;
      if (this.columnWidths.has(columnName)) {
        header.style.width = this.columnWidths.get(columnName) + 'px';
      }
    });
  }

  handleMouseDown(e, header, columnIndex) {
    e.preventDefault();
    
    this.isResizing = true;
    this.resizeData = {
      header,
      columnIndex,
      startX: e.clientX,
      startWidth: header.offsetWidth
    };

    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('mouseup', this.handleMouseUp);
    
    // Trigger event
    this.table.eventManager.trigger('beforeColumnResize', {
      columnIndex,
      columnName: header.dataset.column,
      currentWidth: header.offsetWidth
    });
  }

  handleMouseMove(e) {
    if (!this.isResizing || !this.resizeData) return;

    const { header, startX, startWidth } = this.resizeData;
    const deltaX = e.clientX - startX;
    const newWidth = Math.max(
      this.options.minWidth,
      Math.min(this.options.maxWidth, startWidth + deltaX)
    );

    header.style.width = newWidth + 'px';
    
    // Update corresponding table cells
    this.updateColumnWidth(this.resizeData.columnIndex, newWidth);
  }

  handleMouseUp() {
    if (!this.isResizing) return;

    const { header, columnIndex } = this.resizeData;
    const newWidth = header.offsetWidth;
    const columnName = header.dataset.column;

    // Save new width
    this.columnWidths.set(columnName, newWidth);
    
    if (this.options.persistState) {
      this.saveColumnWidths();
    }

    // Trigger event
    this.table.eventManager.trigger('afterColumnResize', {
      columnIndex,
      columnName,
      newWidth
    });

    // Cleanup
    this.isResizing = false;
    this.resizeData = null;
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
  }

  updateColumnWidth(columnIndex, width) {
    // Update all cells in this column
    const table = this.table.container.querySelector('.tablix-table');
    const cells = table.querySelectorAll(`td:nth-child(${columnIndex + 1})`);
    cells.forEach(cell => {
      cell.style.width = width + 'px';
    });
  }

  // Public API methods
  setColumnWidth(columnName, width) {
    this.columnWidths.set(columnName, width);
    // Trigger re-render or apply immediately
    this.renderResizeHandles();
  }

  getColumnWidth(columnName) {
    return this.columnWidths.get(columnName);
  }

  resetColumnWidths() {
    this.columnWidths.clear();
    if (this.options.persistState) {
      localStorage.removeItem('tablixColumnWidths');
    }
  }

  saveColumnWidths() {
    const widthsObj = Object.fromEntries(this.columnWidths);
    localStorage.setItem('tablixColumnWidths', JSON.stringify(widthsObj));
  }

  loadColumnWidths() {
    const saved = localStorage.getItem('tablixColumnWidths');
    if (saved) {
      const widthsObj = JSON.parse(saved);
      this.columnWidths = new Map(Object.entries(widthsObj));
    }
  }
}
```

### Step 2: Create ResizeUI (if needed)

```javascript
// src/core/ResizeUI.js
export default class ResizeUI {
  constructor(resizeManager) {
    this.resizeManager = resizeManager;
    this.table = resizeManager.table;
  }

  renderResizeIndicator() {
    // Create visual feedback during resize
    if (!this.indicator) {
      this.indicator = document.createElement('div');
      this.indicator.className = 'tablix-resize-indicator';
      document.body.appendChild(this.indicator);
    }
  }

  showResizeIndicator(x, width) {
    if (this.indicator) {
      this.indicator.style.left = x + 'px';
      this.indicator.style.width = width + 'px';
      this.indicator.style.display = 'block';
    }
  }

  hideResizeIndicator() {
    if (this.indicator) {
      this.indicator.style.display = 'none';
    }
  }
}
```

### Step 3: Create CSS Styles

```css
/* src/styles/resize-core.css */
.tablix-resize-handle {
  position: absolute;
  top: 0;
  right: -2px;
  width: 4px;
  height: 100%;
  cursor: col-resize;
  background: transparent;
  border-right: 2px solid transparent;
  transition: border-color 0.2s ease;
}

.tablix-resize-handle:hover {
  border-right-color: var(--tablix-btn-active-color, #007bff);
}

.tablix-resize-indicator {
  position: fixed;
  top: 0;
  height: 100vh;
  background: var(--tablix-btn-active-color, #007bff);
  opacity: 0.3;
  pointer-events: none;
  z-index: 9999;
  display: none;
}

/* Resizing state */
.tablix-table.tablix-resizing {
  user-select: none;
}

.tablix-table.tablix-resizing * {
  cursor: col-resize !important;
}
```

### Step 4: Integration with Main Table

```javascript
// Add to Table.js imports
import ResizeManager from './ResizeManager.js';
import ResizeUI from './ResizeUI.js';

// Add to Table constructor options
this.options = {
  // ...existing options...
  resize: {
    enabled: false,
    minWidth: 50,
    maxWidth: 500,
    persistState: true
  },
  ...options
};

// Add to Table constructor initialization
// Initialize resizing if enabled
if (this.options.resize && this.options.resize.enabled !== false) {
  this.resizeManager = new ResizeManager(this, this.options.resize);
  this.resizeUI = new ResizeUI(this.resizeManager);
}

// Add public API methods to Table class
setColumnWidth(columnName, width) {
  if (this.resizeManager) {
    this.resizeManager.setColumnWidth(columnName, width);
  }
}

getColumnWidth(columnName) {
  return this.resizeManager ? this.resizeManager.getColumnWidth(columnName) : null;
}

resetColumnWidths() {
  if (this.resizeManager) {
    this.resizeManager.resetColumnWidths();
  }
}
```

## Creating Other Plugin Types

### 1. Data Export Plugin

```javascript
export default class ExportManager {
  constructor(table, options = {}) {
    this.table = table;
    this.options = {
      formats: ['csv', 'json', 'excel'],
      filename: 'table-export',
      includeHeaders: true,
      ...options
    };
  }

  exportData(format = 'csv') {
    const data = this.table.dataManager.getData();
    const columns = this.table.columnManager.getColumns();

    switch (format) {
      case 'csv':
        return this.exportCSV(data, columns);
      case 'json':
        return this.exportJSON(data);
      case 'excel':
        return this.exportExcel(data, columns);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  exportCSV(data, columns) {
    // CSV export implementation
  }

  exportJSON(data) {
    // JSON export implementation
  }

  exportExcel(data, columns) {
    // Excel export implementation (requires library)
  }
}
```

### 2. Inline Editing Plugin

```javascript
export default class EditManager {
  constructor(table, options = {}) {
    this.table = table;
    this.options = {
      enabled: true,
      editableColumns: [],
      saveOnBlur: true,
      validators: {},
      ...options
    };

    this.editingCell = null;
    this.originalValue = null;
  }

  startEdit(rowIndex, columnName) {
    // Begin editing a cell
    this.table.eventManager.trigger('beforeEdit', {
      rowIndex,
      columnName,
      currentValue: this.getCurrentValue(rowIndex, columnName)
    });
    
    // Implementation...
  }

  saveEdit() {
    // Save edited value
    this.table.eventManager.trigger('afterEdit', {
      rowIndex: this.editingCell.rowIndex,
      columnName: this.editingCell.columnName,
      oldValue: this.originalValue,
      newValue: this.getEditedValue()
    });
  }

  cancelEdit() {
    // Cancel editing and restore original value
  }
}
```

### 3. Drag & Drop Plugin

```javascript
export default class DragDropManager {
  constructor(table, options = {}) {
    this.table = table;
    this.options = {
      rowDrag: true,
      columnDrag: true,
      ...options
    };
  }

  enableRowDragging() {
    // Implementation for row reordering
  }

  enableColumnDragging() {
    // Implementation for column reordering
  }
}
```

## Plugin Best Practices

### 1. Follow Manager Pattern
- Constructor takes `(table, options)`
- Store reference to main table
- Implement public API methods
- Use EventManager for communication

### 2. Event Integration
```javascript
// Trigger events for extensibility
this.table.eventManager.trigger('beforeAction', data);
// ... perform action ...
this.table.eventManager.trigger('afterAction', result);
```

### 3. CSS Isolation
- Use `tablix-` prefix for all CSS classes
- Support CSS custom properties for theming
- Provide both light and dark theme support

### 4. Configuration
- Provide sensible defaults
- Support both global and per-instance configuration
- Document all options

### 5. Memory Management
- Clean up event listeners in destroy methods
- Remove DOM elements when plugin is disabled
- Avoid memory leaks in long-running applications

## Plugin Distribution

### NPM Package Structure
```
my-tablix-plugin/
├── src/
│   ├── MyPluginManager.js
│   ├── MyPluginUI.js
│   └── styles/
│       └── my-plugin.css
├── dist/
│   ├── my-plugin.js
│   └── my-plugin.css
├── package.json
└── README.md
```

### Usage Example
```javascript
import Table from 'tablixjs';
import MyPlugin from 'my-tablix-plugin';

// Register plugin
Table.registerPlugin('myPlugin', MyPlugin);

// Use plugin
const table = new Table('#myTable', {
  myPlugin: {
    enabled: true,
    // plugin options
  }
});
```

This plugin architecture ensures TablixJS remains lightweight while allowing for rich functionality through optional plugins.
