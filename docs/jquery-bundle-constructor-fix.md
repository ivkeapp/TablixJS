# TablixJS jQuery Bundle Constructor Error Fix

## Problem Summary

The jQuery bundled version (`tablix.jquery.js`) was experiencing a constructor error where users got:
```
TypeError: TablixJS.Table is not a constructor
```

This occurred because the jQuery wrapper was trying to access the global `TablixJS.Table` class before it was properly exposed in the UMD bundle execution order.

## Root Cause

1. **Execution Order Issue**: In the UMD bundle, ES6 import hoisting caused the jQuery wrapper to execute before global variables were set
2. **Global Dependency**: The original jQuery wrapper relied on `window.TablixJS` being available
3. **Timing Problem**: jQuery wrapper checked for Table class availability before the bundle had finished exposing it globally

## Solution Implemented

### 1. Created Bundled-Specific jQuery Wrapper
- **File**: `src/jquery/tablixjs-jquery-bundled.js`
- **Approach**: Direct Table class import instead of global dependency
- **Key Change**: `import Table from '../core/Table.js'` instead of checking `window.TablixJS`

### 2. Function-Based Initialization
- **Pattern**: Exported `initializeJQueryWrapper()` function
- **Benefit**: Explicit control over when jQuery plugin registration occurs
- **Result**: No more reliance on global variable timing

### 3. Updated Bundle Entry Point
- **File**: `src/jquery/index.js`
- **Change**: Import and call `initializeJQueryWrapper()` function
- **Result**: Guaranteed execution order regardless of ES6 import hoisting

## Files Changed

1. **src/jquery/tablixjs-jquery-bundled.js** (New)
   - Direct Table class import
   - Function-based jQuery plugin registration
   - No global dependencies

2. **src/jquery/index.js** (Modified)
   - Import bundled wrapper function
   - Explicit function call to ensure execution
   - Maintained global exposure for compatibility

## Verification

The fix has been verified with:
- ✅ Function-based initialization present
- ✅ Direct Table class instantiation
- ✅ No global dependency error checks
- ✅ jQuery plugin registration working
- ✅ Bundle size increase minimal (~600 characters)

## Testing

1. **Automated**: `node test/verify-jquery-bundle.js`
2. **Browser**: Open `examples/jquery-bundle-fix-test.html`
3. **Console**: Should see "TablixJS jQuery plugin initialized successfully (bundled version)"

## Benefits

1. **Eliminates Constructor Errors**: Direct Table class access prevents timing issues
2. **Maintains Compatibility**: All existing jQuery plugin APIs work unchanged
3. **Preserves Performance**: Minimal bundle size impact
4. **Future-Proof**: No longer dependent on global variable timing

## Usage Unchanged

Users can continue using the jQuery plugin exactly as before:

```javascript
// Bundled version usage (FIXED)
$('#table').tablixJS({
  data: myData,
  pagination: { enabled: true }
});
```

The fix is transparent to end users - no API changes required.
