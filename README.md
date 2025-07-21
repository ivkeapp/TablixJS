# TablixJS
TablixJS is a lightweight, dependency‑free JavaScript library for building powerful, responsive data tables.

## MVP v0.1.0 - Implemented Features

The first MVP implements the basic library architecture with the following components:

### **Architecture**
- **Modular design** - Clear separation of concerns through core components
- **ES6 Modules** - Modern JavaScript architecture with import/export
- **Dependency-free** - No external dependencies

### **Core Components**
- **Table.js** - Main class that orchestrates all functionality
- **DataManager.js** - Data management (loading, filtering, pagination)
- **Renderer.js** - HTML table rendering to DOM
- **EventManager.js** - Event system for hooks (afterLoad, afterFilter)

### **Features**
- **Basic table display** - Rendering data into HTML table
- **Columns with custom renderers** - Ability to customize cell display
- **Data filtering** - Simple filtering by key
- **Event system** - Hooks for state tracking (afterLoad, afterFilter)
- **Configuration approach** - Options through options object

### 📁 **Project Structure**
```
src/
├── core/           # Core components
│   ├── Table.js           ✅ Implemented
│   ├── DataManager.js     ✅ Implemented  
│   ├── Renderer.js        ✅ Implemented
│   ├── EventManager.js    ✅ Implemented
│   ├── ColumnManager.js   📝 Placeholder
│   ├── PaginationManager.js 📝 Placeholder
│   ├── SelectionManager.js  📝 Placeholder
│   └── VirtualScroll.js     📝 Placeholder
├── jquery/         # jQuery wrapper (📝 Placeholder)
└── react/          # React components (📝 Placeholder)
```

### **Usage Example**
```javascript
import Table from './src/core/Table.js';

const table = new Table('#myTable', {
  data: [
    { id: 1, name: 'John' },
    { id: 2, name: 'Jane' }
  ],
  columns: [
    { name: 'id', title: 'ID' },
    { name: 'name', title: 'Name', renderer: (cell) => `<strong>${cell}</strong>` }
  ],
  pagination: { pageSize: 2 }
});

table.on('afterLoad', data => console.log('Loaded:', data));
table.filter({ name: 'John' });
```

### **Getting Started**
```bash
npm run dev  # Starts server on port 5174
```

Open `examples/vanilla.html` for a functional example.

---

*Next steps: Implementation of pagination, sorting, row selection, jQuery and React wrappers.*
