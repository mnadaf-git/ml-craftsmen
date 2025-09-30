// Storage abstraction layer for metadata persistence
// Supports multiple storage backends: localStorage, static files, and future database integration

import type { MetadataStore } from './metadata';

// Abstract storage interface for easy future migration to database
export interface StorageAdapter {
  load(): Promise<MetadataStore | null>;
  save(data: MetadataStore): Promise<void>;
  isAvailable(): boolean;
}

// Hybrid storage adapter - reads from static file initially, saves to localStorage
class HybridStorageAdapter implements StorageAdapter {
  private readonly localStorageKey = 'ml-craftsmen-metadata';
  private readonly staticFileKey = 'ml-craftsmen-metadata-loaded';

  isAvailable(): boolean {
    return typeof localStorage !== 'undefined';
  }

  async load(): Promise<MetadataStore | null> {
    try {
      // First check if we have data in localStorage
      const stored = localStorage.getItem(this.localStorageKey);
      if (stored) {
        return JSON.parse(stored);
      }

      // If no localStorage data, load from static file
      console.log('Loading initial metadata from static file...');
      const initialData = await import('../data/metadata.json');
      const metadata = initialData.default as MetadataStore;

      // Save to localStorage for future persistence
      if (metadata) {
        await this.save(metadata);
        localStorage.setItem(this.staticFileKey, 'true');
        console.log('Initial metadata loaded and cached');
      }

      return metadata;
    } catch (error) {
      console.warn('Failed to load metadata:', error);
      return null;
    }
  }

  async save(data: MetadataStore): Promise<void> {
    try {
      localStorage.setItem(this.localStorageKey, JSON.stringify(data, null, 2));
      console.log('Metadata saved to localStorage');
    } catch (error) {
      console.error('Failed to save metadata to localStorage:', error);
      throw error;
    }
  }
}

// File-based storage adapter for future server-side persistence
class FileStorageAdapter implements StorageAdapter {
  private readonly endpoint = '/api/metadata';

  isAvailable(): boolean {
    // Only available if running in a server environment with file write capabilities
    return false; // Disabled for now, enable when server-side API is ready
  }

  async load(): Promise<MetadataStore | null> {
    try {
      const response = await fetch(this.endpoint);
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.warn('Failed to load from file storage:', error);
      return null;
    }
  }

  async save(data: MetadataStore): Promise<void> {
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data, null, 2)
      });

      if (!response.ok) {
        throw new Error(`Failed to save to file: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to save to file storage:', error);
      throw error;
    }
  }
}

// Future database adapter (Snowflake, PostgreSQL, etc.)
class DatabaseAdapter implements StorageAdapter {
  private connectionConfig: {
    type: 'snowflake' | 'postgresql' | 'mysql';
    host: string;
    database: string;
    schema?: string;
    table?: string;
  };

  constructor(config: DatabaseAdapter['connectionConfig']) {
    this.connectionConfig = config;
  }

  isAvailable(): boolean {
    // Check database connection availability
    return false; // Not implemented yet
  }

  async load(): Promise<MetadataStore | null> {
    // TODO: Implement database loading
    // For Snowflake: SELECT data FROM ml_metadata.metadata_store WHERE id = 'main'
    // For PostgreSQL: SELECT data FROM metadata_store WHERE id = 'main'
    throw new Error('Database adapter not implemented');
  }

  async save(data: MetadataStore): Promise<void> {
    // TODO: Implement database saving with proper serialization
    // For Snowflake: MERGE INTO ml_metadata.metadata_store USING ...
    // For PostgreSQL: INSERT INTO metadata_store (id, data) VALUES ('main', $1) ON CONFLICT...
    throw new Error('Database adapter not implemented');
  }
}

// Storage manager with fallback strategy
export class StorageManager {
  private adapters: StorageAdapter[];
  private primaryAdapter: StorageAdapter | null = null;

  constructor() {
    // Initialize adapters in order of preference
    this.adapters = [
      new HybridStorageAdapter(),    // Primary: Static file + localStorage
      new FileStorageAdapter(),      // Future: Server-side file persistence
    ];

    // Find the first available adapter
    this.primaryAdapter = this.adapters.find(adapter => adapter.isAvailable()) || null;

    if (!this.primaryAdapter) {
      console.warn('No storage adapter available');
    } else {
      console.log(`Using storage adapter: ${this.getCurrentAdapter()}`);
    }
  }

  // Add database adapter when ready for migration
  addDatabaseAdapter(config: {
    type: 'snowflake' | 'postgresql' | 'mysql';
    host: string;
    database: string;
    schema?: string;
    table?: string;
  }) {
    const dbAdapter = new DatabaseAdapter(config);
    this.adapters.unshift(dbAdapter); // Make it highest priority

    if (dbAdapter.isAvailable()) {
      this.primaryAdapter = dbAdapter;
      console.log('Switched to database storage adapter');
    }
  }

  async load(): Promise<MetadataStore | null> {
    if (!this.primaryAdapter) {
      return null;
    }

    try {
      const data = await this.primaryAdapter.load();
      if (data) {
        console.log(`Metadata loaded from ${this.getCurrentAdapter()}`);
      }
      return data;
    } catch (error) {
      console.error('Primary storage failed, trying fallbacks:', error);

      // Try fallback adapters
      for (const adapter of this.adapters.slice(1)) {
        if (adapter.isAvailable()) {
          try {
            const data = await adapter.load();
            if (data) {
              console.log('Data loaded from fallback storage');
              // Migrate data to primary adapter if possible
              await this.save(data);
              return data;
            }
          } catch (fallbackError) {
            console.warn('Fallback storage also failed:', fallbackError);
          }
        }
      }

      return null;
    }
  }

  async save(data: MetadataStore): Promise<void> {
    if (!this.primaryAdapter) {
      throw new Error('No storage adapter available');
    }

    try {
      await this.primaryAdapter.save(data);
      console.log(`Metadata saved to ${this.getCurrentAdapter()}`);
    } catch (error) {
      console.error('Primary storage save failed:', error);

      // Try to save to fallback adapters
      for (const adapter of this.adapters.slice(1)) {
        if (adapter.isAvailable()) {
          try {
            await adapter.save(data);
            console.warn('Data saved to fallback storage');
            return;
          } catch (fallbackError) {
            console.warn('Fallback storage save failed:', fallbackError);
          }
        }
      }

      throw new Error('All storage adapters failed');
    }
  }

  getCurrentAdapter(): string {
    if (!this.primaryAdapter) return 'none';

    if (this.primaryAdapter instanceof HybridStorageAdapter) return 'hybrid';
    if (this.primaryAdapter instanceof FileStorageAdapter) return 'file';
    if (this.primaryAdapter instanceof DatabaseAdapter) return 'database';

    return 'unknown';
  }

  // Get storage statistics for debugging
  getStorageInfo(): {
    adapter: string;
    available: boolean;
    hasLocalData: boolean;
  } {
    const hasLocalData = typeof localStorage !== 'undefined' &&
                        localStorage.getItem('ml-craftsmen-metadata') !== null;

    return {
      adapter: this.getCurrentAdapter(),
      available: this.primaryAdapter?.isAvailable() || false,
      hasLocalData
    };
  }
}

// Global storage manager instance
export const storageManager = new StorageManager();