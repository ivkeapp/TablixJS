# Complex Data Handling Fixes

## Overview
Fixed multiple issues related to handling columns with complex/nested data (objects) in TablixJS. These fixes ensure that features like filtering, searching, and exporting work properly when columns contain nested JSON structures.

## Issues Fixed

### 1. ✓ Column Renderer Bug
**Issue:** Multiple columns using the same data field name with different renderers would all use the first column's renderer.

**Files Modified:**
- `src/core/ColumnManager.js`
- `src/core/Renderer.js`
- `src/core/VirtualScroll.js`

**Solution:** Pass column object instead of column name to ensure each column uses its own renderer.

**Status:** ✓ FIXED

---

### 2. ✓ Filter Dropdown "[object Object]" Bug
**Issue:** When opening filter dropdown for columns with complex data, it showed "[object Object]" instead of proper values or a helpful message.

**Files Modified:**
- `src/core/FilterManager.js`
- `src/core/FilterUI.js`

**Changes:**
- `getColumnUniqueValues()` now detects complex objects and returns empty array
- `_valueToString()` helper method added to safely convert values
- `_testRowAgainstFilter()` updated to handle complex objects
- `_hasComplexData()` helper method added to detect columns with complex data
- Filter dropdown arrow is now hidden entirely for columns with complex data (better UX)
- FilterUI shows helpful message when attempting to filter complex data: "Value filtering is not available for columns with complex data. Use Condition filtering instead."

**Architecture for Future Enhancement:**
Comments added to support future implementation of:
- Filtering on specific object properties (e.g., `user.name`)
- Custom filter functions for complex data columns
- Option to filter on rendered output instead of raw data

**Status:** ✓ FIXED

---

### 3. ✓ Search "[object Object]" Issue
**Issue:** Searching would try to match "[object Object]" string for complex data columns.

**Files Modified:**
- `src/core/SearchManager.js`

**Solution:** Skip complex objects during search filtering (lines 213-217).

**Status:** ✓ FIXED

---

### 4. ✓ Export "[object Object]" Issue
**Issue:** CSV export would write "[object Object]" for complex data.

**Files Modified:**
- `src/core/Renderer.js`

**Solution:** `handleExport()` now JSON stringifies complex objects for CSV export (lines 524-530).

**Status:** ✓ FIXED

---

## Technical Details

### Complex Data Detection
All fixes use consistent logic to detect complex data:

```javascript
if (typeof value === 'object' && !(value instanceof Date)) {
  // This is complex data (not a primitive or Date)
}
```

### Filter System Behavior
- **Value Filtering:** Disabled for columns with complex data
- **Condition Filtering:** Still available for complex data columns
- **User Message:** "Value filtering is not available for columns with complex data. Use Condition filtering instead."

### Search Behavior
- Complex objects are skipped during search
- Only primitive values (strings, numbers, booleans) and Dates are searchable
- No "[object Object]" matches will occur

### Export Behavior
- Complex objects are JSON stringified: `JSON.stringify(value)`
- Properly escaped in CSV format
- Readable output instead of "[object Object]"

## Testing

### Test Files Created
1. `test/column-renderer-bug-test.html` - Original renderer bug
2. `test/column-renderer-fix-verification.html` - Renderer fix verification
3. `test/complex-data-fixes-verification.html` - **Complete integration test**
4. `examples/nested-json-rendering.html` - Real-world examples

### Test Checklist
- [x] Multiple columns with same field name use different renderers
- [x] Filter dropdown doesn't show "[object Object]"
- [x] Filter dropdown shows helpful message for complex columns
- [x] Search skips complex objects
- [x] Export handles complex objects properly
- [x] All fixes work together without conflicts

## Files Modified Summary

### Core Modules
```
src/core/ColumnManager.js   - Renderer fix
src/core/Renderer.js         - Renderer + Export fixes
src/core/VirtualScroll.js    - Renderer fix
src/core/FilterManager.js    - Filter handling
src/core/FilterUI.js         - User messaging
src/core/SearchManager.js    - Search filtering
```

### Test Files
```
test/column-renderer-bug-test.html
test/column-renderer-fix-verification.html
test/complex-data-fixes-verification.html
examples/nested-json-rendering.html
```

### Documentation
```
docs/column-renderer-bugfix.md
COLUMN-RENDERER-FIX-SUMMARY.md
docs/complex-data-fixes.md (this file)
```

## Usage Examples

### Example 1: Multiple Renderers on Same Field
```javascript
columns: [
  { 
    name: 'user_badges', 
    title: 'First Badge', 
    renderer: (value) => `<img src="${value.badge_images[0]}">`
  },
  { 
    name: 'user_name', 
    title: 'Name'
  },
  { 
    name: 'user_badges', 
    title: 'Badge Count', 
    renderer: (value) => `${value.badge_level} badges`
  }
]
```

### Example 2: Filtering on Simple vs Complex Columns
```javascript
// Simple column - Value filtering works
{ name: 'user_name', title: 'Name' }  // ✓ Filter dropdown shows names

// Complex column - Condition filtering only
{ name: 'user_badges', title: 'Badges' }  // ℹ Shows helpful message
```

### Example 3: Search Configuration
```javascript
search: {
  enabled: true,
  searchColumns: ['user_name', 'user_email']  // Only search simple columns
}
```

## Breaking Changes
None - all fixes are backwards compatible.

## Performance Impact
- Minimal - added object type checks are O(1) operations
- Filter performance: Slightly better for complex columns (skips processing)
- Search performance: Slightly better (skips complex objects)

## Future Considerations

### Potential Enhancements
1. **Custom Value Extractors:** Allow developers to specify how to extract filterable values from complex objects
2. **Nested Property Filtering:** Support filtering on specific nested properties (e.g., `user_badges.badge_level`)
3. **Renderer-Based Filtering:** Use column renderer output for filtering instead of raw values

### Example API (Future)
```javascript
{
  name: 'user_badges',
  title: 'Badges',
  renderer: (value) => `<img src="${value.badge_images[0]}">`,
  filterValueExtractor: (value) => value.badge_level  // Custom extractor
}
```

## Version
- **Fixed in:** Current build
- **Date:** February 3, 2026
- **Severity:** Medium (affects UX but not functionality)
- **Affects:** All tables with nested/complex data

## Related Issues
- Column Renderer Bug (original issue)
- Filter dropdown UX
- Search functionality
- CSV export quality

---

**Status: All Issues Resolved ✓**
