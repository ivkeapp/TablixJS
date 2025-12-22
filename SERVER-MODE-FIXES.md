# Server-Side Mode Fixes - TablixJS

## Overview

This document describes the comprehensive refactoring of TablixJS to fix multiple issues related to server-side pagination, sorting, filtering, and search functionality.

## Issues Fixed

### 1. ✅ Selection Not Working on First Load

**Problem**: Multi/single row selection did not work immediately after initial rendering. It started working only after the grid refreshed (e.g., after sorting or filtering).

**Root Cause**: The `afterRender` event was not being triggered during initial load, preventing the SelectionManager from properly initializing the UI.

**Solution**: 
- Added explicit `afterRender` event trigger in the `init()` method after initial table render
- Ensured selection event listeners are properly bound after first data load

**Files Changed**:
- `src/core/Table.js` - Modified `init()` method to trigger `afterRender` event

---

### 2. ✅ "Filter by Values" Tab Shows "No values available" on First Load

**Problem**: On first load, the "Filter by values" dropdown was empty. After sorting or applying a conditional filter once, it started working.

**Root Cause**: The `getColumnUniqueValues()` method always used `originalData`, which for server mode wasn't populated with the server response data.

**Solution**:
- Modified `getColumnUniqueValues()` to use `filteredData` for server mode (which contains the loaded server data)
- For client mode, continues to use `originalData` as before

**Files Changed**:
- `src/core/FilterManager.js` - Updated `getColumnUniqueValues()` method

---

### 3. ✅ Duplicate Requests Triggered for Every Filter or Sort Action

**Problem**: Any server filter or sort action triggered two network requests:
1. First through the sorting/filtering loader
2. Then unexpectedly through `serverDataLoader` again

**Root Cause**: Each manager (`SortingManager`, `FilterManager`, `PaginationManager`) was independently calling server loaders, and then `refreshTable()` would trigger pagination's `getPageData()` which made another request.

**Solution**:
- **Implemented Centralized State Management**: Created new `StateManager` class to maintain unified state for all operations
- **Unified Server Loading**: Created single `_loadServerData()` method in `Table.js` that:
  - Collects all current state (pagination, sort, filters, search) from `StateManager`
  - Determines the appropriate loader to use based on active operations
  - Makes only ONE request with all parameters
  - Updates all managers with the response
- **Deprecated Individual Loaders**: Marked `_sortServer()` and `_filterServer()` as deprecated
- **Modified `refreshTable()`**: Now delegates to `_loadServerData()` for server mode operations

**Files Changed**:
- `src/core/StateManager.js` - **NEW FILE** - Centralized state management
- `src/core/Table.js` - Added `_loadServerData()` method and state manager integration
- `src/core/SortingManager.js` - Updated to use state manager, deprecated `_sortServer()`
- `src/core/FilterManager.js` - Updated to use state manager, deprecated `_filterServer()`
- `src/core/PaginationManager.js` - Simplified `getServerPageData()` to delegate to unified loader

---

### 4. ✅ Filter State Lost When Changing Sort Order

**Problem**: 
- Sort by `test_id`
- Apply a value filter on `test_name`
- Change sort to `test_name` → filter resets to empty `{}`

**Root Cause**: No persistent state storage. Each operation would overwrite the previous state instead of merging it.

**Solution**:
- `StateManager` now maintains persistent `filters`, `sort`, and `search` state
- All operations update state through `StateManager` methods
- State is always preserved and merged, never overwritten
- All server requests use `getServerParams()` which includes all current state

**Files Changed**:
- `src/core/StateManager.js` - Maintains persistent state
- `src/core/SortingManager.js` - Updates state instead of replacing it
- `src/core/FilterManager.js` - Updates state instead of replacing it

---

### 5. ✅ Search Box Triggers API Requests but Search Term Not Included in Params

**Problem**: When `controls.search = true`, typing into search triggered server requests, but the search term was not present in the params object sent to server loaders.

**Root Cause**: Search term was stored in `SearchManager` but never passed to server loader methods.

**Solution**:
- `StateManager` now tracks search term via `updateSearch()` method
- `SearchManager.performSearch()` updates state manager with current search term
- `_loadServerData()` always includes search term in params via `getServerParams()`
- Server loaders now receive: `{ page, pageSize, sort, filters, search }`

**Files Changed**:
- `src/core/StateManager.js` - Added `search` to state and `updateSearch()` method
- `src/core/SearchManager.js` - Updated to sync search term with state manager
- `src/core/Table.js` - `_loadServerData()` includes search in params

---

### 6. ✅ Table Does Not Refresh with New Sorted Results

**Problem**: Returning sorted results from the API did not update the table. Pagination updates worked, but sorting did not update the table UI.

**Root Cause**: Sorting triggered two requests causing state desync, and the render pipeline was ignoring the result of the sorting request.

