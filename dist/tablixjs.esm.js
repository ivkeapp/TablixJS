/**
 * TablixJS v1.0.5
 * TablixJS is a lightweight, dependency-free JavaScript library for building powerful, responsive data tables.
 * (c) 2026 Ivan Zarkovic
 * Released under the MIT License.
 */
class DataManager {
  constructor(table, data = []) {
    this.table = table;
    this.originalData = data; // full data set
    this.filteredData = [...data]; // filtered data
    this.currentFilters = {}; // current filter criteria
    this.currentSorts = []; // current sort criteria (deprecated - use SortingManager)
    this.serverTotalRows = null; // for server-side pagination
  }
  getData() {
    return this.filteredData;
  }
  setData(data) {
    this.originalData = data;
    this.filteredData = [...data];

    // Update pagination info after data change
    if (this.table.paginationManager) {
      this.table.paginationManager.updatePaginationInfo();
    }
  }

  /**
   * Set data from server (for server-side operations)
   */
  setServerData(data, totalRows = null) {
    this.originalData = data;
    this.filteredData = [...data];
    this.serverTotalRows = totalRows;

    // Update pagination info after data change
    if (this.table.paginationManager) {
      this.table.paginationManager.updatePaginationInfo(totalRows);
    }
  }

  /**
   * Get total rows (for server-side pagination)
   */
  getTotalRows() {
    return this.serverTotalRows !== null ? this.serverTotalRows : this.originalData.length;
  }
  applyFilter(criteria) {
    this.currentFilters = criteria;
    if (Object.keys(criteria).length === 0) {
      // No filters, show all data
      this.filteredData = [...this.originalData];
    } else {
      // Simple filtering: supports multiple criteria (legacy format)
      this.filteredData = this.originalData.filter(item => {
        return Object.entries(criteria).every(([key, value]) => {
          const itemValue = (item[key] + '').toLowerCase();
          const searchValue = (value + '').toLowerCase();
          return itemValue.includes(searchValue);
        });
      });
    }

    // Reset pagination to first page after filtering
    if (this.table.paginationManager) {
      this.table.paginationManager.resetToFirstPage();
    }
  }

  /**
   * Apply filtering from FilterManager (this will be called by FilterManager)
   * @param {Array} filteredData - Pre-filtered data from FilterManager
   */
  setFilteredData(filteredData) {
    this.filteredData = filteredData;

    // Reset pagination to first page after filtering
    if (this.table.paginationManager) {
      this.table.paginationManager.resetToFirstPage();
    }
  }
  applySorting(sorts) {
    this.currentSorts = sorts;
    if (!sorts || sorts.length === 0) {
      return;
    }

    // Use SortingManager if available, otherwise fall back to basic sorting
    if (this.table.sortingManager && this.table.sortingManager.currentSorts.length > 0) {
      this.table.sortingManager._applySorting();
    } else {
      // Legacy sorting implementation
      this.filteredData.sort((a, b) => {
        for (const sort of sorts) {
          const {
            column,
            direction
          } = sort;
          const aVal = a[column];
          const bVal = b[column];
          let comparison = 0;
          if (aVal < bVal) comparison = -1;else if (aVal > bVal) comparison = 1;
          if (comparison !== 0) {
            return direction === 'desc' ? -comparison : comparison;
          }
        }
        return 0;
      });
    }

    // Reset pagination to first page after sorting
    if (this.table.paginationManager) {
      this.table.paginationManager.resetToFirstPage();
    }
  }
  clearFilters() {
    this.currentFilters = {};
    this.filteredData = [...this.originalData];

    // Reset pagination to first page
    if (this.table.paginationManager) {
      this.table.paginationManager.resetToFirstPage();
    }
  }
  clearSorting() {
    this.currentSorts = [];
    // Don't change the filtered data order, just clear the sort state

    if (this.table.paginationManager) {
      this.table.paginationManager.resetToFirstPage();
    }
  }

  // Legacy method for backward compatibility
  getPageData(page = 1) {
    const pageSize = this.table.paginationManager ? this.table.paginationManager.pageSize : 10;
    const start = (page - 1) * pageSize;
    return this.filteredData.slice(start, start + pageSize);
  }
}

class Renderer {
  constructor(table) {
    this.table = table;
  }
  renderTable(data, virtualMode = false) {
    const columns = this.table.columnManager ? this.table.columnManager.getColumns() : this.table.options.columns || [];
    const controlsOptions = this.table.options.controls;
    const isVirtualScrollEnabled = this.table.virtualScrollManager && this.table.virtualScrollManager.isEnabled();

    // Preserve search input value and focus state before re-rendering
    let preservedSearchValue = '';
    let searchInputHadFocus = false;
    let cursorPosition = 0;
    const existingSearchInput = this.table.container.querySelector('.tablix-search-input');
    if (existingSearchInput) {
      preservedSearchValue = existingSearchInput.value;
      searchInputHadFocus = document.activeElement === existingSearchInput;
      cursorPosition = existingSearchInput.selectionStart || 0;
    }

    // Determine selection attributes
    const selectionEnabled = this.table.selectionManager && this.table.selectionManager.options.enabled;
    const selectionAttributes = selectionEnabled ? `data-selection-enabled data-selection-mode="${this.table.selectionManager.options.mode}"` : 'data-selection-disabled';
    let html = `<div class="tablix-wrapper" ${selectionAttributes}>`;

    // Top controls
    if (controlsOptions.enabled && (controlsOptions.position === 'top' || controlsOptions.position === 'both')) {
      html += this.renderControls('top');
    }

    // Virtual scroll container (if enabled)
    if (isVirtualScrollEnabled) {
      const containerHeight = this.table.options.virtualScroll.containerHeight || 400;
      html += `<div class="tablix-scroll-container" style="height: ${containerHeight}px; overflow: auto; position: relative; border: 1px solid #ddd;">`;
    }

    // Table wrapper for horizontal scrolling (mobile support)
    html += '<div class="tablix-table-wrapper" style="overflow-x: auto;">';

    // Table
    html += '<table class="tablix-table" style="width:100%; border-collapse:collapse;">';

    // Header
    html += '<thead class="tablix-thead"><tr class="tablix-header-row">';
    columns.forEach(col => {
      const isSortable = this._isColumnSortable(col);
      const sortDirection = this._getSortDirection(col.name);
      const sortClass = isSortable ? ' tablix-sortable' : '';
      const sortDirectionClass = sortDirection ? ` tablix-sorted tablix-sorted-${sortDirection}` : '';
      html += `<th class="tablix-th${sortClass}${sortDirectionClass}" data-column="${col.name}">`;
      html += `<div class="tablix-th-content">`;
      html += `<span class="tablix-th-text">${col.title || col.name}</span>`;
      if (isSortable) {
        html += `<span class="tablix-sort-indicator">`;
        if (sortDirection === 'asc') {
          html += `<span class="tablix-sort-arrow tablix-sort-asc" aria-label="${this.table.t('sort.sortedAscending')}">↑</span>`;
        } else if (sortDirection === 'desc') {
          html += `<span class="tablix-sort-arrow tablix-sort-desc" aria-label="${this.table.t('sort.sortedDescending')}">↓</span>`;
        } else {
          html += `<span class="tablix-sort-arrow tablix-sort-none" aria-label="${this.table.t('sort.notSorted')}">↕</span>`;
        }
        html += `</span>`;
      }
      html += `</div>`;
      html += `</th>`;
    });
    html += '</tr></thead>';

    // Body
    html += '<tbody class="tablix-tbody">';

    // For virtual scrolling, only render empty structure or limited rows
    if (isVirtualScrollEnabled && virtualMode) {
      // Empty body for virtual scrolling - rows will be added by VirtualScrollManager
      html += `<tr class="tablix-placeholder-row" style="display: none;"><td colspan="${columns.length}"></td></tr>`;
    } else if (data.length === 0) {
      html += `<tr class="tablix-empty-row"><td colspan="${columns.length}" class="tablix-empty-cell">${this.table.t('general.noData')}</td></tr>`;
    } else {
      data.forEach((row, index) => {
        // Calculate global row index for pagination
        let globalIndex = index;
        if (this.table.paginationManager && this.table.paginationManager.options.mode === 'client') {
          const currentPage = this.table.paginationManager.currentPage;
          const pageSize = this.table.paginationManager.pageSize;
          globalIndex = (currentPage - 1) * pageSize + index;
        }
        html += `<tr class="tablix-row" data-row-index="${globalIndex}">`;
        columns.forEach(col => {
          const cell = row[col.name];
          let renderedCell;

          // Use ColumnManager for formatting if available
          if (this.table.columnManager) {
            // Pass the column object instead of just the name to support multiple columns with same field
            const result = this.table.columnManager.formatCellValue(col, cell, row);
            if (result.isHtml) {
              // Custom renderer returned HTML - use as is
              renderedCell = result.value;
            } else {
              // Formatted or raw value - escape for safety
              renderedCell = this.escapeHtml(result.value);
            }
          } else {
            // Fallback to original renderer logic
            renderedCell = col.renderer ? col.renderer(cell, row) : this.escapeHtml(cell);
          }
          html += `<td class="tablix-td">${renderedCell}</td>`;
        });
        html += '</tr>';
      });
    }
    html += '</tbody>';
    html += '</table>';
    html += '</div>'; // Close tablix-table-wrapper

    // Close virtual scroll container if enabled
    if (isVirtualScrollEnabled) {
      html += '</div>'; // Close tablix-scroll-container
    }

    // Pagination will be rendered separately
    html += '<div class="tablix-pagination-container"></div>';

    // Bottom controls
    if (controlsOptions.enabled && (controlsOptions.position === 'bottom' || controlsOptions.position === 'both')) {
      html += this.renderControls('bottom');
    }
    html += '</div>';

    // Update DOM
    this.table.container.innerHTML = html;

    // Restore search input value immediately after DOM update
    if (preservedSearchValue) {
      const newSearchInput = this.table.container.querySelector('.tablix-search-input');
      if (newSearchInput) {
        newSearchInput.value = preservedSearchValue;
      }
    }

    // Render pagination controls if pagination is enabled
    this.renderPagination();

    // Bind control events
    if (controlsOptions.enabled) {
      this.bindControlEvents();
    }

    // Bind search events if search is enabled
    if (this.table.searchManager) {
      this.table.searchManager.bindEvents();
    }

    // Bind sort events if sorting is enabled
    if (this.table.sortingManager) {
      this.bindSortEvents();
    }

    // Bind row click events if selection is enabled
    if (this.table.selectionManager && this.table.selectionManager.options.enabled) {
      this.bindRowClickEvents();
    }

    // Render filter icons and bind events if filtering is enabled
    if (this.table.filterUI) {
      this.table.filterUI.renderFilterIcons();
    }

    // Restore focus AFTER all event binding is complete
    if (searchInputHadFocus) {
      const newSearchInput = this.table.container.querySelector('.tablix-search-input');
      if (newSearchInput) {
        // Use requestAnimationFrame to ensure focus happens after all DOM operations
        requestAnimationFrame(() => {
          newSearchInput.focus();
          // Restore cursor position
          if (cursorPosition > 0) {
            newSearchInput.setSelectionRange(cursorPosition, cursorPosition);
          }
        });
      }
    }

    // Trigger afterRender event
    this.table.eventManager.trigger('afterRender');
  }
  renderPagination() {
    const paginationContainer = this.table.container.querySelector('.tablix-pagination-container');
    if (!paginationContainer || !this.table.paginationManager) {
      return;
    }
    const paginationManager = this.table.paginationManager;
    const info = paginationManager.getInfo();
    if (!paginationManager.options.enabled && paginationManager.options.enabled !== undefined) {
      paginationContainer.innerHTML = '';
      return;
    }

    // Don't show pagination if there's only one page and no custom page sizes
    if (info.totalPages <= 1 && !paginationManager.options.showPageSizes) {
      paginationContainer.innerHTML = '';
      return;
    }
    let html = '<div class="tablix-pagination">';

    // Page info
    html += `<div class="tablix-pagination-info">`;
    if (info.totalRows === 0) {
      html += this.table.t('pagination.noRecords');
    } else {
      html += this.table.t('pagination.showingRecords', {
        startRow: info.startRow,
        endRow: info.endRow,
        totalRows: info.totalRows
      });
    }
    html += '</div>';

    // Page size selector
    if (paginationManager.options.showPageSizes && paginationManager.options.pageSizeOptions.length > 1) {
      html += '<div class="tablix-pagination-page-size">';
      html += this.table.t('general.show') + ' ';
      html += '<select class="tablix-page-size-select">';
      paginationManager.options.pageSizeOptions.forEach(size => {
        const selected = size === info.pageSize ? ' selected' : '';
        html += `<option value="${size}"${selected}>${size}</option>`;
      });
      html += '</select>';
      html += ' ' + this.table.t('general.records') + ' ' + this.table.t('general.perPage');
      html += '</div>';
    }

    // Navigation controls
    if (info.totalPages > 1) {
      html += '<div class="tablix-pagination-nav">';

      // First page
      if (paginationManager.options.showFirstLast) {
        const disabled = info.currentPage === 1 ? ' disabled' : '';
        html += `<button class="tablix-pagination-btn tablix-pagination-first" data-page="1"${disabled}>${this.table.t('pagination.first')}</button>`;
      }

      // Previous page
      if (paginationManager.options.showPrevNext) {
        const disabled = !info.hasPrevPage ? ' disabled' : '';
        html += `<button class="tablix-pagination-btn tablix-pagination-prev" data-page="${info.currentPage - 1}"${disabled}>${this.table.t('pagination.previous')}</button>`;
      }

      // Page numbers
      if (paginationManager.options.showPageNumbers) {
        const pageNumbers = paginationManager.getPageNumbers();
        pageNumbers.forEach(page => {
          if (page === '...') {
            html += '<span class="tablix-pagination-ellipsis">...</span>';
          } else {
            const active = page === info.currentPage ? ' active' : '';
            html += `<button class="tablix-pagination-btn tablix-pagination-page${active}" data-page="${page}">${page}</button>`;
          }
        });
      }

      // Next page
      if (paginationManager.options.showPrevNext) {
        const disabled = !info.hasNextPage ? ' disabled' : '';
        html += `<button class="tablix-pagination-btn tablix-pagination-next" data-page="${info.currentPage + 1}"${disabled}>${this.table.t('pagination.next')}</button>`;
      }

      // Last page
      if (paginationManager.options.showFirstLast) {
        const disabled = info.currentPage === info.totalPages ? ' disabled' : '';
        html += `<button class="tablix-pagination-btn tablix-pagination-last" data-page="${info.totalPages}"${disabled}>${this.table.t('pagination.last')}</button>`;
      }
      html += '</div>';
    }

    // Loading indicator
    if (info.isLoading) {
      html += `<div class="tablix-pagination-loading">${this.table.t('general.loading')}</div>`;
    }
    html += '</div>';
    paginationContainer.innerHTML = html;
    this.bindPaginationEvents();
  }
  bindPaginationEvents() {
    const paginationContainer = this.table.container.querySelector('.tablix-pagination');
    if (!paginationContainer) {
      return;
    }

    // Page navigation buttons
    paginationContainer.addEventListener('click', async e => {
      if (e.target.classList.contains('tablix-pagination-btn') && !e.target.disabled) {
        e.preventDefault();
        const page = parseInt(e.target.dataset.page);
        if (!isNaN(page)) {
          try {
            await this.table.paginationManager.goToPage(page);
          } catch (error) {
            console.error('Failed to navigate to page:', error);
          }
        }
      }
    });

    // Page size selector
    const pageSizeSelect = paginationContainer.querySelector('.tablix-page-size-select');
    if (pageSizeSelect) {
      pageSizeSelect.addEventListener('change', async e => {
        try {
          const newPageSize = parseInt(e.target.value);
          await this.table.paginationManager.changePageSize(newPageSize);
        } catch (error) {
          console.error('Failed to change page size:', error);
        }
      });
    }
  }

  /**
   * Escape HTML to prevent XSS attacks
   */
  escapeHtml(text) {
    if (text == null) return '';
    const div = document.createElement('div');
    div.textContent = text.toString();
    return div.innerHTML;
  }

  /**
   * Render loading state
   */
  renderLoading() {
    this.table.container.innerHTML = `<div class="tablix-loading">${this.table.t('general.loading')}</div>`;
  }

  /**
   * Render error state
   */
  renderError(error) {
    this.table.container.innerHTML = `<div class="tablix-error">${this.table.t('general.error')}: ${this.escapeHtml(error.message || error)}</div>`;
  }

  /**
   * Render control panel
   */
  renderControls(position) {
    const controlsOptions = this.table.options.controls;
    const searchOptions = this.table.options.search || {
      enabled: false,
      placeholder: null
    };
    let html = `<div class="tablix-controls tablix-controls-${position}">`;

    // Left side controls
    html += '<div class="tablix-controls-left">';

    // Pagination controls
    if (controlsOptions.pagination && this.table.paginationManager) {
      html += '<div class="tablix-control-group tablix-pagination-controls">';
      html += `<button type="button" class="tablix-btn tablix-control-btn" data-action="firstPage">${this.table.t('pagination.first')}</button>`;
      html += `<button type="button" class="tablix-btn tablix-control-btn" data-action="prevPage">${this.table.t('pagination.previous')}</button>`;
      html += `<button type="button" class="tablix-btn tablix-control-btn" data-action="nextPage">${this.table.t('pagination.next')}</button>`;
      html += `<button type="button" class="tablix-btn tablix-control-btn" data-action="lastPage">${this.table.t('pagination.last')}</button>`;
      html += '</div>';
    }

    // Page size control
    if (controlsOptions.pageSize && this.table.paginationManager) {
      const pageSizeOptions = this.table.paginationManager.options.pageSizeOptions;
      const currentPageSize = this.table.paginationManager.pageSize;
      html += '<div class="tablix-control-group tablix-page-size-group">';
      html += `<label for="tablix-page-size-select">${this.table.t('general.show')}:</label>`;
      html += '<select class="tablix-page-size-select" id="tablix-page-size-select">';
      pageSizeOptions.forEach(size => {
        const selected = size === currentPageSize ? ' selected' : '';
        html += `<option value="${size}"${selected}>${size}</option>`;
      });
      html += '</select>';
      html += `<span>${this.table.t('general.entries')}</span>`;
      html += '</div>';
    }

    // Refresh control
    if (controlsOptions.refresh) {
      html += '<div class="tablix-control-group tablix-refresh-group">';
      html += `<button type="button" class="tablix-btn tablix-control-btn" data-action="refresh" title="${this.table.t('controls.refresh')}">⟳</button>`;
      html += '</div>';
    }
    html += '</div>'; // Close left controls

    // Right side controls
    html += '<div class="tablix-controls-right">';

    // Search control
    if (controlsOptions.search && searchOptions.enabled) {
      // Use localized placeholder or provided one
      const placeholderText = searchOptions.placeholder || this.table.t('search.placeholder');
      html += '<div class="tablix-control-group tablix-search-group">';
      html += `<input type="text" 
                      class="tablix-search-input" 
                      id="tablix-search-input" 
                      name="table-search"
                      placeholder="${placeholderText}" />`;
      html += `<button type="button" class="tablix-btn tablix-search-clear" title="${this.table.t('search.clear')}" style="display: none;">✕</button>`;
      html += '</div>';
    }
    html += '</div>'; // Close right controls

    html += '</div>'; // Close main controls container

    return html;
  }

  /**
   * Bind control panel events
   */
  bindControlEvents() {
    const wrapper = this.table.container.querySelector('.tablix-wrapper');
    if (!wrapper) return;

    // Page size selector
    const pageSizeSelect = wrapper.querySelector('.tablix-page-size-select');
    if (pageSizeSelect) {
      pageSizeSelect.addEventListener('change', async e => {
        try {
          const newPageSize = parseInt(e.target.value);
          await this.table.changePageSize(newPageSize);
        } catch (error) {
          console.error('Failed to change page size:', error);
        }
      });
    }

    // Control buttons
    wrapper.addEventListener('click', async e => {
      if (e.target.classList.contains('tablix-control-btn')) {
        e.preventDefault();
        const action = e.target.dataset.action;
        try {
          switch (action) {
            case 'firstPage':
              await this.table.firstPage();
              break;
            case 'prevPage':
              await this.table.prevPage();
              break;
            case 'nextPage':
              await this.table.nextPage();
              break;
            case 'lastPage':
              await this.table.lastPage();
              break;
            case 'refresh':
              await this.handleRefresh();
              break;
            case 'export':
              this.handleExport();
              break;
          }
        } catch (error) {
          console.error(`Failed to execute action ${action}:`, error);
        }
      }
    });
  }

