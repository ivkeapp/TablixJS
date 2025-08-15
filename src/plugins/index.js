/**
 * TablixJS Plugin Registry
 * 
 * Central registry for all official TablixJS plugins.
 * This file exports all available plugins for easy importing.
 * 
 * Usage:
 * ```js
 * // Import individual plugins
 * import { DraggableColumns, InlineEdit, ExportCSV } from './plugins/index.js';
 * 
 * // Or import all plugins
 * import * as TablixPlugins from './plugins/index.js';
 * 
 * // Use plugins
 * table.use(DraggableColumns, { axis: 'x' });
 * table.use(InlineEdit, { editableColumns: ['name', 'price'] });
 * table.use(ExportCSV, { filename: 'my-data.csv' });
 * ```
 */

// Core plugins
export { default as DraggableColumns } from './DraggableColumns.js';
export { default as InlineEdit } from './InlineEdit.js';
export { default as ExportCSV } from './ExportCSV.js';

// Plugin categories for documentation and organization
export const PluginCategories = {
  UI: {
    DraggableColumns: 'Enable drag and drop column reordering',
    StickyHeader: 'Keep header visible while scrolling',
    FloatingToolbar: 'Floating action toolbar for selected rows'
  },
  
  EDITING: {
    InlineEdit: 'Edit cell values directly in the table',
    BulkEdit: 'Edit multiple rows simultaneously',
    FormEdit: 'Edit rows in a popup form'
  },
  
  EXPORT: {
    ExportCSV: 'Export table data to CSV format',
    ExportExcel: 'Export table data to Excel format',
    ExportPDF: 'Export table data to PDF format'
  },
  
  DATA: {
    ComputedColumns: 'Add calculated columns based on other columns',
    DataValidation: 'Validate data integrity and formats',
    DataTransformation: 'Transform data on-the-fly'
  },
  
  UX: {
    SelectionSummary: 'Show summary statistics for selected rows',
    RowActions: 'Add action buttons to each row',
    QuickFilters: 'Add quick filter buttons for common values'
  },
  
  ANALYTICS: {
    UserTracking: 'Track user interactions with the table',
    PerformanceMonitor: 'Monitor table performance metrics',
    UsageHeatmap: 'Visualize which data is accessed most'
  }
};

// Plugin metadata for documentation
export const PluginMeta = {
  DraggableColumns: {
    name: 'DraggableColumns',
    version: '1.0.0',
    description: 'Enable drag and drop column reordering',
    dependencies: [],
    conflicts: [],
    requirements: {
      features: ['columnManager'],
      events: ['afterRender']
    },
    options: {
      axis: 'x',
      handle: null,
      ghost: true,
      animate: true,
      tolerance: 5,
      opacity: 0.5,
      zIndex: 1000,
      cursor: 'grabbing',
      disabled: false
    }
  },
  
  InlineEdit: {
    name: 'InlineEdit',
    version: '1.0.0',
    description: 'Edit cell values directly in the table',
    dependencies: [],
    conflicts: [],
    requirements: {
      features: ['columnManager'],
      events: ['afterRender']
    },
    options: {
      editableColumns: [],
      trigger: 'doubleclick',
      saveOnBlur: true,
      saveOnEnter: true,
      cancelOnEscape: true,
      validators: {},
      inputTypes: {},
      selectOptions: {},
      errorClass: 'tablix-edit-error',
      editingClass: 'tablix-editing',
      allowEmpty: true,
      confirmDelete: true,
      animation: true
    }
  },
  
  ExportCSV: {
    name: 'ExportCSV',
    version: '1.0.0',
    description: 'Export table data to CSV format',
    dependencies: [],
    conflicts: [],
    requirements: {
      features: [],
      events: ['afterRender']
    },
    options: {
      filename: 'table-export.csv',
      delimiter: ',',
      textDelimiter: '"',
      includeHeaders: true,
      exportVisibleOnly: false,
      excludeColumns: [],
      includeColumns: null,
      encoding: 'utf-8',
      addTimestamp: true,
      buttonText: 'Export CSV',
      buttonClass: 'tablix-export-btn',
      showProgress: true,
      bom: true,
      maxRows: null,
      customFormatters: {}
    }
  }
};

