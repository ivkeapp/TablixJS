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
    
    // Drag selection state
    this.dragSelection = {
      isActive: false,
      startRowIndex: null,
      currentRowIndex: null,
      startRowId: null,
      originalSelection: null, // Backup of selection before drag started
      isDragging: false,
      dragThreshold: 3 // Minimum pixels to move before considering it a drag
    };
    
    // Track event listeners for proper cleanup
    this.eventListeners = [];
    
    this.init();
  }

  init() {
    this.eventListenersSetup = false; // Track if event listeners are already set up
    
    if (this.options.enabled) {
      this.setupEventListeners();
    }
  }

  setupEventListeners() {
    // Prevent setting up listeners multiple times
    if (this.eventListenersSetup) {
      return;
    }
    
    this.eventListenersSetup = true;
    
    // Listen for row clicks
    this.table.eventManager.on('rowClick', (event) => {
      this.handleRowClick(event);
    });
    
    // Listen for drag selection events (only in multi mode and when NOT using virtual scrolling)
    if (this.options.mode === 'multi' && !this.table.virtualScrollManager) {
      this.setupDragSelection();
    }
    
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
    // Safety check - ensure table and managers are still available
    if (!this.table || !this.options.enabled) {
      return;
    }

    // If this was a drag operation, don't process as a click
    if (this.dragSelection.isDragging) {
      this.dragSelection.isDragging = false;
      return;
    }

    const { rowData, rowIndex, originalEvent } = event;
    const rowId = this.getRowId(rowData);
    
    // Debug logging for modifier keys
    console.log('SelectionManager handleRowClick:', {
      rowId,
      hasOriginalEvent: !!originalEvent,
      ctrlKey: originalEvent ? originalEvent.ctrlKey : 'no event',
      shiftKey: originalEvent ? originalEvent.shiftKey : 'no event',
      metaKey: originalEvent ? originalEvent.metaKey : 'no event',
      timestamp: Date.now()
    });
    
    // Prevent default and stop propagation to avoid duplicate events
    if (originalEvent) {
      originalEvent.preventDefault();
      originalEvent.stopPropagation();
    }

    // Fire beforeSelect event
    const beforeSelectEvent = {
      rowData,
      rowId,
      currentSelection: Array.from(this.selectedRows),
      isCtrlClick: originalEvent && (originalEvent.ctrlKey || originalEvent.metaKey),
      isShiftClick: originalEvent && originalEvent.shiftKey,
      isDragSelection: false
    };
    
    if (this.table && this.table.eventManager) {
      this.table.eventManager.trigger('beforeSelect', beforeSelectEvent);
    }

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
      selectedData: this.getSelectedData(),
      isDragSelection: false
    };
    
    if (this.table && this.table.eventManager) {
      this.table.eventManager.trigger('afterSelect', afterSelectEvent);
    }
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

    console.log('handleMultiSelection DETAILED:', {
      rowId,
      isCtrlClick,
      isShiftClick,
      'originalEvent.ctrlKey': originalEvent ? originalEvent.ctrlKey : 'no event',
      'originalEvent.metaKey': originalEvent ? originalEvent.metaKey : 'no event',
      'originalEvent.shiftKey': originalEvent ? originalEvent.shiftKey : 'no event',
      lastSelectedRow: this.lastSelectedRow,
      currentSelection: Array.from(this.selectedRows),
      selectionSize: this.selectedRows.size
    });

    if (isShiftClick && this.lastSelectedRow) {
      // Range selection: select all rows between last selected and current
      console.log('Executing range selection from', this.lastSelectedRow, 'to', rowId);
      this.handleRangeSelection(rowId);
    } else if (isCtrlClick) {
      // Toggle selection of individual row
      console.log('Executing ctrl+click toggle for', rowId);
      if (this.selectedRows.has(rowId)) {
        this.selectedRows.delete(rowId);
        console.log('Ctrl+click: Deselected', rowId);
        // Update lastSelectedRow to another selected row or null
        this.lastSelectedRow = this.selectedRows.size > 0 ? Array.from(this.selectedRows)[0] : null;
      } else {
        this.selectedRows.add(rowId);
        this.lastSelectedRow = rowId;
        console.log('Ctrl+click: Added', rowId, 'to selection. Total selected:', this.selectedRows.size);
      }
    } else {
      // Normal click: select only this row (clear previous selection)
      console.log('Executing normal click for', rowId);
      this.selectedRows.clear();
      this.selectedRows.add(rowId);
      this.lastSelectedRow = rowId;
      console.log('Normal click: Selected only', rowId);
    }
  }

  /**
   * Handle range selection with shift+click
   * @param {String} endRowId - End row ID for range selection
   */
  handleRangeSelection(endRowId) {
    const fullData = this.getFullData();
    
    // Find indices in the full dataset
    const startIndex = fullData.findIndex(row => this.getRowId(row) === this.lastSelectedRow);
    const endIndex = fullData.findIndex(row => this.getRowId(row) === endRowId);

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
      const rowId = this.getRowId(fullData[i]);
      this.selectedRows.add(rowId);
    }
  }

  // ===== DRAG SELECTION METHODS =====

  /**
   * Setup drag selection event listeners
   */
  setupDragSelection() {
    const tableElement = this.table.container;
    if (!tableElement) return;

    let startX, startY;

    // Mouse down on table body
    tableElement.addEventListener('mousedown', (e) => {
      if (!this.table || !this.options.enabled || this.options.mode !== 'multi') return;
      
      const row = e.target.closest('.tablix-row');
      if (!row || row.classList.contains('tablix-empty-row')) return;

      const globalRowIndex = parseInt(row.dataset.rowIndex, 10);
      if (isNaN(globalRowIndex)) return;

      // Only start drag selection if not using modifier keys
      if (e.ctrlKey || e.metaKey || e.shiftKey) return;

      startX = e.clientX;
      startY = e.clientY;

      this.dragSelection.isActive = true;
      this.dragSelection.startRowIndex = globalRowIndex; // Store global index
      this.dragSelection.currentRowIndex = globalRowIndex;
      this.dragSelection.isDragging = false;
      
      // Store original selection for potential restoration
      this.dragSelection.originalSelection = new Set(this.selectedRows);

      // Get start row data using global index
      const fullData = this.getFullData();
      if (globalRowIndex < fullData.length) {
        this.dragSelection.startRowId = this.getRowId(fullData[globalRowIndex]);
      }

      e.preventDefault();
    });

    // Mouse move - handle drag selection
    tableElement.addEventListener('mousemove', (e) => {
      if (!this.table || !this.dragSelection.isActive) return;

      const deltaX = Math.abs(e.clientX - startX);
      const deltaY = Math.abs(e.clientY - startY);

      // Check if we've moved enough to consider it a drag
      if (!this.dragSelection.isDragging && 
          (deltaX > this.dragSelection.dragThreshold || deltaY > this.dragSelection.dragThreshold)) {
        this.dragSelection.isDragging = true;
        this.startDragSelection();
      }

      if (this.dragSelection.isDragging) {
        this.updateDragSelection(e);
      }
    });

    // Mouse up - complete drag selection
    tableElement.addEventListener('mouseup', (e) => {
      if (!this.table || !this.dragSelection.isActive) return;
      this.completeDragSelection();
    });

    // Mouse leave - cancel drag selection
    tableElement.addEventListener('mouseleave', (e) => {
      if (!this.table || !this.dragSelection.isActive) return;
      this.cancelDragSelection();
    });

    // Prevent text selection during drag
    tableElement.addEventListener('selectstart', (e) => {
      if (this.dragSelection.isDragging) {
        e.preventDefault();
      }
    });
  }

  /**
   * Start drag selection
   */
  startDragSelection() {
    if (!this.table || !this.table.container) {
      console.warn('SelectionManager: Cannot start drag selection - table not available');
      return;
    }
    
    // Add drag selection class to table for styling
    const tableWrapper = this.table.container.querySelector('.tablix-wrapper');
    if (tableWrapper) {
      tableWrapper.classList.add('tablix-drag-selecting');
    }

    // Fire beforeSelect event for drag start
    const fullData = this.getFullData();
    if (this.dragSelection.startRowIndex < fullData.length) {
      const startRowData = fullData[this.dragSelection.startRowIndex];
      const beforeSelectEvent = {
        rowData: startRowData,
        rowId: this.dragSelection.startRowId,
        currentSelection: Array.from(this.selectedRows),
        isCtrlClick: false,
        isShiftClick: false,
        isDragSelection: true,
        dragStart: true
      };
      
      this.table.eventManager.trigger('beforeSelect', beforeSelectEvent);
    }
  }

  /**
   * Update drag selection based on current mouse position
   */
  updateDragSelection(event) {
    const row = event.target.closest('.tablix-row');
    if (!row || row.classList.contains('tablix-empty-row')) return;

    const globalRowIndex = parseInt(row.dataset.rowIndex, 10);
    if (isNaN(globalRowIndex)) return;

    if (globalRowIndex !== this.dragSelection.currentRowIndex) {
      this.dragSelection.currentRowIndex = globalRowIndex;
      this.applyDragSelection();
    }
  }

  /**
   * Apply current drag selection range
   */
  applyDragSelection() {
    // Always use full dataset for drag selection (global indices)
    const fullData = this.getFullData();
    
    // Calculate selection range using global indices
    const startIndex = this.dragSelection.startRowIndex;
    const endIndex = this.dragSelection.currentRowIndex;
    const minIndex = Math.min(startIndex, endIndex);
    const maxIndex = Math.max(startIndex, endIndex);

    // Start with original selection (preserve existing selections)
    this.selectedRows = new Set(this.dragSelection.originalSelection);

    // Add drag range to selection
    for (let i = minIndex; i <= maxIndex; i++) {
      if (i < fullData.length) {
        const rowId = this.getRowId(fullData[i]);
        this.selectedRows.add(rowId);
      }
    }

    // Update last selected row
    if (endIndex < fullData.length) {
      this.lastSelectedRow = this.getRowId(fullData[endIndex]);
    }

    // Update UI immediately for responsive feedback
    this.updateUI();
  }

  /**
   * Complete drag selection
   */
  completeDragSelection() {
    if (!this.table || !this.table.container) {
      console.warn('SelectionManager: Cannot complete drag selection - table not available');
      return;
    }
    
    const tableWrapper = this.table.container.querySelector('.tablix-wrapper');
    if (tableWrapper) {
      tableWrapper.classList.remove('tablix-drag-selecting');
    }

    if (this.dragSelection.isDragging) {
      // Fire final afterSelect event
      const afterSelectEvent = {
        selectedRows: Array.from(this.selectedRows),
        selectedData: this.getSelectedData(),
        isDragSelection: true,
        dragComplete: true
      };
      
      this.table.eventManager.trigger('afterSelect', afterSelectEvent);
    }

    this.resetDragSelection();
  }

  /**
   * Cancel drag selection and restore original state
   */
  cancelDragSelection() {
    if (!this.table || !this.table.container) {
      console.warn('SelectionManager: Cannot cancel drag selection - table not available');
      return;
    }
    
    const tableWrapper = this.table.container.querySelector('.tablix-wrapper');
    if (tableWrapper) {
      tableWrapper.classList.remove('tablix-drag-selecting');
    }

    // Restore original selection
    this.selectedRows = new Set(this.dragSelection.originalSelection);
    this.updateUI();

    this.resetDragSelection();
  }

  /**
   * Reset drag selection state
   */
  resetDragSelection() {
    this.dragSelection.isActive = false;
    this.dragSelection.startRowIndex = null;
    this.dragSelection.currentRowIndex = null;
    this.dragSelection.startRowId = null;
    this.dragSelection.originalSelection = null;
    this.dragSelection.isDragging = false;
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
    if (!this.table || !this.table.dataManager) {
      console.warn('SelectionManager: Table or dataManager is not available');
      return [];
    }
    
    // If using virtual scrolling, return full dataset
    if (this.table.virtualScrollManager) {
      return this.table.dataManager.getData();
    }
    // Otherwise use pagination if available
    if (this.table.paginationManager) {
      return this.table.paginationManager.getCurrentPageData() || [];
    }
    return this.table.dataManager.getData();
  }

  /**
   * Get the full dataset for virtual scrolling operations
   * @returns {Array} Full dataset
   */
  getFullData() {
    if (!this.table || !this.table.dataManager) {
      console.warn('SelectionManager: Table or dataManager is not available');
      return [];
    }
    return this.table.dataManager.getData();
  }

  /**
   * Update UI to reflect current selection
   */
  updateUI() {
    if (!this.options.enabled || !this.table || !this.table.container) {
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

    // Check if we're in virtual scroll mode by looking for data-virtual-index attributes
    const hasVirtualIndexes = allRows.length > 0 && allRows[0].hasAttribute('data-virtual-index');
    
    if (hasVirtualIndexes) {
      // Virtual scrolling mode: use data-virtual-index to match against full dataset
      const fullData = this.getFullData();
      allRows.forEach((row) => {
        const virtualIndex = parseInt(row.getAttribute('data-virtual-index'));
        if (!isNaN(virtualIndex) && virtualIndex < fullData.length) {
          const rowData = fullData[virtualIndex];
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
    } else {
      // Regular mode: match by global row index with full dataset
      const fullData = this.getFullData();
      allRows.forEach((row) => {
        // Get global row index from data attribute
        const globalRowIndex = row.hasAttribute('data-row-index') ? 
          parseInt(row.getAttribute('data-row-index')) : -1;
          
        if (globalRowIndex >= 0 && globalRowIndex < fullData.length) {
          const rowData = fullData[globalRowIndex];
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
  }

  /**
   * Update selection state after data changes (pagination, filtering, sorting)
   */
  updateSelectionAfterDataChange() {
    if (!this.options.enabled) {
      return;
    }

    if (this.table.virtualScrollManager) {
      // For virtual scrolling: keep all selections as the data is the same, just rendered differently
      // Only need to update UI
      this.updateUI();
    } else {
      // For pagination: keep all selections, but validate they still exist in the full dataset
      const fullData = this.getFullData();
      const allDataRowIds = new Set(fullData.map(row => this.getRowId(row)));
      
      // Remove selections for rows that no longer exist in the dataset at all
      const newSelection = new Set();
      this.selectedRows.forEach(rowId => {
        if (allDataRowIds.has(rowId)) {
          newSelection.add(rowId);
        }
      });
      
      this.selectedRows = newSelection;
      
      // Update last selected row if it no longer exists in the dataset
      if (this.lastSelectedRow && !allDataRowIds.has(this.lastSelectedRow)) {
        this.lastSelectedRow = this.selectedRows.size > 0 ? Array.from(this.selectedRows)[0] : null;
      }
      
      this.updateUI();
    }
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
    const allData = this.getFullData();
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
   * Check if a row is selected by its data object (for virtual scrolling)
   * @param {Object} rowData - Row data object to check
   * @returns {Boolean} True if row is selected
   */
  isRowSelectedByData(rowData) {
    const rowId = this.getRowId(rowData);
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
    if (!this.eventListenersSetup) {
      this.setupEventListeners();
    }
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

    const oldMode = this.options.mode;
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

    // Setup or remove drag selection based on mode change
    if (oldMode !== mode && this.options.enabled) {
      if (mode === 'multi') {
        this.setupDragSelection();
      }
      // Note: We don't need to explicitly remove drag listeners as they check mode internally
    }
  }

  /**
   * Destroy the selection manager
   */
  destroy() {
    this.clearSelection();
    
    // Clear references to prevent memory leaks and null reference errors
    this.table = null;
    this.selectedRows.clear();
    this.rowIdMap.clear();
    this.lastSelectedRow = null;
    
    // Reset drag selection state
    this.dragSelection.isActive = false;
    this.dragSelection.isDragging = false;
    this.dragSelection.startRowIndex = null;
    this.dragSelection.currentRowIndex = null;
    this.dragSelection.startRowId = null;
    this.dragSelection.originalSelection = null;
  }
}