  /**
   * Handle refresh functionality
   */
  async handleRefresh() {
    this.table.eventManager.trigger('beforeRefresh');
    if (this.table.options.onRefresh && typeof this.table.options.onRefresh === 'function') {
      // Custom refresh handler
      try {
        const newData = await this.table.options.onRefresh();
        if (newData) {
          await this.table.loadData(newData);
        }
      } catch (error) {
        console.error('Custom refresh failed:', error);
      }
    } else if (this.table.paginationManager && this.table.paginationManager.options.mode === 'server') {
      // Server-side refresh
      await this.table.paginationManager.refreshTable();
    } else {
      // Client-side refresh - just re-render current data
      await this.table.refreshTable();
    }
    this.table.eventManager.trigger('afterRefresh');
  }

  /**
   * Handle export functionality
   */
  handleExport() {
    const data = this.table.getData();
    const columns = this.table.options.columns || [];

    // Simple CSV export
    let csv = columns.map(col => col.title || col.name).join(',') + '\n';
    data.forEach(row => {
      const values = columns.map(col => {
        const value = row[col.name];

        // Handle complex objects
        if (typeof value === 'object' && value !== null && !(value instanceof Date)) {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        }

        // Simple CSV escaping for strings
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      csv += values.join(',') + '\n';
    });

    // Download CSV
    const blob = new Blob([csv], {
      type: 'text/csv'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'table-data.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.table.eventManager.trigger('afterExport', {
      data,
      format: 'csv'
    });
  }

  /**
   * Bind sorting events to header columns
   */
  bindSortEvents() {
    const headerRow = this.table.container.querySelector('.tablix-header-row');
    if (!headerRow) return;
    headerRow.addEventListener('click', async e => {
      const th = e.target.closest('.tablix-sortable');
      if (!th) return;
      e.preventDefault();
      const columnName = th.dataset.column;
      try {
        await this.table.toggleSort(columnName);
      } catch (error) {
        console.error('Failed to sort column:', error);
      }
    });

    // Keyboard support for accessibility
    headerRow.addEventListener('keydown', async e => {
      const th = e.target.closest('.tablix-sortable');
      if (!th || e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      const columnName = th.dataset.column;
      try {
        await this.table.toggleSort(columnName);
      } catch (error) {
        console.error('Failed to sort column:', error);
      }
    });
  }

  /**
   * Bind row click events for selection
   */
  bindRowClickEvents() {
    const tbody = this.table.container.querySelector('.tablix-tbody');
    if (!tbody) return;
    tbody.addEventListener('click', e => {
      const row = e.target.closest('.tablix-row');
      if (!row || row.classList.contains('tablix-empty-row')) return;
      const globalRowIndex = parseInt(row.dataset.rowIndex, 10);
      if (isNaN(globalRowIndex)) return;

      // Convert global index to local index for current page data
      let localRowIndex = globalRowIndex;
      if (this.table.paginationManager && this.table.paginationManager.options.mode === 'client') {
        const currentPage = this.table.paginationManager.currentPage;
        const pageSize = this.table.paginationManager.pageSize;
        localRowIndex = globalRowIndex - (currentPage - 1) * pageSize;
      }

      // Get current page data to find the clicked row
      const currentData = this.getCurrentPageData();
      if (localRowIndex >= 0 && localRowIndex < currentData.length) {
        const rowData = currentData[localRowIndex];

        // Trigger row click event for SelectionManager with global index
        this.table.eventManager.trigger('rowClick', {
          rowData,
          rowIndex: globalRowIndex,
          // Pass global index
          localRowIndex: localRowIndex,
          // Also pass local index if needed
          originalEvent: e
        });
      }
    });
  }

  /**
   * Get current page data (same logic as SelectionManager)
   */
  getCurrentPageData() {
    if (this.table.paginationManager) {
      return this.table.paginationManager.getCurrentPageData() || [];
    }
    return this.table.dataManager.getData();
  }

  /**
   * Update sort indicators in headers
   */
  updateSortIndicators(currentSort) {
    const headers = this.table.container.querySelectorAll('.tablix-th[data-column]');
    headers.forEach(th => {
      const columnName = th.dataset.column;
      const isSorted = currentSort && currentSort.column === columnName;

      // Remove all sort classes
      th.classList.remove('tablix-sorted', 'tablix-sorted-asc', 'tablix-sorted-desc');
      const indicator = th.querySelector('.tablix-sort-indicator');
      if (!indicator) return;
      const arrow = indicator.querySelector('.tablix-sort-arrow');
      if (!arrow) return;
      if (isSorted) {
        // Column is sorted
        th.classList.add('tablix-sorted', `tablix-sorted-${currentSort.direction}`);
        arrow.classList.remove('tablix-sort-none', 'tablix-sort-asc', 'tablix-sort-desc');
        arrow.classList.add(`tablix-sort-${currentSort.direction}`);
        arrow.textContent = currentSort.direction === 'asc' ? '↑' : '↓';
        arrow.setAttribute('aria-label', `${this.table.t('sort.sorted')}${currentSort.direction === 'asc' ? this.table.t('sort.sortedAscending') : this.table.t('sort.sortedDescending')}`);
        arrow.removeAttribute('data-sort-order');
      } else {
        // Column is not sorted
        arrow.classList.remove('tablix-sort-asc', 'tablix-sort-desc');
        arrow.classList.add('tablix-sort-none');
        arrow.textContent = '↕';
        arrow.setAttribute('aria-label', this.table.t('sort.notSorted'));
        arrow.removeAttribute('data-sort-order');
      }
    });
  }

  /**
   * Check if a column is sortable
   */
  _isColumnSortable(column) {
    if (!this.table.sortingManager) return false;
    return this.table.sortingManager.isColumnSortable(column.name);
  }

  /**
   * Get sort direction for a column
   */
  _getSortDirection(columnName) {
    if (!this.table.sortingManager) return null;
    return this.table.sortingManager.getSortDirection(columnName);
  }
}

class EventManager {
  constructor() {
    this.events = {};
  }
  on(event, callback) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(callback);
  }
  off(event, callback) {
    if (this.events[event]) {
      const index = this.events[event].indexOf(callback);
      if (index > -1) {
        this.events[event].splice(index, 1);
      }
    }
  }
  clear(event) {
    if (event) {
      this.events[event] = [];
    } else {
      this.events = {};
    }
  }
  trigger(event, payload) {
    (this.events[event] || []).forEach(cb => cb(payload));
  }
}

/**
 * PaginationManager handles both client-side and server-side pagination
 * 
 * Features:
 * - Client-side: slices filtered data locally
 * - Server-side: calls async data loader with pagination params
 * - Consistent API regardless of pagination mode
 * - Event emission for page changes
 * - Customizable pagination controls
 */
class PaginationManager {
  constructor(table, options = {}) {
    this.table = table;
    this.options = {
      pageSize: 10,
      mode: 'client',
      // 'client' or 'server'
      showPageNumbers: true,
      maxPageNumbers: 5,
      showFirstLast: true,
      showPrevNext: true,
      showPageSizes: false,
      pageSizeOptions: [10, 25, 50, 100],
      serverDataLoader: null,
      // async function for server-side pagination
      ...options
    };

    // Pagination state
    this.currentPage = 1;
    this.totalPages = 1;
    this.totalRows = 0;
    this.pageSize = this.options.pageSize;
    this.isLoading = false;

    // Event bindings
    this.init();
  }
  init() {
    this.updatePaginationInfo();
  }

  /**
   * Update pagination information based on current data
   */
  updatePaginationInfo(totalRows = null) {
    if (this.options.mode === 'client') {
      // For client-side pagination, calculate from filtered data
      this.totalRows = this.table.dataManager.filteredData.length;
    } else {
      // For server-side pagination, total rows should be provided
      this.totalRows = totalRows || this.totalRows;
    }
    this.totalPages = Math.ceil(this.totalRows / this.pageSize) || 1;

    // Ensure current page is within bounds
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
    if (this.currentPage < 1) {
      this.currentPage = 1;
    }
  }

  /**
   * Get current page data
   * For client-side: slice the filtered data
   * For server-side: return cached data or trigger load
   */
  async getPageData() {
    if (this.options.mode === 'client') {
      return this.getClientPageData();
    } else {
      return await this.getServerPageData();
    }
  }

  /**
   * Get page data for client-side pagination
   */
  getClientPageData() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.table.dataManager.filteredData.slice(start, end);
  }

  /**
   * Get current page data synchronously (for selection and other features)
   * Returns the data that is currently displayed on the page
   */
  getCurrentPageData() {
    if (this.options.mode === 'client') {
      return this.getClientPageData();
    } else {
      // For server-side pagination, return the currently cached data
      // This assumes the data has already been loaded by a previous getPageData call
      return this.table.dataManager.getData();
    }
  }

  /**
   * Get page data for server-side pagination
   * Now delegates to unified server loading
   */
  async getServerPageData() {
    // Server-side pagination is now handled by the unified _loadServerData method
    // Just return the current data from DataManager
    // The actual loading happens in refreshTable() -> _loadServerData()
    return this.table.dataManager.getData();
  }

  /**
   * Navigate to specific page
   */
  async goToPage(pageNumber) {
    const targetPage = Math.max(1, Math.min(pageNumber, this.totalPages));
    if (targetPage === this.currentPage) {
      return;
    }
    const oldPage = this.currentPage;
    this.currentPage = targetPage;

    // Update state manager
    if (this.table.stateManager) {
      this.table.stateManager.updatePagination({
        page: targetPage
      });
    }
    this.table.eventManager.trigger('beforePageChange', {
      oldPage,
      newPage: this.currentPage,
      pageSize: this.pageSize
    });
    try {
      await this.table.refreshTable();
      this.table.eventManager.trigger('afterPageChange', {
        oldPage,
        newPage: this.currentPage,
        pageSize: this.pageSize
      });
    } catch (error) {
      // Revert page change on error
      this.currentPage = oldPage;
      if (this.table.stateManager) {
        this.table.stateManager.updatePagination({
          page: oldPage
        });
      }
      throw error;
    }
  }

  /**
   * Go to next page
   */
  async nextPage() {
    if (this.currentPage < this.totalPages) {
      await this.goToPage(this.currentPage + 1);
    }
  }

  /**
   * Go to previous page
   */
  async prevPage() {
    if (this.currentPage > 1) {
      await this.goToPage(this.currentPage - 1);
    }
  }

  /**
   * Go to first page
   */
  async firstPage() {
    await this.goToPage(1);
  }

  /**
   * Go to last page
   */
  async lastPage() {
    await this.goToPage(this.totalPages);
  }

  /**
   * Change page size
   */
  async changePageSize(newPageSize) {
    if (newPageSize === this.pageSize) {
      return;
    }
    const oldPageSize = this.pageSize;
    this.pageSize = newPageSize;

    // Try to maintain current position in the dataset
    const currentRow = (this.currentPage - 1) * oldPageSize;
    const newPage = Math.floor(currentRow / newPageSize) + 1;
    this.updatePaginationInfo();

    // Update state manager
    if (this.table.stateManager) {
      this.table.stateManager.updatePagination({
        pageSize: newPageSize,
        page: newPage
      });
    }
    this.table.eventManager.trigger('beforePageSizeChange', {
      oldPageSize,
      newPageSize: this.pageSize,
      oldPage: this.currentPage,
      newPage
    });
    this.currentPage = newPage;
    await this.table.refreshTable();
    this.table.eventManager.trigger('afterPageSizeChange', {
      oldPageSize,
      newPageSize: this.pageSize,
      page: this.currentPage
    });
  }

  /**
   * Reset pagination to first page (useful after filtering/sorting)
   */
  async resetToFirstPage() {
    this.currentPage = 1;
    this.updatePaginationInfo();

    // Update state manager
    if (this.table.stateManager) {
      this.table.stateManager.updatePagination({
        page: 1
      });
    }

    // Use table's refreshTable instead of local method
    await this.table.refreshTable();
  }

  /**
   * Get pagination state info
   */
  getInfo() {
    const start = this.totalRows === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage * this.pageSize, this.totalRows);
    return {
      currentPage: this.currentPage,
      totalPages: this.totalPages,
      pageSize: this.pageSize,
      totalRows: this.totalRows,
      startRow: start,
      endRow: end,
      hasNextPage: this.currentPage < this.totalPages,
      hasPrevPage: this.currentPage > 1,
      isLoading: this.isLoading
    };
  }

  /**
   * Get page numbers to display in pagination controls
   */
  getPageNumbers() {
    const maxPages = this.options.maxPageNumbers;
    const pages = [];
    if (this.totalPages <= maxPages) {
      // Show all pages
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show truncated page numbers
      const half = Math.floor(maxPages / 2);
      let start = Math.max(1, this.currentPage - half);
      let end = Math.min(this.totalPages, start + maxPages - 1);

      // Adjust if we're near the end
      if (end - start + 1 < maxPages) {
        start = Math.max(1, end - maxPages + 1);
      }
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      // Add ellipsis indicators
      if (start > 1) {
        if (start > 2) pages.unshift('...');
        pages.unshift(1);
      }
      if (end < this.totalPages) {
        if (end < this.totalPages - 1) pages.push('...');
        pages.push(this.totalPages);
      }
    }
    return pages;
  }

  /**
   * Enable/disable pagination
   */
  setEnabled(enabled) {
    this.options.enabled = enabled;
    this.table.renderer.renderPagination();
  }

  /**
   * Switch between client and server mode
   */
  async setMode(mode, serverDataLoader = null) {
    if (mode === this.options.mode) {
      return;
    }
    this.options.mode = mode;
    if (mode === 'server' && serverDataLoader) {
      this.options.serverDataLoader = serverDataLoader;
    }

    // Reset to first page when switching modes
    this.currentPage = 1;
    this.updatePaginationInfo();

    // Update state manager
    if (this.table.stateManager) {
      this.table.stateManager.updatePagination({
        page: 1
      });
    }
    await this.table.refreshTable();
  }
}

/**
 * SortingManager - Handles all sorting functionality for TablixJS
 * Supports client-side and server-side sorting with custom sort functions
 */
class SortingManager {
  constructor(table, options = {}) {
    this.table = table;
    this.options = {
      enabled: true,
      mode: 'client',
      // 'client' or 'server'
      serverSortLoader: null,
      // Function to load data from server with sorting
      defaultSortType: 'auto',
      // 'auto', 'string', 'number', 'date'
      caseSensitive: false,
      nullsFirst: false,
      ...options
    };

    // Current sort state - single column only
    this.currentSort = null; // { column: 'name', direction: 'asc' }
    this.sortOrder = ['asc', 'desc', null]; // Click cycle order

    // Predefined sort types
    this.sortTypes = {
      auto: this._autoSort.bind(this),
      string: this._stringSort.bind(this),
      number: this._numberSort.bind(this),
      date: this._dateSort.bind(this),
      boolean: this._booleanSort.bind(this)
    };
  }

  /**
   * Sort by a column
   * @param {string} columnName - Column to sort by
   * @param {string|null} direction - 'asc', 'desc', or null (unsorted)
   */
  async sort(columnName, direction = 'asc') {
    // Trigger beforeSort event
    const beforeSortData = {
      columnName,
      direction,
      currentSort: this.currentSort
    };
    this.table.eventManager.trigger('beforeSort', beforeSortData);

    // Set current sort state
    if (direction !== null) {
      this.currentSort = {
        column: columnName,
        direction
      };
    } else {
      this.currentSort = null;
    }

    // Update state manager
    if (this.table.stateManager) {
      this.table.stateManager.updateSort(this.currentSort);
      // Reset to first page when sorting changes
      this.table.stateManager.resetPage();
    }
    if (this.options.mode === 'server') {
      // Server mode - update will be triggered by refreshTable via unified loader
      await this.table.refreshTable();
    } else {
      // Client mode - apply sorting locally
      this._applySorting();
      await this.table.refreshTable();
    }

    // Update UI
    this.table.renderer.updateSortIndicators(this.currentSort);

    // Trigger afterSort event
    this.table.eventManager.trigger('afterSort', {
      columnName,
      direction,
      currentSort: this.currentSort
    });
  }

  /**
   * Toggle sort for a column (handles click cycling)
   */
  async toggleSort(columnName) {
    const currentDirection = this.currentSort && this.currentSort.column === columnName ? this.currentSort.direction : null;

    // Get next direction in cycle
    const currentIndex = this.sortOrder.indexOf(currentDirection);
    const nextDirection = this.sortOrder[(currentIndex + 1) % this.sortOrder.length];
    await this.sort(columnName, nextDirection);
  }

  /**
   * Client-side sorting
   */
  _sortClient(columnName, direction) {
    // Set current sort
    if (direction !== null) {
      this.currentSort = {
        column: columnName,
        direction
      };
    } else {
      this.currentSort = null;
    }

    // Apply sorting to data
    this._applySorting();
  }

  /**
   * Server-side sorting (DEPRECATED - now handled by unified loader)
   * @deprecated Use unified _loadServerData in Table.js
   */
  async _sortServer(columnName, direction) {
    // This method is deprecated and should not be called anymore
    // Sorting in server mode is now handled by the unified _loadServerData method
    console.warn('_sortServer is deprecated. Server sorting now uses unified data loading.');
  }

  /**
   * Apply current sort to filtered data
   */
  _applySorting() {
    if (!this.currentSort) return;
    const columns = this.table.options.columns || [];
    this.table.dataManager.filteredData.sort((a, b) => {
      // Support both 'name' and 'key' properties for column identification
      const column = columns.find(col => col.name === this.currentSort.column || col.key === this.currentSort.column);
      const comparison = this._compareValues(a[this.currentSort.column], b[this.currentSort.column], column);
      return this.currentSort.direction === 'desc' ? -comparison : comparison;
    });

    // Reset pagination to first page after sorting
    if (this.table.paginationManager) {
      this.table.paginationManager.resetToFirstPage();
    }
  }

  /**
   * Compare two values based on column configuration
   */
  _compareValues(a, b, column) {
    // Handle null/undefined values
    if (a == null && b == null) return 0;
    if (a == null) return this.options.nullsFirst ? -1 : 1;
    if (b == null) return this.options.nullsFirst ? 1 : -1;

    // Use custom sort function if provided
    if (column && column.sortFunction) {
      return column.sortFunction(a, b);
    }

    // Use specified sort type or auto-detect
    const sortType = column && column.sortType || this.options.defaultSortType;
    if (this.sortTypes[sortType]) {
      return this.sortTypes[sortType](a, b);
    }

    // Fallback to auto sort
    return this._autoSort(a, b);
  }

  /**
   * Auto-detect sort type and compare
   */
  _autoSort(a, b) {
    // Try number comparison first
    const numA = parseFloat(a);
    const numB = parseFloat(b);
    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB;
    }

    // Try date comparison - be more strict about what constitutes a date
    const dateA = new Date(a);
    const dateB = new Date(b);

    // More strict date validation - check if it looks like a real date format
    const isDateLike = str => {
      return /^\d{4}-\d{2}-\d{2}/.test(str) || /^\d{1,2}\/\d{1,2}\/\d{4}/.test(str) || /^\d{1,2}-\d{1,2}-\d{4}/.test(str);
    };
    if (dateA.toString() !== 'Invalid Date' && dateB.toString() !== 'Invalid Date' && isDateLike(String(a)) && isDateLike(String(b))) {
      return dateA - dateB;
    }

