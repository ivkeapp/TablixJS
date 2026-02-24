declare module 'tablixjs' {
  export interface TableOptions {
    data?: any[];
    columns?: ColumnDefinition[];
    pagination?: PaginationOptions;
    sorting?: SortingOptions;
    filtering?: FilteringOptions;
    controls?: ControlsOptions;
    search?: SearchOptions;
    selection?: SelectionOptions;
    virtualScroll?: VirtualScrollOptions;
  }

  export interface ColumnDefinition {
    /** Column data key (field name in each row object) */
    name?: string;
    key?: string;
    title?: string;
    width?: number | string;
    minWidth?: number;
    maxWidth?: number;

    // --- Feature flags ---

    /** Whether the column can be sorted. Auto-detected for complex data: defaults to false for objects. */
    sortable?: boolean;
    /** Whether the column can be filtered. Auto-detected for complex data: defaults to false for objects. */
    filterable?: boolean;
    /** Whether the column supports inline editing. Auto-detected for complex data: defaults to false for objects. */
    editable?: boolean;
    searchable?: boolean;

    // --- Value accessors for complex / nested data ---

    /** Custom accessor to extract a primitive value used for filtering */
    filterAccessor?: (value: any, row: any) => any;
    /** Dot-path into the cell value to extract a primitive for filtering (e.g. "badge_level") */
    filterPath?: string;

    /** Custom accessor to extract a primitive value used for sorting */
    sortAccessor?: (value: any, row: any) => any;
    /** Dot-path into the cell value to extract a primitive for sorting */
    sortPath?: string;

    /** Custom accessor to extract a primitive value used for inline editing */
    editAccessor?: (value: any, row: any) => any;
    /** Dot-path into the cell value to extract a primitive for editing */
    editPath?: string;

    // --- Formatting & rendering ---

    /** Column format type */
    format?: 'text' | 'date' | 'currency' | 'number' | 'percent';
    /** Custom cell renderer. Return value is treated as HTML. */
    renderer?: (value: any, row: any, formattedValue: any) => string;
    formatter?: (value: any, row: any, column: ColumnDefinition) => string;
    /** Sort type hint */
    sortType?: 'auto' | 'string' | 'number' | 'date' | 'boolean';
    /** Custom sort comparison function */
    sortFunction?: (a: any, b: any) => number;

    headerClass?: string;
    cellClass?: string | ((value: any, row: any) => string);
  }

  export interface PaginationOptions {
    enabled?: boolean;
    pageSize?: number;
    mode?: 'client' | 'server';
    showPageNumbers?: boolean;
    maxPageNumbers?: number;
    showFirstLast?: boolean;
    showPrevNext?: boolean;
    showPageSizes?: boolean;
    pageSizeOptions?: number[];
    serverDataLoader?: (page: number, pageSize: number) => Promise<{ data: any[], totalCount: number }>;
  }

  export interface SortingOptions {
    enabled?: boolean;
    mode?: 'client' | 'server';
    serverSortLoader?: (sortBy: string, direction: string) => Promise<any[]>;
    defaultSortType?: string;
    caseSensitive?: boolean;
    nullsFirst?: boolean;
  }

  export interface FilteringOptions {
    enabled?: boolean;
    mode?: 'client' | 'server';
    serverFilterLoader?: (filters: any) => Promise<any[]>;
    debounceDelay?: number;
    showBadges?: boolean;
    showTooltips?: boolean;
  }

  export interface ControlsOptions {
    enabled?: boolean;
    search?: boolean;
    pagination?: boolean;
    pageSize?: boolean;
    refresh?: boolean;
    export?: boolean;
    position?: 'top' | 'bottom' | 'both';
  }

  export interface SearchOptions {
    enabled?: boolean;
    placeholder?: string;
    searchDelay?: number;
    minLength?: number;
    caseSensitive?: boolean;
  }

  export interface SelectionOptions {
    enabled?: boolean;
    mode?: 'single' | 'multi';
    dataIdKey?: string;
  }

  export interface VirtualScrollOptions {
    enabled?: boolean;
    buffer?: number;
    rowHeight?: number | null;
    containerHeight?: number;
  }

  export interface PaginationInfo {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalCount: number;
    startIndex: number;
    endIndex: number;
  }

  export interface FilterConfig {
    type: 'value' | 'condition';
    values?: string[];
    conditions?: FilterCondition[];
  }

  export interface FilterCondition {
    operator: string;
    value: any;
  }

  export default class Table {
    container: HTMLElement;
    options: TableOptions;

    constructor(container: string | HTMLElement, options?: TableOptions);

    // Data management
    loadData(source: any[] | string | (() => Promise<any[]>)): Promise<void>;
    getData(): any[];
    getOriginalData(): any[];

    // Pagination
    nextPage(): Promise<void>;
    prevPage(): Promise<void>;
    firstPage(): Promise<void>;
    lastPage(): Promise<void>;
    goToPage(pageNumber: number): Promise<void>;
    changePageSize(pageSize: number): Promise<void>;
    getPaginationInfo(): PaginationInfo | null;
    setPaginationEnabled(enabled: boolean): Promise<void>;
    setPaginationMode(mode: 'client' | 'server', serverDataLoader?: Function): Promise<void>;

    // Sorting
    sort(columnName: string, direction?: 'asc' | 'desc'): Promise<void>;
    toggleSort(columnName: string): Promise<void>;
    clearSorting(): Promise<void>;
    getSortState(): any;

    // Filtering
    applyFilter(columnName: string, filterConfig: FilterConfig): Promise<void>;
    clearFilter(columnName: string): Promise<void>;
    clearAllFilters(): Promise<void>;
    getActiveFilters(): any;
    getColumnFilter(columnName: string): any;

    // Search
    setSearchTerm(searchTerm: string): Promise<void>;
    getSearchTerm(): string;
    clearSearch(): Promise<void>;
    getSearchInfo(): any;

    // Selection
    getSelectedData(): any[];
    getSelectedIds(): string[];
    selectRows(rowIds: string | string[]): void;
    deselectRows(rowIds: string | string[]): void;
    clearSelection(): void;
    isRowSelected(rowId: string): boolean;
    getSelectionCount(): number;
    enableSelection(): void;
    disableSelection(): void;
    setSelectionMode(mode: 'single' | 'multi'): void;
    selectAllRows(): number;

    // Events
    on(event: string, callback: Function): void;
    off(event: string, callback: Function): void;
    clearEvents(event?: string): void;
    trigger(event: string, data?: any): void;

    // Utility
    getOptions(): TableOptions;
    setOptions(newOptions: Partial<TableOptions>): Promise<void>;
    refreshTable(): Promise<void>;
    destroy(): void;
  }

  export { Table };
  export const version: string;

  // ValueResolver utilities
  export function resolveColumnValue(
    column: ColumnDefinition,
    row: any,
    purpose?: 'display' | 'filter' | 'sort' | 'edit'
  ): any;

  export function isFeatureEnabled(
    column: ColumnDefinition,
    purpose: 'filter' | 'sort' | 'edit',
    sampleData?: any[]
  ): boolean;

  export function isComplexValue(value: any): boolean;

  export function getByPath(obj: any, path: string): any;
}
