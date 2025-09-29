import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FeatureMeta {
  name: string;
  dataType: string;
  description: string;
  featureType: 'Calculated' | 'Dynamic';
  transformationLogic?: string; // present only for Dynamic features
  mapped_column: string; // lowercase name with underscores
}

interface FeatureViewMeta {
  name: string;
  description: string;
  featureCount: number; // retained for badge display
  keyColumn: string;
  transformTable: string;
  features: FeatureMeta[];
}

const initialFeatureViews: FeatureViewMeta[] = [
  {
    name: 'Change Request',
    description: 'Contains features which are at change request level.',
    featureCount: 4,
    keyColumn: 'change_request_id',
    transformTable: 'transformed_change_requests',
    features: [
      { name: 'Change Lead Duration', dataType: 'int', description: 'Lead time for change request planned start date', featureType: 'Dynamic', mapped_column: 'change_lead_duration' },
      { name: 'Change Planned Duration', dataType: 'int', description: 'Planned Duration of change implementation', featureType: 'Calculated', mapped_column: 'change_planned_duration' },
      { name: 'Approved Planned Leadtime', dataType: 'int', description: 'Lead time for change implementation from approval date', featureType: 'Dynamic', mapped_column: 'approved_planned_leadtime' },
      { name: 'Change CI Count', dataType: 'int', description: 'No of change tasks associated to change request', featureType: 'Calculated', mapped_column: 'change_ci_count' }

    ]
  },
  {
    name: 'Assignee',
    description: 'Assignee level features',
    featureCount: 2,
    keyColumn: 'assignee_id',
    transformTable: 'transformed_assignees',
    features: [
      { name: 'Change Assignee Prior Changes', dataType: 'int', description: 'Changes implemented by assignee in last 180 days', featureType: 'Calculated', mapped_column: 'change_assignee_prior_changes' },
      { name: 'Change Assignee Prior Changes Failure Rate', dataType: 'float', description: 'Change failure rate by assignee in last 180 days', featureType: 'Calculated', mapped_column: 'change_assignee_prior_changes_failure_rate' }
    ]
  },
  {
    name: 'Assignment Group',
    description: 'Team / assignment group level features',
    featureCount: 2,
    keyColumn: 'assignement_group_id',
    transformTable: 'transformed_assignment_groups',
    features: [
      { name: 'Change Assignment Group Prior Changes', dataType: 'int', description: 'Changes implemented by assignment group in last 180 days', featureType: 'Calculated', mapped_column: 'change_assignment_group_prior_changes' },
      { name: 'Change Assignment Group Prior Changes Failure Rate', dataType: 'float', description: 'Change failure rate by assignment group in last 180 days', featureType: 'Calculated', mapped_column: 'change_assignment_group_prior_changes_failure_rate' }
    ]
  }
];

// Mock transform table -> columns mapping (source columns with data types)
const transformTableColumns: Record<string, Array<{name: string, dataType: string}>> = {
  transformed_change_requests: [
    { name: 'change_lead_duration', dataType: 'int' },
    { name: 'change_planned_duration', dataType: 'int' },
    { name: 'approved_planned_leadtime', dataType: 'int' },
    { name: 'change_request_id', dataType: 'text' },
    { name: 'category', dataType: 'text' },
    { name: 'change_ci_count', dataType: 'int' },
    { name: 'change_type', dataType: 'text' }
  ],
  transformed_assignees: [
    { name: 'change_assignee_prior_changes', dataType: 'int' },
    { name: 'change_assignee_prior_changes_failure_rate', dataType: 'float' },
    { name: 'assignee_id', dataType: 'text' }
  ],
  transformed_assignment_groups: [
    { name: 'change_assignment_group_prior_changes', dataType: 'int' },
    { name: 'change_assignment_group_prior_changes_failure_rate', dataType: 'float' },
    { name: 'assignement_group_id', dataType: 'text' }
  ],
  transformed_incident_metrics: [
    { name: 'mttr_hours', dataType: 'float' },
    { name: 'incident_volume_7d', dataType: 'int' },
    { name: 'p1_fraction_30d', dataType: 'float' }
  ]
};