    // Fall back to string comparison
    return this._stringSort(a, b);
  }

  /**
   * String comparison
   */
  _stringSort(a, b) {
    const strA = String(a).trim();
    const strB = String(b).trim();
    if (this.options.caseSensitive) {
      return strA.localeCompare(strB);
    }
    return strA.localeCompare(strB, undefined, {
      sensitivity: 'base'
    });
  }

  /**
   * Number comparison
   */
  _numberSort(a, b) {
    const numA = parseFloat(a);
    const numB = parseFloat(b);
    if (isNaN(numA) && isNaN(numB)) return 0;
    if (isNaN(numA)) return 1;
    if (isNaN(numB)) return -1;
    return numA - numB;
  }

  /**
   * Date comparison
   */
  _dateSort(a, b) {
    const dateA = new Date(a);
    const dateB = new Date(b);
    if (dateA.toString() === 'Invalid Date' && dateB.toString() === 'Invalid Date') return 0;
    if (dateA.toString() === 'Invalid Date') return 1;
    if (dateB.toString() === 'Invalid Date') return -1;
    return dateA - dateB;
  }

  /**
   * Boolean comparison
   */
  _booleanSort(a, b) {
    const boolA = Boolean(a);
    const boolB = Boolean(b);
    if (boolA === boolB) return 0;
    return boolA ? 1 : -1;
  }

  /**
   * Clear all sorting
   */
  async clearSorting() {
    this.currentSort = null;
    if (this.options.mode === 'server') {
      // Reload data without sorting
      if (this.options.serverSortLoader) {
        try {
          const result = await this.options.serverSortLoader({
            sort: null,
            filters: this.table.dataManager.currentFilters,
            page: this.table.paginationManager ? this.table.paginationManager.currentPage : 1,
            pageSize: this.table.paginationManager ? this.table.paginationManager.pageSize : 10
          });
          this.table.dataManager.setServerData(result.data, result.totalRows);
        } catch (error) {
          console.error('Failed to clear server sorting:', error);
        }
      }
    }

    // Update UI and refresh table
    this.table.renderer.updateSortIndicators(null);
    await this.table.refreshTable();
    this.table.eventManager.trigger('afterSort', {
      currentSort: null
    });
  }

  /**
   * Get current sort state
   */
  getSortState() {
    return {
      sort: this.currentSort,
      mode: this.options.mode
    };
  }

  /**
   * Set sorting options
   */
  setOptions(newOptions) {
    this.options = {
      ...this.options,
      ...newOptions
    };
  }

  /**
   * Check if a column is sortable
   */
  isColumnSortable(columnName) {
    if (!this.options.enabled) return false;
    const columns = this.table.options.columns || [];
    const column = columns.find(col => col.name === columnName);
    return column && column.sortable !== false;
  }

  /**
   * Get sort direction for a column
   */
  getSortDirection(columnName) {
    return this.currentSort && this.currentSort.column === columnName ? this.currentSort.direction : null;
  }
}

/**
 * ColumnManager - Enhanced column formatting system for TablixJS
 * 
 * Features:
 * - Flexible formatting with optional locale and formatOptions
 * - Supports text, date, currency, number, percent formats
 * - Custom renderer priority over formatting
 * - Extensible design for future format types
 * - Performance-optimized with cached formatters
 */
class ColumnManager {
  constructor(table) {
    this.table = table;
    this.columns = [];
    this.formatters = new Map(); // Cache for compiled formatters
    this.supportedFormats = ['text', 'date', 'currency', 'number', 'percent'];
  }

  /**
   * Initialize columns and prepare formatters
   * @param {Array} columns - Array of column definitions
   */
  initializeColumns(columns = []) {
    this.columns = columns.map(col => this.prepareColumn(col));
    this.compileFormatters();
    return this.columns;
  }

  /**
   * Prepare and validate a single column definition
   * @param {Object} column - Column definition
   * @returns {Object} Prepared column
   */
  prepareColumn(column) {
    const prepared = {
      ...column
    };

    // Validate format if provided
    if (prepared.format && !this.supportedFormats.includes(prepared.format)) {
      console.warn(`TablixJS: Unsupported format type '${prepared.format}' for column '${prepared.name}'. Falling back to no formatting.`);
      delete prepared.format;
    }

    // Ensure name property exists
    if (!prepared.name) {
      throw new Error('TablixJS: Column must have a "name" property');
    }

    // Set default title if not provided
    if (!prepared.title) {
      prepared.title = prepared.name;
    }
    return prepared;
  }

  /**
   * Compile and cache formatter functions for columns with format specified
   */
  compileFormatters() {
    this.formatters.clear();
    this.columns.forEach(column => {
      if (column.format) {
        const formatter = this.createFormatter(column);
        if (formatter) {
          this.formatters.set(column.name, formatter);
        }
      }
    });
  }

  /**
   * Create a formatter function for a column
   * @param {Object} column - Column definition
   * @returns {Function|null} Formatter function
   */
  createFormatter(column) {
    const {
      format,
      locale,
      formatOptions = {}
    } = column;
    switch (format) {
      case 'text':
        return value => this.formatText(value);
      case 'date':
        return value => this.formatDate(value, locale, formatOptions);
      case 'currency':
        return value => this.formatCurrency(value, locale, formatOptions, column.currency);
      case 'number':
        return value => this.formatNumber(value, locale, formatOptions);
      case 'percent':
        return value => this.formatPercent(value, locale, formatOptions);
      default:
        return null;
    }
  }

  /**
   * Format a cell value for a specific column
   * @param {Object|string} column - Column object or column name (for backwards compatibility)
   * @param {*} value - Cell value
   * @param {Object} row - Full row data (for context)
   * @returns {Object} Object with formatted value and metadata
   */
  formatCellValue(column, value, row) {
    // Support both column object (new) and column name (backwards compatibility)
    const columnObj = typeof column === 'string' ? this.getColumn(column) : column;
    const columnName = columnObj ? columnObj.name : column;

    // Priority 1: Custom renderer (overrides everything)
    if (columnObj && columnObj.renderer) {
      // If renderer wants formatted value, provide it
      const formatter = this.formatters.get(columnName);
      const formattedValue = formatter ? formatter(value) : value;
      const result = columnObj.renderer(value, row, formattedValue);
      return {
        value: result,
        isHtml: true // Custom renderers can return HTML
      };
    }

    // Priority 2: Format using cached formatter
    const formatter = this.formatters.get(columnName);
    if (formatter) {
      return {
        value: formatter(value),
        isHtml: false // Formatted values are safe text
      };
    }

    // Priority 3: Return raw value
    return {
      value: value,
      isHtml: false // Raw values need escaping
    };
  }

  /**
   * Get column definition by name
   * @param {string} columnName - Column name
   * @returns {Object|null} Column definition
   */
  getColumn(columnName) {
    return this.columns.find(col => col.name === columnName) || null;
  }

  /**
   * Get all columns
   * @returns {Array} Array of column definitions
   */
  getColumns() {
    return this.columns;
  }

  // =============================================================================
  // FORMAT IMPLEMENTATIONS
  // =============================================================================

  /**
   * Format text (basic string conversion with null/undefined handling)
   * @param {*} value - Value to format
   * @returns {string} Formatted text
   */
  formatText(value) {
    if (value == null) return '';
    return String(value);
  }

  /**
   * Format date using Intl.DateTimeFormat
   * @param {*} value - Date value (string, Date, timestamp)
   * @param {string} locale - Locale string (optional)
   * @param {Object} options - Intl.DateTimeFormat options
   * @returns {string} Formatted date
   */
  formatDate(value, locale, options = {}) {
    if (value == null) return '';
    try {
      const date = value instanceof Date ? value : new Date(value);
      if (isNaN(date.getTime())) {
        return String(value); // Return original if invalid date
      }
      const formatter = new Intl.DateTimeFormat(locale, options);
      return formatter.format(date);
    } catch (error) {
      console.warn('TablixJS: Date formatting error:', error);
      return String(value);
    }
  }

  /**
   * Format currency using Intl.NumberFormat
   * @param {*} value - Numeric value
   * @param {string} locale - Locale string (optional)
   * @param {Object} options - Intl.NumberFormat options
   * @param {string} currency - Currency code (e.g., 'USD', 'EUR')
   * @returns {string} Formatted currency
   */
  formatCurrency(value, locale, options = {}, currency = 'USD') {
    if (value == null) return '';
    const numericValue = Number(value);
    if (isNaN(numericValue)) {
      return String(value);
    }
    try {
      const formatOptions = {
        style: 'currency',
        currency: currency,
        ...options
      };
      const formatter = new Intl.NumberFormat(locale, formatOptions);
      return formatter.format(numericValue);
    } catch (error) {
      console.warn('TablixJS: Currency formatting error:', error);
      return String(value);
    }
  }

  /**
   * Format number using Intl.NumberFormat
   * @param {*} value - Numeric value
   * @param {string} locale - Locale string (optional)
   * @param {Object} options - Intl.NumberFormat options
   * @returns {string} Formatted number
   */
  formatNumber(value, locale, options = {}) {
    if (value == null) return '';
    const numericValue = Number(value);
    if (isNaN(numericValue)) {
      return String(value);
    }
    try {
      const formatter = new Intl.NumberFormat(locale, options);
      return formatter.format(numericValue);
    } catch (error) {
      console.warn('TablixJS: Number formatting error:', error);
      return String(value);
    }
  }

  /**
   * Format percentage using Intl.NumberFormat
   * @param {*} value - Numeric value (0.5 = 50%)
   * @param {string} locale - Locale string (optional)
   * @param {Object} options - Intl.NumberFormat options
   * @returns {string} Formatted percentage
   */
  formatPercent(value, locale, options = {}) {
    if (value == null) return '';
    const numericValue = Number(value);
    if (isNaN(numericValue)) {
      return String(value);
    }
    try {
      const formatOptions = {
        style: 'percent',
        ...options
      };
      const formatter = new Intl.NumberFormat(locale, formatOptions);
      return formatter.format(numericValue);
    } catch (error) {
      console.warn('TablixJS: Percent formatting error:', error);
      return String(value);
    }
  }

  // =============================================================================
  // EXTENSIBILITY METHODS
  // =============================================================================

  /**
   * Register a custom format type (for future extensibility)
   * @param {string} formatType - Format type name
   * @param {Function} formatterFactory - Function that creates formatter
   */
  registerFormat(formatType, formatterFactory) {
    if (this.supportedFormats.includes(formatType)) {
      console.warn(`TablixJS: Format type '${formatType}' already exists and will be overridden.`);
    }
    this.supportedFormats.push(formatType);

    // You would extend createFormatter method to handle this
    // This is a placeholder for future plugin architecture
    console.log(`TablixJS: Custom format '${formatType}' registered.`);
  }

  /**
   * Get supported format types
   * @returns {Array} Array of supported format type strings
   */
  getSupportedFormats() {
    return [...this.supportedFormats];
  }
}

/**
 * FilterManager - Advanced column filtering system for TablixJS
 * 
 * Features:
 * - Multi-column filtering with independent filter states
 * - Two filter types: "value" (checkbox selection) and "condition" (operators)
 * - Supports multiple conditions per column
 * - Extensible operator system for custom filters
 * - Integration with sorting and pagination
 */
class FilterManager {
  constructor(table, options = {}) {
    this.table = table;
    this.options = {
      enabled: true,
      mode: 'client',
      // 'client' or 'server'
      serverFilterLoader: null,
      // Function to load filtered data from server
      debounceDelay: 300,
      // Debounce delay for input filters
      showBadges: true,
      // Show filter count badges
      showTooltips: true,
      // Show filter summary tooltips
      ...options
    };

    // Filter state per column
    this.columnFilters = new Map(); // { columnName: { type, config, isActive } }

    // Supported filter operators
    this.operators = {
      'none': {
        label: 'None',
        apply: () => true
      },
      'isEmpty': {
        label: 'Is empty',
        apply: value => value === null || value === undefined || value === ''
      },
      'isNotEmpty': {
        label: 'Is not empty',
        apply: value => value !== null && value !== undefined && value !== ''
      },
      'equals': {
        label: 'Is equal to',
        apply: (value, filterValue) => String(value).toLowerCase() === String(filterValue).toLowerCase()
      },
      'notEquals': {
        label: 'Is not equal to',
        apply: (value, filterValue) => String(value).toLowerCase() !== String(filterValue).toLowerCase()
      },
      'beginsWith': {
        label: 'Begins with',
        apply: (value, filterValue) => String(value).toLowerCase().startsWith(String(filterValue).toLowerCase())
      },
      'endsWith': {
        label: 'Ends with',
        apply: (value, filterValue) => String(value).toLowerCase().endsWith(String(filterValue).toLowerCase())
      },
      'contains': {
        label: 'Contains',
        apply: (value, filterValue) => String(value).toLowerCase().includes(String(filterValue).toLowerCase())
      },
      'notContains': {
        label: 'Does not contain',
        apply: (value, filterValue) => !String(value).toLowerCase().includes(String(filterValue).toLowerCase())
      }
    };

    // Debounce timer for input filtering
    this.debounceTimer = null;

    // Track open filter dropdowns
    this.openDropdowns = new Set();
  }

  /**
   * Apply filter to a specific column
   * @param {string} columnName - Column to filter
   * @param {Object} filterConfig - Filter configuration
   */
  async applyFilter(columnName, filterConfig) {
    // Validate filter config
    if (!this.validateFilterConfig(filterConfig)) {
      console.warn(`TablixJS: Invalid filter config for column '${columnName}'`);
      return;
    }

    // Trigger beforeFilter hook
    const beforeFilterData = {
      columnName,
      filterConfig,
      currentFilters: this.getActiveFilters()
    };
    this.table.eventManager.trigger('beforeFilter', beforeFilterData);

    // Store filter state
    this.columnFilters.set(columnName, {
      type: filterConfig.type,
      config: filterConfig,
      isActive: this.isFilterActive(filterConfig)
    });

    // Update state manager with current filters
    if (this.table.stateManager) {
      this.table.stateManager.updateFilters(this.getActiveFilters());
      // Reset to first page when filters change
      this.table.stateManager.resetPage();
    }
    if (this.options.mode === 'server') {
      // Server mode - update will be triggered by refreshTable via unified loader
      await this.table.refreshTable();
    } else {
      // Client mode - apply filter locally
      this._filterClient();
      await this.table.refreshTable();
    }

    // Update UI indicators
    this.updateFilterIndicators();

    // Trigger afterFilter hook
    this.table.eventManager.trigger('afterFilter', {
      columnName,
      filterConfig,
      filteredData: this.table.dataManager.getData(),
      activeFilters: this.getActiveFilters()
    });
  }

  /**
   * Clear filter for a specific column
   * @param {string} columnName - Column to clear filter for
   */
  async clearFilter(columnName) {
    if (!this.columnFilters.has(columnName)) return;
    const beforeFilterData = {
      columnName,
      filterConfig: null,
      currentFilters: this.getActiveFilters()
    };
    this.table.eventManager.trigger('beforeFilter', beforeFilterData);
    this.columnFilters.delete(columnName);

    // Update state manager with current filters
    if (this.table.stateManager) {
      this.table.stateManager.updateFilters(this.getActiveFilters());
      this.table.stateManager.resetPage();
    }
    if (this.options.mode === 'server') {
      await this.table.refreshTable();
    } else {
      this._filterClient();
      await this.table.refreshTable();
    }
    this.updateFilterIndicators();
    this.table.eventManager.trigger('afterFilter', {
      columnName,
      filterConfig: null,
      filteredData: this.table.dataManager.getData(),
      activeFilters: this.getActiveFilters()
    });
  }

  /**
   * Clear all filters
   */
  async clearAllFilters() {
    if (this.columnFilters.size === 0) return;
    const beforeFilterData = {
      columnName: null,
      filterConfig: null,
      currentFilters: this.getActiveFilters()
    };
    this.table.eventManager.trigger('beforeFilter', beforeFilterData);
    this.columnFilters.clear();

    // Update state manager with empty filters
    if (this.table.stateManager) {
      this.table.stateManager.updateFilters({});
      this.table.stateManager.resetPage();
    }
    if (this.options.mode === 'server') {
      await this.table.refreshTable();
    } else {
      this._filterClient();
      await this.table.refreshTable();
    }
    this.updateFilterIndicators();
    this.table.eventManager.trigger('afterFilter', {
      columnName: null,
      filterConfig: null,
      filteredData: this.table.dataManager.getData(),
      activeFilters: this.getActiveFilters()
    });
  }

  /**
   * Get active filters
   * @returns {Object} Active filters by column
   */
  getActiveFilters() {
    const activeFilters = {};
    for (const [columnName, filterState] of this.columnFilters) {
      if (filterState.isActive) {
        activeFilters[columnName] = filterState.config;
      }
    }
    return activeFilters;
  }

  /**
   * Get unique values for a column (for value filtering)
   * @param {string} columnName - Column name
   * @returns {Array} Unique values
   */
  getColumnUniqueValues(columnName) {
    // For server mode, use the current filtered data (what's loaded from server)
    // For client mode, use the original data
    const data = this.options.mode === 'server' ? this.table.dataManager.filteredData : this.table.dataManager.originalData;
    const values = new Set();
    let hasComplexData = false;
    data.forEach(row => {
      const value = row[columnName];
      if (value !== null && value !== undefined) {
        // Check if value is a complex object (not a primitive or Date)
        if (typeof value === 'object' && !(value instanceof Date)) {
          hasComplexData = true;
          return; // Skip complex objects
        }
        values.add(String(value));
      }
    });

    // If column contains complex data (objects), return empty array
    // This will disable value-based filtering for columns with nested/complex data
    if (hasComplexData && values.size === 0) {
      return [];
    }
    return Array.from(values).sort();
  }

  /**
   * Get filter state for a column
   * @param {string} columnName - Column name
   * @returns {Object|null} Filter state
   */
  getColumnFilter(columnName) {
    return this.columnFilters.get(columnName) || null;
  }

  /**
   * Check if column has active filter
   * @param {string} columnName - Column name
   * @returns {boolean} Whether column has active filter
   */
  hasColumnFilter(columnName) {
    const filter = this.columnFilters.get(columnName);
    return filter && filter.isActive;
  }

  /**
   * Validate filter configuration
   * @param {Object} filterConfig - Filter configuration
   * @returns {boolean} Whether config is valid
   */
  validateFilterConfig(filterConfig) {
    if (!filterConfig || !filterConfig.type) return false;
    if (filterConfig.type === 'value') {
      return Array.isArray(filterConfig.values);
    }
    if (filterConfig.type === 'condition') {
      return Array.isArray(filterConfig.conditions) && filterConfig.conditions.every(cond => cond.operator && this.operators[cond.operator]);
    }
    return false;
  }

  /**
   * Check if filter config represents an active filter
   * @param {Object} filterConfig - Filter configuration
   * @returns {boolean} Whether filter is active
   */
  isFilterActive(filterConfig) {
    if (!filterConfig) return false;
    if (filterConfig.type === 'value') {
      return filterConfig.values && filterConfig.values.length > 0;
    }
    if (filterConfig.type === 'condition') {
      return filterConfig.conditions && filterConfig.conditions.some(cond => cond.operator && cond.operator !== 'none' && (cond.operator === 'isEmpty' || cond.operator === 'isNotEmpty' || cond.value !== undefined));
    }
    return false;
  }

  /**
   * Client-side filtering
   * @private
   */
  _filterClient() {
    const originalData = this.table.dataManager.originalData;
    const activeFilters = this.getActiveFilters();
    let filteredData;
    if (Object.keys(activeFilters).length === 0) {
      // No filters, show all data
      filteredData = [...originalData];
    } else {
      // Apply all active filters
      filteredData = originalData.filter(row => {
        return Object.entries(activeFilters).every(([columnName, filterConfig]) => {
          return this._testRowAgainstFilter(row, columnName, filterConfig);
        });
      });
    }

    // Update DataManager with filtered data
    this.table.dataManager.setFilteredData(filteredData);
  }

  /**
   * Server-side filtering (DEPRECATED - now handled by unified loader)
   * @deprecated Use unified _loadServerData in Table.js
   * @private
   */
  async _filterServer() {
    // This method is deprecated and should not be called anymore
    // Filtering in server mode is now handled by the unified _loadServerData method
    console.warn('_filterServer is deprecated. Server filtering now uses unified data loading.');
    if (!this.options.serverFilterLoader) {
      console.warn('TablixJS: Server-side filtering enabled but no serverFilterLoader provided');
      return;
    }
    try {
      const result = await this.options.serverFilterLoader({
        filters: this.getActiveFilters(),
        sort: this.table.sortingManager ? this.table.sortingManager.currentSort : null,
        page: this.table.paginationManager ? this.table.paginationManager.currentPage : 1,
        pageSize: this.table.paginationManager ? this.table.paginationManager.pageSize : 10
      });
      this.table.dataManager.setServerData(result.data, result.totalRows);
    } catch (error) {
      console.error('Failed to load filtered data from server:', error);
      throw error;
    }
  }

