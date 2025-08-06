/**
 * VirtualScrollManager - High-performance virtual scrolling for large datasets
 * 
 * Features:
 * - Dynamic row height detection
 * - Configurable buffer zones
 * - Smooth scrolling with no visual gaps
 * - Selection state preservation
 * - Performance optimizations for 100k+ rows
 */
export default class VirtualScrollManager {
  constructor(table, options = {}) {
    this.table = table;
    this.options = {
      enabled: false,
      buffer: 10, // Number of rows to render above/below viewport
      rowHeight: null, // Auto-detected if null
      throttleDelay: 8, // Reduced from 16ms for better responsiveness (~120fps)
      ...options
    };

    // State tracking
    this.scrollContainer = null;
    this.tableBody = null;
    this.topSpacer = null;
    this.bottomSpacer = null;
    
    // Measurements
    this.rowHeight = this.options.rowHeight || 35; // Default fallback
    this.containerHeight = 0;
    this.totalRows = 0;
    this.visibleStart = 0;
    this.visibleEnd = 0;
    this.renderedStart = 0;
    this.renderedEnd = 0;
    
    // Performance tracking
    this.performanceData = {
      renderTimes: [],
      scrollUpdates: 0,
      lastMeasurement: 0
    };

    // Throttled scroll handler
    this.throttledScrollHandler = this.throttle(this.handleScroll.bind(this), this.options.throttleDelay);
    this.immediateScrollHandler = this.handleScroll.bind(this);
    
    // RAF-based update handler for smooth rendering
    this.updateScheduled = false;
    this.pendingUpdate = false;
    this.lastScrollTime = 0;
    this.scrollVelocity = 0;

    // Data reference
    this.data = [];
    this.renderedData = [];
  }

  /**
   * Initialize virtual scrolling
   */
  init(data = []) {
    if (!this.options.enabled) {
      return;
    }

    this.data = data;
    this.totalRows = data.length;
    
    this.setupScrollContainer();
    this.detectRowHeight();
    this.calculateViewport();
    this.scheduleUpdate();
    
    // Bind scroll events with both throttled and immediate handling
    this.scrollContainer.addEventListener('scroll', this.handleScrollImmediate.bind(this), { passive: true });
    this.scrollContainer.addEventListener('scroll', this.throttledScrollHandler, { passive: true });
    
    // Handle scrollbar dragging specifically
    this.scrollContainer.addEventListener('mousedown', this.handleScrollStart.bind(this));
    document.addEventListener('mouseup', this.handleScrollEnd.bind(this));
    
    // Handle window resize
    window.addEventListener('resize', this.throttle(this.handleResize.bind(this), 100));
    
    // Set up event delegation for row interactions
    this.setupEventDelegation();
    
    // Listen for selection changes
    this.setupSelectionListeners();
    
    this.log('Virtual scroll initialized', {
      totalRows: this.totalRows,
      rowHeight: this.rowHeight,
      buffer: this.options.buffer
    });
  }

  /**
   * Set up event delegation for dynamically rendered rows
   */
  setupEventDelegation() {
    if (!this.scrollContainer || !this.table.eventManager) return;

    // Delegate row click events
    this.rowClickHandler = (event) => {
      const row = event.target.closest('.tablix-row');
      if (!row) return;

      // Skip click handling if we just finished a drag
      if (this.justFinishedDrag) {
        console.log('Skipping click - just finished drag');
        return;
      }

      const virtualIndex = parseInt(row.getAttribute('data-virtual-index'));
      const rowData = this.data[virtualIndex];
      
      if (rowData) {
        console.log('VirtualScroll rowClickHandler triggered:', { 
          virtualIndex, 
          rowId: rowData.id,
          ctrlKey: event.ctrlKey,
          shiftKey: event.shiftKey,
          metaKey: event.metaKey,
          eventType: event.type,
          timestamp: Date.now()
        });
        
        // Trigger row click event for selection manager
        this.table.eventManager.trigger('rowClick', {
          rowData,
          rowIndex: virtualIndex, // Use virtual index as row index
          originalEvent: event,
          element: row
        });
        
        // Immediately update selection states after click
        setTimeout(() => this.updateSelectionStates(), 0);
      }
    };

    this.scrollContainer.addEventListener('click', this.rowClickHandler);

    // Set up drag selection for virtual scrolling (if selection is enabled and in multi mode)
    if (this.table.selectionManager && 
        this.table.selectionManager.options.enabled && 
        this.table.selectionManager.options.mode === 'multi') {
      this.setupVirtualDragSelection();
    }

    // Delegate row hover events
    this.rowHoverHandler = (event) => {
      const row = event.target.closest('.tablix-row');
      if (!row) return;

      const virtualIndex = parseInt(row.getAttribute('data-virtual-index'));
      const rowData = this.data[virtualIndex];
      
      if (rowData) {
        this.table.eventManager.trigger('rowHover', {
          rowData,
          rowIndex: virtualIndex,
          originalEvent: event,
          element: row
        });
      }
    };

    this.scrollContainer.addEventListener('mouseover', this.rowHoverHandler);
  }

