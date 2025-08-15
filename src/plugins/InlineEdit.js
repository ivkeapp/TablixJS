/**
 * InlineEdit Plugin for TablixJS
 * 
 * Enables inline editing functionality for table cells, allowing users to
 * edit cell values directly in the table without opening separate forms.
 * 
 * Features:
 * - Click or double-click to edit cells
 * - Support for different input types (text, number, select, textarea)
 * - Validation and error handling
 * - Save/cancel with keyboard shortcuts
 * - Configurable editable columns
 * - Custom validators and formatters
 * 
 * Usage:
 * ```js
 * import InlineEdit from './plugins/InlineEdit.js';
 * 
 * table.use(InlineEdit, {
 *   editableColumns: ['name', 'price', 'category'],
 *   trigger: 'doubleclick',  // 'click' or 'doubleclick'
 *   validators: {
 *     price: (value) => !isNaN(value) && value >= 0,
 *     name: (value) => value.length > 0
 *   },
 *   inputTypes: {
 *     category: 'select',
 *     description: 'textarea'
 *   }
 * });
 * ```
 */
export default {
  name: 'InlineEdit',
  
  defaultOptions: {
    editableColumns: [],          // Array of column names that can be edited
    trigger: 'doubleclick',       // 'click' or 'doubleclick'
    saveOnBlur: true,            // Save changes when losing focus
    saveOnEnter: true,           // Save changes on Enter key
    cancelOnEscape: true,        // Cancel changes on Escape key
    validators: {},              // Object with column validators
    inputTypes: {},              // Custom input types per column
    selectOptions: {},           // Options for select inputs
    errorClass: 'tablix-edit-error',
    editingClass: 'tablix-editing',
    allowEmpty: true,            // Allow empty values
    confirmDelete: true,         // Confirm before deleting values
    animation: true              // Animate edit transitions
  },

  install(table, options) {
    this.table = table;
    this.options = { ...this.defaultOptions, ...options };
    this.currentEdit = null;     // Track current editing state
    this.originalValue = null;   // Store original value for cancel
    this.editHistory = [];       // Track edit history

    // Store bound methods for cleanup
    this.boundMethods = {
      onCellClick: this.onCellClick.bind(this),
      onCellDoubleClick: this.onCellDoubleClick.bind(this),
      onAfterRender: this.onAfterRender.bind(this),
      onKeyDown: this.onKeyDown.bind(this),
      onInputBlur: this.onInputBlur.bind(this),
      onInputKeyDown: this.onInputKeyDown.bind(this)
    };

    // Listen to table events
    this.table.on('afterRender', this.boundMethods.onAfterRender);

    // Add plugin methods to table
    this.table.startEdit = this.startEdit.bind(this);
    this.table.saveEdit = this.saveEdit.bind(this);
    this.table.cancelEdit = this.cancelEdit.bind(this);
    this.table.isEditing = this.isEditing.bind(this);
    this.table.setEditableColumns = this.setEditableColumns.bind(this);
    this.table.getEditHistory = this.getEditHistory.bind(this);
    this.table.clearEditHistory = this.clearEditHistory.bind(this);

    // Add CSS styles
    this.addStyles();

    console.debug('TablixJS: InlineEdit plugin installed');
  },

  uninstall(table) {
    // Cancel any active edit
    if (this.currentEdit) {
      this.cancelEdit();
    }

    // Remove event listeners
    table.off('afterRender', this.boundMethods.onAfterRender);
    this.removeEventListeners();

    // Remove added methods
    delete table.startEdit;
    delete table.saveEdit;
    delete table.cancelEdit;
    delete table.isEditing;
    delete table.setEditableColumns;
    delete table.getEditHistory;
    delete table.clearEditHistory;

    // Remove styles
    this.removeStyles();

    console.debug('TablixJS: InlineEdit plugin uninstalled');
  },

  onAfterRender(data) {
    this.setupEditHandlers();
  },

  setupEditHandlers() {
    const table = this.table.container.querySelector('.tablix-table tbody');
    if (!table) return;

    // Remove existing listeners
    this.removeEventListeners();

    // Add event listeners based on trigger setting
    if (this.options.trigger === 'click') {
      table.addEventListener('click', this.boundMethods.onCellClick);
    } else {
      table.addEventListener('dblclick', this.boundMethods.onCellDoubleClick);
    }

    // Add keyboard navigation
    document.addEventListener('keydown', this.boundMethods.onKeyDown);
  },

  onCellClick(event) {
    this.handleCellEdit(event);
  },

  onCellDoubleClick(event) {
    event.preventDefault();
    this.handleCellEdit(event);
  },

  handleCellEdit(event) {
    const cell = event.target.closest('td');
    if (!cell) return;

    const row = cell.closest('tr');
    const rowIndex = Array.from(row.parentNode.children).indexOf(row);
    const cellIndex = Array.from(row.children).indexOf(cell);
    
    // Get column information
    const columns = this.table.columnManager ? this.table.columnManager.getColumns() : [];
    const column = columns[cellIndex];
    
    if (!column || !this.options.editableColumns.includes(column.name || column.key)) {
      return; // Column not editable
    }

    // Cancel any existing edit
    if (this.currentEdit) {
      this.cancelEdit();
    }

    this.startEdit(cell, rowIndex, cellIndex, column);
  },

  startEdit(cell, rowIndex, cellIndex, column) {
    if (this.currentEdit) {
      this.cancelEdit();
    }

    const data = this.table.getData();
    const rowData = data[rowIndex];
    const currentValue = rowData[column.name || column.key];

    // Store edit state
    this.currentEdit = {
      cell,
      rowIndex,
      cellIndex,
      column,
      rowData,
      field: column.name || column.key
    };
    this.originalValue = currentValue;

    // Create input element
    const input = this.createInputElement(column, currentValue);
    
    // Replace cell content with input
    cell.innerHTML = '';
    cell.appendChild(input);
    cell.classList.add(this.options.editingClass);

    // Focus and select input
    input.focus();
    if (input.select) {
      input.select();
    }

    // Add input event listeners
    input.addEventListener('blur', this.boundMethods.onInputBlur);
    input.addEventListener('keydown', this.boundMethods.onInputKeyDown);

    // Trigger edit start event
    this.table.trigger('editStart', {
      cell,
      rowIndex,
      cellIndex,
      column,
      value: currentValue,
      field: this.currentEdit.field
    });
  },

  createInputElement(column, value) {
    const inputType = this.options.inputTypes[column.name || column.key] || 'text';
    let input;

    switch (inputType) {
      case 'select':
        input = document.createElement('select');
        const options = this.options.selectOptions[column.name || column.key] || [];
        options.forEach(option => {
          const optionEl = document.createElement('option');
          optionEl.value = typeof option === 'object' ? option.value : option;
          optionEl.textContent = typeof option === 'object' ? option.label : option;
          optionEl.selected = optionEl.value == value;
          input.appendChild(optionEl);
        });
        break;

      case 'textarea':
        input = document.createElement('textarea');
        input.value = value || '';
        input.rows = 3;
        break;

      case 'number':
        input = document.createElement('input');
        input.type = 'number';
        input.value = value || '';
        break;

      case 'date':
        input = document.createElement('input');
        input.type = 'date';
        input.value = value || '';
        break;

      case 'email':
        input = document.createElement('input');
        input.type = 'email';
        input.value = value || '';
        break;

      default:
        input = document.createElement('input');
        input.type = 'text';
        input.value = value || '';
    }

    input.className = 'tablix-edit-input';
    return input;
  },

  onInputBlur(event) {
    if (this.options.saveOnBlur) {
      this.saveEdit();
    }
  },

  onInputKeyDown(event) {
    if (event.key === 'Enter' && this.options.saveOnEnter) {
      event.preventDefault();
      this.saveEdit();
    } else if (event.key === 'Escape' && this.options.cancelOnEscape) {
      event.preventDefault();
      this.cancelEdit();
    } else if (event.key === 'Tab') {
      // Allow tab navigation
      this.saveEdit();
    }
  },

  onKeyDown(event) {
    // Global keyboard shortcuts when not editing
    if (this.currentEdit) return;

    if (event.key === 'Enter' || event.key === 'F2') {
      const cell = document.activeElement.closest('td');
      if (cell) {
        event.preventDefault();
        this.handleCellEdit({ target: cell });
      }
    }
  },

  async saveEdit() {
    if (!this.currentEdit) return false;

    const input = this.currentEdit.cell.querySelector('.tablix-edit-input');
    if (!input) return false;

    const newValue = input.value;
    const { cell, rowIndex, column, rowData, field } = this.currentEdit;

    // Validate input
    const validator = this.options.validators[field];
    if (validator && !validator(newValue, rowData)) {
      this.showValidationError(input, 'Invalid value');
      return false;
    }

    // Check for empty values
    if (!this.options.allowEmpty && (!newValue || newValue.trim() === '')) {
      this.showValidationError(input, 'Value cannot be empty');
      return false;
    }

    try {
      // Update data
      const oldValue = rowData[field];
      rowData[field] = newValue;

      // Record in history
      this.editHistory.push({
        timestamp: new Date(),
        rowIndex,
        field,
        oldValue,
        newValue,
        column
      });

      // Trigger before save event
      const saveEvent = {
        cell,
        rowIndex,
        column,
        field,
        oldValue,
        newValue,
        rowData,
        cancel: false
      };

      this.table.trigger('beforeSave', saveEvent);

      if (saveEvent.cancel) {
        // Revert change
        rowData[field] = oldValue;
        this.editHistory.pop();
        return false;
      }

      // Update the cell display
      this.updateCellDisplay(cell, newValue, column);

      // Clear edit state
      this.clearEditState();

      // Trigger save event
      this.table.trigger('editSave', {
        cell,
        rowIndex,
        column,
        field,
        oldValue,
        newValue,
        rowData
      });

      // Trigger data change event
      this.table.trigger('dataChange', {
        type: 'update',
        rowIndex,
        field,
        oldValue,
        newValue,
        rowData
      });

      return true;

    } catch (error) {
      console.error('TablixJS InlineEdit: Error saving edit:', error);
      this.showValidationError(input, 'Error saving value');
      return false;
    }
  },

  cancelEdit() {
    if (!this.currentEdit) return;

    const { cell, column } = this.currentEdit;

    // Restore original display
    this.updateCellDisplay(cell, this.originalValue, column);

    // Clear edit state
    this.clearEditState();

    // Trigger cancel event
    this.table.trigger('editCancel', {
      cell,
      value: this.originalValue
    });
  },

  updateCellDisplay(cell, value, column) {
    // Apply any column formatting
    let displayValue = value;
    
    if (column.formatter && typeof column.formatter === 'function') {
      displayValue = column.formatter(value);
    } else if (value === null || value === undefined) {
      displayValue = '';
    }

    cell.innerHTML = displayValue;
    cell.classList.remove(this.options.editingClass, this.options.errorClass);
  },

  showValidationError(input, message) {
    input.classList.add(this.options.errorClass);
    input.title = message;

    // Remove error class after a delay
    setTimeout(() => {
      input.classList.remove(this.options.errorClass);
      input.title = '';
    }, 3000);

    // Trigger validation error event
    this.table.trigger('editValidationError', {
      input,
      message,
      field: this.currentEdit.field,
      value: input.value
    });
  },

  clearEditState() {
    if (this.currentEdit && this.currentEdit.cell) {
      this.currentEdit.cell.classList.remove(this.options.editingClass);
    }
    
    this.currentEdit = null;
    this.originalValue = null;
  },

  removeEventListeners() {
    const table = this.table.container.querySelector('.tablix-table tbody');
    if (table) {
      table.removeEventListener('click', this.boundMethods.onCellClick);
      table.removeEventListener('dblclick', this.boundMethods.onCellDoubleClick);
    }
    
    document.removeEventListener('keydown', this.boundMethods.onKeyDown);
  },

  addStyles() {
    if (document.getElementById('tablix-inline-edit-styles')) return;

    const style = document.createElement('style');
    style.id = 'tablix-inline-edit-styles';
    style.textContent = `
      .tablix-editing {
        padding: 0 !important;
        background-color: rgba(0, 123, 255, 0.1);
      }
      
      .tablix-edit-input {
        width: 100%;
        border: 2px solid #007bff;
        padding: 4px 8px;
        font-family: inherit;
        font-size: inherit;
        background: white;
        outline: none;
        box-sizing: border-box;
      }
      
      .tablix-edit-input:focus {
        border-color: #0056b3;
        box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
      }
      
      .tablix-edit-error {
        border-color: #dc3545 !important;
        background-color: rgba(220, 53, 69, 0.1);
      }
      
      .tablix-edit-error:focus {
        border-color: #dc3545 !important;
        box-shadow: 0 0 0 2px rgba(220, 53, 69, 0.25) !important;
      }
      
      .tablix-table td[data-editable="true"] {
        cursor: pointer;
        position: relative;
      }
      
      .tablix-table td[data-editable="true"]:hover {
        background-color: rgba(0, 0, 0, 0.05);
      }
      
      .tablix-table td[data-editable="true"]:hover::after {
        content: '✎';
        position: absolute;
        top: 2px;
        right: 4px;
        font-size: 10px;
        color: #666;
        opacity: 0.7;
      }
      
      .tablix-editing::after {
        display: none !important;
      }
    `;
    
    document.head.appendChild(style);
  },

  removeStyles() {
    const style = document.getElementById('tablix-inline-edit-styles');
    if (style) {
      style.remove();
    }
  },

  // Public API methods added to table

  isEditing() {
    return this.currentEdit !== null;
  },

  setEditableColumns(columns) {
    this.options.editableColumns = Array.isArray(columns) ? columns : [columns];
    this.setupEditHandlers();
  },

  getEditHistory() {
    return [...this.editHistory];
  },

  clearEditHistory() {
    this.editHistory = [];
    this.table.trigger('editHistoryCleared');
  }
};
