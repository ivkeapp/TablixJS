import DataManager from './DataManager.js';
import Renderer from './Renderer.js';
import EventManager from './EventManager.js';
import PaginationManager from './PaginationManager.js';
import SortingManager from './SortingManager.js';
import ColumnManager from './ColumnManager.js';
import FilterManager from './FilterManager.js';
import FilterUI from './FilterUI.js';
import SearchManager from './SearchManager.js';
import SelectionManager from './SelectionManager.js';
import VirtualScrollManager from './VirtualScroll.js';
import Localization from './Localization.js';
import { frenchTranslations } from '../locales/fr.js';
import { spanishTranslations } from '../locales/es.js';
import { serbianTranslations } from '../locales/sr.js';

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
        placeholder: null, // Will use localized string if not provided
        searchDelay: 300, // Debounce delay in milliseconds
        minLength: 1, // Minimum characters before search starts
        caseSensitive: false
      },
      // Selection options
      selection: {
        enabled: false,  // Default: selection is disabled
        mode: 'single',  // 'single' or 'multi'
        dataIdKey: 'id'  // Key to use as stable row identifier
      },
      // Virtual scrolling options
      virtualScroll: {
        enabled: false,
        buffer: 10, // Number of rows to render above/below viewport
        rowHeight: null, // Auto-detected if null
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
    let dataToRender;
    
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
      // Traditional pagination mode
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
    
    // Update selection options if provided
    if (newOptions.selection && this.selectionManager) {
      this.selectionManager.options = { ...this.selectionManager.options, ...newOptions.selection };
      
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