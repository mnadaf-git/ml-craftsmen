import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import CreateFeatureDialog from "@/components/CreateFeatureDialog";
import {
  loadMetadata,
  createFeatureGroup,
  addFeatureToGroup,
  deleteFeatureGroup,
  deleteFeatureFromGroup,
  updateFeatureInGroup,
  getTransformedTableById,
  createTransformedTable,
  addColumnToTable,
  updateColumnInTable,
  deleteColumnFromTable,
  forceMetadataRefresh,
  METADATA_VERSION,
  type MetadataStore,
  type FeatureGroup,
  type FeatureMeta,
  type TransformedTable,
  type ColumnMeta
} from "@/lib/metadata";

export default function FeatureStore() {
  const [metadata, setMetadata] = useState<MetadataStore>({ transformedTables: [], featureGroups: [] });
  const [viewMode, setViewMode] = useState<'groups' | 'features'>('groups');
  const [showCreateGroupDialog, setShowCreateGroupDialog] = useState(false);
  const [showCreateFeatureDialog, setShowCreateFeatureDialog] = useState(false);
  const [showDeleteGroupDialog, setShowDeleteGroupDialog] = useState<string | null>(null);
  const [selectedGroupForFeature, setSelectedGroupForFeature] = useState<string | null>(null);
  const [sourceColumnChoice, setSourceColumnChoice] = useState<string>('');
  const [featureOverlay, setFeatureOverlay] = useState<{ group: FeatureGroup; feature: FeatureMeta } | null>(null);
  const [groupOverlay, setGroupOverlay] = useState<FeatureGroup | null>(null);

  // New state for feature creation workflow
  const [featureCreationType, setFeatureCreationType] = useState<'direct' | 'calculated' | null>(null);
  const [selectedSourceTable, setSelectedSourceTable] = useState<string>('');
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);

  // New state for feature edit and delete
  const [editingFeature, setEditingFeature] = useState<{ feature: FeatureMeta; group: FeatureGroup } | null>(null);
  const [showDeleteFeatureDialog, setShowDeleteFeatureDialog] = useState<{ feature: FeatureMeta; group: FeatureGroup } | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const [groupForm, setGroupForm] = useState({
    name: '',
    description: '',
    keyColumn: '',
    transformTableId: 'CREATE_NEW'
  });

  const [featureForm, setFeatureForm] = useState({
    name: '',
    dataType: 'text' as 'text' | 'int' | 'float' | 'datetime',
    description: '',
    featureType: 'Calculated' as 'Calculated' | 'Real Time' | 'Direct',
    mapped_column: '',
    transformationLogic: '',
    isDynamic: false,
    sourceTableId: '',
    transformationLanguage: 'SQL' as 'SQL' | 'Python'
  });

  const [logicValidated, setLogicValidated] = useState(false);
  const [logicError, setLogicError] = useState<string | null>(null);

  // Duplicate validation error states
  const [groupNameError, setGroupNameError] = useState<string | null>(null);
  const [featureNameError, setFeatureNameError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Only clear temporary cache, preserves your actual feature data
        forceMetadataRefresh();
        console.log(`Loading metadata version ${METADATA_VERSION} - preserving your data`);
        const data = await loadMetadata();
        setMetadata(data);
      } catch (error) {
        console.error('Failed to load metadata:', error);
      }
    };

    loadData();
  }, []);

  const openGroupOverlay = (group: FeatureGroup) => {
    setGroupOverlay(group);
  };  const resetGroupForm = () => {
    setGroupForm({ name: '', description: '', keyColumn: '', transformTableId: 'CREATE_NEW' });
    setGroupNameError(null);
  };

  const resetFeatureForm = () => {
    setFeatureForm({
      name: '',
      dataType: 'text',
      description: '',
      featureType: 'Calculated',
      mapped_column: '',
      transformationLogic: '',
      isDynamic: false,
      sourceTableId: '',
      transformationLanguage: 'SQL'
    });
    setLogicValidated(false);
    setLogicError(null);
    setSourceColumnChoice('');
    setFeatureCreationType(null);
    setSelectedSourceTable('');
    setSelectedColumns([]);
    setIsEditMode(false);
    setEditingFeature(null);
    setFeatureNameError(null);
  };

  const handleCreateGroup = async () => {
    if (!groupForm.name.trim()) return;

    // Check for duplicate group name
    const duplicateError = checkFeatureGroupNameDuplicate(groupForm.name);
    if (duplicateError) {
      setGroupNameError(duplicateError);
      return;
    }

    let transformTableId = groupForm.transformTableId;
    let currentMetadata = metadata;

    // If no table is selected or CREATE_NEW is selected, create a new table
    if (!transformTableId || transformTableId === 'CREATE_NEW') {
      const tableName = createTableNameFromGroupName(groupForm.name);

      try {
        const updatedMetadata = await createTransformedTable(metadata, {
          name: tableName,
          description: `Transformed table for ${groupForm.name} feature group`,
          columns: []
        });

        currentMetadata = updatedMetadata;
        setMetadata(updatedMetadata);

        // Find the newly created table and get its ID
        const newTable = updatedMetadata.transformedTables.find(t => t.name === tableName);
        transformTableId = newTable?.id || '';

        if (!transformTableId) {
          console.error('Failed to create transform table');
          return;
        }
      } catch (error) {
        console.error('Error creating transform table:', error);
        return;
      }
    }

    try {
      const updatedMetadata = await createFeatureGroup(currentMetadata, {
        name: groupForm.name.trim(),
        description: groupForm.description.trim(),
        keyColumn: groupForm.keyColumn.trim(),
        transformTableId: transformTableId,
        features: []
      });

      setMetadata(updatedMetadata);
      setShowCreateGroupDialog(false);
      resetGroupForm();
    } catch (error) {
      console.error('Failed to create feature group:', error);
    }
  };

  const handleCreateFeature = async () => {
    if (!selectedGroupForFeature || !isFeatureValid()) return;

    // Check for duplicate feature name
    const excludeId = isEditMode && editingFeature ? editingFeature.feature.id : undefined;
    const duplicateError = checkFeatureNameDuplicate(featureForm.name, selectedGroupForFeature, excludeId);
    if (duplicateError) {
      setFeatureNameError(duplicateError);
      return;
    }

    try {
      let updatedMetadata;

      if (isEditMode && editingFeature) {
        // Edit existing feature
        const featureUpdate = {
          name: featureForm.name.trim(),
          dataType: featureForm.dataType,
          description: featureForm.description.trim(),
          featureType: (featureForm.isDynamic ? 'Real Time' : 'Calculated') as 'Calculated' | 'Real Time' | 'Direct',
          mapped_column: featureForm.mapped_column.trim(),
          transformationLogic: featureForm.transformationLogic.trim(),
          transformation: featureForm.transformationLogic.trim()
        };

        updatedMetadata = await updateFeatureInGroup(metadata, editingFeature.group.id, editingFeature.feature.id, featureUpdate);

        // Find the feature group to get the associated transform table ID
        const featureGroup = updatedMetadata.featureGroups.find(group => group.id === editingFeature.group.id);
        if (featureGroup && featureGroup.transformTableId) {
          // Update corresponding column in the transformed table
          // Use the original mapped_column as the identifier and update with new values
          const originalMappedColumn = editingFeature.feature.mapped_column;
          const columnUpdates: Partial<ColumnMeta> = {
            name: featureForm.mapped_column.trim(),
            dataType: featureForm.dataType,
            description: featureForm.description.trim()
          };

          updatedMetadata = await updateColumnInTable(updatedMetadata, featureGroup.transformTableId, originalMappedColumn, columnUpdates);
        }
      } else {
        // Create new feature
        const featureData = {
          name: featureForm.name.trim(),
          dataType: featureForm.dataType,
          description: featureForm.description.trim(),
          featureType: (featureForm.isDynamic ? 'Real Time' : 'Calculated') as 'Calculated' | 'Real Time' | 'Direct',
          mapped_column: featureForm.mapped_column.trim(),
          transformationLogic: featureForm.transformationLogic.trim(),
          transformation: featureForm.transformationLogic.trim()
        };

        // Add feature to group
        updatedMetadata = await addFeatureToGroup(metadata, selectedGroupForFeature, featureData);

        // Find the feature group to get the associated transform table ID
        const featureGroup = updatedMetadata.featureGroups.find(group => group.id === selectedGroupForFeature);
        if (featureGroup && featureGroup.transformTableId) {
          // Create corresponding column in the transformed table
          const columnData: ColumnMeta = {
            name: featureForm.mapped_column.trim(),
            dataType: featureForm.dataType,
            description: featureForm.description.trim()
          };

          updatedMetadata = await addColumnToTable(updatedMetadata, featureGroup.transformTableId, columnData);
        }
      }

      setMetadata(updatedMetadata);
      setShowCreateFeatureDialog(false);
      resetFeatureForm();
      setSelectedGroupForFeature(null);
      setIsEditMode(false);
      setEditingFeature(null);
    } catch (error) {
      console.error('Failed to save feature:', error);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    try {
      const updatedMetadata = await deleteFeatureGroup(metadata, groupId);
      setMetadata(updatedMetadata);
      setShowDeleteGroupDialog(null);
    } catch (error) {
      console.error('Failed to delete feature group:', error);
    }
  };

  const handleDeleteFeature = async () => {
    if (!showDeleteFeatureDialog) return;

    try {
      const { feature, group } = showDeleteFeatureDialog;

      // Delete the feature from the group
      const updatedMetadata = await deleteFeatureFromGroup(metadata, group.id, feature.id);

      // Find the feature group to get the associated transform table ID
      const featureGroup = group;
      if (featureGroup && featureGroup.transformTableId) {
        // Delete corresponding column from the transformed table
        const finalMetadata = await deleteColumnFromTable(updatedMetadata, featureGroup.transformTableId, feature.mapped_column);
        setMetadata(finalMetadata);
      } else {
        setMetadata(updatedMetadata);
      }

      setShowDeleteFeatureDialog(null);

      // Close feature overlay if we're viewing the deleted feature
      if (featureOverlay && featureOverlay.feature.id === feature.id) {
        setFeatureOverlay(null);
      }
    } catch (error) {
      console.error('Failed to delete feature:', error);
    }
  };

  const handleEditFeature = (editData: { feature: FeatureMeta; group: FeatureGroup }) => {
    const { feature, group } = editData;

    // Set edit mode and store editing feature
    setIsEditMode(true);
    setEditingFeature(editData);

    // Populate the form with existing feature data
    setFeatureForm({
      name: feature.name,
      dataType: feature.dataType,
      description: feature.description,
      featureType: feature.featureType || 'Calculated',
      mapped_column: feature.mapped_column,
      transformationLogic: feature.transformationLogic || '',
      isDynamic: feature.featureType === 'Real Time',
      sourceTableId: '',
      transformationLanguage: 'SQL'
    });

    // Set up edit mode for Direct features
    if (feature.featureType === 'Direct' && feature.transformation) {
      // Parse transformation to get source table and column
      const transformationMatch = feature.transformation.match(/Source: (.+?), Column: (.+)/);
      if (transformationMatch) {
        const [, tableName, columnName] = transformationMatch;
        const sourceTable = metadata.transformedTables.find(t => t.name === tableName);
        if (sourceTable) {
          setSelectedSourceTable(sourceTable.id);
          // For edit mode, set single column selection
          setSelectedColumns([columnName]);
          setFeatureCreationType('direct');
        }
      }
    } else {
      setFeatureCreationType('calculated');
    }

    setSelectedGroupForFeature(group.id);
    setShowCreateFeatureDialog(true);
  };

  const isFeatureValid = () => {
    if (!(featureForm.name && featureForm.dataType && featureForm.description)) return false;

    if (!featureForm.mapped_column) return false;

    // Both calculated and real time features now require transformation logic
    if (!featureForm.transformationLogic.trim()) return false;

    // Validation is required for both types
    return !!(logicValidated && !logicError);
  };  const validatePythonLogic = (code: string): string | null => {
    if (!code.trim()) return 'Logic is required.';
    if (/[<>]/.test(code)) return 'Angle brackets not allowed.';

    const pairs: Array<[string,string]> = [['(',')'],['[',']'],['{','}']];
    for (const [o,c] of pairs) {
      let bal = 0;
      for (const ch of code) {
        if (ch === o) bal++;
        else if (ch === c) bal--;
        if (bal < 0) return `Unbalanced ${o}${c} pair.`;
      }
      if (bal !== 0) return `Unbalanced ${o}${c} pair.`;
    }

    const single = (code.match(/(?<!\\)'/g) || []).length;
    const double = (code.match(/(?<!\\)"/g) || []).length;
    if (single % 2 !== 0) return 'Unmatched single quote.';
    if (double % 2 !== 0) return 'Unmatched double quote.';

    if (!/(?:return|lambda|if |for |while |=|\+|-|\*|\/)/.test(code)) {
      if (!/^[a-zA-Z_][a-zA-Z0-9_.]*$/.test(code.trim())) {
        return 'Provide a valid Python expression or block.';
      }
    }
    return null;
  };

  const handleValidateLogic = () => {
    const err = validatePythonLogic(featureForm.transformationLogic);
    setLogicError(err);
    setLogicValidated(!err);
  };

  // Duplicate validation functions
  const checkFeatureGroupNameDuplicate = (name: string, excludeId?: string): string | null => {
    const trimmedName = name.trim();
    if (!trimmedName) return null;

    const existing = metadata.featureGroups.find(group =>
      group.name.toLowerCase() === trimmedName.toLowerCase() && group.id !== excludeId
    );
    return existing ? `Feature group "${trimmedName}" already exists` : null;
  };

  const checkFeatureNameDuplicate = (name: string, groupId: string, excludeId?: string): string | null => {
    const trimmedName = name.trim();
    if (!trimmedName) return null;

    const group = metadata.featureGroups.find(g => g.id === groupId);
    if (!group) return null;

    const existing = group.features.find(feature =>
      feature.name.toLowerCase() === trimmedName.toLowerCase() && feature.id !== excludeId
    );
    return existing ? `Feature "${trimmedName}" already exists in this group` : null;
  };

  const checkTransformedTableNameDuplicate = (name: string, excludeId?: string): string | null => {
    const trimmedName = name.trim();
    if (!trimmedName) return null;

    const existing = metadata.transformedTables.find(table =>
      table.name.toLowerCase() === trimmedName.toLowerCase() && table.id !== excludeId
    );
    return existing ? `Transformed table "${trimmedName}" already exists` : null;
  };

  const checkColumnNameDuplicate = (name: string, tableId: string, excludeName?: string): string | null => {
    const trimmedName = name.trim();
    if (!trimmedName) return null;

    const table = metadata.transformedTables.find(t => t.id === tableId);
    if (!table) return null;

    const existing = table.columns.find(column =>
      column.name.toLowerCase() === trimmedName.toLowerCase() && column.name !== excludeName
    );
    return existing ? `Column "${trimmedName}" already exists in this table` : null;
  };

  // Transform table name helper function
  const createTableNameFromGroupName = (groupName: string): string => {
    return groupName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  };

  // Handler for creating new transform table from group name
  const handleCreateNewTransformTable = async (groupName: string): Promise<string> => {
    const tableName = createTableNameFromGroupName(groupName);

    try {
      const updatedMetadata = await createTransformedTable(metadata, {
        name: tableName,
        description: `Transformed table for ${groupName} feature group`,
        columns: []
      });

      setMetadata(updatedMetadata);

      // Find the newly created table and return its ID
      const newTable = updatedMetadata.transformedTables.find(t => t.name === tableName);
      return newTable?.id || '';
    } catch (error) {
      console.error('Error creating transform table:', error);
      return '';
    }
  };

  const toSentenceCase = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const handleSourceColumnSelect = (val: string) => {
    setSourceColumnChoice(val);
    if (val === 'create-new') {
      setFeatureForm(f => ({
        ...f,
        name: '',
        mapped_column: '',
        dataType: 'text'
      }));
    } else if (val) {
      const selectedGroup = metadata.featureGroups.find(g => g.id === selectedGroupForFeature);
      const transformTable = selectedGroup ? getTransformedTableById(metadata.transformedTables, selectedGroup.transformTableId) : null;
      const columnInfo = transformTable?.columns.find(col => col.name === val);

      const sentenceName = toSentenceCase(val);
      setFeatureForm(f => ({
        ...f,
        name: sentenceName,
        mapped_column: val,
        dataType: columnInfo?.dataType || 'text'
      }));
    }
  };

  const openCreateFeature = (groupId: string) => {
    setSelectedGroupForFeature(groupId);
    resetFeatureForm();
    setShowCreateFeatureDialog(true);
    // Close group overlay if open
    setGroupOverlay(null);
  };

  const openGlobalCreateFeature = () => {
    setSelectedGroupForFeature(null);
    setFeatureCreationType(null);
    setSelectedSourceTable('');
    setSelectedColumns([]);
    resetFeatureForm();
    setShowCreateFeatureDialog(true);
  };

  const openGroupCreateFeature = (groupId: string) => {
    setSelectedGroupForFeature(groupId);
    setShowCreateFeatureDialog(true);
  };

  // Helper function to generate feature name from column name
  const generateFeatureName = (columnName: string): string => {
    return columnName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Handle column selection for direct features
  const handleColumnToggle = (columnName: string) => {
    setSelectedColumns(prev =>
      prev.includes(columnName)
        ? prev.filter(col => col !== columnName)
        : [...prev, columnName]
    );
  };

  // Handle creating multiple direct features from selected columns
  const handleCreateDirectFeatures = async () => {
    if (!selectedGroupForFeature || !selectedSourceTable || selectedColumns.length === 0) return;

    try {
      const sourceTable = getTransformedTableById(metadata.transformedTables, selectedSourceTable);
      if (!sourceTable) return;

      let updatedMetadata = metadata;
      const duplicateFeatures = [];

      // Check for duplicate feature names first
      for (const columnName of selectedColumns) {
        const featureName = generateFeatureName(columnName);
        const duplicateError = checkFeatureNameDuplicate(featureName, selectedGroupForFeature);
        if (duplicateError) {
          duplicateFeatures.push(`${featureName} (from ${columnName})`);
        }
      }

      // If any duplicates found, show error and stop
      if (duplicateFeatures.length > 0) {
        setFeatureNameError(`The following features already exist: ${duplicateFeatures.join(', ')}`);
        return;
      }

      // Create a feature for each selected column
      for (const columnName of selectedColumns) {
        const column = sourceTable.columns.find(col => col.name === columnName);
        if (!column) continue;

        const featureName = generateFeatureName(columnName);
        const transformation = `Source: ${sourceTable.name}, Column: ${columnName}`;

        const featureData = {
          name: featureName,
          dataType: column.dataType,
          description: column.description || `Direct mapping from ${columnName}`,
          featureType: 'Direct' as 'Calculated' | 'Real Time' | 'Direct',
          transformation,
          mapped_column: columnName
        };

        // Add feature to group
        updatedMetadata = await addFeatureToGroup(updatedMetadata, selectedGroupForFeature, featureData);

        // Find the feature group to get the associated transform table ID
        const featureGroup = updatedMetadata.featureGroups.find(group => group.id === selectedGroupForFeature);
        if (featureGroup && featureGroup.transformTableId) {
          // Create corresponding column in the transformed table
          const columnData: ColumnMeta = {
            name: columnName,
            dataType: column.dataType,
            description: column.description || `Direct mapping from ${columnName}`
          };

          updatedMetadata = await addColumnToTable(updatedMetadata, featureGroup.transformTableId, columnData);
        }
      }

      setMetadata(updatedMetadata);
      setShowCreateFeatureDialog(false);
      resetFeatureForm();
      setSelectedGroupForFeature(null);
      setFeatureCreationType(null);
      setSelectedSourceTable('');
      setSelectedColumns([]);
    } catch (error) {
      console.error('Failed to create direct features:', error);
    }
  };

  // Flatten all features for the Features view
  const allFeaturesFlat = metadata.featureGroups.flatMap(group =>
    group.features.map(feat => ({
      group: group.name,
      groupId: group.id,
      transformTable: getTransformedTableById(metadata.transformedTables, group.transformTableId)?.name || 'Unknown',
      keyColumn: group.keyColumn,
      ...feat
    }))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{viewMode === 'groups' ? 'Feature Groups' : 'Features'}</h1>
          <p className="text-muted-foreground text-sm">
            {viewMode === 'groups' ? 'Catalog of reusable, versioned feature groups for ML.' : 'All features across groups with details.'}
          </p>
        </div>
        <div className="flex items-start gap-4">
          <div className="inline-flex rounded-md border bg-muted p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('groups')}
              className={`px-3 py-1 rounded-sm font-medium transition-colors ${viewMode === 'groups' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >Groups</button>
            <button
              type="button"
              onClick={() => setViewMode('features')}
              className={`px-3 py-1 rounded-sm font-medium transition-colors ${viewMode === 'features' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >Features</button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              forceMetadataRefresh();
              const data = await loadMetadata();
              setMetadata(data);
            }}
            className="text-xs"
            title="Refresh data display (preserves your features)"
          >
            Refresh Data
          </Button>
          {viewMode === 'groups' && (
            <Dialog open={showCreateGroupDialog} onOpenChange={setShowCreateGroupDialog}>
              <DialogTrigger asChild>
                <Button className="self-start">Create Feature Group</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Feature Group</DialogTitle>
                  <DialogDescription>Register a new feature group definition.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Transform Table</label>
                    <Select
                      value={groupForm.transformTableId}
                      onValueChange={(v) => {
                        setGroupForm(f => ({ ...f, transformTableId: v }));
                      }}
                      defaultValue="CREATE_NEW"
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="+ Create New Transform Table" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CREATE_NEW" className="text-blue-600 font-medium">
                          + Create New Transform Table
                          {groupForm.name.trim() && (
                            <span className="text-xs text-muted-foreground ml-1">
                              ({createTableNameFromGroupName(groupForm.name)})
                            </span>
                          )}
                        </SelectItem>
                        {metadata.transformedTables.map(table => (
                          <SelectItem key={table.id} value={table.id}>{table.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Name</label>
                    <Input
                      value={groupForm.name}
                      onChange={e => {
                        const value = e.target.value;
                        setGroupForm(f => ({ ...f, name: value }));
                        // Clear error when user starts typing
                        if (groupNameError) setGroupNameError(null);
                      }}
                      onBlur={() => {
                        // Check for duplicates when user leaves the field
                        const error = checkFeatureGroupNameDuplicate(groupForm.name);
                        setGroupNameError(error);
                      }}
                      placeholder="e.g. User Behavior Metrics"
                      className={groupNameError ? "border-red-500" : ""}
                    />
                    {groupNameError && (
                      <p className="text-xs text-red-600">{groupNameError}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Description</label>
                    <Textarea rows={3} value={groupForm.description} onChange={e => setGroupForm(f => ({ ...f, description: e.target.value }))} placeholder="Short description of the feature group" className="text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Key Column</label>
                    <Input value={groupForm.keyColumn} onChange={e => setGroupForm(f => ({ ...f, keyColumn: e.target.value }))} placeholder="e.g. user_id" />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={() => setShowCreateGroupDialog(false)} size="sm">Cancel</Button>
                    <Button size="sm" onClick={handleCreateGroup} disabled={!groupForm.name.trim() || !!groupNameError}>Create</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
          {viewMode === 'features' && (
            <Button
              className="self-start"
              onClick={() => setShowCreateFeatureDialog(true)}
            >
              Create Feature
            </Button>
          )}
        </div>
      </div>

      {/* CreateFeatureDialog - Always available regardless of view mode */}
      <CreateFeatureDialog
        open={showCreateFeatureDialog}
        onOpenChange={setShowCreateFeatureDialog}
        metadata={metadata}
        onMetadataUpdate={setMetadata}
        selectedGroup={selectedGroupForFeature}
      />

      {viewMode === 'groups' && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {metadata.featureGroups.map(group => {
            const transformTable = getTransformedTableById(metadata.transformedTables, group.transformTableId);
            return (
              <Card key={group.id} className="transition-shadow flex flex-col hover:shadow-md cursor-pointer" onClick={() => openGroupOverlay(group)}>
                <div className="text-left w-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0">
                        <CardTitle className="text-base font-semibold break-all flex items-center gap-2">
                          <span>{group.name}</span>
                          <span className="text-[10px] font-normal text-muted-foreground">Click for details</span>
                        </CardTitle>
                        <CardDescription className="text-xs line-clamp-3 leading-relaxed">
                          {group.description}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className="shrink-0">{group.features.length} {group.features.length === 1 ? 'feature' : 'features'}</Badge>
                    </div>
                  </CardHeader>
                </div>
                <CardContent className="text-xs text-muted-foreground grid grid-cols-2 gap-x-4 gap-y-2">
                  <div>
                    <div className="font-medium text-foreground/80 text-[11px] tracking-wide uppercase">Key Column</div>
                    <div className="font-mono text-[11px]">{group.keyColumn}</div>
                  </div>
                  <div>
                    <div className="font-medium text-foreground/80 text-[11px] tracking-wide uppercase">Transform Table</div>
                    <div className="font-mono text-[11px]">{transformTable?.name || 'Unknown'}</div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {viewMode === 'features' && (
        <div className="space-y-3">
          <div className="text-[11px] text-muted-foreground">{allFeaturesFlat.length} feature{allFeaturesFlat.length === 1 ? '' : 's'}</div>
          <div className="border rounded-md overflow-auto max-h-[70vh]">
            <table className="w-full min-w-[860px] text-[11px]">
              <thead className="bg-muted/50 text-[10px] uppercase tracking-wide">
                <tr className="text-left">
                  <th className="px-2 py-1 font-medium">Feature Name</th>
                  <th className="px-2 py-1 font-medium">Description</th>
                  <th className="px-2 py-1 font-medium">Data Type</th>
                  <th className="px-2 py-1 font-medium">Feature Type</th>
                  <th className="px-2 py-1 font-medium">Group</th>
                  <th className="px-2 py-1 font-medium">Transform Table</th>
                  <th className="px-2 py-1 font-medium">Key Column</th>
                  <th className="px-2 py-1 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {allFeaturesFlat.map(f => {
                  const group = metadata.featureGroups.find(g => g.id === f.groupId);
                  return (
                    <tr key={`${f.groupId}::${f.id}`} className="border-t hover:bg-muted/40">
                      <td className="px-2 py-1 font-mono text-[10px] cursor-pointer" onClick={() => {
                        if (group) setFeatureOverlay({ group, feature: f });
                      }}>{f.name}</td>
                      <td className="px-2 py-1 max-w-[320px] truncate cursor-pointer" title={f.description} onClick={() => {
                        if (group) setFeatureOverlay({ group, feature: f });
                      }}>{f.description}</td>
                      <td className="px-2 py-1 cursor-pointer" onClick={() => {
                        if (group) setFeatureOverlay({ group, feature: f });
                      }}>{f.dataType}</td>
                      <td className="px-2 py-1 cursor-pointer" onClick={() => {
                        if (group) setFeatureOverlay({ group, feature: f });
                      }}>
                        <span className={`inline-flex items-center rounded px-1.5 py-0.5 border text-[10px] ${
                          f.featureType === 'Calculated' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          f.featureType === 'Direct' ? 'bg-green-50 text-green-700 border-green-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>{f.featureType}</span>
                      </td>
                      <td className="px-2 py-1 font-mono text-[10px] cursor-pointer" onClick={() => {
                        if (group) setFeatureOverlay({ group, feature: f });
                      }}>{f.group}</td>
                      <td className="px-2 py-1 font-mono text-[10px] cursor-pointer" onClick={() => {
                        if (group) setFeatureOverlay({ group, feature: f });
                      }}>{f.transformTable}</td>
                      <td className="px-2 py-1 font-mono text-[10px] cursor-pointer" onClick={() => {
                        if (group) setFeatureOverlay({ group, feature: f });
                      }}>{f.keyColumn}</td>
                      <td className="px-2 py-1">
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-[10px]"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (group) {
                                handleEditFeature({ feature: f, group });
                              }
                            }}
                          >
                            ✏️
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-[10px] text-red-600 hover:text-red-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (group) {
                                setShowDeleteFeatureDialog({ feature: f, group });
                              }
                            }}
                          >
                            🗑️
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!allFeaturesFlat.length && (
                  <tr>
                    <td colSpan={8} className="px-2 py-6 text-center text-muted-foreground">No features available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {metadata.featureGroups.length === 0 && viewMode === 'groups' && (
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2">No Feature Groups</h3>
            <p className="text-muted-foreground text-sm mb-4">Get started by creating your first feature group.</p>
            <Button onClick={() => setShowCreateGroupDialog(true)}>Create Feature Group</Button>
          </CardContent>
        </Card>
      )}

      {/* Group Overlay */}
      {groupOverlay && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setGroupOverlay(null)} />
          <div className="absolute top-0 right-0 h-full w-[75vw] max-w-[1200px] bg-background border-l shadow-xl flex flex-col animate-in slide-in-from-right">
            <div className="px-6 py-4 border-b flex items-center justify-between bg-muted/40">
              <div>
                <h2 className="text-lg font-semibold">Feature Group: {groupOverlay.name}</h2>
                <p className="text-xs text-muted-foreground">
                  {groupOverlay.features.length} feature{groupOverlay.features.length === 1 ? '' : 's'} • Key: {groupOverlay.keyColumn}
                </p>
              </div>
              <button onClick={() => setGroupOverlay(null)} className="p-2 rounded-md hover:bg-muted text-muted-foreground">Close</button>
            </div>
            <div className="flex-1 overflow-auto p-6 space-y-6 text-sm">
              <section className="space-y-2">
                <h3 className="font-medium text-foreground/80">Overview</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div><div className="text-muted-foreground">Name</div><div className="font-mono text-[11px]">{groupOverlay.name}</div></div>
                  <div><div className="text-muted-foreground">Key Column</div><div className="font-mono text-[11px]">{groupOverlay.keyColumn}</div></div>
                  <div><div className="text-muted-foreground">Transform Table</div><div className="font-mono text-[11px]">{getTransformedTableById(metadata.transformedTables, groupOverlay.transformTableId)?.name || 'Unknown'}</div></div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Description</div>
                  <p className="text-xs leading-relaxed max-w-prose">{groupOverlay.description}</p>
                </div>
              </section>

              <section className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-foreground/80">Features ({groupOverlay.features.length})</h3>
                  <Button size="sm" onClick={() => openGroupCreateFeature(groupOverlay.id)}>New Feature</Button>
                </div>

                {groupOverlay.features.length > 0 ? (
                  <div className="border rounded-md overflow-auto max-h-96">
                    <table className="w-full text-[11px]">
                      <thead className="bg-muted/50 text-[10px] uppercase tracking-wide">
                        <tr className="text-left">
                          <th className="px-3 py-2 font-medium">Name</th>
                          <th className="px-3 py-2 font-medium">Description</th>
                          <th className="px-3 py-2 font-medium">Data Type</th>
                          <th className="px-3 py-2 font-medium">Feature Type</th>
                          <th className="px-3 py-2 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupOverlay.features.map(feat => (
                          <tr key={feat.id} className="border-t hover:bg-muted/40">
                            <td className="px-3 py-2 font-mono text-[10px] cursor-pointer" onClick={() => setFeatureOverlay({ group: groupOverlay, feature: feat })}>{feat.name}</td>
                            <td className="px-3 py-2 max-w-[280px] truncate cursor-pointer" title={feat.description} onClick={() => setFeatureOverlay({ group: groupOverlay, feature: feat })}>{feat.description}</td>
                            <td className="px-3 py-2 cursor-pointer" onClick={() => setFeatureOverlay({ group: groupOverlay, feature: feat })}>{feat.dataType}</td>
                            <td className="px-3 py-2 cursor-pointer" onClick={() => setFeatureOverlay({ group: groupOverlay, feature: feat })}>
                              <span className={`inline-flex items-center rounded px-1.5 py-0.5 border text-[10px] ${feat.featureType === 'Calculated' ? 'bg-blue-50 text-blue-700 border-blue-200' : feat.featureType === 'Direct' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{feat.featureType}</span>
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 text-[10px]"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditFeature({ feature: feat, group: groupOverlay });
                                  }}
                                >
                                  ✏️
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 text-[10px] text-red-600 hover:text-red-700"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowDeleteFeatureDialog({ feature: feat, group: groupOverlay });
                                  }}
                                >
                                  🗑️
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="border rounded-md p-8 text-center text-muted-foreground">
                    <p className="text-sm mb-3">No features in this group yet</p>
                    <Button variant="outline" size="sm" onClick={() => openCreateFeature(groupOverlay.id)}>Create First Feature</Button>
                  </div>
                )}
              </section>

              <section className="space-y-2">
                <h3 className="font-medium text-foreground/80">Transform Table Details</h3>
                <div className="border rounded-md p-3 bg-muted/20">
                  <div className="text-xs">
                    <div className="font-medium mb-2">{getTransformedTableById(metadata.transformedTables, groupOverlay.transformTableId)?.name || 'Unknown Table'}</div>
                    <div className="text-muted-foreground">
                      {(() => {
                        const table = getTransformedTableById(metadata.transformedTables, groupOverlay.transformTableId);
                        return table ? `${table.columns.length} columns available` : 'Table not found';
                      })()}
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* Feature Overlay */}
      {featureOverlay && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setFeatureOverlay(null)} />
          <div className="absolute top-0 right-0 h-full w-[75vw] max-w-[1200px] bg-background border-l shadow-xl flex flex-col animate-in slide-in-from-right">
            <div className="px-6 py-4 border-b flex items-center justify-between bg-muted/40">
              <div>
                <h2 className="text-lg font-semibold">Feature: {featureOverlay.feature.name}</h2>
                <p className="text-xs text-muted-foreground">Group: {featureOverlay.group.name}</p>
              </div>
              <button onClick={() => setFeatureOverlay(null)} className="p-2 rounded-md hover:bg-muted text-muted-foreground">Close</button>
            </div>
            <div className="flex-1 overflow-auto p-6 space-y-6 text-sm">
              <section className="space-y-2">
                <h3 className="font-medium text-foreground/80">Overview</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div><div className="text-muted-foreground">Name</div><div className="font-mono text-[11px]">{featureOverlay.feature.name}</div></div>
                  <div><div className="text-muted-foreground">Mapped Column</div><div className="font-mono text-[11px]">{featureOverlay.feature.mapped_column}</div></div>
                  <div><div className="text-muted-foreground">Data Type</div><div className="font-medium">{featureOverlay.feature.dataType}</div></div>
                  <div><div className="text-muted-foreground">Feature Type</div><div><span className={`inline-flex items-center rounded px-2 py-0.5 border text-[10px] ${featureOverlay.feature.featureType === 'Calculated' ? 'bg-blue-50 text-blue-700 border-blue-200' : featureOverlay.feature.featureType === 'Direct' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{featureOverlay.feature.featureType}</span></div></div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Description</div>
                  <p className="text-xs leading-relaxed max-w-prose">{featureOverlay.feature.description}</p>
                </div>
                {featureOverlay.feature.transformation && (
                  <div>
                    <div className="text-muted-foreground mb-1">Transformation</div>
                    <p className="text-xs leading-relaxed max-w-prose font-mono bg-muted/50 rounded px-2 py-1">{featureOverlay.feature.transformation}</p>
                  </div>
                )}
              </section>
              <section className="space-y-2">
                <h3 className="font-medium text-foreground/80">Lineage</h3>
                <div className="text-xs border rounded-md p-3">
                  {featureOverlay.feature.transformation ? (
                    <div className="space-y-2">
                      <div className="text-muted-foreground">Source Transformation:</div>
                      <div className="font-mono bg-muted/50 rounded px-2 py-1">{featureOverlay.feature.transformation}</div>
                    </div>
                  ) : (
                    <div className="text-muted-foreground">No transformation defined for this feature.</div>
                  )}
                </div>
              </section>
              <section className="space-y-2">
                <h3 className="font-medium text-foreground/80">Sample Values (placeholder)</h3>
                <div className="text-xs text-muted-foreground border rounded-md p-3 grid grid-cols-6 gap-2 font-mono">
                  <span>12</span><span>18</span><span>7</span><span>21</span><span>16</span><span>9</span>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* Delete Feature Dialog */}
      <AlertDialog open={!!showDeleteFeatureDialog} onOpenChange={() => setShowDeleteFeatureDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Feature</AlertDialogTitle>
            <AlertDialogDescription>
              {showDeleteFeatureDialog && (
                <>
                  Are you sure you want to delete the feature <strong>"{showDeleteFeatureDialog.feature.name}"</strong> from the group <strong>"{showDeleteFeatureDialog.group.name}"</strong>?
                  <br /><br />
                  This action cannot be undone and will permanently remove this feature and all its associated data.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteFeature}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Feature
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Group Dialog */}
      <AlertDialog open={!!showDeleteGroupDialog} onOpenChange={() => setShowDeleteGroupDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Feature Group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this feature group? This action cannot be undone and will remove all features in this group.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => showDeleteGroupDialog && handleDeleteGroup(showDeleteGroupDialog)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Group
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}