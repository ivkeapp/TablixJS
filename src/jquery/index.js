/**
 * TablixJS jQuery Wrapper Bundle
 * This file bundles TablixJS core with the jQuery wrapper for standalone use
 */

// Import TablixJS core
import TablixJS from '../index.js';

// Expose TablixJS globally for the jQuery wrapper
if (typeof window !== 'undefined') {
  window.TablixJS = TablixJS;
} else if (typeof global !== 'undefined') {
  global.TablixJS = TablixJS;
}

// Import and initialize the jQuery wrapper
// This will automatically register the jQuery plugin if jQuery is available
import './tablixjs-jquery.js';

// Export TablixJS for module systems
export default TablixJS;
export { TablixJS };
