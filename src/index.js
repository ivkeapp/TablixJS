import Table from './core/Table.js';
import { resolveColumnValue, isFeatureEnabled, isComplexValue, getByPath } from './core/ValueResolver.js';

// Export main Table class as default
export default Table;

// Named exports for convenience
export { Table };

// ValueResolver utilities — available for advanced usage and plugin authors
export { resolveColumnValue, isFeatureEnabled, isComplexValue, getByPath };

// Version info
export const version = '0.1.0';
