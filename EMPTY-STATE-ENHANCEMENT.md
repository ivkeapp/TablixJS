# Empty State Enhancement Proposal

## Overview

This document outlines proposed enhancements for native empty state, loading state, and error state support in TablixJS.

## Current State (v1.1.2)

### ✅ Already Supported
- **Loading State**: Available via `beforeLoad` and `afterLoad` events
- **Error State**: Available via `loadError` event + `renderer.renderError()` method
- **Event System**: Comprehensive event hooks for custom state handling

### ❌ Missing Features
- **Native Empty State**: No built-in configuration for "no results" scenarios
- **Default Messages**: No default UI for empty/loading/error states
- **CSS Classes**: No standard classes for state styling
- **Configuration Options**: No centralized state message configuration

---

## Proposed Enhancement: Native State Support

### 1. Configuration Options

Add new `messages` configuration section:

```javascript
const table = new Table('#myTable', {
  columns: [...],
  data: [...],
  
  // NEW: State messages configuration
  messages: {
    loading: {
      enabled: true,
      html: '<div class="tablix-loading-state"><div class="spinner"></div><p>Loading data...</p></div>',
      className: 'tablix-loading'
    },
    empty: {
      enabled: true,
      html: '<div class="tablix-empty-state"><p>No results found</p></div>',
      className: 'tablix-empty'
    },
    error: {
      enabled: true,
      html: (error) => `<div class="tablix-error-state"><p>Error: ${error.message}</p></div>`,
      className: 'tablix-error'
    }
  }
});
```

### 2. State Detection Logic

**Empty State Triggers:**
- After data loading completes with `data.length === 0`
- After filtering/search results in zero rows
- After server-side operations return empty datasets

**Loading State Triggers:**
- During `loadData()` execution
- During server-side pagination/sorting/filtering
- During async data fetch operations

**Error State Triggers:**
- Network errors during data loading
- Server errors (4xx, 5xx responses)
- Data validation failures
- Custom error conditions from event handlers

### 3. Implementation Approach

#### Option A: Renderer-Based (Recommended)

Add methods to `Renderer` class:

```javascript
// src/core/Renderer.js

class Renderer {
  renderLoadingState() {
    if (!this.table.options.messages?.loading?.enabled) return;
    
    const html = this.table.options.messages.loading.html;
    const className = this.table.options.messages.loading.className;
    
    const loadingDiv = document.createElement('div');
    loadingDiv.className = className;
    loadingDiv.innerHTML = typeof html === 'function' ? html() : html;
    
    this.tableBody.innerHTML = '';
    this.tableBody.appendChild(loadingDiv);
  }
  
  renderEmptyState() {
    if (!this.table.options.messages?.empty?.enabled) return;
    
    const html = this.table.options.messages.empty.html;
    const className = this.table.options.messages.empty.className;
    
    const emptyDiv = document.createElement('div');
    emptyDiv.className = className;
    emptyDiv.innerHTML = typeof html === 'function' ? html() : html;
    
    this.tableBody.innerHTML = '';
    this.tableBody.appendChild(emptyDiv);
  }
  
  renderErrorState(error) {
    if (!this.table.options.messages?.error?.enabled) return;
    
    const html = this.table.options.messages.error.html;
    const className = this.table.options.messages.error.className;
    
    const errorDiv = document.createElement('div');
    errorDiv.className = className;
    errorDiv.innerHTML = typeof html === 'function' ? html(error) : html;
    
    this.tableBody.innerHTML = '';
    this.tableBody.appendChild(errorDiv);
  }
  
  clearStateMessages() {
    const stateElements = this.container.querySelectorAll(
      '.tablix-loading, .tablix-empty, .tablix-error'
    );
    stateElements.forEach(el => el.remove());
  }
}
```

#### Option B: Manager-Based

Create a dedicated `StateMessageManager` class:

```javascript
// src/core/StateMessageManager.js

export default class StateMessageManager {
  constructor(table) {
    this.table = table;
    this.currentState = null;
  }
  
  showLoading() { /* ... */ }
  showEmpty() { /* ... */ }
  showError(error) { /* ... */ }
  clearState() { /* ... */ }
}
```

### 4. Integration Points

**Table.js modifications:**

```javascript
async loadData(source) {
  // Show loading state
  if (this.options.messages?.loading?.enabled) {
    this.renderer.renderLoadingState();
  }
  
  this.eventManager.emit('beforeLoad', { source });
  
  try {
    let data;
    
    if (Array.isArray(source)) {
      data = source;
    } else if (typeof source === 'string') {
      data = await this._fetchFromUrl(source);
    } else if (typeof source === 'function') {
      const result = await source();
      data = Array.isArray(result) ? result : result.data || [];
    }
    
    await this.dataManager.setData(data);
    
    // Check for empty state
    if (data.length === 0 && this.options.messages?.empty?.enabled) {
      this.renderer.renderEmptyState();
    } else {
      await this.refreshTable();
    }
    
    this.eventManager.emit('afterLoad', { data });
    
  } catch (error) {
    console.error('Error loading data:', error);
    
    // Show error state
    if (this.options.messages?.error?.enabled) {
      this.renderer.renderErrorState(error);
    }
    
    this.eventManager.emit('loadError', { error, source });
    throw error;
  }
}

async refreshTable() {
  const visibleData = await this.dataManager.getVisibleData();
  
  // Check for empty filtered/searched results
  if (visibleData.length === 0 && this.options.messages?.empty?.enabled) {
    this.renderer.renderEmptyState();
  } else {
    this.renderer.clearStateMessages();
    this.renderer.render(visibleData);
  }
  
  if (this.paginationManager) {
    this.paginationManager.render();
  }
}
```

