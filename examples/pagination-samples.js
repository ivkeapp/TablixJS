// TablixJS Pagination - Code Samples
// This file contains practical examples of how to use the pagination system

// ==== BASIC CLIENT-SIDE PAGINATION ====

import Table from './src/core/Table.js';

// Simple table with client-side pagination
const basicTable = new Table('#basic-table', {
  data: [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
    // ... here goes rest of data
  ],
  columns: [
    { name: 'id', title: 'ID' },
    { name: 'name', title: 'Name' },
    { name: 'email', title: 'Email' }
  ],
  pagination: {
    pageSize: 10
  }
});

// ==== SERVER-SIDE PAGINATION WITH REAL API ====

// Example server data loader for REST API
async function loadFromRestAPI({ page, pageSize, filters, sorts }) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: pageSize.toString()
  });
  
  // Add filters to query params
  Object.entries(filters).forEach(([key, value]) => {
    params.append(`filter_${key}`, value);
  });
  
  // Add sorting to query params
  sorts.forEach((sort, index) => {
    params.append(`sort_${index}`, `${sort.column}:${sort.direction}`);
  });
  
  try {
    const response = await fetch(`/api/users?${params}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const result = await response.json();
    return {
      data: result.users,
      totalRows: result.total
    };
  } catch (error) {
    console.error('Failed to load data:', error);
    throw error;
  }
}

const serverTable = new Table('#server-table', {
  columns: [
    { name: 'id', title: 'ID' },
    { name: 'name', title: 'Full Name' },
    { name: 'email', title: 'Email Address' },
    { name: 'role', title: 'Role' }
  ],
  pagination: {
    mode: 'server',
    pageSize: 20,
    serverDataLoader: loadFromRestAPI,
    showPageSizes: true,
    pageSizeOptions: [10, 20, 50, 100]
  }
});

// ===== DYNAMIC PAGINATION CONTROL =====

class UserManager {
  constructor() {
    this.table = null;
    this.init();
  }
  
  init() {
    this.table = new Table('#user-table', {
      columns: [
        { name: 'id', title: 'ID' },
        { name: 'username', title: 'Username' },
        { name: 'email', title: 'Email' },
        { 
          name: 'actions', 
          title: 'Actions',
          renderer: (cell, row) => `
            <button onclick="userManager.editUser(${row.id})">Edit</button>
            <button onclick="userManager.deleteUser(${row.id})">Delete</button>
          `
        }
      ],
      pagination: {
        pageSize: 15,
        showPageSizes: true
      }
    });
    
    // Set up event listeners
    this.table.on('afterPageChange', (info) => {
      this.updateURLWithPage(info.newPage);
    });
    
    this.table.on('afterFilter', (criteria) => {
      this.updateURLWithFilter(criteria);
    });
  }
  
  async loadUsers() {
    try {
      const users = await this.fetchUsersFromAPI();
      await this.table.loadData(users);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  }
  
  async searchUsers(query) {
    if (query.trim()) {
      await this.table.filter({ username: query });
    } else {
      await this.table.clearFilters();
    }
  }
  
  async changeView(pageSize) {
    await this.table.changePageSize(parseInt(pageSize));
  }
  
  updateURLWithPage(page) {
    const url = new URL(window.location);
    url.searchParams.set('page', page);
    window.history.replaceState({}, '', url);
  }
  
  updateURLWithFilter(criteria) {
    const url = new URL(window.location);
    if (Object.keys(criteria).length > 0) {
      url.searchParams.set('search', Object.values(criteria)[0]);
    } else {
      url.searchParams.delete('search');
    }
    url.searchParams.delete('page'); // Reset to page 1 when filtering
    window.history.replaceState({}, '', url);
  }
  
  async fetchUsersFromAPI() {
    // Your API call here
    return [];
  }
  
  editUser(id) {
    // Edit user logic
  }
  
  deleteUser(id) {
    // Delete user logic
  }
}

// ===== PAGINATION WITH REAL-TIME UPDATES =====

class LiveDataTable {
  constructor() {
    this.table = new Table('#live-table', {
      columns: [
        { name: 'timestamp', title: 'Time', renderer: (cell) => new Date(cell).toLocaleString() },
        { name: 'event', title: 'Event' },
        { name: 'user', title: 'User' },
        { name: 'status', title: 'Status' }
      ],
      pagination: {
        pageSize: 25,
        showPageNumbers: true
      }
    });
    
    this.data = [];
    this.startLiveUpdates();
  }
  
  startLiveUpdates() {
    // Simulate real-time data updates
    setInterval(() => {
      this.addNewEvent({
        timestamp: Date.now(),
        event: 'User Action',
        user: `User ${Math.floor(Math.random() * 100)}`,
        status: Math.random() > 0.8 ? 'Error' : 'Success'
      });
    }, 5000);
  }
  
  async addNewEvent(event) {
    this.data.unshift(event); // Add to beginning
    
    // Keep only last 1000 events
    if (this.data.length > 1000) {
      this.data = this.data.slice(0, 1000);
    }
    
    // If user is on first page, auto-refresh to show new data
    const currentPage = this.table.getPaginationInfo().currentPage;
    if (currentPage === 1) {
      await this.table.loadData([...this.data]);
    }
  }
}

// ==== PAGINATION WITH LOCAL STORAGE STATE ====

class PersistentTable {
  constructor() {
    this.storageKey = 'table-state';
    this.initTable();
    this.loadState();
  }
  
  initTable() {
    this.table = new Table('#persistent-table', {
      data: [],
      columns: [
        { name: 'id', title: 'ID' },
        { name: 'name', title: 'Name' },
        { name: 'category', title: 'Category' }
      ],
      pagination: {
        pageSize: 10,
        showPageSizes: true,
        pageSizeOptions: [5, 10, 25, 50]
      }
    });
    
    // Save state on changes
    this.table.on('afterPageChange', () => this.saveState());
    this.table.on('afterPageSizeChange', () => this.saveState());
    this.table.on('afterFilter', () => this.saveState());
  }
  
  saveState() {
    const state = {
      page: this.table.getPaginationInfo().currentPage,
      pageSize: this.table.getPaginationInfo().pageSize,
      data: this.table.getOriginalData()
    };
    
    localStorage.setItem(this.storageKey, JSON.stringify(state));
  }
  
  async loadState() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (!saved) return;
      
      const state = JSON.parse(saved);
      
      // Restore data
      await this.table.loadData(state.data || []);
      
      // Restore page size
      if (state.pageSize) {
        await this.table.changePageSize(state.pageSize);
      }
      
      // Restore current page
      if (state.page) {
        await this.table.goToPage(state.page);
      }
    } catch (error) {
      console.error('Failed to load saved state:', error);
    }
  }
}

// ==== EXPORT FOR USE ====

export {
  basicTable,
  serverTable,
  UserManager,
  LiveDataTable,
  PersistentTable,
  loadFromRestAPI
};
