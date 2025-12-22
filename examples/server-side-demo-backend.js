/**
 * TablixJS Server-Side Demo - Sample Backend
 * 
 * This is a simple Express.js server that demonstrates the expected
 * backend API contract for TablixJS server-side mode.
 * 
 * ENDPOINT: http://localhost:3002/api/getTable
 * METHOD: POST
 * 
 * This file is for reference only - your actual backend may be
 * implemented in any language/framework as long as it follows
 * the API contract documented below.
 */

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Sample data generator
function generateSampleData(count = 100) {
    const categories = ['Alpha', 'Beta', 'Gamma', 'Delta'];
    const data = [];
    
    for (let i = 1; i <= count; i++) {
        data.push({
            id: i,
            test_id: `ID-${i.toString().padStart(3, '0')}`,
            test_name: `Item ${String.fromCharCode(65 + (i % 26))}${i}`,
            test_category: categories[i % 4],
            test_value: Math.floor(Math.random() * 1000),
            test_date: new Date(2024, 0, 1 + (i % 30)).toISOString().split('T')[0]
        });
    }
    
    return data;
}

// In-memory data store
const allData = generateSampleData(100);

/**
 * Main endpoint for server-side table data
 * 
 * Request Body Format:
 * {
 *   page: number,           // Current page (1-based)
 *   pageSize: number,       // Items per page
 *   sort: {                 // Sort configuration
 *     column?: string,      // Column to sort by
 *     direction?: 'asc' | 'desc'
 *   },
 *   filters: {              // Active filters
 *     [columnName: string]: {
 *       type: 'value' | 'condition',
 *       values?: string[],   // For value filters
 *       operator?: string,   // For condition filters
 *       value?: any          // For condition filters
 *     }
 *   },
 *   search: string         // Global search term
 * }
 * 
 * Response Format:
 * {
 *   data: Array,           // Page data
 *   totalRows: number      // Total count (for pagination)
 * }
 */
app.post('/api/getTable', (req, res) => {
    console.log('📊 Received table data request:', JSON.stringify(req.body, null, 2));
    
    try {
        const {
            page = 1,
            pageSize = 10,
            sort = {},
            filters = {},
            search = ''
        } = req.body;
        
        // Start with all data
        let filteredData = [...allData];
        
        // Apply search filter
        if (search && search.trim() !== '') {
            const searchTerm = search.toLowerCase();
            filteredData = filteredData.filter(item => {
                return Object.values(item).some(value => 
                    String(value).toLowerCase().includes(searchTerm)
                );
            });
            console.log(`🔍 Search applied: "${search}" -> ${filteredData.length} results`);
        }
        
        // Apply column filters
        if (filters && Object.keys(filters).length > 0) {
            Object.entries(filters).forEach(([columnName, filterConfig]) => {
                if (filterConfig.type === 'value' && filterConfig.values && filterConfig.values.length > 0) {
                    filteredData = filteredData.filter(item => {
                        const itemValue = String(item[columnName]);
                        return filterConfig.values.includes(itemValue);
                    });
                    console.log(`🎯 Filter applied on ${columnName}: ${filterConfig.values.join(', ')} -> ${filteredData.length} results`);
                }
                
                if (filterConfig.type === 'condition') {
                    // Handle condition filters (>, <, =, etc.)
                    const { operator, value } = filterConfig;
                    filteredData = filteredData.filter(item => {
                        const itemValue = item[columnName];
                        switch (operator) {
                            case 'equals':
                                return itemValue == value;
                            case 'notEquals':
                                return itemValue != value;
                            case 'contains':
                                return String(itemValue).toLowerCase().includes(String(value).toLowerCase());
                            case 'startsWith':
                                return String(itemValue).toLowerCase().startsWith(String(value).toLowerCase());
                            case 'endsWith':
                                return String(itemValue).toLowerCase().endsWith(String(value).toLowerCase());
                            case 'greaterThan':
                                return Number(itemValue) > Number(value);
                            case 'lessThan':
                                return Number(itemValue) < Number(value);
                            case 'greaterThanOrEqual':
                                return Number(itemValue) >= Number(value);
                            case 'lessThanOrEqual':
                                return Number(itemValue) <= Number(value);
                            default:
                                return true;
                        }
                    });
                    console.log(`🎯 Condition filter applied on ${columnName}: ${operator} ${value} -> ${filteredData.length} results`);
                }
            });
        }
        
        // Apply sorting
        if (sort && sort.column) {
            const { column, direction = 'asc' } = sort;
            filteredData.sort((a, b) => {
                const aVal = a[column];
                const bVal = b[column];
                
                // Handle different data types
                let comparison;
                if (typeof aVal === 'number' && typeof bVal === 'number') {
                    comparison = aVal - bVal;
                } else {
                    const aStr = String(aVal).toLowerCase();
                    const bStr = String(bVal).toLowerCase();
                    comparison = aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
                }
                
                return direction === 'desc' ? -comparison : comparison;
            });
            console.log(`↕️ Sort applied: ${column} ${direction}`);
        }
        
        // Calculate pagination
        const totalRows = filteredData.length;
        const totalPages = Math.ceil(totalRows / pageSize);
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        
        // Get page data
        const pageData = filteredData.slice(startIndex, endIndex);
        
        console.log(`📄 Returning page ${page}/${totalPages} (${pageData.length} items of ${totalRows} total)`);
        
        // Send response
        res.json({
            data: pageData,
            totalRows: totalRows,
            // Optional metadata (not required by TablixJS, but can be useful)
            meta: {
                page,
                pageSize,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });
        
    } catch (error) {
        console.error('❌ Error processing request:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
    console.log('');
    console.log('🚀 TablixJS Demo Backend Server Started');
    console.log('========================================');
    console.log(`📍 Server running on: http://localhost:${PORT}`);
    console.log(`📊 Table endpoint: http://localhost:${PORT}/api/getTable`);
    console.log(`💚 Health check: http://localhost:${PORT}/health`);
    console.log('📝 Sample data: 100 records generated');
    console.log('');
    console.log('Ready to accept requests from TablixJS demo!');
    console.log('Open: examples/server-side-demo.html');
    console.log('');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down server...');
    process.exit(0);
});

module.exports = app;
