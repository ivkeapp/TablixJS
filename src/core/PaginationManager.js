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
export default class PaginationManager {
  constructor(table, options = {}) {
    this.table = table;
    this.options = {
      pageSize: 10,
      mode: 'client', // 'client' or 'server'
      showPageNumbers: true,
      maxPageNumbers: 5,
      showFirstLast: true,
      showPrevNext: true,
      showPageSizes: false,
      pageSizeOptions: [10, 25, 50, 100],
      serverDataLoader: null, // async function for server-side pagination
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
   * Get page data for server-side pagination
   */
  async getServerPageData() {
    if (!this.options.serverDataLoader) {
      throw new Error('Server data loader not configured for server-side pagination');
    }

    this.isLoading = true;
    this.table.eventManager.trigger('beforePageLoad', {
      page: this.currentPage,
      pageSize: this.pageSize
    });

    try {
      const result = await this.options.serverDataLoader({
        page: this.currentPage,
        pageSize: this.pageSize,
        // Include current filter/sort state if available
        filters: this.table.dataManager.currentFilters || {},
        sorts: this.table.dataManager.currentSorts || []
      });

      // Expect result to have: { data: [], totalRows: number }
      if (result.totalRows !== undefined) {
        this.updatePaginationInfo(result.totalRows);
      }

      this.isLoading = false;
      this.table.eventManager.trigger('afterPageLoad', {
        page: this.currentPage,
        pageSize: this.pageSize,
        data: result.data,
        totalRows: result.totalRows
      });

      return result.data;
    } catch (error) {
      this.isLoading = false;
      this.table.eventManager.trigger('pageLoadError', error);
      throw error;
    }
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

    this.table.eventManager.trigger('beforePageChange', {
      oldPage,
      newPage: this.currentPage,
      pageSize: this.pageSize
    });

    try {
      await this.refreshTable();
      
      this.table.eventManager.trigger('afterPageChange', {
        oldPage,
        newPage: this.currentPage,
        pageSize: this.pageSize
      });
    } catch (error) {
      // Revert page change on error
      this.currentPage = oldPage;
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
    
    this.table.eventManager.trigger('beforePageSizeChange', {
      oldPageSize,
      newPageSize: this.pageSize,
      oldPage: this.currentPage,
      newPage
    });

    this.currentPage = newPage;
    await this.refreshTable();

    this.table.eventManager.trigger('afterPageSizeChange', {
      oldPageSize,
      newPageSize: this.pageSize,
      page: this.currentPage
    });
  }

  /**
   * Refresh the table with current pagination settings
   */
  async refreshTable() {
    const pageData = await this.getPageData();
    this.table.renderer.renderTable(pageData);
    this.table.renderer.renderPagination();
  }

  /**
   * Reset pagination to first page (useful after filtering/sorting)
   */
  async resetToFirstPage() {
    this.currentPage = 1;
    this.updatePaginationInfo();
    await this.refreshTable();
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
    await this.refreshTable();
  }
}
