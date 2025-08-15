/**
 * DraggableColumns Plugin for TablixJS
 * 
 * Enables drag and drop functionality for table columns, allowing users to
 * reorder columns by dragging column headers.
 * 
 * Features:
 * - Drag column headers to reorder
 * - Visual feedback during drag operation
 * - Customizable drag handle and styling
 * - Event hooks for drag start/end
 * - Configurable axis constraint
 * 
 * Usage:
 * ```js
 * import DraggableColumns from './plugins/DraggableColumns.js';
 * 
 * table.use(DraggableColumns, {
 *   axis: 'x',           // Constraint axis ('x', 'y', or 'both')
 *   handle: '.drag-handle', // Custom drag handle selector
 *   ghost: true,         // Show ghost element during drag
 *   animate: true        // Animate column repositioning
 * });
 * ```
 */
export default {
  name: 'DraggableColumns',
  
  defaultOptions: {
    axis: 'x',              // Drag constraint axis
    handle: null,           // Custom drag handle selector (null = entire header)
    ghost: true,            // Show ghost element during drag
    animate: true,          // Animate column repositioning
    tolerance: 5,           // Minimum pixels to move before drag starts
    opacity: 0.5,           // Ghost element opacity
    zIndex: 1000,           // Ghost element z-index
    cursor: 'grabbing',     // Cursor during drag
    disabled: false         // Disable dragging
  },

  install(table, options) {
    this.table = table;
    this.options = { ...this.defaultOptions, ...options };
    this.isDragging = false;
    this.dragElement = null;
    this.ghostElement = null;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.dragStartIndex = -1;
    this.dropZones = [];

    // Store bound methods for cleanup
    this.boundMethods = {
      onMouseDown: this.onMouseDown.bind(this),
      onMouseMove: this.onMouseMove.bind(this),
      onMouseUp: this.onMouseUp.bind(this),
      onAfterRender: this.onAfterRender.bind(this)
    };

    // Listen to table render events to setup drag handlers
    this.table.on('afterRender', this.boundMethods.onAfterRender);

    // Add plugin methods to table
    this.table.setColumnOrder = this.setColumnOrder.bind(this);
    this.table.getColumnOrder = this.getColumnOrder.bind(this);
    this.table.enableColumnDragging = this.enableColumnDragging.bind(this);
    this.table.disableColumnDragging = this.disableColumnDragging.bind(this);

    // Add CSS styles
    this.addStyles();

    console.debug('TablixJS: DraggableColumns plugin installed');
  },

  uninstall(table) {
    // Remove event listeners
    table.off('afterRender', this.boundMethods.onAfterRender);
    this.removeEventListeners();

    // Remove added methods
    delete table.setColumnOrder;
    delete table.getColumnOrder;
    delete table.enableColumnDragging;
    delete table.disableColumnDragging;

    // Remove styles
    this.removeStyles();

    // Clean up state
    this.cleanup();

    console.debug('TablixJS: DraggableColumns plugin uninstalled');
  },

  onAfterRender(data) {
    if (!this.options.disabled) {
      this.setupDragHandlers();
    }
  },

  setupDragHandlers() {
    const table = this.table.container.querySelector('.tablix-table');
    if (!table) return;

    const headers = table.querySelectorAll('thead th');
    
    headers.forEach((header, index) => {
      // Skip if already has drag handler
      if (header.dataset.draggable === 'true') return;

      header.dataset.draggable = 'true';
      header.dataset.columnIndex = index;

      // Determine drag handle
      const handle = this.options.handle ? 
        header.querySelector(this.options.handle) : header;

      if (handle) {
        handle.style.cursor = 'grab';
        handle.addEventListener('mousedown', this.boundMethods.onMouseDown);
      }
    });
  },

  onMouseDown(event) {
    if (this.options.disabled || event.button !== 0) return;

    event.preventDefault();
    
    // Find the header element
    this.dragElement = event.target.closest('th');
    if (!this.dragElement) return;

    this.dragStartIndex = parseInt(this.dragElement.dataset.columnIndex);
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    
    // Add global mouse event listeners
    document.addEventListener('mousemove', this.boundMethods.onMouseMove);
    document.addEventListener('mouseup', this.boundMethods.onMouseUp);

    // Change cursor
    document.body.style.cursor = this.options.cursor;

    // Trigger drag start event
    this.table.trigger('columnDragStart', {
      column: this.dragStartIndex,
      element: this.dragElement,
      originalEvent: event
    });
  },

  onMouseMove(event) {
    if (!this.dragElement) return;

    const deltaX = event.clientX - this.dragStartX;
    const deltaY = event.clientY - this.dragStartY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Start dragging only after minimum distance
    if (!this.isDragging && distance > this.options.tolerance) {
      this.isDragging = true;
      this.startDrag(event);
    }

    if (this.isDragging) {
      this.updateDrag(event);
    }
  },

  onMouseUp(event) {
    if (this.isDragging) {
      this.endDrag(event);
    }

    this.cleanup();
  },

  startDrag(event) {
    // Create ghost element if enabled
    if (this.options.ghost) {
      this.createGhostElement();
    }

    // Add dragging class to original element
    this.dragElement.classList.add('tablix-dragging');

    // Build drop zones
    this.buildDropZones();

    // Trigger drag event
    this.table.trigger('columnDrag', {
      column: this.dragStartIndex,
      element: this.dragElement,
      originalEvent: event
    });
  },

  updateDrag(event) {
    // Update ghost element position
    if (this.ghostElement) {
      const rect = this.table.container.getBoundingClientRect();
      let x = event.clientX - rect.left;
      let y = event.clientY - rect.top;

      // Apply axis constraints
      if (this.options.axis === 'x') {
        y = this.dragElement.offsetTop;
      } else if (this.options.axis === 'y') {
        x = this.dragElement.offsetLeft;
      }

      this.ghostElement.style.transform = `translate(${x}px, ${y}px)`;
    }

    // Check drop zones
    this.checkDropZones(event);
  },

  endDrag(event) {
    const dropIndex = this.getDropIndex(event);
    
    // Perform column reorder if valid drop position
    if (dropIndex !== -1 && dropIndex !== this.dragStartIndex) {
      this.reorderColumn(this.dragStartIndex, dropIndex);
    }

    // Remove ghost element
    if (this.ghostElement) {
      this.ghostElement.remove();
      this.ghostElement = null;
    }

    // Remove dragging class
    this.dragElement.classList.remove('tablix-dragging');

    // Remove drop zone indicators
    this.removeDropZoneIndicators();

    // Trigger drag end event
    this.table.trigger('columnDragEnd', {
      column: this.dragStartIndex,
      dropIndex: dropIndex,
      element: this.dragElement,
      originalEvent: event
    });
  },

  createGhostElement() {
    this.ghostElement = this.dragElement.cloneNode(true);
    this.ghostElement.classList.add('tablix-column-ghost');
    this.ghostElement.style.position = 'absolute';
    this.ghostElement.style.opacity = this.options.opacity;
    this.ghostElement.style.zIndex = this.options.zIndex;
    this.ghostElement.style.pointerEvents = 'none';
    this.ghostElement.style.width = this.dragElement.offsetWidth + 'px';
    this.ghostElement.style.height = this.dragElement.offsetHeight + 'px';
    
    this.table.container.appendChild(this.ghostElement);
  },

  buildDropZones() {
    const table = this.table.container.querySelector('.tablix-table');
    const headers = table.querySelectorAll('thead th');
    
    this.dropZones = Array.from(headers).map((header, index) => ({
      index,
      element: header,
      rect: header.getBoundingClientRect()
    }));
  },

  checkDropZones(event) {
    this.removeDropZoneIndicators();

    const dropIndex = this.getDropIndex(event);
    if (dropIndex !== -1 && dropIndex !== this.dragStartIndex) {
      const zone = this.dropZones[dropIndex];
      if (zone) {
        zone.element.classList.add('tablix-drop-zone');
      }
    }
  },

  getDropIndex(event) {
    for (let i = 0; i < this.dropZones.length; i++) {
      const zone = this.dropZones[i];
      const rect = zone.rect;
      
      if (event.clientX >= rect.left && event.clientX <= rect.right &&
          event.clientY >= rect.top && event.clientY <= rect.bottom) {
        return i;
      }
    }
    return -1;
  },

  removeDropZoneIndicators() {
    this.dropZones.forEach(zone => {
      zone.element.classList.remove('tablix-drop-zone');
    });
  },

  reorderColumn(fromIndex, toIndex) {
    if (!this.table.columnManager) {
      console.warn('TablixJS: ColumnManager not available for reordering');
      return;
    }

    // Get current column configuration
    const columns = this.table.columnManager.getColumns();
    
    // Reorder columns array
    const columnToMove = columns.splice(fromIndex, 1)[0];
    columns.splice(toIndex, 0, columnToMove);

    // Update column manager
    this.table.columnManager.setColumns(columns);

    // Refresh table with animation if enabled
    if (this.options.animate) {
      this.animateColumnMove(fromIndex, toIndex);
    } else {
      this.table.refreshTable();
    }

    // Trigger reorder event
    this.table.trigger('columnReorder', {
      fromIndex,
      toIndex,
      columns
    });
  },

  animateColumnMove(fromIndex, toIndex) {
    // Simple animation - just refresh for now
    // In a full implementation, this would animate the column movement
    this.table.refreshTable();
  },

  removeEventListeners() {
    document.removeEventListener('mousemove', this.boundMethods.onMouseMove);
    document.removeEventListener('mouseup', this.boundMethods.onMouseUp);

    // Remove individual header listeners
    const headers = this.table.container.querySelectorAll('thead th[data-draggable="true"]');
    headers.forEach(header => {
      const handle = this.options.handle ? 
        header.querySelector(this.options.handle) : header;
      if (handle) {
        handle.removeEventListener('mousedown', this.boundMethods.onMouseDown);
      }
    });
  },

  cleanup() {
    document.removeEventListener('mousemove', this.boundMethods.onMouseMove);
    document.removeEventListener('mouseup', this.boundMethods.onMouseUp);
    document.body.style.cursor = '';

    this.isDragging = false;
    this.dragElement = null;
    this.dragStartIndex = -1;
    
    if (this.ghostElement) {
      this.ghostElement.remove();
      this.ghostElement = null;
    }

    this.removeDropZoneIndicators();
  },

  addStyles() {
    if (document.getElementById('tablix-draggable-columns-styles')) return;

    const style = document.createElement('style');
    style.id = 'tablix-draggable-columns-styles';
    style.textContent = `
      .tablix-dragging {
        opacity: 0.5;
        background-color: rgba(0, 123, 255, 0.1);
      }
      
      .tablix-column-ghost {
        background-color: rgba(0, 123, 255, 0.2);
        border: 2px dashed rgba(0, 123, 255, 0.5);
        transform-origin: top left;
      }
      
      .tablix-drop-zone {
        background-color: rgba(40, 167, 69, 0.2);
        position: relative;
      }
      
      .tablix-drop-zone::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 3px;
        background-color: #28a745;
        z-index: 10;
      }
      
      th[data-draggable="true"] {
        position: relative;
      }
      
      th[data-draggable="true"]:hover {
        background-color: rgba(0, 0, 0, 0.05);
      }
    `;
    
    document.head.appendChild(style);
  },

  removeStyles() {
    const style = document.getElementById('tablix-draggable-columns-styles');
    if (style) {
      style.remove();
    }
  },

  // Public API methods added to table

  setColumnOrder(columnOrder) {
    if (!Array.isArray(columnOrder)) {
      throw new Error('Column order must be an array');
    }

    const columns = this.table.columnManager.getColumns();
    const reorderedColumns = columnOrder.map(index => columns[index]).filter(Boolean);
    
    this.table.columnManager.setColumns(reorderedColumns);
    this.table.refreshTable();

    this.table.trigger('columnOrderChanged', {
      order: columnOrder,
      columns: reorderedColumns
    });
  },

  getColumnOrder() {
    return this.table.columnManager.getColumns().map((col, index) => index);
  },

  enableColumnDragging() {
    this.options.disabled = false;
    this.setupDragHandlers();
  },

  disableColumnDragging() {
    this.options.disabled = true;
    this.removeEventListeners();
    this.cleanup();
  }
};
