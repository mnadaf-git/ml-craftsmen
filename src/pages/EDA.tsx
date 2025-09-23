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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Play, 
  Database, 
  BarChart3, 
  FileText, 
  Settings,
  CheckCircle,
  Clock
} from "lucide-react";

interface EDAJob {
  id: string;
  status: 'running' | 'completed';
  duration?: string; // populated on completion
  features?: number;
  rows?: number;
  completedAt?: string;
}

export default function EDA() {
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [jobs, setJobs] = useState<EDAJob[]>([
    {
      id: 'eda-1732383000000',
      status: 'completed',
      duration: '1m 12s',
      features: 18,
      rows: 82000,
      completedAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 'eda-1732469400000',
      status: 'completed',
      duration: '2m 05s',
      features: 24,
      rows: 150000,
      completedAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 'eda-1732471200000',
      status: 'completed',
      duration: '3m 44s',
      features: 30,
      rows: 250000,
      completedAt: new Date(Date.now() - 1800000).toISOString()
    }
  ]);
  const [selectedJob, setSelectedJob] = useState<EDAJob | null>(null);
  const [showConfig, setShowConfig] = useState(false);

  const handleCreateNewJob = () => {
    // Reset selection and show configuration
    setSelectedJob(null);
    setShowConfig(true);
    requestAnimationFrame(() => {
      const el = document.getElementById('eda-config');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    });
  };

  const handleRunEDA = () => {
    const newJob: EDAJob = {
      id: 'eda-' + Date.now(),
      status: 'running'
    };
    setJobs(prev => [newJob, ...prev]);
    setSelectedJob(newJob);
    setIsRunning(true);
    toast({
      title: 'EDA Job Started',
      description: 'Your exploratory data analysis job is now running...'
    });

    // Simulate completion
    setTimeout(() => {
      setIsRunning(false);
      setJobs(prev => prev.map(j => j.id === newJob.id ? {
        ...j,
        status: 'completed',
        duration: '2m 34s',
        features: 24,
        rows: 150000,
        completedAt: new Date().toISOString()
      } : j));
      setSelectedJob(j => j && j.id === newJob.id ? {
        ...j,
        status: 'completed',
        duration: '2m 34s',
        features: 24,
        rows: 150000,
        completedAt: new Date().toISOString()
      } : j);
      toast({
        title: 'EDA Job Completed',
        description: 'Your analysis is ready for review.'
      });
    }, 3000);
  };

  const handleRowSelect = (job: EDAJob) => {
    if (job.status === 'completed') {
      setSelectedJob(job);
      requestAnimationFrame(() => {
        const el = document.getElementById('eda-results');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Exploratory Data Analysis</h1>
          <p className="text-muted-foreground">Configure and run comprehensive data analysis jobs</p>
        </div>
        <Button onClick={handleCreateNewJob} variant="default">
          Create new EDA Job
        </Button>
      </div>

      {/* Jobs List */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">EDA</CardTitle>
          <CardDescription>Previous analysis jobs</CardDescription>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No EDA jobs yet. Configure and run your first job below.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Features</TableHead>
                    <TableHead>Rows</TableHead>
                    <TableHead>Completed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map(job => (
                    <TableRow
                      key={job.id}
                      className={(selectedJob?.id === job.id ? 'bg-muted/40 ' : '') + (job.status === 'completed' ? 'cursor-pointer hover:bg-muted/50' : 'opacity-60')}
                      onClick={() => handleRowSelect(job)}
                    >
                      <TableCell className="font-mono text-xs">{job.id}</TableCell>
                      <TableCell>
                        <Badge variant={job.status === 'completed' ? 'default' : 'secondary'}>
                          {job.status === 'running' ? 'Running' : 'Completed'}
                        </Badge>
                      </TableCell>
                      <TableCell>{job.duration || '-'}</TableCell>
                      <TableCell>{job.features ?? '-'}</TableCell>
                      <TableCell>{job.rows ? job.rows.toLocaleString() : '-'}</TableCell>
                      <TableCell>{job.completedAt ? new Date(job.completedAt).toLocaleTimeString() : '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

  {showConfig && !(selectedJob && selectedJob.status === 'completed') && (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* EDA Configuration */}
  <Card id="eda-config" className="lg:col-span-2 bg-card border-border">
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
                      <SelectItem value="sweetviz">Sweetviz</SelectItem>
                      <SelectItem value="pandas-profiling">Pandas profiling</SelectItem>
                      <SelectItem value="data-profiling">Data profiling</SelectItem>
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

  {/* Removed Quick Actions per requirement */}
  </div>
  )}

      {/* Results Section */}
  {selectedJob && selectedJob.status === 'completed' && (
        <Card id="eda-results" className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              EDA Results
            </CardTitle>
            <CardDescription>
      Analysis completed on {selectedJob.completedAt ? new Date(selectedJob.completedAt).toLocaleString() : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Report Header - Pandas Profiling Style */}
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-6 rounded-lg border border-border/50 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Pandas Profiling Report</h2>
                  <p className="text-muted-foreground">Generated on {selectedJob.completedAt ? new Date(selectedJob.completedAt).toLocaleDateString() : ''}</p>
                </div>
                <Badge variant="default" className="text-lg px-4 py-2">Complete</Badge>
              </div>
              
              {/* Dataset Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-semibold text-2xl text-primary">{selectedJob.rows?.toLocaleString()}</div>
                  <div className="text-muted-foreground">Observations</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-2xl text-primary">{selectedJob.features}</div>
                  <div className="text-muted-foreground">Variables</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-2xl text-warning">2.3k</div>
                  <div className="text-muted-foreground">Missing cells</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-2xl text-destructive">247</div>
                  <div className="text-muted-foreground">Duplicate rows</div>
                </div>
              </div>
            </div>

            {/* Analysis Sections */}
            <div className="space-y-6">
              {/* Overview Section */}
              <div className="border border-border rounded-lg">
                <div className="bg-muted/30 px-4 py-3 border-b border-border">
                  <h3 className="font-semibold flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Overview
                  </h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-muted/20">
                      <h4 className="font-medium text-foreground mb-2">Data Quality</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Complete cells</span>
                          <span className="text-success">98.5%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Missing cells</span>
                          <span className="text-warning">1.5%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div className="bg-success h-2 rounded-full" style={{width: '98.5%'}}></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 rounded-lg bg-muted/20">
                      <h4 className="font-medium text-foreground mb-2">Variable Types</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Numeric</span>
                          <Badge variant="secondary">12</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Categorical</span>
                          <Badge variant="secondary">8</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Boolean</span>
                          <Badge variant="secondary">2</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>DateTime</span>
                          <Badge variant="secondary">2</Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 rounded-lg bg-muted/20">
                      <h4 className="font-medium text-foreground mb-2">Alerts</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-warning">
                          <div className="w-2 h-2 bg-warning rounded-full"></div>
                          <span>High correlation detected</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-destructive">
                          <div className="w-2 h-2 bg-destructive rounded-full"></div>
                          <span>Outliers found in income</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-info">
                          <div className="w-2 h-2 bg-info rounded-full"></div>
                          <span>Skewed distributions</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Variables Section */}
              <div className="border border-border rounded-lg">
                <div className="bg-muted/30 px-4 py-3 border-b border-border">
                  <h3 className="font-semibold">Variables</h3>
                </div>
                <div className="p-4">
                  <div className="space-y-3">
                    {['age', 'income', 'location', 'tenure'].map((variable) => (
                      <div key={variable} className="flex items-center justify-between p-3 border border-border/50 rounded-lg hover:bg-muted/20">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-xs">NUM</Badge>
                          <span className="font-medium">{variable}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Distinct: {Math.floor(Math.random() * 1000)}</span>
                          <span>Missing: {Math.floor(Math.random() * 5)}%</span>
                          <Button variant="ghost" size="sm">
                            <BarChart3 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Correlations Section */}
              <div className="border border-border rounded-lg">
                <div className="bg-muted/30 px-4 py-3 border-b border-border">
                  <h3 className="font-semibold">Correlations</h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">Highly correlated pairs</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between p-2 rounded bg-muted/20">
                          <span>age ↔ income</span>
                          <Badge variant="destructive">0.82</Badge>
                        </div>
                        <div className="flex justify-between p-2 rounded bg-muted/20">
                          <span>tenure ↔ purchases</span>
                          <Badge variant="secondary">0.75</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="aspect-square bg-muted/20 rounded-lg flex items-center justify-center text-muted-foreground">
                      Correlation Heatmap
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-4 pt-6">
              <Button variant="secondary">
                <FileText className="h-4 w-4 mr-2" />
                Download Full Report
              </Button>
              <Button variant="outline">
                <BarChart3 className="h-4 w-4 mr-2" />
                Export Visualizations
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}