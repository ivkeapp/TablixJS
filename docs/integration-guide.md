# TablixJS Integration Guide

This guide explains the different ways to use TablixJS in your projects, including vanilla JavaScript, jQuery integration, React, and various module systems.

## Core Principles

TablixJS maintains a **dependency-free core** architecture, meaning:
- The core library works standalone without any external dependencies
- Optional integrations (jQuery, React) are provided as separate wrappers
- You can use TablixJS with or without these optional wrappers

## Installation Options

### 1. NPM Package (Recommended)

```bash
npm install tablixjs
```

### 2. CDN

```html
<!-- Core TablixJS -->
<script src="https://unpkg.com/tablixjs@latest/dist/tablixjs.umd.min.js"></script>

<!-- OR with jQuery wrapper bundled -->
<script src="https://unpkg.com/tablixjs@latest/dist/tablix.jquery.min.js"></script>

<!-- OR standalone jQuery plugin (requires separate TablixJS) -->
<script src="https://unpkg.com/tablixjs@latest/dist/tablixjs.umd.min.js"></script>
<script src="https://unpkg.com/tablixjs@latest/dist/tablix-jquery-plugin.min.js"></script>
```

### 3. Direct Download

Download the files you need from the `dist/` folder in the repository.

## Usage Scenarios

### Vanilla JavaScript

**ES Modules (Modern)**
```javascript
import { Table } from 'tablixjs';

const table = new Table(document.getElementById('myTable'), {
    data: myData,
    sortable: true,
    filterable: true
});
```

**CommonJS (Node.js)**
```javascript
const { Table } = require('tablixjs');
```

**Browser Script Tags**
```html
<script src="path/to/tablixjs.umd.min.js"></script>
<script>
    const table = new TablixJS.Table(document.getElementById('myTable'), {
        data: myData,
        sortable: true,
        filterable: true
    });
</script>
```

### jQuery Integration

TablixJS provides **multiple jQuery integration options** to suit different needs:

#### Option 1: Bundled jQuery Wrapper (Easiest)

This includes both TablixJS core and jQuery wrapper in a single file:

```html
<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
<script src="path/to/tablix.jquery.min.js"></script>
<script>
    $('#myTable').tablixjs({
        data: myData,
        sortable: true,
        filterable: true
    });
</script>
```

**NPM Usage:**
```javascript
// Import the bundled version
import 'tablixjs/jquery';

// Use jQuery as normal
$('#myTable').tablixjs(options);
```

#### Option 2: Standalone Plugin (Maximum Flexibility)

Load TablixJS and the jQuery plugin separately:

```html
<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
<script src="path/to/tablixjs.umd.min.js"></script>
<script src="path/to/tablix-jquery-plugin.min.js"></script>
<script>
    $('#myTable').tablixjs({
        data: myData,
        sortable: true,
        filterable: true
    });
</script>
```

**Benefits of Standalone Plugin:**
- Use existing TablixJS installation
- Smaller file if you already have TablixJS loaded
- Mix vanilla and jQuery usage in same project
- Better for Progressive Enhancement

#### Option 3: Manual jQuery Integration

You can also use TablixJS with jQuery manually:

```javascript
import { Table } from 'tablixjs';

$.fn.myCustomTable = function(options) {
    return this.each(function() {
        new Table(this, options);
    });
};

$('#myTable').myCustomTable(options);
```

### React Integration

```jsx
import React from 'react';
import { TableReact } from 'tablixjs/react';

function MyComponent() {
    const data = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 }
    ];

    return (
        <TableReact 
            data={data}
            sortable={true}
            filterable={true}
            className="my-table"
        />
    );
}
```

## Build Configuration Impact

### Does jQuery Wrapper Affect Core Library?

**No!** The jQuery wrapper has zero impact on:
- Core TablixJS functionality
- Bundle size when not used
- Performance of vanilla usage
- Dependency requirements

### Build Outputs Explained

The build system generates multiple files for different use cases:

```
dist/
├── tablixjs.esm.js          # ES Modules (modern)
├── tablixjs.esm.min.js      # ES Modules (minified)
├── tablixjs.cjs.js          # CommonJS (Node.js)
├── tablixjs.umd.js          # Universal (browser script tag)
├── tablixjs.umd.min.js      # Universal (minified)
├── tablix.jquery.js         # TablixJS + jQuery wrapper bundled
├── tablix.jquery.min.js     # TablixJS + jQuery wrapper (minified)
├── tablix-jquery-plugin.js  # jQuery plugin only (standalone)
└── tablix-jquery-plugin.min.js  # jQuery plugin only (minified)
```

