/**
 * TablixJS jQuery Wrapper for Bundled Version
 * This version directly imports the Table class instead of looking for globals
 */

// Import the Table class directly
import Table from '../core/Table.js';

/**
 * Initialize jQuery wrapper with direct Table class reference
 * This function is called by the bundle to set up the jQuery plugin
 */
export function initializeJQueryWrapper() {
  // Get jQuery from various sources
  const $ = (typeof window !== 'undefined' && (window.jQuery || window.$)) || 
            (typeof global !== 'undefined' && (global.jQuery || global.$)) ||
            (typeof require === 'function' ? (() => {
              try { return require('jquery'); } catch(e) { return null; }
            })() : null);

  if (!$) {
    // jQuery not available - this is OK, just don't register the plugin
    console.warn('TablixJS jQuery wrapper: jQuery is not available. The wrapper will not be registered.');
    return false;
  }

  // Plugin name
  const PLUGIN_NAME = 'tablixJS';
  
  // Data key for storing TablixJS instances
  const DATA_KEY = 'tablixjs-instance';
  
  /**
   * TablixJS jQuery Plugin
   * @param {Object|String} options - Configuration options or method name
   * @param {...*} args - Additional arguments for method calls
   * @returns {jQuery} - jQuery chainable object
   */
  $.fn[PLUGIN_NAME] = function(options, ...args) {
    return this.each(function() {
      const $element = $(this);
      const instance = $element.data(DATA_KEY);

      // Handle method calls on existing instances
      if (typeof options === 'string') {
        if (!instance) {
          console.error(`TablixJS: Cannot call method '${options}' - table not initialized`);
          return;
        }

        const method = options;
        switch (method) {
          case 'destroy':
            instance.destroy();
            $element.removeData(DATA_KEY);
            break;
          case 'reload':
          case 'loadData':
            const newData = args[0];
            if (newData) {
              instance.loadData(newData);
            }
            break;
          case 'getData':
            return instance.getData();
          case 'getSelectedData':
            return instance.getSelectedData();
          case 'clearSelection':
            instance.clearSelection();
            break;
          case 'refresh':
            instance.refreshTable();
            break;
          default:
            console.warn(`TablixJS: Unknown method '${method}'`);
        }
        return;
      }

      // Initialize new instance
      initializeTable($element, options);
    });
  };

  /**
   * Initialize table instance
   * @private
   */
  function initializeTable($element, options = {}) {
    // Get existing instance
    const existingInstance = $element.data(DATA_KEY);
    
    // If instance already exists, destroy it first
    if (existingInstance) {
      console.warn('TablixJS: Reinitializing existing table instance.');
      existingInstance.destroy();
    }
    
    // Normalize options structure
    const normalizedOptions = normalizeOptions(options);
    
    try {
      // Create new TablixJS instance using direct Table class reference
      const instance = new Table($element[0], normalizedOptions);
      
      // Store instance reference
      $element.data(DATA_KEY, instance);
      
      // Set up jQuery-specific event forwarding
      setupJQueryEventForwarding($element, instance);
      
    } catch (error) {
      console.error('TablixJS: Failed to initialize table:', error);
    }
  }

  /**
   * Normalize options to handle jQuery-specific patterns
   * @private
   */
  function normalizeOptions(options) {
    // Handle jQuery-style option patterns
    const normalized = { ...options };

    // Convert jQuery elements to DOM elements
    if (options.container && options.container.jquery) {
      normalized.container = options.container[0];
    }

    return normalized;
  }

  /**
   * Set up jQuery event forwarding
   * @private
   */
  function setupJQueryEventForwarding($element, instance) {
    // Forward TablixJS events as jQuery events
    const eventsToForward = [
      'beforeLoad', 'afterLoad', 'loadError',
      'beforeSort', 'afterSort', 
      'beforeFilter', 'afterFilter',
      'beforePageChange', 'afterPageChange',
      'selectionChanged', 'selectAll'
    ];

    eventsToForward.forEach(eventName => {
      instance.on(eventName, (data) => {
        $element.trigger(`tablixjs:${eventName}`, data);
      });
    });
  }

  // jQuery plugin static methods
  
  /**
   * Get TablixJS instance from element
   * @param {jQuery|String} element - jQuery element or selector
   * @returns {Object|null} - TablixJS instance or null
   */
  $.fn[PLUGIN_NAME].getInstance = function(element) {
    const $el = $(element);
    return $el.length > 0 ? $el.data(DATA_KEY) : null;
  };

  /**
   * Check if element has TablixJS initialized
   * @param {jQuery|String} element - jQuery element or selector
   * @returns {Boolean} - True if initialized
   */
  $.fn[PLUGIN_NAME].isInitialized = function(element) {
    const $el = $(element);
    return $el.length > 0 && !!$el.data(DATA_KEY);
  };

  /**
   * Destroy all TablixJS instances on the page
   */
  $.fn[PLUGIN_NAME].destroyAll = function() {
    $(`[data-${DATA_KEY}]`).each(function() {
      const $el = $(this);
      const instance = $el.data(DATA_KEY);
      if (instance) {
        instance.destroy();
        $el.removeData(DATA_KEY);
      }
    });
  };

  console.log('TablixJS jQuery plugin initialized successfully (bundled version)');
  return true;
}
