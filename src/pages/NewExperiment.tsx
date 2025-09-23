import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Upload, Download, Calendar, Filter, CheckSquare, Play, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface FeatureView {
  id: string;
  name: string;
  features: string[];
}

const mockProjects = [
  { id: "1", name: "ChangeFailure" },
  { id: "2", name: "ChangeCreditScore" },
  { id: "3", name: "ChangeImpactDetection" }
];

const mockModels = {
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

const mockTables = [
  "customer_transactions", 
  "user_behavior", 
  "system_logs", 
  "financial_data"
];

const mockFeatureViews: FeatureView[] = [
  {
    id: "1",
    name: "Customer Features",
    features: ["age", "income", "credit_score", "account_balance", "transaction_frequency"]
  },
  {
    id: "2", 
    name: "Transaction Features",
    features: ["amount", "merchant_category", "time_of_day", "day_of_week", "location"]
  },
  {
    id: "3",
    name: "Behavioral Features", 
    features: ["login_frequency", "session_duration", "clicks_per_session", "bounce_rate"]
  }
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
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [filterCondition, setFilterCondition] = useState('');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [modelParameters, setModelParameters] = useState('');
  const [datasetGenerated, setDatasetGenerated] = useState(false);
  const [trainingSubmitted, setTrainingSubmitted] = useState(false);

  const availableModels = selectedProject ? mockModels[selectedProject as keyof typeof mockModels] || [] : [];

  const handleFeatureToggle = (featureId: string, checked: boolean) => {
    if (checked) {
      setSelectedFeatures([...selectedFeatures, featureId]);
    } else {
      setSelectedFeatures(selectedFeatures.filter(id => id !== featureId));
    }
  };

  const handleGenerateDataset = () => {
    if (!selectedProject || !selectedModel || !labelSourceTable) {
      toast({
        title: "Error",
        description: "Please fill in required fields",
        variant: "destructive"
      });
      return;
    }

    setDatasetGenerated(true);
    toast({
      title: "Success",
      description: "Training dataset generated successfully"
    });
  };

  const handleTrainModel = () => {
    setTrainingSubmitted(true);
    toast({
      title: "Success", 
      description: "Training job submitted successfully"
    });
    
    setTimeout(() => {
      navigate('/experiments/summary');
    }, 2000);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          JSON.parse(content); // Validate JSON
          setModelParameters(content);
          toast({
            title: "Success",
            description: "JSON file uploaded successfully"
          });
        } catch (error) {
          toast({
            title: "Error",
            description: "Invalid JSON file",
            variant: "destructive"
          });
        }
      };
      reader.readAsText(file);
    }
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
            <CardDescription>
              Your model training has been queued and will begin shortly
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Redirecting to Experimentation Summary...
            </p>
            <Button variant="outline" onClick={() => navigate('/experiments/summary')}>
              Go to Summary
            </Button>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Form */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Experiment Configuration</CardTitle>
              <CardDescription>Select project, model and configure parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="project">Project</Label>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockProjects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="model">Model</Label>
                <Select value={selectedModel} onValueChange={setSelectedModel} disabled={!selectedProject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableModels.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.name} ({model.algorithm})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="labelTable">Label Source Table</Label>
                <Select value={labelSourceTable} onValueChange={setLabelSourceTable}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select target table" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockTables.map((table) => (
                      <SelectItem key={table} value={table}>
                        {table}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <Calendar className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <Calendar className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div>
                <Label htmlFor="filter">Filter Condition</Label>
                <Textarea
                  id="filter"
                  placeholder="Enter SQL WHERE condition (e.g., amount > 100 AND status = 'active')"
                  value={filterCondition}
                  onChange={(e) => setFilterCondition(e.target.value)}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Features to Include</CardTitle>
              <CardDescription>Select features from available feature views</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockFeatureViews.map((featureView) => (
                <div key={featureView.id} className="space-y-2">
                  <h4 className="font-medium">{featureView.name}</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {featureView.features.map((feature) => (
                      <div key={feature} className="flex items-center space-x-2">
                        <Checkbox
                          id={feature}
                          checked={selectedFeatures.includes(feature)}
                          onCheckedChange={(checked) => handleFeatureToggle(feature, checked as boolean)}
                        />
                        <Label htmlFor={feature} className="text-sm">
                          {feature}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Model Parameters</CardTitle>
              <CardDescription>Upload JSON file or enter parameters manually</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="file-upload">Upload JSON File</Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="cursor-pointer"
                />
              </div>
              
              <div>
                <Label htmlFor="parameters">Model Parameters (JSON)</Label>
                <Textarea
                  id="parameters"
                  placeholder='{"learning_rate": 0.1, "max_depth": 6, "n_estimators": 100}'
                  value={modelParameters}
                  onChange={(e) => setModelParameters(e.target.value)}
                  rows={6}
                />
              </div>

              <Button onClick={handleGenerateDataset} className="w-full">
                <Database className="h-4 w-4 mr-2" />
                Generate Training Dataset
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Results Panel */}
        <div className="space-y-6">
          {datasetGenerated && (
            <Card>
              <CardHeader>
                <CardTitle>Generated Dataset Sample</CardTitle>
                <CardDescription>Preview of the training dataset</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Dataset contains {mockDatasetSample.length} rows with {Object.keys(mockDatasetSample[0]).length} features
                  </div>
                  
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
                        {mockDatasetSample.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell>{row.id}</TableCell>
                            <TableCell>{row.age}</TableCell>
                            <TableCell>${row.income.toLocaleString()}</TableCell>
                            <TableCell>{row.credit_score}</TableCell>
                            <TableCell>${row.amount}</TableCell>
                            <TableCell>{row.merchant}</TableCell>
                            <TableCell>
                              <Badge variant={row.target === 1 ? "destructive" : "secondary"}>
                                {row.target}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t">
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download Dataset
                    </Button>
                    <Badge variant="secondary">5,000 total rows</Badge>
                  </div>
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
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Project:</span>
                      <div className="font-medium">
                        {mockProjects.find(p => p.id === selectedProject)?.name || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Model:</span>
                      <div className="font-medium">
                        {availableModels.find(m => m.id === selectedModel)?.name || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Features:</span>
                      <div className="font-medium">{selectedFeatures.length} selected</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Dataset Size:</span>
                      <div className="font-medium">5,000 rows</div>
                    </div>
                  </div>

                  <Button onClick={handleTrainModel} className="w-full" size="lg">
                    <Play className="h-4 w-4 mr-2" />
                    Train the Model
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}