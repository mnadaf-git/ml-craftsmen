# Migration Guide: Database Integration

## Overview

This guide explains how to migrate from the current hybrid storage system to a database-backed solution like Snowflake, PostgreSQL, or MySQL.

## Current State

The application currently uses:
- **Static JSON file** (`src/data/metadata.json`) for initial data
- **localStorage** for runtime changes
- **Storage abstraction layer** for easy migration

## Database Migration Steps

### Step 1: Choose Your Database

#### Snowflake
```typescript
const snowflakeConfig = {
  type: 'snowflake' as const,
  host: 'your-account.snowflakecomputing.com',
  database: 'ML_CRAFTSMEN',
  schema: 'METADATA',
  table: 'metadata_store'
};
```

#### PostgreSQL
```typescript
const postgresConfig = {
  type: 'postgresql' as const,
  host: 'localhost:5432',
  database: 'ml_craftsmen',
  schema: 'public',
  table: 'metadata_store'
};
```

#### MySQL
```typescript
const mysqlConfig = {
  type: 'mysql' as const,
  host: 'localhost:3306',
  database: 'ml_craftsmen',
  table: 'metadata_store'
};
```

### Step 2: Database Schema Setup

#### For Snowflake:
```sql
CREATE SCHEMA IF NOT EXISTS metadata;

CREATE TABLE metadata.metadata_store (
  id VARCHAR(50) PRIMARY KEY,
  data VARIANT,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
  updated_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);

-- Insert initial data
INSERT INTO metadata.metadata_store (id, data)
SELECT 'main', PARSE_JSON($DATA_JSON);
```

#### For PostgreSQL:
```sql
CREATE SCHEMA IF NOT EXISTS metadata;

CREATE TABLE metadata.metadata_store (
  id VARCHAR(50) PRIMARY KEY,
  data JSONB,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial data
INSERT INTO metadata.metadata_store (id, data)
VALUES ('main', $DATA_JSON::jsonb);
```

#### For MySQL:
```sql
CREATE DATABASE IF NOT EXISTS ml_craftsmen;
USE ml_craftsmen;

CREATE TABLE metadata_store (
  id VARCHAR(50) PRIMARY KEY,
  data JSON,
  version INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert initial data
INSERT INTO metadata_store (id, data)
VALUES ('main', CAST($DATA_JSON AS JSON));
```

### Step 3: Implement Database Adapter

Update `src/lib/storage.ts` DatabaseAdapter class:

```typescript
export class DatabaseAdapter implements StorageAdapter {
  private config: DatabaseConfig;
  private connection: any; // Database-specific connection

  constructor(config: DatabaseConfig) {
    this.config = config;
    this.initializeConnection();
  }

  private async initializeConnection() {
    switch (this.config.type) {
      case 'snowflake':
        // Import and configure Snowflake connector
        break;
      case 'postgresql':
        // Import and configure pg connector
        break;
      case 'mysql':
        // Import and configure mysql2 connector
        break;
    }
  }

  isAvailable(): boolean {
    return this.connection !== null;
  }

  async load(): Promise<MetadataStore | null> {
    try {
      const query = this.buildSelectQuery();
      const result = await this.executeQuery(query);
      return result?.data || null;
    } catch (error) {
      console.error('Database load failed:', error);
      return null;
    }
  }

  async save(data: MetadataStore): Promise<void> {
    try {
      const query = this.buildUpsertQuery(data);
      await this.executeQuery(query);
    } catch (error) {
      console.error('Database save failed:', error);
      throw error;
    }
  }

  private buildSelectQuery(): string {
    const { schema, table } = this.config;
    const tableName = schema ? `${schema}.${table}` : table;
    return `SELECT data FROM ${tableName} WHERE id = 'main'`;
  }

  private buildUpsertQuery(data: MetadataStore): string {
    const { schema, table } = this.config;
    const tableName = schema ? `${schema}.${table}` : table;
    const dataJson = JSON.stringify(data);

    switch (this.config.type) {
      case 'snowflake':
        return `MERGE INTO ${tableName} AS target
                USING (SELECT 'main' AS id, PARSE_JSON('${dataJson}') AS data) AS source
                ON target.id = source.id
                WHEN MATCHED THEN UPDATE SET data = source.data, updated_at = CURRENT_TIMESTAMP()
                WHEN NOT MATCHED THEN INSERT (id, data) VALUES (source.id, source.data)`;

      case 'postgresql':
        return `INSERT INTO ${tableName} (id, data) VALUES ('main', '${dataJson}'::jsonb)
                ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = CURRENT_TIMESTAMP`;

      case 'mysql':
        return `INSERT INTO ${tableName} (id, data) VALUES ('main', CAST('${dataJson}' AS JSON))
                ON DUPLICATE KEY UPDATE data = VALUES(data), updated_at = CURRENT_TIMESTAMP`;

      default:
        throw new Error(`Unsupported database type: ${this.config.type}`);
    }
  }
}
```

