// Metadata management system for ML Craftsmen
// Now with persistent file-based storage and database migration support
// Version: 2.0.0 - Updated Dynamic to Real Time feature types

import { storageManager } from './storage';

// Metadata version for cache busting
export const METADATA_VERSION = '2.0.0';

export interface ColumnMeta {
  name: string;
  dataType: 'int' | 'float' | 'datetime' | 'text';
  description?: string;
}

export interface TransformedTable {
  id: string;
  name: string;
  description: string;
  columns: ColumnMeta[];
  createdAt: string;
  updatedAt: string;
}

export interface FeatureMeta {
  id: string;
  name: string;
  dataType: 'int' | 'float' | 'datetime' | 'text';
  description: string;
  featureType: 'Calculated' | 'Real Time' | 'Direct';
  transformationLogic?: string;
  transformation?: string; // New field for tracking transformation details
  mapped_column: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeatureGroup {
  id: string;
  name: string;
  description: string;
  keyColumn: string;
  transformTableId: string; // Reference to TransformedTable
  features: FeatureMeta[];
  createdAt: string;
  updatedAt: string;
}

export interface MetadataStore {
  transformedTables: TransformedTable[];
  featureGroups: FeatureGroup[];
}

// Initialize with sample data if no data exists
const getInitialData = (): MetadataStore => ({
  transformedTables: [
    {
      id: 'tbl_1',
      name: 'transformed_change_requests',
      description: 'Processed change request data with computed metrics',
      columns: [
        { name: 'change_lead_duration', dataType: 'int', description: 'Lead time for change request in hours' },
        { name: 'change_planned_duration', dataType: 'int', description: 'Planned duration for change implementation' },
        { name: 'approved_planned_leadtime', dataType: 'int', description: 'Lead time from approval to planned start' },
        { name: 'change_request_id', dataType: 'text', description: 'Unique identifier for change request' },
        { name: 'category', dataType: 'text', description: 'Change request category' },
        { name: 'change_ci_count', dataType: 'int', description: 'Number of configuration items affected' },
        { name: 'change_type', dataType: 'text', description: 'Type of change (standard, normal, emergency)' }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'tbl_2',
      name: 'transformed_assignees',
      description: 'Assignee-level aggregated metrics and features',
      columns: [
        { name: 'change_assignee_prior_changes', dataType: 'int', description: 'Number of changes by assignee in last 180 days' },
        { name: 'change_assignee_prior_changes_failure_rate', dataType: 'float', description: 'Failure rate of assignee changes in last 180 days' },
        { name: 'assignee_id', dataType: 'text', description: 'Unique identifier for assignee' }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'tbl_3',
      name: 'transformed_assignment_groups',
      description: 'Assignment group-level performance metrics',
      columns: [
        { name: 'change_assignment_group_prior_changes', dataType: 'int', description: 'Number of changes by group in last 180 days' },
        { name: 'change_assignment_group_prior_changes_failure_rate', dataType: 'float', description: 'Failure rate of group changes in last 180 days' },
        { name: 'assignement_group_id', dataType: 'text', description: 'Unique identifier for assignment group' }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  featureGroups: [
    {
      id: 'fg_1',
      name: 'Change Request',
      description: 'Contains features which are at change request level.',
      keyColumn: 'change_request_id',
      transformTableId: 'tbl_1',
      features: [
        {
          id: 'feat_1',
          name: 'Change Lead Duration',
          dataType: 'int',
          description: 'Lead time for change request planned start date',
          featureType: 'Real Time',
          mapped_column: 'change_lead_duration',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'feat_2',
          name: 'Change Planned Duration',
          dataType: 'int',
          description: 'Planned Duration of change implementation',
          featureType: 'Calculated',
          mapped_column: 'change_planned_duration',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'feat_3',
          name: 'Approved Planned Leadtime',
          dataType: 'int',
          description: 'Lead time for change implementation from approval date',
          featureType: 'Real Time',
          mapped_column: 'approved_planned_leadtime',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'feat_4',
          name: 'Change CI Count',
          dataType: 'int',
          description: 'No of change tasks associated to change request',
          featureType: 'Calculated',
          mapped_column: 'change_ci_count',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'fg_2',
      name: 'Assignee',
      description: 'Assignee level features',
      keyColumn: 'assignee_id',
      transformTableId: 'tbl_2',
      features: [
        {
          id: 'feat_5',
          name: 'Change Assignee Prior Changes',
          dataType: 'int',
          description: 'Changes implemented by assignee in last 180 days',
          featureType: 'Calculated',
          mapped_column: 'change_assignee_prior_changes',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'feat_6',
          name: 'Change Assignee Prior Changes Failure Rate',
          dataType: 'float',
          description: 'Change failure rate by assignee in last 180 days',
          featureType: 'Calculated',
          mapped_column: 'change_assignee_prior_changes_failure_rate',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'fg_3',
      name: 'Assignment Group',
      description: 'Team / assignment group level features',
      keyColumn: 'assignement_group_id',
      transformTableId: 'tbl_3',
      features: [
        {
          id: 'feat_7',
          name: 'Change Assignment Group Prior Changes',
          dataType: 'int',
          description: 'Changes implemented by assignment group in last 180 days',
          featureType: 'Calculated',
          mapped_column: 'change_assignment_group_prior_changes',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'feat_8',
          name: 'Change Assignment Group Prior Changes Failure Rate',
          dataType: 'float',
          description: 'Change failure rate by assignment group in last 180 days',
          featureType: 'Calculated',
          mapped_column: 'change_assignment_group_prior_changes_failure_rate',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]
});

// Load data using the new storage abstraction
export const loadMetadata = async (): Promise<MetadataStore> => {
  try {
    const data = await storageManager.load();
    if (data) {
      console.log('Metadata loaded successfully');
      return data;
    }
  } catch (error) {
    console.warn('Failed to load metadata from storage:', error);
  }

  console.log('Using fallback initial data');
  return getInitialData();
};

// Save data using the new storage abstraction
export const saveMetadata = async (data: MetadataStore): Promise<void> => {
  try {
    await storageManager.save(data);
    console.log('Metadata saved successfully');
  } catch (error) {
    console.error('Failed to save metadata:', error);
    throw error;
  }
};

// Get storage info for debugging
export const getStorageInfo = () => storageManager.getStorageInfo();

// Utility functions
export const generateId = (prefix: string): string => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const getTransformedTableById = (tables: TransformedTable[], id: string): TransformedTable | undefined => {
  return tables.find(table => table.id === id);
};

export const getFeatureGroupById = (groups: FeatureGroup[], id: string): FeatureGroup | undefined => {
  return groups.find(group => group.id === id);
};

// CRUD operations for TransformedTables
export const createTransformedTable = async (data: MetadataStore, table: Omit<TransformedTable, 'id' | 'createdAt' | 'updatedAt'>): Promise<MetadataStore> => {
  const newTable: TransformedTable = {
    ...table,
    id: generateId('tbl'),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const updatedData = {
    ...data,
    transformedTables: [...data.transformedTables, newTable]
  };

  await saveMetadata(updatedData);
  return updatedData;
};

export const updateTransformedTable = async (data: MetadataStore, id: string, updates: Partial<TransformedTable>): Promise<MetadataStore> => {
  const updatedData = {
    ...data,
    transformedTables: data.transformedTables.map(table =>
      table.id === id
        ? { ...table, ...updates, updatedAt: new Date().toISOString() }
        : table
    )
  };

  await saveMetadata(updatedData);
  return updatedData;
};

export const deleteTransformedTable = async (data: MetadataStore, id: string): Promise<MetadataStore> => {
  const updatedData = {
    ...data,
    transformedTables: data.transformedTables.filter(table => table.id !== id),
    // Also remove any feature groups that reference this table
    featureGroups: data.featureGroups.filter(group => group.transformTableId !== id)
  };

  await saveMetadata(updatedData);
  return updatedData;
};

// CRUD operations for FeatureGroups
export const createFeatureGroup = async (data: MetadataStore, group: Omit<FeatureGroup, 'id' | 'createdAt' | 'updatedAt'>): Promise<MetadataStore> => {
  const newGroup: FeatureGroup = {
    ...group,
    id: generateId('fg'),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const updatedData = {
    ...data,
    featureGroups: [...data.featureGroups, newGroup]
  };

  await saveMetadata(updatedData);
  return updatedData;
};

export const updateFeatureGroup = async (data: MetadataStore, id: string, updates: Partial<FeatureGroup>): Promise<MetadataStore> => {
  const updatedData = {
    ...data,
    featureGroups: data.featureGroups.map(group =>
      group.id === id
        ? { ...group, ...updates, updatedAt: new Date().toISOString() }
        : group
    )
  };

  await saveMetadata(updatedData);
  return updatedData;
};

export const deleteFeatureGroup = async (data: MetadataStore, id: string): Promise<MetadataStore> => {
  const updatedData = {
    ...data,
    featureGroups: data.featureGroups.filter(group => group.id !== id)
  };

  await saveMetadata(updatedData);
  return updatedData;
};

// CRUD operations for Features within FeatureGroups
export const addFeatureToGroup = async (data: MetadataStore, groupId: string, feature: Omit<FeatureMeta, 'id' | 'createdAt' | 'updatedAt'>): Promise<MetadataStore> => {
  const newFeature: FeatureMeta = {
    ...feature,
    id: generateId('feat'),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const updatedData = {
    ...data,
    featureGroups: data.featureGroups.map(group =>
      group.id === groupId
        ? { ...group, features: [...group.features, newFeature], updatedAt: new Date().toISOString() }
        : group
    )
  };

  await saveMetadata(updatedData);
  return updatedData;
};

export const updateFeatureInGroup = async (data: MetadataStore, groupId: string, featureId: string, updates: Partial<FeatureMeta>): Promise<MetadataStore> => {
  const updatedData = {
    ...data,
    featureGroups: data.featureGroups.map(group =>
      group.id === groupId
        ? {
            ...group,
            features: group.features.map(feature =>
              feature.id === featureId
                ? { ...feature, ...updates, updatedAt: new Date().toISOString() }
                : feature
            ),
            updatedAt: new Date().toISOString()
          }
        : group
    )
  };

  await saveMetadata(updatedData);
  return updatedData;
};

export const deleteFeatureFromGroup = async (data: MetadataStore, groupId: string, featureId: string): Promise<MetadataStore> => {
  const updatedData = {
    ...data,
    featureGroups: data.featureGroups.map(group =>
      group.id === groupId
        ? {
            ...group,
            features: group.features.filter(feature => feature.id !== featureId),
            updatedAt: new Date().toISOString()
          }
        : group
    )
  };

  await saveMetadata(updatedData);
  return updatedData;
};

// CRUD operations for Columns within TransformedTables
export const addColumnToTable = async (data: MetadataStore, tableId: string, column: ColumnMeta): Promise<MetadataStore> => {
  const updatedData = {
    ...data,
    transformedTables: data.transformedTables.map(table =>
      table.id === tableId
        ? { ...table, columns: [...table.columns, column], updatedAt: new Date().toISOString() }
        : table
    )
  };

  await saveMetadata(updatedData);
  return updatedData;
};

export const updateColumnInTable = async (data: MetadataStore, tableId: string, columnName: string, updates: Partial<ColumnMeta>): Promise<MetadataStore> => {
  const updatedData = {
    ...data,
    transformedTables: data.transformedTables.map(table =>
      table.id === tableId
        ? {
            ...table,
            columns: table.columns.map(column =>
              column.name === columnName
                ? { ...column, ...updates }
                : column
            ),
            updatedAt: new Date().toISOString()
          }
        : table
    )
  };

  await saveMetadata(updatedData);
  return updatedData;
};

export const deleteColumnFromTable = async (data: MetadataStore, tableId: string, columnName: string): Promise<MetadataStore> => {
  const updatedData = {
    ...data,
    transformedTables: data.transformedTables.map(table =>
      table.id === tableId
        ? {
            ...table,
            columns: table.columns.filter(column => column.name !== columnName),
            updatedAt: new Date().toISOString()
          }
        : table
    )
  };

  await saveMetadata(updatedData);
  return updatedData;
};

// Force fresh metadata load without clearing stored data
export const forceMetadataRefresh = (): void => {
  // Only clear browser cache keys that might hold onto old in-memory references
  // This does NOT clear your actual stored feature data
  if (typeof window !== 'undefined') {
    // Clear only temporary cache keys, not persistent storage
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('temp_metadata_cache_')) {
        sessionStorage.removeItem(key);
      }
    });
  }
};