export default function FeatureStore() {
  const [views, setViews] = useState<FeatureViewMeta[]>(initialFeatureViews);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'groups' | 'features'>('groups');
  const toggleExpanded = (name: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };
  const [open, setOpen] = useState(false);
  const transformedTables = [
    'transformed_change_requests',
    'transformed_assignees',
    'transformed_assignment_groups',
    'transformed_incident_metrics'
  ];

  const [form, setForm] = useState({
    name: '',
    description: '',
    keyColumn: '',
    transformTable: '', // selected existing transform table or '__new__'
    newTransformTable: '' // when creating a new one
  });
  const [featureDialogOpen, setFeatureDialogOpen] = useState(false);
  const [featureForm, setFeatureForm] = useState({ name: '', dataType: '', description: '', featureType: 'Calculated' as 'Calculated' | 'Dynamic', mapped_column: '' });
  const [transformationLogic, setTransformationLogic] = useState('');
  const [logicValidated, setLogicValidated] = useState(false);
  const [logicError, setLogicError] = useState<string | null>(null);
  const [selectedViewForFeature, setSelectedViewForFeature] = useState<string | null>(null);
  const [sourceColumnChoice, setSourceColumnChoice] = useState<string>('');

  // Overlay for feature detail
  const [featureOverlay, setFeatureOverlay] = useState<{ view: string; feature: FeatureMeta } | null>(null);

  const isValid = () => {
    const hasTransformChoice = form.transformTable && (form.transformTable !== '__new__' || (form.transformTable === '__new__' && form.newTransformTable));
    return form.name && form.description && form.keyColumn && hasTransformChoice;
  };

  const handleCreate = () => {
    if (!isValid()) return;
    const finalTransform = form.transformTable === '__new__' ? form.newTransformTable.trim() : form.transformTable;
    setViews(prev => [{
      name: form.name.trim(),
      description: form.description.trim(),
      featureCount: 0, // default until features are added elsewhere
      keyColumn: form.keyColumn.trim(),
      transformTable: finalTransform || 'unknown_transform',
      features: []
    }, ...prev]);
    setForm({ name: '', description: '', keyColumn: '', transformTable: '', newTransformTable: '' });
    setOpen(false);
  };

  const resetFeatureForm = () => {
    setFeatureForm({ name: '', dataType: '', description: '', featureType: 'Calculated', mapped_column: '' });
    setTransformationLogic('');
    setLogicValidated(false);
    setLogicError(null);
  };
  const openCreateFeature = (viewName: string) => {
    setSelectedViewForFeature(viewName);
    resetFeatureForm();
  setSourceColumnChoice('');
    setFeatureDialogOpen(true);
  };
  const openGlobalCreateFeature = () => {
    setSelectedViewForFeature(null); // force user to pick a view in dialog
    resetFeatureForm();
    setFeatureDialogOpen(true);
  };
  const isFeatureValid = () => {
    // Basic field validation
    if (!(featureForm.name && featureForm.dataType && featureForm.description && featureForm.featureType)) return false;

    // mapped_column is required for create-new, optional for existing columns (will be auto-set)
    if (sourceColumnChoice === 'create-new' && !featureForm.mapped_column) return false;

    // Dynamic feature validation
    if (featureForm.featureType === 'Dynamic') {
      return transformationLogic.trim().length > 0 && logicValidated && !logicError;
    }
    return true;
  };
  const handleCreateFeature = () => {
    if (!selectedViewForFeature || !isFeatureValid()) return;
    setViews(prev => prev.map(v => v.name === selectedViewForFeature ? {
      ...v,
      features: [{
        name: featureForm.name.trim(),
        dataType: featureForm.dataType.trim(),
        description: featureForm.description.trim(),
  featureType: featureForm.featureType,
  transformationLogic: featureForm.featureType === 'Dynamic' ? transformationLogic.trim() : undefined,
  mapped_column: featureForm.mapped_column.trim()
      }, ...v.features],
      featureCount: v.featureCount + 1
    } : v));
    setFeatureDialogOpen(false);
    resetFeatureForm();
  };
  // Naive Python syntax validation (basic structure & balance checks)
  const validatePythonLogic = (code: string): string | null => {
    if (!code.trim()) return 'Logic is required.';
    // Disallow obvious JS/HTML injection markers
    if (/[<>]/.test(code)) return 'Angle brackets not allowed.';
    const pairs: Array<[string,string]> = [['(',')'],['[',']'],['{','}']];
    for (const [o,c] of pairs) {
      let bal = 0;
      for (const ch of code) {
        if (ch === o) bal++; else if (ch === c) bal--;
        if (bal < 0) return `Unbalanced ${o}${c} pair.`;
      }
      if (bal !== 0) return `Unbalanced ${o}${c} pair.`;
    }
    // Quote balance (simple, ignores triple quotes edge cases)
    const single = (code.match(/(?<!\\)'/g) || []).length;
    const double = (code.match(/(?<!\\)"/g) || []).length;
    if (single % 2 !== 0) return 'Unmatched single quote.';
    if (double % 2 !== 0) return 'Unmatched double quote.';
    // Must look like a Python expression or block (very loose)
    if (!/(return|lambda|if |for |while |=|\+|\-|\*|\/)/.test(code)) {
      // Accept simple attribute or function style too
      if (!/^[a-zA-Z_][a-zA-Z0-9_\.]*$/.test(code.trim())) {
        return 'Provide a valid Python expression or block.';
      }
    }
    return null;
  };

  const handleValidateLogic = () => {
    const err = validatePythonLogic(transformationLogic);
    setLogicError(err);
    setLogicValidated(!err);
  };

  const toSentenceCase = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const handleSourceColumnSelect = (val: string) => {
    setSourceColumnChoice(val);
    if (val === 'create-new') {
      // allow manual entry for feature name, auto-generate mapped_column
      setFeatureForm(f => ({
        ...f,
        name: '',
        mapped_column: '',
        dataType: '' // reset data type for new columns
      }));
    } else if (val) {
      // existing column selected - use column name as feature name, get data type from column info
      const selectedView = views.find(v => v.name === selectedViewForFeature);
      const transformTable = selectedView?.transformTable;
      const columnInfo = transformTable ? transformTableColumns[transformTable]?.find(col => col.name === val) : null;

      const sentenceName = toSentenceCase(val);
      setFeatureForm(f => ({
        ...f,
        name: sentenceName,
        mapped_column: val, // use the actual column name as mapped_column
        dataType: columnInfo?.dataType || '' // auto-populate data type from column info
      }));
    }
  };
  // Flatten all features for the Features view
  const allFeaturesFlat = views.flatMap(v => v.features.map(feat => ({
    view: v.name,
    transformTable: v.transformTable,
    keyColumn: v.keyColumn,
    ...feat
  })));
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
            <Dialog open={open} onOpenChange={setOpen}>
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
                    <Select value={form.transformTable} onValueChange={v => setForm(f => ({ ...f, transformTable: v }))}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Create new Transform Table" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__new__">Create new Transform Table</SelectItem>
                        {transformedTables.map(tt => (
                          <SelectItem key={tt} value={tt}>{tt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {form.transformTable === '__new__' && (
                    <div className="space-y-1">
                      <label className="text-xs font-medium">New Transform Table Name</label>
                      <Input value={form.newTransformTable} onChange={e => setForm(f => ({ ...f, newTransformTable: e.target.value }))} placeholder="e.g. transformed_user_activity" />
                    </div>
                  )}
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Name</label>
                    <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. snow_incident_metrics_x" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Description</label>
                    <Textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Short description of the feature group" className="text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Key Column</label>
                    <Input value={form.keyColumn} onChange={e => setForm(f => ({ ...f, keyColumn: e.target.value }))} />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={() => setOpen(false)} size="sm">Cancel</Button>
                    <Button size="sm" onClick={handleCreate} disabled={!isValid()}>Create</Button>
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
          {views.map(fv => {
            const isExpanded = expanded.has(fv.name);
            return (
              <Card key={fv.name} className={`transition-shadow flex flex-col ${isExpanded ? 'ring-1 ring-primary/40 shadow-md' : 'hover:shadow-md'}`}>
                <button
                  type="button"
                  onClick={() => toggleExpanded(fv.name)}
                  className="text-left w-full"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0">
                        <CardTitle className="text-base font-semibold break-all flex items-center gap-2">
                          <span>{fv.name}</span>
                          <span className="text-[10px] font-normal text-muted-foreground">{isExpanded ? 'Hide' : 'Show'} features</span>
                        </CardTitle>
                        <CardDescription className="text-xs line-clamp-3 leading-relaxed">
                          {fv.description}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className="shrink-0">{fv.featureCount} {fv.featureCount === 1 ? 'feature' : 'features'}</Badge>
                    </div>
                  </CardHeader>
                </button>
                <CardContent className="text-xs text-muted-foreground grid grid-cols-2 gap-x-4 gap-y-2">
                  <div>
                    <div className="font-medium text-foreground/80 text-[11px] tracking-wide uppercase">Key Column</div>
                    <div className="font-mono text-[11px]">{fv.keyColumn}</div>
                  </div>
                  <div>
                    <div className="font-medium text-foreground/80 text-[11px] tracking-wide uppercase">Transform Table</div>
                    <div className="font-mono text-[11px]">{fv.transformTable}</div>
                  </div>
                </CardContent>
                {isExpanded && (
                  <div className="px-4 pb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-[11px] font-semibold tracking-wide uppercase text-foreground/70">Features</h4>
                      <Button size="sm" variant="outline" className="h-7 px-2 text-[11px]" onClick={() => openCreateFeature(fv.name)}>Create Feature</Button>
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
                          {fv.features.map(feat => (
                            <tr key={feat.name} className="border-t hover:bg-muted/40 cursor-pointer" onClick={() => setFeatureOverlay({ view: fv.name, feature: feat })}>
                              <td className="px-2 py-1 font-mono text-[10px]">{feat.name}</td>
                              <td className="px-2 py-1 font-mono text-[10px] text-muted-foreground">{feat.mapped_column}</td>
                              <td className="px-2 py-1">{feat.dataType}</td>
                              <td className="px-2 py-1 max-w-[220px] truncate" title={feat.description}>{feat.description}</td>
                              <td className="px-2 py-1">
                                <span className={`inline-flex items-center rounded px-1.5 py-0.5 border text-[10px] ${feat.featureType === 'Calculated' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{feat.featureType}</span>
                              </td>
                            </tr>
                          ))}
                          {!fv.features.length && (
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
                  <tr key={`${f.view}::${f.name}`} className="border-t hover:bg-muted/40 cursor-pointer" onClick={() => setFeatureOverlay({ view: f.view, feature: { name: f.name, dataType: f.dataType, description: f.description, featureType: f.featureType, transformationLogic: f.transformationLogic, mapped_column: f.mapped_column } })}>
                    <td className="px-2 py-1 font-mono text-[10px]">{f.name}</td>
                    <td className="px-2 py-1 font-mono text-[10px] text-muted-foreground">{f.mapped_column}</td>
                    <td className="px-2 py-1">{f.dataType}</td>
                    <td className="px-2 py-1">
                      <span className={`inline-flex items-center rounded px-1.5 py-0.5 border text-[10px] ${f.featureType === 'Calculated' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{f.featureType}</span>
                    </td>
                    <td className="px-2 py-1 font-mono text-[10px]">{f.view}</td>
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

      {/* Create Feature Dialog */}
      <Dialog open={featureDialogOpen} onOpenChange={setFeatureDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Feature</DialogTitle>
            <DialogDescription>
              {selectedViewForFeature ? (
                <>Add a new feature to {selectedViewForFeature}</>
              ) : (
                <>Select a feature group and define the feature.</>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            {!selectedViewForFeature && (
              <div className="space-y-1">
                <label className="text-xs font-medium">Feature Group</label>
                <Select value={selectedViewForFeature || ''} onValueChange={v => setSelectedViewForFeature(v)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select feature group" />
                  </SelectTrigger>
                  <SelectContent>
                    {views.map(v => <SelectItem key={v.name} value={v.name}>{v.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1">
              <label className="text-xs font-medium">Source Column</label>
              <Select value={sourceColumnChoice} onValueChange={handleSourceColumnSelect} disabled={!selectedViewForFeature}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select source column or create new" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="create-new">Create new column</SelectItem>
                  {(selectedViewForFeature ? transformTableColumns[views.find(v => v.name === selectedViewForFeature)?.transformTable || ''] || [] : []).map(col => (
                    <SelectItem key={col.name} value={col.name}>{col.name} ({col.dataType})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!selectedViewForFeature && <p className="text-[10px] text-muted-foreground">Select a feature group first.</p>}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Feature Name</label>
              <Input
                value={featureForm.name}
                onChange={e => {
                  const name = e.target.value;
                  // Only auto-generate mapped_column if "Create new column" is selected
                  if (sourceColumnChoice === 'create-new') {
                    const mappedColumn = name.toLowerCase().replace(/\s+/g, '_');
                    setFeatureForm(f => ({ ...f, name, mapped_column: mappedColumn }));
                  } else {
                    setFeatureForm(f => ({ ...f, name }));
                  }
                }}
                placeholder="Readable feature name"
                disabled={!selectedViewForFeature}
              />
              {!!sourceColumnChoice && sourceColumnChoice !== 'create-new' && (
                <p className="text-[10px] text-muted-foreground">Auto-generated from column. Choose "Create new column" to type a custom name.</p>
              )}
            </div>
            {/* Show mapped column field based on source column selection */}
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
                <Select value={featureForm.dataType} onValueChange={v => setFeatureForm(f => ({ ...f, dataType: v }))}>
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
                <Select value={featureForm.featureType} onValueChange={v => { setFeatureForm(f => ({ ...f, featureType: v as 'Calculated' | 'Dynamic' })); setLogicValidated(false); setLogicError(null); }}>
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
                <Textarea rows={5} value={transformationLogic} onChange={e => { setTransformationLogic(e.target.value); setLogicValidated(false); setLogicError(null); }} placeholder="e.g. (risk_score / (avg_lead_time_hours + 1)) * 100" className="font-mono text-[11px]" />
                {logicError && <p className="text-[10px] text-red-600">{logicError}</p>}
                {!logicError && logicValidated && <p className="text-[10px] text-green-600">Syntax looks good.</p>}
                {!logicValidated && !logicError && transformationLogic && <p className="text-[10px] text-amber-600">Needs validation.</p>}
                <div className="flex gap-2 pt-1">
                  <Button type="button" size="sm" variant="secondary" onClick={handleValidateLogic} disabled={!transformationLogic.trim()}>Validate</Button>
                </div>
              </div>
            )}
            {featureForm.featureType === 'Calculated' && (
              <div className="text-[11px] text-muted-foreground border rounded-md p-2 bg-muted/40">Data map screen will show here</div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setFeatureDialogOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={handleCreateFeature} disabled={!selectedViewForFeature || !isFeatureValid()}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {featureOverlay && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setFeatureOverlay(null)} />
          <div className="absolute top-0 right-0 h-full w-[75vw] max-w-[1200px] bg-background border-l shadow-xl flex flex-col animate-in slide-in-from-right">
            <div className="px-6 py-4 border-b flex items-center justify-between bg-muted/40">
              <div>
                <h2 className="text-lg font-semibold">Feature: {featureOverlay.feature.name}</h2>
                <p className="text-xs text-muted-foreground">Group: {featureOverlay.view}</p>
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
    </div>
  );
}
