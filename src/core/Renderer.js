export default class Renderer {
  constructor(table) {
    this.table = table;
  }

  renderTable(data) {
    const columns = this.table.columnManager ? this.table.columnManager.getColumns() : (this.table.options.columns || []);
    const controlsOptions = this.table.options.controls;

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

    let html = '<div class="tablix-wrapper">';
    
    // Top controls
    if (controlsOptions.enabled && (controlsOptions.position === 'top' || controlsOptions.position === 'both')) {
      html += this.renderControls('top');
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
          html += `<span class="tablix-sort-arrow tablix-sort-asc" aria-label="Sorted ascending">↑</span>`;
        } else if (sortDirection === 'desc') {
          html += `<span class="tablix-sort-arrow tablix-sort-desc" aria-label="Sorted descending">↓</span>`;
        } else {
          html += `<span class="tablix-sort-arrow tablix-sort-none" aria-label="Not sorted">↕</span>`;
        }
        html += `</span>`;
      }
      
      html += `</div>`;
      html += `</th>`;
    });
    html += '</tr></thead>';

    // Body
    html += '<tbody class="tablix-tbody">';
    if (data.length === 0) {
      html += `<tr class="tablix-empty-row"><td colspan="${columns.length}" class="tablix-empty-cell">No data available</td></tr>`;
    } else {
      data.forEach((row, index) => {
        html += `<tr class="tablix-row" data-row-index="${index}">`;
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
    if (this.table.sortingManager) {
      this.bindSortEvents();
    }

    // Render filter icons and bind events if filtering is enabled
    if (this.table.filterUI) {
      this.table.filterUI.renderFilterIcons();
    }
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
      html += 'No records found';
    } else {
      html += `Showing ${info.startRow}-${info.endRow} of ${info.totalRows} records`;
    }
    html += '</div>';

    // Page size selector
    if (paginationManager.options.showPageSizes && paginationManager.options.pageSizeOptions.length > 1) {
      html += '<div class="tablix-pagination-page-size">';
      html += 'Show ';
      html += '<select class="tablix-page-size-select">';
      paginationManager.options.pageSizeOptions.forEach(size => {
        const selected = size === info.pageSize ? ' selected' : '';
        html += `<option value="${size}"${selected}>${size}</option>`;
      });
      html += '</select>';
      html += ' records per page';
      html += '</div>';
    }

    // Navigation controls
    if (info.totalPages > 1) {
      html += '<div class="tablix-pagination-nav">';
      
      // First page
      if (paginationManager.options.showFirstLast) {
        const disabled = info.currentPage === 1 ? ' disabled' : '';
        html += `<button class="tablix-pagination-btn tablix-pagination-first" data-page="1"${disabled}>First</button>`;
      }
      
      // Previous page
      if (paginationManager.options.showPrevNext) {
        const disabled = !info.hasPrevPage ? ' disabled' : '';
        html += `<button class="tablix-pagination-btn tablix-pagination-prev" data-page="${info.currentPage - 1}"${disabled}>Previous</button>`;
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
        html += `<button class="tablix-pagination-btn tablix-pagination-next" data-page="${info.currentPage + 1}"${disabled}>Next</button>`;
      }
      
      // Last page
      if (paginationManager.options.showFirstLast) {
        const disabled = info.currentPage === info.totalPages ? ' disabled' : '';
        html += `<button class="tablix-pagination-btn tablix-pagination-last" data-page="${info.totalPages}"${disabled}>Last</button>`;
      }
      
      html += '</div>';
    }

    // Loading indicator
    if (info.isLoading) {
      html += '<div class="tablix-pagination-loading">Loading...</div>';
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
    this.table.container.innerHTML = '<div class="tablix-loading">Loading...</div>';
  }

  /**
   * Render error state
   */
  renderError(error) {
    this.table.container.innerHTML = `<div class="tablix-error">Error: ${this.escapeHtml(error.message || error)}</div>`;
  }

  /**
   * Render control panel
   */
  renderControls(position) {
    const controlsOptions = this.table.options.controls;
    const searchOptions = this.table.options.search || { enabled: false, placeholder: 'Search...' };
    
    let html = `<div class="tablix-controls tablix-controls-${position}">`;
    
    // Left side controls
    html += '<div class="tablix-controls-left">';
    
    // Pagination controls
    if (controlsOptions.pagination && this.table.paginationManager) {
      html += '<div class="tablix-control-group tablix-pagination-controls">';
      html += '<button type="button" class="tablix-btn tablix-control-btn" data-action="firstPage">First</button>';
      html += '<button type="button" class="tablix-btn tablix-control-btn" data-action="prevPage">Previous</button>';
      html += '<button type="button" class="tablix-btn tablix-control-btn" data-action="nextPage">Next</button>';
      html += '<button type="button" class="tablix-btn tablix-control-btn" data-action="lastPage">Last</button>';
      html += '</div>';
    }
    
    // Page size control
    if (controlsOptions.pageSize && this.table.paginationManager) {
      const pageSizeOptions = this.table.paginationManager.options.pageSizeOptions;
      const currentPageSize = this.table.paginationManager.pageSize;
      
      html += '<div class="tablix-control-group tablix-page-size-group">';
      html += '<label for="tablix-page-size-select">Show:</label>';
      html += '<select class="tablix-page-size-select" id="tablix-page-size-select">';
      pageSizeOptions.forEach(size => {
        const selected = size === currentPageSize ? ' selected' : '';
        html += `<option value="${size}"${selected}>${size}</option>`;
      });
      html += '</select>';
      html += '<span>entries</span>';
      html += '</div>';
    }
    
    // Refresh control
    if (controlsOptions.refresh) {
      html += '<div class="tablix-control-group tablix-refresh-group">';
      html += '<button type="button" class="tablix-btn tablix-control-btn" data-action="refresh" title="Refresh data">⟳</button>';
      html += '</div>';
    }
    
    html += '</div>'; // Close left controls
    
    // Right side controls
    html += '<div class="tablix-controls-right">';
    
    // Search control
    if (controlsOptions.search && searchOptions.enabled) {
      html += '<div class="tablix-control-group tablix-search-group">';
      html += `<input type="text" 
                      class="tablix-search-input" 
                      id="tablix-search-input" 
                      name="table-search"
                      placeholder="${searchOptions.placeholder}" />`;
      html += '<button type="button" class="tablix-btn tablix-search-clear" title="Clear search" style="display: none;">✕</button>';
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
        arrow.setAttribute('aria-label', `Sorted ${currentSort.direction === 'asc' ? 'ascending' : 'descending'}`);
        arrow.removeAttribute('data-sort-order');
      } else {
        // Column is not sorted
        arrow.classList.remove('tablix-sort-asc', 'tablix-sort-desc');
        arrow.classList.add('tablix-sort-none');
        arrow.textContent = '↕';
        arrow.setAttribute('aria-label', 'Not sorted');
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