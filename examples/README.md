# TablixJS Examples

This folder contains comprehensive examples and tests for TablixJS functionality.

## Main Examples

### `built-version-test.html` - Complete Feature Test
- **Purpose**: Comprehensive test of the production-built version of TablixJS
- **Features**: All major features with interactive controls
- **Usage**: Primary test file for validating builds before publishing
- **Data**: Sample employee dataset with 100+ records

### `index.html` - Quick Start Demo
- **Purpose**: Simple introduction to TablixJS basics
- **Features**: Basic table setup with minimal configuration
- **Usage**: New user getting started guide

### `playground.html` - Interactive Playground
- **Purpose**: Experiment with different configurations
- **Features**: Live editing and testing environment
- **Usage**: Prototyping and learning TablixJS features

## Framework Integration Examples

### `vanilla.html` - Pure JavaScript
- **Purpose**: TablixJS with vanilla JavaScript
- **Features**: No framework dependencies
- **Usage**: Standard web page integration

### `react.html` - React Integration (in dev)
- **Purpose**: TablixJS in React applications
- **Features**: React component wrapper
- **Usage**: Modern React app integration

### `jquery-wrapper.html` - jQuery Integration ✅
- **Purpose**: TablixJS with jQuery
- **Features**: jQuery plugin-style usage
- **Usage**: Legacy application integration

## Feature-Specific Demos

### Pagination Examples
- `pagination.html` - Complete pagination showcase
- `complete-pagination-demo.html` - Advanced pagination features
- `pagination-samples.js` - Pagination configuration examples

### Sorting Examples  
- `sorting-demo.html` - Multi-column sorting demonstration
- `sorting-usage-examples.js` - Sorting configuration patterns

### Selection Examples
- `selection-demo.html` - Single and multi-row selection
- `drag-selection-demo.html` - Drag-to-select functionality
- `select-all-api-demo.html` - Select All API usage

### Filtering Examples
- `filtering-demo.html` - Column filtering capabilities
- `filtering-usage-examples.js` - Filter configuration examples
- `search-test.html` - Global search functionality

### Data Loading Examples
- `async-data-loading-demo.html` - Async data loading patterns
- `async-loading-test.html` - Server-side data loading test
- `async-data-loading-usage.js` - Data loading examples

### Virtual Scrolling Examples
- `virtual-scroll-demo.html` - Large dataset performance
- `virtual-scroll-test.html` - Virtual scroll testing
- `virtual-scroll-test-suite.html` - Comprehensive virtual scroll tests
- `virtual-scroll-bugfix-test.html` - Bug testing and validation
- `virtual-scrolling-usage-examples.js` - Virtual scroll configurations

### Column Formatting Examples
- `column-formatting-demo.html` - Custom column formatters
- `column-formatting-usage.js` - Formatting configuration patterns

### Theming Examples
- `theme-demo.html` - Theme switching and customization
- **Available Themes**: Default, Dark, and custom theme examples

### Localization Examples
- `localization-demo.html` - Multi-language support
- `localization-test.html` - Language switching test
- `auto-localization-demo.html` - Automatic language detection
- `filtering-localization-demo.html` - Localized filtering UI
- `localization-usage-examples.js` - Localization patterns

## Control and UI Examples

### `auto-controls.html` - Automatic Control Generation
- **Purpose**: Demonstrates auto-generated UI controls
- **Features**: Automatic pagination, search, and filter controls
- **Usage**: Zero-configuration UI setup

## How to Run Examples

### Method 1: Development Server
```bash
# Start development server
npm run dev

# Navigate to any example
# http://localhost:5174/examples/[example-name].html
```

### Method 2: Static Server
```bash
# Install serve globally
npm install -g serve

# Start server in project root
serve . -l 8080

# Navigate to examples
# http://localhost:8080/examples/[example-name].html
```

### Method 3: Direct File Opening
Most examples can be opened directly in a modern browser, though some features requiring server requests may not work.

## Testing Built Version

The `built-version-test.html` example specifically tests the production build:

1. **Build integrity**: All module formats work correctly
2. **Feature completeness**: Every major feature functions properly
3. **Performance**: Large datasets render efficiently
4. **UMD compatibility**: Browser script tag usage works
5. **CSS integration**: Styles and themes load correctly

**Test Process:**
```bash
# Build the library
npm run build

# Start server and test
npm run dev
# Navigate to: http://localhost:5174/examples/built-version-test.html
```

## Example Categories

### Basic Usage
- `index.html`, `vanilla.html`, `playground.html`

### Framework Integration (in dev)
- `react.html`, `jquery.html`

### Core Features
- `pagination.html`, `sorting-demo.html`, `filtering-demo.html`
- `selection-demo.html`, `async-data-loading-demo.html`

### Advanced Features
- `virtual-scroll-demo.html`, `drag-selection-demo.html`
- `column-formatting-demo.html`, `theme-demo.html`

### Localization
- `localization-demo.html`, `auto-localization-demo.html`
- `filtering-localization-demo.html`

### Testing and Validation
- `built-version-test.html`, `virtual-scroll-test-suite.html`
- `async-loading-test.html`, `search-test.html`

## Common Patterns

All examples follow these patterns:
- HTML structure with container div
- CSS inclusion (themes optional)
- JavaScript configuration object
- Event handling examples where applicable

## Troubleshooting

**Library Loading Issues:**
- Ensure `npm run build` has been executed
- Check `dist/` folder contains built files
- Verify correct file paths in HTML

**Feature Not Working:**
- Check browser console for errors
- Ensure modern browser (ES6+ support)
- Verify all required options are provided

**Performance Issues:**
- Use virtual scrolling for large datasets (1000+ rows)
- Enable pagination for better UX
- Check browser DevTools Performance tab
