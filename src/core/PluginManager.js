/**
 * PluginManager - Manages registration, initialization, and lifecycle of TablixJS plugins
 * 
 * The PluginManager provides a centralized system for extending TablixJS functionality
 * through external plugins without modifying the core library code.
 * 
 * Plugin Structure:
 * Each plugin should be an object with the following properties:
 * - name: Unique identifier for the plugin
 * - install(table, options): Function called when plugin is registered
 * - uninstall(table): Optional function called when plugin is removed
 * - defaultOptions: Optional default configuration object
 * 
 * Example Plugin:
 * ```js
 * const MyPlugin = {
 *   name: 'MyPlugin',
 *   defaultOptions: {
 *     enabled: true,
 *     color: 'blue'
 *   },
 *   install(table, options) {
 *     const config = { ...this.defaultOptions, ...options };
 *     // Plugin installation logic here
 *     table.on('afterRender', this.onAfterRender.bind(this));
 *     table.myPluginMethod = () => console.log('Plugin method called!');
 *   },
 *   uninstall(table) {
 *     delete table.myPluginMethod;
 *   },
 *   onAfterRender(data) {
 *     console.log('Table rendered with', data.length, 'rows');
 *   }
 * };
 * ```
 */
export default class PluginManager {
  constructor(table) {
    this.table = table;
    this.plugins = new Map(); // Map of plugin name -> { plugin, options, installed }
    this.hooks = new Map(); // Map of hook name -> array of callbacks
    this._installOrder = []; // Track installation order for dependency management
  }

  /**
   * Register and install a plugin
   * @param {Object|Function} plugin - Plugin object or constructor function
   * @param {Object} options - Plugin configuration options
   * @returns {PluginManager} Returns this for chaining
   */
  register(plugin, options = {}) {
    // Handle function plugins (convert to object)
    if (typeof plugin === 'function') {
      plugin = new plugin();
    }

    // Validate plugin structure
    if (!plugin.name) {
      throw new Error('Plugin must have a name property');
    }

    if (typeof plugin.install !== 'function') {
      throw new Error(`Plugin '${plugin.name}' must have an install method`);
    }

    // Check if plugin is already registered
    if (this.plugins.has(plugin.name)) {
      console.warn(`Plugin '${plugin.name}' is already registered. Skipping.`);
      return this;
    }

    // Merge options with default options
    const finalOptions = {
      ...(plugin.defaultOptions || {}),
      ...options
    };

    try {
      // Call plugin's install method
      plugin.install(this.table, finalOptions);

      // Store plugin info
      this.plugins.set(plugin.name, {
        plugin,
        options: finalOptions,
        installed: true,
        installedAt: new Date()
      });

      // Track installation order
      this._installOrder.push(plugin.name);

      // Trigger plugin lifecycle event
      this.table.eventManager.trigger('pluginInstalled', {
        name: plugin.name,
        plugin,
        options: finalOptions
      });

      console.debug(`TablixJS: Plugin '${plugin.name}' installed successfully`);

    } catch (error) {
      console.error(`TablixJS: Failed to install plugin '${plugin.name}':`, error);
      throw error;
    }

    return this;
  }

  /**
   * Uninstall a plugin
   * @param {string} name - Plugin name to uninstall
   * @returns {boolean} True if plugin was uninstalled, false if not found
   */
  uninstall(name) {
    const pluginInfo = this.plugins.get(name);
    
    if (!pluginInfo) {
      console.warn(`Plugin '${name}' not found`);
      return false;
    }

    try {
      // Call plugin's uninstall method if available
      if (typeof pluginInfo.plugin.uninstall === 'function') {
        pluginInfo.plugin.uninstall(this.table);
      }

      // Remove from tracking
      this.plugins.delete(name);
      const orderIndex = this._installOrder.indexOf(name);
      if (orderIndex > -1) {
        this._installOrder.splice(orderIndex, 1);
      }

      // Trigger plugin lifecycle event
      this.table.eventManager.trigger('pluginUninstalled', {
        name,
        plugin: pluginInfo.plugin
      });

      console.debug(`TablixJS: Plugin '${name}' uninstalled successfully`);
      return true;

    } catch (error) {
      console.error(`TablixJS: Failed to uninstall plugin '${name}':`, error);
      throw error;
    }
  }

  /**
   * Get a registered plugin by name
   * @param {string} name - Plugin name
   * @returns {Object|null} Plugin info object or null if not found
   */
  getPlugin(name) {
    return this.plugins.get(name) || null;
  }

  /**
   * Check if a plugin is installed
   * @param {string} name - Plugin name
   * @returns {boolean} True if plugin is installed
   */
  hasPlugin(name) {
    return this.plugins.has(name);
  }

  /**
   * Get all registered plugins
   * @returns {Array} Array of plugin info objects
   */
  getAllPlugins() {
    return Array.from(this.plugins.values());
  }

  /**
   * Get plugin names in installation order
   * @returns {Array} Array of plugin names
   */
  getInstallationOrder() {
    return [...this._installOrder];
  }

