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
  const [reportLoading, setReportLoading] = useState(false);
  // Feature selection (list builder) state
  const baseFeaturePool = ['age', 'income', 'location', 'tenure', 'purchases', 'category', 'rating', 'last_active'];
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [availableSelection, setAvailableSelection] = useState<string[]>([]); // features currently highlighted on left
  const [chosenSelection, setChosenSelection] = useState<string[]>([]); // features currently highlighted on right
  const availableFeatures = baseFeaturePool.filter(f => !selectedFeatures.includes(f));

  const toggleAvailable = (f: string) => setAvailableSelection(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  const toggleChosen = (f: string) => setChosenSelection(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  const addSelected = () => {
    if (availableSelection.length) {
      setSelectedFeatures(prev => [...prev, ...availableSelection]);
      setAvailableSelection([]);
    }
  };
  const removeSelected = () => {
    if (chosenSelection.length) {
      setSelectedFeatures(prev => prev.filter(f => !chosenSelection.includes(f)));
      setChosenSelection([]);
    }
  };
  const clearAllFeatures = () => {
    setSelectedFeatures([]);
    setAvailableSelection([]);
    setChosenSelection([]);
  };

  const handleCreateNewJob = () => {
    // Reset selection and show configuration
    setSelectedJob(null);
    setShowConfig(true);
    // Reset feature selections for fresh job config
    clearAllFeatures();
    requestAnimationFrame(() => {
      const el = document.getElementById('eda-config');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    });
  };

  const handleRunEDA = () => {
    if (!selectedFeatures.length) {
      toast({ title: 'Select Features', description: 'Please select at least one feature before running the EDA job.', variant: 'destructive' });
      return;
    }
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
  features: selectedFeatures.length || 0,
        rows: 150000,
        completedAt: new Date().toISOString()
      } : j));
      // Auto-open the just-completed job's report
      setSelectedJob(j => {
        if (j && j.id === newJob.id) {
          const completed = {
            ...j,
            status: 'completed',
            duration: '2m 34s',
            features: selectedFeatures.length || 0,
            rows: 150000,
            completedAt: new Date().toISOString()
          } as EDAJob;
          // Prepare to show report
          setShowConfig(false);
          setReportLoading(true);
          // Defer scroll until DOM updates with results
          requestAnimationFrame(() => {
            const el = document.getElementById('eda-results');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          });
          return completed;
        }
        return j;
      });
      toast({
        title: 'EDA Job Completed',
        description: 'Your analysis is ready for review.'
      });
    }, 3000);
  };

  const handleRowSelect = (job: EDAJob) => {
    if (job.status === 'completed') {
      setShowConfig(false);
      setReportLoading(true);
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
                Features to Include
              </Label>
              <div className="grid md:grid-cols-3 gap-4">
                {/* Available Features */}
                <div className="border rounded-md p-3 h-64 flex flex-col">
                  <div className="font-medium text-sm mb-2">Available Features</div>
                  <div className="flex-1 overflow-auto space-y-1 text-sm">
                    {availableFeatures.map(f => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => toggleAvailable(f)}
                        className={`w-full text-left px-2 py-1 rounded border text-xs transition-colors ${availableSelection.includes(f) ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                      >{f}</button>
                    ))}
                    {!availableFeatures.length && <div className="text-muted-foreground text-xs">None</div>}
                  </div>
                  <div className="pt-2 text-[10px] text-muted-foreground">Click to select</div>
                </div>
                {/* Action Buttons */}
                <div className="flex flex-col justify-center items-center gap-2">
                  <Button variant="secondary" size="sm" onClick={addSelected} disabled={!availableSelection.length}>Add →</Button>
                  <Button variant="secondary" size="sm" onClick={removeSelected} disabled={!chosenSelection.length}>← Remove</Button>
                  <Button variant="ghost" size="sm" onClick={clearAllFeatures} disabled={!selectedFeatures.length}>Clear All</Button>
                </div>
                {/* Selected Features */}
                <div className="border rounded-md p-3 h-64 flex flex-col">
                  <div className="font-medium text-sm mb-2">Selected Features ({selectedFeatures.length})</div>
                  <div className="flex-1 overflow-auto space-y-1 text-sm">
                    {selectedFeatures.map(f => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => toggleChosen(f)}
                        className={`w-full text-left px-2 py-1 rounded border text-xs transition-colors ${chosenSelection.includes(f) ? 'bg-destructive text-destructive-foreground' : 'hover:bg-muted'}`}
                      >{f}</button>
                    ))}
                    {!selectedFeatures.length && <div className="text-muted-foreground text-xs">None selected</div>}
                  </div>
                  <div className="pt-2 text-[10px] text-muted-foreground">Click to mark for removal</div>
                </div>
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
                disabled={isRunning || !selectedFeatures.length}
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
              <p className="text-xs text-muted-foreground mt-2">{!selectedFeatures.length ? 'Select at least one feature to enable the EDA job.' : 'EDA will analyze only the selected features.'}</p>
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
            {/* Embedded static HTML report */}
            <div className="mb-8 border border-border rounded-lg overflow-hidden relative">
              {reportLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/70 backdrop-blur-sm text-xs">
                  <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  Loading report...
                </div>
              )}
              <div className="px-4 py-2 bg-muted/40 border-b border-border flex items-center justify-between">
                <span className="text-sm font-medium">Interactive Report</span>
                <span className="text-xs text-muted-foreground">Loaded from /reports/pandas_profiling_report.html</span>
              </div>
              <iframe
                title="EDA Report"
                key={selectedJob.id}
                src="/reports/pandas_profiling_report.html"
                onLoad={() => setReportLoading(false)}
                className="w-full h-[700px] bg-background"
              />
            </div>
            <div className="flex gap-4 pt-2">
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