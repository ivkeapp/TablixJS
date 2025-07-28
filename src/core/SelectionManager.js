export default class SelectionManager {
  constructor(table, options = {}) {
    this.table = table;
    this.options = {
      enabled: false,
      mode: 'single', // 'single' or 'multi'
      ...options
    };
    
    // Selection state - use stable data IDs/keys, not row indexes
    this.selectedRows = new Set(); // Set of row IDs/keys
    this.lastSelectedRow = null; // For range selection with shift+click
    
    // Track row ID mapping for stable selection across pagination/sorting/filtering
    this.rowIdMap = new Map(); // Maps data objects to their stable IDs
    this.dataIdKey = options.dataIdKey || 'id'; // Key to use as stable row ID
    
    this.init();
  }

  init() {
    if (!this.options.enabled) {
      return;
    }
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Listen for row clicks
    this.table.eventManager.on('rowClick', (event) => {
      this.handleRowClick(event);
    });
    
    // Clear selection when data changes
    this.table.eventManager.on('beforeLoad', () => {
      this.clearSelection();
    });
    
    // Update selection state after data operations
    this.table.eventManager.on('afterLoad', () => {
      this.updateSelectionAfterDataChange();
    });
    
    // Update selection UI after rendering
    this.table.eventManager.on('afterRender', () => {
      this.updateUI();
    });
  }

  /**
   * Handle row click events for selection
   * @param {Object} event - Row click event data
   */
  handleRowClick(event) {
    if (!this.options.enabled) {
      return;
    }

    const { rowData, rowIndex, originalEvent } = event;
    const rowId = this.getRowId(rowData);
    
    // Prevent default if we're handling selection
    if (originalEvent) {
      originalEvent.preventDefault();
    }

    // Fire beforeSelect event
    const beforeSelectEvent = {
      rowData,
      rowId,
      currentSelection: Array.from(this.selectedRows),
      isCtrlClick: originalEvent && (originalEvent.ctrlKey || originalEvent.metaKey),
      isShiftClick: originalEvent && originalEvent.shiftKey
    };
    
    this.table.eventManager.trigger('beforeSelect', beforeSelectEvent);

    if (this.options.mode === 'single') {
      this.handleSingleSelection(rowId, rowData);
    } else if (this.options.mode === 'multi') {
      this.handleMultiSelection(rowId, rowData, originalEvent);
    }

    this.updateUI();
    
    // Fire afterSelect event
    const afterSelectEvent = {
      rowData,
      rowId,
      selectedRows: Array.from(this.selectedRows),
      selectedData: this.getSelectedData()
    };
    
    this.table.eventManager.trigger('afterSelect', afterSelectEvent);
  }

  /**
   * Handle single row selection
   * @param {String} rowId - Stable row identifier
   * @param {Object} rowData - Row data object
   */
  handleSingleSelection(rowId, rowData) {
    // In single mode, if the row is already selected, deselect it
    if (this.selectedRows.has(rowId)) {
      this.selectedRows.clear();
      this.lastSelectedRow = null;
    } else {
      // Otherwise, select only the clicked row
      this.selectedRows.clear();
      this.selectedRows.add(rowId);
      this.lastSelectedRow = rowId;
    }
  }

  /**
   * Handle multi row selection with ctrl+click and shift+click
   * @param {String} rowId - Stable row identifier
   * @param {Object} rowData - Row data object
   * @param {Event} originalEvent - Original mouse event
   */
  handleMultiSelection(rowId, rowData, originalEvent) {
    const isCtrlClick = originalEvent && (originalEvent.ctrlKey || originalEvent.metaKey);
    const isShiftClick = originalEvent && originalEvent.shiftKey;

    if (isShiftClick && this.lastSelectedRow) {
      // Range selection: select all rows between last selected and current
      this.handleRangeSelection(rowId);
    } else if (isCtrlClick) {
      // Toggle selection of individual row
      if (this.selectedRows.has(rowId)) {
        this.selectedRows.delete(rowId);
      } else {
        this.selectedRows.add(rowId);
      }
      this.lastSelectedRow = rowId;
    } else {
      // Normal click: if row is already the only selected row, deselect it
      // Otherwise, select only this row
      if (this.selectedRows.size === 1 && this.selectedRows.has(rowId)) {
        this.selectedRows.clear();
        this.lastSelectedRow = null;
      } else {
        this.selectedRows.clear();
        this.selectedRows.add(rowId);
        this.lastSelectedRow = rowId;
      }
    }
  }

  /**
   * Handle range selection with shift+click
   * @param {String} endRowId - End row ID for range selection
   */
  handleRangeSelection(endRowId) {
    const currentData = this.getCurrentPageData();
    const startIndex = currentData.findIndex(row => this.getRowId(row) === this.lastSelectedRow);
    const endIndex = currentData.findIndex(row => this.getRowId(row) === endRowId);

    if (startIndex === -1 || endIndex === -1) {
      // Fallback to single selection if we can't find the range
      this.selectedRows.clear();
      this.selectedRows.add(endRowId);
      this.lastSelectedRow = endRowId;
      return;
    }

    // Select all rows in range
    const minIndex = Math.min(startIndex, endIndex);
    const maxIndex = Math.max(startIndex, endIndex);
    
    for (let i = minIndex; i <= maxIndex; i++) {
      const rowId = this.getRowId(currentData[i]);
      this.selectedRows.add(rowId);
    }
  }

  /**
   * Get stable row ID from row data
   * @param {Object} rowData - Row data object
   * @returns {String} Stable row identifier
   */
  getRowId(rowData) {
    if (typeof rowData[this.dataIdKey] !== 'undefined') {
      return String(rowData[this.dataIdKey]);
    }
    
    // Fallback: create a hash of the row data for identification
    return this.createRowHash(rowData);
  }

  /**
   * Create a simple hash from row data for identification
   * @param {Object} rowData - Row data object
   * @returns {String} Hash string
   */
  createRowHash(rowData) {
    const str = JSON.stringify(rowData);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return String(hash);
  }

  /**
   * Get current page data for range selection
   * @returns {Array} Current page data
   */
  getCurrentPageData() {
    if (this.table.paginationManager) {
      return this.table.paginationManager.getCurrentPageData() || [];
    }
    return this.table.dataManager.getData();
  }

  /**
   * Update UI to reflect current selection
   */
  updateUI() {
    if (!this.options.enabled) {
      return;
    }

    const tableElement = this.table.container.querySelector('.tablix-table');
    if (!tableElement) {
      return;
    }

    // Remove existing selection classes
    const allRows = tableElement.querySelectorAll('.tablix-row');
    allRows.forEach(row => {
      row.classList.remove('tablix-selected', 'tablix-last-selected');
    });

    // Apply selection classes
    const currentData = this.getCurrentPageData();
    allRows.forEach((row, index) => {
      if (index < currentData.length) {
        const rowData = currentData[index];
        const rowId = this.getRowId(rowData);
        
        if (this.selectedRows.has(rowId)) {
          row.classList.add('tablix-selected');
          
          // Mark the last selected row for special styling
          if (rowId === this.lastSelectedRow) {
            row.classList.add('tablix-last-selected');
          }
        }
      }
    });
  }

  /**
   * Update selection state after data changes (pagination, filtering, sorting)
   */
  updateSelectionAfterDataChange() {
    if (!this.options.enabled) {
      return;
    }

    // Keep selection for rows that are still visible
    const currentData = this.getCurrentPageData();
    const visibleRowIds = new Set(currentData.map(row => this.getRowId(row)));
    
    // Remove selections for rows that are no longer visible
    const newSelection = new Set();
    this.selectedRows.forEach(rowId => {
      if (visibleRowIds.has(rowId)) {
        newSelection.add(rowId);
      }
    });
    
    this.selectedRows = newSelection;
    
    // Update last selected row if it's no longer visible
    if (this.lastSelectedRow && !visibleRowIds.has(this.lastSelectedRow)) {
      this.lastSelectedRow = this.selectedRows.size > 0 ? Array.from(this.selectedRows)[0] : null;
    }
    
    this.updateUI();
  }

  /**
   * Get selected row data
   * @returns {Array} Array of selected row data objects
   */
  getSelectedData() {
    if (!this.options.enabled || this.selectedRows.size === 0) {
      return [];
    }

    // Get all data (including filtered/sorted) to find selected rows
    const allData = this.table.dataManager.getData();
    return allData.filter(row => this.selectedRows.has(this.getRowId(row)));
  }

  /**
   * Get selected row IDs
   * @returns {Array} Array of selected row IDs
   */
  getSelectedIds() {
    return Array.from(this.selectedRows);
  }

  /**
   * Programmatically select rows by ID
   * @param {String|Array} rowIds - Single row ID or array of row IDs
   */
  selectRows(rowIds) {
    if (!this.options.enabled) {
      return;
    }

    const ids = Array.isArray(rowIds) ? rowIds : [rowIds];
    
    if (this.options.mode === 'single' && ids.length > 1) {
      console.warn('SelectionManager: Cannot select multiple rows in single mode');
      return;
    }

    if (this.options.mode === 'single') {
      this.selectedRows.clear();
    }

    ids.forEach(id => {
      this.selectedRows.add(String(id));
    });

    if (ids.length > 0) {
      this.lastSelectedRow = String(ids[ids.length - 1]);
    }

    this.updateUI();
    
    // Fire afterSelect event
    this.table.eventManager.trigger('afterSelect', {
      selectedRows: Array.from(this.selectedRows),
      selectedData: this.getSelectedData()
    });
  }

  /**
   * Programmatically deselect rows by ID
   * @param {String|Array} rowIds - Single row ID or array of row IDs
   */
  deselectRows(rowIds) {
    if (!this.options.enabled) {
      return;
    }

    const ids = Array.isArray(rowIds) ? rowIds : [rowIds];
    
    ids.forEach(id => {
      this.selectedRows.delete(String(id));
    });

    // Update last selected row if it was deselected
    if (ids.includes(this.lastSelectedRow)) {
      this.lastSelectedRow = this.selectedRows.size > 0 ? Array.from(this.selectedRows)[0] : null;
    }

    this.updateUI();
    
    // Fire afterSelect event
    this.table.eventManager.trigger('afterSelect', {
      selectedRows: Array.from(this.selectedRows),
      selectedData: this.getSelectedData()
    });
  }

  /**
   * Clear all selections
   */
  clearSelection() {
    if (!this.options.enabled) {
      return;
    }

    const hadSelection = this.selectedRows.size > 0;
    this.selectedRows.clear();
    this.lastSelectedRow = null;
    
    this.updateUI();

    if (hadSelection) {
      // Fire afterSelect event
      this.table.eventManager.trigger('afterSelect', {
        selectedRows: [],
        selectedData: []
      });
    }
  }

  /**
   * Check if a row is selected
   * @param {String} rowId - Row ID to check
   * @returns {Boolean} True if row is selected
   */
  isRowSelected(rowId) {
    return this.selectedRows.has(String(rowId));
  }

  /**
   * Get selection count
   * @returns {Number} Number of selected rows
   */
  getSelectionCount() {
    return this.selectedRows.size;
  }

  /**
   * Enable selection
   */
  enable() {
    this.options.enabled = true;
    this.setupEventListeners();
  }

  /**
   * Disable selection
   */
  disable() {
    this.options.enabled = false;
    this.clearSelection();
  }

  /**
   * Set selection mode
   * @param {String} mode - 'single' or 'multi'
   */
  setMode(mode) {
    if (mode !== 'single' && mode !== 'multi') {
      console.warn('SelectionManager: Invalid mode. Use "single" or "multi"');
      return;
    }

    this.options.mode = mode;
    
    // If switching to single mode and multiple rows are selected, keep only the last selected
    if (mode === 'single' && this.selectedRows.size > 1) {
      const lastSelected = this.lastSelectedRow;
      this.selectedRows.clear();
      if (lastSelected) {
        this.selectedRows.add(lastSelected);
      }
      this.updateUI();
    }
  }

  /**
   * Destroy the selection manager
   */
  destroy() {
    this.clearSelection();
    // Remove event listeners would go here if we tracked them
  }
}