**Solution**:
- Fixed by eliminating duplicate requests (see #3)
- `_loadServerData()` properly updates `DataManager` with server response
- Ensures table renders with the new sorted data from the server

**Files Changed**:
- `src/core/Table.js` - `_loadServerData()` properly handles response and renders table

---

### 7. ✅ Sort Value Sent as Undefined/Null - Inconsistent in Requests

**Problem**: Some requests sent `sort: undefined` or `sort: null`.

**Root Cause**: Sort state was not normalized before being included in params.

**Solution**:
- `StateManager.getServerParams()` always returns `sort` as an object
- If no sort is active, returns `{}` (empty object) instead of `null` or `undefined`
- Consistent format across all loaders

**Files Changed**:
- `src/core/StateManager.js` - `getServerParams()` normalizes sort to `{}` if null

---

## New Architecture

### StateManager Class

A new centralized state management class that maintains:

```javascript
{
  page: 1,
  pageSize: 10,
  totalRows: 0,
  sort: null,        // { column: 'name', direction: 'asc' } or null
  filters: {},       // { columnName: { type: 'value', values: [...] } }
  search: '',        // Global search term
  isLoading: false
}
```

**Key Methods**:
- `getServerParams()` - Returns normalized params for server requests
- `updatePagination()` - Updates pagination state
- `updateSort()` - Updates sort state
- `updateFilters()` - Updates filter state
- `updateSearch()` - Updates search state
- `resetPage()` - Resets to page 1 (used when filters/sort/search change)

### Unified Server Loading

**Old Flow** (caused duplicate requests):
```
User clicks sort
  → SortingManager._sortServer() makes request
  → SortingManager.sort() calls refreshTable()
  → refreshTable() calls PaginationManager.getPageData()
  → getPageData() calls serverDataLoader again ❌ DUPLICATE
```

**New Flow** (single request):
```
User clicks sort
  → SortingManager updates StateManager.sort
  → SortingManager calls table.refreshTable()
  → refreshTable() detects server mode
  → refreshTable() calls _loadServerData()
  → _loadServerData() gets unified params from StateManager
  → _loadServerData() makes ONE request ✅
  → Updates DataManager and renders table
```

### Request Parameter Format

All server loaders now receive consistent parameters:

```javascript
{
  page: 1,              // Current page number
  pageSize: 10,         // Items per page
  sort: {},             // { column: 'name', direction: 'asc' } or {}
  filters: {},          // { columnName: { type: 'value', values: [...] } }
  search: 'keyword'     // Search term or empty string
}
```

## Server Loader Priority

When making unified requests, loaders are prioritized as follows:

1. **serverFilterLoader** - Used when filters are active
2. **serverSortLoader** - Used when sort is active (and no filters)
3. **serverDataLoader** - Used for basic pagination

This ensures the most specific loader handles the request.

## Migration Guide

### For Users of TablixJS

**Good News**: No breaking changes! Your existing code will continue to work.

The fixes are internal refactoring that maintains backward compatibility.

### Server Implementation Changes

Your server loaders now receive an additional `search` parameter:

```javascript
const table = new Table('#myTable', {
  pagination: {
    mode: 'server',
    serverDataLoader: async (params) => {
      // params now includes:
      // - page, pageSize (as before)
      // - sort (now always an object, never null/undefined)
      // - filters (as before)
      // - search (NEW - search term string)
      
      const response = await fetch(`/api/data?${new URLSearchParams(params)}`);
      return response.json();
    }
  }
});
```

**Server-side implementation example**:

```javascript
app.get('/api/data', (req, res) => {
  const { page, pageSize, sort, filters, search } = req.query;
  
  let query = db.select('*').from('users');
  
  // Apply search
  if (search) {
    query = query.where(function() {
      this.where('name', 'like', `%${search}%`)
          .orWhere('email', 'like', `%${search}%`);
    });
  }
  
  // Apply filters
  if (filters && Object.keys(filters).length > 0) {
    // ... filter logic
  }
  
  // Apply sorting
  if (sort && sort.column) {
    query = query.orderBy(sort.column, sort.direction);
  }
  
  // Apply pagination
  const offset = (page - 1) * pageSize;
  query = query.limit(pageSize).offset(offset);
  
  const data = await query;
  const totalRows = await db.count('*').from('users').first();
  
  res.json({ data, totalRows: totalRows.count });
});
```

## Testing

To verify all fixes are working:

1. **Test Selection on First Load**:
   - Load table with server data
   - Try to select a row immediately → Should work ✅

2. **Test Filter by Values**:
   - Open filter dropdown on any column
   - Should show values from loaded data ✅

3. **Test Single Request**:
   - Open browser DevTools Network tab
   - Sort a column → Should see only ONE request ✅
   - Apply a filter → Should see only ONE request ✅

4. **Test Persistent Filters**:
   - Apply a filter on column A
   - Change sort order → Filter should remain active ✅
   - Change page → Filter should remain active ✅

5. **Test Search Parameter**:
   - Type in search box
   - Check network request params → Should include `search` parameter ✅

6. **Test Sort Consistency**:
   - Check all requests → `sort` should be `{}` or `{ column, direction }`, never null ✅

## Files Modified

- ✅ `src/core/StateManager.js` - **NEW** - Centralized state management
- ✅ `src/core/Table.js` - Added unified server loading, state manager integration
- ✅ `src/core/SortingManager.js` - Updated to use state manager
- ✅ `src/core/FilterManager.js` - Updated to use state manager
- ✅ `src/core/PaginationManager.js` - Updated to use state manager
- ✅ `src/core/SearchManager.js` - Updated to use state manager

## Backward Compatibility

✅ **100% backward compatible** - All existing code will continue to work without modifications.

The changes are internal refactoring that maintains the same public API.

## Performance Improvements

- **Reduced Network Traffic**: Single request per action instead of multiple
- **Better State Management**: Consistent state across all operations
- **Faster Response Time**: Eliminated redundant requests and processing

## Conclusion

These fixes provide a robust foundation for server-side operations in TablixJS, ensuring:
- Consistent behavior across all features
- Single, well-formed requests for all operations
- Persistent state that doesn't get lost during operations
- Proper initialization of all features on first load
- Clean, maintainable code architecture

All issues have been resolved, and the grid now works reliably with real server APIs.
