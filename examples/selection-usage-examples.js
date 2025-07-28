/**
 * TablixJS Selection Usage Examples
 * 
 * This file contains practical examples of how to use the selection functionality
 * in TablixJS tables. Copy and adapt these examples for your use cases.
 */

// Example 1: Basic Single Selection
const singleSelectionTable = new Table('#singleTable', {
  data: employees,
  columns: [
    { name: 'id', title: 'ID' },
    { name: 'name', title: 'Name' },
    { name: 'department', title: 'Department' }
  ],
  selection: {
    enabled: true,
    mode: 'single',
    dataIdKey: 'id'
  }
});

// Example 2: Multi-Selection with Event Handling
const multiSelectionTable = new Table('#multiTable', {
  data: employees,
  columns: [
    { name: 'id', title: 'ID' },
    { name: 'name', title: 'Name' },
    { name: 'salary', title: 'Salary', renderer: (value) => `$${value.toLocaleString()}` }
  ],
  selection: {
    enabled: true,
    mode: 'multi',
    dataIdKey: 'id'
  },
  pagination: {
    enabled: true,
    pageSize: 10
  }
});

// Listen for selection changes
multiSelectionTable.eventManager.on('afterSelect', (event) => {
  const selectedCount = event.selectedRows.length;
  const totalSalary = event.selectedData.reduce((sum, emp) => sum + emp.salary, 0);
  
  console.log(`${selectedCount} employees selected`);
  console.log(`Total salary: $${totalSalary.toLocaleString()}`);
  
  // Update toolbar or action buttons based on selection
  updateActionButtons(selectedCount);
});

// Example 3: Programmatic Selection Control
function selectHighEarners() {
  const highEarnerIds = employees
    .filter(emp => emp.salary > 80000)
    .map(emp => emp.id.toString());
  
  multiSelectionTable.selectRows(highEarnerIds);
}

function selectByDepartment(department) {
  const departmentIds = employees
    .filter(emp => emp.department === department)
    .map(emp => emp.id.toString());
  
  multiSelectionTable.selectRows(departmentIds);
}

function exportSelected() {
  const selectedData = multiSelectionTable.getSelectedData();
  
  if (selectedData.length === 0) {
    alert('No rows selected for export');
    return;
  }
  
  // Convert to CSV
  const headers = ['ID', 'Name', 'Department', 'Salary'];
  const csvContent = [
    headers.join(','),
    ...selectedData.map(row => [
      row.id,
      `"${row.name}"`,
      `"${row.department}"`,
      row.salary
    ].join(','))
  ].join('\n');
  
  // Download CSV
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'selected-employees.csv';
  a.click();
  window.URL.revokeObjectURL(url);
}

// Example 4: Selection with Validation
const validatedTable = new Table('#validatedTable', {
  data: employees,
  columns: [
    { name: 'id', title: 'ID' },
    { name: 'name', title: 'Name' },
    { name: 'status', title: 'Status' }
  ],
  selection: {
    enabled: true,
    mode: 'multi',
    dataIdKey: 'id'
  }
});

// Prevent selection of inactive employees
validatedTable.eventManager.on('beforeSelect', (event) => {
  if (event.rowData.status === 'Inactive') {
    alert('Cannot select inactive employees');
    throw new Error('Selection prevented');
  }
});

// Example 5: Dynamic Selection Mode Switching
let currentMode = 'single';

function toggleSelectionMode() {
  currentMode = currentMode === 'single' ? 'multi' : 'single';
  multiSelectionTable.setSelectionMode(currentMode);
  
  // Clear selection when switching modes
  multiSelectionTable.clearSelection();
  
  // Update UI to reflect current mode
  document.getElementById('modeIndicator').textContent = 
    `Current mode: ${currentMode}`;
}

