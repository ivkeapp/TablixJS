/**
 * ValueResolver - Centralized value resolution for non-primitive column data
 * 
 * Provides a clean abstraction layer between raw cell data and the features
 * that consume it (filtering, sorting, editing, display). Each feature can
 * resolve a purpose-specific primitive value from complex objects using
 * column-level configuration (accessor functions, dot-path strings, etc.).
 * 
 * Supported column options:
 *   - filterAccessor:  (value, row) => primitive   — custom filter value extractor
 *   - filterPath:      "prop.nested.key"           — dot-path shorthand for filterAccessor
 *   - sortAccessor:    (value, row) => primitive    — custom sort value extractor
 *   - sortPath:        "prop.nested.key"            — dot-path shorthand for sortAccessor
 *   - editAccessor:    (value, row) => primitive    — custom edit value extractor
 *   - editPath:        "prop.nested.key"            — dot-path shorthand for editAccessor
 *   - filterable:      false                        — disable filtering entirely
 *   - sortable:        false                        — disable sorting entirely
 *   - editable:        false                        — disable editing entirely
 */

/**
 * Check whether a value is a non-null, non-Date object (i.e. an object or array
 * that is NOT a primitive wrapper and NOT a Date).
 * 
 * @param {*} value 
 * @returns {boolean}
 */
export function isComplexValue(value) {
  return value !== null && value !== undefined &&
    typeof value === 'object' && !(value instanceof Date);
}

/**
 * Navigate into an object using a dot-separated path string.
 * Returns `undefined` for any invalid / unreachable segment.
 * 
 * Examples:
 *   getByPath({ a: { b: 2 } }, 'a.b')         => 2
 *   getByPath({ a: [10, 20] }, 'a.1')          => 20
 *   getByPath({ a: null }, 'a.b')              => undefined
 * 
 * @param {*} obj   - The root object to traverse
 * @param {string} path - Dot-separated property path
 * @returns {*} The resolved value, or undefined
 */
export function getByPath(obj, path) {
  if (obj == null || typeof path !== 'string' || path === '') {
    return undefined;
  }

  const segments = path.split('.');
  let current = obj;

  for (const segment of segments) {
    if (current == null || typeof current !== 'object') {
      return undefined;
    }
    current = current[segment];
  }

  return current;
}

/**
 * Resolve the value a feature should operate on for a given column + row.
 * 
 * Resolution order (per purpose):
 *   1. Purpose-specific accessor function   (e.g. `filterAccessor`)
 *   2. Purpose-specific dot-path string     (e.g. `filterPath`)
 *   3. Raw cell value — but ONLY if it is a primitive
 *   4. `undefined` if the raw value is complex and no accessor/path is configured
 * 
 * For the "display" purpose the raw value is always returned (the Renderer /
 * ColumnManager already handles display formatting via `renderer` / `format`).
 * 
 * @param {Object}  column  - Column definition object
 * @param {Object}  row     - Full data row
 * @param {'display'|'filter'|'sort'|'edit'} purpose
 * @returns {*} A primitive value suitable for the requested purpose, or undefined
 */
export function resolveColumnValue(column, row, purpose = 'display') {
  if (!column || !row) return undefined;

  const columnName = column.name || column.key;
  const rawValue = row[columnName];

  // "display" always returns the raw value — formatting is handled elsewhere
  if (purpose === 'display') {
    return rawValue;
  }

  // Map purpose → accessor / path property names
  const accessorKey = `${purpose}Accessor`;   // e.g. "filterAccessor"
  const pathKey     = `${purpose}Path`;        // e.g. "filterPath"

  // 1. Purpose-specific accessor function
  if (typeof column[accessorKey] === 'function') {
    try {
      return column[accessorKey](rawValue, row);
    } catch (err) {
      console.warn(`TablixJS: ${accessorKey} threw for column '${columnName}':`, err);
      return undefined;
    }
  }

  // 2. Purpose-specific dot-path
  if (typeof column[pathKey] === 'string') {
    return getByPath(rawValue, column[pathKey]);
  }

  // 3. If raw value is primitive — return as-is
  if (!isComplexValue(rawValue)) {
    return rawValue;
  }

  // 4. Complex value with no accessor/path — return undefined (feature should skip)
  return undefined;
}

/**
 * Check whether a specific feature is enabled for a column.
 * 
 * Rules:
 *  - If the column explicitly sets the flag (e.g. `filterable: false`) → honour it.
 *  - If the column has complex data but no accessor/path for the purpose,
 *    default to **disabled** (safe default).
 *  - Otherwise default to **enabled** (backward compat for primitive columns).
 * 
 * @param {Object}  column   - Column definition
 * @param {'filter'|'sort'|'edit'} purpose
 * @param {Array}   [sampleData] - Optional sample rows to detect complex data
 * @returns {boolean}
 */
export function isFeatureEnabled(column, purpose, sampleData = []) {
  if (!column) return false;

  // Map purpose → explicit flag name
  const flagMap = {
    filter: 'filterable',
    sort:   'sortable',
    edit:   'editable'
  };

  const flag = flagMap[purpose];
  if (!flag) return false;

  // Explicit column-level flag takes priority
  if (column[flag] !== undefined) {
    return !!column[flag];
  }

  // Check if column has a purpose-specific accessor/path — that implies enabled
  const accessorKey = `${purpose}Accessor`;
  const pathKey     = `${purpose}Path`;
  if (typeof column[accessorKey] === 'function' || typeof column[pathKey] === 'string') {
    return true;
  }

  // Auto-detect: sample data to see if column holds complex values
  const columnName = column.name || column.key;
  const limit = Math.min(sampleData.length, 100);
  for (let i = 0; i < limit; i++) {
    const value = sampleData[i]?.[columnName];
    if (isComplexValue(value)) {
      // Complex data detected, no accessor → disable by default
      return false;
    }
  }

  // Primitive data — enabled by default (backward compat)
  return true;
}