  /**
   * Test a row against a filter
   * @param {Object} row - Data row
   * @param {string} columnName - Column name
   * @param {Object} filterConfig - Filter configuration
   * @returns {boolean} Whether row passes filter
   * @private
   */
  _testRowAgainstFilter(row, columnName, filterConfig) {
    const cellValue = row[columnName];
    if (filterConfig.type === 'value') {
      // Value filter: check if cell value is in selected values
      // Handle complex objects by converting to string safely
      const cellValueStr = this._valueToString(cellValue);
      return filterConfig.values.includes(cellValueStr);
    }
    if (filterConfig.type === 'condition') {
      // Condition filter: test all conditions (AND logic)
      return filterConfig.conditions.every(condition => {
        const operator = this.operators[condition.operator];
        if (!operator) return true; // Unknown operator, pass

        return operator.apply(cellValue, condition.value);
      });
    }
    return true;
  }

  /**
   * Update filter indicators in the UI
   */
  updateFilterIndicators() {
    const headers = this.table.container.querySelectorAll('.tablix-th');
    headers.forEach(header => {
      const columnName = header.dataset.column;
      const hasFilter = this.hasColumnFilter(columnName);
      const filterIndicator = header.querySelector('.tablix-filter-indicator');
      if (hasFilter) {
        header.classList.add('tablix-filtered');
        if (filterIndicator) {
          filterIndicator.classList.add('tablix-filter-active');

          // Update badge if enabled
          if (this.options.showBadges) {
            this._updateFilterBadge(header, columnName);
          }
        }
      } else {
        header.classList.remove('tablix-filtered');
        if (filterIndicator) {
          filterIndicator.classList.remove('tablix-filter-active');
          const badge = filterIndicator.querySelector('.tablix-filter-badge');
          if (badge) badge.remove();
        }
      }
    });
  }

  /**
   * Update filter badge for a column
   * @param {Element} header - Header element
   * @param {string} columnName - Column name
   * @private
   */
  _updateFilterBadge(header, columnName) {
    const filterIndicator = header.querySelector('.tablix-filter-indicator');
    if (!filterIndicator) return;
    const filter = this.getColumnFilter(columnName);
    if (!filter || !filter.isActive) return;
    let badgeText = '';
    if (filter.type === 'value') {
      badgeText = filter.config.values.length.toString();
    } else if (filter.type === 'condition') {
      const activeConditions = filter.config.conditions.filter(cond => cond.operator && cond.operator !== 'none');
      badgeText = activeConditions.length.toString();
    }
    let badge = filterIndicator.querySelector('.tablix-filter-badge');
    if (!badge && badgeText) {
      badge = document.createElement('span');
      badge.className = 'tablix-filter-badge';
      filterIndicator.appendChild(badge);
    }
    if (badge) {
      badge.textContent = badgeText;
    }
  }

  /**
   * Convert a value to string safely, handling complex objects
   * @param {*} value - Value to convert
   * @returns {string} String representation
   * @private
   */
  _valueToString(value) {
    if (value === null || value === undefined) {
      return '';
    }
    if (typeof value === 'object' && !(value instanceof Date)) {
      // For complex objects, use JSON stringify for comparison
      return JSON.stringify(value);
    }
    return String(value);
  }

  /**
   * Register a custom filter operator
   * @param {string} name - Operator name
   * @param {Object} operator - Operator definition
   */
  registerOperator(name, operator) {
    if (!operator.label || typeof operator.apply !== 'function') {
      throw new Error('TablixJS: Custom operator must have label and apply function');
    }
    this.operators[name] = operator;
  }

  /**
   * Get available operators
   * @returns {Object} Available operators
   */
  getOperators() {
    return {
      ...this.operators
    };
  }
}

/**
 * FilterUI - User interface components for TablixJS filtering
 * Handles dropdown creation, event binding, and filter interactions
 */
class FilterUI {
  constructor(filterManager) {
    this.filterManager = filterManager;
    this.table = filterManager.table;

    // Track open dropdowns
    this.activeDropdown = null;

    // Bind methods to preserve context
    this.handleDocumentClick = this.handleDocumentClick.bind(this);
    this.handleFilterIconClick = this.handleFilterIconClick.bind(this);

    // Initialize event listeners
    this.init();
  }

  /**
   * Initialize the FilterUI
   */
  init() {
    // Add document click listener to close dropdowns
    document.addEventListener('click', this.handleDocumentClick);
  }

  /**
   * Check if a column contains complex data (objects)
   * Complex data columns cannot use value-based filtering
   * 
   * @param {string} columnName - Column name to check
   * @returns {boolean} True if column contains complex data
   * 
   * FUTURE IMPLEMENTATION:
   * - Could add configuration option to enable filtering on specific object properties
   * - Could support custom filter functions for complex data columns
   * - Could allow filtering on rendered output instead of raw data
   */
  _hasComplexData(columnName) {
    const data = this.table.dataManager.originalData || [];

    // Check first non-null value to determine if column has complex data
    for (let i = 0; i < Math.min(data.length, 100); i++) {
      const value = data[i][columnName];
      if (value !== null && value !== undefined) {
        // Check if value is a complex object (not a primitive or Date)
        if (typeof value === 'object' && !(value instanceof Date)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Destroy FilterUI and clean up event listeners
   */
  destroy() {
    document.removeEventListener('click', this.handleDocumentClick);
    this.closeAllDropdowns();
  }

  /**
   * Render filter icons in table headers
   * Note: Filter icons are not rendered for columns with complex data (objects)
   * as value-based filtering is not supported for such columns.
   */
  renderFilterIcons() {
    const headers = this.table.container.querySelectorAll('.tablix-th');
    headers.forEach(header => {
      const columnName = header.dataset.column;
      if (!columnName) return;
      const thContent = header.querySelector('.tablix-th-content');
      if (!thContent) return;

      // Skip rendering filter icon for columns with complex data
      // Complex data (objects) cannot use value-based filtering
      if (this._hasComplexData(columnName)) {
        return;
      }

      // Check if filter icon already exists
      let filterIndicator = header.querySelector('.tablix-filter-indicator');
      if (filterIndicator) {
        // Update existing filter indicator with new translations
        const filterIcon = filterIndicator.querySelector('.tablix-filter-icon');
        if (filterIcon) {
          filterIcon.title = this.table.t('filter.filterColumn');
        }
        return;
      }

      // Create new filter indicator
      filterIndicator = document.createElement('span');
      filterIndicator.className = 'tablix-filter-indicator';
      filterIndicator.innerHTML = `
        <span class="tablix-filter-icon" title="${this.table.t('filter.filterColumn')}">🞃</span>
      `;

      // Add click handler
      filterIndicator.addEventListener('click', e => {
        e.stopPropagation();
        this.handleFilterIconClick(columnName, filterIndicator);
      });

      // Insert after sort indicator or at end
      const sortIndicator = thContent.querySelector('.tablix-sort-indicator');
      if (sortIndicator) {
        thContent.insertBefore(filterIndicator, sortIndicator.nextSibling);
      } else {
        thContent.appendChild(filterIndicator);
      }
    });
  }

  /**
   * Handle filter icon click
   * @param {string} columnName - Column name
   * @param {Element} filterIndicator - Filter indicator element
   */
  handleFilterIconClick(columnName, filterIndicator) {
    // Close any existing dropdown
    this.closeAllDropdowns();

    // Create and show dropdown
    const dropdown = this.createFilterDropdown(columnName);
    this.showDropdown(dropdown, filterIndicator);
    this.activeDropdown = {
      dropdown,
      columnName
    };
  }

  /**
   * Handle document clicks to close dropdowns
   * @param {Event} event - Click event
   */
  handleDocumentClick(event) {
    if (this.activeDropdown) {
      const dropdown = this.activeDropdown.dropdown;
      if (!dropdown.contains(event.target)) {
        this.closeAllDropdowns();
      }
    }
  }

  /**
   * Create filter dropdown for a column
   * @param {string} columnName - Column name
   * @returns {Element} Dropdown element
   */
  createFilterDropdown(columnName) {
    const dropdown = document.createElement('div');
    dropdown.className = 'tablix-filter-dropdown';
    dropdown.innerHTML = this.renderDropdownContent(columnName);

    // Add event listeners
    this.bindDropdownEvents(dropdown, columnName);
    return dropdown;
  }

  /**
   * Render dropdown content
   * @param {string} columnName - Column name
   * @returns {string} HTML content
   */
  renderDropdownContent(columnName) {
    const currentFilter = this.filterManager.getColumnFilter(columnName);
    return `
      <div class="tablix-filter-dropdown-header">
        <h4>${this.table.t('filter.filter')}: ${columnName}</h4>
        <button class="tablix-filter-close" type="button">×</button>
      </div>
      
      <div class="tablix-filter-tabs">
        <button class="tablix-filter-tab ${!currentFilter || currentFilter.type === 'value' ? 'active' : ''}" 
                data-tab="value">${this.table.t('filter.filterByValue')}</button>
        <button class="tablix-filter-tab ${currentFilter && currentFilter.type === 'condition' ? 'active' : ''}" 
                data-tab="condition">${this.table.t('filter.filterByCondition')}</button>
      </div>
      
      <div class="tablix-filter-content">
        <div class="tablix-filter-panel tablix-filter-value-panel ${!currentFilter || currentFilter.type === 'value' ? 'active' : ''}">
          ${this.renderValueFilterPanel(columnName, currentFilter)}
        </div>
        
        <div class="tablix-filter-panel tablix-filter-condition-panel ${currentFilter && currentFilter.type === 'condition' ? 'active' : ''}">
          ${this.renderConditionFilterPanel(columnName, currentFilter)}
        </div>
      </div>
      
      <div class="tablix-filter-actions">
        <button class="tablix-filter-apply" type="button">${this.table.t('filter.apply')}</button>
        <button class="tablix-filter-clear" type="button">${this.table.t('filter.clear')}</button>
        <button class="tablix-filter-cancel" type="button">${this.table.t('filter.cancel')}</button>
      </div>
    `;
  }

  /**
   * Render value filter panel (checkbox list)
   * @param {string} columnName - Column name
   * @param {Object|null} currentFilter - Current filter state
   * @returns {string} HTML content
   */
  renderValueFilterPanel(columnName, currentFilter) {
    const uniqueValues = this.filterManager.getColumnUniqueValues(columnName);
    const selectedValues = currentFilter && currentFilter.type === 'value' ? currentFilter.config.values : [];
    if (uniqueValues.length === 0) {
      // Check if the column contains complex data by sampling the first row
      const data = this.table.dataManager.originalData;
      const hasComplexData = data.length > 0 && typeof data[0][columnName] === 'object' && !(data[0][columnName] instanceof Date);
      const message = hasComplexData ? this.table.t('filter.complexDataNotSupported') || 'Value filtering is not available for columns with complex data. Use Condition filtering instead.' : this.table.t('filter.noValuesAvailable');
      return `<p class="tablix-filter-empty">${message}</p>`;
    }
    let html = `
      <div class="tablix-filter-search">
        <input type="text" 
               id="tablix-filter-search-${columnName}" 
               name="filter-search-${columnName}"
               placeholder="${this.table.t('filter.searchValues')}" 
               class="tablix-filter-search-input">
      </div>
      <div class="tablix-filter-select-all">
        <label>
          <input type="checkbox" 
                 id="tablix-filter-select-all-${columnName}" 
                 name="filter-select-all-${columnName}"
                 class="tablix-filter-select-all-checkbox"> ${this.table.t('filter.selectAll')}
        </label>
      </div>
      <div class="tablix-filter-values">
    `;
    uniqueValues.forEach((value, index) => {
      const isChecked = selectedValues.includes(value);
      const valueId = `tablix-filter-value-${columnName}-${index}`;
      html += `
        <label class="tablix-filter-value-item">
          <input type="checkbox" 
                 id="${valueId}" 
                 name="filter-value-${columnName}" 
                 value="${this.escapeHtml(value)}" 
                 ${isChecked ? 'checked' : ''}>
          <span class="tablix-filter-value-text">${this.escapeHtml(value)}</span>
        </label>
      `;
    });
    html += '</div>';
    return html;
  }

  /**
   * Render condition filter panel
   * @param {string} columnName - Column name
   * @param {Object|null} currentFilter - Current filter state
   * @returns {string} HTML content
   */
  renderConditionFilterPanel(columnName, currentFilter) {
    const conditions = currentFilter && currentFilter.type === 'condition' ? currentFilter.config.conditions : [{
      operator: 'none',
      value: ''
    }];
    let html = '<div class="tablix-filter-conditions">';
    conditions.forEach((condition, index) => {
      html += this.renderConditionRow(condition, index);
    });
    html += `
      </div>
      <button class="tablix-filter-add-condition" type="button">+ ${this.table.t('filter.addCondition')}</button>
    `;
    return html;
  }

  /**
   * Render a single condition row
   * @param {Object} condition - Condition object
   * @param {number} index - Condition index
   * @returns {string} HTML content
   */
  renderConditionRow(condition, index) {
    const operators = this.filterManager.getOperators();
    const needsValue = condition.operator && !['none', 'isEmpty', 'isNotEmpty'].includes(condition.operator);
    let html = `
      <div class="tablix-filter-condition" data-index="${index}">
        <select class="tablix-filter-operator" 
                id="tablix-filter-operator-${index}" 
                name="filter-operator-${index}">
    `;
    Object.entries(operators).forEach(([key, op]) => {
      const selected = condition.operator === key ? ' selected' : '';
      html += `<option value="${key}"${selected}>${op.label}</option>`;
    });
    html += `
        </select>
        <input type="text" 
               id="tablix-filter-value-${index}" 
               name="filter-value-${index}"
               class="tablix-filter-value" 
               placeholder="${this.table.t('filter.value')}" 
               value="${this.escapeHtml(condition.value || '')}"
               ${needsValue ? '' : 'disabled'}>
        <button class="tablix-filter-remove-condition" 
                type="button" 
                data-index="${index}"
                title="${this.table.t('filter.removeCondition')}">×</button>
      </div>
    `;
    return html;
  }

  /**
   * Bind dropdown event listeners
   * @param {Element} dropdown - Dropdown element
   * @param {string} columnName - Column name
   */
  bindDropdownEvents(dropdown, columnName) {
    // Tab switching
    dropdown.querySelectorAll('.tablix-filter-tab').forEach(tab => {
      tab.addEventListener('click', e => {
        const tabType = e.target.dataset.tab;
        this.switchTab(dropdown, tabType);
      });
    });

    // Close button
    dropdown.querySelector('.tablix-filter-close').addEventListener('click', () => {
      this.closeAllDropdowns();
    });

    // Action buttons
    dropdown.querySelector('.tablix-filter-apply').addEventListener('click', () => {
      this.applyFilter(dropdown, columnName);
    });
    dropdown.querySelector('.tablix-filter-clear').addEventListener('click', () => {
      this.clearFilter(columnName);
    });
    dropdown.querySelector('.tablix-filter-cancel').addEventListener('click', () => {
      this.closeAllDropdowns();
    });

    // Value filter events
    this.bindValueFilterEvents(dropdown, columnName);

    // Condition filter events
    this.bindConditionFilterEvents(dropdown, columnName);
  }

  /**
   * Bind value filter events
   * @param {Element} dropdown - Dropdown element
   * @param {string} columnName - Column name
   */
  bindValueFilterEvents(dropdown, columnName) {
    const valuePanel = dropdown.querySelector('.tablix-filter-value-panel');
    if (!valuePanel) return;

    // Search input with debouncing
    const searchInput = valuePanel.querySelector('.tablix-filter-search-input');
    if (searchInput) {
      let searchTimeout;
      searchInput.addEventListener('input', e => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          this.filterValueList(valuePanel, e.target.value);
        }, this.filterManager.options.debounceDelay || 150);
      });
    }

    // Select all checkbox
    const selectAllCheckbox = valuePanel.querySelector('.tablix-filter-select-all-checkbox');
    if (selectAllCheckbox) {
      selectAllCheckbox.addEventListener('change', e => {
        this.toggleSelectAll(valuePanel, e.target.checked);
      });
    }

    // Individual value checkboxes
    valuePanel.querySelectorAll('.tablix-filter-value-item input[type="checkbox"]').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        this.updateSelectAllState(valuePanel);
      });
    });

    // Update select all state based on current selections
    this.updateSelectAllState(valuePanel);
  }

  /**
   * Bind condition filter events
   * @param {Element} dropdown - Dropdown element
   * @param {string} columnName - Column name
   */
  bindConditionFilterEvents(dropdown, columnName) {
    const conditionPanel = dropdown.querySelector('.tablix-filter-condition-panel');
    if (!conditionPanel) return;

    // Add condition button
    const addButton = conditionPanel.querySelector('.tablix-filter-add-condition');
    if (addButton) {
      addButton.addEventListener('click', () => {
        this.addCondition(conditionPanel);
      });
    }

    // Operator and value changes
    this.bindConditionRowEvents(conditionPanel);
  }

  /**
   * Bind events for condition rows
   * @param {Element} conditionPanel - Condition panel element
   */
  bindConditionRowEvents(conditionPanel) {
    // Operator changes
    conditionPanel.querySelectorAll('.tablix-filter-operator').forEach(select => {
      select.addEventListener('change', e => {
        const valueInput = e.target.parentElement.querySelector('.tablix-filter-value');
        const needsValue = !['none', 'isEmpty', 'isNotEmpty'].includes(e.target.value);
        valueInput.disabled = !needsValue;
        if (!needsValue) valueInput.value = '';
      });
    });

    // Remove condition buttons
    conditionPanel.querySelectorAll('.tablix-filter-remove-condition').forEach(button => {
      button.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation(); // Prevent dropdown from closing

        const conditionRow = e.target.closest('.tablix-filter-condition');
        const conditionsContainer = conditionPanel.querySelector('.tablix-filter-conditions');
        if (conditionsContainer.querySelectorAll('.tablix-filter-condition').length > 1) {
          conditionRow.remove();
        } else {
          // If it's the last condition, reset it to "none" instead of removing
          const operatorSelect = conditionRow.querySelector('.tablix-filter-operator');
          const valueInput = conditionRow.querySelector('.tablix-filter-value');
          operatorSelect.value = 'none';
          valueInput.value = '';
          valueInput.disabled = true;
        }
      });
    });
  }

  /**
   * Switch between filter tabs
   * @param {Element} dropdown - Dropdown element
   * @param {string} tabType - Tab type ('value' or 'condition')
   */
  switchTab(dropdown, tabType) {
    // Update tab buttons
    dropdown.querySelectorAll('.tablix-filter-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabType);
    });

    // Update panels
    dropdown.querySelectorAll('.tablix-filter-panel').forEach(panel => {
      const isActive = panel.classList.contains(`tablix-filter-${tabType}-panel`);
      panel.classList.toggle('active', isActive);
    });
  }

  /**
   * Filter value list based on search
   * @param {Element} valuePanel - Value panel element
   * @param {string} searchTerm - Search term
   */
  filterValueList(valuePanel, searchTerm) {
    const items = valuePanel.querySelectorAll('.tablix-filter-value-item');
    const term = searchTerm.toLowerCase();
    items.forEach(item => {
      const text = item.querySelector('.tablix-filter-value-text').textContent.toLowerCase();
      const matches = text.includes(term);
      item.style.display = matches ? '' : 'none';
    });
  }

  /**
   * Toggle select all checkboxes
   * @param {Element} valuePanel - Value panel element
   * @param {boolean} checked - Whether to check all
   */
  toggleSelectAll(valuePanel, checked) {
    const checkboxes = valuePanel.querySelectorAll('.tablix-filter-value-item input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
      const item = checkbox.closest('.tablix-filter-value-item');
      if (item.style.display !== 'none') {
        checkbox.checked = checked;
      }
    });
  }

  /**
   * Update select all checkbox state
   * @param {Element} valuePanel - Value panel element
   */
  updateSelectAllState(valuePanel) {
    const selectAllCheckbox = valuePanel.querySelector('.tablix-filter-select-all-checkbox');
    if (!selectAllCheckbox) return;
    const checkboxes = valuePanel.querySelectorAll('.tablix-filter-value-item input[type="checkbox"]');
    const visibleCheckboxes = Array.from(checkboxes).filter(cb => cb.closest('.tablix-filter-value-item').style.display !== 'none');
    const checkedCount = visibleCheckboxes.filter(cb => cb.checked).length;
    selectAllCheckbox.checked = checkedCount > 0 && checkedCount === visibleCheckboxes.length;
    selectAllCheckbox.indeterminate = checkedCount > 0 && checkedCount < visibleCheckboxes.length;
  }

  /**
   * Add a new condition row
   * @param {Element} conditionPanel - Condition panel element
   */
  addCondition(conditionPanel) {
    const conditionsContainer = conditionPanel.querySelector('.tablix-filter-conditions');
    const newIndex = conditionsContainer.children.length;
    const conditionHtml = this.renderConditionRow({
      operator: 'none',
      value: ''
    }, newIndex);
    conditionsContainer.insertAdjacentHTML('beforeend', conditionHtml);

    // Bind events for the new condition only
    const newCondition = conditionsContainer.lastElementChild;

    // Bind operator change event
    const operatorSelect = newCondition.querySelector('.tablix-filter-operator');
    operatorSelect.addEventListener('change', e => {
      const valueInput = e.target.parentElement.querySelector('.tablix-filter-value');
      const needsValue = !['none', 'isEmpty', 'isNotEmpty'].includes(e.target.value);
      valueInput.disabled = !needsValue;
      if (!needsValue) valueInput.value = '';
    });

    // Bind remove button event
    const removeButton = newCondition.querySelector('.tablix-filter-remove-condition');
    removeButton.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation(); // Prevent dropdown from closing

      const conditionRow = e.target.closest('.tablix-filter-condition');
      const conditionsContainer = conditionPanel.querySelector('.tablix-filter-conditions');
      if (conditionsContainer.querySelectorAll('.tablix-filter-condition').length > 1) {
        conditionRow.remove();
      } else {
        // If it's the last condition, reset it to "none" instead of removing
        const operatorSelect = conditionRow.querySelector('.tablix-filter-operator');
        const valueInput = conditionRow.querySelector('.tablix-filter-value');
        operatorSelect.value = 'none';
        valueInput.value = '';
        valueInput.disabled = true;
      }
    });
  }

  /**
   * Apply current filter settings
   * @param {Element} dropdown - Dropdown element
   * @param {string} columnName - Column name
   */
  async applyFilter(dropdown, columnName) {
    const activeTab = dropdown.querySelector('.tablix-filter-tab.active').dataset.tab;
    let filterConfig;
    if (activeTab === 'value') {
      filterConfig = this.collectValueFilter(dropdown);
    } else {
      filterConfig = this.collectConditionFilter(dropdown);
    }
    await this.filterManager.applyFilter(columnName, filterConfig);
    this.closeAllDropdowns();
  }

  /**
   * Collect value filter configuration
   * @param {Element} dropdown - Dropdown element
   * @returns {Object} Filter configuration
   */
  collectValueFilter(dropdown) {
    const valuePanel = dropdown.querySelector('.tablix-filter-value-panel');
    const checkboxes = valuePanel.querySelectorAll('.tablix-filter-value-item input[type="checkbox"]:checked');
    const values = Array.from(checkboxes).map(cb => cb.value);
    return {
      type: 'value',
      values: values
    };
  }

  /**
   * Collect condition filter configuration
   * @param {Element} dropdown - Dropdown element
   * @returns {Object} Filter configuration
   */
  collectConditionFilter(dropdown) {
    const conditionPanel = dropdown.querySelector('.tablix-filter-condition-panel');
    const conditionRows = conditionPanel.querySelectorAll('.tablix-filter-condition');
    const conditions = Array.from(conditionRows).map(row => {
      const operator = row.querySelector('.tablix-filter-operator').value;
      const value = row.querySelector('.tablix-filter-value').value;
      return {
        operator,
        value
      };
    }).filter(cond => cond.operator !== 'none');
    return {
      type: 'condition',
      conditions: conditions
    };
  }

  /**
   * Clear filter for column
   * @param {string} columnName - Column name
   */
  async clearFilter(columnName) {
    await this.filterManager.clearFilter(columnName);
    this.closeAllDropdowns();
  }

  /**
   * Show dropdown positioned relative to trigger element
   * @param {Element} dropdown - Dropdown element
   * @param {Element} trigger - Trigger element
   */
  showDropdown(dropdown, trigger) {
    document.body.appendChild(dropdown);

    // Make dropdown visible but off-screen to measure it
    dropdown.style.position = 'absolute';
    dropdown.style.top = '-9999px';
    dropdown.style.left = '-9999px';
    dropdown.style.display = 'block';
    dropdown.style.visibility = 'hidden';

    // Force reflow to ensure accurate measurements
    dropdown.offsetHeight;

    // Get accurate measurements
    const triggerRect = trigger.getBoundingClientRect();
    const dropdownRect = dropdown.getBoundingClientRect();
    let left = triggerRect.left + window.scrollX;
    let top = triggerRect.bottom + window.scrollY + 5;

    // Adjust if dropdown goes off screen
    if (left + dropdownRect.width > window.innerWidth + window.scrollX) {
      left = window.innerWidth + window.scrollX - dropdownRect.width - 10;
    }
    if (top + dropdownRect.height > window.innerHeight + window.scrollY) {
      top = triggerRect.top + window.scrollY - dropdownRect.height - 5;
    }

    // Ensure dropdown stays within viewport
    left = Math.max(window.scrollX + 10, left);
    top = Math.max(window.scrollY + 10, top);

    // Apply final positioning and make visible
    dropdown.style.left = `${left}px`;
    dropdown.style.top = `${top}px`;
    dropdown.style.visibility = 'visible';
  }

  /**
   * Close all open dropdowns
   */
  closeAllDropdowns() {
    if (this.activeDropdown) {
      this.activeDropdown.dropdown.remove();
      this.activeDropdown = null;
    }
  }

  /**
   * Escape HTML to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

/**
 * SearchManager - Global search functionality for TablixJS
 * Provides real-time search across all table columns
 */
