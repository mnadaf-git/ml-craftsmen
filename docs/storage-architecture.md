# Storage Architecture

## Overview

The ML Craftsmen application now uses a persistent, file-based storage system that addresses the data loss issue experienced when the development server restarts. This architecture is designed for future migration to database backends like Snowflake, PostgreSQL, or MySQL.

## Problem Solved

**Original Issue**: Changes were lost when server restarted because data was only stored in browser localStorage.

**Solution**: Hybrid storage system with static initial data files and localStorage for runtime changes, plus an abstraction layer for easy database migration.

## Architecture Components

### 1. Storage Abstraction Layer (`src/lib/storage.ts`)

Central storage management with multiple adapter support:

```typescript
interface StorageAdapter {
  load(): Promise<MetadataStore | null>;
  save(data: MetadataStore): Promise<void>;
  isAvailable(): boolean;
}
```

#### Storage Adapters

1. **HybridStorageAdapter** (Primary)
   - Loads initial data from static JSON file
   - Saves changes to localStorage
   - Provides data persistence across server restarts

2. **FileStorageAdapter** (Future)
   - Server-side file persistence via API endpoints
   - Requires backend implementation

3. **DatabaseAdapter** (Future)
   - Database persistence (Snowflake, PostgreSQL, MySQL)
   - Configurable connection parameters

#### Storage Manager

The `StorageManager` class provides:
- Automatic adapter selection based on availability
- Fallback strategies for storage failures
- Easy database adapter addition
- Storage debugging information

### 2. Initial Data File (`src/data/metadata.json`)

Contains sample transformed tables and feature groups that serve as:
- Default data when no localStorage exists
- Reference structure for the metadata format
- Version control tracking for data schema changes

### 3. Updated Metadata Operations (`src/lib/metadata.ts`)

All CRUD operations now:
- Use async/await patterns
- Leverage the storage abstraction layer
- Provide proper error handling
- Support data persistence across server restarts

## Usage Examples

### Loading Data
```typescript
import { loadMetadata } from '@/lib/metadata';

const data = await loadMetadata(); // Loads from static file or localStorage
```

### Saving Changes
```typescript
import { createFeatureGroup } from '@/lib/metadata';

const updatedData = await createFeatureGroup(currentData, newGroup);
// Automatically persists to localStorage
```

### Adding Database Support (Future)
```typescript
import { storageManager } from '@/lib/storage';

// When ready to migrate to database
storageManager.addDatabaseAdapter({
  type: 'snowflake',
  host: 'account.snowflakecomputing.com',
  database: 'ml_craftsmen',
  schema: 'metadata'
});
```

## Data Flow

1. **Application Start**:
   - Storage manager initializes available adapters
   - HybridStorageAdapter checks localStorage
   - If empty, loads from `src/data/metadata.json`
   - Data is cached in localStorage for future use

2. **Runtime Changes**:
   - User creates/updates feature groups or tables
   - Changes automatically save to localStorage
   - Data persists across browser sessions

3. **Server Restart**:
   - Data remains available from localStorage
   - No data loss occurs
   - Application continues with last known state

## Migration Path

### Phase 1: Current (File-based)
- ✅ Static JSON initial data
- ✅ localStorage persistence
- ✅ Storage abstraction layer

### Phase 2: Server-side Files
- Implement REST API endpoints for metadata
- Enable FileStorageAdapter
- Server-side JSON file persistence

### Phase 3: Database Integration
- Implement database connections
- Enable DatabaseAdapter
- Support for Snowflake, PostgreSQL, MySQL
- Data migration utilities

## File Structure

```
src/
├── lib/
│   ├── storage.ts          # Storage abstraction layer
│   └── metadata.ts         # Updated metadata operations
├── data/
│   └── metadata.json       # Initial static data
└── pages/
    ├── FeatureStore.tsx    # Updated for async operations
    └── TransformedTables.tsx # Updated for async operations
```

## Benefits

1. **Data Persistence**: Changes survive server restarts
2. **Future-Proof**: Easy migration to any database backend
3. **Version Control**: Initial data is tracked in Git
4. **Flexible**: Multiple storage backends supported
5. **Reliable**: Fallback strategies prevent data loss

## Debugging

Use the storage info function to check current state:

```typescript
import { getStorageInfo } from '@/lib/metadata';

const info = getStorageInfo();
console.log(info); // { adapter: 'hybrid', available: true, hasLocalData: true }
```

## Configuration

Storage behavior can be monitored through browser console logs:
- Adapter initialization messages
- Data loading confirmations
- Error handling notifications
- Fallback activation alerts

This architecture ensures robust data persistence while maintaining flexibility for future enhancements and database migrations.