### Step 4: Data Migration

Create a migration script to transfer data from localStorage to database:

```typescript
// scripts/migrate-to-database.ts
import { storageManager, StorageManager } from '@/lib/storage';
import { loadMetadata } from '@/lib/metadata';

async function migrateToDatabase(dbConfig: DatabaseConfig) {
  console.log('Starting database migration...');

  // Load current data from localStorage/static file
  const currentData = await loadMetadata();
  console.log('Current data loaded:', currentData);

  // Add database adapter
  storageManager.addDatabaseAdapter(dbConfig);

  // Save data to database
  await storageManager.save(currentData);
  console.log('Data migrated to database successfully');

  // Verify migration
  const verifyData = await storageManager.load();
  console.log('Verification successful:', verifyData !== null);
}

// Usage
const dbConfig = {
  type: 'snowflake',
  host: 'your-account.snowflakecomputing.com',
  database: 'ML_CRAFTSMEN',
  schema: 'METADATA',
  table: 'metadata_store'
};

migrateToDatabase(dbConfig);
```

### Step 5: Update Application Configuration

Modify the main application to use database storage:

```typescript
// src/main.tsx or app initialization
import { storageManager } from '@/lib/storage';

// Add database configuration on app start
const dbConfig = {
  type: process.env.VITE_DB_TYPE || 'snowflake',
  host: process.env.VITE_DB_HOST,
  database: process.env.VITE_DB_NAME,
  schema: process.env.VITE_DB_SCHEMA,
  table: 'metadata_store'
};

if (dbConfig.host) {
  storageManager.addDatabaseAdapter(dbConfig);
}
```

### Step 6: Environment Variables

Create `.env` file:

```env
# Database Configuration
VITE_DB_TYPE=snowflake
VITE_DB_HOST=your-account.snowflakecomputing.com
VITE_DB_NAME=ML_CRAFTSMEN
VITE_DB_SCHEMA=METADATA
VITE_DB_USER=your-username
VITE_DB_PASSWORD=your-password
```

### Step 7: Dependencies

Install database drivers:

```bash
# For Snowflake
npm install snowflake-sdk

# For PostgreSQL
npm install pg @types/pg

# For MySQL
npm install mysql2 @types/mysql2
```

## Rollback Plan

If database migration fails, the application will automatically fall back to:
1. localStorage (if data exists)
2. Static JSON file (as last resort)

To manually rollback:
1. Remove database adapter from StorageManager
2. Clear database configuration
3. Application continues with hybrid storage

## Testing Database Integration

1. **Test Connection**: Verify database connectivity
2. **Test Migration**: Run migration script with test data
3. **Test CRUD Operations**: Verify all operations work with database
4. **Test Fallback**: Simulate database failure and verify fallback
5. **Performance Testing**: Ensure acceptable response times

## Monitoring

Add logging to track:
- Database connection status
- Query execution times
- Error rates and types
- Fallback activations

## Best Practices

1. **Connection Pooling**: Use connection pools for better performance
2. **Error Handling**: Implement comprehensive error handling
3. **Backup Strategy**: Regular database backups
4. **Schema Versioning**: Version your database schema
5. **Security**: Use proper authentication and encryption
6. **Monitoring**: Set up database monitoring and alerting

This migration approach ensures minimal downtime and provides fallback options if issues occur during the transition.