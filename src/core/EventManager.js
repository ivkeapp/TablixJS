export default class EventManager {
  constructor() {
    this.events = {};
    this.hooks = {}; // Store before/after hooks
  }

  on(event, callback) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(callback);
  }

  off(event, callback) {
    if (this.events[event]) {
      const index = this.events[event].indexOf(callback);
      if (index > -1) {
        this.events[event].splice(index, 1);
      }
    }
  }

  clear(event) {
    if (event) {
      this.events[event] = [];
    } else {
      this.events = {};
    }
  }

  trigger(event, payload) {
    (this.events[event] || []).forEach(cb => cb(payload));
  }

  /**
   * Register a before/after hook
   * @param {string} event - Event name
   * @param {string} type - 'before' or 'after'
   * @param {Function} callback - Hook callback
   * @param {Object} options - Hook options (priority, etc.)
   */
  hook(event, type, callback, options = {}) {
    const hookKey = `${type}:${event}`;
    if (!this.hooks[hookKey]) this.hooks[hookKey] = [];
    
    const hookInfo = {
      callback,
      priority: options.priority || 10,
      pluginName: options.pluginName || 'unknown'
    };

    this.hooks[hookKey].push(hookInfo);
    
    // Sort by priority (lower numbers run first)
    this.hooks[hookKey].sort((a, b) => a.priority - b.priority);
  }

  /**
   * Execute before hooks and trigger event with after hooks
   * @param {string} event - Event name
   * @param {*} payload - Event payload
   * @returns {*} Modified payload after before hooks
   */
  async triggerWithHooks(event, payload) {
    // Execute before hooks
    let modifiedPayload = await this.executeHooks(`before:${event}`, payload);
    
    // Trigger main event
    this.trigger(event, modifiedPayload);
    
    // Execute after hooks
    await this.executeHooks(`after:${event}`, modifiedPayload);
    
    return modifiedPayload;
  }

  /**
   * Execute hooks for a specific event
   * @param {string} hookKey - Hook key (e.g., 'before:render')
   * @param {*} payload - Payload to pass through hooks
   * @returns {*} Modified payload
   */
  async executeHooks(hookKey, payload) {
    const hooks = this.hooks[hookKey];
    if (!hooks || hooks.length === 0) {
      return payload;
    }

    let result = payload;

    for (const hook of hooks) {
      try {
        const hookResult = await hook.callback(result);
        if (hookResult !== undefined) {
          result = hookResult;
        }
      } catch (error) {
        console.error(`Error in hook '${hookKey}' from plugin '${hook.pluginName}':`, error);
      }
    }

    return result;
  }

  /**
   * Remove hooks by plugin name
   * @param {string} pluginName - Plugin name
   */
  removeHooksByPlugin(pluginName) {
    for (const hookKey in this.hooks) {
      this.hooks[hookKey] = this.hooks[hookKey].filter(
        hook => hook.pluginName !== pluginName
      );
    }
  }

  /**
   * Register a before hook (convenience method)
   */
  before(event, callback, options = {}) {
    this.hook(event, 'before', callback, options);
  }

  /**
   * Register an after hook (convenience method)
   */
  after(event, callback, options = {}) {
    this.hook(event, 'after', callback, options);
  }
}