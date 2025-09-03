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
    key: string;
    title?: string;
    width?: number | string;
    minWidth?: number;
    maxWidth?: number;
    sortable?: boolean;
    filterable?: boolean;
    searchable?: boolean;
    formatter?: (value: any, row: any, column: ColumnDefinition) => string;
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
}
