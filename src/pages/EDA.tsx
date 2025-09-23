import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Play, 
  Database, 
  BarChart3, 
  FileText, 
  Settings,
  CheckCircle,
  Clock,
  Upload
} from "lucide-react";

export default function EDA() {
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [jobResults, setJobResults] = useState<any>(null);

  const handleRunEDA = () => {
    setIsRunning(true);
    toast({
      title: "EDA Job Started",
      description: "Your exploratory data analysis job is now running...",
    });

    // Simulate job completion
    setTimeout(() => {
      setIsRunning(false);
      setJobResults({
        id: "eda-" + Date.now(),
        status: "completed",
        duration: "2m 34s",
        features: 24,
        rows: 150000,
        completedAt: new Date().toISOString()
      });
      toast({
        title: "EDA Job Completed",
        description: "Your analysis is ready for review.",
      });
    }, 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Exploratory Data Analysis</h1>
        <p className="text-muted-foreground">
          Configure and run comprehensive data analysis jobs
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* EDA Configuration */}
        <Card className="lg:col-span-2 bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              EDA Configuration
            </CardTitle>
            <CardDescription>
              Set up your exploratory data analysis parameters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Data Source */}
            <div className="space-y-4">
              <Label className="text-base font-medium flex items-center gap-2">
                <Database className="h-4 w-4" />
                Data Source
              </Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="database">Database</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select database" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prod">Production DB</SelectItem>
                      <SelectItem value="staging">Staging DB</SelectItem>
                      <SelectItem value="warehouse">Data Warehouse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="table">Table</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select table" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customers">customers</SelectItem>
                      <SelectItem value="transactions">transactions</SelectItem>
                      <SelectItem value="products">products</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Feature Selection */}
            <div className="space-y-4">
              <Label className="text-base font-medium flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Feature Selection
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {['age', 'income', 'location', 'tenure', 'purchases', 'category', 'rating', 'last_active'].map((feature) => (
                  <label key={feature} className="flex items-center space-x-2 p-2 rounded border border-border hover:bg-muted/50 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm">{feature}</span>
                  </label>
                ))}
              </div>
            </div>

            <Separator />

            {/* EDA Parameters */}
            <div className="space-y-4">
              <Label className="text-base font-medium">EDA Parameters</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sample-size">Sample Size</Label>
                  <Input
                    id="sample-size"
                    placeholder="100000"
                    value="100000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="analysis-type">Analysis Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="comprehensive">Comprehensive</SelectItem>
                      <SelectItem value="statistical">Statistical Only</SelectItem>
                      <SelectItem value="visual">Visual Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom-params">Custom Parameters (JSON)</Label>
                <Textarea
                  id="custom-params"
                  placeholder='{"correlation_threshold": 0.8, "outlier_detection": true}'
                  className="font-mono text-sm"
                  rows={3}
                />
              </div>
            </div>

            <div className="pt-4">
              <Button 
                onClick={handleRunEDA}
                disabled={isRunning}
                className="w-full"
                size="lg"
              >
                {isRunning ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Running EDA Job...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Run EDA Job
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Job Status & Quick Actions */}
        <div className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Job Status</CardTitle>
            </CardHeader>
            <CardContent>
              {isRunning ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary animate-spin" />
                    <span className="text-sm">Running...</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                  </div>
                  <p className="text-xs text-muted-foreground">Analyzing data patterns and generating insights</p>
                </div>
              ) : jobResults ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-sm font-medium">Completed</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duration:</span>
                      <span>{jobResults.duration}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Features:</span>
                      <span>{jobResults.features}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rows:</span>
                      <span>{jobResults.rows.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No active jobs</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Upload Dataset
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                View Templates
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <Database className="h-4 w-4 mr-2" />
                Data Sources
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Results Section */}
      {jobResults && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              EDA Results
            </CardTitle>
            <CardDescription>
              Analysis completed on {new Date(jobResults.completedAt).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                <h4 className="font-medium text-foreground mb-2">Data Quality</h4>
                <Badge variant="default">98.5% Complete</Badge>
                <p className="text-xs text-muted-foreground mt-1">Missing values: 2.3k (1.5%)</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                <h4 className="font-medium text-foreground mb-2">Correlations</h4>
                <Badge variant="secondary">5 Strong</Badge>
                <p className="text-xs text-muted-foreground mt-1">Age-Income: 0.82</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                <h4 className="font-medium text-foreground mb-2">Outliers</h4>
                <Badge variant="outline">247 Detected</Badge>
                <p className="text-xs text-muted-foreground mt-1">Income field: 89 outliers</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <Button variant="secondary" className="mr-2">
                <FileText className="h-4 w-4 mr-2" />
                Download Report
              </Button>
              <Button variant="outline">
                <BarChart3 className="h-4 w-4 mr-2" />
                View Visualizations
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}