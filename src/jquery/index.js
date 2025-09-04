/**
 * TablixJS jQuery Wrapper Bundle
 * This file bundles TablixJS core with the jQuery wrapper for standalone use
 */

// Import TablixJS core (default export is the Table class)
import Table from '../index.js';

// Import the jQuery wrapper initializer
import { initializeJQueryWrapper } from './tablixjs-jquery-bundled.js';

// Create TablixJS object with both the Table class and named export
const TablixJS = Table;
TablixJS.Table = Table;

// Expose TablixJS globally FIRST (before importing jQuery wrapper)
if (typeof window !== 'undefined') {
  window.TablixJS = TablixJS;
} else if (typeof global !== 'undefined') {
  global.TablixJS = TablixJS;
}

// Initialize the jQuery wrapper (this ensures the function is called and not tree-shaken)
const jQueryWrapperInitialized = initializeJQueryWrapper();
console.log('TablixJS jQuery bundle initialized:', jQueryWrapperInitialized);

// Export TablixJS as default (no named exports to avoid the warning)
export default TablixJS;
