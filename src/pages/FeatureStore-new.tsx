import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import {
  loadMetadata,
  createFeatureGroup,
  addFeatureToGroup,
  deleteFeatureGroup,
  deleteFeatureFromGroup,
  getTransformedTableById,
  type MetadataStore,
  type FeatureGroup,
  type FeatureMeta,
  type TransformedTable
} from "@/lib/metadata";

export default function FeatureStore() {
  const [metadata, setMetadata] = useState<MetadataStore>({ transformedTables: [], featureGroups: [] });
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'groups' | 'features'>('groups');
  const [showCreateGroupDialog, setShowCreateGroupDialog] = useState(false);
  const [showCreateFeatureDialog, setShowCreateFeatureDialog] = useState(false);
  const [showDeleteGroupDialog, setShowDeleteGroupDialog] = useState<string | null>(null);
  const [selectedGroupForFeature, setSelectedGroupForFeature] = useState<string | null>(null);
  const [sourceColumnChoice, setSourceColumnChoice] = useState<string>('');
  const [featureOverlay, setFeatureOverlay] = useState<{ group: FeatureGroup; feature: FeatureMeta } | null>(null);

  const [groupForm, setGroupForm] = useState({
    name: '',
    description: '',
    keyColumn: '',
    transformTableId: ''
  });

  const [featureForm, setFeatureForm] = useState({
    name: '',
    dataType: 'text' as 'text' | 'int' | 'float' | 'datetime',
    description: '',
    featureType: 'Calculated' as 'Calculated' | 'Dynamic',
    mapped_column: '',
    transformationLogic: ''
  });

  const [logicValidated, setLogicValidated] = useState(false);
  const [logicError, setLogicError] = useState<string | null>(null);

  useEffect(() => {
    setMetadata(loadMetadata());
  }, []);

  const toggleExpanded = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const resetGroupForm = () => {
    setGroupForm({ name: '', description: '', keyColumn: '', transformTableId: '' });
  };

  const resetFeatureForm = () => {
    setFeatureForm({
      name: '',
      dataType: 'text',
      description: '',
      featureType: 'Calculated',
      mapped_column: '',
      transformationLogic: ''
    });
    setLogicValidated(false);
    setLogicError(null);
    setSourceColumnChoice('');
  };

  const handleCreateGroup = () => {
    if (!groupForm.name.trim() || !groupForm.transformTableId) return;

    const updatedMetadata = createFeatureGroup(metadata, {
      name: groupForm.name.trim(),
      description: groupForm.description.trim(),
      keyColumn: groupForm.keyColumn.trim(),
      transformTableId: groupForm.transformTableId,
      features: []
    });

    setMetadata(updatedMetadata);
    setShowCreateGroupDialog(false);
    resetGroupForm();
  };

  const handleCreateFeature = () => {
    if (!selectedGroupForFeature || !isFeatureValid()) return;

    const updatedMetadata = addFeatureToGroup(metadata, selectedGroupForFeature, {
      name: featureForm.name.trim(),
      dataType: featureForm.dataType,
      description: featureForm.description.trim(),
      featureType: featureForm.featureType,
      mapped_column: featureForm.mapped_column.trim(),
      transformationLogic: featureForm.featureType === 'Dynamic' ? featureForm.transformationLogic.trim() : undefined
    });

    setMetadata(updatedMetadata);
    setShowCreateFeatureDialog(false);
    resetFeatureForm();
    setSelectedGroupForFeature(null);
  };

  const handleDeleteGroup = (groupId: string) => {
    const updatedMetadata = deleteFeatureGroup(metadata, groupId);
    setMetadata(updatedMetadata);
    setShowDeleteGroupDialog(null);
  };

  const isFeatureValid = () => {
    if (!(featureForm.name && featureForm.dataType && featureForm.description && featureForm.featureType)) return false;

    if (sourceColumnChoice === 'create-new' && !featureForm.mapped_column) return false;

    if (featureForm.featureType === 'Dynamic') {
      return featureForm.transformationLogic.trim().length > 0 && logicValidated && !logicError;
    }
    return true;
  };

  const validatePythonLogic = (code: string): string | null => {
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
  };

  const openGlobalCreateFeature = () => {
    setSelectedGroupForFeature(null);
    resetFeatureForm();
    setShowCreateFeatureDialog(true);
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
                    <Select value={groupForm.transformTableId} onValueChange={v => setGroupForm(f => ({ ...f, transformTableId: v }))}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select Transform Table" />
                      </SelectTrigger>
                      <SelectContent>
                        {metadata.transformedTables.map(table => (
                          <SelectItem key={table.id} value={table.id}>{table.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Name</label>
                    <Input value={groupForm.name} onChange={e => setGroupForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. User Behavior Metrics" />
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
                    <Button size="sm" onClick={handleCreateGroup} disabled={!groupForm.name.trim() || !groupForm.transformTableId}>Create</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
          {viewMode === 'features' && (
            <Button className="self-start" onClick={openGlobalCreateFeature}>Create Feature</Button>
          )}
        </div>
      </div>

      {viewMode === 'groups' && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {metadata.featureGroups.map(group => {
            const isExpanded = expanded.has(group.id);
            const transformTable = getTransformedTableById(metadata.transformedTables, group.transformTableId);
            return (
              <Card key={group.id} className={`transition-shadow flex flex-col ${isExpanded ? 'ring-1 ring-primary/40 shadow-md' : 'hover:shadow-md'}`}>
                <button
                  type="button"
                  onClick={() => toggleExpanded(group.id)}
                  className="text-left w-full"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0">
                        <CardTitle className="text-base font-semibold break-all flex items-center gap-2">
                          <span>{group.name}</span>
                          <span className="text-[10px] font-normal text-muted-foreground">{isExpanded ? 'Hide' : 'Show'} features</span>
                        </CardTitle>
                        <CardDescription className="text-xs line-clamp-3 leading-relaxed">
                          {group.description}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className="shrink-0">{group.features.length} {group.features.length === 1 ? 'feature' : 'features'}</Badge>
                    </div>
                  </CardHeader>
                </button>
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
                {isExpanded && (
                  <div className="px-4 pb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-[11px] font-semibold tracking-wide uppercase text-foreground/70">Features</h4>
                      <Button size="sm" variant="outline" className="h-7 px-2 text-[11px]" onClick={(e) => { e.stopPropagation(); openCreateFeature(group.id); }}>Create Feature</Button>
                    </div>
                    <div className="border rounded-md overflow-auto max-h-64">
                      <table className="w-full min-w-[640px] text-[11px]">
                        <thead className="bg-muted/50 text-[10px] uppercase tracking-wide">
                          <tr className="text-left">
                            <th className="px-2 py-1 font-medium">Name</th>
                            <th className="px-2 py-1 font-medium">Mapped Column</th>
                            <th className="px-2 py-1 font-medium">Data Type</th>
                            <th className="px-2 py-1 font-medium">Description</th>
                            <th className="px-2 py-1 font-medium">Feature Type</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.features.map(feat => (
                            <tr key={feat.id} className="border-t hover:bg-muted/40 cursor-pointer" onClick={() => setFeatureOverlay({ group, feature: feat })}>
                              <td className="px-2 py-1 font-mono text-[10px]">{feat.name}</td>
                              <td className="px-2 py-1 font-mono text-[10px] text-muted-foreground">{feat.mapped_column}</td>
                              <td className="px-2 py-1">{feat.dataType}</td>
                              <td className="px-2 py-1 max-w-[220px] truncate" title={feat.description}>{feat.description}</td>
                              <td className="px-2 py-1">
                                <span className={`inline-flex items-center rounded px-1.5 py-0.5 border text-[10px] ${feat.featureType === 'Calculated' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{feat.featureType}</span>
                              </td>
                            </tr>
                          ))}
                          {!group.features.length && (
                            <tr>
                              <td colSpan={5} className="px-2 py-4 text-center text-muted-foreground">No features yet.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
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
                  <th className="px-2 py-1 font-medium">Mapped Column</th>
                  <th className="px-2 py-1 font-medium">Data Type</th>
                  <th className="px-2 py-1 font-medium">Feature Type</th>
                  <th className="px-2 py-1 font-medium">Group</th>
                  <th className="px-2 py-1 font-medium">Transform Table</th>
                  <th className="px-2 py-1 font-medium">Key Column</th>
                  <th className="px-2 py-1 font-medium">Description</th>
                </tr>
              </thead>
              <tbody>
                {allFeaturesFlat.map(f => (
                  <tr key={`${f.groupId}::${f.id}`} className="border-t hover:bg-muted/40 cursor-pointer" onClick={() => {
                    const group = metadata.featureGroups.find(g => g.id === f.groupId);
                    if (group) setFeatureOverlay({ group, feature: f });
                  }}>
                    <td className="px-2 py-1 font-mono text-[10px]">{f.name}</td>
                    <td className="px-2 py-1 font-mono text-[10px] text-muted-foreground">{f.mapped_column}</td>
                    <td className="px-2 py-1">{f.dataType}</td>
                    <td className="px-2 py-1">
                      <span className={`inline-flex items-center rounded px-1.5 py-0.5 border text-[10px] ${f.featureType === 'Calculated' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{f.featureType}</span>
                    </td>
                    <td className="px-2 py-1 font-mono text-[10px]">{f.group}</td>
                    <td className="px-2 py-1 font-mono text-[10px]">{f.transformTable}</td>
                    <td className="px-2 py-1 font-mono text-[10px]">{f.keyColumn}</td>
                    <td className="px-2 py-1 max-w-[320px] truncate" title={f.description}>{f.description}</td>
                  </tr>
                ))}
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

      {/* Create Feature Dialog */}
      <Dialog open={showCreateFeatureDialog} onOpenChange={setShowCreateFeatureDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Feature</DialogTitle>
            <DialogDescription>
              {selectedGroupForFeature ? (
                <>Add a new feature to {metadata.featureGroups.find(g => g.id === selectedGroupForFeature)?.name}</>
              ) : (
                <>Select a feature group and define the feature.</>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            {!selectedGroupForFeature && (
              <div className="space-y-1">
                <label className="text-xs font-medium">Feature Group</label>
                <Select value={selectedGroupForFeature || ''} onValueChange={v => setSelectedGroupForFeature(v)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select feature group" />
                  </SelectTrigger>
                  <SelectContent>
                    {metadata.featureGroups.map(group => <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1">
              <label className="text-xs font-medium">Source Column</label>
              <Select value={sourceColumnChoice} onValueChange={handleSourceColumnSelect} disabled={!selectedGroupForFeature}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select source column or create new" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="create-new">Create new column</SelectItem>
                  {selectedGroupForFeature && (() => {
                    const group = metadata.featureGroups.find(g => g.id === selectedGroupForFeature);
                    const table = group ? getTransformedTableById(metadata.transformedTables, group.transformTableId) : null;
                    return table?.columns.map(col => (
                      <SelectItem key={col.name} value={col.name}>{col.name} ({col.dataType})</SelectItem>
                    )) || [];
                  })()}
                </SelectContent>
              </Select>
              {!selectedGroupForFeature && <p className="text-[10px] text-muted-foreground">Select a feature group first.</p>}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Feature Name</label>
              <Input
                value={featureForm.name}
                onChange={e => {
                  const name = e.target.value;
                  if (sourceColumnChoice === 'create-new') {
                    const mappedColumn = name.toLowerCase().replace(/\\s+/g, '_');
                  setFeatureForm(f => ({
                    ...f,
                    name: name,
                    mapped_column: mappedColumn
                  }));
                  } else {
                    setFeatureForm(f => ({ ...f, name }));
                  }
                }}
                placeholder="Readable feature name"
                disabled={!selectedGroupForFeature}
              />
              {!!sourceColumnChoice && sourceColumnChoice !== 'create-new' && (
                <p className="text-[10px] text-muted-foreground">Auto-generated from column. Choose "Create new column" to type a custom name.</p>
              )}
            </div>
            {sourceColumnChoice === 'create-new' && (
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
            )}
            <div className="space-y-1">
              <label className="text-xs font-medium">Description</label>
              <Textarea rows={3} value={featureForm.description} onChange={e => setFeatureForm(f => ({ ...f, description: e.target.value }))} placeholder="Short description of the feature" className="text-xs" />
            </div>
            <div className="grid grid-cols-2 gap-4">
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
              <div className="space-y-1">
                <label className="text-xs font-medium">Feature Type</label>
                <Select value={featureForm.featureType} onValueChange={v => { setFeatureForm(f => ({ ...f, featureType: v as any })); setLogicValidated(false); setLogicError(null); }}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Calculated">Calculated</SelectItem>
                    <SelectItem value="Dynamic">Dynamic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {featureForm.featureType === 'Dynamic' && (
              <div className="space-y-1">
                <label className="text-xs font-medium flex items-center justify-between">Transformation Logic (Python)
                  {logicValidated && !logicError && <span className="text-[10px] text-green-600">Validated</span>}
                </label>
                <Textarea rows={5} value={featureForm.transformationLogic} onChange={e => { setFeatureForm(f => ({ ...f, transformationLogic: e.target.value })); setLogicValidated(false); setLogicError(null); }} placeholder="e.g. (risk_score / (avg_lead_time_hours + 1)) * 100" className="font-mono text-[11px]" />
                {logicError && <p className="text-[10px] text-red-600">{logicError}</p>}
                {!logicError && logicValidated && <p className="text-[10px] text-green-600">Syntax looks good.</p>}
                {!logicValidated && !logicError && featureForm.transformationLogic && <p className="text-[10px] text-amber-600">Needs validation.</p>}
                <div className="flex gap-2 pt-1">
                  <Button type="button" size="sm" variant="secondary" onClick={handleValidateLogic} disabled={!featureForm.transformationLogic.trim()}>Validate</Button>
                </div>
              </div>
            )}
            {featureForm.featureType === 'Calculated' && (
              <div className="text-[11px] text-muted-foreground border rounded-md p-2 bg-muted/40">Data map screen will show here</div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowCreateFeatureDialog(false)}>Cancel</Button>
              <Button size="sm" onClick={handleCreateFeature} disabled={!selectedGroupForFeature || !isFeatureValid()}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
                  <div><div className="text-muted-foreground">Data Type</div><div className="font-medium">{featureOverlay.feature.dataType}</div></div>
                  <div><div className="text-muted-foreground">Feature Type</div><div><span className={`inline-flex items-center rounded px-2 py-0.5 border text-[10px] ${featureOverlay.feature.featureType === 'Calculated' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{featureOverlay.feature.featureType}</span></div></div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Description</div>
                  <p className="text-xs leading-relaxed max-w-prose">{featureOverlay.feature.description}</p>
                </div>
              </section>
              <section className="space-y-2">
                <h3 className="font-medium text-foreground/80">Lineage (placeholder)</h3>
                <div className="text-xs text-muted-foreground border rounded-md p-3">Lineage graph / SQL definition placeholder.</div>
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