import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function TransformedTables() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Transformed Tables</h1>
        <p className="text-muted-foreground text-sm">Browse and manage transformed / materialized data tables.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>Placeholder view</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">This section will list transformed tables with metadata, refresh status and lineage.</p>
        </CardContent>
      </Card>
    </div>
  );
}
