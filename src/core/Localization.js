/**
 * TablixJS Localization Module
 * Provides internationalization support for the table library
 */

export default class Localization {
  constructor() {
    this.currentLanguage = 'en';
    this.translations = new Map();
    this.fallbackLanguage = 'en';
    
    // Initialize with English defaults
    this.addTranslations('en', this.getDefaultEnglishTranslations());
  }

  /**
   * Get default English translations (fallback language pack)
   * @returns {Object} English translations object
   */
  getDefaultEnglishTranslations() {
    return {
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
      'filter.filterColumn': 'Filter column',
      'filter.filterByValue': 'Filter by Value',
      'filter.filterByCondition': 'Filter by Condition',
      'filter.searchValues': 'Search values...',
      'filter.selectAll': 'Select All',
      'filter.noValuesAvailable': 'No values available',
      'filter.addCondition': 'Add Condition',
      'filter.removeCondition': 'Remove condition',
      'filter.value': 'Value',
      'filter.apply': 'Apply',
      'filter.clear': 'Clear',
      'filter.cancel': 'Cancel',
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
  }

  /**
   * Set the current language
   * @param {string} language - Language code (e.g., 'en', 'fr', 'es')
   */
  setLanguage(language) {
    if (typeof language !== 'string' || language.trim() === '') {
      console.warn('TablixJS Localization: Invalid language code provided. Using fallback.');
      return;
    }

    this.currentLanguage = language.toLowerCase().trim();
  }

  /**
   * Add translations for a specific language
   * @param {string} language - Language code
   * @param {Object} translations - Translations object
   */
  addTranslations(language, translations) {
    if (typeof language !== 'string' || !translations || typeof translations !== 'object') {
      console.warn('TablixJS Localization: Invalid parameters for addTranslations.');
      return;
    }

    const languageCode = language.toLowerCase().trim();
    
    if (!this.translations.has(languageCode)) {
      this.translations.set(languageCode, {});
    }

    // Merge with existing translations for this language
    const existing = this.translations.get(languageCode);
    this.translations.set(languageCode, { ...existing, ...translations });
  }

  /**
   * Get localized string by key
   * @param {string} key - Translation key (e.g., 'pagination.next')
   * @param {Object} params - Parameters to substitute in the translation
   * @returns {string} Localized string or fallback
   */
  t(key, params = {}) {
    if (typeof key !== 'string') {
      console.warn('TablixJS Localization: Translation key must be a string.');
      return key;
    }

    // Try current language first
    let translation = this.getTranslationFromLanguage(this.currentLanguage, key);
    
    // Fallback to English if not found
    if (translation === null && this.currentLanguage !== this.fallbackLanguage) {
      translation = this.getTranslationFromLanguage(this.fallbackLanguage, key);
    }

    // Final fallback: return the key itself
    if (translation === null) {
      console.warn(`TablixJS Localization: Translation not found for key: ${key}`);
      return key;
    }

    // Substitute parameters in the translation
    return this.substituteParameters(translation, params);
  }

  /**
   * Get translation from a specific language
   * @private
   * @param {string} language - Language code
   * @param {string} key - Translation key
   * @returns {string|null} Translation or null if not found
   */
  getTranslationFromLanguage(language, key) {
    const languageTranslations = this.translations.get(language);
    
    if (!languageTranslations) {
      return null;
    }

    // First try direct key lookup (for flat structure like 'pagination.first')
    if (key in languageTranslations && typeof languageTranslations[key] === 'string') {
      return languageTranslations[key];
    }

    // Fallback to nested key lookup (for nested structure)
    const keys = key.split('.');
    let current = languageTranslations;

    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        return null;
      }
    }

