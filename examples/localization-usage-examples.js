/**
 * TablixJS Localization Usage Examples
 * This file demonstrates how to use the localization system
 */

import Table from '../src/core/Table.js';

// Note: French, Spanish, and Serbian translations are auto-loaded when needed
// Manual imports are only required for custom languages
// import { frenchTranslations } from '../src/locales/fr.js';
// import { spanishTranslations } from '../src/locales/es.js';
// import { serbianTranslations } from '../src/locales/sr.js';

// Example 1: Basic usage with default English
const basicTable = new Table('#basicTable', {
    data: sampleData,
    columns: sampleColumns,
    // No language specified - defaults to English
});

console.log(basicTable.t('pagination.next')); // "Next"
console.log(basicTable.t('search.placeholder')); // "Search..."

// Example 2: Initialize with French (auto-loaded)
const frenchTable = new Table('#frenchTable', {
    data: sampleData,
    columns: sampleColumns,
    language: 'fr'
    // No need to manually provide translations - French auto-loads
});

console.log(frenchTable.t('pagination.next')); // "Suivant"
console.log(frenchTable.t('search.placeholder')); // "Rechercher..."
console.log(frenchTable.t('filter.apply')); // "Appliquer"

// Example 3: Auto-loading and dynamic language switching
const multiLangTable = new Table('#multiLangTable', {
    data: sampleData,
    columns: sampleColumns,
    language: 'en'
});

// No need to manually add translations for supported languages - they auto-load!
// multiLangTable.addTranslations('fr', frenchTranslations); // Not needed
// multiLangTable.addTranslations('es', spanishTranslations); // Not needed

// Switch languages dynamically - translations auto-load
multiLangTable.setLanguage('fr'); // French auto-loads
console.log(multiLangTable.t('pagination.showingRecords', { 
    startRow: 1, 
    endRow: 10, 
    totalRows: 100 
})); // "Affichage de 1 à 10 sur 100 enregistrements"

multiLangTable.setLanguage('es'); // Spanish auto-loads
console.log(multiLangTable.t('pagination.showingRecords', {
    startRow: 1,
    endRow: 10,
    totalRows: 100
})); // "Mostrando 1 a 10 de 100 registros"

multiLangTable.setLanguage('sr'); // Serbian auto-loads
console.log(multiLangTable.t('pagination.showingRecords', {
    startRow: 1,
    endRow: 10,
    totalRows: 100
})); // "Prikazano 1-10 od 100 zapisa"

// Example 3a: Using addLanguagePack() for custom languages
const germanTranslations = {
    'general.loading': 'Laden...',
    'pagination.next': 'Nächste',
    'pagination.previous': 'Vorherige',
    'pagination.showingRecords': 'Zeige {startRow}-{endRow} von {totalRows} Datensätzen',
    'filter.apply': 'Anwenden',
    'filter.clear': 'Löschen',
    'filter.cancel': 'Abbrechen'
};

// Method 1: Add and immediately switch (recommended)
multiLangTable.addLanguagePack('de', germanTranslations, true);
console.log(multiLangTable.t('filter.apply')); // "Anwenden"

// Method 2: Add and switch later
multiLangTable.addLanguagePack('it', italianTranslations);
multiLangTable.setLanguage('it');

// Example 4: Custom translations for specific use case
const customTranslations = {
    'general.noData': 'No customers found',
    'search.placeholder': 'Search customers...',
    'pagination.showingRecords': 'Displaying {startRow}-{endRow} of {totalRows} customers',
    'selection.selectedCount': '{count} customer(s) selected'
};

const customTable = new Table('#customTable', {
    data: sampleData,
    columns: sampleColumns,
    language: 'en-custom',
    translations: {
        'en-custom': customTranslations
    }
});

// Example 5: Plugin development with addLanguagePack()
class ExportPlugin {
    constructor(table) {
        this.table = table;
        this.init();
    }
    
