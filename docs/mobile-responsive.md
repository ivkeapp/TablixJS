# Mobile Responsive Design

TablixJS includes built-in mobile responsive features to ensure tables work well on all device sizes.

## Horizontal Scrolling

### Overview

For tables with many columns that don't fit on smaller screens, TablixJS automatically wraps the table element with a scrollable container. This ensures that:

- ✅ **Controls remain visible** - Search bars, pagination, and other controls stay accessible
- ✅ **Only the table scrolls** - Users can scroll the table horizontally without losing access to controls
- ✅ **Native scrolling** - Uses native browser scrolling for optimal performance
- ✅ **Touch-friendly** - Smooth scrolling on iOS and Android devices

### Implementation

The table is automatically wrapped with a `div.tablix-table-wrapper` element:

```html
<div class="tablix-wrapper">
    <!-- Controls (search, filters, etc.) -->
    <div class="tablix-controls">...</div>
    
    <!-- Table wrapper with horizontal scroll -->
    <div class="tablix-table-wrapper" style="overflow-x: auto;">
        <table class="tablix-table">
            <!-- Table content -->
        </table>
    </div>
    
    <!-- Pagination -->
    <div class="tablix-pagination-container">...</div>
</div>
```

### CSS Styling

The table wrapper includes responsive styles:

```css
/* Table wrapper for horizontal scrolling */
.tablix-table-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS */
  width: 100%;
}

/* Mobile-specific adjustments */
@media (max-width: 768px) {
  .tablix-table-wrapper {
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  
  .tablix-table {
    min-width: 100%;
  }
}
```

### Virtual Scrolling Compatibility

When virtual scrolling is enabled, the table wrapper automatically adjusts to work with the virtual scroll container:

```css
/* Disable separate horizontal scroll when inside virtual scroll container */
.tablix-scroll-container .tablix-table-wrapper {
  overflow-x: visible;
}
```

The virtual scroll container itself handles both horizontal and vertical scrolling.

## Mobile-Friendly Features

### Responsive Breakpoints

TablixJS includes responsive breakpoints for optimal display on different devices:

- **Mobile** (< 768px): Smaller font sizes, compact padding
- **Tablet** (768px - 991.98px): Medium sizing
- **Desktop** (> 992px): Full sizing

### Font Size Adjustments

```css
:root {
  --tablix-font-size: 14px;           /* Desktop */
  --tablix-mobile-font-size: 13px;    /* Mobile */
}

@media (max-width: 768px) {
  .tablix-table {
    font-size: var(--tablix-mobile-font-size, 13px);
  }
}
```

### Padding Adjustments

```css
:root {
  --tablix-cell-padding: 12px 8px;         /* Desktop */
  --tablix-mobile-cell-padding: 8px 6px;   /* Mobile */
}

@media (max-width: 768px) {
  .tablix-th,
  .tablix-td {
    padding: var(--tablix-mobile-cell-padding, 8px 6px);
  }
}
```

## Custom Styling

You can customize the mobile scrolling behavior:

### Customize Scrollbar Appearance

```css
.tablix-table-wrapper {
  /* Customize scrollbar (WebKit browsers) */
  scrollbar-width: thin;
  scrollbar-color: #888 #f1f1f1;
}

.tablix-table-wrapper::-webkit-scrollbar {
  height: 8px;
}

.tablix-table-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.tablix-table-wrapper::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.tablix-table-wrapper::-webkit-scrollbar-thumb:hover {
  background: #555;
}
```

### Add Shadow Indicators

To show users that more content is available horizontally:

```css
.tablix-table-wrapper {
  position: relative;
}

.tablix-table-wrapper::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 30px;
  background: linear-gradient(to left, rgba(0,0,0,0.1), transparent);
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s;
}

/* Show shadow when scrollable */
.tablix-table-wrapper[data-scrollable="true"]::after {
  opacity: 1;
}
```

## Testing

Test the mobile responsive features:

1. **Browser Dev Tools**: Use device emulation in Chrome/Firefox DevTools
2. **Resize Browser**: Drag browser window to different widths
3. **Actual Devices**: Test on real phones and tablets
4. **Test File**: Use `examples/mobile-scroll-test.html` for comprehensive testing

## Example Usage

```javascript
import Table from 'tablixjs';

// Create table with many columns
const table = new Table('#myTable', {
  data: employees,
  columns: [
    { name: 'id', title: 'ID', width: '60px' },
    { name: 'name', title: 'Name', width: '150px' },
    { name: 'email', title: 'Email', width: '200px' },
    { name: 'phone', title: 'Phone', width: '120px' },
    { name: 'address', title: 'Address', width: '180px' },
    { name: 'city', title: 'City', width: '120px' },
    { name: 'state', title: 'State', width: '80px' },
    // ... more columns
  ],
  pagination: { enabled: true },
  search: { enabled: true }
});

// The table automatically gets the horizontal scroll wrapper
// No additional configuration needed!
```

## Best Practices

### 1. Set Column Widths

For optimal mobile experience, set explicit column widths:

```javascript
columns: [
  { name: 'id', title: 'ID', width: '60px' },
  { name: 'name', title: 'Name', width: '150px' },
  { name: 'description', title: 'Description', width: '300px' }
]
```

### 2. Prioritize Important Columns

Place the most important columns on the left side, as users will see these first on mobile:

```javascript
columns: [
  { name: 'name', title: 'Name' },        // Most important
  { name: 'status', title: 'Status' },    // Important
  { name: 'id', title: 'ID' },            // Less important
  { name: 'created', title: 'Created' }   // Less important
]
```

### 3. Consider Responsive Column Visibility

For very narrow screens, you might want to hide less important columns using CSS:

```css
@media (max-width: 480px) {
  .tablix-th[data-column="id"],
  .tablix-td:nth-child(1) {
    display: none;
  }
}
```

### 4. Test on Real Devices

Always test your tables on actual mobile devices to ensure the scrolling feels natural.

## Browser Support

- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari (iOS and macOS)
- ✅ Chrome for Android
- ✅ Samsung Internet

The `-webkit-overflow-scrolling: touch` property ensures smooth momentum scrolling on iOS devices.

## Troubleshooting

### Table Not Scrolling on Mobile

**Check:**
1. Ensure the table has enough columns to overflow
2. Verify CSS is loaded correctly
3. Check if custom CSS is overriding the wrapper styles

### Controls Scrolling with Table

**Issue**: The entire wrapper is scrolling, not just the table.

**Solution**: Ensure the `.tablix-table-wrapper` element is properly nested inside `.tablix-wrapper`. The structure should be:

```
.tablix-wrapper
  ├── .tablix-controls (stays fixed)
  ├── .tablix-table-wrapper (scrolls)
  │   └── .tablix-table
  └── .tablix-pagination-container (stays fixed)
```

### Scrollbar Not Visible

**Issue**: Users don't see the scrollbar on mobile.

**Solution**: Most mobile browsers hide scrollbars by default. Add visual indicators or rely on touch gestures. Consider adding shadow indicators (see Custom Styling section above).

## Related Features

- [Virtual Scrolling](./virtual-scrolling.md) - For handling large datasets
- [Theming](./theming.md) - Customize appearance including mobile styles
- [Pagination](./pagination.md) - Mobile-responsive pagination controls
