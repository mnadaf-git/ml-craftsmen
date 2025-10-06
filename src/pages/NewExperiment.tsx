import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, CheckSquare, Play, Database, Clock, X, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// Textarea already imported above (keeping original import position compatibility)
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { loadMetadata, type MetadataStore } from "@/lib/metadata";
import CreateFeatureDialog from "@/components/CreateFeatureDialog";

const mockProjects = [
  { id: "1", name: "ChangeFailure" },
  { id: "2", name: "ChangeCreditScore" },
  { id: "3", name: "ChangeImpactDetection" }
];

const mockModels: Record<string, { id: string; name: string; algorithm: string; }[]> = {
  "1": [
    { id: "1", name: "Failure Prediction Model", algorithm: "CatboostClassifier" },
    { id: "2", name: "Risk Assessment Model", algorithm: "RandomForestBinaryClassifier" }
  ],
  "2": [
    { id: "3", name: "Credit Score Model", algorithm: "CatboostRegressor" },
    { id: "4", name: "Credit Risk Model", algorithm: "GBTBinaryClassifier" }
  ],
  "3": [
    { id: "5", name: "Impact Detection Model", algorithm: "DecisionTreeClassifier" }
  ]
};

const mockTables = ["customer_transactions", "user_behavior", "system_logs", "financial_data"];

const mockDatasetSample = [
  { id: 1, age: 35, income: 65000, credit_score: 720, amount: 125.50, merchant: "Grocery", target: 0 },
  { id: 2, age: 42, income: 85000, credit_score: 680, amount: 89.99, merchant: "Gas", target: 1 },
  { id: 3, age: 28, income: 45000, credit_score: 750, amount: 245.00, merchant: "Restaurant", target: 0 },
  { id: 4, age: 51, income: 95000, credit_score: 690, amount: 15.99, merchant: "Coffee", target: 0 },
  { id: 5, age: 39, income: 72000, credit_score: 710, amount: 567.88, merchant: "Electronics", target: 1 },
  { id: 6, age: 31, income: 54000, credit_score: 705, amount: 78.12, merchant: "Grocery", target: 0 },
  { id: 7, age: 46, income: 88000, credit_score: 665, amount: 312.44, merchant: "Travel", target: 1 },
  { id: 8, age: 29, income: 47000, credit_score: 735, amount: 42.60, merchant: "Coffee", target: 0 },
  { id: 9, age: 57, income: 105000, credit_score: 700, amount: 1299.00, merchant: "Electronics", target: 1 },
  { id: 10, age: 33, income: 61000, credit_score: 725, amount: 5.49, merchant: "Gas", target: 0 },
  { id: 11, age: 45, income: 83000, credit_score: 680, amount: 224.10, merchant: "Restaurant", target: 0 },
  { id: 12, age: 27, income: 43000, credit_score: 760, amount: 19.99, merchant: "Coffee", target: 0 },
  { id: 13, age: 52, income: 98000, credit_score: 695, amount: 76.34, merchant: "Grocery", target: 0 },
  { id: 14, age: 38, income: 70000, credit_score: 715, amount: 854.22, merchant: "Electronics", target: 1 },
  { id: 15, age: 41, income: 82000, credit_score: 705, amount: 63.75, merchant: "Travel", target: 0 },
  { id: 16, age: 36, income: 66000, credit_score: 740, amount: 145.00, merchant: "Restaurant", target: 0 },
  { id: 17, age: 48, income: 91000, credit_score: 690, amount: 300.00, merchant: "Travel", target: 1 },
  { id: 18, age: 34, income: 64000, credit_score: 730, amount: 27.45, merchant: "Coffee", target: 0 },
  { id: 19, age: 53, income: 102000, credit_score: 685, amount: 420.00, merchant: "Electronics", target: 1 },
  { id: 20, age: 30, income: 50000, credit_score: 745, amount: 88.10, merchant: "Grocery", target: 0 }
];