    init() {
        // Add translations for all supported languages using addLanguagePack
        const exportTranslations = {
            en: {
                'export.csv': 'Export as CSV',
                'export.excel': 'Export as Excel',
                'export.pdf': 'Export as PDF',
                'export.success': 'Export completed successfully',
                'export.error': 'Failed to export data'
            },
            fr: {
                'export.csv': 'Exporter en CSV',
                'export.excel': 'Exporter en Excel', 
                'export.pdf': 'Exporter en PDF',
                'export.success': 'Export terminé avec succès',
                'export.error': 'Échec de l\'export des données'
            },
            es: {
                'export.csv': 'Exportar como CSV',
                'export.excel': 'Exportar como Excel',
                'export.pdf': 'Exportar como PDF', 
                'export.success': 'Exportación completada exitosamente',
                'export.error': 'Error al exportar datos'
            },
            sr: {
                'export.csv': 'Izvezi kao CSV',
                'export.excel': 'Izvezi kao Excel',
                'export.pdf': 'Izvezi kao PDF',
                'export.success': 'Izvoz je uspešno završen',
                'export.error': 'Greška pri izvozu podataka'
            }
        };

        // Add translations for each supported language
        Object.entries(exportTranslations).forEach(([lang, translations]) => {
            this.table.addTranslations(lang, translations);
        });
    }
    
    createExportButton() {
        const button = document.createElement('button');
        button.textContent = this.table.t('export.csv');
        button.onclick = () => this.exportCSV();
        return button;
    }
    
    exportCSV() {
        try {
            // Export logic here
            console.log(this.table.t('export.success'));
        } catch (error) {
            console.error(this.table.t('export.error'));
        }
    }
}

// Example 6: Formatting numbers and dates with locale
const formattingTable = new Table('#formattingTable', {
    data: sampleData,
    columns: [
        {
            name: 'price',
            title: 'Price',
            formatter: (value) => formattingTable.formatNumber(value, { 
                style: 'currency', 
                currency: 'EUR' 
            })
        },
        {
            name: 'date',
            title: 'Date',
            formatter: (value) => formattingTable.formatDate(value, { 
                dateStyle: 'medium' 
            })
        }
    ],
    language: 'fr'
});

// Example 7: Fallback behavior demonstration
const fallbackTable = new Table('#fallbackTable', {
    data: sampleData,
    columns: sampleColumns,
    language: 'unknown-language'
});

// This will fallback to English
console.log(fallbackTable.t('pagination.next')); // "Next" (fallback)

// Missing key will return the key itself
console.log(fallbackTable.t('nonexistent.key')); // "nonexistent.key"

// Example 8: Filter dropdown translations (automatic component updates)
const filterTable = new Table('#filterTable', {
    data: sampleData,
    columns: sampleColumns,
    language: 'en',
    filtering: { enabled: true } // Enable filtering to see dropdown
});

// Test filter dropdown translations
console.log('Filter translations in English:');
console.log(filterTable.t('filter.filterByValue')); // "Filter by Value"
console.log(filterTable.t('filter.apply')); // "Apply"
console.log(filterTable.t('filter.clear')); // "Clear"
console.log(filterTable.t('filter.cancel')); // "Cancel"

// Switch to Serbian - filter dropdown automatically updates
filterTable.setLanguage('sr');
console.log('Filter translations in Serbian:');
console.log(filterTable.t('filter.filterByValue')); // "Filtriraj po vrednosti"
console.log(filterTable.t('filter.apply')); // "Primeni"
console.log(filterTable.t('filter.clear')); // "Obriši"
console.log(filterTable.t('filter.cancel')); // "Otkaži"

// Switch to French - all components update automatically
filterTable.setLanguage('fr');
console.log('Filter translations in French:');
console.log(filterTable.t('filter.filterByValue')); // "Filtrer par valeur"
console.log(filterTable.t('filter.apply')); // "Appliquer"

// Example 9: Pluralization helper usage
function showSelectionCount(table, count) {
    if (count === 1) {
        return table.t('selection.singleSelected');
    } else {
        return table.t('selection.multipleSelected', { count });
    }
}