class SearchManager {
  constructor(table, options = {}) {
    this.table = table;
    this.options = {
      enabled: true,
      placeholder: 'Search...',
      searchDelay: 300,
      // Debounce delay in milliseconds
      caseSensitive: false,
      searchColumns: [],
      // Empty array means search all columns
      minLength: 1,
      // Minimum characters before search starts (changed from 0 to 1)
      ...options
    };

    // Ensure placeholder is never undefined to prevent "undefined" from showing in UI
    if (!this.options.placeholder) {
      this.options.placeholder = 'Search...';
    }

    // Current search state
    this.currentSearchTerm = '';
    this.searchTimeout = null;
    this.originalData = null;

    // Bind methods to preserve context
    this.handleSearchInput = this.handleSearchInput.bind(this);
    this.handleSearchClear = this.handleSearchClear.bind(this);
  }

  /**
   * Initialize search functionality
   */
  init() {
    // Store reference to original data
    this.originalData = this.table.dataManager.originalData;

    // Listen for data changes
    this.table.eventManager.on('afterLoad', data => {
      this.originalData = data.data || data.source;
      // Reapply search if there's an active search term
      if (this.currentSearchTerm) {
        this.performSearch(this.currentSearchTerm);
      }
    });
  }

  /**
   * Bind search events to UI elements
   */
  bindEvents() {
    const searchInput = this.table.container.querySelector('.tablix-search-input');
    const searchClear = this.table.container.querySelector('.tablix-search-clear');
    if (searchInput) {
      // Ensure input value matches current search term
      if (this.currentSearchTerm && searchInput.value !== this.currentSearchTerm) {
        searchInput.value = this.currentSearchTerm;
      }
      searchInput.addEventListener('input', this.handleSearchInput);
      searchInput.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
          this.clearSearch();
        }
      });
    }
    if (searchClear) {
      searchClear.addEventListener('click', this.handleSearchClear);
    }

    // Update clear button visibility
    this.updateClearButtonVisibility();
  }

  /**
   * Handle search input with debouncing
   * @param {Event} event - Input event
   */
  handleSearchInput(event) {
    const searchTerm = event.target.value;

    // Clear existing timeout
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    // Debounce search based on configurable delay
    this.searchTimeout = setTimeout(() => {
      this.performSearch(searchTerm);
    }, this.options.searchDelay);
  }

  /**
   * Handle search clear button
   * @param {Event} event - Click event
   */
  handleSearchClear(event) {
    event.preventDefault();
    this.clearSearch();
  }

  /**
   * Perform the actual search
   * @param {string} searchTerm - Search term
   */
  async performSearch(searchTerm) {
    const previousTerm = this.currentSearchTerm;

    // Capture focus state before performing search
    const searchInput = this.table.container.querySelector('.tablix-search-input');
    const hadFocus = searchInput && document.activeElement === searchInput;
    const cursorPosition = searchInput ? searchInput.selectionStart || 0 : 0;

    // Trigger beforeSearch event with more detailed information
    const beforeSearchData = {
      searchTerm,
      previousTerm,
      minLength: this.options.minLength,
      searchDelay: this.options.searchDelay,
      willSearch: searchTerm.length >= this.options.minLength
    };
    this.table.eventManager.trigger('beforeSearch', beforeSearchData);
    this.currentSearchTerm = searchTerm;

    // Update state manager with search term
    if (this.table.stateManager) {
      this.table.stateManager.updateSearch(searchTerm);
      // Reset to first page when search changes
      this.table.stateManager.resetPage();
    }

    // Check if we're in server mode
    const isServerMode = this.table._isServerMode && this.table._isServerMode();
    if (isServerMode) {
      // Server mode - let refreshTable handle the server request with search param
      // Reset pagination to first page
      if (this.table.paginationManager) {
        this.table.paginationManager.currentPage = 1;
      }
      await this.table.refreshTable();
    } else {
      // Client mode - filter data locally
      if (searchTerm.length < this.options.minLength) {
        this.table.dataManager.filteredData = [...this.originalData];
      } else {
        const filteredData = this.filterData(searchTerm);
        this.table.dataManager.filteredData = filteredData;
      }

      // Reset pagination to first page
      if (this.table.paginationManager) {
        this.table.paginationManager.resetToFirstPage();
      } else {
        // If no pagination manager, just refresh
        await this.table.refreshTable();
      }
    }

    // Restore focus after table refresh if it had focus before
    if (hadFocus) {
      requestAnimationFrame(() => {
        const newSearchInput = this.table.container.querySelector('.tablix-search-input');
        if (newSearchInput) {
          newSearchInput.focus();
          if (cursorPosition > 0 && cursorPosition <= newSearchInput.value.length) {
            newSearchInput.setSelectionRange(cursorPosition, cursorPosition);
          }
        }
      });
    }

    // Trigger afterSearch event with detailed results
    const afterSearchData = {
      searchTerm,
      previousTerm,
      resultsCount: this.table.dataManager.filteredData.length,
      totalCount: this.originalData.length,
      isActive: this.isSearchActive(),
      searchPerformed: searchTerm.length >= this.options.minLength
    };
    this.table.eventManager.trigger('afterSearch', afterSearchData);

    // Update search clear button visibility
    this.updateClearButtonVisibility();
  }

  /**
   * Filter data based on search term
   * @param {string} searchTerm - Search term
   * @returns {Array} Filtered data
   */
  filterData(searchTerm) {
    if (!searchTerm || searchTerm.trim() === '') {
      return [...this.originalData];
    }
    const term = this.options.caseSensitive ? searchTerm : searchTerm.toLowerCase();
    const columns = this.getSearchableColumns();
    return this.originalData.filter(row => {
      return columns.some(columnName => {
        const cellValue = row[columnName];
        if (cellValue === null || cellValue === undefined) {
          return false;
        }

        // Skip complex objects (not primitive values or Dates) in search
        if (typeof cellValue === 'object' && !(cellValue instanceof Date)) {
          return false;
        }
        const stringValue = this.options.caseSensitive ? String(cellValue) : String(cellValue).toLowerCase();
        return stringValue.includes(term);
      });
    });
  }

  /**
   * Get columns to search in
   * @returns {Array} Array of column names
   */
  getSearchableColumns() {
    // If specific columns are configured, use those
    if (this.options.searchColumns && this.options.searchColumns.length > 0) {
      return this.options.searchColumns;
    }

    // Otherwise, search all available columns
    const columns = this.table.columnManager ? this.table.columnManager.getColumns() : this.table.options.columns || [];
    return columns.map(col => col.name || col.key).filter(name => name);
  }

  /**
   * Clear search
   */
  async clearSearch() {
    // Clear search input using the helper method
    this.updateInputValue('');

    // Clear search timeout
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = null;
    }

    // Perform empty search to reset data
    await this.performSearch('');
  }

  /**
   * Update clear button visibility
   */
  updateClearButtonVisibility() {
    const searchClear = this.table.container.querySelector('.tablix-search-clear');
    if (searchClear) {
      searchClear.style.display = this.currentSearchTerm ? 'block' : 'none';
    }
  }

  /**
   * Update input value without triggering search
   * @param {string} value - Value to set
   */
  updateInputValue(value) {
    const searchInput = this.table.container.querySelector('.tablix-search-input');
    if (searchInput && searchInput.value !== value) {
      searchInput.value = value;
    }
  }

  /**
   * Set search term programmatically
   * @param {string} searchTerm - Search term
   */
  async setSearchTerm(searchTerm) {
    // Update input value
    this.updateInputValue(searchTerm);

    // Clear any pending search timeout
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = null;
    }

    // Perform search immediately
    await this.performSearch(searchTerm);
  }

  /**
   * Get current search term
   * @returns {string} Current search term
   */
  getSearchTerm() {
    return this.currentSearchTerm;
  }

  /**
   * Check if search is active
   * @returns {boolean} Whether search is active
   */
  isSearchActive() {
    return this.currentSearchTerm && this.currentSearchTerm.length >= this.options.minLength;
  }

  /**
   * Get search results count
   * @returns {Object} Search results information
   */
  getSearchInfo() {
    return {
      searchTerm: this.currentSearchTerm,
      resultsCount: this.table.dataManager.filteredData.length,
      totalCount: this.originalData.length,
      isActive: this.isSearchActive()
    };
  }

  /**
   * Configure search options
   * @param {Object} newOptions - New options to merge
   */
  configure(newOptions) {
    const oldOptions = {
      ...this.options
    };
    this.options = {
      ...this.options,
      ...newOptions
    };

    // Ensure placeholder is never undefined
    if (!this.options.placeholder) {
      this.options.placeholder = 'Search...';
    }

    // Update placeholder if it changed
    if (newOptions.placeholder && newOptions.placeholder !== oldOptions.placeholder) {
      const searchInput = this.table.container.querySelector('.tablix-search-input');
      if (searchInput) {
        searchInput.placeholder = this.options.placeholder;
      }
    }

    // If minLength changed and we have an active search, re-evaluate
    if (newOptions.minLength !== undefined && this.currentSearchTerm) {
      this.performSearch(this.currentSearchTerm);
    }
  }

  /**
   * Get current search configuration
   * @returns {Object} Current search options
   */
  getConfiguration() {
    return {
      ...this.options
    };
  }

  /**
   * Destroy search manager and clean up
   */
  destroy() {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    const searchInput = this.table.container.querySelector('.tablix-search-input');
    const searchClear = this.table.container.querySelector('.tablix-search-clear');
    if (searchInput) {
      searchInput.removeEventListener('input', this.handleSearchInput);
    }
    if (searchClear) {
      searchClear.removeEventListener('click', this.handleSearchClear);
    }
  }
}

