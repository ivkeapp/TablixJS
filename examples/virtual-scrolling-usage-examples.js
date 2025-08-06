// Virtual Scrolling Usage Examples for TablixJS

// Example 1: Basic Virtual Scrolling with Large Dataset
function createBasicVirtualTable() {
    // Generate 50,000 sample records
    const data = [];
    for (let i = 0; i < 50000; i++) {
        data.push({
            id: i + 1,
            name: `User ${i + 1}`,
            email: `user${i + 1}@example.com`,
            value: Math.floor(Math.random() * 1000),
            status: ['active', 'inactive', 'pending'][Math.floor(Math.random() * 3)]
        });
    }

    const table = new Table('#basic-virtual-table', {
        virtualScroll: {
            enabled: true,
            buffer: 10,
            containerHeight: 400
        },
        pagination: { enabled: false }, // Disable pagination for virtual scrolling
        sorting: { enabled: true },
        search: { enabled: true },
        columns: [
            { name: 'id', title: 'ID' },
            { name: 'name', title: 'Name' },
            { name: 'email', title: 'Email' },
            { name: 'value', title: 'Value' },
            { name: 'status', title: 'Status' }
        ]
    });

    table.loadData(data);
    return table;
}

// Example 2: Advanced Virtual Table with Custom Renderers
function createAdvancedVirtualTable() {
    // Generate 100,000 complex records
    const departments = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance'];
    const data = [];
    
    for (let i = 0; i < 100000; i++) {
        data.push({
            id: i + 1,
            name: `Employee ${i + 1}`,
            email: `emp${i + 1}@company.com`,
            department: departments[Math.floor(Math.random() * departments.length)],
            salary: Math.floor(Math.random() * 150000) + 30000,
            avatar: `https://picsum.photos/32/32?random=${i}`,
            performance: Math.floor(Math.random() * 100) + 1,
            joinDate: new Date(Date.now() - Math.random() * 5 * 365 * 24 * 60 * 60 * 1000)
        });
    }

    const table = new Table('#advanced-virtual-table', {
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
            { name: 'id', title: 'ID', width: '80px' },
            {
                name: 'employee',
                title: 'Employee',
                renderer: (value, row) => `
                    <div style="display: flex; align-items: center;">
                        <img src="${row.avatar}" alt="${row.name}" 
                             style="width: 32px; height: 32px; border-radius: 50%; margin-right: 8px;">
                        <div>
                            <strong>${row.name}</strong><br>
                            <small style="color: #666;">${row.email}</small>
                        </div>
                    </div>
                `
            },
            { name: 'department', title: 'Department' },
            {
                name: 'salary',
                title: 'Salary',
                renderer: (value) => `$${value.toLocaleString()}`
            },
            {
                name: 'performance',
                title: 'Performance',
                renderer: (value) => {
                    const color = value >= 80 ? '#28a745' : value >= 60 ? '#ffc107' : '#dc3545';
                    return `<div style="color: ${color}; font-weight: bold;">${value}%</div>`;
                }
            },
            {
                name: 'joinDate',
                title: 'Join Date',
                renderer: (value) => new Date(value).toLocaleDateString()
            },
            {
                name: 'actions',
                title: 'Actions',
                renderer: (value, row) => `
                    <div style="display: flex; gap: 4px;">
                        <button onclick="viewEmployee(${row.id})" 
                                style="padding: 2px 6px; font-size: 0.8rem;">View</button>
                        <button onclick="editEmployee(${row.id})" 
                                style="padding: 2px 6px; font-size: 0.8rem;">Edit</button>
                    </div>
                `
            }
        ]
    });

    table.loadData(data);
    return table;
}

// Example 3: Virtual Table with Performance Monitoring
function createMonitoredVirtualTable() {
    console.log('🚀 Creating monitored virtual table...');
    const startTime = performance.now();
    
    // Generate data
    const data = [];
    for (let i = 0; i < 200000; i++) {
        data.push({
            id: i + 1,
            title: `Item ${i + 1}`,
            description: `This is item number ${i + 1} with some additional content`,
            category: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)],
            value: Math.random() * 1000,
            timestamp: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000)
        });
    }
    
    const dataGenerationTime = performance.now() - startTime;
    console.log(`📊 Data generation took: ${dataGenerationTime.toFixed(2)}ms`);

    const table = new Table('#monitored-virtual-table', {
        virtualScroll: {
            enabled: true,
            buffer: 20,
            containerHeight: 600
        },
        pagination: { enabled: false },
        debug: true, // Enable debug logging
        columns: [
            { name: 'id', title: 'ID' },
            { name: 'title', title: 'Title' },
            { name: 'description', title: 'Description' },
            { name: 'category', title: 'Category' },
            {
                name: 'value',
                title: 'Value',
                renderer: (value) => value.toFixed(2)
            },
            {
                name: 'timestamp',
                title: 'Date',
                renderer: (value) => new Date(value).toLocaleDateString()
            }
        ]
    });

    const tableStartTime = performance.now();
    table.loadData(data);
    const tableCreationTime = performance.now() - tableStartTime;
    console.log(`🏁 Table creation took: ${tableCreationTime.toFixed(2)}ms`);

    // Monitor performance
    setInterval(() => {
        if (table.virtualScrollManager && table.virtualScrollManager.isEnabled()) {
            const stats = table.virtualScrollManager.getPerformanceStats();
            if (stats) {
                console.log('📈 Performance Stats:', {
                    avgRenderTime: stats.averageRenderTime + 'ms',
                    maxRenderTime: stats.maxRenderTime + 'ms',
                    scrollUpdates: stats.scrollUpdates,
                    totalRows: stats.totalRows.toLocaleString(),
                    renderedRows: stats.renderedRows
                });
            }
        }
    }, 5000); // Log every 5 seconds

    return table;
}

