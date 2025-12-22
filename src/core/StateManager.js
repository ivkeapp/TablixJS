/**
 * StateManager - Centralized state management for server-side operations
 * 
 * This class manages the persistent state for pagination, sorting, filtering, and search
 * to ensure consistency across all server requests and prevent state loss during operations.
 */
export default class StateManager {
  constructor(table) {
    this.table = table;
    
    // Centralized state
    this.state = {
      // Pagination state
      page: 1,
      pageSize: 10,
      totalRows: 0,
      
      // Sorting state
      sort: null, // { column: 'name', direction: 'asc' } or null
      
      // Filtering state
      filters: {}, // { columnName: { type: 'value', values: [...] } }
      
      // Search state
      search: '', // Global search term
      
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
    return { ...this.state };
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
    this.state.filters = { ...filters };
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
      sort: this.state.sort || {}, // Always send object, never null/undefined
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
      pageSize: this.state.pageSize, // Preserve page size
      totalRows: 0,
      sort: null,
      filters: {},
      search: '',
      isLoading: false
    };
    this.isInitialized = false;
  }
}
