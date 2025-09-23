import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  TrendingDown,
  TrendingUp,
  Clock,
  Zap,
  Database,
  Network
} from "lucide-react";

export default function Observability() {
  const deployedModels = [
    {
      name: "Churn Prediction v2.1",
      status: "healthy",
      uptime: "99.97%",
      latency: "145ms",
      requests: "2.4M",
      accuracy: "94.2%",
      lastAlert: null
    },
    {
      name: "Recommendation Engine v1.3",
      status: "warning",
      uptime: "99.82%",
      latency: "289ms",
      requests: "8.1M",
      accuracy: "87.5%",
      lastAlert: "2 hours ago"
    },
    {
      name: "Fraud Detection v3.0",
      status: "healthy",
      uptime: "99.99%",
      latency: "78ms", 
      requests: "15.2M",
      accuracy: "96.1%",
      lastAlert: null
    }
  ];

  const alerts = [
    {
      model: "Recommendation Engine",
      type: "performance",
      severity: "warning",
      message: "Response time increased by 45% in last hour",
      time: "2 hours ago"
    },
    {
      model: "Churn Prediction",
      type: "data_drift",
      severity: "info",
      message: "Feature distribution shift detected in age column",
      time: "6 hours ago"
    },
    {
      model: "Fraud Detection",
      type: "accuracy",
      severity: "critical",
      message: "Model accuracy dropped below threshold (92%)",
      time: "1 day ago"
    }
  ];

  const metrics = [
    {
      label: "Total Requests",
      value: "25.7M",
      change: "+12.3%",
      trend: "up",
      icon: Activity
    },
    {
      label: "Avg Response Time", 
      value: "171ms",
      change: "+8ms",
      trend: "up",
      icon: Clock
    },
    {
      label: "Success Rate",
      value: "99.94%",
      change: "+0.02%", 
      trend: "up",
      icon: CheckCircle
    },
    {
      label: "Active Alerts",
      value: "3",
      change: "-2",
      trend: "down", 
      icon: AlertTriangle
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Model Observability</h1>
        <p className="text-muted-foreground">
          Monitor deployed models, track performance, and manage alerts
        </p>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <Card key={index} className="bg-card border-border hover:shadow-glow transition-smooth">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{metric.label}</p>
                  <p className="text-2xl font-bold text-foreground">{metric.value}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {metric.trend === "up" ? (
                      <TrendingUp className={`h-3 w-3 ${
                        metric.label === "Active Alerts" || metric.label === "Avg Response Time" 
                          ? "text-warning" : "text-success"
                      }`} />
                    ) : (
                      <TrendingDown className={`h-3 w-3 ${
                        metric.label === "Active Alerts" ? "text-success" : "text-warning"
                      }`} />
                    )}
                    <span className={`text-xs ${
                      (metric.trend === "up" && (metric.label === "Active Alerts" || metric.label === "Avg Response Time")) ||
                      (metric.trend === "down" && metric.label !== "Active Alerts")
                        ? "text-warning" : "text-success"
                    }`}>
                      {metric.change}
                    </span>
                  </div>
                </div>
                <metric.icon className="h-8 w-8 text-primary opacity-70" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deployed Models */}
        <Card className="lg:col-span-2 bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Deployed Models
            </CardTitle>
            <CardDescription>
              Monitor status and performance of production models
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {deployedModels.map((model, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg border border-border bg-muted/20 hover:bg-muted/30 transition-smooth"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-foreground">{model.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          variant={
                            model.status === "healthy" ? "default" :
                            model.status === "warning" ? "destructive" :
                            "secondary"
                          }
                        >
                          {model.status}
                        </Badge>
                        {model.lastAlert && (
                          <span className="text-xs text-muted-foreground">
                            Last alert: {model.lastAlert}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Details
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Uptime</p>
                      <p className="font-medium">{model.uptime}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Latency</p>
                      <p className="font-medium">{model.latency}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Requests</p>
                      <p className="font-medium">{model.requests}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Accuracy</p>
                      <p className="font-medium text-success">{model.accuracy}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Alerts & Actions */}
        <div className="space-y-6">
          {/* Recent Alerts */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="h-4 w-4" />
                Recent Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.map((alert, index) => (
                  <div key={index} className="p-3 rounded-lg bg-muted/20 border border-border/50">
                    <div className="flex items-start justify-between mb-2">
                      <Badge 
                        variant={
                          alert.severity === "critical" ? "destructive" :
                          alert.severity === "warning" ? "secondary" :
                          "outline"
                        }
                        className="text-xs"
                      >
                        {alert.severity}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{alert.time}</span>
                    </div>
                    <p className="text-sm font-medium text-foreground mb-1">{alert.model}</p>
                    <p className="text-xs text-muted-foreground">{alert.message}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="secondary" className="w-full justify-start" size="sm">
                <Zap className="h-4 w-4 mr-2" />
                Run Health Check
              </Button>
              <Button variant="secondary" className="w-full justify-start" size="sm">
                <Network className="h-4 w-4 mr-2" />
                Load Balancer Status
              </Button>
              <Button variant="secondary" className="w-full justify-start" size="sm">
                <Activity className="h-4 w-4 mr-2" />
                Performance Report
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}