    return typeof current === 'string' ? current : null;
  }

  /**
   * Substitute parameters in translation string
   * @private
   * @param {string} translation - Translation string with placeholders
   * @param {Object} params - Parameters to substitute
   * @returns {string} Translation with substituted parameters
   */
  substituteParameters(translation, params) {
    if (!params || typeof params !== 'object') {
      return translation;
    }

    let result = translation;
    
    // Replace {paramName} with actual values
    Object.keys(params).forEach(key => {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      result = result.replace(regex, params[key]);
    });

    return result;
  }

  /**
   * Get current language code
   * @returns {string} Current language code
   */
  getCurrentLanguage() {
    return this.currentLanguage;
  }

  /**
   * Get available languages
   * @returns {Array<string>} Array of available language codes
   */
  getAvailableLanguages() {
    return Array.from(this.translations.keys());
  }

  /**
   * Check if a language is available
   * @param {string} language - Language code to check
   * @returns {boolean} True if language is available
   */
  hasLanguage(language) {
    return this.translations.has(language.toLowerCase().trim());
  }

  /**
   * Get all translations for current language
   * @returns {Object} All translations for current language
   */
  getAllTranslations() {
    return this.translations.get(this.currentLanguage) || {};
  }

  /**
   * Remove translations for a specific language
   * @param {string} language - Language code to remove
   */
  removeLanguage(language) {
    const languageCode = language.toLowerCase().trim();
    if (languageCode === this.fallbackLanguage) {
      console.warn('TablixJS Localization: Cannot remove fallback language.');
      return;
    }
    
    this.translations.delete(languageCode);
    
    // If we removed the current language, switch to fallback
    if (this.currentLanguage === languageCode) {
      this.currentLanguage = this.fallbackLanguage;
    }
  }

  /**
   * Clear all translations except fallback
   */
  clearTranslations() {
    const fallbackTranslations = this.translations.get(this.fallbackLanguage);
    this.translations.clear();
    this.translations.set(this.fallbackLanguage, fallbackTranslations);
    this.currentLanguage = this.fallbackLanguage;
  }

  /**
   * Format number based on current locale
   * @param {number} number - Number to format
   * @param {Object} options - Formatting options
   * @returns {string} Formatted number
   */
  formatNumber(number, options = {}) {
    const {
      style = 'decimal',
      currency = 'USD',
      minimumFractionDigits,
      maximumFractionDigits
    } = options;

    try {
      const formatter = new Intl.NumberFormat(this.getLocaleCode(), {
        style,
        currency: style === 'currency' ? currency : undefined,
        minimumFractionDigits,
        maximumFractionDigits
      });
      
      return formatter.format(number);
    } catch (error) {
      // Fallback formatting if Intl is not available
      return this.fallbackNumberFormat(number, options);
    }
  }

  /**
   * Format date based on current locale
   * @param {Date|string|number} date - Date to format
   * @param {Object} options - Formatting options
   * @returns {string} Formatted date
   */
  formatDate(date, options = {}) {
    const dateObj = date instanceof Date ? date : new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      return date.toString();
    }

    try {
      const formatter = new Intl.DateTimeFormat(this.getLocaleCode(), options);
      return formatter.format(dateObj);
    } catch (error) {
      // Fallback to simple date formatting
      return dateObj.toLocaleDateString();
    }
  }

  /**
   * Get locale code for Intl formatting
   * @private
   * @returns {string} Locale code
   */
  getLocaleCode() {
    // Map language codes to locale codes
    const languageToLocaleMap = {
      'en': 'en-US',
      'fr': 'fr-FR',
      'es': 'es-ES',
      'de': 'de-DE',
      'it': 'it-IT',
      'pt': 'pt-BR',
      'ru': 'ru-RU',
      'ja': 'ja-JP',
      'ko': 'ko-KR',
      'zh': 'zh-CN'
    };

    return languageToLocaleMap[this.currentLanguage] || this.currentLanguage || 'en-US';
  }

  /**
   * Fallback number formatting when Intl is not available
   * @private
   * @param {number} number - Number to format
   * @param {Object} options - Formatting options
   * @returns {string} Formatted number
   */
  fallbackNumberFormat(number, options = {}) {
    const { style } = options;
    
    if (style === 'currency') {
      const symbol = this.t('format.currency.symbol');
      return `${symbol}${number.toFixed(2)}`;
    } else if (style === 'percent') {
      const symbol = this.t('format.percentage.symbol');
      return `${(number * 100).toFixed(1)}${symbol}`;
    }
    
    return number.toString();
  }

  /**
   * Pluralization helper
   * @param {number} count - Count for pluralization
   * @param {string} singularKey - Key for singular form
   * @param {string} pluralKey - Key for plural form
   * @param {Object} params - Additional parameters
   * @returns {string} Pluralized string
   */
  pluralize(count, singularKey, pluralKey, params = {}) {
    const key = count === 1 ? singularKey : pluralKey;
    return this.t(key, { count, ...params });
  }
}
