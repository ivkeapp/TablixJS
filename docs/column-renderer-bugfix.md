# Column Renderer Bug Fix

## Bug Description

### Issue
When using multiple columns that reference the same data field name (e.g., `user_badges`) but with different `renderer` functions, only the first column's renderer was being used for all columns with that field name.

### Example of the Bug
```javascript
columns: [
  { 
    name: 'user_badges', 
    title: 'Badges', 
    renderer: (value, row) => {
      return `<img src="${value.badge_images[0]}" width="30" height="30">`;
    }
  },
  { 
    name: 'user_name', 
    title: 'Username'
  },
  { 
    name: 'user_badges',  // Same field as column 1
    title: 'Example Column', 
    renderer: (value, row) => {
      return `<span>I should see this</span>`;  // This renderer was ignored!
    }
  }
]
```

**Expected:** Column 3 shows "I should see this"  
**Bug Behavior:** Column 3 showed the same image as Column 1

## Root Cause

The bug was in `ColumnManager.formatCellValue()` method:

1. The `Renderer` would iterate through columns and call `formatCellValue(col.name, cell, row)`
2. `formatCellValue()` would look up the column using `getColumn(columnName)` 
3. `getColumn()` used `Array.find()` which returns the **first** matching column
4. Result: All columns with the same `name` used the first column's renderer

## Solution

### Files Modified

1. **src/core/ColumnManager.js**
   - Changed `formatCellValue()` to accept a column object OR column name (backwards compatible)
   - Now uses the passed column object directly instead of looking it up

2. **src/core/Renderer.js**
   - Updated to pass the full column object to `formatCellValue(col, cell, row)` instead of `formatCellValue(col.name, cell, row)`

3. **src/core/VirtualScroll.js**
   - Updated for consistency with the same fix

### Code Changes

#### Before (ColumnManager.js)
```javascript
formatCellValue(columnName, value, row) {
  const column = this.getColumn(columnName);  // Always returns first match!
  
  if (column && column.renderer) {
    // ...
  }
}
```

#### After (ColumnManager.js)
```javascript
formatCellValue(column, value, row) {
  // Support both column object (new) and column name (backwards compatibility)
  const columnObj = typeof column === 'string' ? this.getColumn(column) : column;
  const columnName = columnObj ? columnObj.name : column;
  
  if (columnObj && columnObj.renderer) {
    // Now uses the specific column object passed in!
  }
}
```

#### Before (Renderer.js)
```javascript
columns.forEach(col => {
  const result = this.table.columnManager.formatCellValue(col.name, cell, row);
  // ...
});
```

#### After (Renderer.js)
```javascript
columns.forEach(col => {
  // Pass the column object instead of just the name
  const result = this.table.columnManager.formatCellValue(col, cell, row);
  // ...
});
```

## Backwards Compatibility

The fix maintains full backwards compatibility:

- `formatCellValue(column)` - New behavior, accepts column object
- `formatCellValue('columnName')` - Old behavior still works

## Use Cases Now Supported

### 1. Multiple Views of Same Data
```javascript
columns: [
  { name: 'user_badges', title: 'First Badge', 
    renderer: (value) => `<img src="${value.badge_images[0]}">` },
  { name: 'user_badges', title: 'Badge Count', 
    renderer: (value) => `${value.badge_level} badges` },
  { name: 'user_badges', title: 'Level', 
    renderer: (value) => value.badge_level >= 3 ? 'Expert' : 'Novice' }
]
```

### 2. Different Renderings of Nested Data
```javascript
columns: [
  { name: 'address', title: 'City', 
    renderer: (value) => value.city },
  { name: 'address', title: 'Full Address', 
    renderer: (value) => `${value.street}, ${value.city}, ${value.state}` },
  { name: 'address', title: 'State', 
    renderer: (value) => value.state }
]
```

### 3. Same Field, Different Formats
```javascript
columns: [
  { name: 'timestamp', title: 'Date', 
    renderer: (value) => new Date(value).toLocaleDateString() },
  { name: 'timestamp', title: 'Time', 
    renderer: (value) => new Date(value).toLocaleTimeString() },
  { name: 'timestamp', title: 'Relative', 
    renderer: (value) => getRelativeTime(value) }
]
```

## Testing

### Test Files Created
- `test/column-renderer-bug-test.html` - Reproduces the original bug scenario
- `test/column-renderer-fix-verification.html` - Comprehensive verification with 3 test cases

### To Verify the Fix
1. Open `test/column-renderer-fix-verification.html` in a browser
2. Check that each column shows its unique rendered content
3. Column 3 should show "I should see this" text, not an image

## Performance Impact

- **Positive:** No performance impact - we're just passing a reference instead of doing a lookup
- **Memory:** Negligible - column objects are already in memory
- **Speed:** Slightly faster since we avoid the `Array.find()` lookup

## Version

- **Fixed in:** Current build
- **Affects:** All previous versions that support column renderers
- **Breaking Changes:** None - fully backwards compatible

## Related Features

This fix enables developers to:
- Render different aspects of complex/nested data in separate columns
- Create multiple formatted views of the same field
- Build more flexible and reusable column configurations
- Better support for JSON APIs with nested structures

## Example Use Case from Bug Report

```javascript
// Server data structure
const data = [
  {
    user_name: "user1",
    user_email: "user1@example.com",
    user_badges: {
      badge_level: 2,
      badge_images: ["/images/badge1.img", "/images/badge2.img"]
    }
  }
];

// Now you can do this:
columns: [
  { name: 'user_badges', title: 'Badge 1', 
    renderer: (value) => `<img src="${value.badge_images[0]}">` },
  { name: 'user_name', title: 'Username' },
  { name: 'user_badges', title: 'Badge 2', 
    renderer: (value) => `<img src="${value.badge_images[1]}">` }
]
```

Each column will correctly use its own renderer! ✓