// Example 4: Virtual Table with Dynamic Data Updates
function createDynamicVirtualTable() {
    let table;
    let data = [];
    
    function generateData(count) {
        const newData = [];
        for (let i = 0; i < count; i++) {
            newData.push({
                id: i + 1,
                name: `Dynamic Item ${i + 1}`,
                value: Math.random() * 100,
                timestamp: new Date(),
                status: Math.random() > 0.5 ? 'active' : 'inactive'
            });
        }
        return newData;
    }
    
    function updateTableSize(newSize) {
        console.log(`📊 Updating table to ${newSize.toLocaleString()} rows`);
        data = generateData(newSize);
        table.loadData(data);
    }
    
    // Create initial table
    data = generateData(10000);
    table = new Table('#dynamic-virtual-table', {
        virtualScroll: {
            enabled: true,
            buffer: 12,
            containerHeight: 450
        },
        pagination: { enabled: false },
        sorting: { enabled: true },
        columns: [
            { name: 'id', title: 'ID' },
            { name: 'name', title: 'Name' },
            {
                name: 'value',
                title: 'Value',
                renderer: (value) => value.toFixed(2)
            },
            {
                name: 'timestamp',
                title: 'Created',
                renderer: (value) => value.toLocaleTimeString()
            },
            {
                name: 'status',
                title: 'Status',
                renderer: (value) => `<span class="status-${value}">${value}</span>`
            }
        ]
    });
    
    table.loadData(data);
    
    // Expose controls
    window.updateTableSize = updateTableSize;
    window.scrollToRow = (rowIndex) => {
        table.virtualScrollManager.scrollToRow(rowIndex - 1);
    };
    window.toggleVirtualScroll = () => {
        const enabled = table.virtualScrollManager.isEnabled();
        table.virtualScrollManager.setEnabled(!enabled);
        console.log(`Virtual scrolling ${!enabled ? 'enabled' : 'disabled'}`);
    };
    
    return table;
}

// Example 5: Virtual Table with Custom Styling and Interactions
function createStyledVirtualTable() {
    // Custom styling data
    const data = [];
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57'];
    const priorities = ['low', 'medium', 'high', 'urgent'];
    
    for (let i = 0; i < 75000; i++) {
        data.push({
            id: i + 1,
            task: `Task ${i + 1}`,
            priority: priorities[Math.floor(Math.random() * priorities.length)],
            assignee: `User ${Math.floor(Math.random() * 100) + 1}`,
            progress: Math.floor(Math.random() * 101),
            dueDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
            color: colors[Math.floor(Math.random() * colors.length)]
        });
    }

    const table = new Table('#styled-virtual-table', {
        virtualScroll: {
            enabled: true,
            buffer: 18,
            containerHeight: 550
        },
        pagination: { enabled: false },
        selection: { enabled: true, mode: 'multi' },
        columns: [
            {
                name: 'task',
                title: 'Task',
                renderer: (value, row) => `
                    <div style="display: flex; align-items: center;">
                        <div style="width: 4px; height: 20px; background: ${row.color}; margin-right: 8px; border-radius: 2px;"></div>
                        <strong>${value}</strong>
                    </div>
                `
            },
            {
                name: 'priority',
                title: 'Priority',
                renderer: (value) => {
                    const colors = {
                        low: '#28a745',
                        medium: '#ffc107',
                        high: '#fd7e14',
                        urgent: '#dc3545'
                    };
                    return `<span style="background: ${colors[value]}; color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.8rem; text-transform: uppercase;">${value}</span>`;
                }
            },
            { name: 'assignee', title: 'Assignee' },
            {
                name: 'progress',
                title: 'Progress',
                renderer: (value) => `
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="width: 60px; height: 6px; background: #e9ecef; border-radius: 3px; overflow: hidden;">
                            <div style="width: ${value}%; height: 100%; background: #007bff; transition: width 0.3s;"></div>
                        </div>
                        <span style="font-size: 0.8rem; color: #666;">${value}%</span>
                    </div>
                `
            },
            {
                name: 'dueDate',
                title: 'Due Date',
                renderer: (value) => {
                    const isOverdue = new Date(value) < new Date();
                    const color = isOverdue ? '#dc3545' : '#666';
                    return `<span style="color: ${color};">${new Date(value).toLocaleDateString()}</span>`;
                }
            }
        ]
    });

    table.loadData(data);
    return table;
}

// Utility functions for examples
function viewEmployee(id) {
    alert(`Viewing employee ${id}`);
}

function editEmployee(id) {
    alert(`Editing employee ${id}`);
}

function viewUser(id) {
    alert(`Viewing user ${id}`);
}

// Export for use in HTML
if (typeof window !== 'undefined') {
    window.VirtualScrollExamples = {
        createBasicVirtualTable,
        createAdvancedVirtualTable,
        createMonitoredVirtualTable,
        createDynamicVirtualTable,
        createStyledVirtualTable,
        viewEmployee,
        editEmployee,
        viewUser
    };
}
