/**
 * TablixJS jQuery Plugin (Standalone) v1.0.4
 * Requires TablixJS and jQuery to be loaded separately
 * (c) 2025 Ivan Zarkovic
 * Released under the MIT License.
 */
(function (factory) {
  typeof define === 'function' && define.amd ? define(factory) :
  factory();
})((function () { 'use strict';

  /**
   * TablixJS jQuery Plugin (Standalone)
   * This file provides jQuery integration for TablixJS when TablixJS is already loaded
   * 
   * Usage:
   * 1. Load TablixJS core first
   * 2. Load jQuery
   * 3. Load this plugin file
   * 
   * The plugin will automatically register itself if both TablixJS and jQuery are available.
   */

  (function () {

    // Check if we're in a browser environment
    const isWindow = typeof window !== 'undefined';
    const isGlobal = typeof global !== 'undefined';

    // Get jQuery from various sources
    const $ = isWindow && (window.jQuery || window.$) || isGlobal && (global.jQuery || global.$);
    if (!$) {
      // jQuery not available - this is expected in some scenarios
      return;
    }

    // Get TablixJS from various sources
    let TablixJS = null;
    if (isWindow) {
      TablixJS = window.TablixJS || window.Table;
    } else if (isGlobal) {
      TablixJS = global.TablixJS || global.Table;
    }

    // If TablixJS is not available globally, try to require it (Node.js/CommonJS)
    if (!TablixJS && typeof require === 'function') {
      try {
        TablixJS = require('tablixjs');
        // Could be default export or named export
        TablixJS = TablixJS.default || TablixJS.Table || TablixJS;
      } catch (e) {
        // Could not require TablixJS
      }
    }
    if (!TablixJS) {
      console.warn('TablixJS jQuery plugin: TablixJS is not available. Please load TablixJS before this plugin.');
      return;
    }

    // Ensure we have the Table constructor
    const Table = TablixJS.Table || TablixJS.default || TablixJS;
    if (typeof Table !== 'function') {
      console.error('TablixJS jQuery plugin: TablixJS Table constructor is not available.');
      return;
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
    $.fn[PLUGIN_NAME] = function (options, ...args) {
      return this.each(function () {
        const $element = $(this);
        const instance = $element.data(DATA_KEY);

        // If options is a string, treat it as a method call
        if (typeof options === 'string') {
          handleMethodCall($element, instance, options, args);
        } else {
          // Initialize new instance
          handleInitialization($element, instance, options);
        }
      });
    };

    /**
     * Handle method calls on existing instances
     * @param {jQuery} $element - jQuery element
     * @param {Table} instance - TablixJS instance
     * @param {String} methodName - Method to call
     * @param {Array} args - Method arguments
     */
    function handleMethodCall($element, instance, methodName, args) {
      if (!instance) {
        console.error(`TablixJS: Cannot call method "${methodName}" on uninitialized element.`);
        return;
      }
      switch (methodName) {
        case 'reload':
        case 'loadData':
          if (args.length > 0) {
            instance.loadData(args[0]);
          } else {
            console.error('TablixJS: reload/loadData method requires data parameter.');
          }
          break;
        case 'destroy':
          instance.destroy();
          $element.removeData(DATA_KEY);
          break;
        case 'refresh':
        case 'refreshTable':
          instance.refreshTable();
          break;
        case 'getData':
          return instance.getData();
        case 'getOriginalData':
          return instance.getOriginalData();
        case 'getSelectedData':
          return instance.getSelectedData();
        case 'getSelectedIds':
          return instance.getSelectedIds();
        case 'selectRows':
          if (args.length > 0) {
            instance.selectRows(args[0]);
          }
          break;
        case 'deselectRows':
          if (args.length > 0) {
            instance.deselectRows(args[0]);
          }
          break;
        case 'clearSelection':
          instance.clearSelection();
          break;
        case 'selectAllRows':
          return instance.selectAllRows();
        case 'filter':
          if (args.length > 0) {
            instance.filter(args[0]);
          }
          break;
        case 'applyFilter':
          if (args.length >= 2) {
            instance.applyFilter(args[0], args[1]);
          }
          break;
        case 'clearFilter':
          if (args.length > 0) {
            instance.clearFilter(args[0]);
          }
          break;
        case 'clearAllFilters':
          instance.clearAllFilters();
          break;
        case 'sort':
          if (args.length > 0) {
            instance.sort(args[0], args[1]);
          }
          break;
        case 'toggleSort':
          if (args.length > 0) {
            instance.toggleSort(args[0]);
          }
          break;
        case 'clearSorting':
          instance.clearSorting();
          break;
        case 'setSearchTerm':
          if (args.length > 0) {
            instance.setSearchTerm(args[0]);
          }
          break;
        case 'clearSearch':
          instance.clearSearch();
          break;
        case 'nextPage':
          instance.nextPage();
          break;
        case 'prevPage':
          instance.prevPage();
          break;
        case 'firstPage':
          instance.firstPage();
          break;
        case 'lastPage':
          instance.lastPage();
          break;
        case 'goToPage':
          if (args.length > 0) {
            instance.goToPage(args[0]);
          }
          break;
        case 'changePageSize':
          if (args.length > 0) {
            instance.changePageSize(args[0]);
          }
          break;
        case 'getPaginationInfo':
          return instance.getPaginationInfo();
        case 'setLanguage':
          if (args.length > 0) {
            instance.setLanguage(args[0]);
          }
          break;
        case 'getCurrentLanguage':
          return instance.getCurrentLanguage();
        case 'getAvailableLanguages':
          return instance.getAvailableLanguages();
        case 'setOptions':
          if (args.length > 0) {
            instance.setOptions(args[0]);
          }
          break;
        case 'getOptions':
          return instance.getOptions();
        case 'on':
          if (args.length >= 2) {
            instance.on(args[0], args[1]);
          }
          break;
        case 'off':
          if (args.length >= 2) {
            instance.off(args[0], args[1]);
          }
          break;
        case 'trigger':
          if (args.length >= 1) {
            instance.trigger(args[0], args[1]);
          }
          break;
        case 'getInstance':
          return instance;
        default:
          console.error(`TablixJS: Unknown method "${methodName}".`);
          break;
      }
    }

    /**
     * Handle initialization of new TablixJS instances
     * @param {jQuery} $element - jQuery element
     * @param {Table} existingInstance - Existing TablixJS instance (if any)
     * @param {Object} options - Configuration options
     */
    function handleInitialization($element, existingInstance, options = {}) {
      // If instance already exists, destroy it first
      if (existingInstance) {
        console.warn('TablixJS: Reinitializing existing table instance.');
        existingInstance.destroy();
      }

      // Normalize options structure
      const normalizedOptions = normalizeOptions(options);
      try {
        // Create new TablixJS instance
        const instance = new Table($element[0], normalizedOptions);

        // Store instance reference
        $element.data(DATA_KEY, instance);

        // Set up jQuery-specific event forwarding
        setupJQueryEventForwarding($element, instance);
      } catch (error) {
        console.error('TablixJS: Failed to initialize table:', error);
        throw error;
      }
    }

    /**
     * Normalize options from jQuery-style to TablixJS-style
     * @param {Object} options - jQuery plugin options
     * @returns {Object} - Normalized TablixJS options
     */
    function normalizeOptions(options = {}) {
      // Handle different option structures for backward compatibility
      const normalized = {
        ...options
      };

      // If data is provided at root level, keep it there
      if (options.data) {
        normalized.data = options.data;
      }

      // If columns is provided at root level, keep it there
      if (options.columns) {
        normalized.columns = options.columns;
      }

      // If there's an 'options' property, merge it with root level
      if (options.options && typeof options.options === 'object') {
        Object.assign(normalized, options.options);
        delete normalized.options; // Remove the nested options property
      }
      return normalized;
    }

    /**
     * Set up event forwarding from TablixJS to jQuery events
     * @param {jQuery} $element - jQuery element
     * @param {Table} instance - TablixJS instance
     */
    function setupJQueryEventForwarding($element, instance) {
      // Map of TablixJS events to jQuery events
      const eventMap = {
        'afterLoad': 'tablixjs:afterLoad',
        'beforeLoad': 'tablixjs:beforeLoad',
        'loadError': 'tablixjs:loadError',
        'afterFilter': 'tablixjs:afterFilter',
        'afterSort': 'tablixjs:afterSort',
        'afterPageChange': 'tablixjs:afterPageChange',
        'afterSearch': 'tablixjs:afterSearch',
        'selectionChanged': 'tablixjs:selectionChanged',
        'selectAll': 'tablixjs:selectAll',
        'rowSelected': 'tablixjs:rowSelected',
        'rowDeselected': 'tablixjs:rowDeselected'
      };

      // Forward TablixJS events to jQuery events
      Object.keys(eventMap).forEach(tablixEvent => {
        const jqueryEvent = eventMap[tablixEvent];
        instance.on(tablixEvent, data => {
          $element.trigger(jqueryEvent, [data, instance]);
        });
      });
    }

    // Static methods and properties
    $.fn[PLUGIN_NAME].version = '0.1.1';
    $.fn[PLUGIN_NAME].defaults = {};

    /**
     * Get TablixJS instance from jQuery element
     * @param {jQuery|String} element - jQuery element or selector
     * @returns {Table|null} - TablixJS instance or null
     */
    $.fn[PLUGIN_NAME].getInstance = function (element) {
      const $el = $(element);
      return $el.length > 0 ? $el.data(DATA_KEY) : null;
    };

    /**
     * Check if element has TablixJS initialized
     * @param {jQuery|String} element - jQuery element or selector
     * @returns {Boolean} - True if initialized
     */
    $.fn[PLUGIN_NAME].isInitialized = function (element) {
      const $el = $(element);
      return $el.length > 0 && !!$el.data(DATA_KEY);
    };

    /**
     * Destroy all TablixJS instances on the page
     */
    $.fn[PLUGIN_NAME].destroyAll = function () {
      $(`[data-${DATA_KEY}]`).each(function () {
        const $el = $(this);
        const instance = $el.data(DATA_KEY);
        if (instance) {
          instance.destroy();
          $el.removeData(DATA_KEY);
        }
      });
    };

    // Log successful registration
    if (console && console.log) {
      console.log('TablixJS jQuery plugin registered successfully');
    }
  })();

}));
//# sourceMappingURL=tablix-jquery-plugin.js.map