  /**
   * Register a hook callback
   * Hooks allow plugins to listen to specific table lifecycle events
   * @param {string} hookName - Name of the hook
   * @param {Function} callback - Callback function
   * @param {Object} options - Hook options (priority, once, etc.)
   */
  registerHook(hookName, callback, options = {}) {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, []);
    }

    const hookInfo = {
      callback,
      priority: options.priority || 10,
      once: options.once || false,
      pluginName: options.pluginName || 'unknown'
    };

    this.hooks.get(hookName).push(hookInfo);

    // Sort by priority (lower numbers run first)
    this.hooks.get(hookName).sort((a, b) => a.priority - b.priority);
  }

  /**
   * Execute hooks for a specific event
   * @param {string} hookName - Name of the hook to execute
   * @param {*} data - Data to pass to hook callbacks
   * @returns {*} Modified data after all hooks have run
   */
  async executeHooks(hookName, data) {
    const hooks = this.hooks.get(hookName);
    if (!hooks || hooks.length === 0) {
      return data;
    }

    let result = data;

    // Execute hooks in priority order
    for (let i = 0; i < hooks.length; i++) {
      const hook = hooks[i];
      
      try {
        // Execute hook callback
        const hookResult = await hook.callback(result, this.table);
        
        // If hook returns a value, use it as the new data
        if (hookResult !== undefined) {
          result = hookResult;
        }

        // Remove one-time hooks after execution
        if (hook.once) {
          hooks.splice(i, 1);
          i--; // Adjust index after removal
        }

      } catch (error) {
        console.error(`TablixJS: Error in hook '${hookName}' from plugin '${hook.pluginName}':`, error);
      }
    }

    return result;
  }

  /**
   * Remove hooks for a specific plugin
   * @param {string} pluginName - Name of the plugin
   * @param {string} hookName - Optional specific hook name to remove
   */
  removeHooks(pluginName, hookName = null) {
    if (hookName) {
      // Remove hooks for specific hook name
      const hooks = this.hooks.get(hookName);
      if (hooks) {
        const filtered = hooks.filter(hook => hook.pluginName !== pluginName);
        this.hooks.set(hookName, filtered);
      }
    } else {
      // Remove all hooks from this plugin
      for (const [name, hooks] of this.hooks) {
        const filtered = hooks.filter(hook => hook.pluginName !== pluginName);
        this.hooks.set(name, filtered);
      }
    }
  }

  /**
   * Extend the Table API with new methods
   * This allows plugins to add methods directly to the table instance
   * @param {string} methodName - Name of the method to add
   * @param {Function} method - Method implementation
   * @param {Object} options - Extension options
   */
  extendAPI(methodName, method, options = {}) {
    if (typeof method !== 'function') {
      throw new Error('Method must be a function');
    }

    if (this.table[methodName] && !options.override) {
      throw new Error(`Method '${methodName}' already exists. Use override: true to replace.`);
    }

    // Store original method if overriding
    if (this.table[methodName] && options.override) {
      this.table[`_original_${methodName}`] = this.table[methodName];
    }

    this.table[methodName] = method.bind(this.table);
  }

  /**
   * Remove extended API method
   * @param {string} methodName - Name of the method to remove
   * @param {boolean} restoreOriginal - Whether to restore original method if it existed
   */
  removeAPI(methodName, restoreOriginal = true) {
    if (restoreOriginal && this.table[`_original_${methodName}`]) {
      this.table[methodName] = this.table[`_original_${methodName}`];
      delete this.table[`_original_${methodName}`];
    } else {
      delete this.table[methodName];
    }
  }

  /**
   * Initialize all plugins (called during table construction)
   * This method is called automatically when the table is created
   */
  init() {
    // Trigger plugin manager initialization
    this.table.eventManager.trigger('pluginManagerInit', {
      pluginManager: this,
      table: this.table
    });
  }

  /**
   * Destroy all plugins (called when table is destroyed)
   */
  destroy() {
    // Uninstall all plugins in reverse order
    const pluginNames = [...this._installOrder].reverse();
    
    for (const name of pluginNames) {
      try {
        this.uninstall(name);
      } catch (error) {
        console.error(`Error uninstalling plugin '${name}' during cleanup:`, error);
      }
    }

    // Clear all hooks
    this.hooks.clear();
    this.plugins.clear();
    this._installOrder = [];

    // Trigger cleanup event
    this.table.eventManager.trigger('pluginManagerDestroyed', {
      pluginManager: this
    });
  }

  /**
   * Get plugin statistics and debugging information
   * @returns {Object} Plugin manager statistics
   */
  getStats() {
    return {
      totalPlugins: this.plugins.size,
      installedPlugins: Array.from(this.plugins.keys()),
      installationOrder: this._installOrder,
      totalHooks: Array.from(this.hooks.values()).reduce((sum, hooks) => sum + hooks.length, 0),
      hooksByName: Object.fromEntries(
        Array.from(this.hooks.entries()).map(([name, hooks]) => [name, hooks.length])
      )
    };
  }
}
