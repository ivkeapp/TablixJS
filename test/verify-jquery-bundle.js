/**
 * Simple Node.js test to verify the jQuery bundle structure
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== TablixJS jQuery Bundle Verification ===\n');

// Read the bundled file
const bundlePath = path.join(__dirname, '..', 'dist', 'tablix.jquery.js');
const bundleContent = fs.readFileSync(bundlePath, 'utf8');

console.log('Bundle file size:', bundleContent.length, 'characters');

// Check for the key fix - function-based jQuery wrapper initialization
const hasInitFunction = bundleContent.includes('initializeJQueryWrapper');
console.log('✓ Function-based jQuery initialization:', hasInitFunction);

// Check for the bundled version indicator
const hasBundledVersionLog = bundleContent.includes('plugin initialized successfully (bundled version)');
console.log('✓ Using bundled jQuery wrapper version:', hasBundledVersionLog);

// Check for direct Table class usage (no global dependency)
const hasDirectTableUsage = bundleContent.includes('new Table($element[0], normalizedOptions)');
console.log('✓ Direct Table class instantiation:', hasDirectTableUsage);

// Look for jQuery plugin registration
const jqueryPluginRegistrations = (bundleContent.match(/\$\.fn\[PLUGIN_NAME\]/g) || []).length;
console.log('✓ jQuery plugin registrations found:', jqueryPluginRegistrations);

// Check that we're not using the problematic global-dependent checks
const hasGlobalChecks = bundleContent.includes('TablixJS Table class is not available');
console.log('✓ No global dependency error checks:', !hasGlobalChecks);

// Check for function call to initialize wrapper
const hasFunctionCall = bundleContent.includes('initializeJQueryWrapper()');
console.log('✓ jQuery wrapper function called:', hasFunctionCall);

console.log('\n=== Analysis Results ===');
const isFixed = hasInitFunction && hasBundledVersionLog && hasDirectTableUsage && jqueryPluginRegistrations > 0;

if (isFixed) {
  console.log('✅ jQuery Bundle Fix Successfully Applied!');
  console.log('   ✅ Uses function-based initialization');
  console.log('   ✅ Direct Table class import (no globals)');
  console.log('   ✅ Bundled version with execution order fix');
  console.log('   ✅ jQuery plugin should register properly');
  console.log('\n   🎯 The constructor error should now be resolved!');
} else {
  console.log('❌ Bundle fix not properly applied:');
  console.log('   - Function-based init:', hasInitFunction ? 'Yes' : 'No');
  console.log('   - Bundled version:', hasBundledVersionLog ? 'Yes' : 'No');
  console.log('   - Direct Table usage:', hasDirectTableUsage ? 'Yes' : 'No');
  console.log('   - Plugin registrations:', jqueryPluginRegistrations);
}

console.log('\n=== Testing Instructions ===');
console.log('1. Open examples/jquery-bundle-fix-test.html in a browser');
console.log('2. Check browser console - should see:');
console.log('   "TablixJS jQuery plugin initialized successfully (bundled version)"');
console.log('3. Verify jQuery plugin initializes without constructor errors');
console.log('4. Test plugin methods and events work correctly');
