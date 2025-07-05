// Chrome API type definitions for development

// Declare Chrome namespace
declare namespace chrome {
  export namespace bookmarks {
    interface BookmarkTreeNode {
      id: string;
      parentId?: string;
      index?: number;
      url?: string;
      title: string;
      dateAdded?: number;
      dateGroupModified?: number;
      unmodifiable?: string;
      children?: BookmarkTreeNode[];
    }
    
    export function getTree(): Promise<BookmarkTreeNode[]>;
    export function getRecent(numberOfItems: number): Promise<BookmarkTreeNode[]>;
    export function get(idOrIdList: string | string[]): Promise<BookmarkTreeNode[]>;
    export function search(query: { query?: string; url?: string; title?: string }): Promise<BookmarkTreeNode[]>;
  }
  
  export namespace storage {
    interface StorageArea {
      get(keys?: string | string[] | Object | null): Promise<{ [key: string]: any }>;
      set(items: Object): Promise<void>;
      remove(keys: string | string[]): Promise<void>;
      clear(): Promise<void>;
    }
    
    export const sync: StorageArea;
    export const local: StorageArea;
  }
}

// Declare Chrome for non-extension environments
interface Window {
  chrome?: typeof chrome;
} 