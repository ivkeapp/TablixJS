export default class DataManager {
  constructor(table, data = []) {
    this.table = table;
    this.originalData = data;   // full data set
    this.filteredData = [...data];  // filtered data
    this.currentFilters = {};   // current filter criteria
    this.currentSorts = [];     // current sort criteria (deprecated - use SortingManager)
    this.serverTotalRows = null; // for server-side pagination
  }

  getData() {
    return this.filteredData;
  }

  setData(data) {
    this.originalData = data;
    this.filteredData = [...data];
    
    // Update pagination info after data change
    if (this.table.paginationManager) {
      this.table.paginationManager.updatePaginationInfo();
    }
  }

  /**
   * Set data from server (for server-side operations)
   */
  setServerData(data, totalRows = null) {
    this.originalData = data;
    this.filteredData = [...data];
    this.serverTotalRows = totalRows;
    
    // Update pagination info after data change
    if (this.table.paginationManager) {
      this.table.paginationManager.updatePaginationInfo(totalRows);
    }
  }

  /**
   * Get total rows (for server-side pagination)
   */
  getTotalRows() {
    return this.serverTotalRows !== null ? this.serverTotalRows : this.originalData.length;
  }

  applyFilter(criteria) {
    this.currentFilters = criteria;
    
    if (Object.keys(criteria).length === 0) {
      // No filters, show all data
      this.filteredData = [...this.originalData];
    } else {
      // Simple filtering: supports multiple criteria
      this.filteredData = this.originalData.filter(item => {
        return Object.entries(criteria).every(([key, value]) => {
          const itemValue = (item[key] + '').toLowerCase();
          const searchValue = (value + '').toLowerCase();
          return itemValue.includes(searchValue);
        });
      });
    }

    // Reset pagination to first page after filtering
    if (this.table.paginationManager) {
      this.table.paginationManager.resetToFirstPage();
    }
  }

  applySorting(sorts) {
    this.currentSorts = sorts;
    
    if (!sorts || sorts.length === 0) {
      return;
    }

    // Use SortingManager if available, otherwise fall back to basic sorting
    if (this.table.sortingManager && this.table.sortingManager.currentSorts.length > 0) {
      this.table.sortingManager._applySorting();
    } else {
      // Legacy sorting implementation
      this.filteredData.sort((a, b) => {
        for (const sort of sorts) {
          const { column, direction } = sort;
          const aVal = a[column];
          const bVal = b[column];
          
          let comparison = 0;
          if (aVal < bVal) comparison = -1;
          else if (aVal > bVal) comparison = 1;
          
          if (comparison !== 0) {
            return direction === 'desc' ? -comparison : comparison;
          }
        }
        return 0;
      });
    }

    // Reset pagination to first page after sorting
    if (this.table.paginationManager) {
      this.table.paginationManager.resetToFirstPage();
    }
  }

  clearFilters() {
    this.currentFilters = {};
    this.filteredData = [...this.originalData];
    
    // Reset pagination to first page
    if (this.table.paginationManager) {
      this.table.paginationManager.resetToFirstPage();
    }
  }

  clearSorting() {
    this.currentSorts = [];
    // Don't change the filtered data order, just clear the sort state
    
    if (this.table.paginationManager) {
      this.table.paginationManager.resetToFirstPage();
    }
  }

  // Legacy method for backward compatibility
  getPageData(page = 1) {
    const pageSize = this.table.paginationManager ? 
      this.table.paginationManager.pageSize : 10;
    const start = (page - 1) * pageSize;
    return this.filteredData.slice(start, start + pageSize);
  }
}