import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Grid, List, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface Project {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  modelCount: number;
}

const mockProjects: Project[] = [
  {
    id: "1",
    title: "ChangeFailure",
    description: "Predict system failures based on change patterns and historical data",
    createdAt: "2024-01-15",
    modelCount: 3
  },
  {
    id: "2", 
    title: "ChangeCreditScore",
    description: "Analyze credit score changes and predict future credit behavior",
    createdAt: "2024-01-20",
    modelCount: 2
  },
  {
    id: "3",
    title: "ChangeImpactDetection", 
    description: "Detect and assess the impact of changes in business processes",
    createdAt: "2024-01-25",
    modelCount: 4
  }
];

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({ title: '', description: '' });
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleCreateProject = () => {
    if (!newProject.title.trim() || !newProject.description.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    const project: Project = {
      id: Date.now().toString(),
      title: newProject.title,
      description: newProject.description,
      createdAt: new Date().toISOString().split('T')[0],
      modelCount: 0
    };

    setProjects([...projects, project]);
    setNewProject({ title: '', description: '' });
    setIsDialogOpen(false);
    
    toast({
      title: "Success",
      description: "Project created successfully"
    });
  };

  const handleViewProject = (projectId: string) => {
    navigate(`/projects/${projectId}/models`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Projects</h1>
          <p className="text-muted-foreground">Manage your ML projects and models</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-lg">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>
                  Create a new ML project to organize your models and experiments
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Project Title</Label>
                  <Input
                    id="title"
                    value={newProject.title}
                    onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                    placeholder="Enter project title"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    placeholder="Enter project description"
                    rows={3}
                  />
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateProject}>
                    Create Project
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
        {projects.map((project) => (
          <Card key={project.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{project.title}</CardTitle>
                  <CardDescription className="text-sm">
                    Created on {new Date(project.createdAt).toLocaleDateString()}
                  </CardDescription>
                </div>
                <Badge variant="secondary">{project.modelCount} models</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                {project.description}
              </p>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => handleViewProject(project.id)}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Models
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {projects.length === 0 && (
        <Card className="p-12 text-center">
          <CardContent>
            <div className="space-y-4">
              <Plus className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-lg font-medium">No projects yet</h3>
                <p className="text-muted-foreground">Create your first project to get started</p>
              </div>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}