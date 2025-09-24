import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectModels from "./pages/ProjectModels";
import EDA from "./pages/EDA";
import Experiments from "./pages/Experiments";
import NewExperiment from "./pages/NewExperiment";
import ExperimentComparison from "./pages/ExperimentComparison";
import Observability from "./pages/Observability";
import TransformedTables from "./pages/TransformedTables";
import FeatureStore from "./pages/FeatureStore";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/transformed-tables" element={<TransformedTables />} />
            <Route path="/feature-views" element={<FeatureStore />} />
            <Route path="/projects/:projectId/models" element={<ProjectModels />} />
            <Route path="/eda" element={<EDA />} />
            <Route path="/experiments" element={<Experiments />} />
            <Route path="/experiments/new" element={<NewExperiment />} />
            {/* Summary alias route to avoid 404 after training redirect */}
            <Route path="/experiments/summary" element={<Experiments />} />
            <Route path="/experiments/compare" element={<ExperimentComparison />} />
            <Route path="/observability" element={<Observability />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
