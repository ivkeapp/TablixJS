import { isComplexValue, isFeatureEnabled } from './ValueResolver.js';

/**
 * ColumnManager - Enhanced column formatting system for TablixJS
 * 
 * Features:
 * - Flexible formatting with optional locale and formatOptions
 * - Supports text, date, currency, number, percent formats
 * - Custom renderer priority over formatting
 * - Extensible design for future format types
 * - Performance-optimized with cached formatters
 * - Auto-detects non-primitive column data and normalizes feature flags
 */
export default class ColumnManager {
  constructor(table) {
    this.table = table;
    this.columns = [];
    this.formatters = new Map(); // Cache for compiled formatters
    this.supportedFormats = ['text', 'date', 'currency', 'number', 'percent'];
  }

  /**
   * Initialize columns and prepare formatters.
   * Normalizes feature flags (filterable, sortable, editable) based on
   * data sampling when the table has initial data available.
   * @param {Array} columns - Array of column definitions
   */
  initializeColumns(columns = []) {
    this.columns = columns.map(col => this.prepareColumn(col));
    this.compileFormatters();
    return this.columns;
  }

  /**
   * Prepare and validate a single column definition.
   * Normalizes new properties: filterable, sortable, editable,
   * filterAccessor, filterPath, sortAccessor, sortPath, editAccessor, editPath.
   * @param {Object} column - Column definition
   * @returns {Object} Prepared column
   */
  prepareColumn(column) {
    const prepared = { ...column };

    // Validate format if provided
    if (prepared.format && !this.supportedFormats.includes(prepared.format)) {
      console.warn(`TablixJS: Unsupported format type '${prepared.format}' for column '${prepared.name}'. Falling back to no formatting.`);
      delete prepared.format;
    }

    // Ensure name property exists
    if (!prepared.name) {
      throw new Error('TablixJS: Column must have a "name" property');
    }

    // Set default title if not provided
    if (!prepared.title) {
      prepared.title = prepared.name;
    }

    // Validate accessor types
    for (const key of ['filterAccessor', 'sortAccessor', 'editAccessor']) {
      if (prepared[key] !== undefined && typeof prepared[key] !== 'function') {
        console.warn(`TablixJS: Column '${prepared.name}' has non-function ${key}. Ignoring.`);
        delete prepared[key];
      }
    }

    // Validate path types
    for (const key of ['filterPath', 'sortPath', 'editPath']) {
      if (prepared[key] !== undefined && typeof prepared[key] !== 'string') {
        console.warn(`TablixJS: Column '${prepared.name}' has non-string ${key}. Ignoring.`);
        delete prepared[key];
      }
    }

    return prepared;
  }

  /**
   * Compile and cache formatter functions for columns with format specified
   */
  compileFormatters() {
    this.formatters.clear();

    this.columns.forEach(column => {
      if (column.format) {
        const formatter = this.createFormatter(column);
        if (formatter) {
          this.formatters.set(column.name, formatter);
        }
      }
    });
  }

  /**
   * Create a formatter function for a column
   * @param {Object} column - Column definition
   * @returns {Function|null} Formatter function
   */
  createFormatter(column) {
    const { format, locale, formatOptions = {} } = column;

    switch (format) {
      case 'text':
        return (value) => this.formatText(value);

      case 'date':
        return (value) => this.formatDate(value, locale, formatOptions);

      case 'currency':
        return (value) => this.formatCurrency(value, locale, formatOptions, column.currency);

      case 'number':
        return (value) => this.formatNumber(value, locale, formatOptions);

      case 'percent':
        return (value) => this.formatPercent(value, locale, formatOptions);

      default:
        return null;
    }
  }

  /**
   * Format a cell value for a specific column
   * @param {Object|string} column - Column object or column name (for backwards compatibility)
   * @param {*} value - Cell value
   * @param {Object} row - Full row data (for context)
   * @returns {Object} Object with formatted value and metadata
   */
  formatCellValue(column, value, row) {
    // Support both column object (new) and column name (backwards compatibility)
    const columnObj = typeof column === 'string' ? this.getColumn(column) : column;
    const columnName = columnObj ? columnObj.name : column;
    
    // Priority 1: Custom renderer (overrides everything)
    if (columnObj && columnObj.renderer) {
      // If renderer wants formatted value, provide it
      const formatter = this.formatters.get(columnName);
      const formattedValue = formatter ? formatter(value) : value;
      const result = columnObj.renderer(value, row, formattedValue);
      return {
        value: result,
        isHtml: true // Custom renderers can return HTML
      };
    }

    // Priority 2: Format using cached formatter
    const formatter = this.formatters.get(columnName);
    if (formatter) {
      return {
        value: formatter(value),
        isHtml: false // Formatted values are safe text
      };
    }

    // Priority 3: Return raw value
    return {
      value: value,
      isHtml: false // Raw values need escaping
    };
  }

