# TablixJS Examples

This folder contains example implementations and tests for TablixJS.

## Example Files

### `built-version-test.html` - **Complete Feature Test**
- **Purpose**: Comprehensive test of the production-built version of TablixJS
- **Features Tested**:
  - ✅ Data loading (static and async)
  - ✅ Pagination with page size controls
  - ✅ Sorting (multiple columns)
  - ✅ Filtering and search
  - ✅ Selection (single and multi-select)
  - ✅ Virtual scrolling with large datasets (10K rows)
  - ✅ Theming (default and dark themes)
  - ✅ Column formatting and custom renderers
  - ✅ Event handling and real-time updates
  - ✅ Performance monitoring

**How to Test:**
1. Build the project: `npm run build`
2. Start local server: `npm run dev` or `npx serve . -l 8080`
3. Navigate to: `http://localhost:PORT/examples/built-version-test.html`
4. Use the interactive controls to test all features

### Other Example Files

- `async-data-loading-demo.html` - Async data loading patterns
- `column-formatting-demo.html` - Custom column formatting
- `complete-pagination-demo.html` - Advanced pagination features
- `drag-selection-demo.html` - Row selection with drag
- `filtering-demo.html` - Advanced filtering capabilities
- `selection-demo.html` - Selection modes and APIs
- `sorting-demo.html` - Sorting functionality
- `virtual-scroll-demo.html` - Virtual scrolling performance
- `theme-demo.html` - Theme switching and customization

## Testing Built Version

The `built-version-test.html` example specifically tests the **production build** from the `dist/` folder to ensure:

1. **Build integrity**: All module formats work correctly
2. **Feature completeness**: Every major feature functions properly
3. **Performance**: Large datasets render efficiently with virtual scrolling
4. **UMD compatibility**: Browser script tag usage works
5. **CSS integration**: Styles and themes load correctly

## Quick Test Commands

```bash
# Build the library
npm run build

# Start development server
npm run dev

# Test in browser
# Navigate to: http://localhost:5174/examples/built-version-test.html

# Or start on specific port
npx serve . -l 8080
# Navigate to: http://localhost:8080/examples/built-version-test.html
```

## Test Results Verification

The built-version test provides real-time feedback on:
- Library loading status
- Performance metrics (load times, row counts)
- Feature activation confirmations
- Search and filter result counts
- Pagination information
- Selection statistics

## Troubleshooting

**Common Issues:**

1. **"TablixJS is not defined"**
   - Ensure you've run `npm run build` first
   - Check that `dist/tablixjs.umd.min.js` exists

2. **Styles not loading**
   - Verify `dist/tablixjs.css` and theme files exist
   - Check browser DevTools for 404 errors

3. **Features not working**
   - Open browser DevTools console for error messages
   - Ensure you're using a modern browser (ES6+ support)

4. **Performance issues with large datasets**
   - Enable virtual scrolling for 1000+ rows
   - Monitor browser DevTools Performance tab

## What This Tests

The comprehensive test validates that our build system produces:
- Functional UMD builds for browser usage
- Complete CSS bundles with working themes
- All TypeScript-defined APIs work correctly
- Performance optimizations are effective
- Event system functions properly
- Memory management (destroy/cleanup) works

This ensures confidence in the npm package before publishing!
