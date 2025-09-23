import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, GitCompare, Rocket, Badge as BadgeIcon, Eye } from "lucide-react";

interface Experiment {
  id: string;
  name: string;
  version: string;
  project: string;
  model: string;
  status: 'Trained' | 'Not Trained';
  accuracy: number;
  f1Score: number;
  precision: number;
  recall: number;
  roc: number;
  rmse: number;
  createdAt: string;
}

const mockExperiments: Experiment[] = [
  {
    id: "1",
    name: "Experiment-001",
    version: "v1.0",
    project: "ChangeFailure",
    model: "CatboostClassifier",
    status: "Trained",
    accuracy: 94.2,
    f1Score: 0.89,
    precision: 0.91,
    recall: 0.87,
    roc: 0.95,
    rmse: 0.24,
    createdAt: "2024-01-16"
  },
  {
    id: "2",
    name: "Experiment-002", 
    version: "v1.1",
    project: "ChangeFailure",
    model: "RandomForestBinaryClassifier",
    status: "Trained",
    accuracy: 92.8,
    f1Score: 0.85,
    precision: 0.88,
    recall: 0.83,
    roc: 0.93,
    rmse: 0.27,
    createdAt: "2024-01-18"
  },
  {
    id: "3",
    name: "Experiment-003",
    version: "v1.0", 
    project: "ChangeCreditScore",
    model: "CatboostRegressor",
    status: "Not Trained",
    accuracy: 0,
    f1Score: 0,
    precision: 0,
    recall: 0,
    roc: 0,
    rmse: 0,
    createdAt: "2024-01-20"
  }
];

const projects = ["ChangeFailure", "ChangeCreditScore", "ChangeImpactDetection"];
const models = ["CatboostClassifier", "CatboostRegressor", "RandomForestBinaryClassifier", "GBTBinaryClassifier", "DecisionTreeClassifier"];

export default function Experiments() {
  const navigate = useNavigate();
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [selectedModel, setSelectedModel] = useState<string>("all");
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null);

  const filteredExperiments = mockExperiments.filter(exp => {
    const projectMatch = selectedProject === "all" || exp.project === selectedProject;
    const modelMatch = selectedModel === "all" || exp.model === selectedModel;
    return projectMatch && modelMatch;
  });

  const handleNewExperiment = () => {
    navigate('/experiments/new');
  };

  const handleCompare = (experiment: Experiment) => {
    navigate('/experiments/compare', { state: { baseExperiment: experiment } });
  };

  const handleDeploy = (experiment: Experiment) => {
    // Placeholder deployment logic
    console.log('Deploy experiment:', experiment);
  };

  const handleViewExperiment = (experiment: Experiment) => {
    setSelectedExperiment(experiment);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Experiments</h1>
          <p className="text-muted-foreground">Manage, view and compare your ML experiments</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleNewExperiment}>
            <Plus className="h-4 w-4 mr-2" />
            New Experiment
          </Button>
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project} value={project}>{project}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Models</SelectItem>
              {models.map((model) => (
                <SelectItem key={model} value={model}>{model}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Experiments List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Experiments</CardTitle>
              <CardDescription>All experiments with their current status</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Accuracy</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExperiments.map((experiment) => (
                    <TableRow 
                      key={experiment.id}
                      className={selectedExperiment?.id === experiment.id ? "bg-muted/50" : ""}
                    >
                      <TableCell>
                        <button onClick={() => handleViewExperiment(experiment)} className="text-left">
                          <div className="font-medium hover:underline">{experiment.name}</div>
                          <div className="text-sm text-muted-foreground">{experiment.version}</div>
                        </button>
                      </TableCell>
                      <TableCell>{experiment.project}</TableCell>
                      <TableCell className="text-sm">{experiment.model}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={experiment.status === 'Trained' ? 'default' : 'secondary'}
                        >
                          {experiment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {experiment.status === 'Trained' ? `${experiment.accuracy}%` : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleViewExperiment(experiment)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {experiment.status === 'Trained' && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleCompare(experiment)}
                              >
                                <GitCompare className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDeploy(experiment)}
                              >
                                <Rocket className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Experiment Details */}
        <div>
          {selectedExperiment ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{selectedExperiment.name}</CardTitle>
                    <CardDescription>{selectedExperiment.version}</CardDescription>
                  </div>
                  {selectedExperiment.status === 'Trained' && (
                    <div className="flex gap-1">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleCompare(selectedExperiment)}
                      >
                        Compare
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => handleDeploy(selectedExperiment)}
                      >
                        Deploy
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {selectedExperiment.status === 'Trained' ? (
                  <Tabs defaultValue="metrics" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="metrics">Metrics</TabsTrigger>
                      <TabsTrigger value="details">Details</TabsTrigger>
                    </TabsList>
                    <TabsContent value="metrics" className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Model Summary</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Accuracy</span>
                            <span className="font-medium">{selectedExperiment.accuracy}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">F1 Score</span>
                            <span className="font-medium">{selectedExperiment.f1Score}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Precision</span>
                            <span className="font-medium">{selectedExperiment.precision}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Recall</span>
                            <span className="font-medium">{selectedExperiment.recall}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">ROC AUC</span>
                            <span className="font-medium">{selectedExperiment.roc}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">RMSE</span>
                            <span className="font-medium">{selectedExperiment.rmse}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Confusion Matrix</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-muted p-2 rounded text-center">
                            <div className="font-medium">TN</div>
                            <div>847</div>
                          </div>
                          <div className="bg-muted p-2 rounded text-center">
                            <div className="font-medium">FP</div>
                            <div>23</div>
                          </div>
                          <div className="bg-muted p-2 rounded text-center">
                            <div className="font-medium">FN</div>
                            <div>35</div>
                          </div>
                          <div className="bg-muted p-2 rounded text-center">
                            <div className="font-medium">TP</div>
                            <div>95</div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    <TabsContent value="details" className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Model Parameters</h4>
                        <div className="text-sm space-y-1">
                          <div>learning_rate: 0.1</div>
                          <div>max_depth: 6</div>
                          <div>n_estimators: 100</div>
                          <div>random_state: 42</div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Additional Diagnostics</h4>
                        <div className="text-sm space-y-1">
                          <div><strong>Target column:</strong> is_fraud</div>
                          <div><strong>Key column:</strong> transaction_id</div>
                          <div><strong>Selected features:</strong> 15</div>
                          <div><strong>Dataset size:</strong> 5,000 rows</div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                ) : (
                  <div className="text-center py-8">
                    <BadgeIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-medium mb-2">Experiment Not Trained</h3>
                    <p className="text-sm text-muted-foreground">
                      This experiment hasn't been trained yet. Train the model to view metrics and details.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Eye className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">Select an Experiment</h3>
                <p className="text-sm text-muted-foreground">
                  Choose an experiment from the list to view its details and metrics
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}