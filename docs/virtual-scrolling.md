# Virtual Scrolling

TablixJS supports high-performance virtual scrolling for handling large datasets (100,000+ rows) without compromising performance or user experience.

## Overview

Virtual scrolling renders only the visible rows plus a configurable buffer zone, maintaining the illusion that all rows are present in the DOM while dramatically reducing memory usage and improving performance.

## Features

- ✅ **Dynamic Row Height Detection** - Automatically measures row height based on your CSS styling
- ✅ **Configurable Buffer Zones** - Render extra rows above/below viewport for smooth scrolling
- ✅ **Smooth Scrolling** - No visual gaps or flickering during fast scrolling
- ✅ **Selection Preservation** - Maintains selected state for rows outside the viewport
- ✅ **Performance Monitoring** - Built-in metrics for render times and scroll updates
- ✅ **Framework Compatibility** - Works with React, jQuery, and vanilla JavaScript

## Configuration

```javascript
const table = new Table('#container', {
  virtualScroll: {
    enabled: true,              // Enable virtual scrolling
    buffer: 10,                 // Number of rows to render above/below viewport
    rowHeight: null,            // Auto-detect row height (or set fixed value)
    containerHeight: 400        // Scroll container height in pixels
  },
  
  // Note: Disable pagination when using virtual scrolling
  pagination: {
    enabled: false
  }
});
```

## Basic Usage

```javascript
// Generate large dataset
const data = [];
for (let i = 0; i < 100000; i++) {
  data.push({
    id: i + 1,
    name: `User ${i + 1}`,
    email: `user${i + 1}@example.com`,
    department: departments[i % departments.length],
    salary: Math.floor(Math.random() * 150000) + 30000
  });
}

// Create table with virtual scrolling
const table = new Table('#my-table', {
  virtualScroll: {
    enabled: true,
    buffer: 15,
    containerHeight: 500
  },
  pagination: { enabled: false },
  sorting: { enabled: true },
  filtering: { enabled: true },
  selection: { enabled: true, mode: 'multi' },
  columns: [
    { name: 'id', title: 'ID' },
    { name: 'name', title: 'Name' },
    { name: 'email', title: 'Email' },
    { 
      name: 'salary', 
      title: 'Salary',
      renderer: (value) => `$${value.toLocaleString()}`
    }
  ]
});

table.loadData(data);
```

## Advanced Usage with Custom Renderers

```javascript
const table = new Table('#advanced-table', {
  virtualScroll: {
    enabled: true,
    buffer: 20,
    containerHeight: 600
  },
  columns: [
    {
      name: 'user',
      title: 'User Profile',
      renderer: (value, row) => `
        <div style="display: flex; align-items: center;">
          <img src="${row.avatar}" alt="${row.name}" 
               style="width: 32px; height: 32px; border-radius: 50%; margin-right: 8px;">
          <div>
            <strong>${row.name}</strong><br>
            <small>${row.email}</small>
          </div>
        </div>
      `
    },
    {
      name: 'actions',
      title: 'Actions',
      renderer: (value, row) => `
        <button onclick="editUser(${row.id})">Edit</button>
        <button onclick="deleteUser(${row.id})">Delete</button>
      `
    }
  ]
});
```

## API Methods

### Enable/Disable Virtual Scrolling

```javascript
// Enable virtual scrolling
table.virtualScrollManager.setEnabled(true);

// Disable virtual scrolling
table.virtualScrollManager.setEnabled(false);

// Check if virtual scrolling is enabled
if (table.virtualScrollManager.isEnabled()) {
  console.log('Virtual scrolling is active');
}
```

### Scroll to Specific Row

```javascript
// Scroll to row 5000
table.virtualScrollManager.scrollToRow(5000);
```

### Get Visible Range

```javascript
const range = table.virtualScrollManager.getVisibleRange();
console.log(`Visible rows: ${range.start} - ${range.end}`);
console.log(`Rendered rows: ${range.renderedStart} - ${range.renderedEnd}`);
```

### Performance Monitoring

```javascript
const stats = table.virtualScrollManager.getPerformanceStats();
console.log('Performance Statistics:', {
  averageRenderTime: stats.averageRenderTime + 'ms',
  maxRenderTime: stats.maxRenderTime + 'ms',
  scrollUpdates: stats.scrollUpdates,
  totalRows: stats.totalRows,
  renderedRows: stats.renderedRows
});
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | `false` | Enable/disable virtual scrolling |
| `buffer` | number | `10` | Number of rows to render above/below viewport |
| `rowHeight` | number | `null` | Fixed row height in pixels (auto-detected if null) |
| `containerHeight` | number | `400` | Scroll container height in pixels |

## Performance Considerations

### Recommended Settings

- **Small datasets (< 1,000 rows)**: Virtual scrolling not needed
- **Medium datasets (1,000 - 10,000 rows)**: `buffer: 5-10`
- **Large datasets (10,000 - 100,000 rows)**: `buffer: 10-15`
- **Very large datasets (100,000+ rows)**: `buffer: 15-25`

### Optimization Tips

1. **Use lightweight renderers** - Avoid complex DOM manipulation in cell renderers
2. **Optimize CSS** - Use efficient selectors and avoid expensive styles
3. **Monitor performance** - Use built-in performance metrics to tune settings
4. **Consider pagination** - For extremely large datasets, combine with server-side pagination

## Browser Compatibility

Virtual scrolling is supported in all modern browsers:

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Limitations

1. **Fixed-height containers** - Requires a container with defined height
2. **Row height consistency** - Works best with consistent row heights
3. **Selection complexity** - Complex selection operations may be slower with very large datasets

## Examples

See the complete examples in the `/examples` directory:

- `virtual-scroll-demo.html` - Full-featured demo with 100,000+ rows
- `virtual-scroll-test.html` - Simple test implementation

## Troubleshooting

### Common Issues

**Problem**: Blank rows or flickering during scroll
**Solution**: Increase the buffer size or check for CSS issues affecting row height

**Problem**: Poor performance with custom renderers
**Solution**: Optimize cell renderers and avoid DOM-heavy operations

**Problem**: Selection not working properly
**Solution**: Ensure each row has a unique `id` field or configure `dataIdKey`

### Debug Mode

Enable debug logging to monitor virtual scrolling behavior:

```javascript
const table = new Table('#container', {
  debug: true,  // Enable debug logging
  virtualScroll: {
    enabled: true,
    buffer: 10
  }
});
```

This will log performance metrics and scroll events to the browser console.
