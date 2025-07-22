import DataManager from './DataManager.js';
import Renderer from './Renderer.js';
import EventManager from './EventManager.js';
import PaginationManager from './PaginationManager.js';

export default class Table {
  constructor(container, options = {}) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    this.options = {
      // Default options
      pagination: {
        enabled: true,
        pageSize: 10,
        mode: 'client', // 'client' or 'server'
        showPageNumbers: true,
        maxPageNumbers: 5,
        showFirstLast: true,
        showPrevNext: true,
        showPageSizes: false,
        pageSizeOptions: [10, 25, 50, 100],
        serverDataLoader: null
      },
      // Control panels
      controls: {
        enabled: false,
        search: true,
        pagination: true,
        pageSize: true,
        refresh: true,
        export: false,
        position: 'top' // 'top', 'bottom', 'both'
      },
      search: {
        enabled: true,
        placeholder: 'Search...',
        searchDelay: 300
      },
      ...options
    };

    // Initialize managers
    this.eventManager = new EventManager();
    this.dataManager = new DataManager(this, options.data || []);
    this.renderer = new Renderer(this);
    
    // Initialize pagination if enabled
    if (this.options.pagination && this.options.pagination.enabled !== false) {
      this.paginationManager = new PaginationManager(this, this.options.pagination);
    }

    this.init();
  }

  async init() {
    try {
      // Render table with first page of data
      await this.refreshTable();
      
      // Trigger afterLoad hook
      this.eventManager.trigger('afterLoad', this.dataManager.getData());
    } catch (error) {
      console.error('Failed to initialize table:', error);
      this.renderer.renderError(error);
    }
  }

  /**
   * Refresh the table with current data and pagination
   */
  async refreshTable() {
    if (this.paginationManager) {
      const pageData = await this.paginationManager.getPageData();
      this.renderer.renderTable(pageData);
    } else {
      // No pagination, show all data
      this.renderer.renderTable(this.dataManager.getData());
    }
  }

  /**
   * Load new data into the table
   */
  async loadData(data) {
    this.dataManager.setData(data);
    await this.refreshTable();
    this.eventManager.trigger('afterLoad', data);
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
   * Sort data by column(s)
   */
  async sort(sorts) {
    this.dataManager.applySorting(sorts);
    await this.refreshTable();
    this.eventManager.trigger('afterSort', sorts);
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
    this.dataManager.clearSorting();
    await this.refreshTable();
    this.eventManager.trigger('afterSort', []);
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
    this.options = { ...this.options, ...newOptions };
    
    // Update pagination options if provided
    if (newOptions.pagination && this.paginationManager) {
      this.paginationManager.options = { ...this.paginationManager.options, ...newOptions.pagination };
    }
    
    await this.refreshTable();
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

    // Clear container
    this.container.innerHTML = '';
    
    // Clear references
    this.dataManager = null;
    this.renderer = null;
    this.eventManager = null;
    this.paginationManager = null;
  }
}