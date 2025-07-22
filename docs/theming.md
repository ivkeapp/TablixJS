# TablixJS CSS Theming Guide

## New Theme Architecture

TablixJS now uses a modular CSS architecture with CSS custom properties (CSS variables) for easy theming and customization.

## File Structure

```
src/styles/
├── tablix.css              # Main stylesheet (imports everything)
├── table-core.css          # Core table structure (uses CSS variables)
├── pagination-core.css     # Pagination components (uses CSS variables)
├── pagination.css          # Legacy compatibility file
└── themes/
    ├── default.css         # Default light theme (defines all variables)
    └── dark.css           # Dark theme (overrides variables)
```

## Basic Usage

### Include the Main Stylesheet
```html
<link rel="stylesheet" href="./src/styles/tablix.css">
```

This includes:
- Core table structure
- Pagination components  
- Default theme variables

## Theming Options

### 1. Use Built-in Dark Theme

**Method 1: Data attribute (recommended)**
```html
<html data-theme="dark">
<!-- Your content -->
</html>
```

**Method 2: CSS class**
```html
<div class="tablix-wrapper dark">
  <!-- Table content -->
</div>
```

### 2. Create Custom Theme

Override CSS custom properties to create your own theme:

```css
/* Custom green theme */
.my-green-theme {
  --tablix-btn-active-color: #28a745;
  --tablix-focus-color: #28a745;
  --tablix-btn-hover-border-color: #28a745;
  --tablix-header-bg: #e8f5e9;
  --tablix-header-text-color: #1b5e20;
}
```

Apply to your table:
```html
<div id="myTable" class="my-green-theme"></div>
```

### 3. Global Theme Customization

Override variables in your main CSS:

```css
:root {
  --tablix-btn-active-color: #9c27b0;
  --tablix-focus-color: #9c27b0;
  --tablix-header-bg: #f3e5f5;
  /* ... more customizations */
}
```

## Available CSS Custom Properties

### Typography
```css
--tablix-font-family: font family for all text
--tablix-font-size: base font size
--tablix-mobile-font-size: font size on mobile
```

### Colors - Text
```css
--tablix-text-color: main text color
--tablix-header-text-color: header text color
--tablix-empty-text-color: empty state text
--tablix-loading-text-color: loading indicator text
--tablix-error-text-color: error message text
```

### Colors - Backgrounds
```css
--tablix-table-bg: table background
--tablix-header-bg: header background
--tablix-row-even-bg: even row background
--tablix-row-hover-bg: row hover background
--tablix-error-bg: error message background
```

### Colors - Borders
```css
--tablix-table-border: table border
--tablix-cell-border: cell border
--tablix-error-border: error message border
--tablix-pagination-border: pagination border
```

### Colors - Interactive
```css
--tablix-focus-color: focus indicator color
--tablix-focus-shadow: focus shadow
```

### Spacing
```css
--tablix-cell-padding: cell padding
--tablix-mobile-cell-padding: cell padding on mobile
--tablix-empty-padding: empty state padding
--tablix-loading-padding: loading state padding
--tablix-error-padding: error message padding
```

### Pagination
```css
--tablix-pagination-margin-top: spacing above pagination
--tablix-pagination-padding: pagination internal padding
--tablix-pagination-gap: gap between pagination elements
--tablix-pagination-info-color: info text color
--tablix-pagination-info-font-size: info text size
```

### Buttons
```css
--tablix-btn-padding: button padding
--tablix-btn-border: button border
--tablix-btn-bg: button background
--tablix-btn-text-color: button text color
--tablix-btn-hover-bg: button hover background
--tablix-btn-hover-border-color: button hover border
--tablix-btn-active-bg: active button background
--tablix-btn-active-color: active button color
--tablix-btn-active-text: active button text
--tablix-btn-disabled-bg: disabled button background
--tablix-btn-disabled-text: disabled button text
```

## Advanced Customization Examples

### Corporate Brand Theme
```css
.corporate-theme {
  --tablix-header-bg: #003d82;
  --tablix-header-text-color: white;
  --tablix-btn-active-color: #003d82;
  --tablix-focus-color: #003d82;
  --tablix-table-border: 2px solid #003d82;
}
```

### High Contrast Theme
```css
.high-contrast-theme {
  --tablix-text-color: #000;
  --tablix-table-bg: #fff;
  --tablix-header-bg: #000;
  --tablix-header-text-color: #fff;
  --tablix-cell-border: 2px solid #000;
  --tablix-btn-border: 2px solid #000;
  --tablix-btn-active-color: #000;
  --tablix-focus-color: #000;
}
```

### Minimal Theme
```css
.minimal-theme {
  --tablix-table-border: none;
  --tablix-cell-border: none;
  --tablix-pagination-border: none;
  --tablix-header-bg: transparent;
  --tablix-row-even-bg: transparent;
  --tablix-btn-border: none;
  --tablix-btn-bg: transparent;
}
```

## Migration from Old CSS

If you're updating from the old `pagination.css`:

**Old way:**
```html
<link rel="stylesheet" href="./src/styles/pagination.css">
```

**New way (recommended):**
```html
<link rel="stylesheet" href="./src/styles/tablix.css">
```

**For backward compatibility:**
The old `pagination.css` file now imports the new structure, so existing code will continue to work.

## Creating Theme Packages

You can create reusable theme packages:

**themes/my-brand.css:**
```css
/* My Brand Theme */
:root {
  --tablix-font-family: 'Brand Font', sans-serif;
  --tablix-header-bg: #your-brand-color;
  --tablix-btn-active-color: #your-accent-color;
  /* ... more variables */
}
```

**Usage:**
```html
<link rel="stylesheet" href="./src/styles/tablix.css">
<link rel="stylesheet" href="./themes/my-brand.css">
```

## Dynamic Theme Switching

```javascript
// Switch to dark theme
document.documentElement.setAttribute('data-theme', 'dark');

// Switch back to light theme
document.documentElement.removeAttribute('data-theme');

// Apply custom theme class
document.querySelector('.tablix-wrapper').classList.add('my-custom-theme');
```

## Performance Notes

- CSS custom properties have excellent browser support and performance
- Theme changes are instant (no JavaScript required)
- Only the changed properties are recalculated
- Inheritance works naturally with CSS custom properties

## Browser Support

CSS custom properties are supported in:
- Chrome 49+
- Firefox 31+  
- Safari 9.1+
- Edge 16+

For older browsers, the default theme will be used as a fallback.