  /**
   * Set up listeners for selection changes
   */
  setupSelectionListeners() {
    if (!this.table.eventManager) return;

    // Listen for selection changes to update row visual states
    this.table.eventManager.on('afterSelect', () => {
      this.updateSelectionStates();
    });

    this.table.eventManager.on('selectionCleared', () => {
      this.updateSelectionStates();
    });
  }

  /**
   * Setup the scroll container structure
   */
  setupScrollContainer() {
    const tableWrapper = this.table.container.querySelector('.tablix-wrapper');
    if (!tableWrapper) {
      throw new Error('Table wrapper not found for virtual scrolling');
    }

    // Find existing scroll container
    let scrollContainer = tableWrapper.querySelector('.tablix-scroll-container');
    if (!scrollContainer) {
      // Create scroll container - it should already exist from renderer
      scrollContainer = tableWrapper.querySelector('.tablix-scroll-container');
      if (!scrollContainer) {
        console.warn('Scroll container not found - virtual scrolling may not work properly');
        return;
      }
    }

    this.scrollContainer = scrollContainer;
    this.tableBody = scrollContainer.querySelector('.tablix-tbody');
    
    // Create spacer elements for maintaining scroll height
    this.createSpacers();
  }

  /**
   * Create top and bottom spacer elements
   */
  createSpacers() {
    if (!this.tableBody) return;

    // Remove existing spacers
    const existingTop = this.tableBody.querySelector('.tablix-top-spacer');
    const existingBottom = this.tableBody.querySelector('.tablix-bottom-spacer');
    if (existingTop) existingTop.remove();
    if (existingBottom) existingBottom.remove();

    // Create new spacers
    this.topSpacer = document.createElement('tr');
    this.topSpacer.className = 'tablix-top-spacer';
    this.topSpacer.style.cssText = 'height: 0px; border: none;';
    this.topSpacer.innerHTML = `<td colspan="100" style="padding: 0; border: none; height: 0;"></td>`;

    this.bottomSpacer = document.createElement('tr');
    this.bottomSpacer.className = 'tablix-bottom-spacer';
    this.bottomSpacer.style.cssText = 'height: 0px; border: none;';
    this.bottomSpacer.innerHTML = `<td colspan="100" style="padding: 0; border: none; height: 0;"></td>`;

    this.tableBody.insertBefore(this.topSpacer, this.tableBody.firstChild);
    this.tableBody.appendChild(this.bottomSpacer);
  }

  /**
   * Detect row height dynamically by measuring a sample row
   */
  detectRowHeight() {
    if (this.options.rowHeight) {
      this.rowHeight = this.options.rowHeight;
      return;
    }

    if (!this.tableBody || this.data.length === 0) {
      return;
    }

    // Render a single sample row to measure height
    const sampleRow = this.renderSingleRow(this.data[0], 0);
    this.tableBody.appendChild(sampleRow);
    
    // Measure the row height
    const rect = sampleRow.getBoundingClientRect();
    this.rowHeight = Math.max(rect.height, 25); // Minimum height of 25px
    
    // Remove sample row
    sampleRow.remove();
    
    this.log('Row height detected', { rowHeight: this.rowHeight });
  }

