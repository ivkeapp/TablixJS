import DataManager from './DataManager.js';
import Renderer from './Renderer.js';
import EventManager from './EventManager.js';
import PaginationManager from './PaginationManager.js';
import SortingManager from './SortingManager.js';
import ColumnManager from './ColumnManager.js';
import FilterManager from './FilterManager.js';
import FilterUI from './FilterUI.js';
import SearchManager from './SearchManager.js';

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
      // Sorting options
      sorting: {
        enabled: true,
        mode: 'client', // 'client' or 'server'
        serverSortLoader: null,
        defaultSortType: 'auto',
        caseSensitive: false,
        nullsFirst: false
      },
      // Filtering options
      filtering: {
        enabled: true,
        mode: 'client', // 'client' or 'server'
        serverFilterLoader: null,
        debounceDelay: 300,
        showBadges: true,
        showTooltips: true
      },
      // Control panels
      controls: {
        enabled: true,  // Enable by default to show search
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
        searchDelay: 300, // Debounce delay in milliseconds
        minLength: 1, // Minimum characters before search starts
        caseSensitive: false
      },
      ...options
    };

    // Initialize managers
    this.eventManager = new EventManager();
    this.columnManager = new ColumnManager(this);
    this.dataManager = new DataManager(this, options.data || []);
    this.renderer = new Renderer(this);
    
    // Initialize columns if provided
    if (options.columns) {
      this.columnManager.initializeColumns(options.columns);
    }
    
    // Initialize pagination if enabled
    if (this.options.pagination && this.options.pagination.enabled !== false) {
      this.paginationManager = new PaginationManager(this, this.options.pagination);
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

    this.init();
  }

  async init() {
    try {
      // Initialize search manager
      if (this.searchManager) {
        this.searchManager.init();
      }

      // Get initial data
      const initialData = this.dataManager.getData();
      
      // Trigger beforeLoad hook for initial data
      this.eventManager.trigger('beforeLoad', { source: initialData });
      
      // Render table with first page of data
      await this.refreshTable();
      
      // Trigger afterLoad hook with consistent payload format
      this.eventManager.trigger('afterLoad', { data: initialData, source: initialData });
    } catch (error) {
      console.error('Failed to initialize table:', error);
      this.eventManager.trigger('loadError', { error, source: 'initialization' });
      if (this.renderer && this.renderer.renderError) {
        this.renderer.renderError(error);
      }
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
   * Supports multiple data sources:
   * - Array: loadData([{id: 1, name: 'John'}])
   * - URL string: loadData('/api/data')
   * - Async function: loadData(() => fetch('/api/data').then(r => r.json()))
   * @param {Array|string|Function} source - Data source
   */
  async loadData(source) {
    try {
      // Trigger beforeLoad hook
      this.eventManager.trigger('beforeLoad', { source });

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
      this.eventManager.trigger('afterLoad', { data, source });

    } catch (error) {
      // Handle loading errors
      console.error('Error loading data:', error);
      this.eventManager.trigger('loadError', { error, source });
      
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
      this.dataManager.applySorting([{ column: columnName, direction }]);
      await this.refreshTable();
      this.eventManager.trigger('afterSort', [{ column: columnName, direction }]);
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
    return { sort: null, mode: 'client' };
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
    this.sortingManager = null;
  }
}