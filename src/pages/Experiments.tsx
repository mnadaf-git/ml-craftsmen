import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { 
  Plus, 
  FolderOpen, 
  Beaker, 
  GitBranch,
  TrendingUp,
  Calendar,
  Users,
  Activity,
  ChevronRight,
  Search
} from "lucide-react";

export default function Experiments() {
  const { toast } = useToast();
  const [newProjectName, setNewProjectName] = useState("");

  const projects = [
    {
      id: "1",
      name: "Customer Churn Prediction",
      description: "Predicting customer churn using behavioral data",
      modelCount: 12,
      lastUpdated: "2 hours ago",
      status: "active",
      owner: "Sarah Chen"
    },
    {
      id: "2", 
      name: "Recommendation Engine",
      description: "Product recommendation system for e-commerce",
      modelCount: 8,
      lastUpdated: "1 day ago",
      status: "deployed", 
      owner: "Alex Rodriguez"
    },
    {
      id: "3",
      name: "Fraud Detection",
      description: "Real-time transaction fraud detection model",
      modelCount: 15,
      lastUpdated: "3 days ago",
      status: "training",
      owner: "Jordan Kim"
    }
  ];

  const recentExperiments = [
    { project: "Customer Churn", model: "XGBoost v2.1", accuracy: "94.2%", status: "completed" },
    { project: "Recommendation", model: "Neural CF v1.3", recall: "87.5%", status: "training" },
    { project: "Fraud Detection", model: "Random Forest v3.0", precision: "96.1%", status: "failed" },
  ];

  const handleCreateProject = () => {
    if (!newProjectName.trim()) return;
    
    toast({
      title: "Project Created",
      description: `"${newProjectName}" project has been created successfully.`,
    });
    setNewProjectName("");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Model Experiments</h1>
          <p className="text-muted-foreground">
            Manage projects, train models, and track experiments
          </p>
        </div>
        
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search projects..." className="pl-10 w-64" />
          </div>
        </div>
      </div>

      {/* Create New Project */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Create New Project
          </CardTitle>
          <CardDescription>
            Start a new machine learning project to organize your experiments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="project-name" className="sr-only">Project Name</Label>
              <Input
                id="project-name"
                placeholder="Enter project name..."
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateProject()}
              />
            </div>
            <Button onClick={handleCreateProject} disabled={!newProjectName.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              Create Project
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects List */}
        <Card className="lg:col-span-2 bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-primary" />
              Active Projects
            </CardTitle>
            <CardDescription>
              {projects.length} projects in your workspace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="group p-4 rounded-lg border border-border hover:bg-muted/30 transition-smooth cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {project.name}
                        </h3>
                        <Badge 
                          variant={
                            project.status === "active" ? "default" :
                            project.status === "deployed" ? "secondary" :
                            "outline"
                          }
                        >
                          {project.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {project.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Beaker className="h-3 w-3" />
                          {project.modelCount} models
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {project.owner}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {project.lastUpdated}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity & Stats */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Projects</span>
                <span className="font-bold text-lg">{projects.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Active Models</span>
                <span className="font-bold text-lg">35</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Success Rate</span>
                <span className="font-bold text-lg text-success">92.4%</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Deployed Models</span>
                <span className="font-bold text-lg text-accent">8</span>
              </div>
            </CardContent>
          </Card>

          {/* Recent Experiments */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="h-4 w-4" />
                Recent Experiments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentExperiments.map((exp, index) => (
                  <div key={index} className="p-3 rounded-lg bg-muted/20 border border-border/50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{exp.model}</span>
                      <Badge 
                        variant={
                          exp.status === "completed" ? "default" :
                          exp.status === "training" ? "secondary" :
                          "destructive"
                        }
                        className="text-xs"
                      >
                        {exp.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">{exp.project}</p>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-3 w-3 text-primary" />
                      <span className="text-xs">
                        {exp.accuracy || exp.recall || exp.precision}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}