  /**
   * Calculate viewport dimensions and visible range
   */
  calculateViewport() {
    if (!this.scrollContainer) return;

    const rect = this.scrollContainer.getBoundingClientRect();
    this.containerHeight = rect.height;
    
    const scrollTop = this.scrollContainer.scrollTop;
    const visibleRowCount = Math.ceil(this.containerHeight / this.rowHeight);
    
    // Calculate visible range
    this.visibleStart = Math.floor(scrollTop / this.rowHeight);
    this.visibleEnd = Math.min(this.visibleStart + visibleRowCount, this.totalRows);
    
    // Calculate rendered range with buffer
    this.renderedStart = Math.max(0, this.visibleStart - this.options.buffer);
    this.renderedEnd = Math.min(this.totalRows, this.visibleEnd + this.options.buffer);
    
    // Update spacer heights
    this.updateSpacers();
  }

  /**
   * Update spacer heights to maintain scroll position
   */
  updateSpacers() {
    if (!this.topSpacer || !this.bottomSpacer) return;

    const topHeight = this.renderedStart * this.rowHeight;
    const bottomHeight = (this.totalRows - this.renderedEnd) * this.rowHeight;
    
    this.topSpacer.style.height = `${topHeight}px`;
    this.bottomSpacer.style.height = `${bottomHeight}px`;
  }

  /**
   * Handle immediate scroll events (for fast scrolling detection)
   */
  handleScrollImmediate() {
    const now = performance.now();
    const scrollTop = this.scrollContainer.scrollTop;
    
    // Calculate scroll velocity
    if (this.lastScrollTime && this.lastScrollTop !== undefined) {
      const timeDelta = now - this.lastScrollTime;
      const scrollDelta = Math.abs(scrollTop - this.lastScrollTop);
      this.scrollVelocity = timeDelta > 0 ? scrollDelta / timeDelta : 0;
    }
    
    this.lastScrollTime = now;
    this.lastScrollTop = scrollTop;
    
    // For very fast scrolling, schedule immediate update
    if (this.scrollVelocity > 2) { // High velocity threshold
      this.scheduleUpdate();
    }
  }

  /**
   * Handle scroll start (mousedown on scrollbar)
   */
  handleScrollStart(event) {
    // Only trigger scrollbar dragging for actual scrollbar clicks
    // Check if the click was on the scrollbar area, not on table content
    const target = event.target;
    if (target.closest('.tablix-row') || target.closest('.tablix-table')) {
      // This is a click on table content, not scrollbar - ignore
      return;
    }
    
    this.isScrollbarDragging = true;
    
    // Schedule more frequent updates during scrollbar dragging
    this.scrollDragInterval = setInterval(() => {
      if (this.isScrollbarDragging) {
        this.scheduleUpdate();
      }
    }, 8); // ~120fps during dragging
  }

  /**
   * Handle scroll end (mouseup)
   */
  handleScrollEnd() {
    this.isScrollbarDragging = false;
    if (this.scrollDragInterval) {
      clearInterval(this.scrollDragInterval);
      this.scrollDragInterval = null;
    }
    // Final update to ensure everything is rendered
    this.scheduleUpdate();
  }

