# TablixJS Server-Side Data Loading Demo

## 📋 Overview

This is a comprehensive manual testing demo page that validates server-side data loading functionality in TablixJS. The demo is specifically designed to verify that previously broken server-side behaviors have been fixed and are working correctly.

## 🎯 Purpose

This demo validates the following fixed issues:

1. ✅ **Selection Works on First Load** - Row selection is immediately functional without requiring page refresh
2. ✅ **Filter Values Available on First Load** - Column filter dropdowns are populated with values from the initial server response
3. ✅ **No Duplicate Server Requests** - Each user action triggers exactly ONE server request
4. ✅ **Persistent Filter/Sort/Search State** - State is maintained across all operations (pagination, sorting, filtering)
5. ✅ **Search Term Passed to Backend** - Search input value is consistently included in server request parameters
6. ✅ **Consistent Sort Payload** - Sort parameter is always a well-defined object (never null/undefined)

## 🚀 How to Run

### Prerequisites

1. **Backend Server Running**
   ```bash
   # The backend must be running on http://localhost:3002
   # Endpoint: http://localhost:3002/api/getTable
   ```

2. **TablixJS Built**
   ```bash
   # Make sure TablixJS is built
   npm run build
   ```

### Start the Demo

1. **Start your backend server** (must be running on port 3002)

2. **Open the demo file** in a web browser:
   ```
   examples/server-side-demo.html
   ```

   Or use a local server:
   ```bash
   # Using Python
   python -m http.server 8000
   # Then open http://localhost:8000/examples/server-side-demo.html
   
   # Using Node.js http-server
   npx http-server -p 8000
   # Then open http://localhost:8000/examples/server-side-demo.html
   ```

3. **Watch the debug panel** on the right side - it shows:
   - Total request count
   - Last request payload
   - Validation checklist
   - Request history

## 🧪 Testing Guide

### Automated Quick Validation

Click the **"🧪 Run Quick Validation"** button to automatically:
1. Apply a filter
2. Sort a column  
3. Change page
4. Verify exactly 3 requests were made (no duplicates)
5. Confirm state persisted through all operations

### Manual Testing

#### Test 1: Selection on First Load
1. **Immediately after page loads**, click on any row
2. Click **"Test Selection"** button
3. ✅ **Expected**: Alert shows selected row count
4. ❌ **Fail**: Selection doesn't work or alert shows 0 rows

#### Test 2: Filter Values Available
1. Click any column filter icon (funnel icon in column header)
2. Click **"Filter by values"** tab
3. ✅ **Expected**: Dropdown shows multiple values
4. ❌ **Fail**: Dropdown shows "No values available"

#### Test 3: No Duplicate Requests
1. Click any column header to sort
2. Watch **"Total Server Requests"** counter
3. ✅ **Expected**: Counter increases by exactly 1
4. ❌ **Fail**: Counter increases by 2 or more

#### Test 4: State Persistence
1. Apply a filter (e.g., filter Category = "Alpha")
2. Sort by a column (e.g., Name)
3. Change page (if available)
4. Check **"Last Request Payload"**
5. ✅ **Expected**: All params (filter, sort, page) are present
6. ❌ **Fail**: Filter or sort params are missing/reset

#### Test 5: Search Term Included
1. Type in the search box (e.g., "test")
2. Wait for request to complete (~500ms)
3. Check **"Last Request Payload"**
4. ✅ **Expected**: `"search": "test"` appears in payload
5. ❌ **Fail**: search parameter is missing or empty

#### Test 6: Sort Payload Consistency
1. Watch **"Last Request Payload"** during any operation
2. Look at the `sort` parameter
3. ✅ **Expected**: `sort` is always `{}` or `{ column: "...", direction: "..." }`
4. ❌ **Fail**: `sort` is `null`, `undefined`, or inconsistent

## 🔍 Debug Panel Features

### Request Counter
- Shows total number of server requests made
- **Green**: Normal operation
- **Yellow**: High request count (> 10)
- **Red**: Duplicate requests detected

### Status Indicator
- **Gray (Idle)**: No active requests
- **Yellow (Loading)**: Request in progress (with animation)
- **Green (Success)**: Request completed successfully

### Last Request Payload
Shows the most recent parameters sent to the server:
```json
{
  "page": 1,
  "pageSize": 10,
  "sort": {
    "column": "test_name",
    "direction": "asc"
  },
  "filters": {
    "test_category": {
      "type": "value",
      "values": ["Alpha"]
    }
  },
  "search": "test"
}
```

### Validation Checklist
Real-time status of all validation tests:
- ⏺ **Pending**: Test not yet performed
- ✓ **Success**: Test passed
- ✗ **Failed**: Test failed (with error message)

### Request History
Chronological log of all server requests with:
- Request number and timestamp
- Action type (INITIAL LOAD, SEARCH, FILTER, SORT, PAGINATE)
- Full request payload

## 🏗️ Backend API Contract

The demo expects the backend to implement this endpoint:

### Endpoint
```
POST http://localhost:3002/api/getTable
```

