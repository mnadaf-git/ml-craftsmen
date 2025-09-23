import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Settings, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface Model {
  id: string;
  name: string;
  description: string;
  algorithm: string;
  experiments: number;
  createdAt: string;
}

const algorithms = [
  "CatboostClassifier",
  "CatboostRegressor", 
  "RandomForestBinaryClassifier",
  "GBTBinaryClassifier",
  "DecisionTreeClassifier"
];

const mockModels: Model[] = [
  {
    id: "1",
    name: "Failure Prediction Model",
    description: "Primary model for predicting system failures",
    algorithm: "CatboostClassifier",
    experiments: 5,
    createdAt: "2024-01-16"
  },
  {
    id: "2",
    name: "Risk Assessment Model", 
    description: "Secondary model for risk assessment",
    algorithm: "RandomForestBinaryClassifier",
    experiments: 3,
    createdAt: "2024-01-18"
  }
];

const projectNames = {
  "1": "ChangeFailure",
  "2": "ChangeCreditScore", 
  "3": "ChangeImpactDetection"
};

export default function ProjectModels() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [models, setModels] = useState<Model[]>(mockModels);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newModel, setNewModel] = useState({
    name: '',
    description: '',
    algorithm: ''
  });

  const projectName = projectNames[projectId as keyof typeof projectNames] || "Unknown Project";

  const handleCreateModel = () => {
    if (!newModel.name.trim() || !newModel.description.trim() || !newModel.algorithm) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    const model: Model = {
      id: Date.now().toString(),
      name: newModel.name,
      description: newModel.description,
      algorithm: newModel.algorithm,
      experiments: 0,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setModels([...models, model]);
    setNewModel({ name: '', description: '', algorithm: '' });
    setIsDialogOpen(false);
    
    toast({
      title: "Success",
      description: "Model created successfully"
    });
  };

  const handleNewExperiment = (modelId: string) => {
    navigate(`/experiments/new?projectId=${projectId}&modelId=${modelId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/projects')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{projectName}</h1>
          <p className="text-muted-foreground">Manage models and experiments for this project</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create New Model
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Model</DialogTitle>
              <DialogDescription>
                Create a new ML model for the {projectName} project
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Model Name</Label>
                <Input
                  id="name"
                  value={newModel.name}
                  onChange={(e) => setNewModel({ ...newModel, name: e.target.value })}
                  placeholder="Enter model name"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newModel.description}
                  onChange={(e) => setNewModel({ ...newModel, description: e.target.value })}
                  placeholder="Enter model description"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="algorithm">ML Algorithm</Label>
                <Select onValueChange={(value) => setNewModel({ ...newModel, algorithm: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select algorithm" />
                  </SelectTrigger>
                  <SelectContent>
                    {algorithms.map((algo) => (
                      <SelectItem key={algo} value={algo}>
                        {algo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateModel}>
                  Create Model
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {models.map((model) => (
          <Card key={model.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{model.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {model.algorithm}
                  </CardDescription>
                </div>
                <Badge variant="secondary">{model.experiments} experiments</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                {model.description}
              </p>
              
              <div className="text-xs text-muted-foreground mb-4">
                Created on {new Date(model.createdAt).toLocaleDateString()}
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configure
                </Button>
                <Button 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleNewExperiment(model.id)}
                >
                  <Play className="h-4 w-4 mr-2" />
                  New Experiment
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {models.length === 0 && (
        <Card className="p-12 text-center">
          <CardContent>
            <div className="space-y-4">
              <Settings className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-lg font-medium">No models yet</h3>
                <p className="text-muted-foreground">Create your first model to get started</p>
              </div>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Model
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}