export default function NewExperiment() {
  console.log("NewExperiment component mounting");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  // Load metadata for transformed tables
  const [metadata, setMetadata] = useState<MetadataStore | null>(null);

  // Load metadata on component mount
  useEffect(() => {
    loadMetadata().then(setMetadata).catch(console.error);
  }, []);

  const [selectedProject, setSelectedProject] = useState(searchParams.get('projectId') || '');
  const [selectedModel, setSelectedModel] = useState(searchParams.get('modelId') || '');
  const sourceInstanceParam = searchParams.get('sourceInstance') || '';
  const [sourceInstance] = useState(sourceInstanceParam);
  const [labelSourceTable, setLabelSourceTable] = useState('');
  const [targetLabelColumn, setTargetLabelColumn] = useState('');
  const [eventTimestampColumn, setEventTimestampColumn] = useState('');
  const [filterCondition, setFilterCondition] = useState('');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [datasetGenerated, setDatasetGenerated] = useState(false);
  const [trainingSubmitted, setTrainingSubmitted] = useState(false);
  const [availableSelection, setAvailableSelection] = useState<string[]>([]);
  const [chosenSelection, setChosenSelection] = useState<string[]>([]);
  // Custom feature creation state - now using reusable CreateFeatureDialog
  const [customFeatures, setCustomFeatures] = useState<any[]>([]);
  const [createFeatureOpen, setCreateFeatureOpen] = useState(false);

  // EDA overlay state
  const [edaOverlayOpen, setEdaOverlayOpen] = useState(false);
  const [edaOverlayMode, setEdaOverlayMode] = useState<'history' | 'run' | null>(null);
  // Mock EDA jobs (for history panel)
  const [edaJobs, setEdaJobs] = useState<Array<{ id: string; status: 'running' | 'completed'; duration?: string; features?: number; rows?: number; completedAt?: string }>>([
    { id: 'eda-1732383000000', status: 'completed', duration: '1m 12s', features: 18, rows: 82000, completedAt: new Date(Date.now() - 86400000).toISOString() },
    { id: 'eda-1732469400000', status: 'completed', duration: '2m 05s', features: 24, rows: 150000, completedAt: new Date(Date.now() - 3600000).toISOString() },
  ]);
  const [edaIsRunning, setEdaIsRunning] = useState(false);
  const [edaSelectedFeatures, setEdaSelectedFeatures] = useState<string[]>([]);
  const [edaAvailableSelection, setEdaAvailableSelection] = useState<string[]>([]);
  const [edaChosenSelection, setEdaChosenSelection] = useState<string[]>([]);
  const [edaSelectedJob, setEdaSelectedJob] = useState<{ id: string; status: 'running' | 'completed'; duration?: string; features?: number; rows?: number; completedAt?: string } | null>(null);
  const [edaReportLoading, setEdaReportLoading] = useState(false);

  const toggleEdaAvailable = (f: string) => setEdaAvailableSelection(p => p.includes(f) ? p.filter(x => x !== f) : [...p, f]);
  const toggleEdaChosen = (f: string) => setEdaChosenSelection(p => p.includes(f) ? p.filter(x => x !== f) : [...p, f]);
  const edaAddSelected = () => { if (edaAvailableSelection.length) { setEdaSelectedFeatures(prev => [...prev, ...edaAvailableSelection]); setEdaAvailableSelection([]);} };
  const edaRemoveSelected = () => { if (edaChosenSelection.length) { setEdaSelectedFeatures(prev => prev.filter(f => !edaChosenSelection.includes(f))); setEdaChosenSelection([]);} };
  const edaClearAll = () => { setEdaSelectedFeatures([]); setEdaAvailableSelection([]); setEdaChosenSelection([]); };

  const openEdaOverlay = (mode: 'history' | 'run') => {
    // When entering run mode, pre-populate the EDA feature selection with the experiment's selected features
    if (mode === 'run') {
      setEdaSelectedFeatures([...selectedFeatures]);
      setEdaAvailableSelection([]);
      setEdaChosenSelection([]);
    }
    setEdaOverlayMode(mode);
    setEdaOverlayOpen(true);
  };
  const closeEdaOverlay = () => {
    setEdaOverlayOpen(false);
    // do not clear mode instantly to allow exit animation if added later
    setTimeout(() => setEdaOverlayMode(null), 200);
  };

  const runInlineEdaJob = () => {
    if (!edaSelectedFeatures.length) {
      toast({ title: 'Select Features', description: 'Choose at least one feature for EDA.', variant: 'destructive' });
      return;
    }
    const newJob = { id: 'eda-' + Date.now(), status: 'running' as const };
    setEdaJobs(prev => [newJob, ...prev]);
    setEdaIsRunning(true);
    toast({ title: 'EDA Started', description: 'EDA job is running in background.' });
    setTimeout(() => {
      setEdaIsRunning(false);
      const completedJob = { id: newJob.id, status: 'completed' as const, duration: '2m 10s', features: edaSelectedFeatures.length, rows: 120000, completedAt: new Date().toISOString() };
      setEdaJobs(prev => prev.map(j => j.id === newJob.id ? completedJob : j));
      toast({ title: 'EDA Completed', description: 'Opening results...' });
      setEdaOverlayMode('history');
      setEdaSelectedJob(completedJob);
      setEdaReportLoading(true);
      // scroll after DOM paint
      requestAnimationFrame(() => {
        const el = document.getElementById('inline-eda-report');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      });
    }, 2500);
  };

  const lockedProjectModel = Boolean(searchParams.get('projectId') && searchParams.get('modelId'));

  const mockTableColumns: Record<string, string[]> = {
    customer_transactions: ['id','age','income','credit_score','amount','merchant','target'],
    user_behavior: ['user_id','login_frequency','session_duration','clicks_per_session','bounce_rate','target'],
    system_logs: ['log_id','event_type','severity','source','timestamp','target'],
    financial_data: ['record_id','account_balance','transaction_frequency','region','risk_score','target']
  };

  const availableModels = selectedProject ? (mockModels[selectedProject] || []) : [];

  // Get all features from metadata organized by feature groups
  const getAvailableFeaturesFromMetadata = () => {
    if (!metadata?.featureGroups) return [];

    return metadata.featureGroups.map(group => ({
      groupId: group.id,
      groupName: group.name,
      features: group.features
    }));
  };

  // Flatten all features from metadata
  const allMetadataFeatures = metadata?.featureGroups?.flatMap(group =>
    group.features.map(feature => feature.name)
  ) || [];

  const allFeatures = Array.from(new Set([
    ...allMetadataFeatures,
    ...customFeatures.map(f => f.name)
  ])).sort();

  const availableFeatures = allFeatures.filter(f => !selectedFeatures.includes(f));
  const availableFeatureGroups = getAvailableFeaturesFromMetadata();

  // EDA feature calculations (after metadata is available)
  const edaFeaturePool = Array.from(new Set(allMetadataFeatures)).sort();
  const edaAvailableFeatures = edaFeaturePool.filter(f => !edaSelectedFeatures.includes(f));

  const toggleAvailable = (f: string) => setAvailableSelection(p => p.includes(f) ? p.filter(x => x !== f) : [...p, f]);
  const toggleChosen = (f: string) => setChosenSelection(p => p.includes(f) ? p.filter(x => x !== f) : [...p, f]);
  const addSelected = () => { if (availableSelection.length) { setSelectedFeatures(prev => [...prev, ...availableSelection]); setAvailableSelection([]);} };
  const removeSelected = () => { if (chosenSelection.length) { setSelectedFeatures(prev => prev.filter(f => !chosenSelection.includes(f))); setChosenSelection([]);} };
  const clearAll = () => { setSelectedFeatures([]); setAvailableSelection([]); setChosenSelection([]); };

  // Handle feature creation from the reusable component
  const handleFeatureCreated = (feature: any, groupId: string) => {
    // Add to available features for this experiment
    setCustomFeatures(prev => [feature, ...prev]);
    toast({
      title: 'Feature Created',
      description: `Feature "${feature.name}" created successfully`
    });
  };

  const handleGenerateDataset = () => {
    if (!selectedProject || !selectedModel || !labelSourceTable || !targetLabelColumn) {
      toast({ title: 'Error', description: 'Please fill in required fields (project, model, source table, target label column)', variant: 'destructive' });
      return;
    }
    setDatasetGenerated(true);
    toast({ title: 'Success', description: 'Training dataset generated successfully' });
  };

  const handleTrainModel = () => {
    setTrainingSubmitted(true);
    toast({ title: 'Success', description: 'Training job submitted successfully' });
    setTimeout(() => navigate('/experiments/summary'), 2000);
  };

  if (trainingSubmitted) {
    return (
      <div className="space-y-6">
        <Card className="max-w-md mx-auto mt-20">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckSquare className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle>Training Job Submitted</CardTitle>
            <CardDescription>Your model training has been queued and will begin shortly</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">Redirecting to Experimentation Summary...</p>
            <Button variant="outline" onClick={() => navigate('/experiments/summary')}>Go to Summary</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <TooltipProvider>
    <>
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/experiments')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Experiments
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-foreground">New Experiment</h1>
        <p className="text-muted-foreground">Configure and create a new ML experiment</p>
      </div>

      <div className="space-y-8 w-full">
        <Card>
          <CardHeader>
            <CardTitle>Experiment Configuration</CardTitle>
            <CardDescription>Select project, model and configure parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <Label>Project</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Select the ML project that contains your models and datasets</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={selectedProject} onValueChange={setSelectedProject} disabled={lockedProjectModel}>
                <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent>
                  {mockProjects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Label>Model</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Choose the specific ML algorithm/model to train for this experiment</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={selectedModel} onValueChange={setSelectedModel} disabled={!selectedProject || lockedProjectModel}>
                <SelectTrigger><SelectValue placeholder="Select model" /></SelectTrigger>
                <SelectContent>
                  {availableModels.map(m => <SelectItem key={m.id} value={m.id}>{m.name} ({m.algorithm})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Label>Source Instance</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">The data source instance or environment where your data is hosted</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input value={sourceInstance || 'Not specified'} disabled readOnly className="bg-muted/50" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Label>Source Table</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Select the table containing your training data and target labels</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={labelSourceTable} onValueChange={v => { setLabelSourceTable(v); setTargetLabelColumn(''); }}>
                <SelectTrigger><SelectValue placeholder="Select table" /></SelectTrigger>
                <SelectContent>
                  {metadata?.transformedTables?.map(table => (
                    <SelectItem key={table.id} value={table.name}>{table.name}</SelectItem>
                  )) || mockTables.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Label>Target Label Column</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">The column that contains the values you want to predict (dependent variable)</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={targetLabelColumn} onValueChange={setTargetLabelColumn} disabled={!labelSourceTable}>
                <SelectTrigger><SelectValue placeholder="Select target label column" /></SelectTrigger>
                <SelectContent>
                  {(() => {
                    if (!labelSourceTable || !metadata?.transformedTables) {
                      return [];
                    }
                    const selectedTable = metadata.transformedTables.find(table => table.name === labelSourceTable);
                    const columns = selectedTable?.columns?.map(col => col.name) || [];
                    return columns.length > 0
                      ? columns.map(col => <SelectItem key={col} value={col}>{col}</SelectItem>)
                      : (mockTableColumns[labelSourceTable as keyof typeof mockTableColumns] || []).map(col => <SelectItem key={col} value={col}>{col}</SelectItem>);
                  })()}
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Label>Event Timestamp column</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Column containing timestamps for time-series analysis and temporal ordering</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input placeholder="e.g. change_closed_datetime" value={eventTimestampColumn} onChange={e => setEventTimestampColumn(e.target.value)} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Label>Filter Condition (optional)</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">SQL-like conditions to filter your dataset (e.g., "change_planned_start_date {'>'} 2024-01-01 AND status = 'open'")</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input placeholder="e.g. change_planned_start_date > 2024-01-01 AND status = 'open'" value={filterCondition} onChange={e => setFilterCondition(e.target.value)} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Features to Include</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Select the input variables (features) that will be used to train your model</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="border rounded-md p-3 h-64 flex flex-col">
                  <div className="font-medium text-sm mb-2">Available Features</div>
                  <div className="flex-1 overflow-auto space-y-2 text-sm">
                    {availableFeatureGroups.map(group => (
                      <div key={group.groupId} className="space-y-1">
                        <div className="text-xs font-medium text-muted-foreground border-b pb-1">
                          {group.groupName} ({group.features.length})
                        </div>
                        <div className="space-y-1 pl-2">
                          {group.features
                            .filter(feature => !selectedFeatures.includes(feature.name))
                            .map(feature => (
                              <button
                                key={feature.id}
                                type="button"
                                onClick={() => toggleAvailable(feature.name)}
                                className={`w-full text-left px-2 py-1 rounded border text-xs transition-colors ${
                                  availableSelection.includes(feature.name)
                                    ? 'bg-primary text-primary-foreground'
                                    : 'hover:bg-muted'
                                }`}
                                title={feature.description}
                              >
                                {feature.name}
                              </button>
                            ))
                          }
                        </div>
                      </div>
                    ))}
                    {customFeatures
                      .filter(feature => !selectedFeatures.includes(feature.name))
                      .length > 0 && (
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-muted-foreground border-b pb-1">
                          Custom Features ({customFeatures.filter(f => !selectedFeatures.includes(f.name)).length})
                        </div>
                        <div className="space-y-1 pl-2">
                          {customFeatures
                            .filter(feature => !selectedFeatures.includes(feature.name))
                            .map(feature => (
                              <button
                                key={feature.id || feature.name}
                                type="button"
                                onClick={() => toggleAvailable(feature.name)}
                                className={`w-full text-left px-2 py-1 rounded border text-xs transition-colors ${
                                  availableSelection.includes(feature.name)
                                    ? 'bg-primary text-primary-foreground'
                                    : 'hover:bg-muted'
                                }`}
                                title={feature.description}
                              >
                                {feature.name}
                              </button>
                            ))
                          }
                        </div>
                      </div>
                    )}
                    {availableFeatureGroups.length === 0 && customFeatures.filter(f => !selectedFeatures.includes(f.name)).length === 0 && (
                      <div className="text-muted-foreground text-xs">No features available</div>
                    )}
                  </div>
                  <div className="pt-2 text-[10px] text-muted-foreground">Click to select</div>
                </div>
                <div className="flex flex-col justify-center items-center gap-2">
                  <Button variant="secondary" size="sm" onClick={addSelected} disabled={!availableSelection.length}>Add →</Button>
                  <Button variant="secondary" size="sm" onClick={removeSelected} disabled={!chosenSelection.length}>← Remove</Button>
                  <Button variant="ghost" size="sm" onClick={clearAll} disabled={!selectedFeatures.length}>Clear All</Button>
                </div>
                <div className="border rounded-md p-3 h-64 flex flex-col">
                  <div className="font-medium text-sm mb-2">Selected Features ({selectedFeatures.length})</div>
                  <div className="flex-1 overflow-auto space-y-1 text-sm">
                    {selectedFeatures.map(f => (
                      <button key={f} type="button" onClick={() => toggleChosen(f)} className={`w-full text-left px-2 py-1 rounded border text-xs transition-colors ${chosenSelection.includes(f) ? 'bg-destructive text-destructive-foreground' : 'hover:bg-muted'}`}>{f}</button>
                    ))}
                    {!selectedFeatures.length && <div className="text-muted-foreground text-xs">None selected</div>}
                  </div>
                  <div className="pt-2 text-[10px] text-muted-foreground">Click to mark for removal</div>
                </div>
              </div>
              <div className="flex justify-between gap-4 pt-2">
                <CreateFeatureDialog
                  open={createFeatureOpen}
                  onOpenChange={setCreateFeatureOpen}
                  onFeatureCreated={handleFeatureCreated}
                  metadata={metadata || {
                    transformedTables: [],
                    featureGroups: []
                  }}
                />
                <Button
                  size="sm"
                  variant="default"
                  className="h-8 text-xs"
                  onClick={() => setCreateFeatureOpen(true)}
                >
                  Create Feature
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdaOverlay('history')}>EDA History</Button>
                  <Button variant="default" size="sm" onClick={() => openEdaOverlay('run')} disabled={!selectedFeatures.length}>Run EDA</Button>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <Label>Model Parameters</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Configure hyperparameters that control how the model learns and performs</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="border rounded-md p-3 max-h-[120px] overflow-y-auto bg-muted/50">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground">num_topics</div>
                    <Input defaultValue="10" className="h-7 text-xs font-mono" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground">workers</div>
                    <Input defaultValue="2" className="h-7 text-xs font-mono" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground">chunksize</div>
                    <Input defaultValue="2000" className="h-7 text-xs font-mono" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground">passes</div>
                    <Input defaultValue="1" className="h-7 text-xs font-mono" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground">batch</div>
                    <Input defaultValue="10" className="h-7 text-xs font-mono" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground">alpha</div>
                    <Input defaultValue="2" className="h-7 text-xs font-mono" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground">decay</div>
                    <Input defaultValue="2000" className="h-7 text-xs font-mono" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground">offset</div>
                    <Input defaultValue="1" className="h-7 text-xs font-mono" />
                  </div>
                </div>
              </div>
            </div>
            <div className="pt-2">
              <Button onClick={handleGenerateDataset} size="lg" className="w-full" disabled={!selectedProject || !selectedModel || !labelSourceTable || !targetLabelColumn || !selectedFeatures.length}>
                <Database className="h-4 w-4 mr-2" />
                Generate Training Dataset
              </Button>
              <p className="text-xs text-muted-foreground mt-2">{!selectedFeatures.length ? 'Select at least one feature to enable generation.' : 'Dataset generation uses the selected features and target label.'}</p>
            </div>
          </CardContent>
        </Card>

        {datasetGenerated && (
          <Card>
            <CardHeader>
              <CardTitle>Generated Dataset Sample</CardTitle>
              <CardDescription>Preview of the training dataset</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">Dataset contains {mockDatasetSample.length} rows with {Object.keys(mockDatasetSample[0]).length} features</div>
                <div className="overflow-auto max-h-96 border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Age</TableHead>
                        <TableHead>Income</TableHead>
                        <TableHead>Credit Score</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Merchant</TableHead>
                        <TableHead>Target</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockDatasetSample.map(row => (
                        <TableRow key={row.id}>
                          <TableCell>{row.id}</TableCell>
                          <TableCell>{row.age}</TableCell>
                          <TableCell>${row.income.toLocaleString()}</TableCell>
                          <TableCell>{row.credit_score}</TableCell>
                          <TableCell>${row.amount}</TableCell>
                          <TableCell>{row.merchant}</TableCell>
                          <TableCell><Badge variant={row.target === 1 ? 'destructive' : 'secondary'}>{row.target}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex justify-end items-center pt-4 border-t"><Badge variant="secondary">5,000 total rows</Badge></div>
              </div>
            </CardContent>
          </Card>
        )}

        {datasetGenerated && (
          <Card>
            <CardHeader>
              <CardTitle>Training Configuration</CardTitle>
              <CardDescription>Review and start model training</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div><span className="text-muted-foreground">Project:</span><div className="font-medium">{mockProjects.find(p => p.id === selectedProject)?.name || 'N/A'}</div></div>
                  <div><span className="text-muted-foreground">Model:</span><div className="font-medium">{availableModels.find(m => m.id === selectedModel)?.name || 'N/A'}</div></div>
                  <div><span className="text-muted-foreground">Features:</span><div className="font-medium">{selectedFeatures.length} selected</div></div>
                  <div><span className="text-muted-foreground">Dataset Size:</span><div className="font-medium">5,000 rows</div></div>
                  <div><span className="text-muted-foreground">Target Column:</span><div className="font-medium">{targetLabelColumn || 'N/A'}</div></div>
                </div>
                <Button onClick={handleTrainModel} className="w-full" size="lg"><Play className="h-4 w-4 mr-2" />Train the Model</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  {edaOverlayOpen && (
      <div className="fixed inset-0 z-50">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeEdaOverlay} />
        <div className="absolute top-0 right-0 h-full w-[75vw] max-w-[1400px] bg-background border-l shadow-xl flex flex-col animate-in slide-in-from-right duration-300">
          <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/40">
            <div>
              <h2 className="text-xl font-semibold">{edaOverlayMode === 'history' ? 'EDA History' : 'Run EDA'}</h2>
              <p className="text-xs text-muted-foreground">{edaOverlayMode === 'history' ? 'Previous exploratory data analysis jobs' : 'Configure and execute an exploratory data analysis job'}</p>
            </div>
            <button onClick={closeEdaOverlay} className="p-2 rounded-md hover:bg-muted"><X className="h-4 w-4" /></button>
          </div>
          <div className="flex-1 overflow-auto p-6 space-y-6">
            {edaOverlayMode === 'history' && (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">{edaJobs.length} job(s)</div>
                <div className="overflow-x-auto border rounded-md">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr className="text-left">
                        <th className="px-3 py-2 font-medium">ID</th>
                        <th className="px-3 py-2 font-medium">Status</th>
                        <th className="px-3 py-2 font-medium">Duration</th>
                        <th className="px-3 py-2 font-medium">Features</th>
                        <th className="px-3 py-2 font-medium">Rows</th>
                        <th className="px-3 py-2 font-medium">Completed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {edaJobs.map(job => (
                        <tr
                          key={job.id}
                          className={`border-t ${job.status === 'completed' ? 'cursor-pointer hover:bg-muted/40' : 'opacity-60'} ${edaSelectedJob?.id === job.id ? 'bg-muted/50' : ''}`}
                          onClick={() => {
                            if (job.status === 'completed') {
                              setEdaSelectedJob(job);
                              setEdaReportLoading(true);
                              requestAnimationFrame(() => {
                                const el = document.getElementById('inline-eda-report');
                                if (el) el.scrollIntoView({ behavior: 'smooth' });
                              });
                            }
                          }}
                        >
                          <td className="px-3 py-2 font-mono text-xs">{job.id}</td>
                          <td className="px-3 py-2">
                            <span className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-medium border ${job.status === 'completed' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>{job.status}</span>
                          </td>
                          <td className="px-3 py-2">{job.duration || '-'}</td>
                          <td className="px-3 py-2">{job.features ?? '-'}</td>
                          <td className="px-3 py-2">{job.rows ? job.rows.toLocaleString() : '-'}</td>
                          <td className="px-3 py-2">{job.completedAt ? new Date(job.completedAt).toLocaleTimeString() : '-'}</td>
                        </tr>
                      ))}
                      {!edaJobs.length && (
                        <tr><td colSpan={6} className="px-3 py-6 text-center text-xs text-muted-foreground">No EDA jobs yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {edaSelectedJob && edaSelectedJob.status === 'completed' && (
                  <div id="inline-eda-report" className="border rounded-lg overflow-hidden mt-2 relative">
                    {edaReportLoading && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/70 backdrop-blur-sm text-xs">
                        <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                        Loading report...
                      </div>
                    )}
                    <div className="px-4 py-2 bg-muted/40 border-b flex items-center justify-between">
                      <span className="text-sm font-medium">EDA Report</span>
                      <span className="text-[10px] text-muted-foreground">/reports/pandas_profiling_report.html</span>
                    </div>
                    <iframe
                      title="EDA Report"
                      key={edaSelectedJob.id}
                      src="/reports/pandas_profiling_report.html"
                      onLoad={() => setEdaReportLoading(false)}
                      className="w-full h-[600px] bg-background"
                    />
                  </div>
                )}
              </div>
            )}
            {edaOverlayMode === 'run' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium mb-2">Select Features for EDA</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="border rounded-md p-3 h-64 flex flex-col">
                      <div className="font-medium text-sm mb-2">Available Features</div>
                      <div className="flex-1 overflow-auto space-y-1 text-sm">
                        {edaAvailableFeatures.map(f => (
                          <button key={f} type="button" onClick={() => toggleEdaAvailable(f)} className={`w-full text-left px-2 py-1 rounded border text-xs transition-colors ${edaAvailableSelection.includes(f) ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>{f}</button>
                        ))}
                        {!edaAvailableFeatures.length && <div className="text-muted-foreground text-xs">None</div>}
                      </div>
                      <div className="pt-2 text-[10px] text-muted-foreground">Click to select</div>
                    </div>
                    <div className="flex flex-col justify-center items-center gap-2">
                      <Button variant="secondary" size="sm" onClick={edaAddSelected} disabled={!edaAvailableSelection.length}>Add →</Button>
                      <Button variant="secondary" size="sm" onClick={edaRemoveSelected} disabled={!edaChosenSelection.length}>← Remove</Button>
                      <Button variant="ghost" size="sm" onClick={edaClearAll} disabled={!edaSelectedFeatures.length}>Clear All</Button>
                    </div>
                    <div className="border rounded-md p-3 h-64 flex flex-col">
                      <div className="font-medium text-sm mb-2">Selected Features ({edaSelectedFeatures.length})</div>
                      <div className="flex-1 overflow-auto space-y-1 text-sm">
                        {edaSelectedFeatures.map(f => (
                          <button key={f} type="button" onClick={() => toggleEdaChosen(f)} className={`w-full text-left px-2 py-1 rounded border text-xs transition-colors ${edaChosenSelection.includes(f) ? 'bg-destructive text-destructive-foreground' : 'hover:bg-muted'}`}>{f}</button>
                        ))}
                        {!edaSelectedFeatures.length && <div className="text-muted-foreground text-xs">None selected</div>}
                      </div>
                      <div className="pt-2 text-[10px] text-muted-foreground">Click to mark for removal</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">EDA Parameters</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5 text-xs">
                      <Label className="text-xs">Sample Size</Label>
                      <Input placeholder="100000" defaultValue="100000" className="h-8 text-xs" />
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <Label className="text-xs">Analysis Type</Label>
                      <Select>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pandas-profiling">Pandas profiling</SelectItem>
                          <SelectItem value="sweetviz">Sweetviz</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <Label className="text-xs">Custom Parameters (JSON)</Label>
                    <Textarea placeholder='{"correlation_threshold": 0.8, "outlier_detection": true}' className="font-mono text-[11px] min-h-[70px]" />
                  </div>
                </div>
                <div className="pt-2">
                  <Button onClick={runInlineEdaJob} disabled={edaIsRunning || !edaSelectedFeatures.length} className="w-full" size="sm">
                    {edaIsRunning ? (<><Clock className="h-3.5 w-3.5 mr-2 animate-spin" />Running EDA...</>) : (<><Play className="h-3.5 w-3.5 mr-2" />Run EDA</>)}
                  </Button>
                  <p className="text-[10px] text-muted-foreground mt-2">{!edaSelectedFeatures.length ? 'Select at least one feature to enable.' : 'EDA will analyze the selected features.'}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )}
    </>
    </TooltipProvider>
  );
}