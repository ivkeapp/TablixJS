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
export default class FilterManager {
  constructor(table, options = {}) {
    this.table = table;
    this.options = {
      enabled: true,
      mode: 'client', // 'client' or 'server'
      serverFilterLoader: null, // Function to load filtered data from server
      debounceDelay: 300, // Debounce delay for input filters
      showBadges: true, // Show filter count badges
      showTooltips: true, // Show filter summary tooltips
      ...options
    };

    // Filter state per column
    this.columnFilters = new Map(); // { columnName: { type, config, isActive } }
    
    // Supported filter operators
    this.operators = {
      'none': { label: 'None', apply: () => true },
      'isEmpty': { label: 'Is empty', apply: (value) => value === null || value === undefined || value === '' },
      'isNotEmpty': { label: 'Is not empty', apply: (value) => value !== null && value !== undefined && value !== '' },
      'equals': { label: 'Is equal to', apply: (value, filterValue) => String(value).toLowerCase() === String(filterValue).toLowerCase() },
      'notEquals': { label: 'Is not equal to', apply: (value, filterValue) => String(value).toLowerCase() !== String(filterValue).toLowerCase() },
      'beginsWith': { label: 'Begins with', apply: (value, filterValue) => String(value).toLowerCase().startsWith(String(filterValue).toLowerCase()) },
      'endsWith': { label: 'Ends with', apply: (value, filterValue) => String(value).toLowerCase().endsWith(String(filterValue).toLowerCase()) },
      'contains': { label: 'Contains', apply: (value, filterValue) => String(value).toLowerCase().includes(String(filterValue).toLowerCase()) },
      'notContains': { label: 'Does not contain', apply: (value, filterValue) => !String(value).toLowerCase().includes(String(filterValue).toLowerCase()) }
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

    if (this.options.mode === 'server') {
      await this._filterServer();
    } else {
      this._filterClient();
    }

    // Update UI indicators
    this.updateFilterIndicators();
    
    // Refresh table display
    await this.table.refreshTable();

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

    if (this.options.mode === 'server') {
      await this._filterServer();
    } else {
      this._filterClient();
    }

    this.updateFilterIndicators();
    await this.table.refreshTable();

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

    if (this.options.mode === 'server') {
      await this._filterServer();
    } else {
      this._filterClient();
    }

    this.updateFilterIndicators();
    await this.table.refreshTable();

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
    const data = this.table.dataManager.originalData;
    const values = new Set();
    
    data.forEach(row => {
      const value = row[columnName];
      if (value !== null && value !== undefined) {
        values.add(String(value));
      }
    });
    
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
      return Array.isArray(filterConfig.conditions) && 
             filterConfig.conditions.every(cond => 
               cond.operator && this.operators[cond.operator]
             );
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
      return filterConfig.conditions && 
             filterConfig.conditions.some(cond => 
               cond.operator && cond.operator !== 'none' && 
               (cond.operator === 'isEmpty' || cond.operator === 'isNotEmpty' || cond.value !== undefined)
             );
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
   * Server-side filtering
   * @private
   */
  async _filterServer() {
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
      return filterConfig.values.includes(String(cellValue));
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
      const activeConditions = filter.config.conditions.filter(cond => 
        cond.operator && cond.operator !== 'none'
      );
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
    return { ...this.operators };
  }
}
