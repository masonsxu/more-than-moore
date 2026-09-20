declare module '@pagefind/default-ui' {
  interface PagefindUIOptions {
    element: string | HTMLElement;
    showImages?: boolean;
    showSubResults?: boolean;
    pageSize?: number;
    showEmptyFilters?: boolean;
    translations?: Record<string, string>;
    [key: string]: unknown;
  }
  export class PagefindUI {
    constructor(options: PagefindUIOptions);
    static debounced(): void;
    destroy(): void;
    triggerSearch(term: string): void;
  }
}
