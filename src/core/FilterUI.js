/**
 * FilterUI - User interface components for TablixJS filtering
 * Handles dropdown creation, event binding, and filter interactions
 */
export default class FilterUI {
  constructor(filterManager) {
    this.filterManager = filterManager;
    this.table = filterManager.table;
    
    // Track open dropdowns
    this.activeDropdown = null;
    
    // Bind methods to preserve context
    this.handleDocumentClick = this.handleDocumentClick.bind(this);
    this.handleFilterIconClick = this.handleFilterIconClick.bind(this);
    
    // Initialize event listeners
    this.init();
  }

  /**
   * Initialize the FilterUI
   */
  init() {
    // Add document click listener to close dropdowns
    document.addEventListener('click', this.handleDocumentClick);
  }

  /**
   * Destroy FilterUI and clean up event listeners
   */
  destroy() {
    document.removeEventListener('click', this.handleDocumentClick);
    this.closeAllDropdowns();
  }

  /**
   * Render filter icons in table headers
   */
  renderFilterIcons() {
    const headers = this.table.container.querySelectorAll('.tablix-th');
    
    headers.forEach(header => {
      const columnName = header.dataset.column;
      if (!columnName) return;
      
      // Skip if filter icon already exists
      if (header.querySelector('.tablix-filter-indicator')) return;
      
      const thContent = header.querySelector('.tablix-th-content');
      if (!thContent) return;
      
      // Create filter indicator
      const filterIndicator = document.createElement('span');
      filterIndicator.className = 'tablix-filter-indicator';
      filterIndicator.innerHTML = `
        <span class="tablix-filter-icon" title="Filter column">⚪</span>
      `;
      
      // Add click handler
      filterIndicator.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleFilterIconClick(columnName, filterIndicator);
      });
      
      // Insert after sort indicator or at end
      const sortIndicator = thContent.querySelector('.tablix-sort-indicator');
      if (sortIndicator) {
        thContent.insertBefore(filterIndicator, sortIndicator.nextSibling);
      } else {
        thContent.appendChild(filterIndicator);
      }
    });
  }

  /**
   * Handle filter icon click
   * @param {string} columnName - Column name
   * @param {Element} filterIndicator - Filter indicator element
   */
  handleFilterIconClick(columnName, filterIndicator) {
    // Close any existing dropdown
    this.closeAllDropdowns();
    
    // Create and show dropdown
    const dropdown = this.createFilterDropdown(columnName);
    this.showDropdown(dropdown, filterIndicator);
    this.activeDropdown = { dropdown, columnName };
  }

  /**
   * Handle document clicks to close dropdowns
   * @param {Event} event - Click event
   */
  handleDocumentClick(event) {
    if (this.activeDropdown) {
      const dropdown = this.activeDropdown.dropdown;
      if (!dropdown.contains(event.target)) {
        this.closeAllDropdowns();
      }
    }
  }

  /**
   * Create filter dropdown for a column
   * @param {string} columnName - Column name
   * @returns {Element} Dropdown element
   */
  createFilterDropdown(columnName) {
    const dropdown = document.createElement('div');
    dropdown.className = 'tablix-filter-dropdown';
    dropdown.innerHTML = this.renderDropdownContent(columnName);
    
    // Add event listeners
    this.bindDropdownEvents(dropdown, columnName);
    
    return dropdown;
  }

  /**
   * Render dropdown content
   * @param {string} columnName - Column name
   * @returns {string} HTML content
   */
  renderDropdownContent(columnName) {
    const currentFilter = this.filterManager.getColumnFilter(columnName);
    
    return `
      <div class="tablix-filter-dropdown-header">
        <h4>Filter: ${columnName}</h4>
        <button class="tablix-filter-close" type="button">×</button>
      </div>
      
      <div class="tablix-filter-tabs">
        <button class="tablix-filter-tab ${!currentFilter || currentFilter.type === 'value' ? 'active' : ''}" 
                data-tab="value">Filter by Value</button>
        <button class="tablix-filter-tab ${currentFilter && currentFilter.type === 'condition' ? 'active' : ''}" 
                data-tab="condition">Filter by Condition</button>
      </div>
      
      <div class="tablix-filter-content">
        <div class="tablix-filter-panel tablix-filter-value-panel ${!currentFilter || currentFilter.type === 'value' ? 'active' : ''}">
          ${this.renderValueFilterPanel(columnName, currentFilter)}
        </div>
        
        <div class="tablix-filter-panel tablix-filter-condition-panel ${currentFilter && currentFilter.type === 'condition' ? 'active' : ''}">
          ${this.renderConditionFilterPanel(columnName, currentFilter)}
        </div>
      </div>
      
      <div class="tablix-filter-actions">
        <button class="tablix-filter-apply" type="button">Apply</button>
        <button class="tablix-filter-clear" type="button">Clear</button>
        <button class="tablix-filter-cancel" type="button">Cancel</button>
      </div>
    `;
  }

  /**
   * Render value filter panel (checkbox list)
   * @param {string} columnName - Column name
   * @param {Object|null} currentFilter - Current filter state
   * @returns {string} HTML content
   */
  renderValueFilterPanel(columnName, currentFilter) {
    const uniqueValues = this.filterManager.getColumnUniqueValues(columnName);
    const selectedValues = currentFilter && currentFilter.type === 'value' ? 
      currentFilter.config.values : [];
    
    if (uniqueValues.length === 0) {
      return '<p class="tablix-filter-empty">No values available</p>';
    }
    
    let html = `
      <div class="tablix-filter-search">
        <input type="text" 
               id="tablix-filter-search-${columnName}" 
               name="filter-search-${columnName}"
               placeholder="Search values..." 
               class="tablix-filter-search-input">
      </div>
      <div class="tablix-filter-select-all">
        <label>
          <input type="checkbox" 
                 id="tablix-filter-select-all-${columnName}" 
                 name="filter-select-all-${columnName}"
                 class="tablix-filter-select-all-checkbox"> Select All
        </label>
      </div>
      <div class="tablix-filter-values">
    `;
    
    uniqueValues.forEach((value, index) => {
      const isChecked = selectedValues.includes(value);
      const valueId = `tablix-filter-value-${columnName}-${index}`;
      html += `
        <label class="tablix-filter-value-item">
          <input type="checkbox" 
                 id="${valueId}" 
                 name="filter-value-${columnName}" 
                 value="${this.escapeHtml(value)}" 
                 ${isChecked ? 'checked' : ''}>
          <span class="tablix-filter-value-text">${this.escapeHtml(value)}</span>
        </label>
      `;
    });
    
    html += '</div>';
    return html;
  }

  /**
   * Render condition filter panel
   * @param {string} columnName - Column name
   * @param {Object|null} currentFilter - Current filter state
   * @returns {string} HTML content
   */
  renderConditionFilterPanel(columnName, currentFilter) {
    const conditions = currentFilter && currentFilter.type === 'condition' ? 
      currentFilter.config.conditions : [{ operator: 'none', value: '' }];
    
    let html = '<div class="tablix-filter-conditions">';
    
    conditions.forEach((condition, index) => {
      html += this.renderConditionRow(condition, index);
    });
    
    html += `
      </div>
      <button class="tablix-filter-add-condition" type="button">+ Add Condition</button>
    `;
    
    return html;
  }

  /**
   * Render a single condition row
   * @param {Object} condition - Condition object
   * @param {number} index - Condition index
   * @returns {string} HTML content
   */
  renderConditionRow(condition, index) {
    const operators = this.filterManager.getOperators();
    const needsValue = condition.operator && 
      !['none', 'isEmpty', 'isNotEmpty'].includes(condition.operator);
    
    let html = `
      <div class="tablix-filter-condition" data-index="${index}">
        <select class="tablix-filter-operator" 
                id="tablix-filter-operator-${index}" 
                name="filter-operator-${index}">
    `;
    
    Object.entries(operators).forEach(([key, op]) => {
      const selected = condition.operator === key ? ' selected' : '';
      html += `<option value="${key}"${selected}>${op.label}</option>`;
    });
    
    html += `
        </select>
        <input type="text" 
               id="tablix-filter-value-${index}" 
               name="filter-value-${index}"
               class="tablix-filter-value" 
               placeholder="Value" 
               value="${this.escapeHtml(condition.value || '')}"
               ${needsValue ? '' : 'disabled'}>
        <button class="tablix-filter-remove-condition" 
                type="button" 
                data-index="${index}"
                title="Remove condition">×</button>
      </div>
    `;
    
    return html;
  }

  /**
   * Bind dropdown event listeners
   * @param {Element} dropdown - Dropdown element
   * @param {string} columnName - Column name
   */
  bindDropdownEvents(dropdown, columnName) {
    // Tab switching
    dropdown.querySelectorAll('.tablix-filter-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const tabType = e.target.dataset.tab;
        this.switchTab(dropdown, tabType);
      });
    });

    // Close button
    dropdown.querySelector('.tablix-filter-close').addEventListener('click', () => {
      this.closeAllDropdowns();
    });

    // Action buttons
    dropdown.querySelector('.tablix-filter-apply').addEventListener('click', () => {
      this.applyFilter(dropdown, columnName);
    });

    dropdown.querySelector('.tablix-filter-clear').addEventListener('click', () => {
      this.clearFilter(columnName);
    });

    dropdown.querySelector('.tablix-filter-cancel').addEventListener('click', () => {
      this.closeAllDropdowns();
    });

    // Value filter events
    this.bindValueFilterEvents(dropdown, columnName);
    
    // Condition filter events
    this.bindConditionFilterEvents(dropdown, columnName);
  }

  /**
   * Bind value filter events
   * @param {Element} dropdown - Dropdown element
   * @param {string} columnName - Column name
   */
  bindValueFilterEvents(dropdown, columnName) {
    const valuePanel = dropdown.querySelector('.tablix-filter-value-panel');
    if (!valuePanel) return;

    // Search input with debouncing
    const searchInput = valuePanel.querySelector('.tablix-filter-search-input');
    if (searchInput) {
      let searchTimeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          this.filterValueList(valuePanel, e.target.value);
        }, this.filterManager.options.debounceDelay || 150);
      });
    }

    // Select all checkbox
    const selectAllCheckbox = valuePanel.querySelector('.tablix-filter-select-all-checkbox');
    if (selectAllCheckbox) {
      selectAllCheckbox.addEventListener('change', (e) => {
        this.toggleSelectAll(valuePanel, e.target.checked);
      });
    }

    // Individual value checkboxes
    valuePanel.querySelectorAll('.tablix-filter-value-item input[type="checkbox"]').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        this.updateSelectAllState(valuePanel);
      });
    });

    // Update select all state based on current selections
    this.updateSelectAllState(valuePanel);
  }

  /**
   * Bind condition filter events
   * @param {Element} dropdown - Dropdown element
   * @param {string} columnName - Column name
   */
  bindConditionFilterEvents(dropdown, columnName) {
    const conditionPanel = dropdown.querySelector('.tablix-filter-condition-panel');
    if (!conditionPanel) return;

    // Add condition button
    const addButton = conditionPanel.querySelector('.tablix-filter-add-condition');
    if (addButton) {
      addButton.addEventListener('click', () => {
        this.addCondition(conditionPanel);
      });
    }

    // Operator and value changes
    this.bindConditionRowEvents(conditionPanel);
  }

  /**
   * Bind events for condition rows
   * @param {Element} conditionPanel - Condition panel element
   */
  bindConditionRowEvents(conditionPanel) {
    // Operator changes
    conditionPanel.querySelectorAll('.tablix-filter-operator').forEach(select => {
      select.addEventListener('change', (e) => {
        const valueInput = e.target.parentElement.querySelector('.tablix-filter-value');
        const needsValue = !['none', 'isEmpty', 'isNotEmpty'].includes(e.target.value);
        valueInput.disabled = !needsValue;
        if (!needsValue) valueInput.value = '';
      });
    });

    // Remove condition buttons
    conditionPanel.querySelectorAll('.tablix-filter-remove-condition').forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent dropdown from closing
        
        const conditionRow = e.target.closest('.tablix-filter-condition');
        const conditionsContainer = conditionPanel.querySelector('.tablix-filter-conditions');
        
        if (conditionsContainer.querySelectorAll('.tablix-filter-condition').length > 1) {
          conditionRow.remove();
        } else {
          // If it's the last condition, reset it to "none" instead of removing
          const operatorSelect = conditionRow.querySelector('.tablix-filter-operator');
          const valueInput = conditionRow.querySelector('.tablix-filter-value');
          operatorSelect.value = 'none';
          valueInput.value = '';
          valueInput.disabled = true;
        }
      });
    });
  }

  /**
   * Switch between filter tabs
   * @param {Element} dropdown - Dropdown element
   * @param {string} tabType - Tab type ('value' or 'condition')
   */
  switchTab(dropdown, tabType) {
    // Update tab buttons
    dropdown.querySelectorAll('.tablix-filter-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabType);
    });

    // Update panels
    dropdown.querySelectorAll('.tablix-filter-panel').forEach(panel => {
      const isActive = panel.classList.contains(`tablix-filter-${tabType}-panel`);
      panel.classList.toggle('active', isActive);
    });
  }

  /**
   * Filter value list based on search
   * @param {Element} valuePanel - Value panel element
   * @param {string} searchTerm - Search term
   */
  filterValueList(valuePanel, searchTerm) {
    const items = valuePanel.querySelectorAll('.tablix-filter-value-item');
    const term = searchTerm.toLowerCase();
    
    items.forEach(item => {
      const text = item.querySelector('.tablix-filter-value-text').textContent.toLowerCase();
      const matches = text.includes(term);
      item.style.display = matches ? '' : 'none';
    });
  }

  /**
   * Toggle select all checkboxes
   * @param {Element} valuePanel - Value panel element
   * @param {boolean} checked - Whether to check all
   */
  toggleSelectAll(valuePanel, checked) {
    const checkboxes = valuePanel.querySelectorAll('.tablix-filter-value-item input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
      const item = checkbox.closest('.tablix-filter-value-item');
      if (item.style.display !== 'none') {
        checkbox.checked = checked;
      }
    });
  }

  /**
   * Update select all checkbox state
   * @param {Element} valuePanel - Value panel element
   */
  updateSelectAllState(valuePanel) {
    const selectAllCheckbox = valuePanel.querySelector('.tablix-filter-select-all-checkbox');
    if (!selectAllCheckbox) return;

    const checkboxes = valuePanel.querySelectorAll('.tablix-filter-value-item input[type="checkbox"]');
    const visibleCheckboxes = Array.from(checkboxes).filter(cb => 
      cb.closest('.tablix-filter-value-item').style.display !== 'none'
    );
    
    const checkedCount = visibleCheckboxes.filter(cb => cb.checked).length;
    
    selectAllCheckbox.checked = checkedCount > 0 && checkedCount === visibleCheckboxes.length;
    selectAllCheckbox.indeterminate = checkedCount > 0 && checkedCount < visibleCheckboxes.length;
  }

  /**
   * Add a new condition row
   * @param {Element} conditionPanel - Condition panel element
   */
  addCondition(conditionPanel) {
    const conditionsContainer = conditionPanel.querySelector('.tablix-filter-conditions');
    const newIndex = conditionsContainer.children.length;
    
    const conditionHtml = this.renderConditionRow({ operator: 'none', value: '' }, newIndex);
    conditionsContainer.insertAdjacentHTML('beforeend', conditionHtml);
    
    // Bind events for the new condition only
    const newCondition = conditionsContainer.lastElementChild;
    
    // Bind operator change event
    const operatorSelect = newCondition.querySelector('.tablix-filter-operator');
    operatorSelect.addEventListener('change', (e) => {
      const valueInput = e.target.parentElement.querySelector('.tablix-filter-value');
      const needsValue = !['none', 'isEmpty', 'isNotEmpty'].includes(e.target.value);
      valueInput.disabled = !needsValue;
      if (!needsValue) valueInput.value = '';
    });

    // Bind remove button event
    const removeButton = newCondition.querySelector('.tablix-filter-remove-condition');
    removeButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation(); // Prevent dropdown from closing
      
      const conditionRow = e.target.closest('.tablix-filter-condition');
      const conditionsContainer = conditionPanel.querySelector('.tablix-filter-conditions');
      
      if (conditionsContainer.querySelectorAll('.tablix-filter-condition').length > 1) {
        conditionRow.remove();
      } else {
        // If it's the last condition, reset it to "none" instead of removing
        const operatorSelect = conditionRow.querySelector('.tablix-filter-operator');
        const valueInput = conditionRow.querySelector('.tablix-filter-value');
        operatorSelect.value = 'none';
        valueInput.value = '';
        valueInput.disabled = true;
      }
    });
  }

  /**
   * Apply current filter settings
   * @param {Element} dropdown - Dropdown element
   * @param {string} columnName - Column name
   */
  async applyFilter(dropdown, columnName) {
    const activeTab = dropdown.querySelector('.tablix-filter-tab.active').dataset.tab;
    let filterConfig;

    if (activeTab === 'value') {
      filterConfig = this.collectValueFilter(dropdown);
    } else {
      filterConfig = this.collectConditionFilter(dropdown);
    }

    await this.filterManager.applyFilter(columnName, filterConfig);
    this.closeAllDropdowns();
  }

  /**
   * Collect value filter configuration
   * @param {Element} dropdown - Dropdown element
   * @returns {Object} Filter configuration
   */
  collectValueFilter(dropdown) {
    const valuePanel = dropdown.querySelector('.tablix-filter-value-panel');
    const checkboxes = valuePanel.querySelectorAll('.tablix-filter-value-item input[type="checkbox"]:checked');
    const values = Array.from(checkboxes).map(cb => cb.value);
    
    return {
      type: 'value',
      values: values
    };
  }

  /**
   * Collect condition filter configuration
   * @param {Element} dropdown - Dropdown element
   * @returns {Object} Filter configuration
   */
  collectConditionFilter(dropdown) {
    const conditionPanel = dropdown.querySelector('.tablix-filter-condition-panel');
    const conditionRows = conditionPanel.querySelectorAll('.tablix-filter-condition');
    
    const conditions = Array.from(conditionRows).map(row => {
      const operator = row.querySelector('.tablix-filter-operator').value;
      const value = row.querySelector('.tablix-filter-value').value;
      
      return { operator, value };
    }).filter(cond => cond.operator !== 'none');
    
    return {
      type: 'condition',
      conditions: conditions
    };
  }

  /**
   * Clear filter for column
   * @param {string} columnName - Column name
   */
  async clearFilter(columnName) {
    await this.filterManager.clearFilter(columnName);
    this.closeAllDropdowns();
  }

  /**
   * Show dropdown positioned relative to trigger element
   * @param {Element} dropdown - Dropdown element
   * @param {Element} trigger - Trigger element
   */
  showDropdown(dropdown, trigger) {
    document.body.appendChild(dropdown);
    
    // Position dropdown
    const triggerRect = trigger.getBoundingClientRect();
    const dropdownRect = dropdown.getBoundingClientRect();
    
    let left = triggerRect.left;
    let top = triggerRect.bottom + 5;
    
    // Adjust if dropdown goes off screen
    if (left + dropdownRect.width > window.innerWidth) {
      left = window.innerWidth - dropdownRect.width - 10;
    }
    
    if (top + dropdownRect.height > window.innerHeight) {
      top = triggerRect.top - dropdownRect.height - 5;
    }
    
    dropdown.style.left = `${Math.max(10, left)}px`;
    dropdown.style.top = `${Math.max(10, top)}px`;
    dropdown.style.display = 'block';
  }

  /**
   * Close all open dropdowns
   */
  closeAllDropdowns() {
    if (this.activeDropdown) {
      this.activeDropdown.dropdown.remove();
      this.activeDropdown = null;
    }
  }

  /**
   * Escape HTML to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
