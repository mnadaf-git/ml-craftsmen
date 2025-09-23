import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, GitCompare, BarChart3, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Experiment {
  id: string;
  name: string;
  version: string;
  project: string;
  model: string;
  accuracy: number;
  f1Score: number;
  precision: number;
  recall: number;
  roc: number;
  rmse: number;
}

const mockExperiments: Experiment[] = [
  {
    id: "1",
    name: "Experiment-001",
    version: "v1.0",
    project: "ChangeFailure",
    model: "CatboostClassifier",
    accuracy: 94.2,
    f1Score: 0.89,
    precision: 0.91,
    recall: 0.87,
    roc: 0.95,
    rmse: 0.24
  },
  {
    id: "2",
    name: "Experiment-002",
    version: "v1.1", 
    project: "ChangeFailure",
    model: "RandomForestBinaryClassifier",
    accuracy: 92.8,
    f1Score: 0.85,
    precision: 0.88,
    recall: 0.83,
    roc: 0.93,
    rmse: 0.27
  },
  {
    id: "4",
    name: "Experiment-004",
    version: "v2.0",
    project: "ChangeCreditScore", 
    model: "CatboostRegressor",
    accuracy: 91.5,
    f1Score: 0.82,
    precision: 0.85,
    recall: 0.79,
    roc: 0.90,
    rmse: 0.29
  }
];

const projects = ["ChangeFailure", "ChangeCreditScore", "ChangeImpactDetection"];
const models = ["CatboostClassifier", "CatboostRegressor", "RandomForestBinaryClassifier", "GBTBinaryClassifier", "DecisionTreeClassifier"];

export default function ExperimentComparison() {
  const navigate = useNavigate();
  const location = useLocation();
  const baseExperiment = location.state?.baseExperiment as Experiment;
  
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [selectedExperiment, setSelectedExperiment] = useState<string>("");
  const [comparisonResult, setComparisonResult] = useState<{base: Experiment, compare: Experiment} | null>(null);

  const availableExperiments = mockExperiments.filter(exp => {
    const projectMatch = !selectedProject || exp.project === selectedProject;
    const modelMatch = !selectedModel || exp.model === selectedModel;
    const notBase = exp.id !== baseExperiment?.id;
    return projectMatch && modelMatch && notBase;
  });

  const handleCompare = () => {
    const compareExp = mockExperiments.find(exp => exp.id === selectedExperiment);
    if (baseExperiment && compareExp) {
      setComparisonResult({ base: baseExperiment, compare: compareExp });
    }
  };

  const getMetricComparison = (baseValue: number, compareValue: number, higherIsBetter: boolean = true) => {
    const diff = compareValue - baseValue;
    const isPositive = higherIsBetter ? diff > 0 : diff < 0;
    return {
      diff: Math.abs(diff),
      isPositive,
      percentage: ((diff / baseValue) * 100).toFixed(1)
    };
  };

  const formatMetricValue = (metric: string, value: number) => {
    if (metric === 'accuracy') return `${value}%`;
    return value.toFixed(3);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/experiments/summary')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Summary
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-foreground">Experiment Comparison</h1>
        <p className="text-muted-foreground">Compare experiments side by side</p>
      </div>

      {/* Base Experiment Info */}
      {baseExperiment && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Base Experiment
            </CardTitle>
            <CardDescription>Comparing against this experiment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Name:</span>
                <div className="font-medium">{baseExperiment.name} {baseExperiment.version}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Project:</span>
                <div className="font-medium">{baseExperiment.project}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Model:</span>
                <div className="font-medium">{baseExperiment.model}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Accuracy:</span>
                <div className="font-medium">{baseExperiment.accuracy}%</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comparison Setup */}
      <Card>
        <CardHeader>
          <CardTitle>Select Experiment to Compare</CardTitle>
          <CardDescription>Choose project, model, and experiment for comparison</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Project</label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project} value={project}>
                      {project}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Model</label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {models.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Experiment</label>
              <Select value={selectedExperiment} onValueChange={setSelectedExperiment}>
                <SelectTrigger>
                  <SelectValue placeholder="Select experiment" />
                </SelectTrigger>
                <SelectContent>
                  {availableExperiments.map((exp) => (
                    <SelectItem key={exp.id} value={exp.id}>
                      {exp.name} {exp.version}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleCompare} disabled={!selectedExperiment} className="w-full">
            <GitCompare className="h-4 w-4 mr-2" />
            Compare Experiments
          </Button>
        </CardContent>
      </Card>

      {/* Comparison Results */}
      {comparisonResult && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Comparison Results
              </CardTitle>
              <CardDescription>Side-by-side metrics comparison</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Metric</TableHead>
                    <TableHead>Base ({comparisonResult.base.name})</TableHead>
                    <TableHead>Compare ({comparisonResult.compare.name})</TableHead>
                    <TableHead>Difference</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { key: 'accuracy', label: 'Accuracy', higherIsBetter: true },
                    { key: 'f1Score', label: 'F1 Score', higherIsBetter: true },
                    { key: 'precision', label: 'Precision', higherIsBetter: true },
                    { key: 'recall', label: 'Recall', higherIsBetter: true },
                    { key: 'roc', label: 'ROC AUC', higherIsBetter: true },
                    { key: 'rmse', label: 'RMSE', higherIsBetter: false }
                  ].map(({ key, label, higherIsBetter }) => {
                    const baseValue = comparisonResult.base[key as keyof Experiment] as number;
                    const compareValue = comparisonResult.compare[key as keyof Experiment] as number;
                    const comparison = getMetricComparison(baseValue, compareValue, higherIsBetter);
                    
                    return (
                      <TableRow key={key}>
                        <TableCell className="font-medium">{label}</TableCell>
                        <TableCell>{formatMetricValue(key, baseValue)}</TableCell>
                        <TableCell>{formatMetricValue(key, compareValue)}</TableCell>
                        <TableCell>
                          <Badge variant={comparison.isPositive ? "default" : "destructive"}>
                            {comparison.isPositive ? "+" : "-"}
                            {formatMetricValue(key, comparison.diff)} ({comparison.percentage}%)
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Base Experiment Details</CardTitle>
                <CardDescription>{comparisonResult.base.name} {comparisonResult.base.version}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Project:</span>
                    <span>{comparisonResult.base.project}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Model:</span>
                    <span>{comparisonResult.base.model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Best Metric:</span>
                    <span>Accuracy: {comparisonResult.base.accuracy}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Compare Experiment Details</CardTitle>
                <CardDescription>{comparisonResult.compare.name} {comparisonResult.compare.version}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Project:</span>
                    <span>{comparisonResult.compare.project}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Model:</span>
                    <span>{comparisonResult.compare.model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Best Metric:</span>
                    <span>Accuracy: {comparisonResult.compare.accuracy}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}