// Example 10: Complete auto-loading language demonstration
const autoLoadDemo = new Table('#autoLoadDemo', {
    data: sampleData,
    columns: sampleColumns,
    language: 'en',
    filtering: { enabled: true },
    pagination: { enabled: true }
});

// Test all auto-loaded languages
const supportedLanguages = ['en', 'fr', 'es', 'sr'];
console.log('Testing all supported languages:');

supportedLanguages.forEach(lang => {
    autoLoadDemo.setLanguage(lang); // Auto-loads if needed
    console.log(`${lang.toUpperCase()}: ${autoLoadDemo.t('pagination.next')} | ${autoLoadDemo.t('filter.apply')}`);
});

// Example 11: Advanced localization patterns

// Pattern 1: Conditional translations based on data
class ConditionalTranslations {
    static getStatusTranslation(table, status) {
        const statusKeys = {
            active: 'status.active',
            inactive: 'status.inactive', 
            pending: 'status.pending'
        };
        
        return table.t(statusKeys[status] || 'status.unknown');
    }
}

// Pattern 2: Context-aware translations
class ContextTranslations {
    static getTimeBasedGreeting(table) {
        const hour = new Date().getHours();
        
        if (hour < 12) {
            return table.t('greeting.morning');
        } else if (hour < 18) {
            return table.t('greeting.afternoon');
        } else {
            return table.t('greeting.evening');
        }
    }
}

// Pattern 3: Rich text translations with HTML
const richTextTable = new Table('#richTextTable', {
    data: sampleData,
    columns: sampleColumns,
    language: 'en',
    translations: {
        en: {
            'help.searchTip': 'Use <kbd>Ctrl+F</kbd> to search or <strong>click</strong> the search box',
            'error.withLink': 'An error occurred. Please <a href="/contact">contact support</a>.'
        }
    }
});

// Example 12: Testing language availability and debugging
const debugTable = new Table('#debugTable', {
    data: sampleData,
    columns: sampleColumns
});

// Check available languages (should include auto-loaded ones after first use)
console.log('Available languages:', debugTable.getAvailableLanguages());

// Test auto-loading
debugTable.setLanguage('sr'); // Should auto-load Serbian
console.log('After setting Serbian:', debugTable.getAvailableLanguages());
console.log('Has Serbian?', debugTable.hasLanguage('sr')); // Should be true

// Check current language
console.log('Current language:', debugTable.getCurrentLanguage());

// Test custom language with addLanguagePack
const dutchTranslations = {
    'pagination.next': 'Volgende',
    'pagination.previous': 'Vorige',
    'filter.apply': 'Toepassen'
};

debugTable.addLanguagePack('nl', dutchTranslations, true);
console.log('Added Dutch:', debugTable.t('pagination.next')); // "Volgende"

// Sample data for examples
const sampleData = [
    { id: 1, name: 'John Doe', email: 'john@example.com', status: 'active', price: 99.99, date: '2023-01-15' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'inactive', price: 149.50, date: '2023-02-20' },
    { id: 3, name: 'Bob Wilson', email: 'bob@example.com', status: 'pending', price: 75.25, date: '2023-03-10' }
];

const sampleColumns = [
    { name: 'id', title: 'ID' },
    { name: 'name', title: 'Name' }, 
    { name: 'email', title: 'Email' },
    { name: 'status', title: 'Status' },
    { name: 'price', title: 'Price' },
    { name: 'date', title: 'Date' }
];

// Example Italian translations for demonstration
const italianTranslations = {
    'general.loading': 'Caricamento...',
    'pagination.next': 'Successivo',
    'pagination.previous': 'Precedente',
    'filter.apply': 'Applica',
    'filter.clear': 'Cancella',
    'filter.cancel': 'Annulla'
};

// Export for use in other files
export {
    basicTable,
    frenchTable,
    multiLangTable,
    customTable,
    formattingTable,
    filterTable,
    autoLoadDemo,
    debugTable,
    ExportPlugin,
    ConditionalTranslations,
    ContextTranslations,
    sampleData,
    sampleColumns,
    italianTranslations
};