### Request Format
```typescript
{
  page: number,           // Current page (1-based)
  pageSize: number,       // Items per page
  sort: {                 // Sort configuration
    column?: string,      // Column to sort by
    direction?: 'asc' | 'desc'
  },
  filters: {              // Active filters
    [columnName: string]: {
      type: 'value' | 'condition',
      values?: string[],   // For value filters
      operator?: string,   // For condition filters
      value?: any          // For condition filters
    }
  },
  search: string         // Global search term
}
```

### Response Format
```typescript
{
  data: Array<{          // Page data
    id: number,
    test_id: string,
    test_name: string,
    test_category: string,
    test_value: number,
    test_date: string
  }>,
  totalRows: number      // Total count (for pagination)
}
```

## 📊 Expected Behavior

### On Initial Load
1. **One request** is made with default parameters
2. Table renders with first page of data
3. Selection is immediately functional
4. Filter dropdowns are populated
5. Request count shows: 1

### On Sort
1. **One request** is made with sort parameters
2. Previous filters/search are maintained
3. Table re-renders with sorted data
4. Request count increases by: 1

### On Filter
1. **One request** is made with filter parameters
2. Previous sort/search are maintained
3. Page resets to 1
4. Request count increases by: 1

### On Page Change
1. **One request** is made with new page number
2. Previous sort/filters/search are maintained
3. Table shows requested page
4. Request count increases by: 1

### On Search
1. **One request** is made with search term (after debounce)
2. Previous sort/filters are maintained
3. Page resets to 1
4. Request count increases by: 1

## 🐛 Common Issues & Solutions

### Issue: "Failed to fetch" Error

**Cause**: Backend server not running or wrong port

**Solution**:
```bash
# Verify backend is running on port 3002
curl http://localhost:3002/api/getTable

# If not, start your backend server
```

### Issue: Duplicate Requests Detected

**Cause**: Multiple event handlers or state not properly managed

**Solution**: This indicates a regression in the fixes. Check:
- `StateManager` is properly integrated
- `_loadServerData()` is being used correctly
- No redundant `refreshTable()` calls

### Issue: Filter Dropdowns Empty

**Cause**: `getColumnUniqueValues()` not using correct data source

**Solution**: Verify:
- `FilterManager` is using `filteredData` for server mode
- Server response includes data in correct format

### Issue: Search Not Working

**Cause**: Search term not synced with StateManager

**Solution**: Verify:
- `SearchManager.performSearch()` calls `stateManager.updateSearch()`
- `_loadServerData()` includes search in params

## 🎨 UI Features

### Table Features
- **Sortable columns**: Click column headers to sort
- **Filterable columns**: Click filter icon to open filter panel
- **Pagination**: Navigate pages with controls at bottom
- **Search**: Type in search box at top
- **Selection**: Click rows to select (multi-select with checkbox column)

### Visual Feedback
- Loading indicator during requests
- Request counter updates in real-time
- Status indicator shows current state
- Request history with timestamps
- Color-coded validation checklist

## 📝 Notes

### What This Demo Does NOT Do
- ❌ No automated testing (Jest/Playwright/Cypress)
- ❌ No mocking - uses real backend
- ❌ No unit tests - this is integration validation only
- ❌ No backend implementation - backend must be provided

### What This Demo DOES Do
- ✅ Visual validation of all fixed issues
- ✅ Interactive testing with clear feedback
- ✅ Real-time request monitoring
- ✅ Comprehensive state tracking
- ✅ Clear success/failure indicators

## 🔗 Related Documentation

- [SERVER-MODE-FIXES.md](../SERVER-MODE-FIXES.md) - Technical details of all fixes
- [Integration Guide](../docs/integration-guide.md) - How to integrate TablixJS
- [API Documentation](../docs/) - Full API reference

## ✅ Success Criteria

The demo is considered successful when:

1. ✓ All checklist items show green checkmarks
2. ✓ Request counter matches expected count (1 per action)
3. ✓ No duplicate requests detected
4. ✓ All state persists across operations
5. ✓ Search terms appear in payloads
6. ✓ Sort payload is always consistent

## 🎯 Testing Checklist

Before considering server-side mode production-ready, verify:

- [ ] Initial load makes exactly 1 request
- [ ] Row selection works immediately after load
- [ ] Filter dropdowns populated on first load
- [ ] Sorting triggers exactly 1 request
- [ ] Filtering triggers exactly 1 request
- [ ] Pagination triggers exactly 1 request
- [ ] Search triggers exactly 1 request (after debounce)
- [ ] Filters persist after sorting
- [ ] Sort persists after filtering
- [ ] Search persists after pagination
- [ ] All combined operations work correctly
- [ ] Quick Validation passes all checks
- [ ] No console errors
- [ ] Request payloads match expected format
- [ ] Backend receives correct parameters

## 📞 Support

If you encounter issues with this demo:

1. Check browser console for errors
2. Verify backend is running and accessible
3. Check request payloads in debug panel
4. Review [SERVER-MODE-FIXES.md](../SERVER-MODE-FIXES.md) for technical details
5. Open an issue on GitHub with:
   - Browser and version
   - Request payloads from debug panel
   - Console errors
   - Steps to reproduce

---

**Last Updated**: December 2025  
**Demo Version**: 1.0  
**TablixJS Version**: Latest (with server-mode fixes)