### NPM Package Exports

The package.json includes multiple export paths:

```json
{
  "main": "./dist/tablixjs.cjs.js",
  "module": "./dist/tablixjs.esm.js",
  "browser": "./dist/tablixjs.umd.min.js",
  "exports": {
    ".": {
      "import": "./dist/tablixjs.esm.js",
      "require": "./dist/tablixjs.cjs.js",
      "browser": "./dist/tablixjs.umd.min.js"
    },
    "./jquery": {
      "import": "./dist/tablix.jquery.js",
      "require": "./dist/tablix.jquery.js",
      "browser": "./dist/tablix.jquery.min.js"
    },
    "./react": "./src/react/TableReact.jsx"
  }
}
```

## Dependency Management

### Peer Dependencies

TablixJS uses **optional peer dependencies**:

```json
{
  "peerDependencies": {
    "jquery": ">=3.0.0",
    "react": ">=16.8.0",
    "react-dom": ">=16.8.0"
  },
  "peerDependenciesMeta": {
    "jquery": { "optional": true },
    "react": { "optional": true },
    "react-dom": { "optional": true }
  }
}
```

This means:
- ✅ Core TablixJS installs with zero dependencies
- ✅ Warnings only appear if you use the wrappers without dependencies
- ✅ No forced installations of jQuery or React

### Runtime Detection

Both jQuery and React wrappers include runtime detection:

```javascript
// jQuery wrapper checks
if (typeof $ !== 'undefined' && $.fn) {
    // Register jQuery plugin
}

// React wrapper checks  
if (typeof React !== 'undefined') {
    // Export React component
}
```

## Best Practices

### For Library Authors

If you're building a library that uses TablixJS:

```javascript
// ✅ Good: Use core import
import { Table } from 'tablixjs';

// ❌ Avoid: Don't force jQuery on users
import 'tablixjs/jquery';
```

### For Application Developers

Choose the import that matches your needs:

```javascript
// Vanilla JS project
import { Table } from 'tablixjs';

// jQuery-heavy project  
import 'tablixjs/jquery';

// React project
import { TableReact } from 'tablixjs/react';
```

### For Progressive Enhancement

Start with vanilla and add jQuery later:

```html
<!-- Load core first -->
<script src="tablixjs.umd.min.js"></script>

<!-- Optionally enhance with jQuery -->
<script>
if (typeof $ !== 'undefined') {
    const script = document.createElement('script');
    script.src = 'tablix-jquery-plugin.min.js';
    document.head.appendChild(script);
}
</script>
```

## Migration Guide

### From Vanilla to jQuery

**Before:**
```javascript
const table = new TablixJS.Table(element, options);
```

**After:**
```javascript
$(element).tablixjs(options);
const table = $(element).data('tablixjs');
```

### From jQuery to Vanilla

**Before:**
```javascript
$('#table').tablixjs(options);
```

**After:**
```javascript
import { Table } from 'tablixjs';
const table = new Table(document.getElementById('table'), options);
```

## Troubleshooting

### jQuery Plugin Not Working

1. **Check jQuery is loaded:**
   ```javascript
   console.log(typeof $); // Should be 'function'
   ```

2. **Check TablixJS is loaded:**
   ```javascript
   console.log(typeof TablixJS); // Should be 'object'
   ```

3. **Check plugin is registered:**
   ```javascript
   console.log(typeof $.fn.tablixjs); // Should be 'function'
   ```

### Module Not Found Errors

```javascript
// ❌ If this fails:
import 'tablixjs/jquery';

// ✅ Try this instead:
import { Table } from 'tablixjs';
// Use vanilla API
```

### TypeScript Issues

```typescript
// Add type definitions
declare global {
    interface JQuery {
        tablixjs(options?: any): JQuery;
    }
}
```

## Summary

TablixJS provides flexible integration options while maintaining its core principle of **zero dependencies**. Choose the integration method that best fits your project:

- **Vanilla JS**: Maximum performance, minimal bundle size
- **jQuery Bundled**: Easiest jQuery integration
- **jQuery Plugin**: Maximum flexibility for mixed usage
- **React**: Idiomatic React component usage

All approaches are fully supported and maintained, so you can pick the one that works best for your specific use case.
