export default class Renderer {
  constructor(table) {
    this.table = table;
  }

  renderTable(data, virtualMode = false) {
    const columns = this.table.columnManager ? this.table.columnManager.getColumns() : (this.table.options.columns || []);
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
    const selectionAttributes = selectionEnabled 
      ? `data-selection-enabled data-selection-mode="${this.table.selectionManager.options.mode}"` 
      : 'data-selection-disabled';

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
            const result = this.table.columnManager.formatCellValue(col.name, cell, row);
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
    paginationContainer.addEventListener('click', async (e) => {
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
      pageSizeSelect.addEventListener('change', async (e) => {
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
    const searchOptions = this.table.options.search || { enabled: false, placeholder: null };
    
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
      pageSizeSelect.addEventListener('change', async (e) => {
        try {
          const newPageSize = parseInt(e.target.value);
          await this.table.changePageSize(newPageSize);
        } catch (error) {
          console.error('Failed to change page size:', error);
        }
      });
    }

    // Control buttons
    wrapper.addEventListener('click', async (e) => {
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
        // Simple CSV escaping
        return typeof value === 'string' && value.includes(',') 
          ? `"${value.replace(/"/g, '""')}"` 
          : value;
      });
      csv += values.join(',') + '\n';
    });
    
    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'table-data.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    this.table.eventManager.trigger('afterExport', { data, format: 'csv' });
  }

  /**
   * Bind sorting events to header columns
   */
  bindSortEvents() {
    const headerRow = this.table.container.querySelector('.tablix-header-row');
    if (!headerRow) return;

    headerRow.addEventListener('click', async (e) => {
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
    headerRow.addEventListener('keydown', async (e) => {
      const th = e.target.closest('.tablix-sortable');
      if (!th || (e.key !== 'Enter' && e.key !== ' ')) return;

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

    tbody.addEventListener('click', (e) => {
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
          rowIndex: globalRowIndex, // Pass global index
          localRowIndex: localRowIndex, // Also pass local index if needed
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