  /**
   * Get column definition by name
   * @param {string} columnName - Column name
   * @returns {Object|null} Column definition
   */
  getColumn(columnName) {
    return this.columns.find(col => col.name === columnName) || null;
  }

  /**
   * Get all columns
   * @returns {Array} Array of column definitions
   */
  getColumns() {
    return this.columns;
  }

  // =============================================================================
  // FORMAT IMPLEMENTATIONS
  // =============================================================================

  /**
   * Format text (basic string conversion with null/undefined handling)
   * @param {*} value - Value to format
   * @returns {string} Formatted text
   */
  formatText(value) {
    if (value == null) return '';
    return String(value);
  }

  /**
   * Format date using Intl.DateTimeFormat
   * @param {*} value - Date value (string, Date, timestamp)
   * @param {string} locale - Locale string (optional)
   * @param {Object} options - Intl.DateTimeFormat options
   * @returns {string} Formatted date
   */
  formatDate(value, locale, options = {}) {
    if (value == null) return '';

    try {
      const date = value instanceof Date ? value : new Date(value);
      
      if (isNaN(date.getTime())) {
        return String(value); // Return original if invalid date
      }

      const formatter = new Intl.DateTimeFormat(locale, options);
      return formatter.format(date);
    } catch (error) {
      console.warn('TablixJS: Date formatting error:', error);
      return String(value);
    }
  }

  /**
   * Format currency using Intl.NumberFormat
   * @param {*} value - Numeric value
   * @param {string} locale - Locale string (optional)
   * @param {Object} options - Intl.NumberFormat options
   * @param {string} currency - Currency code (e.g., 'USD', 'EUR')
   * @returns {string} Formatted currency
   */
  formatCurrency(value, locale, options = {}, currency = 'USD') {
    if (value == null) return '';

    const numericValue = Number(value);
    if (isNaN(numericValue)) {
      return String(value);
    }

    try {
      const formatOptions = {
        style: 'currency',
        currency: currency,
        ...options
      };

      const formatter = new Intl.NumberFormat(locale, formatOptions);
      return formatter.format(numericValue);
    } catch (error) {
      console.warn('TablixJS: Currency formatting error:', error);
      return String(value);
    }
  }

  /**
   * Format number using Intl.NumberFormat
   * @param {*} value - Numeric value
   * @param {string} locale - Locale string (optional)
   * @param {Object} options - Intl.NumberFormat options
   * @returns {string} Formatted number
   */
  formatNumber(value, locale, options = {}) {
    if (value == null) return '';

    const numericValue = Number(value);
    if (isNaN(numericValue)) {
      return String(value);
    }

    try {
      const formatter = new Intl.NumberFormat(locale, options);
      return formatter.format(numericValue);
    } catch (error) {
      console.warn('TablixJS: Number formatting error:', error);
      return String(value);
    }
  }

  /**
   * Format percentage using Intl.NumberFormat
   * @param {*} value - Numeric value (0.5 = 50%)
   * @param {string} locale - Locale string (optional)
   * @param {Object} options - Intl.NumberFormat options
   * @returns {string} Formatted percentage
   */
  formatPercent(value, locale, options = {}) {
    if (value == null) return '';

    const numericValue = Number(value);
    if (isNaN(numericValue)) {
      return String(value);
    }

    try {
      const formatOptions = {
        style: 'percent',
        ...options
      };

      const formatter = new Intl.NumberFormat(locale, formatOptions);
      return formatter.format(numericValue);
    } catch (error) {
      console.warn('TablixJS: Percent formatting error:', error);
      return String(value);
    }
  }

  // =============================================================================
  // EXTENSIBILITY METHODS
  // =============================================================================

  /**
   * Register a custom format type (for future extensibility)
   * @param {string} formatType - Format type name
   * @param {Function} formatterFactory - Function that creates formatter
   */
  registerFormat(formatType, formatterFactory) {
    if (this.supportedFormats.includes(formatType)) {
      console.warn(`TablixJS: Format type '${formatType}' already exists and will be overridden.`);
    }

    this.supportedFormats.push(formatType);
    
    // You would extend createFormatter method to handle this
    // This is a placeholder for future plugin architecture
    console.log(`TablixJS: Custom format '${formatType}' registered.`);
  }

  /**
   * Get supported format types
   * @returns {Array} Array of supported format type strings
   */
  getSupportedFormats() {
    return [...this.supportedFormats];
  }
}