// Utility functions for plugin management
export const PluginUtils = {
  /**
   * Check if plugins are compatible with each other
   * @param {Array} pluginNames - Array of plugin names to check
   * @returns {Object} Compatibility result
   */
  checkCompatibility(pluginNames) {
    const conflicts = [];
    const missing = [];
    
    pluginNames.forEach(name => {
      const meta = PluginMeta[name];
      if (!meta) {
        missing.push(name);
        return;
      }
      
      // Check for conflicts with other plugins in the list
      meta.conflicts.forEach(conflict => {
        if (pluginNames.includes(conflict)) {
          conflicts.push({ plugin: name, conflictsWith: conflict });
        }
      });
    });
    
    return {
      compatible: conflicts.length === 0 && missing.length === 0,
      conflicts,
      missing
    };
  },
  
  /**
   * Get plugin dependencies
   * @param {string} pluginName - Plugin name
   * @returns {Array} Array of dependency names
   */
  getDependencies(pluginName) {
    const meta = PluginMeta[pluginName];
    return meta ? meta.dependencies : [];
  },
  
  /**
   * Get plugins by category
   * @param {string} category - Category name
   * @returns {Array} Array of plugin names in category
   */
  getPluginsByCategory(category) {
    const categoryPlugins = PluginCategories[category.toUpperCase()];
    return categoryPlugins ? Object.keys(categoryPlugins) : [];
  },
  
  /**
   * Validate plugin options
   * @param {string} pluginName - Plugin name
   * @param {Object} options - Options to validate
   * @returns {Object} Validation result
   */
  validateOptions(pluginName, options) {
    const meta = PluginMeta[pluginName];
    if (!meta) {
      return { valid: false, error: 'Unknown plugin' };
    }
    
    const defaultOptions = meta.options;
    const errors = [];
    
    // Check for unknown options
    Object.keys(options).forEach(key => {
      if (!(key in defaultOptions)) {
        errors.push(`Unknown option: ${key}`);
      }
    });
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
};

// Default plugin configurations for common use cases
export const PluginPresets = {
  /**
   * Basic editing setup
   */
  BasicEditing: [
    { plugin: 'InlineEdit', options: { trigger: 'doubleclick' } },
    { plugin: 'ExportCSV', options: { includeHeaders: true } }
  ],
  
  /**
   * Advanced editing with drag & drop
   */
  AdvancedEditing: [
    { plugin: 'DraggableColumns', options: { animate: true } },
    { plugin: 'InlineEdit', options: { trigger: 'doubleclick', saveOnBlur: true } },
    { plugin: 'ExportCSV', options: { addTimestamp: true } }
  ],
  
  /**
   * Read-only with export capabilities
   */
  ReadOnlyExport: [
    { plugin: 'DraggableColumns', options: { axis: 'x' } },
    { plugin: 'ExportCSV', options: { exportVisibleOnly: true } }
  ]
};

/**
 * Apply a plugin preset to a table
 * @param {Object} table - TablixJS table instance
 * @param {string} presetName - Name of the preset to apply
 * @param {Object} overrides - Option overrides for specific plugins
 */
export function applyPreset(table, presetName, overrides = {}) {
  const preset = PluginPresets[presetName];
  if (!preset) {
    throw new Error(`Unknown preset: ${presetName}`);
  }
  
  preset.forEach(({ plugin, options }) => {
    const finalOptions = {
      ...options,
      ...(overrides[plugin] || {})
    };
    
    // Import and apply plugin
    import(`./${plugin}.js`).then(module => {
      table.use(module.default, finalOptions);
    }).catch(error => {
      console.error(`Failed to load plugin ${plugin}:`, error);
    });
  });
}
