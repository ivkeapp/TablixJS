/**
 * SearchManager - Global search functionality for TablixJS
 * Provides real-time search across all table columns
 */
export default class SearchManager {
  constructor(table, options = {}) {
    this.table = table;
    this.options = {
      enabled: true,
      placeholder: 'Search...',
      searchDelay: 300, // Debounce delay in milliseconds
      caseSensitive: false,
      searchColumns: [], // Empty array means search all columns
      minLength: 1, // Minimum characters before search starts (changed from 0 to 1)
      ...options
    };

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
    this.table.eventManager.on('afterLoad', (data) => {
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
      searchInput.addEventListener('keydown', (e) => {
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

    // If search term is below minimum length, show all data
    if (searchTerm.length < this.options.minLength) {
      this.table.dataManager.filteredData = [...this.originalData];
    } else {
      // Filter data based on search term
      const filteredData = this.filterData(searchTerm);
      this.table.dataManager.filteredData = filteredData;
    }

    // Reset pagination to first page
    if (this.table.paginationManager) {
      this.table.paginationManager.resetToFirstPage();
    }

    // Refresh table display
    await this.table.refreshTable();

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

        const stringValue = this.options.caseSensitive ? 
          String(cellValue) : 
          String(cellValue).toLowerCase();

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
    const columns = this.table.columnManager ? 
      this.table.columnManager.getColumns() : 
      (this.table.options.columns || []);

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
    const oldOptions = { ...this.options };
    this.options = { ...this.options, ...newOptions };
    
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
    return { ...this.options };
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
