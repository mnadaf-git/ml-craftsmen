import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, BarChart3, Activity } from "lucide-react";

export default function Experiments() {
  const navigate = useNavigate();

  const handleNewExperiment = () => {
    navigate('/experiments/new');
  };

  const handleViewSummary = () => {
    navigate('/experiments/summary');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Experiments</h1>
          <p className="text-muted-foreground">Manage your ML experiments and training workflows</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button onClick={handleNewExperiment}>
            <Plus className="h-4 w-4 mr-2" />
            New Experiment
          </Button>
          <Button variant="outline" onClick={handleViewSummary}>
            <BarChart3 className="h-4 w-4 mr-2" />
            View Summary
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={handleNewExperiment}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create Experiment
            </CardTitle>
            <CardDescription>
              Start a new experiment with project and model selection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Configure training parameters, features, and generate datasets
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={handleViewSummary}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Experiment Summary
            </CardTitle>
            <CardDescription>
              View all experiments and their performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Compare experiments, view metrics, and deploy models
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Model Performance
            </CardTitle>
            <CardDescription>
              Track model performance and deployment status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Active Models</span>
                <span className="font-semibold">12</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Deployed</span>
                <span className="font-semibold text-green-600">8</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Avg Accuracy</span>
                <span className="font-semibold">94.2%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}