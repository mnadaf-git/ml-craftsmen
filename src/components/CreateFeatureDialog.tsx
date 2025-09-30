import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  loadMetadata,
  addFeatureToGroup,
  addColumnToTable,
  type MetadataStore,
  type FeatureGroup,
  type FeatureMeta,
  type TransformedTable,
  type ColumnMeta
} from "@/lib/metadata";

interface CreateFeatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFeatureCreated?: (feature: FeatureMeta, groupId: string) => void;
  triggerButton?: React.ReactNode;
  selectedGroup?: string; // Optional pre-selected feature group
  metadata?: MetadataStore; // Optional metadata if already loaded
  onMetadataUpdate?: (metadata: MetadataStore) => void; // Callback when metadata changes
}

export default function CreateFeatureDialog({
  open,
  onOpenChange,
  onFeatureCreated,
  triggerButton,
  selectedGroup,
  metadata: externalMetadata,
  onMetadataUpdate
}: CreateFeatureDialogProps) {
  const { toast } = useToast();
  const [internalMetadata, setInternalMetadata] = useState<MetadataStore>({ transformedTables: [], featureGroups: [] });

  // Use external metadata if provided, otherwise use internal
  const metadata = externalMetadata || internalMetadata;

  // State for the dialog flow
  const [selectedGroupForFeature, setSelectedGroupForFeature] = useState<string | null>(selectedGroup || null);
  const [featureCreationType, setFeatureCreationType] = useState<'direct' | 'calculated' | null>(null);
  const [selectedSourceTable, setSelectedSourceTable] = useState<string>('');
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);

  // Feature form state
  const [featureForm, setFeatureForm] = useState({
    name: '',
    dataType: 'text' as 'text' | 'int' | 'float' | 'datetime',
    description: '',
    featureType: 'Calculated' as 'Calculated' | 'Dynamic' | 'Direct',
    mapped_column: '',
    transformationLogic: '',
    isDynamic: false,
    sourceTableId: '',
    transformationLanguage: 'SQL' as 'SQL' | 'Python'
  });

  const [logicValidated, setLogicValidated] = useState(false);
  const [logicError, setLogicError] = useState<string | null>(null);
  const [featureNameError, setFeatureNameError] = useState<string | null>(null);

  // Load metadata on mount if not provided externally
  useEffect(() => {
    if (!externalMetadata) {
      loadMetadata()
        .then(setInternalMetadata)
        .catch(error => {
          console.error('Failed to load metadata:', error);
          // Set empty metadata as fallback
          setInternalMetadata({ transformedTables: [], featureGroups: [] });
        });
    }
  }, [externalMetadata]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      if (selectedGroup) {
        setSelectedGroupForFeature(selectedGroup);
        setFeatureCreationType(null);
      } else {
        setSelectedGroupForFeature(null);
        setFeatureCreationType(null);
      }
    } else {
      resetForm();
    }
  }, [open, selectedGroup]);

  const resetForm = () => {
    setSelectedGroupForFeature(selectedGroup || null);
    setFeatureCreationType(null);
    setSelectedSourceTable('');
    setSelectedColumns([]);
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
    setFeatureNameError(null);
  };

  // Validation functions
  const checkFeatureNameDuplicate = (name: string, groupId: string, excludeId?: string): string | null => {
    if (!name.trim()) return null;

    const group = metadata.featureGroups.find(g => g.id === groupId);
    if (!group) return null;

    const duplicate = group.features.find(f =>
      f.name.toLowerCase() === name.toLowerCase() && f.id !== excludeId
    );

    return duplicate ? 'A feature with this name already exists in this group' : null;
  };

  const validateLogic = (logic: string, language: 'SQL' | 'Python'): string | null => {
    if (!logic.trim()) return 'Logic is required.';

    if (language === 'Python') {
      // Basic Python validation
      const pairs: Array<[string,string]> = [['(',')'],['[',']'],['{','}']];
      for (const [o,c] of pairs) {
        let bal = 0;
        for (const ch of logic) {
          if (ch === o) bal++;
          else if (ch === c) bal--;
          if (bal < 0) return `Unbalanced ${o}${c} pair.`;
        }
        if (bal !== 0) return `Unbalanced ${o}${c} pair.`;
      }
    }

    return null;
  };

  const handleValidateLogic = () => {
    const error = validateLogic(featureForm.transformationLogic, featureForm.transformationLanguage);
    setLogicError(error);
    setLogicValidated(!error);
  };

  const isFeatureValid = (): boolean => {
    if (!(featureForm.name && featureForm.dataType && featureForm.description)) return false;
    if ((featureForm.isDynamic || featureForm.featureType === 'Dynamic') && !featureForm.transformationLogic.trim()) return false;
    return true;
  };

  const generateFeatureName = (columnName: string): string => {
    return columnName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleCreateFeature = async () => {
    if (!selectedGroupForFeature || !isFeatureValid() || featureNameError) return;

    try {
      // Validate feature name for duplicates
      const duplicateError = checkFeatureNameDuplicate(featureForm.name, selectedGroupForFeature);
      if (duplicateError) {
        setFeatureNameError(duplicateError);
        return;
      }

      const featureData = {
        name: featureForm.name.trim(),
        dataType: featureForm.dataType,
        description: featureForm.description.trim(),
        featureType: (featureForm.isDynamic ? 'Dynamic' : 'Calculated') as 'Calculated' | 'Dynamic' | 'Direct',
        mapped_column: featureForm.mapped_column.trim(),
        transformationLogic: featureForm.transformationLogic.trim(),
        transformation: featureForm.transformationLogic.trim()
      };

      // Add feature to group
      let updatedMetadata = await addFeatureToGroup(metadata, selectedGroupForFeature, featureData);

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

      // Update metadata
      if (onMetadataUpdate) {
        onMetadataUpdate(updatedMetadata);
      } else {
        setInternalMetadata(updatedMetadata);
      }

      // Find the newly created feature
      const updatedGroup = updatedMetadata.featureGroups.find(g => g.id === selectedGroupForFeature);
      const newFeature = updatedGroup?.features[updatedGroup.features.length - 1];

      if (newFeature && onFeatureCreated) {
        onFeatureCreated(newFeature, selectedGroupForFeature);
      }

      toast({
        title: 'Success',
        description: 'Feature created successfully'
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create feature:', error);
      toast({
        title: 'Error',
        description: 'Failed to create feature',
        variant: 'destructive'
      });
    }
  };

  const handleCreateDirectFeatures = async () => {
    if (!selectedGroupForFeature || !selectedSourceTable || selectedColumns.length === 0) return;

    try {
      const sourceTable = metadata.transformedTables.find(t => t.id === selectedSourceTable);
      if (!sourceTable) return;

      let updatedMetadata = metadata;

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
          featureType: 'Direct' as 'Calculated' | 'Dynamic' | 'Direct',
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

      // Update metadata
      if (onMetadataUpdate) {
        onMetadataUpdate(updatedMetadata);
      } else {
        setInternalMetadata(updatedMetadata);
      }

      toast({
        title: 'Success',
        description: `${selectedColumns.length} direct features created successfully`
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create direct features:', error);
      toast({
        title: 'Error',
        description: 'Failed to create direct features',
        variant: 'destructive'
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {triggerButton && (
        <DialogTrigger asChild>
          {triggerButton}
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Feature</DialogTitle>
          <DialogDescription>
            {selectedGroupForFeature ? (
              featureCreationType ? (
                <>Create {featureCreationType} feature in {metadata.featureGroups?.find(g => g.id === selectedGroupForFeature)?.name}</>
              ) : (
                <>Add a new feature to {metadata.featureGroups?.find(g => g.id === selectedGroupForFeature)?.name}</>
              )
            ) : (
              <>Select a feature group and define the feature.</>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          {/* Step 1: Feature Group Selection */}
          {!selectedGroupForFeature && (
            <div className="space-y-1">
              <label className="text-xs font-medium">Feature Group</label>
              <Select value={selectedGroupForFeature || ''} onValueChange={v => setSelectedGroupForFeature(v)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select feature group" />
                </SelectTrigger>
                <SelectContent>
                  {metadata.featureGroups?.map(group => <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Step 2: Feature Type Selection */}
          {selectedGroupForFeature && !featureCreationType && (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium">Feature Type</label>
                <p className="text-[10px] text-muted-foreground">Choose how you want to create features</p>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => setFeatureCreationType('direct')}
                  className="p-4 border rounded-lg text-left hover:bg-muted/50 transition-colors"
                >
                  <div className="font-medium text-sm">Direct Feature</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Map columns directly from transformed tables. Select multiple columns to create multiple features.
                  </div>
                </button>
                <button
                  onClick={() => setFeatureCreationType('calculated')}
                  className="p-4 border rounded-lg text-left hover:bg-muted/50 transition-colors"
                >
                  <div className="font-medium text-sm">Calculated Feature</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Create a single feature with custom logic and transformations.
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Step 3a: Direct Feature Form */}
          {selectedGroupForFeature && featureCreationType === 'direct' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFeatureCreationType(null)}
                  className="text-xs"
                >
                  ← Back
                </Button>
                <div className="text-xs font-medium">Direct Feature Creation</div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Source Table</label>
                <Select value={selectedSourceTable} onValueChange={setSelectedSourceTable}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select source table" />
                  </SelectTrigger>
                  <SelectContent>
                    {metadata.transformedTables?.map(table => (
                      <SelectItem key={table.id} value={table.id}>{table.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedSourceTable && (
                <div className="space-y-1">
                  <label className="text-xs font-medium">Select Columns</label>
                  <p className="text-[10px] text-muted-foreground">Choose columns to create features from</p>
                  <div className="border rounded-md p-3 max-h-48 overflow-auto">
                    {(() => {
                      const table = metadata.transformedTables?.find(t => t.id === selectedSourceTable);
                      return table?.columns.map(column => (
                        <div key={column.name} className="flex items-center space-x-2 py-1">
                          <Checkbox
                            id={column.name}
                            checked={selectedColumns.includes(column.name)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedColumns(prev => [...prev, column.name]);
                              } else {
                                setSelectedColumns(prev => prev.filter(c => c !== column.name));
                              }
                            }}
                          />
                          <label htmlFor={column.name} className="text-xs cursor-pointer flex-1">
                            <span className="font-medium">{column.name}</span>
                            <span className="text-muted-foreground ml-2">({column.dataType})</span>
                            {column.description && <div className="text-[10px] text-muted-foreground">{column.description}</div>}
                          </label>
                        </div>
                      )) || [];
                    })()}
                  </div>
                  {selectedColumns.length > 0 && (
                    <p className="text-[10px] text-muted-foreground">
                      {selectedColumns.length} column(s) selected. This will create {selectedColumns.length} feature(s).
                    </p>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button size="sm" onClick={handleCreateDirectFeatures} disabled={!selectedSourceTable || selectedColumns.length === 0}>
                  Create {selectedColumns.length} Feature{selectedColumns.length !== 1 ? 's' : ''}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3b: Calculated Feature Form */}
          {selectedGroupForFeature && featureCreationType === 'calculated' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFeatureCreationType(null)}
                  className="text-xs"
                >
                  ← Back
                </Button>
                <div className="text-xs font-medium">Calculated Feature Creation</div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="dynamic"
                  checked={featureForm.isDynamic}
                  onCheckedChange={(checked) => {
                    const isChecked = checked === true;
                    setFeatureForm(f => ({
                      ...f,
                      isDynamic: isChecked,
                      featureType: isChecked ? 'Dynamic' : 'Calculated',
                      transformationLogic: isChecked ? f.transformationLogic : ''
                    }));
                    setLogicValidated(false);
                    setLogicError(null);
                  }}
                />
                <label htmlFor="dynamic" className="text-xs font-medium cursor-pointer">
                  Dynamic
                </label>
                <span className="text-xs text-muted-foreground ml-2">
                  {featureForm.isDynamic === true ? 'Dynamic feature with custom logic' : 'Calculated feature'}
                </span>
              </div>

              {featureForm.isDynamic === true && (
                <div className="space-y-1">
                  <label className="text-xs font-medium">Source Table</label>
                  <Select
                    value={featureForm.sourceTableId || ''}
                    onValueChange={v => setFeatureForm(f => ({ ...f, sourceTableId: v }))}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select source table" />
                    </SelectTrigger>
                    <SelectContent>
                      {metadata.transformedTables && metadata.transformedTables.map(table => (
                        <SelectItem key={table.id} value={table.id}>{table.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-medium">Feature Name</label>
                <Input
                  value={featureForm.name}
                  onChange={e => {
                    const name = e.target.value;
                    // Clear error when user starts typing
                    if (featureNameError) setFeatureNameError(null);

                    const mappedColumn = name.toLowerCase().replace(/\s+/g, '_');
                    setFeatureForm(f => ({
                      ...f,
                      name: name,
                      mapped_column: mappedColumn
                    }));
                  }}
                  onBlur={() => {
                    // Check for duplicates when user leaves the field
                    if (selectedGroupForFeature) {
                      const error = checkFeatureNameDuplicate(featureForm.name, selectedGroupForFeature);
                      setFeatureNameError(error);
                    }
                  }}
                  placeholder="Readable feature name"
                  className={featureNameError ? "border-red-500" : ""}
                />
                {featureNameError && (
                  <p className="text-xs text-red-600">{featureNameError}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Mapped Column</label>
                <Input
                  value={featureForm.mapped_column}
                  onChange={e => setFeatureForm(f => ({ ...f, mapped_column: e.target.value }))}
                  placeholder="e.g. change_lead_duration"
                  className="font-mono text-xs bg-muted"
                  disabled={true}
                />
                <p className="text-[10px] text-muted-foreground">Auto-generated from feature name (lowercase with underscores)</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Description</label>
                <Textarea rows={3} value={featureForm.description} onChange={e => setFeatureForm(f => ({ ...f, description: e.target.value }))} placeholder="Short description of the feature" className="text-xs" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Data Type</label>
                <Select value={featureForm.dataType} onValueChange={v => setFeatureForm(f => ({ ...f, dataType: v as any }))}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select data type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="int">int</SelectItem>
                    <SelectItem value="float">float</SelectItem>
                    <SelectItem value="datetime">datetime</SelectItem>
                    <SelectItem value="text">text</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-medium">SQL</span>
                  <Switch
                    checked={featureForm.transformationLanguage === 'Python'}
                    onCheckedChange={(checked) => {
                      setFeatureForm(f => ({ ...f, transformationLanguage: checked ? 'Python' : 'SQL' }));
                    }}
                  />
                  <span className="text-xs font-medium">Python</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium flex items-center justify-between">
                  Transformation Logic ({featureForm.transformationLanguage})
                  {logicValidated && !logicError && <span className="text-[10px] text-green-600">Validated</span>}
                </label>
                <Textarea
                  rows={5}
                  value={featureForm.transformationLogic}
                  onChange={e => {
                    setFeatureForm(f => ({ ...f, transformationLogic: e.target.value }));
                    setLogicValidated(false);
                    setLogicError(null);
                  }}
                  placeholder={featureForm.transformationLanguage === 'SQL'
                    ? "e.g. SELECT AVG(price) * 1.1 FROM products WHERE category = 'electronics'"
                    : "e.g. (risk_score / (avg_lead_time_hours + 1)) * 100"
                  }
                  className="font-mono text-[11px]"
                />
                {logicError && <p className="text-[10px] text-red-600">{logicError}</p>}
                {!logicError && logicValidated && <p className="text-[10px] text-green-600">Syntax looks good.</p>}
                {!logicValidated && !logicError && featureForm.transformationLogic && <p className="text-[10px] text-amber-600">Needs validation.</p>}

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={handleValidateLogic} disabled={!featureForm.transformationLogic.trim()} className="text-xs">
                    Validate Logic
                  </Button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button size="sm" onClick={handleCreateFeature} disabled={!selectedGroupForFeature || !isFeatureValid() || !!featureNameError}>
                  Create Feature
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}