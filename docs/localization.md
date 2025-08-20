# TablixJS Localization System

The TablixJS localization system provides comprehensive internationalization (i18n) support, allowing you to create multilingual data tables with ease. The system is built into the core library and provides seamless translation of all user-facing strings.

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [API Reference](#api-reference)
4. [Language Packs](#language-packs)
5. [Custom Translations](#custom-translations)
6. [Plugin Development](#plugin-development)
7. [Advanced Usage](#advanced-usage)
8. [Best Practices](#best-practices)

## Overview

### Key Features

- **Built-in Core Support**: Localization is part of the core, not a plugin
- **Default English**: Works out of the box with English as the fallback language
- **Auto-loading Languages**: Common languages (fr, es, sr) are automatically loaded when requested
- **Dynamic Language Switching**: Change languages on the fly without recreating the table
- **Smart Component Updates**: Filter dropdowns and all UI components update with new translations
- **Fallback System**: Missing translations automatically fall back to English
- **Parameter Substitution**: Support for dynamic values in translations
- **Number & Date Formatting**: Locale-aware formatting using `Intl` APIs
- **Plugin Compatible**: Plugin developers can easily add their own translations
- **No Dependencies**: Zero external dependencies for localization

### Supported Languages

Out of the box, TablixJS includes:

- **English (en)** - Default fallback language
- **French (fr)** - Complete translation pack
- **Spanish (es)** - Complete translation pack  
- **Serbian (sr)** - Complete translation pack

Additional languages can be added by providing translation objects. Common languages are automatically loaded when needed.

## Quick Start

### Basic Usage (English Default)

```javascript
// Create a table with default English
const table = new Tablix('#myTable', {
    data: myData,
    columns: myColumns
});

// Access translations
console.log(table.t('pagination.next')); // "Next"
```

### Initialize with a Different Language

```javascript
import { frenchTranslations } from './src/locales/fr.js';

const table = new Tablix('#myTable', {
    data: myData,
    columns: myColumns,
    language: 'fr',
    translations: {
        fr: frenchTranslations
    }
});

console.log(table.t('pagination.next')); // "Suivant"
```

### Dynamic Language Switching

```javascript
// Start with English
const table = new Tablix('#myTable', {
    data: myData,
    columns: myColumns,
    language: 'en'
});

// Switch to French (auto-loads if not present)
table.setLanguage('fr');
// Table automatically re-renders with French text, including filter dropdowns

// Switch to Serbian (auto-loads translations)
table.setLanguage('sr');

// Add custom translations and switch
table.addTranslations('de', germanTranslations);
table.setLanguage('de');
```

### Auto-loading Languages

TablixJS automatically loads common language packs when you switch to them:

```javascript
// These languages are automatically loaded when requested
table.setLanguage('fr'); // Auto-loads French translations
table.setLanguage('es'); // Auto-loads Spanish translations  
table.setLanguage('sr'); // Auto-loads Serbian translations

// For other languages, add translations first
table.addTranslations('de', germanTranslations);
table.setLanguage('de');
```

## API Reference

### Table Methods

#### `t(key, params = {})`

Get a localized string by translation key.

**Parameters:**
- `key` (string): Translation key (e.g., 'pagination.next')
- `params` (object): Optional parameters for substitution

**Returns:** Localized string

**Example:**
```javascript
table.t('pagination.showingRecords', {
    startRow: 1,
    endRow: 10,
    totalRows: 100
}); // "Showing 1-10 of 100 records"
```

#### `setLanguage(language)`

Set the current language and re-render the table.

**Parameters:**
- `language` (string): Language code (e.g., 'fr', 'es')

**Example:**
```javascript
table.setLanguage('fr');
```

#### `addLanguagePack(language, translations, setAsCurrent = false)`

Add a complete language pack with convenience options.

**Parameters:**
- `language` (string): Language code
- `translations` (object): Complete translation key-value pairs
- `setAsCurrent` (boolean): Whether to immediately set this as the current language

**Example:**
```javascript
// Add German and immediately switch to it
table.addLanguagePack('de', germanTranslations, true);

// Or add without switching
table.addLanguagePack('it', italianTranslations);
table.setLanguage('it'); // Switch later
```

#### `addTranslations(language, translations)`

Add translations for a specific language.

**Parameters:**
- `language` (string): Language code
- `translations` (object): Translation key-value pairs

**Example:**
```javascript
table.addTranslations('de', {
    'pagination.next': 'Nächste',
    'pagination.previous': 'Vorherige'
});
```

#### `getCurrentLanguage()`

Get the current language code.

**Returns:** Current language string

#### `getAvailableLanguages()`

Get array of available language codes.

**Returns:** Array of language strings

#### `hasLanguage(language)`

Check if a language is available.

**Parameters:**
- `language` (string): Language code to check

**Returns:** Boolean

#### `formatNumber(number, options = {})`

Format a number using the current locale.

**Parameters:**
- `number` (number): Number to format
- `options` (object): Intl.NumberFormat options

**Example:**
```javascript
table.formatNumber(1234.56, { style: 'currency', currency: 'EUR' });
// "€1,234.56" in English, "1 234,56 €" in French
```

#### `formatDate(date, options = {})`

Format a date using the current locale.

**Parameters:**
- `date` (Date|string|number): Date to format
- `options` (object): Intl.DateTimeFormat options

**Example:**
```javascript
table.formatDate(new Date(), { dateStyle: 'medium' });
// "Jan 15, 2024" in English, "15 janv. 2024" in French
```

## Language Packs

### Built-in Language Packs

TablixJS comes with complete language packs for:

```javascript
import { englishTranslations } from './src/locales/en.js';
import { frenchTranslations } from './src/locales/fr.js';
import { spanishTranslations } from './src/locales/es.js';
import { serbianTranslations } from './src/locales/sr.js';
```

### Auto-Loading Support

TablixJS automatically loads these language packs when you call `setLanguage()`:
- **French (fr)** - Auto-loaded on demand
- **Spanish (es)** - Auto-loaded on demand  
- **Serbian (sr)** - Auto-loaded on demand

No need to manually import or add these translations - just use `table.setLanguage('fr')` and they'll be loaded automatically.

### Translation Keys Structure

All translation keys follow a hierarchical structure:

```javascript
{
    // General terms
    'general.loading': 'Loading...',
    'general.error': 'Error',
    'general.noData': 'No data available',
    
    // Search functionality
    'search.placeholder': 'Search...',
    'search.clear': 'Clear search',
    
    // Pagination
    'pagination.first': 'First',
    'pagination.previous': 'Previous',
    'pagination.next': 'Next',
    'pagination.last': 'Last',
    'pagination.showingRecords': 'Showing {startRow}-{endRow} of {totalRows} records',
    
    // Sorting
    'sort.sortAscending': 'Sort ascending',
    'sort.sortDescending': 'Sort descending',
    'sort.sortedAscending': 'Sorted ascending',
    'sort.sortedDescending': 'Sorted descending',
    'sort.notSorted': 'Not sorted',
    
    // Selection
    'selection.selectRow': 'Select row',
    'selection.selectAll': 'Select all',
    'selection.selectedCount': '{count} selected',
    
    // Filtering
    'filter.filter': 'Filter',
    'filter.clearFilter': 'Clear filter',
    'filter.filterColumn': 'Filter column',
    'filter.filterByValue': 'Filter by Value', 
    'filter.filterByCondition': 'Filter by Condition',
    'filter.searchValues': 'Search values...',
    'filter.selectAll': 'Select All',
    'filter.noValuesAvailable': 'No values available',
    'filter.addCondition': 'Add Condition',
    'filter.removeCondition': 'Remove condition',
    'filter.value': 'Value',
    'filter.apply': 'Apply',
    'filter.clear': 'Clear', 
    'filter.cancel': 'Cancel',
    'filter.contains': 'Contains',
    'filter.equals': 'Equals',
    
    // Controls
    'controls.refresh': 'Refresh data',
    'controls.export': 'Export data',
    
    // Error messages
    'error.loadingData': 'Failed to load data',
    'error.networkError': 'Network error occurred',
    
    // Accessibility
    'accessibility.table': 'Data table',
    'accessibility.sortableColumn': 'Sortable column'
}
```

### Creating Custom Language Packs

#### Method 1: Using addLanguagePack() (Recommended)

```javascript
const germanTranslations = {
    'general.loading': 'Laden...',
    'general.error': 'Fehler',
    'general.noData': 'Keine Daten verfügbar',
    'search.placeholder': 'Suchen...',
    'pagination.next': 'Nächste',
    'pagination.previous': 'Vorherige',
    'pagination.showingRecords': 'Zeige {startRow}-{endRow} von {totalRows} Datensätzen',
    'filter.filter': 'Filter',
    'filter.apply': 'Anwenden',
    'filter.clear': 'Löschen',
    'filter.cancel': 'Abbrechen',
    // ... add more translations as needed
};

// Add and immediately switch to German
table.addLanguagePack('de', germanTranslations, true);
```

#### Method 2: Using addTranslations()

```javascript
table.addTranslations('de', germanTranslations);
table.setLanguage('de');
```

#### Method 3: Auto-loading (for supported languages)

```javascript
// Just switch - translations auto-load if available
table.setLanguage('fr'); // French auto-loads
table.setLanguage('es'); // Spanish auto-loads
table.setLanguage('sr'); // Serbian auto-loads
```

## Custom Translations

### Application-Specific Translations

You can override or extend translations for your specific use case:

```javascript
const customerTranslations = {
    'general.noData': 'No customers found',
    'search.placeholder': 'Search customers...',
    'pagination.showingRecords': 'Displaying {startRow}-{endRow} of {totalRows} customers'
};

const table = new Tablix('#myTable', {
    data: customerData,
    columns: customerColumns,
    language: 'en-custom',
    translations: {
        'en-custom': customerTranslations
    }
});
```

### Parameter Substitution

Translations support parameter substitution using `{paramName}` syntax:

```javascript
// Translation with parameters
'welcome.message': 'Welcome back, {username}! You have {count} new messages.'

// Usage
table.t('welcome.message', { 
    username: 'John',
    count: 5 
}); // "Welcome back, John! You have 5 new messages."
```

## Plugin Development

### Adding Plugin Translations

Plugin developers can easily add their own translations:

```javascript
class ExportPlugin {
    constructor(table) {
        this.table = table;
        this.addTranslations();
    }
    
    addTranslations() {
        // Add English translations
        this.table.addTranslations('en', {
            'export.csv': 'Export as CSV',
            'export.excel': 'Export as Excel',
            'export.success': 'Export completed successfully'
        });
        
        // Add French translations
        this.table.addTranslations('fr', {
            'export.csv': 'Exporter en CSV',
            'export.excel': 'Exporter en Excel',
            'export.success': 'Export terminé avec succès'
        });
    }
    
    createExportButton() {
        const button = document.createElement('button');
        button.textContent = this.table.t('export.csv');
        return button;
    }
}
```

### Best Practices for Plugins

1. **Namespace your keys**: Use a prefix like `pluginName.keyName`
2. **Add translations for all supported languages**
3. **Provide English fallbacks**: Always include English translations
4. **Use descriptive keys**: Make keys self-explanatory

```javascript
// Good plugin translation structure
{
    'myPlugin.title': 'My Plugin',
    'myPlugin.button.save': 'Save Data',
    'myPlugin.message.success': 'Operation completed successfully',
    'myPlugin.error.validation': 'Please check your input'
}
```

## Advanced Usage

### Component Translation Updates

TablixJS automatically updates all UI components when the language changes, including:

- **Filter dropdowns**: All filter UI text updates immediately
- **Pagination controls**: Page numbers and navigation text  
- **Sort indicators**: Tooltips and accessibility labels
- **Search placeholders**: Input field placeholder text
- **Error messages**: All user-facing error text

```javascript
// When switching languages, everything updates automatically
table.setLanguage('fr');
// Filter dropdown now shows "Filtrer", "Appliquer", "Effacer", etc.

table.setLanguage('sr'); 
// Filter dropdown now shows "Filter", "Primeni", "Obriši", etc.
```

### Smart Language Detection

TablixJS can intelligently handle language switching with graceful fallbacks:

```javascript
// Try to load a language - auto-loads if available, falls back gracefully
function switchToUserLanguage(userLang) {
    if (table.hasLanguage(userLang)) {
        table.setLanguage(userLang);
    } else {
        // Try auto-loading common languages
        table.setLanguage(userLang); // Will auto-load fr/es/sr if requested
        
        // Check if it loaded successfully
        if (!table.hasLanguage(userLang)) {
            console.warn(`Language ${userLang} not available, staying with current language`);
        }
    }
}
```

### Conditional Translations

```javascript
class StatusRenderer {
    static getStatusText(table, status) {
        const statusKeys = {
            active: 'status.active',
            inactive: 'status.inactive',
            pending: 'status.pending'
        };
        
        return table.t(statusKeys[status] || 'status.unknown');
    }
}
```

### Context-Aware Translations

```javascript
class TimeBasedGreeting {
    static getGreeting(table) {
        const hour = new Date().getHours();
        
        if (hour < 12) return table.t('greeting.morning');
        if (hour < 18) return table.t('greeting.afternoon');
        return table.t('greeting.evening');
    }
}
```

### Rich Text Translations

```javascript
const richTranslations = {
    'help.tip': 'Use <kbd>Ctrl+F</kbd> to search or <strong>click</strong> the search box',
    'error.withLink': 'Error occurred. <a href="/contact">Contact support</a>.'
};
```

### Pluralization

```javascript
function getSelectionText(table, count) {
    if (count === 0) return table.t('selection.none');
    if (count === 1) return table.t('selection.single');
    return table.t('selection.multiple', { count });
}
```

## Best Practices

### For Application Developers

1. **Always provide translations**: Include translations for all languages you support
2. **Use meaningful keys**: Make translation keys descriptive and hierarchical
3. **Test fallbacks**: Ensure your app works when translations are missing
4. **Consider context**: Some words have different meanings in different contexts
5. **Use parameters wisely**: Prefer parameters over string concatenation

```javascript
// Good
'message.itemsSelected': '{count} item(s) selected'

// Avoid
'message.itemsSelected': ' item(s) selected' // Requires concatenation
```

### For Plugin Developers

1. **Namespace your keys**: Prevent conflicts with other plugins
2. **Document your keys**: Provide a list of translation keys for users
3. **Support all table languages**: Add translations for languages the table supports
4. **Use table.t() consistently**: Always use the table's translation method

### Performance Considerations

1. **Cache formatted values**: Don't re-format the same values repeatedly
2. **Lazy load translations**: Only load translations when needed
3. **Avoid frequent re-renders**: Batch language changes when possible

### Accessibility

The localization system supports accessibility by providing proper ARIA labels and screen reader friendly text:

```javascript
// Accessible sort indicators
'sort.sortedAscending': 'Sorted ascending',
'accessibility.sortableColumn': 'Sortable column',
'accessibility.table': 'Data table'
```

## Integration Examples

### React Integration

```javascript
import React, { useState, useEffect } from 'react';
import Tablix from 'tablixjs';

function DataTable({ language = 'en' }) {
    const [table, setTable] = useState(null);
    
    useEffect(() => {
        const tableInstance = new Tablix('#table', {
            data: myData,
            columns: myColumns,
            language: language
        });
        
        setTable(tableInstance);
        return () => tableInstance.destroy();
    }, []);
    
    useEffect(() => {
        if (table) {
            // Auto-loads translations for fr/es/sr, updates all components
            table.setLanguage(language);
        }
    }, [table, language]);
    
    const handleLanguageChange = (newLang) => {
        // Filter dropdowns and all UI automatically update
        table.setLanguage(newLang);
    };
    
    return (
        <div>
            <select onChange={(e) => handleLanguageChange(e.target.value)}>
                <option value="en">English</option>
                <option value="fr">Français</option>
                <option value="es">Español</option>
                <option value="sr">Српски</option>
            </select>
            <div id="table" />
        </div>
    );
}
```

### Vue.js Integration

```javascript
<template>
    <div>
        <select v-model="currentLanguage" @change="updateLanguage">
            <option value="en">English</option>
            <option value="fr">Français</option>
            <option value="es">Español</option>
            <option value="sr">Српски</option>
        </select>
        <div ref="tableContainer"></div>
    </div>
</template>

<script>
import Tablix from 'tablixjs';

export default {
    data() {
        return {
            currentLanguage: 'en',
            table: null
        };
    },
    
    mounted() {
        this.table = new Tablix(this.$refs.tableContainer, {
            data: this.myData,
            columns: this.myColumns,
            language: this.currentLanguage
        });
    },
    
    methods: {
        updateLanguage() {
            if (this.table) {
                // Automatically handles filter dropdown translations
                this.table.setLanguage(this.currentLanguage);
            }
        }
    },
    
    watch: {
        currentLanguage: 'updateLanguage'
    },
    
    beforeUnmount() {
        if (this.table) {
            this.table.destroy();
        }
    }
};
</script>
```

## Troubleshooting

### Common Issues

**Translation not showing:**
- Check if the language is set correctly using `table.getCurrentLanguage()`
- For fr/es/sr, just use `table.setLanguage()` - they auto-load
- For other languages, add translations first with `table.addLanguagePack()` 
- Verify the translation key exists in the language pack

**Filter dropdowns still in English:**
- Ensure you're using `table.setLanguage()` not just setting a config option
- The filter dropdowns update automatically when language changes
- Check if the language pack includes filter translation keys

**Auto-loading not working:**
- Auto-loading only works for French (fr), Spanish (es), and Serbian (sr)
- Other languages must be added manually with `addTranslations()` or `addLanguagePack()`
- Check browser console for auto-loading messages

**Fallback not working:**
- Ensure English translations are present (they're included by default)
- Check if the fallback language is set correctly

**Plugin translations not appearing:**
- Add plugin translations before using them
- Ensure plugins add translations for the current language
- Use the new `addLanguagePack()` method for easier plugin translation management

### Debugging

Enable translation debugging and test the new features:

```javascript
// Check available languages (should include auto-loaded ones)
console.log(table.getAvailableLanguages()); // ['en', 'fr', 'es', 'sr']

// Check current language
console.log(table.getCurrentLanguage());

// Test auto-loading
table.setLanguage('sr'); // Should auto-load Serbian
console.log(table.hasLanguage('sr')); // Should be true

// Test translation with filter keys
console.log(table.t('filter.apply')); // Should show localized "Apply" button text
console.log(table.t('filter.filterByValue')); // Should show "Filter by Value"

// Test the new convenience method
table.addLanguagePack('de', germanTranslations);
console.log(table.hasLanguage('de')); // Should be true

// Check if language exists
console.log(table.hasLanguage('fr')); // Should be true (auto-loaded)
```

### Performance Tips

1. **Use auto-loading**: Let TablixJS auto-load fr/es/sr instead of manually importing
2. **Use addLanguagePack()**: More efficient than multiple `addTranslations()` calls
3. **Batch language operations**: Avoid rapid `setLanguage()` calls
4. **Component updates are automatic**: Filter dropdowns, pagination, etc. update automatically

This comprehensive localization system makes TablixJS truly international, providing seamless multilingual support while maintaining excellent developer experience and performance.
