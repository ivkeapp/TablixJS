/**
 * StickyHeader Plugin for TablixJS
 * 
 * A comprehensive example plugin that demonstrates all plugin architecture features:
 * - Plugin lifecycle management
 * - Event hooks and listeners
 * - API extensions
 * - Custom styling
 * - Configuration options
 * - Error handling
 * 
 * This plugin makes the table header sticky when scrolling, with additional features
 * like shadow effects, customizable offset, and smooth animations.
 * 
 * Usage:
 * ```js
 * import StickyHeader from './plugins/StickyHeader.js';
 * 
 * table.use(StickyHeader, {
 *   enabled: true,
 *   offset: 0,
 *   shadow: true,
 *   animate: true,
 *   zIndex: 100
 * });
 * 
 * // Control programmatically
 * table.setStickyOffset(20);
 * table.enableStickyHeader();
 * table.disableStickyHeader();
 * ```
 */
export default {
  name: 'StickyHeader',
  
  defaultOptions: {
    enabled: true,           // Enable sticky header
    offset: 0,               // Offset from top of viewport
    shadow: true,            // Show shadow when sticky
    animate: true,           // Animate transitions
    zIndex: 100,             // Z-index for sticky header
    threshold: 10,           // Scroll threshold before sticky activates
    className: 'tablix-sticky-header', // CSS class for sticky state
    shadowClass: 'tablix-sticky-shadow', // CSS class for shadow
    breakpoint: null,        // Screen size breakpoint (null = always)
    onStick: null,           // Callback when header becomes sticky
    onUnstick: null          // Callback when header becomes unsticky
  },

  install(table, options) {
    try {
      this.table = table;
      this.options = { ...this.defaultOptions, ...options };
      this.isSticky = false;
      this.header = null;
      this.scrollContainer = null;
      this.observer = null;
      this.lastScrollTop = 0;

      // Store bound methods for cleanup
      this.boundMethods = {
        onScroll: this.onScroll.bind(this),
        onResize: this.onResize.bind(this),
        onAfterRender: this.onAfterRender.bind(this),
        onBeforeDestroy: this.onBeforeDestroy.bind(this)
      };

      // Listen to table lifecycle events
      this.table.on('afterRender', this.boundMethods.onAfterRender);
      this.table.before('destroy', this.boundMethods.onBeforeDestroy);

      // Add public API methods to table
      this.extendTableAPI();

      // Add custom styles
      this.addStyles();

      // Initialize intersection observer for better performance
      this.setupIntersectionObserver();

      console.debug('TablixJS: StickyHeader plugin installed');

    } catch (error) {
      console.error('TablixJS StickyHeader: Installation failed:', error);
      throw error;
    }
  },

  uninstall(table) {
    try {
      // Clean up event listeners
      table.off('afterRender', this.boundMethods.onAfterRender);
      table.off('beforeDestroy', this.boundMethods.onBeforeDestroy);
      
      this.removeEventListeners();

      // Clean up intersection observer
      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }

      // Remove sticky state
      this.disableSticky();

      // Remove API extensions
      this.removeTableAPI();

      // Remove styles
      this.removeStyles();

      console.debug('TablixJS: StickyHeader plugin uninstalled');

    } catch (error) {
      console.error('TablixJS StickyHeader: Uninstall failed:', error);
    }
  },

  onAfterRender(data) {
    if (this.options.enabled) {
      this.setupStickyHeader();
    }
  },

  onBeforeDestroy(data) {
    this.cleanup();
  },

  setupStickyHeader() {
    try {
      // Find the header element
      this.header = this.table.container.querySelector('.tablix-table thead');
      if (!this.header) {
        console.warn('TablixJS StickyHeader: Header element not found');
        return;
      }

      // Find scroll container (could be window or a parent element)
      this.scrollContainer = this.findScrollContainer();

      // Add event listeners
      this.addEventListeners();

      // Check if should be sticky initially
      this.checkStickyState();

    } catch (error) {
      console.error('TablixJS StickyHeader: Setup failed:', error);
    }
  },

  findScrollContainer() {
    let element = this.table.container.parentElement;
    
    while (element && element !== document.body) {
      const overflow = getComputedStyle(element).overflow;
      if (overflow === 'auto' || overflow === 'scroll') {
        return element;
      }
      element = element.parentElement;
    }
    
    return window;
  },

  addEventListeners() {
    this.removeEventListeners(); // Prevent duplicates
    
    if (this.scrollContainer === window) {
      window.addEventListener('scroll', this.boundMethods.onScroll, { passive: true });
      window.addEventListener('resize', this.boundMethods.onResize);
    } else {
      this.scrollContainer.addEventListener('scroll', this.boundMethods.onScroll, { passive: true });
      this.scrollContainer.addEventListener('resize', this.boundMethods.onResize);
    }
  },

  removeEventListeners() {
    if (this.scrollContainer === window) {
      window.removeEventListener('scroll', this.boundMethods.onScroll);
      window.removeEventListener('resize', this.boundMethods.onResize);
    } else if (this.scrollContainer) {
      this.scrollContainer.removeEventListener('scroll', this.boundMethods.onScroll);
      this.scrollContainer.removeEventListener('resize', this.boundMethods.onResize);
    }
  },

  onScroll(event) {
    // Throttle scroll events for better performance
    if (!this.scrollThrottled) {
      this.scrollThrottled = true;
      requestAnimationFrame(() => {
        this.checkStickyState();
        this.scrollThrottled = false;
      });
    }
  },

  onResize(event) {
    // Debounce resize events
    clearTimeout(this.resizeTimeout);
    this.resizeTimeout = setTimeout(() => {
      this.checkStickyState();
    }, 150);
  },

  checkStickyState() {
    if (!this.header || !this.options.enabled) return;

    // Check breakpoint
    if (this.options.breakpoint && window.innerWidth < this.options.breakpoint) {
      this.disableSticky();
      return;
    }

    const headerRect = this.header.getBoundingClientRect();
    const shouldBeSticky = headerRect.top <= this.options.offset + this.options.threshold;

    if (shouldBeSticky && !this.isSticky) {
      this.enableSticky();
    } else if (!shouldBeSticky && this.isSticky) {
      this.disableSticky();
    }
  },

  enableSticky() {
    if (!this.header || this.isSticky) return;

    try {
      // Store original styles
      this.originalStyles = {
        position: this.header.style.position,
        top: this.header.style.top,
        left: this.header.style.left,
        right: this.header.style.right,
        zIndex: this.header.style.zIndex,
        width: this.header.style.width
      };

      // Apply sticky styles
      const headerRect = this.header.getBoundingClientRect();
      
      this.header.style.position = 'fixed';
      this.header.style.top = this.options.offset + 'px';
      this.header.style.left = headerRect.left + 'px';
      this.header.style.right = 'auto';
      this.header.style.width = headerRect.width + 'px';
      this.header.style.zIndex = this.options.zIndex;

      // Add CSS classes
      this.header.classList.add(this.options.className);
      
      if (this.options.shadow) {
        this.header.classList.add(this.options.shadowClass);
      }

      // Create spacer to prevent content jump
      this.createSpacer();

      this.isSticky = true;

      // Trigger callback
      if (typeof this.options.onStick === 'function') {
        this.options.onStick(this.header);
      }

      // Trigger event
      this.table.trigger('stickyHeaderEnabled', {
        header: this.header,
        offset: this.options.offset
      });

    } catch (error) {
      console.error('TablixJS StickyHeader: Enable sticky failed:', error);
    }
  },

  disableSticky() {
    if (!this.header || !this.isSticky) return;

    try {
      // Restore original styles
      Object.keys(this.originalStyles).forEach(prop => {
        this.header.style[prop] = this.originalStyles[prop];
      });

      // Remove CSS classes
      this.header.classList.remove(this.options.className);
      this.header.classList.remove(this.options.shadowClass);

      // Remove spacer
      this.removeSpacer();

      this.isSticky = false;

      // Trigger callback
      if (typeof this.options.onUnstick === 'function') {
        this.options.onUnstick(this.header);
      }

      // Trigger event
      this.table.trigger('stickyHeaderDisabled', {
        header: this.header
      });

    } catch (error) {
      console.error('TablixJS StickyHeader: Disable sticky failed:', error);
    }
  },

  createSpacer() {
    if (this.spacer) this.removeSpacer();

    this.spacer = document.createElement('div');
    this.spacer.className = 'tablix-sticky-spacer';
    this.spacer.style.height = this.header.offsetHeight + 'px';
    this.spacer.style.width = '100%';
    this.spacer.style.visibility = 'hidden';

    this.header.parentNode.insertBefore(this.spacer, this.header);
  },

  removeSpacer() {
    if (this.spacer) {
      this.spacer.remove();
      this.spacer = null;
    }
  },

  setupIntersectionObserver() {
    if (!('IntersectionObserver' in window)) return;

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.target === this.header) {
          if (!entry.isIntersecting && !this.isSticky) {
            this.enableSticky();
          } else if (entry.isIntersecting && this.isSticky) {
            this.disableSticky();
          }
        }
      });
    }, {
      rootMargin: `-${this.options.offset + this.options.threshold}px 0px 0px 0px`
    });
  },

  addStyles() {
    if (document.getElementById('tablix-sticky-header-styles')) return;

    const style = document.createElement('style');
    style.id = 'tablix-sticky-header-styles';
    style.textContent = `
      .tablix-sticky-header {
        transition: ${this.options.animate ? 'box-shadow 0.2s ease' : 'none'};
      }
      
      .tablix-sticky-shadow {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      }
      
      .tablix-sticky-spacer {
        pointer-events: none;
      }
      
      /* Ensure table cells maintain their width when sticky */
      .tablix-sticky-header th {
        box-sizing: border-box;
      }
      
      /* Handle responsive behavior */
      @media (max-width: 768px) {
        .tablix-sticky-header {
          font-size: 14px;
        }
      }
    `;
    
    document.head.appendChild(style);
  },

  removeStyles() {
    const style = document.getElementById('tablix-sticky-header-styles');
    if (style) {
      style.remove();
    }
  },

  extendTableAPI() {
    // Add methods to the table instance
    this.table.setStickyOffset = this.setStickyOffset.bind(this);
    this.table.getStickyOffset = this.getStickyOffset.bind(this);
    this.table.enableStickyHeader = this.enableStickyHeader.bind(this);
    this.table.disableStickyHeader = this.disableStickyHeader.bind(this);
    this.table.isStickyHeaderEnabled = this.isStickyHeaderEnabled.bind(this);
    this.table.refreshStickyHeader = this.refreshStickyHeader.bind(this);
  },

  removeTableAPI() {
    // Remove added methods
    delete this.table.setStickyOffset;
    delete this.table.getStickyOffset;
    delete this.table.enableStickyHeader;
    delete this.table.disableStickyHeader;
    delete this.table.isStickyHeaderEnabled;
    delete this.table.refreshStickyHeader;
  },

  cleanup() {
    this.removeEventListeners();
    
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    
    this.disableSticky();
  },

  // Public API methods (added to table instance)

  setStickyOffset(offset) {
    this.options.offset = offset;
    if (this.isSticky) {
      this.header.style.top = offset + 'px';
    }
    this.checkStickyState();
  },

  getStickyOffset() {
    return this.options.offset;
  },

  enableStickyHeader() {
    this.options.enabled = true;
    this.setupStickyHeader();
  },

  disableStickyHeader() {
    this.options.enabled = false;
    this.disableSticky();
  },

  isStickyHeaderEnabled() {
    return this.options.enabled;
  },

  refreshStickyHeader() {
    this.disableSticky();
    this.setupStickyHeader();
  }
};