  /**
   * Setup drag selection for virtual scrolling
   */
  setupVirtualDragSelection() {
    let isDragSelecting = false;
    let dragStartIndex = null;
    let dragStartX = null;
    let dragStartY = null;
    let originalSelection = null;
    const dragThreshold = 3;

    // Flag to prevent click handling immediately after drag
    this.justFinishedDrag = false;

    // Mouse down to potentially start drag selection
    this.scrollContainer.addEventListener('mousedown', (event) => {
      // Skip if clicked on scrollbar area or using modifier keys
      if (event.ctrlKey || event.metaKey || event.shiftKey) return;
      
      const row = event.target.closest('.tablix-row');
      if (!row || row.classList.contains('tablix-empty-row')) return;

      const virtualIndex = parseInt(row.getAttribute('data-virtual-index'));
      if (isNaN(virtualIndex)) return;

      dragStartIndex = virtualIndex;
      dragStartX = event.clientX;
      dragStartY = event.clientY;
      isDragSelecting = false;
      
      // Store original selection
      originalSelection = new Set(this.table.selectionManager.selectedRows);

      // Don't prevent default here - let the click event fire normally
      // event.preventDefault();
    });

    // Mouse move to handle drag selection
    this.scrollContainer.addEventListener('mousemove', (event) => {
      if (dragStartIndex === null) return;

      const deltaX = Math.abs(event.clientX - dragStartX);
      const deltaY = Math.abs(event.clientY - dragStartY);

      // Start dragging if moved enough
      if (!isDragSelecting && (deltaX > dragThreshold || deltaY > dragThreshold)) {
        isDragSelecting = true;
        this.scrollContainer.classList.add('tablix-drag-selecting');
      }

      if (isDragSelecting) {
        const row = event.target.closest('.tablix-row');
        if (row) {
          const currentIndex = parseInt(row.getAttribute('data-virtual-index'));
          if (!isNaN(currentIndex)) {
            this.applyVirtualDragSelection(dragStartIndex, currentIndex, originalSelection);
          }
        }
      }
    });

    // Mouse up to complete or cancel drag selection
    const handleMouseUp = (event) => {
      if (dragStartIndex !== null) {
        this.scrollContainer.classList.remove('tablix-drag-selecting');
        
        if (!isDragSelecting) {
          // This was just a click, not a drag - don't interfere with click handling
          // Reset drag state and let the normal click handler process this
          dragStartIndex = null;
          isDragSelecting = false;
          originalSelection = null;
          return;
        }

        // This was actually a drag selection - complete it
        this.table.eventManager.trigger('afterSelect', {
          selectedRows: Array.from(this.table.selectionManager.selectedRows),
          selectedData: this.table.selectionManager.getSelectedData(),
          isDragSelection: true,
          dragComplete: true
        });

        // Set flag to prevent immediate click handling
        this.justFinishedDrag = true;
        setTimeout(() => {
          this.justFinishedDrag = false;
        }, 50);

        // Reset drag state
        dragStartIndex = null;
        isDragSelecting = false;
        originalSelection = null;
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    this.scrollContainer.addEventListener('mouseleave', handleMouseUp);

    // Prevent text selection during drag
    this.scrollContainer.addEventListener('selectstart', (event) => {
      if (isDragSelecting) {
        event.preventDefault();
      }
    });
  }

  /**
   * Apply drag selection in virtual scrolling
   */
  applyVirtualDragSelection(startIndex, endIndex, originalSelection) {
    const minIndex = Math.min(startIndex, endIndex);
    const maxIndex = Math.max(startIndex, endIndex);

    // Start with original selection
    this.table.selectionManager.selectedRows = new Set(originalSelection);

    // Add drag range to selection
    for (let i = minIndex; i <= maxIndex; i++) {
      if (i < this.data.length) {
        const rowData = this.data[i];
        const rowId = this.table.selectionManager.getRowId(rowData);
        this.table.selectionManager.selectedRows.add(rowId);
      }
    }

    // Update last selected row
    if (endIndex < this.data.length) {
      const endRowData = this.data[endIndex];
      this.table.selectionManager.lastSelectedRow = this.table.selectionManager.getRowId(endRowData);
    }

    // Update UI immediately
    this.table.selectionManager.updateUI();
  }

  /**
   * Handle scroll events
   */
  handleScroll() {
    if (!this.options.enabled || this.updateScheduled) return;

    this.scheduleUpdate();
  }

  /**
   * Handle window resize
   */
  handleResize() {
    if (!this.options.enabled) return;

    this.calculateViewport();
    this.scheduleUpdate();
  }

  /**
   * Schedule an update using requestAnimationFrame
   */
  scheduleUpdate() {
    if (this.updateScheduled) return;

    this.updateScheduled = true;
    requestAnimationFrame(() => {
      this.update();
      this.updateScheduled = false;
    });
  }

  /**
   * Main update method - calculates viewport and renders visible rows
   */
  update() {
    const startTime = performance.now();
    
    this.calculateViewport();
    this.renderVisibleRows();
    
    const endTime = performance.now();
    this.trackPerformance(endTime - startTime);
    
    this.performanceData.scrollUpdates++;
  }

  /**
   * Render only the visible rows plus buffer
   */
  renderVisibleRows() {
    if (!this.tableBody) return;

    // Clear existing rows (except spacers)
    const existingRows = this.tableBody.querySelectorAll('.tablix-row');
    existingRows.forEach(row => row.remove());

    // Render new rows
    const fragment = document.createDocumentFragment();
    
    for (let i = this.renderedStart; i < this.renderedEnd; i++) {
      if (i < this.data.length) {
        const row = this.renderSingleRow(this.data[i], i);
        fragment.appendChild(row);
      }
    }

    // Insert rows between spacers
    this.tableBody.insertBefore(fragment, this.bottomSpacer);

    // Store currently rendered data slice for other managers
    this.renderedData = this.data.slice(this.renderedStart, this.renderedEnd);
    
    // Handle image loading for the newly rendered rows
    this.handleImageLoading();
    
    // Update selection states for the newly rendered rows
    this.updateSelectionStates();
  }

  /**
   * Update selection states for currently rendered rows
   */
  updateSelectionStates() {
    if (!this.table.selectionManager || !this.tableBody) return;

    const rows = this.tableBody.querySelectorAll('.tablix-row');
    rows.forEach(row => {
      const virtualIndex = parseInt(row.getAttribute('data-virtual-index'));
      const rowData = this.data[virtualIndex];
      
      if (rowData && this.table.selectionManager.isRowSelectedByData(rowData)) {
        row.classList.add('tablix-selected');
      } else {
        row.classList.remove('tablix-selected');
      }
    });
  }

  /**
   * Handle image loading optimization
   */
  handleImageLoading() {
    if (!this.tableBody) return;

    // Find all images in the rendered rows
    const images = this.tableBody.querySelectorAll('.tablix-row img');
    
    images.forEach((img, index) => {
      // Skip if image is already loaded or loading
      if (img.complete || img.classList.contains('loading')) return;
      
      img.classList.add('loading');
      
      // Create a placeholder while loading
      const placeholder = img.cloneNode();
      placeholder.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiBmaWxsPSIjZjBmMGYwIi8+CjxwYXRoIGQ9Ik0xNiA4TDIwIDEySDEyTDE2IDhaIiBmaWxsPSIjY2NjY2NjIi8+CjxwYXRoIGQ9Ik04IDIwSDI0VjE2SDhWMjBaIiBmaWxsPSIjY2NjY2NjIi8+Cjwvc3ZnPgo=';
      placeholder.classList.add('image-placeholder');
      
      // Handle successful load
      const handleLoad = () => {
        img.classList.remove('loading');
        img.style.opacity = '1';
        img.removeEventListener('load', handleLoad);
        img.removeEventListener('error', handleError);
      };
      
      // Handle load error
      const handleError = () => {
        img.classList.remove('loading');
        img.src = placeholder.src; // Use placeholder as fallback
        img.removeEventListener('load', handleLoad);
        img.removeEventListener('error', handleError);
      };
      
      img.addEventListener('load', handleLoad);
      img.addEventListener('error', handleError);
      
      // Set initial opacity for fade-in effect
      img.style.opacity = '0.5';
      img.style.transition = 'opacity 0.2s ease';
    });
  }

  /**
   * Render a single row element
   */
  renderSingleRow(rowData, originalIndex) {
    const columns = this.table.columnManager ? 
      this.table.columnManager.getColumns() : 
      (this.table.options.columns || []);

    const tr = document.createElement('tr');
    tr.className = 'tablix-row';
    tr.setAttribute('data-row-index', originalIndex); // Keep for compatibility
    tr.setAttribute('data-virtual-index', originalIndex); // Virtual scroll index
    
    // Add a unique identifier for debugging
    tr.setAttribute('data-row-id', this.table.selectionManager ? 
      this.table.selectionManager.getRowId(rowData) : originalIndex);

    // Apply initial selection state
    const isSelected = this.table.selectionManager && 
      this.table.selectionManager.isRowSelectedByData(rowData);
    
    if (isSelected) {
      tr.classList.add('tablix-selected');
      console.log('Row initially selected:', originalIndex, rowData.id);
    }

    // Render cells
    columns.forEach(col => {
      const td = document.createElement('td');
      td.className = 'tablix-td';
      
      const cellValue = rowData[col.name];

      // Use ColumnManager for formatting if available
      if (this.table.columnManager) {
        const result = this.table.columnManager.formatCellValue(col.name, cellValue, rowData);
        if (result.isHtml) {
          td.innerHTML = result.value;
        } else {
          td.textContent = result.value;
        }
      } else {
        // Fallback to original renderer logic
        if (col.renderer && typeof col.renderer === 'function') {
          const rendered = col.renderer(cellValue, rowData);
          if (typeof rendered === 'string' && rendered.includes('<')) {
            td.innerHTML = rendered;
          } else {
            td.textContent = rendered;
          }
        } else {
          td.textContent = cellValue != null ? String(cellValue) : '';
        }
      }

      tr.appendChild(td);
    });

    return tr;
  }

  /**
   * Update data and refresh virtual scrolling
   */
  updateData(newData) {
    this.data = newData;
    this.totalRows = newData.length;
    
    if (this.options.enabled) {
      this.calculateViewport();
      this.scheduleUpdate();
    }
  }

  /**
   * Scroll to a specific row index
   */
  scrollToRow(index) {
    if (!this.scrollContainer || !this.options.enabled) return;

    const targetScrollTop = index * this.rowHeight;
    this.scrollContainer.scrollTop = targetScrollTop;
    
    // Force immediate update
    this.update();
  }

  /**
   * Get the currently visible row indices
   */
  getVisibleRange() {
    return {
      start: this.visibleStart,
      end: this.visibleEnd,
      renderedStart: this.renderedStart,
      renderedEnd: this.renderedEnd
    };
  }

  /**
   * Get the currently rendered data slice
   */
  getRenderedData() {
    return this.renderedData;
  }

  /**
   * Check if virtual scrolling is active
   */
  isEnabled() {
    return this.options.enabled;
  }

  /**
   * Enable/disable virtual scrolling
   */
  setEnabled(enabled) {
    this.options.enabled = enabled;
    
    if (enabled && this.data.length > 0) {
      this.init(this.data);
    }
  }

  /**
   * Track performance metrics
   */
  trackPerformance(renderTime) {
    this.performanceData.renderTimes.push(renderTime);
    this.performanceData.lastMeasurement = renderTime;

    // Keep only last 100 measurements
    if (this.performanceData.renderTimes.length > 100) {
      this.performanceData.renderTimes.shift();
    }
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats() {
    const times = this.performanceData.renderTimes;
    if (times.length === 0) return null;

    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const max = Math.max(...times);
    const min = Math.min(...times);

    return {
      averageRenderTime: avg.toFixed(2),
      maxRenderTime: max.toFixed(2),
      minRenderTime: min.toFixed(2),
      scrollUpdates: this.performanceData.scrollUpdates,
      totalRows: this.totalRows,
      visibleRows: this.visibleEnd - this.visibleStart,
      renderedRows: this.renderedEnd - this.renderedStart
    };
  }

  /**
   * Utility: Throttle function
   */
  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Utility: Logging for performance tracking
   */
  log(message, data = {}) {
    if (this.table.options.debug) {
      console.log(`[VirtualScroll] ${message}`, data);
    }
  }

  /**
   * Clean up event listeners and resources
   */
  destroy() {
    if (this.scrollContainer) {
      this.scrollContainer.removeEventListener('scroll', this.throttledScrollHandler);
      this.scrollContainer.removeEventListener('scroll', this.handleScrollImmediate);
      this.scrollContainer.removeEventListener('mousedown', this.handleScrollStart);
    }
    document.removeEventListener('mouseup', this.handleScrollEnd);
    window.removeEventListener('resize', this.handleResize);
    
    // Clean up scroll drag interval
    if (this.scrollDragInterval) {
      clearInterval(this.scrollDragInterval);
      this.scrollDragInterval = null;
    }
    
    this.scrollContainer = null;
    this.tableBody = null;
    this.topSpacer = null;
    this.bottomSpacer = null;
  }
}