// Example 6: Selection with Custom Styling
function applyCustomSelectionStyle() {
  const style = document.createElement('style');
  style.textContent = `
    .custom-selection .tablix-row.tablix-selected {
      background-color: #fff3e0;
      border-left: 4px solid #ff9800;
    }
    
    .custom-selection .tablix-row.tablix-last-selected {
      background-color: #ff9800;
      color: white;
      font-weight: bold;
    }
  `;
  document.head.appendChild(style);
  
  // Apply custom class to table container
  document.getElementById('multiTable').classList.add('custom-selection');
}

// Example 7: Bulk Actions on Selected Rows
function updateActionButtons(selectedCount) {
  const deleteBtn = document.getElementById('deleteSelected');
  const editBtn = document.getElementById('editSelected');
  const exportBtn = document.getElementById('exportSelected');
  
  if (selectedCount === 0) {
    deleteBtn.disabled = true;
    editBtn.disabled = true;
    exportBtn.disabled = true;
  } else if (selectedCount === 1) {
    deleteBtn.disabled = false;
    editBtn.disabled = false;
    exportBtn.disabled = false;
  } else {
    deleteBtn.disabled = false;
    editBtn.disabled = true; // Can't edit multiple
    exportBtn.disabled = false;
  }
}

function deleteSelected() {
  const selectedIds = multiSelectionTable.getSelectedIds();
  
  if (selectedIds.length === 0) return;
  
  const confirmMessage = `Delete ${selectedIds.length} selected employee(s)?`;
  if (!confirm(confirmMessage)) return;
  
  // Remove from data array
  const updatedData = employees.filter(emp => 
    !selectedIds.includes(emp.id.toString())
  );
  
  // Update table with new data
  multiSelectionTable.loadData(updatedData);
  
  console.log(`Deleted ${selectedIds.length} employees`);
}

// Example 8: Keyboard Shortcuts for Selection
document.addEventListener('keydown', (e) => {
  // Only handle shortcuts when table is focused
  if (!document.querySelector('.tablix-table:focus-within')) return;
  
  switch (e.key) {
    case 'a':
      if (e.ctrlKey) {
        e.preventDefault();
        // Select all visible rows
        const allIds = multiSelectionTable.dataManager.getData()
          .map(row => multiSelectionTable.selectionManager.getRowId(row));
        multiSelectionTable.selectRows(allIds);
      }
      break;
      
    case 'Escape':
      e.preventDefault();
      multiSelectionTable.clearSelection();
      break;
      
    case 'Delete':
      if (multiSelectionTable.getSelectionCount() > 0) {
        deleteSelected();
      }
      break;
  }
});

// Example 9: Selection State Persistence
function saveSelectionState() {
  const selectedIds = multiSelectionTable.getSelectedIds();
  localStorage.setItem('tablixSelection', JSON.stringify(selectedIds));
}

function restoreSelectionState() {
  const savedSelection = localStorage.getItem('tablixSelection');
  if (savedSelection) {
    const selectedIds = JSON.parse(savedSelection);
    multiSelectionTable.selectRows(selectedIds);
  }
}

// Save selection state before page unload
window.addEventListener('beforeunload', saveSelectionState);

// Restore selection state after table initialization
multiSelectionTable.eventManager.on('afterLoad', restoreSelectionState);

// Example 10: Selection with Server-Side Data
const serverTable = new Table('#serverTable', {
  columns: [
    { name: 'id', title: 'ID' },
    { name: 'name', title: 'Name' },
    { name: 'email', title: 'Email' }
  ],
  pagination: {
    mode: 'server',
    pageSize: 20,
    serverDataLoader: async ({ page, pageSize }) => {
      const response = await fetch(`/api/users?page=${page}&size=${pageSize}`);
      const data = await response.json();
      return {
        data: data.users,
        totalRows: data.total
      };
    }
  },
  selection: {
    enabled: true,
    mode: 'multi',
    dataIdKey: 'id'
  }
});

// With server-side data, selection is automatically maintained
// across page changes using stable row IDs
serverTable.eventManager.on('afterSelect', (event) => {
  // Send selection to server for processing
  const selectedIds = event.selectedRows;
  
  // Optional: sync selection with server
  if (selectedIds.length > 0) {
    fetch('/api/users/selection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ selectedIds })
    });
  }
});