### 5. Localization Support

Add default translations:

```javascript
// src/locales/en.js (default)
export const englishTranslations = {
  loading: 'Loading data...',
  emptyState: 'No results found',
  emptyStateFiltered: 'No results match your filters',
  emptyStateSearched: 'No results match your search',
  errorState: 'An error occurred while loading data',
  // ...
};
```

Usage:

```javascript
const table = new Table('#myTable', {
  messages: {
    empty: {
      enabled: true,
      html: `<div class="tablix-empty-state">
        <p>${this.localization.t('emptyState')}</p>
      </div>`
    }
  }
});
```

### 6. CSS Styles

Add default styles:

```css
/* src/styles/states.css */

.tablix-loading-state,
.tablix-empty-state,
.tablix-error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  text-align: center;
  min-height: 200px;
}

.tablix-loading-state {
  color: var(--tablix-text-secondary, #666);
}

.tablix-loading-state .spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--tablix-border-color, #e0e0e0);
  border-top-color: var(--tablix-primary, #007bff);
  border-radius: 50%;
  animation: tablix-spin 0.8s linear infinite;
  margin-bottom: 1rem;
}

@keyframes tablix-spin {
  to { transform: rotate(360deg); }
}

.tablix-empty-state {
  color: var(--tablix-text-secondary, #999);
}

.tablix-empty-state svg,
.tablix-empty-state .icon {
  width: 64px;
  height: 64px;
  opacity: 0.5;
  margin-bottom: 1rem;
}

.tablix-error-state {
  color: var(--tablix-error-color, #dc3545);
  background-color: var(--tablix-error-bg, #fff5f5);
}

.tablix-error-state .error-details {
  font-size: 0.875rem;
  color: var(--tablix-text-secondary, #666);
  margin-top: 0.5rem;
}
```

### 7. Backward Compatibility

**Requirements:**
- ✅ Existing event-based approaches must continue to work
- ✅ Tables without `messages` config should behave exactly as before
- ✅ No breaking changes to existing APIs
- ✅ All current examples should work without modification

**Migration Path:**
```javascript
// Old approach (still works)
table.on('beforeLoad', () => showSpinner());
table.on('afterLoad', (payload) => {
  hideSpinner();
  if (payload.data.length === 0) showEmptyMessage();
});

// New approach (opt-in)
const table = new Table('#myTable', {
  messages: { empty: { enabled: true } }
});
```

---

## Implementation Priority

### Phase 1: Core Implementation (High Priority)
- [ ] Add `messages` configuration option
- [ ] Implement `renderEmptyState()` in Renderer
- [ ] Implement `renderLoadingState()` in Renderer  
- [ ] Implement `renderErrorState()` in Renderer
- [ ] Add state detection in `loadData()` and `refreshTable()`

### Phase 2: Styling & Polish (Medium Priority)
- [ ] Create default CSS for all states
- [ ] Add theme-specific state styles
- [ ] Test responsive behavior
- [ ] Add transitions/animations

### Phase 3: Localization & Advanced (Low Priority)
- [ ] Add state message translations
- [ ] Support dynamic message templates
- [ ] Add retry button for error states
- [ ] Add custom action buttons

---

## Benefits

1. **Developer Experience**: Simple configuration instead of event listeners
2. **Consistency**: Standardized state handling across all tables
3. **Accessibility**: Proper ARIA labels for state messages
4. **Theming**: State messages follow theme styling
5. **Localization**: Automatic translation of state messages
6. **Less Code**: Reduce boilerplate in user applications

---

## Example Usage After Implementation

```javascript
const table = new Table('#myTable', {
  columns: [
    { name: 'id', title: 'ID' },
    { name: 'name', title: 'Name' }
  ],
  
  // Simple configuration - that's it!
  messages: {
    loading: { enabled: true },
    empty: { enabled: true },
    error: { enabled: true }
  }
});

// Load data - states are handled automatically
await table.loadData('https://api.example.com/users');
```

**Custom HTML:**

```javascript
messages: {
  empty: {
    enabled: true,
    html: `
      <div class="custom-empty">
        <img src="/empty-state.svg" alt="No data">
        <h3>No users found</h3>
        <p>Try adjusting your filters or search criteria</p>
        <button onclick="table.clearFilters()">Clear Filters</button>
      </div>
    `
  }
}
```

---

## Testing Checklist

- [ ] Empty state shows when initial data is empty array
- [ ] Empty state shows after filtering returns no results
- [ ] Empty state shows after search returns no results
- [ ] Loading state shows during async data loading
- [ ] Loading state shows during server-side operations
- [ ] Error state shows on network failures
- [ ] Error state shows on server errors
- [ ] States are properly cleared when data loads successfully
- [ ] Localization works for all state messages
- [ ] Custom HTML templates work correctly
- [ ] Themes apply correctly to state messages
- [ ] Backward compatibility with event-based approach
- [ ] No console errors or warnings

---

## Questions for Discussion

1. Should states be rendered inside `<tbody>` or in a separate overlay container?
2. Should loading state block user interactions (modal) or allow background actions?
3. Should error states auto-dismiss or require user action?
4. Should there be a retry mechanism for failed data loads?
5. Should animation/transitions be built-in or left to CSS customization?

---

**Status**: Proposal - Awaiting Review & Implementation

**Version Target**: v1.2.0

**Estimated Effort**: 2-3 days development + 1 day testing

**Breaking Changes**: None (fully backward compatible)