class SelectionManager {
  constructor(table, options = {}) {
    this.table = table;
    this.options = {
      enabled: false,
      mode: 'single',
      // 'single' or 'multi'
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
      originalSelection: null,
      // Backup of selection before drag started
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
    this.table.eventManager.on('rowClick', event => {
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
    const {
      rowData,
      rowIndex,
      originalEvent
    } = event;
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
    tableElement.addEventListener('mousedown', e => {
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
    tableElement.addEventListener('mousemove', e => {
      if (!this.table || !this.dragSelection.isActive) return;
      const deltaX = Math.abs(e.clientX - startX);
      const deltaY = Math.abs(e.clientY - startY);

      // Check if we've moved enough to consider it a drag
      if (!this.dragSelection.isDragging && (deltaX > this.dragSelection.dragThreshold || deltaY > this.dragSelection.dragThreshold)) {
        this.dragSelection.isDragging = true;
        this.startDragSelection();
      }
      if (this.dragSelection.isDragging) {
        this.updateDragSelection(e);
      }
    });

    // Mouse up - complete drag selection
    tableElement.addEventListener('mouseup', e => {
      if (!this.table || !this.dragSelection.isActive) return;
      this.completeDragSelection();
    });

    // Mouse leave - cancel drag selection
    tableElement.addEventListener('mouseleave', e => {
      if (!this.table || !this.dragSelection.isActive) return;
      this.cancelDragSelection();
    });

    // Prevent text selection during drag
    tableElement.addEventListener('selectstart', e => {
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
      hash = (hash << 5) - hash + char;
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
      allRows.forEach(row => {
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
      allRows.forEach(row => {
        // Get global row index from data attribute
        const globalRowIndex = row.hasAttribute('data-row-index') ? parseInt(row.getAttribute('data-row-index')) : -1;
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
class VirtualScrollManager {
  constructor(table, options = {}) {
    this.table = table;
    this.options = {
      enabled: false,
      buffer: 10,
      // Number of rows to render above/below viewport
      rowHeight: null,
      // Auto-detected if null
      throttleDelay: 8,
      // Reduced from 16ms for better responsiveness (~120fps)
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
    this.scrollContainer.addEventListener('scroll', this.handleScrollImmediate.bind(this), {
      passive: true
    });
    this.scrollContainer.addEventListener('scroll', this.throttledScrollHandler, {
      passive: true
    });

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
    this.rowClickHandler = event => {
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
          rowIndex: virtualIndex,
          // Use virtual index as row index
          originalEvent: event,
          element: row
        });

        // Immediately update selection states after click
        setTimeout(() => this.updateSelectionStates(), 0);
      }
    };
    this.scrollContainer.addEventListener('click', this.rowClickHandler);

    // Set up drag selection for virtual scrolling (if selection is enabled and in multi mode)
    if (this.table.selectionManager && this.table.selectionManager.options.enabled && this.table.selectionManager.options.mode === 'multi') {
      this.setupVirtualDragSelection();
    }

    // Delegate row hover events
    this.rowHoverHandler = event => {
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
    this.log('Row height detected', {
      rowHeight: this.rowHeight
    });
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
    if (this.scrollVelocity > 2) {
      // High velocity threshold
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
    this.scrollContainer.addEventListener('mousedown', event => {
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
    this.scrollContainer.addEventListener('mousemove', event => {
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
    const handleMouseUp = event => {
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
    this.scrollContainer.addEventListener('selectstart', event => {
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
    const columns = this.table.columnManager ? this.table.columnManager.getColumns() : this.table.options.columns || [];
    const tr = document.createElement('tr');
    tr.className = 'tablix-row';
    tr.setAttribute('data-row-index', originalIndex); // Keep for compatibility
    tr.setAttribute('data-virtual-index', originalIndex); // Virtual scroll index

    // Add a unique identifier for debugging
    tr.setAttribute('data-row-id', this.table.selectionManager ? this.table.selectionManager.getRowId(rowData) : originalIndex);

    // Apply initial selection state
    const isSelected = this.table.selectionManager && this.table.selectionManager.isRowSelectedByData(rowData);
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
        // Pass the column object instead of just the name to support multiple columns with same field
        const result = this.table.columnManager.formatCellValue(col, cellValue, rowData);
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
    return function () {
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

/**
 * TablixJS Localization Module
 * Provides internationalization support for the table library
 */

class Localization {
  constructor() {
    this.currentLanguage = 'en';
    this.translations = new Map();
    this.fallbackLanguage = 'en';

    // Initialize with English defaults
    this.addTranslations('en', this.getDefaultEnglishTranslations());
  }

  /**
   * Get default English translations (fallback language pack)
   * @returns {Object} English translations object
   */
  getDefaultEnglishTranslations() {
    return {
      // General
      'general.loading': 'Loading...',
      'general.error': 'Error',
      'general.noData': 'No data available',
      'general.show': 'Show',
      'general.entries': 'entries',
      'general.of': 'of',
      'general.to': 'to',
      'general.records': 'records',
      'general.perPage': 'per page',
      'general.showing': 'Showing',
      'general.total': 'Total',
      'general.rows': 'rows',
      // Search
      'search.placeholder': 'Search...',
      'search.clear': 'Clear search',
      'search.noResults': 'No results found',
      'search.resultsFound': 'results found',
      // Pagination
      'pagination.first': 'First',
      'pagination.previous': 'Previous',
      'pagination.next': 'Next',
      'pagination.last': 'Last',
      'pagination.page': 'Page',
      'pagination.pageOf': 'Page {currentPage} of {totalPages}',
      'pagination.showingRecords': 'Showing {startRow}-{endRow} of {totalRows} records',
      'pagination.noRecords': 'No records found',
      'pagination.pageSize': 'Records per page',
      // Sorting
      'sort.sortAscending': 'Sort ascending',
      'sort.sortDescending': 'Sort descending',
      'sort.sortedAscending': 'Sorted ascending',
      'sort.sortedDescending': 'Sorted descending',
      'sort.notSorted': 'Not sorted',
      'sort.clearSort': 'Clear sorting',
      // Selection
      'selection.selectRow': 'Select row',
      'selection.deselectRow': 'Deselect row',
      'selection.selectAll': 'Select all',
      'selection.deselectAll': 'Deselect all',
      'selection.selectedCount': '{count} selected',
      'selection.selectAllVisible': 'Select all visible rows',
      'selection.clearSelection': 'Clear selection',
      // Filtering
      'filter.filter': 'Filter',
      'filter.clearFilter': 'Clear filter',
      'filter.clearAllFilters': 'Clear all filters',
      'filter.applyFilter': 'Apply filter',
      'filter.filterBy': 'Filter by',
      'filter.filterColumn': 'Filter column',
      'filter.filterByValue': 'Filter by Value',
      'filter.filterByCondition': 'Filter by Condition',
      'filter.searchValues': 'Search values...',
      'filter.selectAll': 'Select All',
      'filter.noValuesAvailable': 'No values available',
      'filter.addCondition': 'Add Condition',
      'filter.removeCondition': 'Remove condition',
      'filter.value': 'Value',
      'filter.apply': 'Apply',
      'filter.clear': 'Clear',
      'filter.cancel': 'Cancel',
      'filter.contains': 'Contains',
      'filter.startsWith': 'Starts with',
      'filter.endsWith': 'Ends with',
      'filter.equals': 'Equals',
      'filter.notEquals': 'Not equals',
      'filter.greaterThan': 'Greater than',
      'filter.lessThan': 'Less than',
      'filter.greaterThanOrEqual': 'Greater than or equal',
      'filter.lessThanOrEqual': 'Less than or equal',
      'filter.between': 'Between',
      'filter.isEmpty': 'Is empty',
      'filter.isNotEmpty': 'Is not empty',
      'filter.selectValues': 'Select values',
      'filter.noOptionsAvailable': 'No options available',
      'filter.complexDataNotSupported': 'Value filtering is not available for columns with complex data. Use Condition filtering instead.',
      // Controls
      'controls.refresh': 'Refresh data',
      'controls.export': 'Export data',
      'controls.settings': 'Settings',
      'controls.columns': 'Columns',
      'controls.showColumns': 'Show/Hide columns',
      // Virtual Scrolling
      'virtualScroll.loadingMoreRows': 'Loading more rows...',
      'virtualScroll.scrollToTop': 'Scroll to top',
      'virtualScroll.scrollToBottom': 'Scroll to bottom',
      // Error Messages
      'error.loadingData': 'Failed to load data',
      'error.networkError': 'Network error occurred',
      'error.invalidData': 'Invalid data format',
      'error.serverError': 'Server error occurred',
      'error.timeout': 'Request timed out',
      'error.unknown': 'An unknown error occurred',
      'error.retry': 'Retry',
      // Data Types
      'dataType.string': 'Text',
      'dataType.number': 'Number',
      'dataType.date': 'Date',
      'dataType.boolean': 'Boolean',
      'dataType.currency': 'Currency',
      'dataType.percentage': 'Percentage',
      // Accessibility
      'accessibility.table': 'Data table',
      'accessibility.sortableColumn': 'Sortable column',
      'accessibility.selectableRow': 'Selectable row',
      'accessibility.rowSelected': 'Row selected',
      'accessibility.rowNotSelected': 'Row not selected',
      'accessibility.pageNavigation': 'Page navigation',
      'accessibility.searchInput': 'Search table data',
      'accessibility.filterColumn': 'Filter column',
      // Actions
      'action.apply': 'Apply',
      'action.cancel': 'Cancel',
      'action.close': 'Close',
      'action.save': 'Save',
      'action.reset': 'Reset',
      'action.ok': 'OK',
      'action.yes': 'Yes',
      'action.no': 'No',
      // Time and Date
      'date.today': 'Today',
      'date.yesterday': 'Yesterday',
      'date.thisWeek': 'This week',
      'date.lastWeek': 'Last week',
      'date.thisMonth': 'This month',
      'date.lastMonth': 'Last month',
      // Numbers and Formatting
      'format.currency.symbol': '$',
      'format.decimal.separator': '.',
      'format.thousand.separator': ',',
      'format.percentage.symbol': '%'
    };
  }

  /**
   * Set the current language
   * @param {string} language - Language code (e.g., 'en', 'fr', 'es')
   */
  setLanguage(language) {
    if (typeof language !== 'string' || language.trim() === '') {
      console.warn('TablixJS Localization: Invalid language code provided. Using fallback.');
      return;
    }
    this.currentLanguage = language.toLowerCase().trim();
  }

  /**
   * Add translations for a specific language
   * @param {string} language - Language code
   * @param {Object} translations - Translations object
   */
  addTranslations(language, translations) {
    if (typeof language !== 'string' || !translations || typeof translations !== 'object') {
      console.warn('TablixJS Localization: Invalid parameters for addTranslations.');
      return;
    }
    const languageCode = language.toLowerCase().trim();
    if (!this.translations.has(languageCode)) {
      this.translations.set(languageCode, {});
    }

    // Merge with existing translations for this language
    const existing = this.translations.get(languageCode);
    this.translations.set(languageCode, {
      ...existing,
      ...translations
    });
  }

  /**
   * Get localized string by key
   * @param {string} key - Translation key (e.g., 'pagination.next')
   * @param {Object} params - Parameters to substitute in the translation
   * @returns {string} Localized string or fallback
   */
  t(key, params = {}) {
    if (typeof key !== 'string') {
      console.warn('TablixJS Localization: Translation key must be a string.');
      return key;
    }

    // Try current language first
    let translation = this.getTranslationFromLanguage(this.currentLanguage, key);

    // Fallback to English if not found
    if (translation === null && this.currentLanguage !== this.fallbackLanguage) {
      translation = this.getTranslationFromLanguage(this.fallbackLanguage, key);
    }

    // Final fallback: return the key itself
    if (translation === null) {
      console.warn(`TablixJS Localization: Translation not found for key: ${key}`);
      return key;
    }

    // Substitute parameters in the translation
    return this.substituteParameters(translation, params);
  }

  /**
   * Get translation from a specific language
   * @private
   * @param {string} language - Language code
   * @param {string} key - Translation key
   * @returns {string|null} Translation or null if not found
   */
  getTranslationFromLanguage(language, key) {
    const languageTranslations = this.translations.get(language);
    if (!languageTranslations) {
      return null;
    }

    // First try direct key lookup (for flat structure like 'pagination.first')
    if (key in languageTranslations && typeof languageTranslations[key] === 'string') {
      return languageTranslations[key];
    }

    // Fallback to nested key lookup (for nested structure)
    const keys = key.split('.');
    let current = languageTranslations;
    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        return null;
      }
    }
    return typeof current === 'string' ? current : null;
  }

  /**
   * Substitute parameters in translation string
   * @private
   * @param {string} translation - Translation string with placeholders
   * @param {Object} params - Parameters to substitute
   * @returns {string} Translation with substituted parameters
   */
  substituteParameters(translation, params) {
    if (!params || typeof params !== 'object') {
      return translation;
    }
    let result = translation;

    // Replace {paramName} with actual values
    Object.keys(params).forEach(key => {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      result = result.replace(regex, params[key]);
    });
    return result;
  }

  /**
   * Get current language code
   * @returns {string} Current language code
   */
  getCurrentLanguage() {
    return this.currentLanguage;
  }

  /**
   * Get available languages
   * @returns {Array<string>} Array of available language codes
   */
  getAvailableLanguages() {
    return Array.from(this.translations.keys());
  }

  /**
   * Check if a language is available
   * @param {string} language - Language code to check
   * @returns {boolean} True if language is available
   */
  hasLanguage(language) {
    return this.translations.has(language.toLowerCase().trim());
  }

  /**
   * Get all translations for current language
   * @returns {Object} All translations for current language
   */
  getAllTranslations() {
    return this.translations.get(this.currentLanguage) || {};
  }

  /**
   * Remove translations for a specific language
   * @param {string} language - Language code to remove
   */
  removeLanguage(language) {
    const languageCode = language.toLowerCase().trim();
    if (languageCode === this.fallbackLanguage) {
      console.warn('TablixJS Localization: Cannot remove fallback language.');
      return;
    }
    this.translations.delete(languageCode);

    // If we removed the current language, switch to fallback
    if (this.currentLanguage === languageCode) {
      this.currentLanguage = this.fallbackLanguage;
    }
  }

  /**
   * Clear all translations except fallback
   */
  clearTranslations() {
    const fallbackTranslations = this.translations.get(this.fallbackLanguage);
    this.translations.clear();
    this.translations.set(this.fallbackLanguage, fallbackTranslations);
    this.currentLanguage = this.fallbackLanguage;
  }

  /**
   * Format number based on current locale
   * @param {number} number - Number to format
   * @param {Object} options - Formatting options
   * @returns {string} Formatted number
   */
  formatNumber(number, options = {}) {
    const {
      style = 'decimal',
      currency = 'USD',
      minimumFractionDigits,
      maximumFractionDigits
    } = options;
    try {
      const formatter = new Intl.NumberFormat(this.getLocaleCode(), {
        style,
        currency: style === 'currency' ? currency : undefined,
        minimumFractionDigits,
        maximumFractionDigits
      });
      return formatter.format(number);
    } catch (error) {
      // Fallback formatting if Intl is not available
      return this.fallbackNumberFormat(number, options);
    }
  }

  /**
   * Format date based on current locale
   * @param {Date|string|number} date - Date to format
   * @param {Object} options - Formatting options
   * @returns {string} Formatted date
   */
  formatDate(date, options = {}) {
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) {
      return date.toString();
    }
    try {
      const formatter = new Intl.DateTimeFormat(this.getLocaleCode(), options);
      return formatter.format(dateObj);
    } catch (error) {
      // Fallback to simple date formatting
      return dateObj.toLocaleDateString();
    }
  }

  /**
   * Get locale code for Intl formatting
   * @private
   * @returns {string} Locale code
   */
  getLocaleCode() {
    // Map language codes to locale codes
    const languageToLocaleMap = {
      'en': 'en-US',
      'fr': 'fr-FR',
      'es': 'es-ES',
      'de': 'de-DE',
      'it': 'it-IT',
      'pt': 'pt-BR',
      'ru': 'ru-RU',
      'ja': 'ja-JP',
      'ko': 'ko-KR',
      'zh': 'zh-CN'
    };
    return languageToLocaleMap[this.currentLanguage] || this.currentLanguage || 'en-US';
  }

  /**
   * Fallback number formatting when Intl is not available
   * @private
   * @param {number} number - Number to format
   * @param {Object} options - Formatting options
   * @returns {string} Formatted number
   */
  fallbackNumberFormat(number, options = {}) {
    const {
      style
    } = options;
    if (style === 'currency') {
      const symbol = this.t('format.currency.symbol');
      return `${symbol}${number.toFixed(2)}`;
    } else if (style === 'percent') {
      const symbol = this.t('format.percentage.symbol');
      return `${(number * 100).toFixed(1)}${symbol}`;
    }
    return number.toString();
  }

  /**
   * Pluralization helper
   * @param {number} count - Count for pluralization
   * @param {string} singularKey - Key for singular form
   * @param {string} pluralKey - Key for plural form
   * @param {Object} params - Additional parameters
   * @returns {string} Pluralized string
   */
  pluralize(count, singularKey, pluralKey, params = {}) {
    const key = count === 1 ? singularKey : pluralKey;
    return this.t(key, {
      count,
      ...params
    });
  }
}

/**
 * StateManager - Centralized state management for server-side operations
 * 
 * This class manages the persistent state for pagination, sorting, filtering, and search
 * to ensure consistency across all server requests and prevent state loss during operations.
 */
class StateManager {
  constructor(table) {
    this.table = table;

    // Centralized state
    this.state = {
      // Pagination state
      page: 1,
      pageSize: 10,
      totalRows: 0,
      // Sorting state
      sort: null,
      // { column: 'name', direction: 'asc' } or null

      // Filtering state
      filters: {},
      // { columnName: { type: 'value', values: [...] } }

      // Search state
      search: '',
      // Global search term

      // Loading state
      isLoading: false
    };

    // Track if initial load has completed
    this.isInitialized = false;
  }

  /**
   * Get current state snapshot
   * @returns {Object} Current state
   */
  getState() {
    return {
      ...this.state
    };
  }

  /**
   * Update pagination state
   * @param {Object} pageState - Pagination state
   */
  updatePagination(pageState) {
    if (pageState.page !== undefined) {
      this.state.page = pageState.page;
    }
    if (pageState.pageSize !== undefined) {
      this.state.pageSize = pageState.pageSize;
    }
    if (pageState.totalRows !== undefined) {
      this.state.totalRows = pageState.totalRows;
    }
  }

  /**
   * Update sorting state
   * @param {Object|null} sortState - Sort state { column, direction } or null
   */
  updateSort(sortState) {
    this.state.sort = sortState;
  }

  /**
   * Update filtering state
   * @param {Object} filters - Filter configurations by column
   */
  updateFilters(filters) {
    this.state.filters = {
      ...filters
    };
  }

  /**
   * Update search state
   * @param {string} searchTerm - Search term
   */
  updateSearch(searchTerm) {
    this.state.search = searchTerm || '';
  }

  /**
   * Update loading state
   * @param {boolean} isLoading - Loading state
   */
  updateLoading(isLoading) {
    this.state.isLoading = isLoading;
  }

  /**
   * Reset pagination to first page
   */
  resetPage() {
    this.state.page = 1;
  }

  /**
   * Get parameters for server requests
   * Normalizes state into consistent format for server loaders
   * @returns {Object} Server request parameters
   */
  getServerParams() {
    return {
      page: this.state.page,
      pageSize: this.state.pageSize,
      sort: this.state.sort || {},
      // Always send object, never null/undefined
      filters: this.state.filters || {},
      search: this.state.search || ''
    };
  }

  /**
   * Mark initial load as completed
   */
  markInitialized() {
    this.isInitialized = true;
  }

  /**
   * Check if initial load has completed
   * @returns {boolean}
   */
  isReady() {
    return this.isInitialized;
  }

  /**
   * Reset all state to defaults
   */
  reset() {
    this.state = {
      page: 1,
      pageSize: this.state.pageSize,
      // Preserve page size
      totalRows: 0,
      sort: null,
      filters: {},
      search: '',
      isLoading: false
    };
    this.isInitialized = false;
  }
}

/**
 * French (fr) translations for TablixJS
 */
const frenchTranslations = {
  // General
  'general.loading': 'Chargement...',
  'general.error': 'Erreur',
  'general.noData': 'Aucune donnée disponible',
  'general.show': 'Afficher',
  'general.entries': 'entrées',
  'general.of': 'de',
  'general.to': 'à',
  'general.records': 'enregistrements',
  'general.perPage': 'par page',
  'general.showing': 'Affichage',
  'general.total': 'Total',
  'general.rows': 'lignes',
  // Search
  'search.placeholder': 'Rechercher...',
  'search.clear': 'Effacer la recherche',
  'search.noResults': 'Aucun résultat trouvé',
  'search.resultsFound': 'résultats trouvés',
  // Pagination
  'pagination.first': 'Premier',
  'pagination.previous': 'Précédent',
  'pagination.next': 'Suivant',
  'pagination.last': 'Dernier',
  'pagination.page': 'Page',
  'pagination.pageOf': 'Page {currentPage} sur {totalPages}',
  'pagination.showingRecords': 'Affichage de {startRow} à {endRow} sur {totalRows} enregistrements',
  'pagination.noRecords': 'Aucun enregistrement trouvé',
  'pagination.pageSize': 'Enregistrements par page',
  // Sorting
  'sort.sortAscending': 'Trier croissant',
  'sort.sortDescending': 'Trier décroissant',
  'sort.sortedAscending': 'Trié croissant',
  'sort.sortedDescending': 'Trié décroissant',
  'sort.notSorted': 'Non trié',
  'sort.clearSort': 'Effacer le tri',
  // Selection
  'selection.selectRow': 'Sélectionner la ligne',
  'selection.deselectRow': 'Désélectionner la ligne',
  'selection.selectAll': 'Tout sélectionner',
  'selection.deselectAll': 'Tout désélectionner',
  'selection.selectedCount': '{count} sélectionné(s)',
  'selection.selectAllVisible': 'Sélectionner toutes les lignes visibles',
  'selection.clearSelection': 'Effacer la sélection',
  // Filtering
  'filter.filter': 'Filtrer',
  'filter.clearFilter': 'Effacer le filtre',
  'filter.clearAllFilters': 'Effacer tous les filtres',
  'filter.applyFilter': 'Appliquer le filtre',
  'filter.filterBy': 'Filtrer par',
  'filter.filterColumn': 'Filtrer la colonne',
  'filter.filterByValue': 'Filtrer par valeur',
  'filter.filterByCondition': 'Filtrer par condition',
  'filter.searchValues': 'Rechercher des valeurs...',
  'filter.selectAll': 'Tout sélectionner',
  'filter.noValuesAvailable': 'Aucune valeur disponible',
  'filter.addCondition': 'Ajouter une condition',
  'filter.removeCondition': 'Supprimer la condition',
  'filter.value': 'Valeur',
  'filter.apply': 'Appliquer',
  'filter.clear': 'Effacer',
  'filter.cancel': 'Annuler',
  'filter.contains': 'Contient',
  'filter.startsWith': 'Commence par',
  'filter.endsWith': 'Se termine par',
  'filter.equals': 'Égal à',
  'filter.notEquals': 'Différent de',
  'filter.greaterThan': 'Supérieur à',
  'filter.lessThan': 'Inférieur à',
  'filter.greaterThanOrEqual': 'Supérieur ou égal à',
  'filter.lessThanOrEqual': 'Inférieur ou égal à',
  'filter.between': 'Entre',
  'filter.isEmpty': 'Est vide',
  'filter.isNotEmpty': 'N\'est pas vide',
  'filter.selectValues': 'Sélectionner les valeurs',
  'filter.noOptionsAvailable': 'Aucune option disponible',
  'filter.complexDataNotSupported': 'Le filtrage par valeur n\'est pas disponible pour les colonnes avec des données complexes. Utilisez le filtrage par condition à la place.',
  // Controls
  'controls.refresh': 'Actualiser les données',
  'controls.export': 'Exporter les données',
  'controls.settings': 'Paramètres',
  'controls.columns': 'Colonnes',
  'controls.showColumns': 'Afficher/Masquer les colonnes',
  // Virtual Scrolling
  'virtualScroll.loadingMoreRows': 'Chargement de plus de lignes...',
  'virtualScroll.scrollToTop': 'Faire défiler vers le haut',
  'virtualScroll.scrollToBottom': 'Faire défiler vers le bas',
  // Error Messages
  'error.loadingData': 'Échec du chargement des données',
  'error.networkError': 'Erreur réseau',
  'error.invalidData': 'Format de données invalide',
  'error.serverError': 'Erreur serveur',
  'error.timeout': 'Délai d\'attente dépassé',
  'error.unknown': 'Une erreur inconnue s\'est produite',
  'error.retry': 'Réessayer',
  // Data Types
  'dataType.string': 'Texte',
  'dataType.number': 'Nombre',
  'dataType.date': 'Date',
  'dataType.boolean': 'Booléen',
  'dataType.currency': 'Devise',
  'dataType.percentage': 'Pourcentage',
  // Accessibility
  'accessibility.table': 'Tableau de données',
  'accessibility.sortableColumn': 'Colonne triable',
  'accessibility.selectableRow': 'Ligne sélectionnable',
  'accessibility.rowSelected': 'Ligne sélectionnée',
  'accessibility.rowNotSelected': 'Ligne non sélectionnée',
  'accessibility.pageNavigation': 'Navigation des pages',
  'accessibility.searchInput': 'Rechercher dans les données du tableau',
  'accessibility.filterColumn': 'Filtrer la colonne',
  // Actions
  'action.apply': 'Appliquer',
  'action.cancel': 'Annuler',
  'action.close': 'Fermer',
  'action.save': 'Enregistrer',
  'action.reset': 'Réinitialiser',
  'action.ok': 'OK',
  'action.yes': 'Oui',
  'action.no': 'Non',
  // Time and Date
  'date.today': 'Aujourd\'hui',
  'date.yesterday': 'Hier',
  'date.thisWeek': 'Cette semaine',
  'date.lastWeek': 'La semaine dernière',
  'date.thisMonth': 'Ce mois-ci',
  'date.lastMonth': 'Le mois dernier',
  // Numbers and Formatting
  'format.currency.symbol': '€',
  'format.decimal.separator': ',',
  'format.thousand.separator': ' ',
  'format.percentage.symbol': '%'
};

/**
 * Spanish (es) translations for TablixJS
 */
const spanishTranslations = {
  // General
  'general.loading': 'Cargando...',
  'general.error': 'Error',
  'general.noData': 'No hay datos disponibles',
  'general.show': 'Mostrar',
  'general.entries': 'entradas',
  'general.of': 'de',
  'general.to': 'a',
  'general.records': 'registros',
  'general.perPage': 'por página',
  'general.showing': 'Mostrando',
  'general.total': 'Total',
  'general.rows': 'filas',
  // Search
  'search.placeholder': 'Buscar...',
  'search.clear': 'Limpiar búsqueda',
  'search.noResults': 'No se encontraron resultados',
  'search.resultsFound': 'resultados encontrados',
  // Pagination
  'pagination.first': 'Primero',
  'pagination.previous': 'Anterior',
  'pagination.next': 'Siguiente',
  'pagination.last': 'Último',
  'pagination.page': 'Página',
  'pagination.pageOf': 'Página {currentPage} de {totalPages}',
  'pagination.showingRecords': 'Mostrando {startRow} a {endRow} de {totalRows} registros',
  'pagination.noRecords': 'No se encontraron registros',
  'pagination.pageSize': 'Registros por página',
  // Sorting
  'sort.sortAscending': 'Ordenar ascendente',
  'sort.sortDescending': 'Ordenar descendente',
  'sort.sortedAscending': 'Ordenado ascendente',
  'sort.sortedDescending': 'Ordenado descendente',
  'sort.notSorted': 'Sin ordenar',
  'sort.clearSort': 'Limpiar ordenación',
  // Selection
  'selection.selectRow': 'Seleccionar fila',
  'selection.deselectRow': 'Deseleccionar fila',
  'selection.selectAll': 'Seleccionar todo',
  'selection.deselectAll': 'Deseleccionar todo',
  'selection.selectedCount': '{count} seleccionado(s)',
  'selection.selectAllVisible': 'Seleccionar todas las filas visibles',
  'selection.clearSelection': 'Limpiar selección',
  // Filtering
  'filter.filter': 'Filtrar',
  'filter.clearFilter': 'Limpiar filtro',
  'filter.clearAllFilters': 'Limpiar todos los filtros',
  'filter.applyFilter': 'Aplicar filtro',
  'filter.filterBy': 'Filtrar por',
  'filter.filterColumn': 'Filtrar columna',
  'filter.filterByValue': 'Filtrar por valor',
  'filter.filterByCondition': 'Filtrar por condición',
  'filter.searchValues': 'Buscar valores...',
  'filter.selectAll': 'Seleccionar todo',
  'filter.noValuesAvailable': 'No hay valores disponibles',
  'filter.addCondition': 'Agregar condición',
  'filter.removeCondition': 'Eliminar condición',
  'filter.value': 'Valor',
  'filter.apply': 'Aplicar',
  'filter.clear': 'Limpiar',
  'filter.cancel': 'Cancelar',
  'filter.contains': 'Contiene',
  'filter.startsWith': 'Comienza con',
  'filter.endsWith': 'Termina con',
  'filter.equals': 'Igual a',
  'filter.notEquals': 'No igual a',
  'filter.greaterThan': 'Mayor que',
  'filter.lessThan': 'Menor que',
  'filter.greaterThanOrEqual': 'Mayor o igual a',
  'filter.lessThanOrEqual': 'Menor o igual a',
  'filter.between': 'Entre',
  'filter.isEmpty': 'Está vacío',
  'filter.isNotEmpty': 'No está vacío',
  'filter.selectValues': 'Seleccionar valores',
  'filter.noOptionsAvailable': 'No hay opciones disponibles',
  'filter.complexDataNotSupported': 'El filtrado por valor no está disponible para columnas con datos complejos. Utilice el filtrado por condición en su lugar.',
  // Controls
  'controls.refresh': 'Actualizar datos',
  'controls.export': 'Exportar datos',
  'controls.settings': 'Configuración',
  'controls.columns': 'Columnas',
  'controls.showColumns': 'Mostrar/Ocultar columnas',
  // Virtual Scrolling
  'virtualScroll.loadingMoreRows': 'Cargando más filas...',
  'virtualScroll.scrollToTop': 'Desplazar hacia arriba',
  'virtualScroll.scrollToBottom': 'Desplazar hacia abajo',
  // Error Messages
  'error.loadingData': 'Error al cargar los datos',
  'error.networkError': 'Error de red',
  'error.invalidData': 'Formato de datos inválido',
  'error.serverError': 'Error del servidor',
  'error.timeout': 'Tiempo de espera agotado',
  'error.unknown': 'Ocurrió un error desconocido',
  'error.retry': 'Reintentar',
  // Data Types
  'dataType.string': 'Texto',
  'dataType.number': 'Número',
  'dataType.date': 'Fecha',
  'dataType.boolean': 'Booleano',
  'dataType.currency': 'Moneda',
  'dataType.percentage': 'Porcentaje',
  // Accessibility
  'accessibility.table': 'Tabla de datos',
  'accessibility.sortableColumn': 'Columna ordenable',
  'accessibility.selectableRow': 'Fila seleccionable',
  'accessibility.rowSelected': 'Fila seleccionada',
  'accessibility.rowNotSelected': 'Fila no seleccionada',
  'accessibility.pageNavigation': 'Navegación de páginas',
  'accessibility.searchInput': 'Buscar en los datos de la tabla',
  'accessibility.filterColumn': 'Filtrar columna',
  // Actions
  'action.apply': 'Aplicar',
  'action.cancel': 'Cancelar',
  'action.close': 'Cerrar',
  'action.save': 'Guardar',
  'action.reset': 'Restablecer',
  'action.ok': 'OK',
  'action.yes': 'Sí',
  'action.no': 'No',
  // Time and Date
  'date.today': 'Hoy',
  'date.yesterday': 'Ayer',
  'date.thisWeek': 'Esta semana',
  'date.lastWeek': 'La semana pasada',
  'date.thisMonth': 'Este mes',
  'date.lastMonth': 'El mes pasado',
  // Numbers and Formatting
  'format.currency.symbol': '€',
  'format.decimal.separator': ',',
  'format.thousand.separator': '.',
  'format.percentage.symbol': '%'
};

/**
 * Serbian (sr) translations for TablixJS
 */
const serbianTranslations = {
  // General
  'general.loading': 'Učitavanje...',
  'general.error': 'Greška',
  'general.noData': 'Nema dostupnih podataka',
  'general.show': 'Prikaži',
  'general.entries': 'unosa',
  'general.of': 'od',
  'general.to': 'do',
  'general.records': 'zapisa',
  'general.perPage': 'po stranici',
  'general.showing': 'Prikazano',
  'general.total': 'Ukupno',
  'general.rows': 'redova',
  // Search
  'search.placeholder': 'Pretraga...',
  'search.clear': 'Obriši pretragu',
  'search.noResults': 'Nema rezultata',
  'search.resultsFound': 'rezultata pronađeno',
  // Pagination
  'pagination.first': 'Prva',
  'pagination.previous': 'Prethodna',
  'pagination.next': 'Sledeća',
  'pagination.last': 'Poslednja',
  'pagination.page': 'Stranica',
  'pagination.pageOf': 'Stranica {currentPage} od {totalPages}',
  'pagination.showingRecords': 'Prikazano {startRow}-{endRow} od {totalRows} zapisa',
  'pagination.noRecords': 'Nema zapisa',
  'pagination.pageSize': 'Zapisa po stranici',
  // Sorting
  'sort.sortAscending': 'Sortiraj rastuće',
  'sort.sortDescending': 'Sortiraj opadajuće',
  'sort.sortedAscending': 'Sortirano rastuće',
  'sort.sortedDescending': 'Sortirano opadajuće',
  'sort.notSorted': 'Nije sortirano',
  'sort.clearSort': 'Obriši sortiranje',
  // Selection
  'selection.selectRow': 'Izaberi red',
  'selection.deselectRow': 'Poništi izbor reda',
  'selection.selectAll': 'Izaberi sve',
  'selection.deselectAll': 'Poništi sve',
  'selection.selectedCount': '{count} izabrano',
  'selection.selectAllVisible': 'Izaberi sve vidljive redove',
  'selection.clearSelection': 'Obriši izbor',
  // Filtering
  'filter.filter': 'Filter',
  'filter.clearFilter': 'Obriši filter',
  'filter.clearAllFilters': 'Obriši sve filtere',
  'filter.applyFilter': 'Primeni filter',
  'filter.filterBy': 'Filtriraj po',
  'filter.filterColumn': 'Filtriraj kolonu',
  'filter.filterByValue': 'Filtriraj po vrednosti',
  'filter.filterByCondition': 'Filtriraj po uslovu',
  'filter.searchValues': 'Pretraži vrednosti...',
  'filter.selectAll': 'Izaberi sve',
  'filter.noValuesAvailable': 'Nema dostupnih vrednosti',
  'filter.addCondition': 'Dodaj uslov',
  'filter.removeCondition': 'Ukloni uslov',
  'filter.value': 'Vrednost',
  'filter.apply': 'Primeni',
  'filter.clear': 'Obriši',
  'filter.cancel': 'Otkaži',
  'filter.contains': 'Sadrži',
  'filter.startsWith': 'Počinje sa',
  'filter.endsWith': 'Završava se sa',
  'filter.equals': 'Jednako',
  'filter.notEquals': 'Nije jednako',
  'filter.greaterThan': 'Veće od',
  'filter.lessThan': 'Manje od',
  'filter.greaterThanOrEqual': 'Veće ili jednako',
  'filter.lessThanOrEqual': 'Manje ili jednako',
  'filter.between': 'Između',
  'filter.isEmpty': 'Prazno',
  'filter.isNotEmpty': 'Nije prazno',
  'filter.selectValues': 'Izaberi vrednosti',
  'filter.noOptionsAvailable': 'Nema dostupnih opcija',
  'filter.complexDataNotSupported': 'Filtriranje po vrednosti nije dostupno za kolone sa složenim podacima. Koristite filtriranje po uslovu umesto toga.',
  // Controls
  'controls.refresh': 'Osveži podatke',
  'controls.export': 'Izvezi podatke',
  'controls.settings': 'Podešavanja',
  'controls.columns': 'Kolone',
  'controls.showColumns': 'Prikaži/Sakrij kolone',
  // Virtual Scrolling
  'virtualScroll.loadingMoreRows': 'Učitavanje dodatnih redova...',
  'virtualScroll.scrollToTop': 'Idi na vrh',
  'virtualScroll.scrollToBottom': 'Idi na dno',
  // Error Messages
  'error.loadingData': 'Neuspešno učitavanje podataka',
  'error.networkError': 'Došlo je do mrežne greške',
  'error.invalidData': 'Neispravan format podataka',
  'error.serverError': 'Došlo je do greške na serveru',
  'error.timeout': 'Isteklo vreme zahteva',
  'error.unknown': 'Došlo je do nepoznate greške',
  'error.retry': 'Pokušaj ponovo',
  // Data Types
  'dataType.string': 'Tekst',
  'dataType.number': 'Broj',
  'dataType.date': 'Datum',
  'dataType.boolean': 'Logička vrednost',
  'dataType.currency': 'Valuta',
  'dataType.percentage': 'Procenat',
  // Accessibility
  'accessibility.table': 'Tabela podataka',
  'accessibility.sortableColumn': 'Kolona za sortiranje',
  'accessibility.selectableRow': 'Red za izbor',
  'accessibility.rowSelected': 'Red izabran',
  'accessibility.rowNotSelected': 'Red nije izabran',
  'accessibility.pageNavigation': 'Navigacija stranica',
  'accessibility.searchInput': 'Pretraga podataka tabele',
  'accessibility.filterColumn': 'Filtriraj kolonu',
  // Actions
  'action.apply': 'Primeni',
  'action.cancel': 'Otkaži',
  'action.close': 'Zatvori',
  'action.save': 'Sačuvaj',
  'action.reset': 'Resetuj',
  'action.ok': 'U redu',
  'action.yes': 'Da',
  'action.no': 'Ne',
  // Time and Date
  'date.today': 'Danas',
  'date.yesterday': 'Juče',
  'date.thisWeek': 'Ove nedelje',
  'date.lastWeek': 'Prošle nedelje',
  'date.thisMonth': 'Ovog meseca',
  'date.lastMonth': 'Prošlog meseca',
  // Numbers and Formatting
  'format.currency.symbol': 'RSD',
  'format.decimal.separator': ',',
  'format.thousand.separator': '.',
  'format.percentage.symbol': '%'
};

class Table {
  constructor(container, options = {}) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    this.options = {
      // Default options
      pagination: {
        enabled: true,
        pageSize: 10,
        mode: 'client',
        // 'client' or 'server'
        showPageNumbers: true,
        maxPageNumbers: 5,
        showFirstLast: true,
        showPrevNext: true,
        showPageSizes: false,
        pageSizeOptions: [10, 25, 50, 100],
        serverDataLoader: null
      },
      // Sorting options
      sorting: {
        enabled: true,
        mode: 'client',
        // 'client' or 'server'
        serverSortLoader: null,
        defaultSortType: 'auto',
        caseSensitive: false,
        nullsFirst: false
      },
      // Filtering options
      filtering: {
        enabled: true,
        mode: 'client',
        // 'client' or 'server'
        serverFilterLoader: null,
        debounceDelay: 300,
        showBadges: true,
        showTooltips: true
      },
      // Control panels
      controls: {
        enabled: true,
        // Enable by default to show search
        search: true,
        pagination: true,
        pageSize: true,
        refresh: true,
        export: false,
        position: 'top' // 'top', 'bottom', 'both'
      },
      search: {
        enabled: true,
        placeholder: null,
        // Will use localized string if not provided
        searchDelay: 300,
        // Debounce delay in milliseconds
        minLength: 1,
        // Minimum characters before search starts
        caseSensitive: false
      },
      // Selection options
      selection: {
        enabled: false,
        // Default: selection is disabled
        mode: 'single',
        // 'single' or 'multi'
        dataIdKey: 'id' // Key to use as stable row identifier
      },
      // Virtual scrolling options
      virtualScroll: {
        enabled: false,
        buffer: 10,
        // Number of rows to render above/below viewport
        rowHeight: null,
        // Auto-detected if null
        containerHeight: 400 // Default container height in pixels
      },
      // Localization options
      language: 'en',
      translations: {},
      ...options
    };

    // Initialize localization first (before other managers that might use it)
    this.localization = new Localization();

    // Auto-load common language packs for developer convenience
    this.localization.addTranslations('fr', frenchTranslations);
    this.localization.addTranslations('es', spanishTranslations);
    this.localization.addTranslations('sr', serbianTranslations);

    // Set language and translations if provided
    if (this.options.language) {
      this.localization.setLanguage(this.options.language);
    }

    // Add custom translations if provided (these will override auto-loaded ones)
    if (this.options.translations) {
      Object.keys(this.options.translations).forEach(lang => {
        this.localization.addTranslations(lang, this.options.translations[lang]);
      });
    }

    // Initialize managers
    this.eventManager = new EventManager();
    this.columnManager = new ColumnManager(this);
    this.dataManager = new DataManager(this, options.data || []);
    this.renderer = new Renderer(this);

    // Initialize state manager for server-side operations
    this.stateManager = new StateManager(this);

    // Initialize columns if provided
    if (options.columns) {
      this.columnManager.initializeColumns(options.columns);
    }

    // Initialize pagination if enabled
    if (this.options.pagination && this.options.pagination.enabled !== false) {
      this.paginationManager = new PaginationManager(this, this.options.pagination);
      // Sync initial page size with state manager
      this.stateManager.updatePagination({
        pageSize: this.options.pagination.pageSize || 10
      });
    }

    // Initialize sorting if enabled
    if (this.options.sorting && this.options.sorting.enabled !== false) {
      this.sortingManager = new SortingManager(this, this.options.sorting);
    }

    // Initialize filtering if enabled
    if (this.options.filtering && this.options.filtering.enabled !== false) {
      this.filterManager = new FilterManager(this, this.options.filtering);
      this.filterUI = new FilterUI(this.filterManager);
    }

    // Initialize search if enabled
    if (this.options.search && this.options.search.enabled !== false) {
      this.searchManager = new SearchManager(this, this.options.search);
    }

    // Initialize selection if enabled
    if (this.options.selection) {
      this.selectionManager = new SelectionManager(this, this.options.selection);
    }

    // Initialize virtual scrolling
    if (this.options.virtualScroll) {
      this.virtualScrollManager = new VirtualScrollManager(this, this.options.virtualScroll);
    }
    this.init();
  }
  async init() {
    try {
      // Initialize search manager
      if (this.searchManager) {
        this.searchManager.init();
      }

      // Determine if we're using server-side operations
      const isServerMode = this._isServerMode();

      // Trigger beforeLoad hook for initial data
      this.eventManager.trigger('beforeLoad', {
        source: 'initialization'
      });
      if (isServerMode) {
        // For server mode, load initial data through unified request
        await this._loadServerData();
      } else {
        // For client mode, just refresh with local data
        await this.refreshTable();
      }

      // Mark state as initialized
      this.stateManager.markInitialized();

      // Trigger afterLoad hook with consistent payload format
      const loadedData = this.dataManager.getData();
      this.eventManager.trigger('afterLoad', {
        data: loadedData,
        source: 'initialization'
      });

      // Explicitly trigger afterRender to ensure selection works on first load
      this.eventManager.trigger('afterRender');
    } catch (error) {
      console.error('Failed to initialize table:', error);
      this.eventManager.trigger('loadError', {
        error,
        source: 'initialization'
      });
      if (this.renderer && this.renderer.renderError) {
        this.renderer.renderError(error);
      }
    }
  }

  /**
   * Check if any feature is using server mode
   * @private
   */
  _isServerMode() {
    return this.options.pagination && this.options.pagination.mode === 'server' || this.options.sorting && this.options.sorting.mode === 'server' || this.options.filtering && this.options.filtering.mode === 'server';
  }

  /**
   * Unified server data loading
   * Ensures only one request is made with all current state (pagination, sort, filter, search)
   * @private
   */
  async _loadServerData() {
    // Update state manager with current search term
    if (this.searchManager) {
      this.stateManager.updateSearch(this.searchManager.currentSearchTerm);
    }

    // Get unified parameters from state manager
    const params = this.stateManager.getServerParams();
    this.stateManager.updateLoading(true);
    this.eventManager.trigger('beforeServerLoad', params);
    try {
      let result;

      // Determine which loader to use based on the operation
      // Priority: serverFilterLoader > serverSortLoader > serverDataLoader
      if (this.options.filtering && this.options.filtering.mode === 'server' && this.options.filtering.serverFilterLoader && Object.keys(params.filters).length > 0) {
        // Use filter loader if filters are active
        result = await this.options.filtering.serverFilterLoader(params);
      } else if (this.options.sorting && this.options.sorting.mode === 'server' && this.options.sorting.serverSortLoader && params.sort && params.sort.column) {
        // Use sort loader if sort is active and no filters
        result = await this.options.sorting.serverSortLoader(params);
      } else if (this.options.pagination && this.options.pagination.serverDataLoader) {
        // Fall back to pagination loader
        result = await this.options.pagination.serverDataLoader(params);
      } else {
        throw new Error('No server data loader configured for server-side operations');
      }

      // Update data manager with server response
      this.dataManager.setServerData(result.data, result.totalRows);

      // Update state manager with total rows
      this.stateManager.updatePagination({
        totalRows: result.totalRows
      });

      // Update pagination manager info
      if (this.paginationManager) {
        this.paginationManager.updatePaginationInfo(result.totalRows);
      }

      // Render the table with the loaded data
      this.renderer.renderTable(result.data);
      this.stateManager.updateLoading(false);
      this.eventManager.trigger('afterServerLoad', {
        params,
        result
      });
      return result.data;
    } catch (error) {
      this.stateManager.updateLoading(false);
      this.eventManager.trigger('serverLoadError', {
        params,
        error
      });
      throw error;
    }
  }

  /**
   * Refresh the table with current data and pagination
   */
  async refreshTable() {
    let dataToRender;

    // Check if we're in server mode
    const isServerMode = this._isServerMode();
    if (isServerMode && this.stateManager.isReady()) {
      // For server mode after initialization, always use unified server loading
      dataToRender = await this._loadServerData();
      return; // _loadServerData already renders the table
    }
    if (this.virtualScrollManager && this.virtualScrollManager.isEnabled()) {
      // Virtual scrolling mode - get all data for virtual scrolling manager
      dataToRender = this.dataManager.getData();

      // Initialize or update virtual scrolling with full dataset
      this.virtualScrollManager.updateData(dataToRender);

      // Render the table structure first (without data rows)
      this.renderer.renderTable([], true); // Pass empty array and virtualMode flag

      // Initialize virtual scrolling after table structure is ready
      this.virtualScrollManager.init(dataToRender);
    } else if (this.paginationManager) {
      // Traditional pagination mode (client-side)
      dataToRender = await this.paginationManager.getPageData();
      this.renderer.renderTable(dataToRender);
    } else {
      // No pagination, show all data (traditional mode)
      dataToRender = this.dataManager.getData();
      this.renderer.renderTable(dataToRender);
    }
  }

  /**
   * Load new data into the table
   * Supports multiple data sources:
   * - Array: loadData([{id: 1, name: 'John'}])
   * - URL string: loadData('/api/data')
   * - Async function: loadData(() => fetch('/api/data').then(r => r.json()))
   * @param {Array|string|Function} source - Data source
   */
  async loadData(source) {
    try {
      // Trigger beforeLoad hook
      this.eventManager.trigger('beforeLoad', {
        source
      });
      let data;

      // Handle different data source types
      if (Array.isArray(source)) {
        // Direct array data
        data = source;
      } else if (typeof source === 'string') {
        // URL string - fetch data
        data = await this._fetchFromUrl(source);
      } else if (typeof source === 'function') {
        // Custom async function
        data = await source();
      } else {
        throw new Error('Invalid data source. Expected array, URL string, or function.');
      }

      // Validate data
      if (!Array.isArray(data)) {
        throw new Error('Data source must resolve to an array.');
      }

      // Update data and refresh table
      this.dataManager.setData(data);
      await this.refreshTable();

      // Trigger afterLoad hook
      this.eventManager.trigger('afterLoad', {
        data,
        source
      });
    } catch (error) {
      // Handle loading errors
      console.error('Error loading data:', error);
      this.eventManager.trigger('loadError', {
        error,
        source
      });

      // Render error state
      if (this.renderer && this.renderer.renderError) {
        this.renderer.renderError(error);
      }

      // Re-throw for caller handling
      throw error;
    }
  }

  /**
   * Internal method to fetch data from URL
   * @private
   */
  async _fetchFromUrl(url) {
    if (typeof fetch === 'undefined') {
      throw new Error('fetch is not available. Please use a modern browser or provide a polyfill.');
    }
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  }

  /**
   * Filter data by criteria
   */
  async filter(criteria) {
    this.dataManager.applyFilter(criteria);
    await this.refreshTable();
    this.eventManager.trigger('afterFilter', criteria);
  }

  /**
   * Sort data by column
   * @param {string} columnName - Column to sort by
   * @param {string|null} direction - 'asc', 'desc', or null (unsorted)
   */
  async sort(columnName, direction = 'asc') {
    if (this.sortingManager) {
      await this.sortingManager.sort(columnName, direction);
    } else {
      // Fallback to legacy sorting
      this.dataManager.applySorting([{
        column: columnName,
        direction
      }]);
      await this.refreshTable();
      this.eventManager.trigger('afterSort', [{
        column: columnName,
        direction
      }]);
    }
  }

  /**
   * Toggle sort for a column (handles click cycling)
   */
  async toggleSort(columnName) {
    if (this.sortingManager) {
      await this.sortingManager.toggleSort(columnName);
    }
  }

  /**
   * Clear all sorting
   */
  async clearSorting() {
    if (this.sortingManager) {
      await this.sortingManager.clearSorting();
    } else {
      // Fallback to legacy sorting
      this.dataManager.clearSorting();
      await this.refreshTable();
      this.eventManager.trigger('afterSort', []);
    }
  }

  /**
   * Get current sort state
   */
  getSortState() {
    if (this.sortingManager) {
      return this.sortingManager.getSortState();
    }
    return {
      sort: null,
      mode: 'client'
    };
  }

  /**
   * Clear all filters
   */
  async clearFilters() {
    this.dataManager.clearFilters();
    await this.refreshTable();
    this.eventManager.trigger('afterFilter', {});
  }

  /**
   * Clear all sorting
   */
  async clearSorting() {
    if (this.sortingManager) {
      await this.sortingManager.clearSorting();
    } else {
      // Fallback to legacy sorting
      this.dataManager.clearSorting();
      await this.refreshTable();
      this.eventManager.trigger('afterSort', []);
    }
  }

  // ===== FILTERING API =====

  /**
   * Apply filter to a specific column
   * @param {string} columnName - Column to filter
   * @param {Object} filterConfig - Filter configuration
   * @example
   * table.applyFilter('status', { type: 'value', values: ['Active', 'Pending'] });
   * table.applyFilter('name', { type: 'condition', conditions: [{ operator: 'beginsWith', value: 'A' }] });
   */
  async applyFilter(columnName, filterConfig) {
    if (this.filterManager) {
      await this.filterManager.applyFilter(columnName, filterConfig);
    } else {
      console.warn('TablixJS: Filtering is not enabled. Set filtering.enabled to true in options.');
    }
  }

  /**
   * Clear filter for a specific column
   * @param {string} columnName - Column to clear filter for
   */
  async clearFilter(columnName) {
    if (this.filterManager) {
      await this.filterManager.clearFilter(columnName);
    }
  }

  /**
   * Clear all filters
   */
  async clearAllFilters() {
    if (this.filterManager) {
      await this.filterManager.clearAllFilters();
    } else {
      // Fallback to legacy method
      this.dataManager.clearFilters();
      await this.refreshTable();
      this.eventManager.trigger('afterFilter', {});
    }
  }

  /**
   * Get active filters
   * @returns {Object} Active filters by column
   */
  getActiveFilters() {
    return this.filterManager ? this.filterManager.getActiveFilters() : {};
  }

  /**
   * Get filter state for a column
   * @param {string} columnName - Column name
   * @returns {Object|null} Filter state
   */
  getColumnFilter(columnName) {
    return this.filterManager ? this.filterManager.getColumnFilter(columnName) : null;
  }

  // ===== SEARCH API =====

  /**
   * Set search term programmatically
   * @param {string} searchTerm - Search term
   */
  async setSearchTerm(searchTerm) {
    if (this.searchManager) {
      await this.searchManager.setSearchTerm(searchTerm);
    } else {
      console.warn('TablixJS: Search is not enabled. Set search.enabled to true in options.');
    }
  }

  /**
   * Get current search term
   * @returns {string} Current search term
   */
  getSearchTerm() {
    return this.searchManager ? this.searchManager.getSearchTerm() : '';
  }

  /**
   * Clear search
   */
  async clearSearch() {
    if (this.searchManager) {
      await this.searchManager.clearSearch();
    }
  }

  /**
   * Get search information
   * @returns {Object} Search results information
   */
  getSearchInfo() {
    return this.searchManager ? this.searchManager.getSearchInfo() : null;
  }

  // ===== PAGINATION API =====

  /**
   * Go to next page
   */
  async nextPage() {
    if (this.paginationManager) {
      await this.paginationManager.nextPage();
    }
  }

  /**
   * Go to previous page
   */
  async prevPage() {
    if (this.paginationManager) {
      await this.paginationManager.prevPage();
    }
  }

  /**
   * Go to first page
   */
  async firstPage() {
    if (this.paginationManager) {
      await this.paginationManager.firstPage();
    }
  }

  /**
   * Go to last page
   */
  async lastPage() {
    if (this.paginationManager) {
      await this.paginationManager.lastPage();
    }
  }

  /**
   * Go to specific page
   */
  async goToPage(pageNumber) {
    if (this.paginationManager) {
      await this.paginationManager.goToPage(pageNumber);
    }
  }

  /**
   * Change page size
   */
  async changePageSize(pageSize) {
    if (this.paginationManager) {
      await this.paginationManager.changePageSize(pageSize);
    }
  }

  /**
   * Get pagination information
   */
  getPaginationInfo() {
    return this.paginationManager ? this.paginationManager.getInfo() : null;
  }

  /**
   * Enable/disable pagination
   */
  async setPaginationEnabled(enabled) {
    if (this.paginationManager) {
      this.paginationManager.setEnabled(enabled);
      await this.refreshTable();
    } else if (enabled) {
      // Create pagination manager if it doesn't exist
      this.paginationManager = new PaginationManager(this, this.options.pagination);
      await this.refreshTable();
    }
  }

  /**
   * Switch between client-side and server-side pagination
   */
  async setPaginationMode(mode, serverDataLoader = null) {
    if (this.paginationManager) {
      await this.paginationManager.setMode(mode, serverDataLoader);
    }
  }

  // ===== EVENT MANAGEMENT =====

  /**
   * Register event callback
   */
  on(event, callback) {
    this.eventManager.on(event, callback);
  }

  /**
   * Remove event callback
   */
  off(event, callback) {
    this.eventManager.off(event, callback);
  }

  /**
   * Clear event listeners
   */
  clearEvents(event) {
    this.eventManager.clear(event);
  }

  /**
   * Trigger event
   */
  trigger(event, data) {
    this.eventManager.trigger(event, data);
  }

  // ===== UTILITY METHODS =====

  /**
   * Get current filtered data
   */
  getData() {
    return this.dataManager.getData();
  }

  /**
   * Get original unfiltered data
   */
  getOriginalData() {
    return this.dataManager.originalData;
  }

  /**
   * Get table options
   */
  getOptions() {
    return this.options;
  }

  /**
   * Update table options
   */
  async setOptions(newOptions) {
    this.options = {
      ...this.options,
      ...newOptions
    };

    // Update pagination options if provided
    if (newOptions.pagination && this.paginationManager) {
      this.paginationManager.options = {
        ...this.paginationManager.options,
        ...newOptions.pagination
      };
    }

    // Update selection options if provided
    if (newOptions.selection && this.selectionManager) {
      this.selectionManager.options = {
        ...this.selectionManager.options,
        ...newOptions.selection
      };

      // Re-initialize if enabled state changed
      if (newOptions.selection.enabled !== undefined) {
        if (newOptions.selection.enabled) {
          this.selectionManager.enable();
        } else {
          this.selectionManager.disable();
        }
      }

      // Update mode if provided
      if (newOptions.selection.mode) {
        this.selectionManager.setMode(newOptions.selection.mode);
      }
    }
    await this.refreshTable();
  }

  // ===== SELECTION API =====

  /**
   * Get selected row data
   * @returns {Array} Array of selected row data objects
   */
  getSelectedData() {
    return this.selectionManager ? this.selectionManager.getSelectedData() : [];
  }

  /**
   * Get selected row IDs
   * @returns {Array} Array of selected row IDs
   */
  getSelectedIds() {
    return this.selectionManager ? this.selectionManager.getSelectedIds() : [];
  }

  /**
   * Programmatically select rows by ID
   * @param {String|Array} rowIds - Single row ID or array of row IDs
   */
  selectRows(rowIds) {
    if (this.selectionManager) {
      this.selectionManager.selectRows(rowIds);
    }
  }

  /**
   * Programmatically deselect rows by ID
   * @param {String|Array} rowIds - Single row ID or array of row IDs
   */
  deselectRows(rowIds) {
    if (this.selectionManager) {
      this.selectionManager.deselectRows(rowIds);
    }
  }

  /**
   * Clear all selections
   */
  clearSelection() {
    if (this.selectionManager) {
      this.selectionManager.clearSelection();
    }
  }

  /**
   * Check if a row is selected
   * @param {String} rowId - Row ID to check
   * @returns {Boolean} True if row is selected
   */
  isRowSelected(rowId) {
    return this.selectionManager ? this.selectionManager.isRowSelected(rowId) : false;
  }

  /**
   * Get selection count
   * @returns {Number} Number of selected rows
   */
  getSelectionCount() {
    return this.selectionManager ? this.selectionManager.getSelectionCount() : 0;
  }

  /**
   * Enable selection
   */
  enableSelection() {
    if (this.selectionManager) {
      this.selectionManager.enable();
    }
  }

  /**
   * Disable selection
   */
  disableSelection() {
    if (this.selectionManager) {
      this.selectionManager.disable();
    }
  }

  /**
   * Set selection mode
   * @param {String} mode - 'single' or 'multi'
   */
  setSelectionMode(mode) {
    if (this.selectionManager) {
      this.selectionManager.setMode(mode);
    }
  }

  /**
   * Select all rows (currently visible/filtered rows)
   * This will select all rows that are currently visible based on applied filters and search
   * @returns {Number} Number of rows selected
   */
  selectAllRows() {
    if (!this.selectionManager) {
      console.warn('TablixJS: Selection is not enabled. Set selection.enabled to true in options.');
      return 0;
    }

    // Get currently visible/filtered data
    const allData = this.getData();
    if (allData.length === 0) {
      console.warn('TablixJS: No rows available to select.');
      return 0;
    }

    // Extract all IDs from current data
    const dataIdKey = this.options.selection.dataIdKey || 'id';
    const allIds = allData.map(row => String(row[dataIdKey]));

    // Select all rows
    this.selectionManager.selectRows(allIds);

    // Trigger custom event for select all action
    this.eventManager.trigger('selectAll', {
      selectedIds: allIds,
      selectedData: allData,
      count: allData.length
    });
    return allData.length;
  }

  // ===== LOCALIZATION API =====

  /**
   * Get localized string by key
   * @param {string} key - Translation key (e.g., 'pagination.next')
   * @param {Object} params - Parameters to substitute in the translation
   * @returns {string} Localized string
   */
  t(key, params = {}) {
    return this.localization.t(key, params);
  }

  /**
   * Set the current language
   * @param {string} language - Language code (e.g., 'en', 'fr', 'es')
   */
  setLanguage(language) {
    // Close any open filter dropdowns before changing language
    if (this.filterUI && this.filterUI.activeDropdown) {
      this.filterUI.closeAllDropdowns();
    }
    this.localization.setLanguage(language);
    this.options.language = language;

    // Ensure language translations are available
    this.ensureLanguageTranslations(language);

    // Re-render table to apply new translations
    this.refreshTable();
  }

  /**
   * Ensure language translations are loaded
   * @private
   * @param {string} language - Language code
   */
  ensureLanguageTranslations(language) {
    // If translations are already available, no need to reload
    if (this.localization.hasLanguage(language)) {
      return;
    }

    // Auto-load translations for common languages
    const languageLoaders = {
      'fr': () => frenchTranslations,
      'es': () => spanishTranslations,
      'sr': () => serbianTranslations
    };
    if (languageLoaders[language]) {
      try {
        const translations = languageLoaders[language]();
        this.localization.addTranslations(language, translations);
        console.log(`TablixJS: Auto-loaded ${language} translations`);
      } catch (error) {
        console.warn(`TablixJS: Failed to auto-load ${language} translations:`, error);
      }
    }
  }

  /**
   * Add translations for a specific language
   * @param {string} language - Language code
   * @param {Object} translations - Translations object
   */
  addTranslations(language, translations) {
    this.localization.addTranslations(language, translations);
    // If we just added translations for the current language, re-render
    if (language === this.localization.getCurrentLanguage()) {
      this.refreshTable();
    }
  }

  /**
   * Add a complete language pack (convenience method for developers)
   * This method helps developers add a new language with all required translations
   * @param {string} language - Language code (e.g., 'de', 'it', 'pt')
   * @param {Object} translations - Complete translations object
   * @param {boolean} setAsCurrent - Whether to immediately set this as the current language
   */
  addLanguagePack(language, translations, setAsCurrent = false) {
    // Add the translations
    this.addTranslations(language, translations);

    // Optionally set as current language
    if (setAsCurrent) {
      this.setLanguage(language);
    }
    console.log(`TablixJS: Language pack '${language}' added successfully`);
  }

  /**
   * Get current language
   * @returns {string} Current language code
   */
  getCurrentLanguage() {
    return this.localization.getCurrentLanguage();
  }

  /**
   * Get available languages
   * @returns {Array<string>} Array of available language codes
   */
  getAvailableLanguages() {
    return this.localization.getAvailableLanguages();
  }

  /**
   * Check if a language is available
   * @param {string} language - Language code to check
   * @returns {boolean} True if language is available
   */
  hasLanguage(language) {
    return this.localization.hasLanguage(language);
  }

  /**
   * Format number using current locale
   * @param {number} number - Number to format
   * @param {Object} options - Formatting options
   * @returns {string} Formatted number
   */
  formatNumber(number, options = {}) {
    return this.localization.formatNumber(number, options);
  }

  /**
   * Format date using current locale
   * @param {Date|string|number} date - Date to format
   * @param {Object} options - Formatting options
   * @returns {string} Formatted date
   */
  formatDate(date, options = {}) {
    return this.localization.formatDate(date, options);
  }

  /**
   * Destroy the table and clean up all resources
   */
  destroy() {
    // Clean up virtual scrolling
    if (this.virtualScrollManager) {
      this.virtualScrollManager.destroy();
    }

    // Clean up other managers
    if (this.selectionManager) {
      this.selectionManager.destroy && this.selectionManager.destroy();
    }
    if (this.searchManager) {
      this.searchManager.destroy && this.searchManager.destroy();
    }
    if (this.filterManager) {
      this.filterManager.destroy && this.filterManager.destroy();
    }
    if (this.sortingManager) {
      this.sortingManager.destroy && this.sortingManager.destroy();
    }
    if (this.paginationManager) {
      this.paginationManager.destroy && this.paginationManager.destroy();
    }

    // Clear container
    if (this.container) {
      this.container.innerHTML = '';
    }

    // Clear references
    this.virtualScrollManager = null;
    this.selectionManager = null;
    this.searchManager = null;
    this.filterManager = null;
    this.sortingManager = null;
    this.paginationManager = null;
    this.dataManager = null;
    this.renderer = null;
    this.eventManager = null;
  }

  /**
   * Destroy table and clean up event listeners
   */
  destroy() {
    // Clean up any event listeners
    const paginationContainer = this.container.querySelector('.tablix-pagination');
    if (paginationContainer) {
      paginationContainer.removeEventListener('click', this._paginationClickHandler);
    }

    // Destroy managers
    if (this.selectionManager) {
      this.selectionManager.destroy();
    }

    // Clear container
    this.container.innerHTML = '';

    // Clear references
    this.dataManager = null;
    this.renderer = null;
    this.eventManager = null;
    this.paginationManager = null;
    this.sortingManager = null;
    this.selectionManager = null;
  }
}

// Version info
const version = '0.1.0';

export { Table, Table as default, version };
//# sourceMappingURL=tablixjs.esm.js.map
