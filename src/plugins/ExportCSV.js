/**
 * ExportCSV Plugin for TablixJS
 * 
 * Enables CSV export functionality, allowing users to export table data
 * to CSV format with customizable options for formatting and filtering.
 * 
 * Features:
 * - Export visible data or all data
 * - Custom column selection for export
 * - Configurable CSV delimiter and encoding
 * - Support for custom formatters
 * - Option to include/exclude headers
 * - Download progress feedback
 * 
 * Usage:
 * ```js
 * import ExportCSV from './plugins/ExportCSV.js';
 * 
 * table.use(ExportCSV, {
 *   filename: 'table-export.csv',
 *   delimiter: ',',
 *   includeHeaders: true,
 *   exportVisibleOnly: false,
 *   excludeColumns: ['actions']
 * });
 * 
 * // Export programmatically
 * table.exportCSV();
 * ```
 */
export default {
  name: 'ExportCSV',
  
  defaultOptions: {
    filename: 'table-export.csv',    // Default filename
    delimiter: ',',                  // CSV delimiter
    textDelimiter: '"',             // Text delimiter for values containing delimiter
    includeHeaders: true,           // Include column headers
    exportVisibleOnly: false,       // Export only visible/filtered data
    excludeColumns: [],             // Array of column names to exclude
    includeColumns: null,           // Array of column names to include (null = all)
    encoding: 'utf-8',              // File encoding
    addTimestamp: true,             // Add timestamp to filename
    buttonText: 'Export CSV',       // Text for export button
    buttonClass: 'tablix-export-btn', // CSS class for export button
    showProgress: true,             // Show export progress
    bom: true,                      // Add BOM for UTF-8
    maxRows: null,                  // Maximum rows to export (null = no limit)
    customFormatters: {}            // Custom formatters per column
  },

  install(table, options) {
    this.table = table;
    this.options = { ...this.defaultOptions, ...options };

    // Store bound methods for cleanup
    this.boundMethods = {
      onAfterRender: this.onAfterRender.bind(this),
      onExportClick: this.onExportClick.bind(this)
    };

    // Listen to table events
    this.table.on('afterRender', this.boundMethods.onAfterRender);

    // Add plugin methods to table
    this.table.exportCSV = this.exportCSV.bind(this);
    this.table.getCSVData = this.getCSVData.bind(this);
    this.table.setExportOptions = this.setExportOptions.bind(this);

    // Add export button if controls are enabled
    this.addExportButton();

    console.debug('TablixJS: ExportCSV plugin installed');
  },

  uninstall(table) {
    // Remove event listeners
    table.off('afterRender', this.boundMethods.onAfterRender);
    this.removeExportButton();

    // Remove added methods
    delete table.exportCSV;
    delete table.getCSVData;
    delete table.setExportOptions;

    console.debug('TablixJS: ExportCSV plugin uninstalled');
  },

  onAfterRender(data) {
    // Update export button if it exists
    this.updateExportButton();
  },

  addExportButton() {
    // Check if controls container exists
    const controlsContainer = this.table.container.querySelector('.tablix-controls');
    if (!controlsContainer) return;

    // Don't add button if it already exists
    if (controlsContainer.querySelector('.tablix-export-btn')) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = this.options.buttonClass;
    button.textContent = this.options.buttonText;
    button.addEventListener('click', this.boundMethods.onExportClick);

    // Add to controls container
    controlsContainer.appendChild(button);
  },

  removeExportButton() {
    const button = this.table.container.querySelector('.tablix-export-btn');
    if (button) {
      button.removeEventListener('click', this.boundMethods.onExportClick);
      button.remove();
    }
  },

  updateExportButton() {
    const button = this.table.container.querySelector('.tablix-export-btn');
    if (!button) return;

    const data = this.getExportData();
    const rowCount = data.length;
    
    // Update button text with row count
    button.textContent = `${this.options.buttonText} (${rowCount} rows)`;
    
    // Disable button if no data
    button.disabled = rowCount === 0;
  },

  onExportClick(event) {
    event.preventDefault();
    this.exportCSV();
  },

  async exportCSV(customOptions = {}) {
    const options = { ...this.options, ...customOptions };
    
    try {
      // Show progress if enabled
      if (options.showProgress) {
        this.showProgress('Preparing export...');
      }

      // Get data to export
      const data = this.getExportData(options);
      
      if (data.length === 0) {
        throw new Error('No data to export');
      }

      // Convert to CSV
      const csvContent = this.convertToCSV(data, options);
      
      // Generate filename
      const filename = this.generateFilename(options);
      
      // Create and download file
      this.downloadCSV(csvContent, filename, options);

      // Trigger export event
      this.table.trigger('csvExportComplete', {
        filename,
        rowCount: data.length,
        options
      });

      // Hide progress
      if (options.showProgress) {
        this.hideProgress();
      }

    } catch (error) {
      console.error('TablixJS ExportCSV: Export failed:', error);
      
      // Trigger error event
      this.table.trigger('csvExportError', {
        error,
        options
      });

      // Hide progress
      if (options.showProgress) {
        this.hideProgress();
      }

      throw error;
    }
  },

  getExportData(options = {}) {
    const exportOptions = { ...this.options, ...options };
    
    // Get data source
    let data;
    if (exportOptions.exportVisibleOnly) {
      data = this.table.getData(); // Filtered data
    } else {
      data = this.table.getOriginalData(); // All data
    }

    // Apply row limit
    if (exportOptions.maxRows && data.length > exportOptions.maxRows) {
      data = data.slice(0, exportOptions.maxRows);
    }

    return data;
  },

  convertToCSV(data, options) {
    if (!data || data.length === 0) {
      return '';
    }

    const delimiter = options.delimiter;
    const textDelimiter = options.textDelimiter;
    const columns = this.getExportColumns(options);
    const rows = [];

    // Add headers if enabled
    if (options.includeHeaders) {
      const headers = columns.map(col => 
        this.formatCSVValue(col.title || col.name || col.key, delimiter, textDelimiter)
      );
      rows.push(headers.join(delimiter));
    }

    // Add data rows
    data.forEach(row => {
      const values = columns.map(column => {
        const fieldName = column.name || column.key;
        let value = row[fieldName];

        // Apply custom formatter if available
        const customFormatter = options.customFormatters[fieldName];
        if (customFormatter && typeof customFormatter === 'function') {
          value = customFormatter(value, row);
        } else if (column.formatter && typeof column.formatter === 'function') {
          value = column.formatter(value, row);
        }

        // Convert to string and format for CSV
        return this.formatCSVValue(value, delimiter, textDelimiter);
      });

      rows.push(values.join(delimiter));
    });

    let csvContent = rows.join('\n');

    // Add BOM for UTF-8 if enabled
    if (options.bom) {
      csvContent = '\uFEFF' + csvContent;
    }

    return csvContent;
  },

  formatCSVValue(value, delimiter, textDelimiter) {
    // Handle null/undefined values
    if (value === null || value === undefined) {
      return '';
    }

    // Convert to string
    let stringValue = String(value);

    // Check if value needs to be quoted
    const needsQuoting = 
      stringValue.includes(delimiter) ||
      stringValue.includes(textDelimiter) ||
      stringValue.includes('\n') ||
      stringValue.includes('\r');

    if (needsQuoting) {
      // Escape internal quotes by doubling them
      stringValue = stringValue.replace(new RegExp(textDelimiter, 'g'), textDelimiter + textDelimiter);
      // Wrap in quotes
      stringValue = textDelimiter + stringValue + textDelimiter;
    }

    return stringValue;
  },

  getExportColumns(options) {
    const allColumns = this.table.columnManager ? 
      this.table.columnManager.getColumns() : 
      this.inferColumnsFromData();

    let columns = allColumns;

    // Filter by includeColumns if specified
    if (options.includeColumns && Array.isArray(options.includeColumns)) {
      columns = columns.filter(col => 
        options.includeColumns.includes(col.name || col.key)
      );
    }

    // Exclude columns if specified
    if (options.excludeColumns && Array.isArray(options.excludeColumns)) {
      columns = columns.filter(col => 
        !options.excludeColumns.includes(col.name || col.key)
      );
    }

    return columns;
  },

  inferColumnsFromData() {
    const data = this.getExportData();
    if (!data || data.length === 0) {
      return [];
    }

    // Get all unique keys from data
    const keys = new Set();
    data.forEach(row => {
      Object.keys(row).forEach(key => keys.add(key));
    });

    // Convert to column objects
    return Array.from(keys).map(key => ({
      name: key,
      key: key,
      title: key
    }));
  },

  generateFilename(options) {
    let filename = options.filename;

    // Add timestamp if enabled
    if (options.addTimestamp) {
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const nameWithoutExt = filename.replace(/\.csv$/i, '');
      filename = `${nameWithoutExt}-${timestamp}.csv`;
    }

    return filename;
  },

  downloadCSV(csvContent, filename, options) {
    // Create blob
    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=' + options.encoding
    });

    // Create download link
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.style.display = 'none';

    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up object URL
    setTimeout(() => {
      URL.revokeObjectURL(link.href);
    }, 100);
  },

  showProgress(message) {
    // Remove existing progress indicator
    this.hideProgress();

    const progress = document.createElement('div');
    progress.className = 'tablix-export-progress';
    progress.innerHTML = `
      <div class="tablix-export-progress-content">
        <div class="tablix-export-spinner"></div>
        <span class="tablix-export-message">${message}</span>
      </div>
    `;

    // Add to table container
    this.table.container.appendChild(progress);

    // Add styles if not already added
    this.addProgressStyles();
  },

  hideProgress() {
    const progress = this.table.container.querySelector('.tablix-export-progress');
    if (progress) {
      progress.remove();
    }
  },

  addProgressStyles() {
    if (document.getElementById('tablix-export-progress-styles')) return;

    const style = document.createElement('style');
    style.id = 'tablix-export-progress-styles';
    style.textContent = `
      .tablix-export-progress {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }
      
      .tablix-export-progress-content {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 20px;
        background: white;
        border-radius: 4px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      }
      
      .tablix-export-spinner {
        width: 20px;
        height: 20px;
        border: 2px solid #f3f3f3;
        border-top: 2px solid #007bff;
        border-radius: 50%;
        animation: tablix-spin 1s linear infinite;
      }
      
      @keyframes tablix-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .tablix-export-message {
        font-size: 14px;
        color: #333;
      }
      
      .tablix-export-btn {
        padding: 6px 12px;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        margin-left: 10px;
      }
      
      .tablix-export-btn:hover {
        background: #0056b3;
      }
      
      .tablix-export-btn:disabled {
        background: #6c757d;
        cursor: not-allowed;
      }
    `;
    
    document.head.appendChild(style);
  },

  // Public API methods added to table

  getCSVData(options = {}) {
    const exportOptions = { ...this.options, ...options };
    const data = this.getExportData(exportOptions);
    return this.convertToCSV(data, exportOptions);
  },

  setExportOptions(newOptions) {
    this.options = { ...this.options, ...newOptions };
    this.updateExportButton();
  }
};
