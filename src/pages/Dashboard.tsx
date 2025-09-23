import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { 
  BarChart3, 
  Beaker, 
  Activity, 
  TrendingUp, 
  Database,
  Play,
  CheckCircle,
  AlertCircle
} from "lucide-react";

export default function Dashboard() {
  const recentActivity = [
    { type: "EDA", name: "Customer Segmentation EDA", status: "completed", time: "2 hours ago" },
    { type: "Model", name: "Churn Prediction v2.1", status: "training", time: "5 hours ago" },
    { type: "Deploy", name: "Recommendation Engine", status: "deployed", time: "1 day ago" },
    { type: "Alert", name: "Model Drift Detected", status: "warning", time: "3 hours ago" },
  ];

  const stats = [
    { label: "Active Models", value: "12", change: "+2", icon: Database },
    { label: "Running Jobs", value: "4", change: "0", icon: Play },
    { label: "Success Rate", value: "94.2%", change: "+1.2%", icon: CheckCircle },
    { label: "Avg Response", value: "145ms", change: "-5ms", icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">ML Platform Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor your machine learning lifecycle and manage experiments
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="bg-card border-border hover:shadow-glow transition-smooth">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className={`text-xs ${
                    stat.change.startsWith('+') ? 'text-success' : 
                    stat.change.startsWith('-') && stat.label === 'Avg Response' ? 'text-success' :
                    'text-muted-foreground'
                  }`}>
                    {stat.change} from last week
                  </p>
                </div>
                <stat.icon className="h-8 w-8 text-primary opacity-70" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5 text-primary" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Start new ML workflows
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full justify-start" variant="secondary">
              <Link to="/eda">
                <BarChart3 className="h-4 w-4 mr-2" />
                New EDA Job
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="secondary">
              <Link to="/experiments">
                <Beaker className="h-4 w-4 mr-2" />
                Create Experiment
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="secondary">
              <Link to="/observability">
                <Activity className="h-4 w-4 mr-2" />
                View Monitoring
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2 bg-card border-border">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest updates from your ML pipeline
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {activity.status === "completed" && <CheckCircle className="h-4 w-4 text-success" />}
                      {activity.status === "training" && <Play className="h-4 w-4 text-primary animate-pulse" />}
                      {activity.status === "deployed" && <Database className="h-4 w-4 text-accent" />}
                      {activity.status === "warning" && <AlertCircle className="h-4 w-4 text-warning" />}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{activity.name}</p>
                      <p className="text-sm text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                  <Badge 
                    variant={
                      activity.status === "completed" ? "default" :
                      activity.status === "training" ? "secondary" :
                      activity.status === "deployed" ? "outline" :
                      "destructive"
                    }
                  >
                    {activity.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}