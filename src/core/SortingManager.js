/**
 * SortingManager - Handles all sorting functionality for TablixJS
 * Supports client-side and server-side sorting with custom sort functions
 */
export default class SortingManager {
  constructor(table, options = {}) {
    this.table = table;
    this.options = {
      enabled: true,
      mode: 'client', // 'client' or 'server'
      serverSortLoader: null, // Function to load data from server with sorting
      defaultSortType: 'auto', // 'auto', 'string', 'number', 'date'
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
    const beforeSortData = { columnName, direction, currentSort: this.currentSort };
    this.table.eventManager.trigger('beforeSort', beforeSortData);

    if (this.options.mode === 'server') {
      await this._sortServer(columnName, direction);
    } else {
      this._sortClient(columnName, direction);
    }

    // Update UI
    this.table.renderer.updateSortIndicators(this.currentSort);
    
    // Refresh table display
    await this.table.refreshTable();

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
    const currentDirection = this.currentSort && this.currentSort.column === columnName 
      ? this.currentSort.direction 
      : null;
    
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
      this.currentSort = { column: columnName, direction };
    } else {
      this.currentSort = null;
    }

    // Apply sorting to data
    this._applySorting();
  }

  /**
   * Server-side sorting
   */
  async _sortServer(columnName, direction) {
    if (!this.options.serverSortLoader) {
      console.warn('Server-side sorting enabled but no serverSortLoader provided');
      return;
    }

    // Set current sort
    if (direction !== null) {
      this.currentSort = { column: columnName, direction };
    } else {
      this.currentSort = null;
    }

    try {
      // Load data from server with current sort state
      const result = await this.options.serverSortLoader({
        sort: this.currentSort,
        filters: this.table.dataManager.currentFilters,
        page: this.table.paginationManager ? this.table.paginationManager.currentPage : 1,
        pageSize: this.table.paginationManager ? this.table.paginationManager.pageSize : 10
      });

      // Update data manager with new data
      this.table.dataManager.setServerData(result.data, result.totalRows);
      
    } catch (error) {
      console.error('Failed to load sorted data from server:', error);
      throw error;
    }
  }

  /**
   * Apply current sort to filtered data
   */
  _applySorting() {
    if (!this.currentSort) return;
    
    const columns = this.table.options.columns || [];
    
    this.table.dataManager.filteredData.sort((a, b) => {
      // Support both 'name' and 'key' properties for column identification
      const column = columns.find(col => (col.name === this.currentSort.column) || (col.key === this.currentSort.column));
      const comparison = this._compareValues(
        a[this.currentSort.column], 
        b[this.currentSort.column], 
        column
      );
      
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
    const sortType = (column && column.sortType) || this.options.defaultSortType;
    
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
    const isDateLike = (str) => {
      return /^\d{4}-\d{2}-\d{2}/.test(str) || /^\d{1,2}\/\d{1,2}\/\d{4}/.test(str) || /^\d{1,2}-\d{1,2}-\d{4}/.test(str);
    };
    
    if (dateA.toString() !== 'Invalid Date' && dateB.toString() !== 'Invalid Date' && 
        isDateLike(String(a)) && isDateLike(String(b))) {
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
    
    return strA.localeCompare(strB, undefined, { sensitivity: 'base' });
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
   */  async clearSorting() {
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
    
    this.table.eventManager.trigger('afterSort', { currentSort: null });
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
    this.options = { ...this.options, ...newOptions };
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
    return this.currentSort && this.currentSort.column === columnName 
      ? this.currentSort.direction 
      : null;
  }
}
