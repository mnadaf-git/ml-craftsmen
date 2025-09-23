import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, CheckSquare, Play, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface FeatureView { id: string; name: string; features: string[]; }

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

const mockFeatureViews: FeatureView[] = [
  { id: "1", name: "Customer Features", features: ["age", "income", "credit_score", "account_balance", "transaction_frequency"] },
  { id: "2", name: "Transaction Features", features: ["amount", "merchant_category", "time_of_day", "day_of_week", "location"] },
  { id: "3", name: "Behavioral Features", features: ["login_frequency", "session_duration", "clicks_per_session", "bounce_rate"] }
];

const mockDatasetSample = [
  { id: 1, age: 35, income: 65000, credit_score: 720, amount: 125.50, merchant: "Grocery", target: 0 },
  { id: 2, age: 42, income: 85000, credit_score: 680, amount: 89.99, merchant: "Gas", target: 1 },
  { id: 3, age: 28, income: 45000, credit_score: 750, amount: 245.00, merchant: "Restaurant", target: 0 },
  { id: 4, age: 51, income: 95000, credit_score: 690, amount: 15.99, merchant: "Coffee", target: 0 },
  { id: 5, age: 39, income: 72000, credit_score: 710, amount: 567.88, merchant: "Electronics", target: 1 }
];

export default function NewExperiment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [selectedProject, setSelectedProject] = useState(searchParams.get('projectId') || '');
  const [selectedModel, setSelectedModel] = useState(searchParams.get('modelId') || '');
  const [labelSourceTable, setLabelSourceTable] = useState('');
  const [targetLabelColumn, setTargetLabelColumn] = useState('');
  const [filterCondition, setFilterCondition] = useState('');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [modelParameters, setModelParameters] = useState('');
  const [datasetGenerated, setDatasetGenerated] = useState(false);
  const [trainingSubmitted, setTrainingSubmitted] = useState(false);
  const [availableSelection, setAvailableSelection] = useState<string[]>([]);
  const [chosenSelection, setChosenSelection] = useState<string[]>([]);

  const lockedProjectModel = Boolean(searchParams.get('projectId') && searchParams.get('modelId'));

  const mockTableColumns: Record<string, string[]> = {
    customer_transactions: ['id','age','income','credit_score','amount','merchant','target'],
    user_behavior: ['user_id','login_frequency','session_duration','clicks_per_session','bounce_rate','target'],
    system_logs: ['log_id','event_type','severity','source','timestamp','target'],
    financial_data: ['record_id','account_balance','transaction_frequency','region','risk_score','target']
  };

  const availableModels = selectedProject ? (mockModels[selectedProject] || []) : [];
  const allFeatures = Array.from(new Set(mockFeatureViews.flatMap(fv => fv.features))).sort();
  const availableFeatures = allFeatures.filter(f => !selectedFeatures.includes(f));

  const toggleAvailable = (f: string) => setAvailableSelection(p => p.includes(f) ? p.filter(x => x !== f) : [...p, f]);
  const toggleChosen = (f: string) => setChosenSelection(p => p.includes(f) ? p.filter(x => x !== f) : [...p, f]);
  const addSelected = () => { if (availableSelection.length) { setSelectedFeatures(prev => [...prev, ...availableSelection]); setAvailableSelection([]);} };
  const removeSelected = () => { if (chosenSelection.length) { setSelectedFeatures(prev => prev.filter(f => !chosenSelection.includes(f))); setChosenSelection([]);} };
  const clearAll = () => { setSelectedFeatures([]); setAvailableSelection([]); setChosenSelection([]); };

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
              <Label>Project</Label>
              <Select value={selectedProject} onValueChange={setSelectedProject} disabled={lockedProjectModel}>
                <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent>
                  {mockProjects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Model</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel} disabled={!selectedProject || lockedProjectModel}>
                <SelectTrigger><SelectValue placeholder="Select model" /></SelectTrigger>
                <SelectContent>
                  {availableModels.map(m => <SelectItem key={m.id} value={m.id}>{m.name} ({m.algorithm})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Source Table</Label>
              <Select value={labelSourceTable} onValueChange={v => { setLabelSourceTable(v); setTargetLabelColumn(''); }}>
                <SelectTrigger><SelectValue placeholder="Select table" /></SelectTrigger>
                <SelectContent>
                  {mockTables.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Target Label Column</Label>
              <Select value={targetLabelColumn} onValueChange={setTargetLabelColumn} disabled={!labelSourceTable}>
                <SelectTrigger><SelectValue placeholder="Select target label column" /></SelectTrigger>
                <SelectContent>
                  {(labelSourceTable ? mockTableColumns[labelSourceTable as keyof typeof mockTableColumns] : []).map(col => <SelectItem key={col} value={col}>{col}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Filter Condition (optional)</Label>
              <Input placeholder="e.g. amount > 100 AND credit_score > 650" value={filterCondition} onChange={e => setFilterCondition(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Features to Include</Label>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="border rounded-md p-3 h-64 flex flex-col">
                  <div className="font-medium text-sm mb-2">Available Features</div>
                  <div className="flex-1 overflow-auto space-y-1 text-sm">
                    {availableFeatures.map(f => (
                      <button key={f} type="button" onClick={() => toggleAvailable(f)} className={`w-full text-left px-2 py-1 rounded border text-xs transition-colors ${availableSelection.includes(f) ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>{f}</button>
                    ))}
                    {!availableFeatures.length && <div className="text-muted-foreground text-xs">None</div>}
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
            </div>

            <div>
              <Label>Model Parameters (JSON/YAML)</Label>
              <Textarea placeholder='{"learning_rate": 0.1, "max_depth": 6}' value={modelParameters} onChange={e => setModelParameters(e.target.value)} className="font-mono text-xs min-h-[100px]" />
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
                <div className="overflow-x-auto">
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
  );
}