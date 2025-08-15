/**
 * Simple Plugin Test - A minimal example to verify the plugin system works
 */

import Table from '../src/core/Table.js';
import { DraggableColumns, InlineEdit, ExportCSV } from '../src/plugins/index.js';

// Sample data for testing
const testData = [
    { id: 1, name: 'Alice Johnson', email: 'alice@test.com', status: 'Active', department: 'Engineering' },
    { id: 2, name: 'Bob Smith', email: 'bob@test.com', status: 'Inactive', department: 'Marketing' },
    { id: 3, name: 'Carol Davis', email: 'carol@test.com', status: 'Active', department: 'Sales' },
    { id: 4, name: 'David Wilson', email: 'david@test.com', status: 'Pending', department: 'HR' }
];

const columns = [
    { name: 'id', title: 'ID', width: '60px' },
    { name: 'name', title: 'Name', width: '150px' },
    { name: 'email', title: 'Email', width: '200px' },
    { name: 'status', title: 'Status', width: '100px' },
    { name: 'department', title: 'Department', width: '120px' }
];

console.log('🚀 Starting TablixJS Plugin Architecture Test');

// Create table instance
const table = new Table('#testContainer', {
    data: testData,
    columns: columns,
    pagination: { enabled: true, pageSize: 10 }
});

console.log('✅ Table instance created');

// Test plugin installation
try {
    // Install DraggableColumns plugin
    table.use(DraggableColumns, {
        axis: 'x',
        animate: true,
        ghost: true
    });
    console.log('✅ DraggableColumns plugin installed');

    // Install InlineEdit plugin
    table.use(InlineEdit, {
        editableColumns: ['name', 'email', 'status'],
        trigger: 'doubleclick',
        saveOnBlur: true,
        validators: {
            email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
        },
        inputTypes: {
            status: 'select'
        },
        selectOptions: {
            status: ['Active', 'Inactive', 'Pending']
        }
    });
    console.log('✅ InlineEdit plugin installed');

    // Install ExportCSV plugin
    table.use(ExportCSV, {
        filename: 'test-export.csv',
        includeHeaders: true,
        addTimestamp: true
    });
    console.log('✅ ExportCSV plugin installed');

    // Test plugin queries
    console.log('📊 Plugin Status:');
    console.log('- Has DraggableColumns:', table.hasPlugin('DraggableColumns'));
    console.log('- Has InlineEdit:', table.hasPlugin('InlineEdit'));
    console.log('- Has ExportCSV:', table.hasPlugin('ExportCSV'));
    console.log('- Total plugins:', table.getPlugins().length);

    // Test plugin manager stats
    const stats = table.pluginManager.getStats();
    console.log('📈 Plugin Manager Stats:', stats);

    // Add event listeners for testing
    table.on('pluginInstalled', (data) => {
        console.log('🔌 Plugin installed:', data.name);
    });

    table.on('columnDragStart', (data) => {
        console.log('🎯 Column drag started:', data.column);
    });

    table.on('editStart', (data) => {
        console.log('✏️ Edit started:', data.field);
    });

    table.on('csvExportComplete', (data) => {
        console.log('📁 CSV export completed:', data.filename);
    });

    // Test custom plugin creation
    const TestPlugin = {
        name: 'TestPlugin',
        defaultOptions: {
            message: 'Hello from TestPlugin!'
        },
        install(table, options) {
            console.log('🎉 TestPlugin installing with options:', options);
            
            // Add custom method to table
            table.testMethod = () => {
                console.log('📢 Custom method called:', options.message);
                return options.message;
            };
            
            // Listen to events
            table.on('afterRender', () => {
                console.log('👀 TestPlugin saw table render');
            });
        },
        uninstall(table) {
            console.log('🗑️ TestPlugin uninstalling');
            delete table.testMethod;
        }
    };

    // Install custom plugin
    table.use(TestPlugin, { message: 'Custom message from test!' });
    console.log('✅ Custom TestPlugin installed');

    // Test custom method
    const result = table.testMethod();
    console.log('🎯 Custom method result:', result);

    // Render table
    table.render();
    console.log('🎨 Table rendered successfully');

    // Test plugin uninstall
    console.log('🧪 Testing plugin uninstall...');
    const uninstallResult = table.unuse('TestPlugin');
    console.log('- Uninstall result:', uninstallResult);
    console.log('- TestPlugin still installed:', table.hasPlugin('TestPlugin'));
    console.log('- Custom method still exists:', typeof table.testMethod);

    console.log('🎉 All plugin tests completed successfully!');

} catch (error) {
    console.error('❌ Plugin test failed:', error);
}

export { table, testData, columns };
