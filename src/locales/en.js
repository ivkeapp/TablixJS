/**
 * English (en) translations for TablixJS
 * This is the default fallback language pack
 */
export const englishTranslations = {
  // General
  'general.loading': 'Loading...',
  'general.error': 'Error',
  'general.noData': 'No data available',
  'general.show': 'Show',
  'general.entries': 'entries',
  'general.of': 'of',
  'general.to': 'to',
  'general.records': 'records',
  'general.perPage': 'per page',
  'general.showing': 'Showing',
  'general.total': 'Total',
  'general.rows': 'rows',

  // Search
  'search.placeholder': 'Search...',
  'search.clear': 'Clear search',
  'search.noResults': 'No results found',
  'search.resultsFound': 'results found',

  // Pagination
  'pagination.first': 'First',
  'pagination.previous': 'Previous',
  'pagination.next': 'Next',
  'pagination.last': 'Last',
  'pagination.page': 'Page',
  'pagination.pageOf': 'Page {currentPage} of {totalPages}',
  'pagination.showingRecords': 'Showing {startRow}-{endRow} of {totalRows} records',
  'pagination.noRecords': 'No records found',
  'pagination.pageSize': 'Records per page',

  // Sorting
  'sort.sortAscending': 'Sort ascending',
  'sort.sortDescending': 'Sort descending',
  'sort.sortedAscending': 'Sorted ascending',
  'sort.sortedDescending': 'Sorted descending',
  'sort.notSorted': 'Not sorted',
  'sort.clearSort': 'Clear sorting',

  // Selection
  'selection.selectRow': 'Select row',
  'selection.deselectRow': 'Deselect row',
  'selection.selectAll': 'Select all',
  'selection.deselectAll': 'Deselect all',
  'selection.selectedCount': '{count} selected',
  'selection.selectAllVisible': 'Select all visible rows',
  'selection.clearSelection': 'Clear selection',

  // Filtering
  'filter.filter': 'Filter',
  'filter.clearFilter': 'Clear filter',
  'filter.clearAllFilters': 'Clear all filters',
  'filter.applyFilter': 'Apply filter',
  'filter.filterBy': 'Filter by',
  'filter.contains': 'Contains',
  'filter.startsWith': 'Starts with',
  'filter.endsWith': 'Ends with',
  'filter.equals': 'Equals',
  'filter.notEquals': 'Not equals',
  'filter.greaterThan': 'Greater than',
  'filter.lessThan': 'Less than',
  'filter.greaterThanOrEqual': 'Greater than or equal',
  'filter.lessThanOrEqual': 'Less than or equal',
  'filter.between': 'Between',
  'filter.isEmpty': 'Is empty',
  'filter.isNotEmpty': 'Is not empty',
  'filter.selectValues': 'Select values',
  'filter.noOptionsAvailable': 'No options available',
  'filter.complexDataNotSupported': 'Value filtering is not available for columns with complex data. Use Condition filtering instead.',

  // Controls
  'controls.refresh': 'Refresh data',
  'controls.export': 'Export data',
  'controls.settings': 'Settings',
  'controls.columns': 'Columns',
  'controls.showColumns': 'Show/Hide columns',

  // Virtual Scrolling
  'virtualScroll.loadingMoreRows': 'Loading more rows...',
  'virtualScroll.scrollToTop': 'Scroll to top',
  'virtualScroll.scrollToBottom': 'Scroll to bottom',

  // Error Messages
  'error.loadingData': 'Failed to load data',
  'error.networkError': 'Network error occurred',
  'error.invalidData': 'Invalid data format',
  'error.serverError': 'Server error occurred',
  'error.timeout': 'Request timed out',
  'error.unknown': 'An unknown error occurred',
  'error.retry': 'Retry',

  // Data Types
  'dataType.string': 'Text',
  'dataType.number': 'Number',
  'dataType.date': 'Date',
  'dataType.boolean': 'Boolean',
  'dataType.currency': 'Currency',
  'dataType.percentage': 'Percentage',

  // Accessibility
  'accessibility.table': 'Data table',
  'accessibility.sortableColumn': 'Sortable column',
  'accessibility.selectableRow': 'Selectable row',
  'accessibility.rowSelected': 'Row selected',
  'accessibility.rowNotSelected': 'Row not selected',
  'accessibility.pageNavigation': 'Page navigation',
  'accessibility.searchInput': 'Search table data',
  'accessibility.filterColumn': 'Filter column',

  // Actions
  'action.apply': 'Apply',
  'action.cancel': 'Cancel',
  'action.close': 'Close',
  'action.save': 'Save',
  'action.reset': 'Reset',
  'action.ok': 'OK',
  'action.yes': 'Yes',
  'action.no': 'No',

  // Time and Date
  'date.today': 'Today',
  'date.yesterday': 'Yesterday',
  'date.thisWeek': 'This week',
  'date.lastWeek': 'Last week',
  'date.thisMonth': 'This month',
  'date.lastMonth': 'Last month',

  // Numbers and Formatting
  'format.currency.symbol': '$',
  'format.decimal.separator': '.',
  'format.thousand.separator': ',',
  'format.percentage.symbol': '%'
};

export default englishTranslations;
